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
import { useAuth } from '@/contexts/AuthContext';
import { WithdrawalChat } from './WithdrawalChat';
import { validateCPF, formatCPF } from '@/lib/cpfValidator';
import { WithdrawalVerificationModal } from './WithdrawalVerificationModal';
import { WithdrawalResponsibilityModal } from './WithdrawalResponsibilityModal';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasWithdrawal, setHasWithdrawal] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>('');
  const [withdrawalId, setWithdrawalId] = useState<string>('');
  const [withdrawalData, setWithdrawalData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState('');
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState('');
  const [showResponsibilityModal, setShowResponsibilityModal] = useState(false);
  const [cpfValidated, setCpfValidated] = useState(false);
  const [validatedCpf, setValidatedCpf] = useState('');
  
  const [bankData, setBankData] = useState({
    bank_code: '',
    branch: '',
    branch_check_digit: '',
    account: '',
    account_check_digit: '',
    account_type: 'checking' as 'checking' | 'savings',
    cpf: ''
  });

  const netAmount = raisedAmount * (1 - adminFee / 100);
  const feeAmount = raisedAmount * (adminFee / 100);

  useEffect(() => {
    if (isOwner) {
      checkExistingWithdrawal();
      loadProfile();
    }
  }, [isOwner]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const checkExistingWithdrawal = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setHasWithdrawal(true);
      setWithdrawalStatus(data.status);
      setWithdrawalId(data.id);
      setWithdrawalData(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('Apenas o autor do projeto pode solicitar resgate');
      return;
    }

    if (!bankData.bank_code || !bankData.branch || !bankData.account || 
        !bankData.account_check_digit || !bankData.cpf) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar CPF digitado
    const cpfNumbers = bankData.cpf.replace(/\D/g, '');
    if (!validateCPF(cpfNumbers)) {
      toast.error('CPF inválido. Verifique os dados.');
      return;
    }

    // Comparar CPF com o do perfil
    if (!profile) {
      toast.error('Erro ao carregar dados do perfil');
      return;
    }

    const profileCpfNumbers = profile.cpf.replace(/\D/g, '');
    if (cpfNumbers !== profileCpfNumbers) {
      toast.error('O CPF informado não corresponde ao CPF cadastrado no seu perfil. Por segurança, apenas o titular da conta pode solicitar o depósito dos valores.');
      return;
    }

    // CPF validado, abrir modal de responsabilidade
    setCpfValidated(true);
    setValidatedCpf(cpfNumbers);
    setShowResponsibilityModal(true);
  };

  const handleResponsibilityConfirmed = async () => {
    setShowResponsibilityModal(false);
    setLoading(true);

    try {
      // Criar withdrawal temporária
      const withdrawalData = {
        project_id: projectId,
        user_id: userId,
        requested_amount: raisedAmount,
        admin_fee: feeAmount,
        net_amount: netAmount,
        payment_method: 'bank_transfer',
        status: 'verification_pending',
        bank_account: {
          holder_name: `${profile?.nome} ${profile?.sobrenome}`,
          document: validatedCpf,
          email: user?.email,
          bank_code: bankData.bank_code,
          branch: bankData.branch,
          branch_check_digit: bankData.branch_check_digit || '0',
          account: bankData.account,
          account_check_digit: bankData.account_check_digit,
          account_type: bankData.account_type,
          holder_type: 'individual'
        }
      };

      const { data: newWithdrawal, error: insertError } = await supabase
        .from('withdrawals')
        .insert(withdrawalData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Buscar dados do projeto
      const { data: projectData } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();

      // Enviar código de verificação
      const { data, error: emailError } = await supabase.functions.invoke('send-withdrawal-verification', {
        body: {
          withdrawalId: newWithdrawal.id,
          email: user?.email,
          userName: `${profile?.nome} ${profile?.sobrenome}`,
          projectName: projectData?.title || 'Seu Projeto',
          amount: netAmount
        }
      });

      if (emailError) {
        // Se falhar ao enviar email, deletar withdrawal
        await supabase.from('withdrawals').delete().eq('id', newWithdrawal.id);
        throw new Error('Erro ao enviar código de verificação');
      }

      setPendingWithdrawalId(newWithdrawal.id);
      setVerificationExpiresAt(data.expiresAt);
      setShowVerificationModal(true);
      toast.success('Código de verificação enviado para seu email!');
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast.error(error.message || 'Erro ao solicitar resgate. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = async () => {
    try {
      // Atualizar status da withdrawal para pending
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'pending' })
        .eq('id', pendingWithdrawalId);

      if (error) throw error;

      toast.success('Solicitação de resgate enviada com sucesso!');
      setHasWithdrawal(true);
      setWithdrawalStatus('pending');
      await checkExistingWithdrawal();
    } catch (error) {
      console.error('Erro ao finalizar resgate:', error);
      toast.error('Erro ao processar resgate. Contate o suporte.');
    }
  };

  if (!isOwner) {
    return null;
  }

  if (hasWithdrawal) {
    return (
      <>
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
                {withdrawalStatus === 'pending_manual' && 'Seu resgate está aguardando processamento manual.'}
                {withdrawalStatus === 'approved' && 'Seu resgate foi aprovado e será processado em breve!'}
                {withdrawalStatus === 'rejected' && (
                  <>
                    Seu resgate foi rejeitado. Motivo: {withdrawalData?.rejection_reason}
                    {withdrawalData?.rejection_reason?.includes('[dados_incorretos]') && (
                      <p className="mt-2 font-medium">Você pode corrigir os dados e solicitar novamente.</p>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {withdrawalStatus === 'rejected' && withdrawalData?.chat_active && (
          <WithdrawalChat 
            withdrawalId={withdrawalId}
            chatActive={withdrawalData.chat_active}
            chatClosedAt={withdrawalData.chat_closed_at}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Solicitar Resgate via TED
          </CardTitle>
          <CardDescription>
            Seu projeto atingiu a meta! Solicite o resgate via transferência bancária (TED).
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
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <strong>⏱️ Prazo de processamento:</strong> A análise e liberação do resgate será realizada em até 7 dias úteis após a aprovação.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do Titular *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={bankData.cpf}
              onChange={(e) => {
                setBankData({ ...bankData, cpf: formatCPF(e.target.value) });
              }}
              maxLength={14}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_code">Código do Banco *</Label>
              <Input
                id="bank_code"
                placeholder="001"
                value={bankData.bank_code}
                onChange={(e) => setBankData({ ...bankData, bank_code: e.target.value.replace(/\D/g, '') })}
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo de Conta *</Label>
              <Select
                value={bankData.account_type}
                onValueChange={(value: 'checking' | 'savings') => setBankData({ ...bankData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Agência *</Label>
              <Input
                id="branch"
                placeholder="0001"
                value={bankData.branch}
                onChange={(e) => setBankData({ ...bankData, branch: e.target.value.replace(/\D/g, '') })}
                maxLength={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_check_digit">Dígito da Agência</Label>
              <Input
                id="branch_check_digit"
                placeholder="0"
                value={bankData.branch_check_digit}
                onChange={(e) => setBankData({ ...bankData, branch_check_digit: e.target.value.replace(/\D/g, '') })}
                maxLength={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Número da Conta *</Label>
              <Input
                id="account"
                placeholder="12345"
                value={bankData.account}
                onChange={(e) => setBankData({ ...bankData, account: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_check_digit">Dígito da Conta *</Label>
              <Input
                id="account_check_digit"
                placeholder="6"
                value={bankData.account_check_digit}
                onChange={(e) => setBankData({ ...bankData, account_check_digit: e.target.value })}
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Dados do titular:
            </p>
            <div className="space-y-1 text-sm bg-muted p-3 rounded">
              <p><strong>Nome:</strong> {profile?.nome} {profile?.sobrenome}</p>
              <p><strong>E-mail:</strong> {user?.email}</p>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Após a aprovação, a transferência via TED será processada em até 7 dias úteis.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Solicitar Resgate'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    <WithdrawalVerificationModal
      open={showVerificationModal}
      onClose={() => setShowVerificationModal(false)}
      withdrawalId={pendingWithdrawalId}
      expiresAt={verificationExpiresAt}
      onSuccess={handleVerificationSuccess}
    />

    <WithdrawalResponsibilityModal
      isOpen={showResponsibilityModal}
      onClose={() => {
        setShowResponsibilityModal(false);
        setLoading(false);
      }}
      onConfirm={handleResponsibilityConfirmed}
    />
    </>
  );
};
