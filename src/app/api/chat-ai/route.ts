import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
                        "กฎสำคัญที่สุด (Critical Rules):\n" +
                        "1. หากผู้ใช้ถามข้อมูล SQL หรือประชากร ให้เรียกใช้ 'query_datacenter' ทันที\n" +
                        "2. แสดงผลลัพธ์ในรูปแบบ Markdown Table ทันทีที่ได้ข้อมูล\n" +
                        "3. หากต้องการสร้างกราฟ ให้สร้างผลลัพธ์เป็นตาราง และตามด้วย code block chart เช่น ```chart\n{\"type\":\"bar\",\"title\":\"TITLE\",\"data\":[{\"name\":\"X\",\"value\":10}]}```" 
        }] 
    };

    let response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      tools: tools,
      systemInstruction: systemInstruction,
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
            const { execSync } = require('child_process');
            const sanitizedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
            const cmd = `db-cli --host localhost --port 3306 --user root --password rootpassword --db datacenter --exec "${sanitizedSql}"`;
            result = execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }) || "No records.";
          }
        } catch (e: any) { result = `Error: ${e.message}`; }

        responseParts.push({ functionResponse: { name: p.functionCall.name, response: { result: result } } });
      }

      contents.push({ role: "model", parts: historyParts });
      contents.push({ role: "user", parts: responseParts });

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        tools: tools,
        systemInstruction: systemInstruction,
        contents: contents,
      });
      loop++;
    }

    const final = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "No data.";
    return NextResponse.json({ role: "assistant", content: final });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
