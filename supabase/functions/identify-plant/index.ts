
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

// Helper function to try model with retry logic and model fallback
async function tryWithRetries(genAI: any, prompt: string, imageData: any, maxRetries = 7) {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro-vision'];
  const maxRetryTime = 60000; // Maximum 60 seconds of total retry time
  const startTime = Date.now();
  let lastError;

  for (const modelName of models) {
    console.log(`Starting attempts with model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let i = 0; i < maxRetries; i++) {
      // Check if we've exceeded max retry time
      if (Date.now() - startTime > maxRetryTime) {
        console.log('Maximum retry time exceeded');
        break;
      }

      try {
        console.log(`Attempt ${i + 1}/${maxRetries} with ${modelName}`);
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData
            }
          }
        ]);

        if (!result || !result.response) {
          throw new Error('Empty response from model');
        }

        console.log(`Successfully generated content with ${modelName} on attempt ${i + 1}`);
        return result;
      } catch (error) {
        console.log(`Attempt ${i + 1} with ${modelName} failed:`, error.message);
        lastError = error;
        
        if (error.message.includes('503') || error.message.includes('overloaded')) {
          const baseDelay = 5000; // Start with 5s base delay
          const waitTime = baseDelay * Math.pow(1.5, i); // Less aggressive exponential backoff
          const jitter = Math.random() * 2000; // Add random jitter up to 2s
          const totalWaitTime = Math.min(waitTime + jitter, 15000); // Cap at 15s
          
          console.log(`Model ${modelName} overloaded. Waiting ${totalWaitTime}ms before next attempt`);
          await delay(totalWaitTime);
          continue;
        }
        
        if (error.message.includes('404')) {
          console.log(`Model ${modelName} not available, trying next model`);
          break; // Try next model
        }
        
        // For other errors, try the next model
        console.log(`Unexpected error with ${modelName}, trying next model`);
        break;
      }
    }
  }

  // If all retries with all models failed, throw a user-friendly error
  console.error('All retry attempts with all models failed:', lastError);
  throw new Error(`The image identification service is currently experiencing unusually high traffic. Please wait a minute or two and try again. If the problem persists, you might want to try with a different image.`);
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

