import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, RefreshCw, DollarSign, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatToBrasilia } from '@/lib/dateUtils';

interface ExpiredProject {
  id: string;
  title: string;
  goal: number;
  custom_goal?: number;
  raised_amount: number;
  deadline: string;
  status: string;
  backers_count: number;
  user_id: string;
}

const ExpiredProjectsTab = () => {
  const { toast } = useToast();
  const [expiredProjects, setExpiredProjects] = useState<ExpiredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchExpiredProjects();
  }, []);

  const fetchExpiredProjects = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'approved')
        .lt('deadline', today);

      if (error) throw error;

      // Filtrar projetos que não atingiram a meta (usando meta efetiva: custom_goal ou goal)
      const projectsNotReachedGoal = (data || []).filter(p => {
        const raised = Number(p.raised_amount) || 0;
        const goal = Number(p.custom_goal ?? p.goal) || 0;
        return goal > 0 && raised < goal;
      });
      setExpiredProjects(projectsNotReachedGoal);
    } catch (error: any) {
      console.error('Error fetching expired projects:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar projetos expirados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (project: ExpiredProject) => {
    try {
      setProcessing(project.id);

      // Buscar apenas contribuições não estornadas (status = 'completed')
      const { data: contributions, error: contributionsError } = await supabase
        .from('project_contributions')
        .select('id, user_id, amount')
        .eq('project_id', project.id)
        .eq('status', 'completed');

      if (contributionsError) throw contributionsError;

      if (!contributions || contributions.length === 0) {
        toast({
          title: "Aviso",
          description: "Não há contribuições ativas para reembolsar neste projeto.",
        });
        setProcessing(null);
        return;
      }

      console.log(`[Manual Refund] Found ${contributions.length} active contributions to refund`);

      // Processar devolução para cada apoiador
      for (const contribution of contributions) {
        // Buscar saldo atual do usuário
        const { data: userTokens, error: tokensError } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', contribution.user_id)
          .single();

        if (tokensError) {
          console.error('Error fetching user tokens:', tokensError);
          continue;
        }

        const currentBalance = Number(userTokens?.balance) || 0;
        const contributionAmount = Number(contribution.amount) || 0;
        const newBalance = currentBalance + contributionAmount;

        // Atualizar saldo do usuário
        const { error: updateError } = await supabase
          .from('user_tokens')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', contribution.user_id);

        if (updateError) {
          console.error('Error updating balance:', updateError);
          continue;
        }

        // Criar transação de reembolso
        const { error: transactionError } = await supabase
          .from('token_transactions')
          .insert({
            user_id: contribution.user_id,
            amount: contributionAmount,
            transaction_type: 'refund',
            reference_id: project.id,
            description: `Reembolso manual: Projeto "${project.title}" não atingiu a meta`,
            balance_after: newBalance
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }

        // Marcar contribuição como estornada
        const { error: updateContributionError } = await supabase
          .from('project_contributions')
          .update({ status: 'refunded' })
          .eq('id', contribution.id);

        if (updateContributionError) {
          console.error('Error updating contribution status:', updateContributionError);
        }

        // Criar notificação para o apoiador
        await supabase
          .from('notifications')
          .insert({
            user_id: contribution.user_id,
            type: 'refund_processed',
            title: 'Tokens Devolvidos',
            message: `Seus ${contributionAmount} tokens investidos no projeto "${project.title}" foram devolvidos à sua carteira. O projeto não atingiu a meta dentro do prazo estabelecido. Agradecemos seu apoio e esperamos contar com você em novos projetos! 💚`,
            related_id: project.id
          });
        
        console.log(`[Manual Refund] Refunded ${contributionAmount} tokens to user ${contribution.user_id}`);
      }

      // Atualizar status do projeto para 'cancelled'
      await supabase
        .from('projects')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      // Notificar o criador do projeto
      const effectiveGoal = project.custom_goal ?? project.goal;
      await supabase
        .from('notifications')
        .insert({
          user_id: project.user_id,
          type: 'project_expired',
          title: 'Projeto Não Atingiu a Meta',
          message: `Seu projeto "${project.title}" não atingiu a meta de ${effectiveGoal} tokens dentro do prazo estabelecido. Todos os tokens dos apoiadores foram devolvidos automaticamente. Você pode criar um novo projeto com ajustes na estratégia.`,
          related_id: project.id
        });

      toast({
        title: "Sucesso!",
        description: `Reembolso processado: ${contributions.length} apoiadores receberam seus tokens de volta.`,
      });

      // Atualizar lista
      fetchExpiredProjects();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reembolso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getProgressPercentage = (project: ExpiredProject) => {
    const goal = project.custom_goal ?? project.goal;
    return goal > 0 ? Math.round((project.raised_amount / goal) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    return formatToBrasilia(dateString, 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Projetos Expirados - Reembolso Manual
          </CardTitle>
          <CardDescription>
            Projetos que venceram sem atingir a meta e precisam de reembolso manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {expiredProjects.length} projeto(s) encontrado(s)
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExpiredProjects}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {expiredProjects.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Não há projetos expirados pendentes de reembolso no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {expiredProjects.map((project) => (
                <Card key={project.id} className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Meta: {project.goal} tokens</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{project.backers_count} apoiadores</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive">
                          Expirado
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Arrecadado:</span>
                          <span className="font-medium">{project.raised_amount} tokens</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-medium text-orange-600">
                            {getProgressPercentage(project)}% da meta
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="font-medium">{formatDate(project.deadline)}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => processRefund(project)}
                          disabled={processing === project.id}
                          className="w-full"
                          variant="destructive"
                        >
                          {processing === project.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Processando Reembolso...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Processar Reembolso Manual
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Isso irá devolver os tokens aos apoiadores e cancelar o projeto
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpiredProjectsTab;