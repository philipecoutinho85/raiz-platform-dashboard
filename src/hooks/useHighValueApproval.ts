import { supabase } from '@/integrations/supabase/client';

const HIGH_VALUE_THRESHOLD = 10000; // R$ 10.000,00

export const useHighValueApproval = () => {
  const checkHighValueAndAlert = async (projectId: string, projectGoal: number) => {
    if (projectGoal >= HIGH_VALUE_THRESHOLD) {
      // Buscar informações do projeto
      const { data: project } = await supabase
        .from('projects')
        .select('title, user_id')
        .eq('id', projectId)
        .single();

      if (project) {
        // Buscar admin que está aprovando
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('nome, email')
            .eq('id', user.id)
            .single();

          if (adminProfile) {
            // Enviar alerta
            await supabase.functions.invoke('send-admin-alert', {
              body: {
                type: 'high_value_release',
                adminEmail: adminProfile.email,
                adminName: adminProfile.nome,
                details: {
                  amount: projectGoal,
                  projectTitle: project.title,
                  threshold: HIGH_VALUE_THRESHOLD
                }
              }
            });
          }
        }
      }
    }
  };

  return {
    checkHighValueAndAlert,
    HIGH_VALUE_THRESHOLD
  };
};
