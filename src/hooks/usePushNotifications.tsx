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
      
      // Store token in user profile or database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // You might want to create a table to store FCM tokens
        console.log('FCM Token for user:', user.id, token);
        toast.success('Notifications activées');
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
