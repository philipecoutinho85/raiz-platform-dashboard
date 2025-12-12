import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChannel } from './useRealtimeChannel';

export const useSupportMessages = () => {
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      if (isAdmin) {
        // Admin: contar mensagens não lidas de usuários em conversas abertas
        const { data: conversations } = await supabase
          .from('support_conversations')
          .select('id')
          .neq('status', 'fechado');

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .eq('sender_type', 'user')
            .eq('is_read', false);

          setUnreadCount(count || 0);
        } else {
          setUnreadCount(0);
        }
      } else {
        // Usuário: contar mensagens não lidas do admin
        const { data: conversations } = await supabase
          .from('support_conversations')
          .select('id')
          .eq('user_id', user.id);

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .eq('sender_type', 'admin')
            .eq('is_read', false);

          setUnreadCount(count || 0);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching unread support messages:', error);
    }
  }, [user, isAdmin]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Use the singleton realtime channel hook with unique name per user
  useRealtimeChannel({
    channelName: `support-msgs-${user?.id || 'anonymous'}`,
    enabled: !!user,
    table: 'support_messages',
    event: '*',
    onEvent: () => {
      fetchUnreadCount();
    },
  });

  return { unreadCount, refetch: fetchUnreadCount };
};
