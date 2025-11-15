import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface NotificationResponse {
  success: boolean;
  sent_count?: number;
  result?: any;
  error?: string;
}

/**
 * Send a push notification to a specific device token
 * @param token - FCM device token
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional additional data payload
 * @returns Promise with the notification result
 */
export async function sendNotification({
  token,
  title,
  body,
  data,
}: SendNotificationParams): Promise<NotificationResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        token,
        title,
        body,
        data,
      },
    });

    if (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Exception sending notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send push notifications to multiple users by their user IDs
 * @param userIds - Array of user IDs to send notifications to
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional additional data payload
 * @returns Promise with the notification result
 */
export async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<NotificationResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_ids: userIds,
        title,
        body,
        data,
      },
    });

    if (error) {
      console.error('Error sending notifications to users:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Exception sending notifications to users:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
