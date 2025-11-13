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
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'pix'>('pix');
  
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

  const [pixData, setPixData] = useState({
    pix_key: '',
    pix_key_type: 'cpf' as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
    holder_name: '',
    document: ''
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
      const withdrawalData: any = {
        project_id: projectId,
        user_id: userId,
        requested_amount: raisedAmount,
        admin_fee: feeAmount,
        net_amount: netAmount,
        payment_method: paymentMethod
      };

      if (paymentMethod === 'pix') {
        withdrawalData.pix_key = pixData.pix_key;
        withdrawalData.pix_key_type = pixData.pix_key_type;
        withdrawalData.bank_account = {
          holder_name: pixData.holder_name,
          document: pixData.document
        };
      } else {
        withdrawalData.bank_account = bankAccount;
      }

      const { error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData);

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
          <div className="space-y-2 mb-6">
            <Label>Método de Pagamento</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: 'bank_transfer' | 'pix') => setPaymentMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX (Recomendado - Mais Rápido)</SelectItem>
                <SelectItem value="bank_transfer">Transferência Bancária (TED/DOC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'pix' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
                <Select
                  value={pixData.pix_key_type}
                  onValueChange={(value: any) => setPixData({ ...pixData, pix_key_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  placeholder={
                    pixData.pix_key_type === 'cpf' ? '000.000.000-00' :
                    pixData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                    pixData.pix_key_type === 'email' ? 'seu@email.com' :
                    pixData.pix_key_type === 'phone' ? '(00) 00000-0000' :
                    'Chave aleatória'
                  }
                  value={pixData.pix_key}
                  onChange={(e) => setPixData({ ...pixData, pix_key: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_holder_name">Nome do Titular</Label>
                <Input
                  id="pix_holder_name"
                  placeholder="Nome completo"
                  value={pixData.holder_name}
                  onChange={(e) => setPixData({ ...pixData, holder_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_document">CPF do Titular</Label>
                <Input
                  id="pix_document"
                  placeholder="000.000.000-00"
                  value={pixData.document}
                  onChange={(e) => setPixData({ ...pixData, document: e.target.value })}
                  required
                />
              </div>
            </>
          ) : (
            <>
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

            </>
          )}

          <Alert className="mt-4">
            <AlertDescription>
              {paymentMethod === 'pix' ? (
                <p className="text-sm">
                  ⚡ <strong>PIX:</strong> Processamento mais rápido! O valor será enviado via PIX após aprovação do admin.
                  A taxa administrativa será retida automaticamente.
                </p>
              ) : (
                <p className="text-sm">
                  🏦 <strong>Transferência Bancária:</strong> O valor será enviado via TED/DOC após aprovação.
                  Pode levar até 2 dias úteis.
                </p>
              )}
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Solicitar Resgate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
