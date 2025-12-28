import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PrivacyCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deletionRequest, setDeletionRequest] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkDeletionRequest();
    }
  }, [user]);

  const checkDeletionRequest = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .single();

      if (data) {
        setDeletionRequest(data);
      }
    } catch (error) {
      // No pending request
    } finally {
      setLoading(false);
    }
  };

  const requestAccountDeletion = async () => {
    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Solicitação registrada',
        description: 'Sua conta será anonimizada em até 90 dias. Você pode cancelar a qualquer momento.',
      });

      checkDeletionRequest();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a solicitação.',
        variant: 'destructive',
      });
    }
  };

  const cancelDeletionRequest = async () => {
    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Cancelado pelo usuário',
        })
        .eq('id', deletionRequest.id);

      if (error) throw error;

      setDeletionRequest(null);
      toast({
        title: 'Solicitação cancelada',
        description: 'A exclusão da sua conta foi cancelada.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a solicitação.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-raiz-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            A Raiz Token respeita sua privacidade e trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
          <p>
            Coletamos apenas as informações necessárias para a criação da sua conta, operação da plataforma e processamento de pagamentos. Não solicitamos nem armazenamos documentos de identidade, imagens, selfies ou dados biométricos.
          </p>
          <p>
            Você pode, a qualquer momento, solicitar a exclusão do seu perfil. Após a solicitação, seus dados pessoais serão excluídos ou anonimizados, exceto aqueles que a Raiz Token é legalmente obrigada a manter para fins fiscais, regulatórios e de prevenção à fraude.
          </p>
        </CardContent>
      </Card>

      {/* Aviso de exclusão pendente */}
      {deletionRequest && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Exclusão agendada:</strong> Sua conta será anonimizada em{' '}
            {new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString('pt-BR')}.{' '}
            <Button variant="link" className="p-0 h-auto text-yellow-800 underline" onClick={cancelDeletionRequest}>
              Cancelar solicitação
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Solicitar Exclusão */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Solicitar exclusão do meu perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Esta ação é irreversível.</strong> Algumas informações poderão ser mantidas de forma segura e restrita para cumprimento de obrigações legais.
            </AlertDescription>
          </Alert>

          {!deletionRequest && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Solicitar exclusão da minha conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão da conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Seus dados pessoais serão excluídos ou anonimizados em até 90 dias.
                    Algumas informações poderão ser mantidas para cumprimento de obrigações legais.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={requestAccountDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyCenter;