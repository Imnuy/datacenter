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
      model: "gemini-2.5-flash",
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
            const dbCli = spawnSync(
              "db-cli",
              [
                "--host", DB_HOST,
                "--port", String(DB_PORT),
                "--user", DB_USER,
                "--password", DB_PASS,
                "--db", DB_NAME,
                "--exec", String(sql),
              ],
              { encoding: "utf8", timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
            );

            if (dbCli.error) {
              throw dbCli.error;
            }

            if (dbCli.status !== 0) {
              const errText = (dbCli.stderr || "").trim() || `db-cli exited with status ${dbCli.status}`;
              throw new Error(errText);
            }

            result = (dbCli.stdout || "").trim() || "No records.";
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
        model: "gemini-2.5-flash",
        config: { tools, systemInstruction },
        contents: contents,
      });
      loop++;
    }

    const final = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || response.text || "No response text generated.";
    return NextResponse.json({ role: "assistant", content: final });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
