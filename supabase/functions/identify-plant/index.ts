import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Create clean URL by removing any trailing colons or slashes
    const cleanImageUrl = imageUrl.replace(/[:\/]+$/, '');
    
    // Fetch the image data
    const imageResponse = await fetch(cleanImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageData = await imageResponse.blob();

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision-latest" });

    // Convert blob to base64
    const imageBytes = await imageData.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

    const prompt = `Analyze this plant image and provide:
    1. Common name
    2. Scientific name
    3. Brief description
    4. Detailed care instructions including:
       - Light requirements
       - Watering needs
       - Soil preferences
       - Temperature range
       - Humidity requirements
       - Fertilization schedule
       - Propagation methods
    5. Confidence level of identification (High/Medium/Low)
    
    Format the response as a JSON object with these exact keys:
    {
      "common_name": "",
      "scientific_name": "",
      "description": "",
      "care_instructions": {
        "light": "",
        "water": "",
        "soil": "",
        "temperature": "",
        "humidity": "",
        "fertilizer": "",
        "propagation": ""
      },
      "confidence_level": ""
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const plantData = JSON.parse(text);

    // Store the result in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { error: dbError } = await supabase
      .from('plant_identifications')
      .insert({
        user_id: req.headers.get('x-user-id'),
        image_url: cleanImageUrl,
        identified_name: plantData.common_name,
        confidence_score: plantData.confidence_level === 'High' ? 0.9 : 
                         plantData.confidence_level === 'Medium' ? 0.6 : 0.3,
        additional_info: plantData
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store identification result');
    }

    return new Response(JSON.stringify({ ...plantData, image_url: cleanImageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});