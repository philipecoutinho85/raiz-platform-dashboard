
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, Users, TestTube, BadgeCheck, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TransactionsTab from './TransactionsTab';

interface TokensTabProps {
  stats: {
    totalTokens: number;
  };
  refetchData?: () => void;
}

const TokensTab = ({ stats, refetchData }: TokensTabProps) => {
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Atualmente todos os tokens são de teste
  const realTokens = 0;
  const testTokens = stats.totalTokens;

  const handleCreateTestTokens = async () => {
    if (!tokenAmount || !userId) {
      toast.error('Preencha o ID do usuário e a quantidade de tokens');
      return;
    }

    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    setIsCreating(true);
    try {
      // Verificar se o usuário existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        toast.error('Usuário não encontrado');
        return;
      }

      const { error: adjustmentError } = await supabase.rpc(
        'admin_adjust_user_tokens' as never,
        {
          p_target_user_id: userId,
          p_amount: amount,
          p_reason: `Credito de ${amount} tokens de teste pelo admin`
        } as never
      ) as { error: { message: string } | null };

      if (adjustmentError) throw adjustmentError;

      toast.success(`${amount} tokens de teste adicionados para ${profile.nome} ${profile.sobrenome}`);
      setTokenAmount('');
      setUserId('');
      refetchData?.();
    } catch (error: any) {
      console.error('Erro ao criar tokens:', error);
      toast.error('Erro ao criar tokens: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAllTestTokens = async () => {
    if (!userId) {
      toast.error('Preencha o ID do usuário');
      return;
    }

    setIsDeleting(true);
    try {
      // Verificar se o usuário existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Buscar saldo atual
      const { data: currentTokens } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      const currentBalance = currentTokens?.balance || 0;

      if (currentBalance === 0) {
        toast.info('Usuário não possui tokens');
        return;
      }

      const { error: adjustmentError } = await supabase.rpc(
        'admin_adjust_user_tokens' as never,
        {
          p_target_user_id: userId,
          p_amount: -currentBalance,
          p_reason: `Remocao de ${currentBalance} tokens de teste pelo admin`
        } as never
      ) as { error: { message: string } | null };

      if (adjustmentError) throw adjustmentError;

      toast.success(`${currentBalance} tokens removidos de ${profile.nome} ${profile.sobrenome}`);
      setUserId('');
      refetchData?.();
    } catch (error: any) {
      console.error('Erro ao deletar tokens:', error);
      toast.error('Erro ao deletar tokens: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <TestTube className="h-4 w-4 text-primary" />
        <AlertDescription>
          Atualmente todos os tokens na plataforma são <strong>tokens de teste</strong>. Nenhum token real foi emitido ainda.
        </AlertDescription>
      </Alert>

      {/* Gerenciar Tokens de Teste */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-accent" />
            Gerenciar Tokens de Teste
          </CardTitle>
          <CardDescription>Adicione ou remova tokens de teste de usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userId">ID do Usuário</Label>
                <Input
                  id="userId"
                  placeholder="UUID do usuário"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Quantidade de Tokens</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  placeholder="Ex: 100"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTestTokens}
                disabled={isCreating || !userId || !tokenAmount}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Adicionando...' : 'Adicionar Tokens'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllTestTokens}
                disabled={isDeleting || !userId}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Removendo...' : 'Zerar Tokens do Usuário'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens Reais */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              Tokens Reais
            </CardTitle>
            <CardDescription>Tokens em circulação real na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <Coins className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tokens em Circulação</p>
                  <p className="text-2xl font-bold">{realTokens.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <TrendingUp className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total (R$)</p>
                  <p className="text-2xl font-bold">R$ {(realTokens * 1.00).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <Users className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Usuários com Tokens</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens de Teste */}
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-accent" />
              Tokens de Teste
            </CardTitle>
            <CardDescription>Tokens para desenvolvimento e testes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <Coins className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Tokens em Circulação</p>
                  <p className="text-2xl font-bold">{testTokens.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <TrendingUp className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total (R$)</p>
                  <p className="text-2xl font-bold">R$ {(testTokens * 1.00).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <Users className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Usuários com Tokens</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionsTab />
    </div>
  );
};

export default TokensTab;
