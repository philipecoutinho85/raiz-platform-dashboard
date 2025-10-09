import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export interface AnalyticsSettings {
  google_analytics_id: string;
  google_tag_manager_id: string;
  meta_pixel_id: string;
}

export const useSystemSettings = () => {
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceSettings>({ enabled: false, message: '' });
  const [analytics, setAnalytics] = useState<AnalyticsSettings>({ 
    google_analytics_id: '', 
    google_tag_manager_id: '', 
    meta_pixel_id: '' 
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error) throw error;

      data?.forEach(setting => {
        if (setting.key === 'maintenance_mode') {
          setMaintenanceMode(setting.value as MaintenanceSettings);
        } else if (setting.key === 'analytics') {
          setAnalytics(setting.value as AnalyticsSettings);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceMode = async (settings: MaintenanceSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: settings })
        .eq('key', 'maintenance_mode');

      if (error) throw error;

      setMaintenanceMode(settings);
      toast({
        title: 'Configurações atualizadas',
        description: 'Modo de manutenção atualizado com sucesso.'
      });
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar modo de manutenção.',
        variant: 'destructive'
      });
    }
  };

  const updateAnalytics = async (settings: AnalyticsSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: settings })
        .eq('key', 'analytics');

      if (error) throw error;

      setAnalytics(settings);
      toast({
        title: 'Configurações atualizadas',
        description: 'Integrações de analytics atualizadas com sucesso.'
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar integrações.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    maintenanceMode,
    analytics,
    loading,
    updateMaintenanceMode,
    updateAnalytics
  };
};
