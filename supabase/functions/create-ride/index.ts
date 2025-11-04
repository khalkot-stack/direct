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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Edge Function: Unauthorized - No user session or error getting user.', userError?.message)
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    console.log('Edge Function: User ID from JWT:', user.id);
    console.log('Edge Function: User app_metadata:', user.app_metadata);
    // Ensure user_type is correctly accessed from app_metadata
    const userType = user.app_metadata?.user_type || 'unknown';
    console.log('Edge Function: User type from app_metadata:', userType);

    const { passenger_id, pickup_location, destination, passengers_count } = await req.json()

    console.log('Edge Function: Payload received - passenger_id:', passenger_id, 'pickup_location:', pickup_location, 'destination:', destination, 'passengers_count:', passengers_count);

    if (!passenger_id || !pickup_location || !destination || !passengers_count) {
      console.error('Edge Function: Missing required fields in payload.');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only allow the passenger themselves or an admin to create a ride for that passenger_id
    if (user.id !== passenger_id && userType !== 'admin') {
        console.error('Edge Function: Forbidden - User not authorized to create rides for this passenger_id. User ID:', user.id, 'Payload Passenger ID:', passenger_id, 'User Type:', userType);
        return new Response('Forbidden: Not authorized to create rides for this user', { status: 403, headers: corsHeaders })
    }

    const { data, error } = await supabaseClient
      .from('rides')
      .insert({
        passenger_id,
        pickup_location,
        destination,
        passengers_count,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Edge Function: Error inserting ride:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Edge Function: Ride successfully inserted:', data);

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function: Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})