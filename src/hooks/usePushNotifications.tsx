import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      
      // Register service worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const requestPermission = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      
      // Store token in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert({
            user_id: user.id,
            token: token,
            device_info: {
              user_agent: navigator.userAgent,
              platform: navigator.platform
            }
          }, {
            onConflict: 'user_id,token'
          });

        if (error) {
          console.error('Error storing FCM token:', error);
          toast.error('Erreur lors de l\'enregistrement du token');
        } else {
          console.log('FCM Token stored for user:', user.id);
          toast.success('Notifications activées');
        }
      }
    } else {
      toast.error('Permission de notification refusée');
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (isSupported) {
      onMessageListener()
        .then((payload: any) => {
          console.log('Foreground message:', payload);
          toast(payload.notification?.title || 'Nouvelle notification', {
            description: payload.notification?.body,
          });
        })
        .catch((err) => console.error('Failed to listen for messages:', err));
    }
  }, [isSupported]);

  return {
    fcmToken,
    isSupported,
    requestPermission,
  };
};
