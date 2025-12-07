import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { creatorTourSteps } from '@/components/onboarding/CreatorTour';
import { supporterTourSteps } from '@/components/onboarding/SupporterTour';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

interface PlatformTourProps {
  run: boolean;
  onClose: () => void;
}

const PlatformTour = ({ run, onClose }: PlatformTourProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'supporter' | null>(null);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (run && !profile?.has_completed_tour) {
      setShowRoleModal(true);
    } else if (run && profile?.has_completed_tour) {
      // For users restarting tour, show role selection again
      setShowRoleModal(true);
    }
  }, [run, profile]);

  const handleRoleSelect = (role: 'creator' | 'supporter') => {
    setSelectedRole(role);
    setShowRoleModal(false);
    setRunTour(true);
  };

  const handleModalClose = () => {
    setShowRoleModal(false);
    onClose();
  };

  const getSteps = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: 'body',
        content: (
          <div>
            <h2 className="text-xl font-bold mb-2">Bem-vindo à Plataforma Raiz Token! 🌱</h2>
            <p>Vamos fazer um tour rápido pelas principais funcionalidades.</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="stats"]',
        content: (
          <div>
            <h3 className="font-bold mb-2">Estatísticas do Dashboard</h3>
            <p>Aqui você acompanha seus projetos, tokens e apoiadores em tempo real.</p>
          </div>
        ),
        placement: 'bottom',
      },
      {
        target: '[data-tour="quick-actions"]',
        content: (
          <div>
            <h3 className="font-bold mb-2">Ações Rápidas</h3>
            <p>Acesse rapidamente as principais ações da plataforma.</p>
          </div>
        ),
        placement: 'top',
      },
      {
        target: '[data-tour="header-nav"]',
        content: (
          <div>
            <h3 className="font-bold mb-2">Menu de Navegação</h3>
            <p>Use o menu superior para navegar entre as páginas.</p>
          </div>
        ),
        placement: 'bottom',
      },
      {
        target: '[data-tour="user-menu"]',
        content: (
          <div>
            <h3 className="font-bold mb-2">Menu do Usuário</h3>
            <p>Acesse seu perfil, carteira e reinicie o tour por aqui.</p>
          </div>
        ),
        placement: 'bottom',
      },
    ];

    if (selectedRole === 'creator') {
      return [...baseSteps, ...creatorTourSteps];
    } else if (selectedRole === 'supporter') {
      return [...baseSteps, ...supporterTourSteps];
    }

    return baseSteps;
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ has_completed_tour: true })
            .eq('id', user.id);

          if (error) {
            console.error('Error updating tour status:', error);
          } else {
            await refreshProfile();
            toast({
              title: "Tour concluído!",
              description: "Você pode reiniciar o tour a qualquer momento pelo menu.",
            });
          }
        } catch (error) {
          console.error('Error in tour callback:', error);
        }
      }
      setRunTour(false);
      setSelectedRole(null);
      onClose();
    }
  };

  return (
    <>
      <OnboardingModal
        open={showRoleModal}
        onClose={handleModalClose}
        onSelectRole={handleRoleSelect}
      />
      
      <Joyride
        steps={getSteps()}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#166534',
            textColor: '#333',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 20,
          },
          buttonNext: {
            backgroundColor: '#166534',
            borderRadius: 6,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#166534',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#666',
          },
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
        }}
      />
    </>
  );
};

export default PlatformTour;
