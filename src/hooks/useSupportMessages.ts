import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSupportMessages = () => {
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      if (isAdmin) {
        // Admin: contar mensagens não lidas de usuários em conversas abertas
        const { data: conversations } = await supabase
          .from('support_conversations')
          .select('id')
          .eq('status', 'open');

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .eq('sender_type', 'user')
            .eq('is_read', false);

          setUnreadCount(count || 0);
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
        }
      }
    } catch (error) {
      console.error('Error fetching unread support messages:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('support-messages-count')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  return { unreadCount, refetch: fetchUnreadCount };
};
