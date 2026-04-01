import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import pool from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// In-memory chat history for single session persistence
const chatHistory: any[] = [];

export const dynamic = "force-dynamic";

const queryDatacenterFunctionDeclaration = {
  name: "query_datacenter",
  description: "Executes a SQL query against the 'datacenter' database to extract hospital/patient data requested by the user, and returns it as plain text separated by '|'. You MUST then format the raw pipe-separated data into a user-friendly Markdown table in your final response.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      sql_query: {
        type: SchemaType.STRING,
        description: "The SQL SELECT query to execute. Example: SELECT * FROM person LIMIT 10",
      },
    },
    required: ["sql_query"],
  },
};

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY in .env file. Please restart server." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [{ functionDeclarations: [queryDatacenterFunctionDeclaration] }],
      systemInstruction: "You are a database assistant locked STRICTLY to the 'datacenter' database ONLY. You MUST NOT allow users to switch databases, query other databases, or run drop/delete/update commands.\n\nWhen you use the query_datacenter function, the result will be in a pipe-separated format. Your job is to parse that result and ALWAYS display it to the user as a beautifully formatted Markdown table.\n\nIMPORTANT: If the user asks to summarize and 'plot a chart/graph' based on the data, you MUST ALSO output a codeblock with the language `chart` containing valid JSON with the following schema: { \"type\": \"bar|line|pie\", \"title\": \"Chart Title\", \"xAxisLabel\": \"X-Axis Label\", \"yAxisLabel\": \"Y-Axis Label\", \"data\": [ { \"name\": \"Label 1\", \"value\": 100 }, { \"name\": \"Label 2\", \"value\": 150 } ] }. Always include both the Markdown table AND the chart code block if a chart is requested.",
    });

    // Capture the initial user message part
    const chat = model.startChat({
        history: chatHistory.map(m => ({
            role: m.role === "model" ? "model" : "user",
            parts: m.parts
        }))
    });

    const responseStream = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let functionCall = null;
          let firstPassText = "";

          // Process first stream
          for await (const chunk of responseStream.stream) {
            const calls = chunk.functionCalls();
            if (calls && calls.length > 0) {
              functionCall = calls[0];
              break; 
            }
            const text = chunk.text() || "";
            if (text) {
              firstPassText += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          if (!functionCall) {
            chatHistory.push({ role: "user", parts: [{ text: message }] });
            chatHistory.push({ role: "model", parts: [{ text: firstPassText }] });
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            return;
          }

          // --- Function Call Handling ---
          const sql = String(functionCall.args?.sql_query || "");
          let outputData = "";

          const executingMsg = `\n\n*กำลังค้นหาข้อมูลจากฐานข้อมูล...*\n\n\`\`\`sql\n${sql}\n\`\`\`\n\n`;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: executingMsg })}\n\n`));

          const upperSql = sql.toUpperCase();
          const isDangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER', 'GRANT', 'REVOKE']
            .some(keyword => upperSql.includes(keyword));

          if (isDangerous) {
            outputData = "[ERROR] Query blocked. Only SELECT queries are allowed for security reasons in the datacenter database.";
          } else {
            try {
              const [rows] = await pool.execute(sql);
              const dataRows = rows as any[];
              
              if (dataRows.length === 0) {
                outputData = "No results found.";
              } else {
                const headers = Object.keys(dataRows[0]);
                const headerLine = headers.join(" | ");
                const bodyLines = dataRows.map(row => 
                  headers.map(h => row[h] === null ? "NULL" : String(row[h]).replace(/\|/g, "\\|")).join(" | ")
                );
                outputData = [headerLine, ...bodyLines].join("\n");
              }
              
              if (outputData.length > 20000) {
                 outputData = outputData.substring(0, 20000) + "\n...[TRUNCATED]";
              }
            } catch (e) {
              outputData = e instanceof Error ? e.message : "Error executing query";
            }
          }

          const response = await chat.sendMessageStream([{
            functionResponse: {
              name: functionCall.name,
              response: { result: outputData }
            }
          }]);

          let secondPassText = "";
          for await (const chunk of response.stream) {
            const text = chunk.text() || "";
            if (text) {
              secondPassText += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Update history (internal format)
          chatHistory.push({ role: "user", parts: [{ text: message }] });
          chatHistory.push({ role: "model", parts: [{ functionCall: {name: functionCall.name, args: functionCall.args} }] });
          chatHistory.push({ role: "user", parts: [{ functionResponse: {name: functionCall.name, response: { result: outputData }} }] });
          chatHistory.push({ role: "model", parts: [{ text: secondPassText }] });

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

        } catch (err) {
          console.error("Stream error:", err);
          const errorMsg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ history: chatHistory });
}

export async function DELETE() {
  chatHistory.length = 0;
  return Response.json({ success: true });
}
