import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  messages: ChatMessage[];
  fundContext?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { messages = [], fundContext = "" } = body;

    const systemPrompt = [
      "Talk like a smart friend who knows finance, not a financial advisor.",
      "Use simple Hindi-English (Hinglish) friendly tone.",
      "Keep answers short - max 4-5 lines.",
      "No numbered lists, no **bold** markdown.",
      "No disclaimers like \"past performance is not indicative...\".",
      "Give a clear verdict at the end like \"Bottom line: this fund is good for you if you can stay invested for 5+ years\".",
      "Assume the user is a first-time investor who knows nothing.",
      "Use the provided fund context to give actionable guidance. If data is missing, say so and still provide a best-effort answer.",
      "",
      "Fund context:",
      fundContext,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OpenAI API error:", errorText);
      return NextResponse.json({ reply: "" }, { status: 500 });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.log("Fund chat route error:", error);
    return NextResponse.json({ reply: "" }, { status: 500 });
  }
}
