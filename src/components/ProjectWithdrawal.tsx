import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectWithdrawalProps {
  projectId: string;
  userId: string;
  raisedAmount: number;
  adminFee: number;
  isOwner: boolean;
}

export const ProjectWithdrawal = ({
  projectId,
  userId,
  raisedAmount,
  adminFee,
  isOwner
}: ProjectWithdrawalProps) => {
  const [loading, setLoading] = useState(false);
  const [hasWithdrawal, setHasWithdrawal] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>('');
  
  const [bankAccount, setBankAccount] = useState({
    bank_code: '',
    branch: '',
    branch_check_digit: '',
    account: '',
    account_check_digit: '',
    account_type: 'checking',
    holder_name: '',
    document: '',
    email: ''
  });

  const netAmount = raisedAmount * (1 - adminFee / 100);
  const feeAmount = raisedAmount * (adminFee / 100);

  useEffect(() => {
    if (isOwner) {
      checkExistingWithdrawal();
    }
  }, [isOwner]);

  const checkExistingWithdrawal = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('status')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setHasWithdrawal(true);
      setWithdrawalStatus(data.status);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('Apenas o autor do projeto pode solicitar resgate');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          project_id: projectId,
          user_id: userId,
          requested_amount: raisedAmount,
          admin_fee: feeAmount,
          net_amount: netAmount,
          bank_account: bankAccount
        });

      if (error) throw error;

      toast.success('Solicitação de resgate enviada com sucesso!');
      setHasWithdrawal(true);
      setWithdrawalStatus('pending');
    } catch (error: any) {
      console.error('Erro ao solicitar resgate:', error);
      toast.error(error?.message || 'Erro ao solicitar resgate. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  if (hasWithdrawal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Status do Resgate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {withdrawalStatus === 'pending' && 'Sua solicitação de resgate está em análise.'}
              {withdrawalStatus === 'approved' && 'Seu resgate foi aprovado e está sendo processado!'}
              {withdrawalStatus === 'rejected' && 'Seu resgate foi rejeitado. Entre em contato com o suporte.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Solicitar Resgate
        </CardTitle>
        <CardDescription>
          Seu projeto atingiu a meta! Solicite o resgate dos valores arrecadados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Valor arrecadado:</strong> R$ {raisedAmount.toFixed(2)}</p>
              <p><strong>Taxa administrativa ({adminFee}%):</strong> R$ {feeAmount.toFixed(2)}</p>
              <p className="text-lg font-bold"><strong>Valor líquido:</strong> R$ {netAmount.toFixed(2)}</p>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_code">Código do Banco</Label>
              <Input
                id="bank_code"
                placeholder="Ex: 001"
                value={bankAccount.bank_code}
                onChange={(e) => setBankAccount({ ...bankAccount, bank_code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo de Conta</Label>
              <Select
                value={bankAccount.account_type}
                onValueChange={(value) => setBankAccount({ ...bankAccount, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="branch">Agência</Label>
              <Input
                id="branch"
                placeholder="0000"
                value={bankAccount.branch}
                onChange={(e) => setBankAccount({ ...bankAccount, branch: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_check_digit">Dígito</Label>
              <Input
                id="branch_check_digit"
                placeholder="0"
                maxLength={1}
                value={bankAccount.branch_check_digit}
                onChange={(e) => setBankAccount({ ...bankAccount, branch_check_digit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                placeholder="00000000"
                value={bankAccount.account}
                onChange={(e) => setBankAccount({ ...bankAccount, account: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_check_digit">Dígito</Label>
              <Input
                id="account_check_digit"
                placeholder="0"
                maxLength={1}
                value={bankAccount.account_check_digit}
                onChange={(e) => setBankAccount({ ...bankAccount, account_check_digit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="holder_name">Nome do Titular</Label>
            <Input
              id="holder_name"
              placeholder="Nome completo"
              value={bankAccount.holder_name}
              onChange={(e) => setBankAccount({ ...bankAccount, holder_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF</Label>
            <Input
              id="document"
              placeholder="000.000.000-00"
              value={bankAccount.document}
              onChange={(e) => setBankAccount({ ...bankAccount, document: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={bankAccount.email}
              onChange={(e) => setBankAccount({ ...bankAccount, email: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Solicitar Resgate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
