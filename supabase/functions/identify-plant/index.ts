import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received request with imageUrl:', imageUrl);
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Create clean URL by removing any trailing colons or slashes
    const cleanImageUrl = imageUrl.replace(/[:\/]+$/, '');
    console.log('Cleaned image URL:', cleanImageUrl);
    
    // Fetch the image data
    const imageResponse = await fetch(cleanImageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.statusText);
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Convert the image to base64 in chunks to prevent stack overflow
    const imageData = await imageResponse.blob();
    const chunks = [];
    const reader = new FileReader();
    
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(imageData);
    const base64Image = await base64Promise;
    console.log('Successfully converted image to base64');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated to use the new model

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

    console.log('Sending request to Gemini API');
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
    console.log('Received response from Gemini API');
    
    // Parse the JSON response
    const plantData = JSON.parse(text);
    console.log('Successfully parsed plant data');

    // Store the result in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const userId = req.headers.get('x-user-id');
    console.log('User ID from request:', userId);

    const { error: dbError } = await supabase
      .from('plant_identifications')
      .insert({
        user_id: userId,
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

    console.log('Successfully stored plant identification in database');

    return new Response(
      JSON.stringify({ ...plantData, image_url: cleanImageUrl }), 
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in identify-plant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});