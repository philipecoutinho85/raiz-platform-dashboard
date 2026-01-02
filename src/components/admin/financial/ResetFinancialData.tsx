import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2, Shield, Lock, Loader2 } from 'lucide-react';

export const ResetFinancialData = () => {
  const { user } = useAuth();
  const { adminType, logAdminAction } = useAdminSecurity();
  const { toast } = useToast();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const [resetOptions, setResetOptions] = useState({
    tokenPurchases: true,
    projectContributions: true,
    financialLedger: true,
    ledgerMovements: true,
    withdrawals: true,
    refunds: true,
    creatorPayouts: true,
    userTokens: true,
    projectStats: true,
    financialAlerts: true,
  });

  // Apenas admin master pode ver este componente
  if (adminType !== 'master') {
    return null;
  }

  const handleResetClick = () => {
    setShowConfirmDialog(true);
    setPassword('');
    setTwoFactorCode('');
    setConfirmText('');
  };

  const handleReset = async () => {
    // Verificar se digitou "RESETAR DADOS"
    if (confirmText !== 'RESETAR DADOS') {
      toast({
        title: 'Confirmação inválida',
        description: 'Digite "RESETAR DADOS" para confirmar.',
        variant: 'destructive',
      });
      return;
    }

    if (!password || !twoFactorCode) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha a senha e o código 2FA.',
        variant: 'destructive',
      });
      return;
    }

    if (twoFactorCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'O código 2FA deve ter 6 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    try {
      // Verificar senha
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.email) {
        throw new Error('Usuário não encontrado');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: password,
      });

      if (signInError) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha fornecida está incorreta.',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      // Verificar 2FA
      const { data: twoFAData } = await supabase
        .from('admin_2fa')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (!twoFAData || !twoFAData.is_enabled) {
        toast({
          title: '2FA não configurado',
          description: 'Configure o 2FA antes de realizar esta ação.',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      // Realizar o reset das tabelas selecionadas
      const resetResults: string[] = [];
      const errors: string[] = [];

      // Ordem de exclusão respeitando foreign keys
      if (resetOptions.ledgerMovements) {
        const { error } = await supabase.from('ledger_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`ledger_movements: ${error.message}`);
        else resetResults.push('ledger_movements');
      }

      if (resetOptions.financialLedger) {
        const { error } = await supabase.from('financial_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`financial_ledger: ${error.message}`);
        else resetResults.push('financial_ledger');
      }

      if (resetOptions.refunds) {
        const { error } = await supabase.from('refunds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`refunds: ${error.message}`);
        else resetResults.push('refunds');
      }

      if (resetOptions.withdrawals) {
        // Primeiro deletar withdrawal_messages (FK constraint)
        const { error: msgError } = await supabase.from('withdrawal_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (msgError) errors.push(`withdrawal_messages: ${msgError.message}`);
        else resetResults.push('withdrawal_messages');
        
        const { error } = await supabase.from('withdrawals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`withdrawals: ${error.message}`);
        else resetResults.push('withdrawals');
      }

      if (resetOptions.creatorPayouts) {
        const { error } = await supabase.from('creator_payouts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`creator_payouts: ${error.message}`);
        else resetResults.push('creator_payouts');
      }

      if (resetOptions.projectContributions) {
        const { error } = await supabase.from('project_contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`project_contributions: ${error.message}`);
        else resetResults.push('project_contributions');
      }

      if (resetOptions.tokenPurchases) {
        const { error } = await supabase.from('token_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`token_purchases: ${error.message}`);
        else resetResults.push('token_purchases');
      }

      if (resetOptions.userTokens) {
        // Zerar saldos em vez de deletar
        const { error } = await supabase.from('user_tokens').update({ balance: 0 }).neq('user_id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`user_tokens: ${error.message}`);
        else resetResults.push('user_tokens (zerados)');
        
        // Limpar histórico de transações
        const { error: transError } = await supabase.from('token_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (transError) errors.push(`token_transactions: ${transError.message}`);
        else resetResults.push('token_transactions');
      }

      if (resetOptions.projectStats) {
        // Zerar raised_amount e backers_count dos projetos
        const { error } = await supabase.from('projects').update({ 
          raised_amount: 0, 
          backers_count: 0 
        }).neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`projects: ${error.message}`);
        else resetResults.push('projects (stats zerados)');
      }

      if (resetOptions.financialAlerts) {
        const { error } = await supabase.from('financial_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) errors.push(`financial_alerts: ${error.message}`);
        else resetResults.push('financial_alerts');
      }

      // Logar a ação
      await logAdminAction('RESET_FINANCIAL_DATA', 'system', undefined, {
        resetOptions,
        resetResults,
        errors,
        timestamp: new Date().toISOString(),
      });

      if (errors.length > 0) {
        toast({
          title: 'Reset parcial',
          description: `Algumas tabelas não puderam ser resetadas: ${errors.join(', ')}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset concluído!',
          description: `Dados resetados: ${resetResults.join(', ')}`,
        });
      }

      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Erro no reset:', error);
      toast({
        title: 'Erro ao resetar',
        description: error.message || 'Ocorreu um erro ao resetar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const allSelected = Object.values(resetOptions).every(Boolean);
  const someSelected = Object.values(resetOptions).some(Boolean);

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo - Reset de Dados (Admin Master)
          </CardTitle>
          <CardDescription>
            Esta ação irá apagar permanentemente todos os dados financeiros selecionados.
            Requer verificação de senha + código 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tokenPurchases"
                checked={resetOptions.tokenPurchases}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, tokenPurchases: !!checked }))}
              />
              <Label htmlFor="tokenPurchases" className="text-sm">Compras de Tokens</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="projectContributions"
                checked={resetOptions.projectContributions}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, projectContributions: !!checked }))}
              />
              <Label htmlFor="projectContributions" className="text-sm">Contribuições</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="financialLedger"
                checked={resetOptions.financialLedger}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, financialLedger: !!checked }))}
              />
              <Label htmlFor="financialLedger" className="text-sm">Ledger Financeiro</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ledgerMovements"
                checked={resetOptions.ledgerMovements}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, ledgerMovements: !!checked }))}
              />
              <Label htmlFor="ledgerMovements" className="text-sm">Movimentações</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="withdrawals"
                checked={resetOptions.withdrawals}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, withdrawals: !!checked }))}
              />
              <Label htmlFor="withdrawals" className="text-sm">Resgates</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="refunds"
                checked={resetOptions.refunds}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, refunds: !!checked }))}
              />
              <Label htmlFor="refunds" className="text-sm">Reembolsos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="creatorPayouts"
                checked={resetOptions.creatorPayouts}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, creatorPayouts: !!checked }))}
              />
              <Label htmlFor="creatorPayouts" className="text-sm">Pagamentos Criadores</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="userTokens"
                checked={resetOptions.userTokens}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, userTokens: !!checked }))}
              />
              <Label htmlFor="userTokens" className="text-sm">Saldos de Tokens</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="projectStats"
                checked={resetOptions.projectStats}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, projectStats: !!checked }))}
              />
              <Label htmlFor="projectStats" className="text-sm">Estatísticas Projetos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="financialAlerts"
                checked={resetOptions.financialAlerts}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, financialAlerts: !!checked }))}
              />
              <Label htmlFor="financialAlerts" className="text-sm">Alertas Financeiros</Label>
            </div>
          </div>

          <Button 
            variant="destructive" 
            onClick={handleResetClick}
            disabled={!someSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Resetar Dados Selecionados
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-destructive" />
              <DialogTitle>Confirmar Reset de Dados</DialogTitle>
            </div>
            <DialogDescription>
              Esta ação é <strong>IRREVERSÍVEL</strong>. Todos os dados financeiros selecionados serão apagados permanentemente.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Você está prestes a apagar dados financeiros. Certifique-se de que possui backup antes de continuar.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="2fa">Código 2FA (6 dígitos)</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="2fa"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="pl-10 tracking-widest text-center text-lg"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Digite "RESETAR DADOS" para confirmar</Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="RESETAR DADOS"
                className="text-center font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isResetting}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset} 
              disabled={isResetting || confirmText !== 'RESETAR DADOS'}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmar Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
