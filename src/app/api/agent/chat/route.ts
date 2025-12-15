import { NextRequest, NextResponse } from "next/server";

/**
 * Agent Chat API Route
 *
 * This is a simple proxy to OpenAI's Chat Completions API.
 * It injects the OpenAI API key from the backend environment.
 * All tool execution happens on the frontend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, tools, model = "gpt-4" } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Forward request to OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: tools || undefined,
        tool_choice: tools && tools.length > 0 ? "auto" : undefined,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: "OpenAI API error", details: errorText },
        { status: openaiResponse.status },
      );
    }

    const data = await openaiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
