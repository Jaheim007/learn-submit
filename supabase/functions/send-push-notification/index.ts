import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_ids?: string[];
  notification_id?: string;
  token?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Generate OAuth2 access token for FCM v1 API
async function getAccessToken(): Promise<string> {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase service account credentials');
  }

  // Create JWT for Google OAuth2
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Sign with private key
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureInput);
  
  // Import private key for signing
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.substring(pemHeader.length, privateKey.length - pemFooter.length).replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Token exchange failed:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send push notification using FCM v1 API
async function sendFCMNotification(token: string, title: string, body: string, data?: Record<string, any>): Promise<any> {
  const accessToken = await getAccessToken();
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');

  const message = {
    message: {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
    },
  };

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('FCM API error:', error);
    throw new Error(`FCM API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_ids, notification_id, token, title, body, data = {} }: PushNotificationRequest = await req.json();

    console.log('Sending push notifications:', { user_ids, notification_id, token, title });

    // If a single token is provided, send directly to that device
    if (token) {
      try {
        const result = await sendFCMNotification(token, title, body, data);
        console.log('Push notification sent successfully:', result);
        
        return new Response(JSON.stringify({ 
          success: true,
          sent_count: 1,
          result
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        console.error('Error sending push notification:', error);
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    let targetUserIds: string[] = [];

    // Get user IDs from notification if notification_id is provided
    if (notification_id) {
      const { data: notification, error: notifError } = await supabaseClient
        .from('notifications')
        .select('user_id')
        .eq('id', notification_id)
        .single();

      if (notifError) {
        console.error('Error fetching notification:', notifError);
        return new Response(JSON.stringify({ error: 'Notification not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      targetUserIds = [notification.user_id];
    } else if (user_ids && user_ids.length > 0) {
      targetUserIds = user_ids;
    } else {
      return new Response(JSON.stringify({ error: 'No user_ids, notification_id, or token provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get FCM tokens for these users
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', targetUserIds);

    if (tokensError) {
      console.error('Error fetching FCM tokens:', tokensError);
      return new Response(JSON.stringify({ error: 'Failed to fetch FCM tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for users:', targetUserIds);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No devices to send notification to',
        sent_count: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send notifications to all tokens
    console.log(`Sending push notification to ${tokens.length} devices`);
    
    const results = await Promise.allSettled(
      tokens.map(async (t) => {
        try {
          const result = await sendFCMNotification(t.token, title, body, data);
          return {
            token: t.token,
            user_id: t.user_id,
            success: true,
            result
          };
        } catch (error: any) {
          console.error(`Failed to send to token ${t.token}:`, error);
          return {
            token: t.token,
            user_id: t.user_id,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.length - successCount;

    console.log(`Push notifications sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      sent_count: successCount,
      failed_count: failureCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
