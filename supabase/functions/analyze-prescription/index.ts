import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  prescription_id: string;
  image_url: string;
}

interface Medicine {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks = [];

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  return btoa(chunks.join(''));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prescription_id, image_url }: RequestBody = await req.json();

    if (!prescription_id || !image_url) {
      return new Response(
        JSON.stringify({ error: "Missing prescription_id or image_url" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Fetching image from:', image_url);
    const imageResponse = await fetch(image_url);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength, 'bytes');
    console.log('Content type:', contentType);

    if (imageBuffer.byteLength > 20 * 1024 * 1024) {
      throw new Error('Image too large. Please use an image smaller than 20MB.');
    }

    const base64Image = arrayBufferToBase64(imageBuffer);
    console.log('Base64 length:', base64Image.length);

    const openaiPayload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this prescription image and extract all medicine information. For each medicine, provide:
1. Medicine name (exact name as written)
2. Dosage (e.g., 500mg, 10ml, 1 tablet)
3. Frequency (e.g., "twice daily", "every 8 hours", "3 times daily", "once daily")
4. Duration in days (if specified, otherwise leave blank)
5. Special instructions (e.g., "take with food", "before bed", "after meals")

IMPORTANT: Return ONLY a valid JSON array with this exact format, no markdown, no code blocks, no explanations:
[
  {
    "medicine_name": "Medicine Name",
    "dosage": "500mg",
    "frequency": "twice daily",
    "duration_days": 7,
    "instructions": "Take with food"
  }
]

If you cannot read the prescription clearly or find no medicines, return an empty array: []

Read the prescription carefully and extract ALL medicines listed.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    };

    console.log('Calling OpenAI API...');
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(openaiPayload),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error response:", errorText);
      console.error("OpenAI API status:", openaiResponse.status);
      throw new Error(`OpenAI API returned ${openaiResponse.status}: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received');

    if (openaiData.error) {
      console.error('OpenAI API error in response:', openaiData.error);
      throw new Error(`OpenAI API error: ${openaiData.error.message || 'Unknown error'}`);
    }

    let extractedText = openaiData.choices?.[0]?.message?.content || "[]";
    console.log('Extracted text:', extractedText.substring(0, 200));

    extractedText = extractedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let extractedMedicines: Medicine[] = [];
    try {
      extractedMedicines = JSON.parse(extractedText);
      if (!Array.isArray(extractedMedicines)) {
        extractedMedicines = [];
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", extractedText);
      extractedMedicines = [];
    }

    if (extractedMedicines.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No medicines found in the prescription. Please ensure the image is clear and contains a valid prescription.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const medicineInserts = extractedMedicines.map((med) => {
      const startDate = today;
      const endDate = med.duration_days
        ? new Date(Date.now() + med.duration_days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      return {
        user_id: user.id,
        prescription_id: prescription_id,
        medicine_name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration_days: med.duration_days || 30,
        start_date: startDate,
        end_date: endDate,
        instructions: med.instructions || "",
        active: true,
      };
    });

    const { data: insertedMedicines, error: insertError } = await supabase
      .from("user_medicines")
      .insert(medicineInserts)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    await supabase
      .from("prescriptions")
      .update({
        processed: true,
        extracted_data: { medicines: extractedMedicines },
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescription_id);

    console.log('Processing complete, extracted', extractedMedicines.length, 'medicines');

    return new Response(
      JSON.stringify({
        success: true,
        medicines: extractedMedicines,
        message: `Successfully extracted ${extractedMedicines.length} medicine(s) from prescription`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing prescription:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process prescription",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
