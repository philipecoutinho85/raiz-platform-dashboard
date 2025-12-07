import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { Download, Settings, Trash2, Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConsentPreferences {
  marketing_emails: boolean;
  new_projects_notifications: boolean;
  analytics_tracking: boolean;
}

const PrivacyCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    marketing_emails: false,
    new_projects_notifications: true,
    analytics_tracking: true,
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
      checkDeletionRequest();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_consent_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setPreferences({
          marketing_emails: data.marketing_emails || false,
          new_projects_notifications: data.new_projects_notifications ?? true,
          analytics_tracking: data.analytics_tracking ?? true,
        });
      }
    } catch (error) {
      // Se não existe, usa valores padrão
    } finally {
      setLoading(false);
    }
  };

  const checkDeletionRequest = async () => {
    const { data } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'pending')
      .single();

    if (data) {
      setDeletionRequest(data);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_consent_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de consentimento foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadMyData = async () => {
    setDownloading(true);
    try {
      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Buscar projetos criados
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, category, status, goal, raised_amount, created_at')
        .eq('user_id', user?.id);

      // Buscar projetos apoiados
      const { data: contributions } = await supabase
        .from('project_contributions')
        .select(`
          amount,
          created_at,
          status,
          projects:project_id (title)
        `)
        .eq('user_id', user?.id);

      // Buscar preferências de consentimento
      const { data: consents } = await supabase
        .from('user_consent_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profile ? {
          nome: profile.nome,
          sobrenome: profile.sobrenome,
          email: profile.email,
          celular: profile.celular,
          cpf: profile.cpf ? '***.***.***-' + profile.cpf.slice(-2) : null,
          data_nascimento: profile.data_nascimento,
          endereco: profile.endereco,
          cidade: profile.cidade,
          estado: profile.estado,
          created_at: profile.created_at,
        } : null,
        projectsCreated: projects || [],
        projectsSupported: contributions?.map(c => ({
          project: (c.projects as any)?.title,
          amount: c.amount,
          date: c.created_at,
          status: c.status,
        })) || [],
        consentPreferences: consents ? {
          marketing_emails: consents.marketing_emails,
          new_projects_notifications: consents.new_projects_notifications,
          analytics_tracking: consents.analytics_tracking,
          updated_at: consents.updated_at,
        } : null,
      };

      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-raiztoken-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: 'Seus dados foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
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
            Central de Privacidade
          </CardTitle>
          <CardDescription>
            Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD)
          </CardDescription>
        </CardHeader>
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

      {/* Baixar Meus Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Baixar Meus Dados (Portabilidade)
          </CardTitle>
          <CardDescription>
            Exporte todos os seus dados pessoais em formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O arquivo incluirá seus dados cadastrais, projetos criados, projetos apoiados e preferências de consentimento.
          </p>
          <Button onClick={downloadMyData} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Baixar meus dados
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gerenciar Consentimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Consentimentos
          </CardTitle>
          <CardDescription>
            Escolha como seus dados podem ser utilizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Receber e-mails de marketing</Label>
              <p className="text-sm text-muted-foreground">
                Promoções, novidades e ofertas especiais
              </p>
            </div>
            <Switch
              id="marketing"
              checked={preferences.marketing_emails}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, marketing_emails: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Avisos de novos projetos</Label>
              <p className="text-sm text-muted-foreground">
                Notificações sobre projetos que podem te interessar
              </p>
            </div>
            <Switch
              id="notifications"
              checked={preferences.new_projects_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, new_projects_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Análise comportamental (Analytics)</Label>
              <p className="text-sm text-muted-foreground">
                Permitir análise anônima de uso para melhorar a plataforma
              </p>
            </div>
            <Switch
              id="analytics"
              checked={preferences.analytics_tracking}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, analytics_tracking: checked }))
              }
            />
          </div>

          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvar preferências
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Solicitar Exclusão */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Solicitar Exclusão de Conta
          </CardTitle>
          <CardDescription>
            Anonimize permanentemente seus dados pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> Ao solicitar a exclusão:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Seus dados serão anonimizados em até 90 dias</li>
                <li>Dados necessários para obrigações legais podem ser retidos</li>
                <li>Você pode cancelar a solicitação a qualquer momento antes da exclusão</li>
                <li>Esta ação é irreversível após processada</li>
              </ul>
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!!deletionRequest}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deletionRequest ? 'Exclusão já solicitada' : 'Solicitar exclusão de conta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão de conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja solicitar a exclusão da sua conta? 
                  Seus dados serão anonimizados em até 90 dias. 
                  Você poderá cancelar esta solicitação a qualquer momento antes do processamento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={requestAccountDeletion} className="bg-destructive hover:bg-destructive/90">
                  Confirmar exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyCenter;