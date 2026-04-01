import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { spawnSync } from "child_process";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = process.env.DB_PORT ?? "3306";
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASS = process.env.DB_PASS ?? "rootpassword";
const DB_NAME = process.env.DB_NAME ?? "datacenter";
const DB_CLI_PATH = process.env.DB_CLI_PATH?.trim();
const GEMINI_MODEL = "gemini-2.5-flash";

type ParsedModelError = {
  status?: number;
  code?: string;
  message: string;
  retryAfterSeconds?: number;
};

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

  const candidates: Array<{ cmd: string; args: string[] }> = [];

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

    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        psCommand,
      ],
      {
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (!result.error || !["ENOENT", "EINVAL"].includes((result.error as NodeJS.ErrnoException).code ?? "")) {
      return result;
    }
  }

  if (DB_CLI_PATH) {
    candidates.push({ cmd: DB_CLI_PATH, args: baseArgs });
  }

  candidates.push({ cmd: "db-cli", args: baseArgs });
  candidates.push({ cmd: "db-cli.cmd", args: baseArgs });
  candidates.push({ cmd: "npx", args: ["-y", "db-cli", ...baseArgs] });
  candidates.push({ cmd: "npx.cmd", args: ["-y", "db-cli", ...baseArgs] });

  let lastResult: ReturnType<typeof spawnSync> | null = null;

  for (const candidate of candidates) {
    const result = spawnSync(candidate.cmd, candidate.args, {
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Try next candidate if command is not found or cannot be executed directly in this environment.
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

function parseModelError(error: unknown): ParsedModelError {
  const fallback: ParsedModelError = {
    message: error instanceof Error ? error.message : "Unknown AI error",
  };

  const rawMessage = error instanceof Error ? error.message : "";
  if (!rawMessage) return fallback;

  try {
    const parsed = JSON.parse(rawMessage);
    const errorBody = parsed?.error;
    if (!errorBody) return fallback;

    const retryDelay = errorBody.details?.find?.((detail: { "@type"?: string; retryDelay?: string }) =>
      detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    )?.retryDelay;

    const retryAfterSeconds = retryDelay ? Number.parseInt(String(retryDelay), 10) : undefined;

    return {
      status: errorBody.code,
      code: errorBody.status,
      message: errorBody.message ?? fallback.message,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    };
  } catch {
    return fallback;
  }
}

function buildClientErrorMessage(parsedError: ParsedModelError) {
  if (parsedError.code === "RESOURCE_EXHAUSTED" || parsedError.status === 429) {
    const retryText = parsedError.retryAfterSeconds
      ? ` กรุณาลองใหม่อีกครั้งในประมาณ ${parsedError.retryAfterSeconds} วินาที`
      : "";

    return `ขณะนี้โควตาการใช้งาน AI สำหรับ ${GEMINI_MODEL} เต็มชั่วคราว${retryText}`;
  }

  return "ไม่สามารถเชื่อมต่อบริการ AI ได้ในขณะนี้";
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const contents: any[] = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const tools: any[] = [
      {
        functionDeclarations: [
          {
            name: "query_datacenter",
            description: "Gets population and health data from HDC. Takes 'sql' string.",
            parameters: {
              type: "OBJECT",
              properties: {
                sql: { type: "STRING" }
              },
              required: ["sql"]
            }
          }
        ]
      }
    ];

    const systemInstruction: any = { 
        parts: [{ text: "คุณคือ Datacenter Data Engine. หน้าที่ของคุณคือดึงข้อมูลและแสดงผลลัพธ์ 'เท่านั้น'. \n" +
                        "Database Schema:\n" +
                        "- person (ประชากร): hospcode, cid, name, lname, sex (1=ชาย, 2=หญิง), birth, typearea (1,3=ในเขต)\n" +
                        "- c_hos (หน่วยงาน): hospcode, hosname, ampname\n" +
                        "- drug_opd (ยา): drugname, amount\n" +
                        "- diagnosis_opd (โรค): diagcode\n\n" +
                        "กฎสำคัญที่สุด (Critical Rules):\n" +
                        "1. หากผู้ใช้ถามข้อมูล SQL หรือประชากร ให้เรียกใช้ 'query_datacenter' ทันที\n" +
                        "2. แสดงผลลัพธ์ในรูปแบบ Markdown Table ทันทีที่ได้ข้อมูล\n" +
                        "3. หากต้องการสร้างกราฟ ให้สร้างผลลัพธ์เป็นตาราง และตามด้วย code block chart เช่น ```chart\n{\"type\":\"bar\",\"title\":\"TITLE\",\"data\":[{\"name\":\"X\",\"value\":10}]}```" 
        }] 
    };

    let response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: { tools, systemInstruction },
      contents: contents,
    });

    let loop = 0;
    while (loop < 5) {
      if (!response.candidates?.[0]) break;
      const parts = response.candidates[0].content?.parts || [];
      const calls = parts.filter(p => p.functionCall);
      if (calls.length === 0) break;

      const responseParts = [];
      const historyParts = [];

      for (const p of calls) {
        if (!p.functionCall) continue;
        historyParts.push(p);

        let result = "";
        try {
          const sql = (p.functionCall.args as any)?.sql;
          if (sql) {
            const dbCli = runDbCli(String(sql));

            if (!dbCli) {
              throw new Error("db-cli not executed");
            }

            if (dbCli.error) {
              throw dbCli.error;
            }

            if (dbCli.status !== 0) {
              const errText = String(dbCli.stderr ?? "").trim() || `db-cli exited with status ${dbCli.status}`;
              throw new Error(errText);
            }

            result = String(dbCli.stdout ?? "").trim() || "No records.";
          }
        } catch (e: any) { 
          result = `Error: ${e.message}`; 
          console.error("DB CLI Error:", e.message);
        }

        responseParts.push({ functionResponse: { name: p.functionCall.name, response: { result: result } } });
      }

      contents.push({ role: "model", parts: historyParts });
      contents.push({ role: "user", parts: responseParts });

      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        config: { tools, systemInstruction },
        contents: contents,
      });
      loop++;
    }

    const final = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || response.text || "No response text generated.";
    return NextResponse.json({ role: "assistant", content: final });
  } catch (error: unknown) {
    const parsedError = parseModelError(error);
    const clientMessage = buildClientErrorMessage(parsedError);
    const status = parsedError.status && parsedError.status >= 400 ? parsedError.status : 500;

    console.error("API Route Error:", parsedError.message);

    return NextResponse.json(
      {
        error: clientMessage,
        details: parsedError.message,
        code: parsedError.code,
        retryAfterSeconds: parsedError.retryAfterSeconds,
      },
      { status }
    );
  }
}
