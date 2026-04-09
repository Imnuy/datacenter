import OpenAI from "openai";
import { NextResponse } from "next/server";
import { spawnSync } from "child_process";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "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",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Datacenter HDC",
  }
});

const OR_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = process.env.DB_PORT ?? "3306";
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASS = process.env.DB_PASS ?? "rootpassword";
const DB_NAME = process.env.DB_NAME ?? "datacenter";
const DB_CLI_PATH = process.env.DB_CLI_PATH?.trim();

function runDbCli(sql: string) {
  const baseArgs = [
    "--engine", "mysql",
    "--host", DB_HOST,
    "--port", String(DB_PORT),
    "--user", DB_USER,
    "--password", DB_PASS,
    "--database", DB_NAME,
    "--exec", String(sql),
  ];

  if (process.platform === "win32") {
    const toPsLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
    const commandName = DB_CLI_PATH || "db-cli";
    const flagPairs = [
      ["--engine", "mysql"],
      ["--host", DB_HOST],
      ["--port", String(DB_PORT)],
      ["--user", DB_USER],
      ["--password", DB_PASS],
      ["--database", DB_NAME],
      ["--exec", String(sql)],
    ];
    const psCommand = `& ${toPsLiteral(commandName)} ${flagPairs
      .map(([flag, value]) => `${flag} ${toPsLiteral(value)}`)
      .join(" ")}`;

    const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", psCommand], {
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!result.error || !["ENOENT", "EINVAL"].includes((result.error as NodeJS.ErrnoException).code ?? "")) {
      return result;
    }
  }

  const candidates = [];
  if (DB_CLI_PATH) candidates.push({ cmd: DB_CLI_PATH, args: baseArgs });
  candidates.push({ cmd: "db-cli", args: baseArgs });
  candidates.push({ cmd: "db-cli.cmd", args: baseArgs });
  candidates.push({ cmd: "npx", args: ["-y", "db-cli", ...baseArgs] });

  let lastResult = null;
  for (const candidate of candidates) {
    const result = spawnSync(candidate.cmd, candidate.args, {
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) {
      const errCode = (result.error as NodeJS.ErrnoException).code;
      if (errCode === "ENOENT" || errCode === "EINVAL") {
        lastResult = result;
        continue;
      }
    }
    return result;
  }
  return lastResult;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = "คุณคือ Datacenter Data Engine. หน้าที่ของคุณคือดึงข้อมูลและแสดงผลลัพธ์ 'เท่านั้น'. \n" +
                        "Database Schema:\n" +
                        "- person (ประชากร): hospcode, cid, name, lname, sex (1=ชาย, 2=หญิง), birth, typearea (1,3=ในเขต)\n" +
                        "- c_hos (หน่วยงาน): hospcode, hosname, ampname\n" +
                        "- drug_opd (ยา): drugname, amount\n" +
                        "- diagnosis_opd (โรค): diagcode\n\n" +
                        "กฎสำคัญที่สุด (Critical Rules):\n" +
                        "1. หากผู้ใช้ถามข้อมูล SQL หรือประชากร ให้เรียกใช้ 'query_datacenter' ทันที\n" +
                        "2. แสดงผลลัพธ์ในรูปแบบ Markdown Table ทันทีที่ได้ข้อมูล\n" +
                        "3. หากต้องการสร้างกราฟ ให้สร้างผลลัพธ์เป็นตาราง และตามด้วย code block chart เช่น ```chart\n{\"type\":\"bar\",\"title\":\"TITLE\",\"data\":[{\"name\":\"X\",\"value\":10}]}```";

    const orMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content
      }))
    ];

    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "query_datacenter",
          description: "Gets population and health data from HDC. Takes 'sql' string.",
          parameters: {
            type: "object",
            properties: {
              sql: { type: "string" }
            },
            required: ["sql"]
          }
        }
      }
    ];

    let loop = 0;
    while (loop < 5) {
      const response = await openai.chat.completions.create({
        model: OR_MODEL,
        messages: orMessages,
        tools: tools,
        tool_choice: "auto"
      });

      const choice = response.choices?.[0];
      const message = choice?.message;

      if (!message) break;

      if (message.tool_calls && message.tool_calls.length > 0) {
        orMessages.push(message);
        
        for (const toolCall of message.tool_calls) {
          // Check for function type and tool name safely
          if ('function' in toolCall && toolCall.function?.name === "query_datacenter") {
            const args = JSON.parse(toolCall.function.arguments);
            let result = "";
            try {
              const dbCli = runDbCli(args.sql);
              if (dbCli?.status === 0) {
                result = String(dbCli.stdout ?? "").trim() || "No records.";
              } else {
                result = `Error: ${dbCli?.stderr || "Execution failed"}`;
              }
            } catch (e: any) {
              result = `Error: ${e.message}`;
            }
            
            orMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: "query_datacenter",
              content: result
            });
          }
        }
        loop++;
      } else {
        return NextResponse.json({ role: "assistant", content: message.content });
      }
    }

    const lastResponse = orMessages[orMessages.length - 1];
    return NextResponse.json({ role: "assistant", content: lastResponse.content || "No final response." });

  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
