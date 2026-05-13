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
      "Talk like a knowledgeable friend in Hinglish. Friendly, helpful, not a financial advisor.",
      "Use simple Hinglish. Explain any finance terms in plain words.",
      "Format strictly with 4-5 bullet points using the \"•\" symbol, then one final Bottom line.",
      "Each bullet must be 1-2 lines long (not just one short line).",
      "Cover all of these in every response:",
      "1) Fund ki basic nature (kya karta hai ye fund)",
      "2) Risk level (kitna safe ya risky hai)",
      "3) Returns context (category ke hisaab se returns acche hain ya nahi)",
      "4) Kaun invest kare (suitable investor type)",
      "5) Bottom line verdict",
      "End with: \"Bottom line: ...\" as the final line.",
      "No paragraphs, no numbered lists, no **bold** markdown, no disclaimers.",
      "If the fund has red flags like negative returns, acknowledge them honestly in your response. Don't ignore problems — explain them in context.",
      "If data is missing, say that clearly but still give a best-effort answer.",
      "",
      "Example style (use your own content):",
      "• Ye fund equity mein invest karta hai — matlab stock market mein paisa lagata hai",
      "• Risk thoda high hai, lekin long term mein accha return deta hai",
      "• 3 saal ka return 17% hai — ye category average se better hai",
      "• 25-35 saal ke investors ke liye best hai jo 5+ saal ke liye invest kar sakte hain",
      "• Bottom line: Solid fund hai, long term ke liye rakh sakte ho",
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
