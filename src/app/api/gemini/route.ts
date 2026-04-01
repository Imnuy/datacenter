import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { execSync } from "child_process";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const tools = [
  {
    functionDeclarations: [
      {
        name: "query_datacenter",
        description: "Executes a SQL SELECT query against the 'datacenter' database and returns pipe-separated result.",
        parameters: {
          type: "OBJECT",
          properties: {
            sql: {
              type: "STRING",
              description: "The SQL SELECT statement. Example: SELECT * FROM person LIMIT 5"
            }
          },
          required: ["sql"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const contents: any[] = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const modelOptions = {
      model: "gemini-2.5-flash",
      tools: tools,
      systemInstruction: "คุณคือ Datacenter Data Engine. หน้าที่ของคุณคือดึงข้อมูลและแสดงผลลัพธ์ 'เท่านั้น'. \n" +
                        "กฎสำคัญที่สุด (Critical Rules):\n" +
                        "1. ห้ามมีคำเกริ่นนำ เช่น 'ได้ครับ', 'นี่คือข้อมูล...', 'ผมได้ดึงข้อมูลมาให้แล้ว'\n" +
                        "2. ห้ามมีคำอธิบายปิดท้าย เช่น 'หากต้องการข้อมูลอื่นแจ้งได้ครับ'\n" +
                        "3. แสดงผลลัพธ์ในรูปแบบ Markdown Table ทันทีที่ได้ข้อมูล\n" +
                        "4. หากไม่มีข้อมูล ให้ตอบสั้นๆ ว่า 'ไม่พบข้อมูล'\n" +
                        "5. หากเป็นคำถามที่ต้องใช้ฟังก์ชัน ให้เรียกใช้ query_datacenter ทันทีโดยไม่ต้องแจ้งเตือนผู้ใช้"
    };

    let response = await ai.models.generateContent({
      ...modelOptions,
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
          const sql = (p.functionCall.args as any)?.sql as string;
          const cmd = `db-cli --host localhost --port 3306 --user root --password rootpassword --db datacenter --exec "${sql.replace(/"/g, '\\"')}"`;
          result = execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }) || "No records.";
        } catch (e: any) {
          result = `Error: ${e.message}`;
        }

        responseParts.push({
          functionResponse: {
            name: p.functionCall.name,
            response: { result: result }
          }
        });
      }

      contents.push({ role: "model", parts: historyParts });
      contents.push({ role: "user", parts: responseParts });

      response = await ai.models.generateContent({
        ...modelOptions,
        contents: contents,
      });

      loop++;
    }

    // Attempt to get text, falling back to response.text
    const final = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "No data.";
    
    return NextResponse.json({
      role: "model",
      content: final
    });

  } catch (error: any) {
    console.error("[Gemini API Error]:", error);
    return NextResponse.json({ error: error.message || "Execution error" }, { status: 500 });
  }
}
