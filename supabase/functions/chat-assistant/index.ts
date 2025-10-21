import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, chatHistory } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          message: "I can help you with medicine-related questions. However, please consult your healthcare provider for specific medical advice.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You are a helpful medical assistant for a medicine reminder app called Fakrny. You help users with information about their medications, dosages, side effects, drug interactions, and general health advice. Always remind users to consult their healthcare provider for serious medical concerns. Be concise, clear, and friendly. Focus on medication management and adherence.",
      },
      ...(chatHistory || []).map((msg: { role: string; message: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.message,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Failed to get response from AI",
          message: "I'm having trouble connecting right now. Please try again later or consult your healthcare provider for medical advice.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in chat-assistant:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "I'm having trouble processing your request. Please try again later.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
