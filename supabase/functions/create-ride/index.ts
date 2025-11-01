import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { passenger_id, pickup_location, destination, passengers_count } = await req.json()

    if (!passenger_id || !pickup_location || !destination || !passengers_count) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ensure the user making the request is authorized to create a ride for this passenger_id
    // For simplicity, let's assume the authenticated user is the passenger or an admin
    // A more robust check would be needed here.
    if (user.id !== passenger_id && user.app_metadata.user_type !== 'admin') {
        return new Response('Forbidden: Not authorized to create rides for this user', { status: 403, headers: corsHeaders })
    }

    const { data, error } = await supabaseClient
      .from('rides')
      .insert({
        passenger_id,
        pickup_location,
        destination,
        passengers_count,
        status: 'pending', // Default status for automatically inserted rides
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting ride:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})