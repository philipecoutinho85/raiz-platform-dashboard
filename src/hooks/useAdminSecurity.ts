import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos para admins

export const useAdminSecurity = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionStart, setSessionStart] = useState(Date.now());

  // Log de ação administrativa
  const logAdminAction = useCallback(async (
    action: string,
    targetType: string,
    targetId?: string,
    details?: any
  ) => {
    if (!user || !isAdmin) return;

    try {
      await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action: action,
        p_target_type: targetType,
        p_target_id: targetId || null,
        p_details: details ? JSON.stringify(details) : null,
        p_ip_address: null, // Será preenchido via edge function
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar log administrativo:', error);
    }
  }, [user, isAdmin]);

  // Verificar dispositivo
  const checkDeviceFingerprint = useCallback(async () => {
    if (!user || !isAdmin) return;

    const fingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}`;
    
    const { data: devices } = await supabase
      .from('admin_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('device_fingerprint', fingerprint)
      .single();

    if (!devices) {
      // Novo dispositivo detectado - enviar alerta
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nome')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase.functions.invoke('send-admin-alert', {
          body: {
            type: 'new_device',
            adminEmail: profile.email,
            adminName: profile.nome,
            details: {
              userAgent: navigator.userAgent,
              ipAddress: 'Será detectado no servidor'
            }
          }
        });
      }

      toast({
        title: "Novo dispositivo detectado",
        description: "Login de admin em novo dispositivo. Um alerta foi enviado.",
        variant: "default"
      });

      await supabase.from('admin_devices').insert({
        user_id: user.id,
        device_fingerprint: fingerprint,
        user_agent: navigator.userAgent
      });
    } else {
      // Atualizar último login
      await supabase
        .from('admin_devices')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', devices.id);
    }
  }, [user, isAdmin, toast]);

  // Verificar 2FA
  const check2FAStatus = useCallback(async () => {
    if (!user || !isAdmin) return null;

    const { data } = await supabase
      .from('admin_2fa')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return data;
  }, [user, isAdmin]);

  // Resetar timer de inatividade
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Monitorar inatividade
  useEffect(() => {
    if (!isAdmin) return;

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const sessionTime = Date.now() - sessionStart;

      if (inactiveTime >= INACTIVITY_TIMEOUT || sessionTime >= SESSION_TIMEOUT) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão foi encerrada por inatividade.",
          variant: "destructive"
        });
        supabase.auth.signOut();
      }
    }, 60000); // Verificar a cada minuto

    // Eventos de atividade
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });

    return () => {
      clearInterval(checkInactivity);
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [isAdmin, lastActivity, sessionStart, resetActivityTimer, toast]);

  return {
    logAdminAction,
    checkDeviceFingerprint,
    check2FAStatus,
    resetActivityTimer
  };
};
