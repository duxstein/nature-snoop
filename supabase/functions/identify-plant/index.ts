import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    console.log('Processing image URL:', imageUrl)
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })

    // Fetch image data
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const imageData = await response.arrayBuffer()
    console.log('Image data fetched successfully')
    
    // Convert array buffer to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)))
    
    // Prepare image for Gemini
    const imageParts = [{
      inlineData: {
        data: base64,
        mimeType: "image/jpeg"
      }
    }]

    console.log('Sending request to Gemini API')
    // Generate content
    const result = await model.generateContent([
      "Identify this plant and provide the following information in JSON format: " +
      "1. Scientific name " +
      "2. Common name " +
      "3. Brief description " +
      "4. Care instructions " +
      "5. Confidence level (high, medium, or low) based on image quality",
      ...imageParts
    ])
    const response_text = result.response.text()
    console.log('Received response from Gemini API')
    
    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = response_text.match(/```json\n?(.*)\n?```/s) || response_text.match(/{[\s\S]*}/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response_text
      parsedResponse = JSON.parse(jsonStr)
    } catch (e) {
      console.error("Failed to parse JSON response:", e)
      parsedResponse = {
        scientific_name: "Unknown",
        common_name: "Unknown",
        description: response_text,
        care_instructions: "Not available",
        confidence_level: "low"
      }
    }

    // Store the identification in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('plant_identifications')
      .insert({
        image_url: imageUrl,
        identified_name: parsedResponse.common_name,
        confidence_score: parsedResponse.confidence_level === 'high' ? 0.9 : 
                         parsedResponse.confidence_level === 'medium' ? 0.6 : 0.3,
        additional_info: parsedResponse,
        user_id: req.headers.get('x-user-id')
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})