import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Beaker, Send, Database, Mail, DollarSign } from 'lucide-react';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';

const AdminTestPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurity();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const runTest = async (type: string) => {
    if (!user) return;
    
    setLoading(true);
    setResult('');

    try {
      let testResult = '';

      switch (type) {
        case 'database':
          // Testar conexão com banco
          const { data: dbTest, error: dbError } = await supabase
            .from('profiles')
            .select('count')
            .single();
          
          testResult = dbError 
            ? `❌ Erro: ${dbError.message}` 
            : `✅ Conexão com banco OK. Total de perfis: ${dbTest?.count || 0}`;
          break;

        case 'tokens':
          // Testar sistema de tokens
          const { data: tokensTest, error: tokensError } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (tokensError) {
            testResult = `❌ Erro: ${tokensError.message}`;
          } else {
            testResult = `✅ Sistema de tokens OK. Saldo: ${tokensTest?.balance || 0} tokens`;
          }
          break;

        case 'notifications':
          // Criar notificação de teste
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'test',
              title: 'Teste de Notificação',
              message: 'Esta é uma notificação de teste criada pelo painel admin'
            });
          
          testResult = notifError 
            ? `❌ Erro: ${notifError.message}` 
            : `✅ Notificação de teste criada com sucesso`;
          break;

        case 'email':
          // Testar envio de email via edge function
          const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
            body: {
              name: 'Admin Test',
              email: user.email,
              subject: 'Teste de Email',
              message: 'Este é um email de teste do painel admin'
            }
          });
          
          testResult = emailError 
            ? `❌ Erro: ${emailError.message}` 
            : `✅ Email de teste enviado com sucesso`;
          break;

        case 'custom':
          // Teste customizado foi removido por segurança
          testResult = '⚠️ Testes customizados foram desabilitados por segurança';
          break;

        default:
          testResult = '❌ Tipo de teste não reconhecido';
      }

      setResult(testResult);

      // Log da ação
      await logAdminAction(
        `test_${type}`,
        'system',
        undefined,
        { test_type: type, result: testResult.substring(0, 100) }
      );

      toast({
        title: "Teste concluído",
        description: `Teste de ${type} executado`,
      });

    } catch (error: any) {
      console.error('Test error:', error);
      setResult(`❌ Erro inesperado: ${error.message}`);
      toast({
        title: "Erro",
        description: "Erro ao executar teste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            Painel de Testes Admin
          </CardTitle>
          <CardDescription>
            Execute testes de sistema e validações. Use com cuidado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => runTest('database')}
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Database className="w-6 h-6" />
              <span>Testar Banco de Dados</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runTest('tokens')}
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <DollarSign className="w-6 h-6" />
              <span>Testar Sistema de Tokens</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runTest('notifications')}
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Send className="w-6 h-6" />
              <span>Testar Notificações</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runTest('email')}
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Mail className="w-6 h-6" />
              <span>Testar Email</span>
            </Button>
          </div>

          {result && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-sm">Resultado do Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-mono">{result}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Teste de Investimento em Projeto Próprio</CardTitle>
          <CardDescription>
            Como admin, você pode investir tokens nos seus próprios projetos para testes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Acesse qualquer projeto que você criou
            </p>
            <p className="text-sm text-muted-foreground">
              2. Clique em "Apoiar com Tokens"
            </p>
            <p className="text-sm text-muted-foreground">
              3. Como admin, você poderá investir mesmo sendo o criador do projeto
            </p>
            <p className="text-sm text-green-600 font-medium mt-4">
              ✅ Funcionalidade já ativa para admins
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestPanel;
