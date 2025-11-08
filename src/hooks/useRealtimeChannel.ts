import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeChannelOptions {
  channelName: string;
  enabled: boolean;
  table: string;
  schema?: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onEvent: (payload: any) => void;
}

/**
 * Hook centralizado para gerenciar canais realtime do Supabase
 * Garante que não haja múltiplas subscriptions no mesmo canal
 */
export const useRealtimeChannel = ({
  channelName,
  enabled,
  table,
  schema = 'public',
  event,
  filter,
  onEvent,
}: UseRealtimeChannelOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const channelNameRef = useRef<string | null>(null);

  useEffect(() => {
    // Se não está habilitado, limpar e retornar
    if (!enabled) {
      if (channelRef.current && isSubscribedRef.current) {
        console.log('[Realtime] Disabling channel:', channelNameRef.current);
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
        channelNameRef.current = null;
      }
      return;
    }

    // Se já está subscrito no mesmo canal, não fazer nada
    if (isSubscribedRef.current && channelNameRef.current === channelName) {
      console.log('[Realtime] Channel already subscribed:', channelName);
      return;
    }

    // Limpar canal anterior se existir
    if (channelRef.current && isSubscribedRef.current) {
      console.log('[Realtime] Cleaning up previous channel:', channelNameRef.current);
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Criar novo canal
    console.log('[Realtime] Creating channel:', channelName);
    
    const channel = supabase.channel(channelName);

    // Configurar listener
    const config: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    channel.on('postgres_changes', config, onEvent);

    // Subscribe
    channel.subscribe((status) => {
      console.log('[Realtime] Subscription status:', status, 'for channel:', channelName);
      
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        channelNameRef.current = channelName;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        channelNameRef.current = null;
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[Realtime] Effect cleanup for channel:', channelName);
      if (channelRef.current && isSubscribedRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
      channelNameRef.current = null;
    };
  }, [channelName, enabled, table, schema, event, filter]);

  return {
    isSubscribed: isSubscribedRef.current,
    channel: channelRef.current,
  };
};
