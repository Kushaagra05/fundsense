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
      "Use simple English only. Keep it easy to understand.",
      "Each bullet and the Bottom line should be clear and make sense.",
      "Be polite and respectful; avoid slang words.",
      "Format strictly as max 3 bullet points using the \"•\" symbol.",
      "Each bullet must be on its own new line, one line only, very short (under ~12 words).",
      "After bullets, add one final line: \"Bottom line: ...\" in simple English (one line).",
      "Output must be exactly 2-4 lines total: 1-3 bullets + Bottom line.",
      "No paragraphs, no long explanations, no numbered lists, no **bold** markdown.",
      "No disclaimers like \"past performance is not indicative...\".",
      "Assume the user is a first-time investor who knows nothing.",
      "Use the provided fund context to give actionable guidance. If data is missing, say so and still provide a best-effort answer.",
      "",
      "Example format (use your own content):",
      "• 1-year returns are slightly weak",
      "• Fund could be good for long-term investing",
      "• Risk level is medium, acceptable for beginners",
      "Bottom line: This fund is suitable if you plan to hold for 3-5 years",
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
