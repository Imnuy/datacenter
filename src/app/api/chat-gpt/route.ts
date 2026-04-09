import OpenAI from 'openai'
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions'
import { NextResponse } from 'next/server'
import { spawnSync } from 'child_process'

type ClientMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

type ToolCallArgs = {
  sql?: string
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
const DB_HOST = process.env.DB_HOST ?? 'localhost'
const DB_PORT = process.env.DB_PORT ?? '3306'
const DB_USER = process.env.DB_USER ?? 'root'
const DB_PASS = process.env.DB_PASS ?? 'rootpassword'
const DB_NAME = process.env.DB_NAME ?? 'datacenter'
const DB_CLI_PATH = process.env.DB_CLI_PATH?.trim()

function isSafeSelect(sql: string) {
  const trimmed = sql.trim()
  if (!trimmed || trimmed.length > 10000) return false
  if (trimmed.includes(';')) return false
  if (trimmed.includes('--') || trimmed.includes('/*') || trimmed.includes('*/') || trimmed.includes('#')) return false

  const lower = trimmed.toLowerCase()
  if (!lower.startsWith('select') && !lower.startsWith('with')) return false

  const blockedKeywords = [
    'insert',
    'update',
    'delete',
    'drop',
    'alter',
    'truncate',
    'create',
    'replace',
    'grant',
    'revoke',
    'call',
    'do',
    'handler',
    'load_file',
    'outfile',
    'dumpfile',
    'sleep',
    'benchmark',
    'information_schema',
    'performance_schema',
    'mysql',
  ]

  return !blockedKeywords.some(keyword => lower.includes(keyword))
}

function runDbCli(sql: string) {
  const baseArgs = [
    '--engine', 'mysql',
    '--host', DB_HOST,
    '--port', String(DB_PORT),
    '--user', DB_USER,
    '--password', DB_PASS,
    '--database', DB_NAME,
    '--exec', String(sql),
  ]

  const candidates: Array<{ cmd: string; args: string[] }> = []

  if (process.platform === 'win32') {
    const toPsLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`
    const commandName = DB_CLI_PATH || 'db-cli'
    const flagPairs = [
      ['--engine', 'mysql'],
      ['--host', DB_HOST],
      ['--port', String(DB_PORT)],
      ['--user', DB_USER],
      ['--password', DB_PASS],
      ['--database', DB_NAME],
      ['--exec', String(sql)],
    ]
    const psCommand = `& ${toPsLiteral(commandName)} ${flagPairs
      .map(([flag, value]) => `${flag} ${toPsLiteral(value)}`)
      .join(' ')}`

    const result = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        psCommand,
      ],
      {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      }
    )

    if (!result.error || !['ENOENT', 'EINVAL'].includes((result.error as NodeJS.ErrnoException).code ?? '')) {
      return result
    }
  }

  if (DB_CLI_PATH) {
    candidates.push({ cmd: DB_CLI_PATH, args: baseArgs })
  }

  candidates.push({ cmd: 'db-cli', args: baseArgs })
  candidates.push({ cmd: 'db-cli.cmd', args: baseArgs })
  candidates.push({ cmd: 'npx', args: ['-y', 'db-cli', ...baseArgs] })
  candidates.push({ cmd: 'npx.cmd', args: ['-y', 'db-cli', ...baseArgs] })

  let lastResult: ReturnType<typeof spawnSync> | null = null

  for (const candidate of candidates) {
    const result = spawnSync(candidate.cmd, candidate.args, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    })

    if (result.error) {
      const errCode = (result.error as NodeJS.ErrnoException).code
      if (errCode === 'ENOENT' || errCode === 'EINVAL') {
        lastResult = result
        continue
      }
    }

    return result
  }

  return lastResult
}

export async function POST(req: Request) {
  let requestMessages: ClientMessage[] = []

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY in .env.local' }, { status: 500 })
    }

    const body = await req.json().catch(() => null) as { messages?: ClientMessage[] } | null
    requestMessages = Array.isArray(body?.messages) ? body.messages : []

    const conversation: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: [
          'You are Datacenter Data Engine.',
          'Answer in Thai.',
          'Use the query_datacenter tool only when the user asks for HDC data.',
          'Always present retrieved data as a Markdown table.',
          'If the user asks for a chart, also include a ```chart code block with JSON: { "type": "bar|line|pie", "title": "...", "data": [{ "name": "...", "value": 123 }] }.',
          'If there is no data, answer briefly in Thai.',
        ].join(' '),
      },
      ...requestMessages.map(message => ({
        role: message.role,
        content: message.content,
      })) as ChatCompletionMessageParam[],
    ]

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'query_datacenter',
          description: 'Gets population and health data from HDC. Takes a SQL string in the sql field.',
          parameters: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
              },
            },
            required: ['sql'],
            additionalProperties: false,
          },
        },
      },
    ]

    let response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: conversation,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
    })

    for (let loop = 0; loop < 5; loop++) {
      const assistant = response.choices[0]?.message
      const toolCalls = assistant?.tool_calls ?? []

      if (!assistant || toolCalls.length === 0) {
        const finalContent = assistant?.content?.trim() || response.choices[0]?.message?.content?.trim() || 'No response text generated.'
        return NextResponse.json({ role: 'assistant', content: finalContent })
      }

      conversation.push({
        role: 'assistant',
        content: assistant.content ?? '',
        tool_calls: toolCalls.map(call => {
          const functionInfo = 'function' in call ? call.function : { name: '', arguments: '' };
          return {
            id: call.id,
            type: 'function',
            function: {
              name: functionInfo.name,
              arguments: functionInfo.arguments,
            },
          };
        }),
      } as ChatCompletionMessageParam)

      for (const call of toolCalls) {
        let result = ''
        try {
          const functionArgs = 'function' in call ? call.function.arguments : '{}';
          const parsedArgs = JSON.parse(functionArgs || '{}') as ToolCallArgs
          const sql = String(parsedArgs.sql ?? '')
          if (!sql) {
            throw new Error('Missing sql')
          }
          if (!isSafeSelect(sql)) {
            throw new Error('Only single SELECT statements are allowed')
          }

          const dbCli = runDbCli(sql)
          if (!dbCli) {
            throw new Error('db-cli not executed')
          }
          if (dbCli.error) {
            throw dbCli.error
          }
          if (dbCli.status !== 0) {
            const errText = String(dbCli.stderr ?? '').trim() || `db-cli exited with status ${dbCli.status}`
            throw new Error(errText)
          }

          result = String(dbCli.stdout ?? '').trim() || 'No records.'
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          result = `Error: ${message}`
          console.error('DB CLI Error:', message)
        }

        conversation.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        } as ChatCompletionToolMessageParam)
      }

      response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: conversation,
        tools,
        tool_choice: 'auto',
        temperature: 0.2,
      })
    }

    const fallbackContent = response.choices[0]?.message?.content?.trim() || 'No response text generated.'
    return NextResponse.json({ role: 'assistant', content: fallbackContent })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      try {
        const fallbackRes = await fetch(new URL('/api/chat-ai', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: requestMessages }),
        })
        const fallbackJson = await fallbackRes.json()
        if (fallbackRes.ok) {
          return NextResponse.json(fallbackJson, { status: fallbackRes.status })
        }
        if (fallbackRes.status === 429 || String(fallbackJson?.error ?? '').toLowerCase().includes('quota')) {
          return NextResponse.json(
            {
              error: 'ขณะนี้ทั้ง GPT และ Gemini มีโควตาการใช้งานเต็มชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง',
              details: {
                openai: message,
                fallback: fallbackJson?.error ?? 'Fallback provider unavailable',
              },
            },
            { status: 503 }
          )
        }
        return NextResponse.json(fallbackJson, { status: fallbackRes.status })
      } catch (fallbackError: unknown) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error('Fallback API Error:', fallbackMessage)
      }
    }

    console.error('API Route Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
