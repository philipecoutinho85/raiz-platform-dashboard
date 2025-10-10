import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MaintenanceModal = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (data) {
        setMaintenanceMode(data.value as any);
      }
    };
    checkMaintenance();
  }, []);

  if (!maintenanceMode?.enabled) return null;

  return (
    <AlertDialog open={maintenanceMode.enabled}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Sistema em Manutenção
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            {maintenanceMode.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MaintenanceModal;
