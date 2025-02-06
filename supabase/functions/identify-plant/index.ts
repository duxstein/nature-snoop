
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to try model with retry logic
async function tryWithRetries(genAI: any, prompt: string, imageData: any, retries = 5) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} with gemini-1.5-flash`);
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData
          }
        }
      ]);
      console.log('Successfully generated content on attempt', i + 1);
      return result;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      lastError = error;
      
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        const waitTime = 2000 * Math.pow(2, i); // Start with 2s and increase exponentially
        console.log(`Waiting ${waitTime}ms before next attempt`);
        await delay(waitTime);
        continue;
      }
      break; // If it's not a 503/overload error, stop retrying
    }
  }

  // If all retries failed, throw a more informative error
  console.error('All retry attempts failed:', lastError);
  throw new Error(`Service temporarily unavailable after ${retries} attempts. Please try again in a few minutes.`);
}

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

    const prompt = `Analyze this plant image and provide the following information in a clear, structured format:
    1. Common name
    2. Scientific name
    3. Brief description
    4. Care instructions including light, water, soil, temperature, humidity, fertilizer, and propagation
    5. Confidence level (High/Medium/Low)

    Respond with only the requested information in this exact JSON format:
    {
      "common_name": "string",
      "scientific_name": "string",
      "description": "string",
      "care_instructions": {
        "light": "string",
        "water": "string",
        "soil": "string",
        "temperature": "string",
        "humidity": "string",
        "fertilizer": "string",
        "propagation": "string"
      },
      "confidence_level": "string"
    }`;

    console.log('Sending request to Gemini API with retry logic');
    const result = await tryWithRetries(genAI, prompt, base64Image);

    const response = result.response;
    const text = response.text();
    console.log('Raw Gemini response:', text);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }
    
    // Parse the JSON response
    const plantData = JSON.parse(jsonMatch[0]);
    console.log('Successfully parsed plant data:', plantData);

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
