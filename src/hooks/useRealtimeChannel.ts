import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeChannelOptions {
  channelName: string;
  enabled: boolean;
  table: string;
  schema?: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onEvent: (payload: any) => void;
}

// Mapa global para rastrear canais ativos
const activeChannels = new Map<string, any>();

/**
 * Hook para gerenciar canais realtime do Supabase
 * Usa estratégia de force-cleanup para evitar múltiplas subscriptions
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
  const onEventRef = useRef(onEvent);
  const isSetupRef = useRef(false);

  // Atualizar ref do callback
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Se não habilitado, limpar tudo
    if (!enabled) {
      if (activeChannels.has(channelName)) {
        const channel = activeChannels.get(channelName);
        console.log('[Realtime] Removing disabled channel:', channelName);
        channel.unsubscribe();
        supabase.removeChannel(channel);
        activeChannels.delete(channelName);
      }
      isSetupRef.current = false;
      return;
    }

    // Se já configurado, não fazer nada
    if (isSetupRef.current && activeChannels.has(channelName)) {
      console.log('[Realtime] Channel already active:', channelName);
      return;
    }

    // Force cleanup de qualquer canal com mesmo nome
    if (activeChannels.has(channelName)) {
      const oldChannel = activeChannels.get(channelName);
      console.log('[Realtime] Force cleanup of existing channel:', channelName);
      try {
        oldChannel.unsubscribe();
        supabase.removeChannel(oldChannel);
      } catch (e) {
        console.warn('[Realtime] Error during force cleanup:', e);
      }
      activeChannels.delete(channelName);
    }

    // Criar novo canal
    console.log('[Realtime] Creating new channel:', channelName);
    
    const channel = supabase.channel(channelName);

    const config: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    // Configurar listener com ref
    channel.on('postgres_changes', config, (payload) => {
      onEventRef.current(payload);
    });

    // Subscribe
    channel.subscribe((status) => {
      console.log('[Realtime] Status:', status, 'Channel:', channelName);
    });

    // Guardar no mapa global
    activeChannels.set(channelName, channel);
    isSetupRef.current = true;

    // Cleanup
    return () => {
      console.log('[Realtime] Cleanup for:', channelName);
      isSetupRef.current = false;
      
      if (activeChannels.has(channelName)) {
        const ch = activeChannels.get(channelName);
        try {
          ch.unsubscribe();
          supabase.removeChannel(ch);
        } catch (e) {
          console.warn('[Realtime] Error during cleanup:', e);
        }
        activeChannels.delete(channelName);
      }
    };
  }, [channelName, enabled, table, schema, event, filter]);

  return {
    isActive: activeChannels.has(channelName),
  };
};
