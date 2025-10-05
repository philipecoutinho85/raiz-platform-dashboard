import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformTourProps {
  run: boolean;
  onClose: () => void;
}

const PlatformTour = ({ run, onClose }: PlatformTourProps) => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">Bem-vindo à Plataforma $RAIZ! 🌱</h2>
          <p>Vamos fazer um tour rápido pelas principais funcionalidades para você aproveitar ao máximo a plataforma.</p>
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
          <p>Aqui você acompanha seus projetos ativos, tokens disponíveis e total de apoiadores em tempo real.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">Ações Rápidas</h3>
          <p>Acesse rapidamente as principais ações: criar novo projeto, comprar tokens ou visualizar seus projetos.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="recent-projects"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">Projetos Recentes</h3>
          <p>Acompanhe o status dos seus projetos mais recentes e veja o progresso de cada um.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="header-nav"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">Menu de Navegação</h3>
          <p>Use o menu superior para navegar entre Marketplace, Meus Projetos, Como Funciona e outras páginas importantes.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="user-menu"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">Menu do Usuário</h3>
          <p>Acesse seu perfil, configurações e faça logout por aqui. Você também pode reiniciar este tour a qualquer momento!</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      // Marcar tour como concluído no banco de dados
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
              description: "Você pode reiniciar o tour a qualquer momento pelo menu do usuário.",
            });
          }
        } catch (error) {
          console.error('Error in tour callback:', error);
        }
      }
      onClose();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#8B4513',
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
          backgroundColor: '#8B4513',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#8B4513',
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
  );
};

export default PlatformTour;
