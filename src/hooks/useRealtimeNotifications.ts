import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

export const useRealtimeNotifications = (userId: string | undefined, onNewNotification?: () => void) => {
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up realtime notifications for user:', userId);

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new as Notification;

          // Mostrar toast com a notificação
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });

          // Callback opcional para atualizar a UI
          if (onNewNotification) {
            onNewNotification();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime notifications');
      supabase.removeChannel(channel);
    };
  }, [userId, onNewNotification]);
};
