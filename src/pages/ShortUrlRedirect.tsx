import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ShortUrlRedirect = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToProject = async () => {
      if (!shortId) {
        navigate('/projetos');
        return;
      }

      try {
        const numericId = parseInt(shortId, 10);
        
        if (isNaN(numericId)) {
          toast({
            title: "ID inválido",
            description: "O ID da campanha deve ser um número.",
            variant: "destructive"
          });
          navigate('/projetos');
          return;
        }

        const { data: project, error } = await supabase
          .from('projects')
          .select('id, status')
          .eq('short_id', numericId)
          .single();

        if (error || !project) {
          toast({
            title: "Campanha não encontrada",
            description: `Não foi possível encontrar a campanha com ID ${shortId}. Verifique o número.`,
            variant: "destructive"
          });
          navigate('/projetos');
          return;
        }

        // Redirecionar para a página do projeto
        navigate(`/projeto/${project.id}`, { replace: true });
      } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao buscar a campanha.",
          variant: "destructive"
        });
        navigate('/projetos');
      } finally {
        setLoading(false);
      }
    };

    redirectToProject();
  }, [shortId, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raiz-light to-raiz-accent/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary mx-auto mb-4"></div>
          <p className="text-raiz-secondary">Buscando campanha #{shortId}...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default ShortUrlRedirect;
