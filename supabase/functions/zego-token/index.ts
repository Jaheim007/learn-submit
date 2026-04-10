import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Generate ZEGOCLOUD token
function generateToken04(
  appId: number,
  userId: string,
  serverSecret: string,
  effectiveTimeInSeconds: number
): string {
  const time = Math.floor(Date.now() / 1000);
  const payload = {
    app_id: appId,
    user_id: userId,
    nonce: Math.floor(Math.random() * 1000000000),
    ctime: time,
    expire: time + effectiveTimeInSeconds,
  };

  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  
  // Create signature
  const message = `${header}.${payloadStr}`;
  const key = encoder.encode(serverSecret);
  const data = encoder.encode(message);
  
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(cryptoKey => 
    crypto.subtle.sign('HMAC', cryptoKey, data)
  ).then(signature => {
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return `${message}.${signatureBase64}`;
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { userId, userName } = await req.json();

    const appId = parseInt(Deno.env.get('ZEGOCLOUD_APP_ID') || '0');
    const serverSecret = Deno.env.get('ZEGOCLOUD_SERVER_SECRET') || '';

    if (!appId || !serverSecret) {
      throw new Error('ZEGOCLOUD credentials not configured');
    }

    // Token valid for 24 hours
    const token = await generateToken04(appId, userId, serverSecret, 86400);

    console.log('Generated ZEGOCLOUD token for user:', userId);

    return new Response(
      JSON.stringify({ token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error generating ZEGOCLOUD token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
