import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSupportMessages = () => {
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Cleanup existing channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Use unique channel name per user
    const channelName = `support-messages-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, isAdmin, fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
};
