import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDxVWfXZYTKAW6gF4cqSsiB1ajbh_6nj6E",
  authDomain: "nys-africa.firebaseapp.com",
  projectId: "nys-africa",
  storageBucket: "nys-africa.firebasestorage.app",
  messagingSenderId: "725565778116",
  appId: "1:725565778116:web:ae936b71557bb0bf1c8191",
  measurementId: "G-KYZ053W2LB"
};

interface PushNotificationRequest {
  user_ids?: string[];
  notification_id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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

    const { user_ids, notification_id, title, body, data = {} }: PushNotificationRequest = await req.json();

    console.log('Sending push notifications:', { user_ids, notification_id, title });

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
      return new Response(JSON.stringify({ error: 'No user_ids or notification_id provided' }), {
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

    // Send notifications using Firebase Cloud Messaging API
    // Note: This requires Firebase server key (legacy) or OAuth 2.0 token
    // For now, we'll log the attempt. To actually send, you need to:
    // 1. Get Firebase Server Key from Firebase Console
    // 2. Add it as a secret FIREBASE_SERVER_KEY
    // 3. Use Firebase Admin SDK or HTTP API to send

    console.log(`Would send push notification to ${tokens.length} devices:`, {
      title,
      body,
      tokens: tokens.map(t => t.token),
      data
    });

    // TODO: Implement actual Firebase push notification sending
    // This requires Firebase Server Key or service account
    const results = tokens.map(t => ({
      token: t.token,
      user_id: t.user_id,
      success: true, // Placeholder
      message: 'Notification logged (not actually sent - requires Firebase server key)'
    }));

    return new Response(JSON.stringify({ 
      success: true,
      sent_count: tokens.length,
      results
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
