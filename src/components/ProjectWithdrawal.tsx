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
import { brazilianBanks, accountTypes } from '@/lib/brazilianBanks';

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

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
      case 'verification_pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      case 'pending_correction':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300';
      case 'pending_manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Em Análise';
      case 'verification_pending':
        return 'Aguardando Verificação';
      case 'pending_correction':
        return 'Correção Solicitada';
      case 'pending_manual':
        return 'Processamento Manual';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

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
          <CardContent className="space-y-4">
            {/* Badge de Status Visível */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeStyles(withdrawalStatus)}`}>
                {getStatusLabel(withdrawalStatus)}
              </span>
            </div>

            {/* Informações do Resgate */}
            {withdrawalData && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor solicitado:</span>
                  <span className="font-medium">R$ {withdrawalData.requested_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa administrativa:</span>
                  <span className="font-medium">- R$ {withdrawalData.admin_fee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground font-medium">Valor líquido:</span>
                  <span className="font-bold text-primary">R$ {withdrawalData.net_amount?.toFixed(2)}</span>
                </div>
                {withdrawalData.requested_at && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>Solicitado em:</span>
                    <span>{new Date(withdrawalData.requested_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Mensagem de Status */}
            <Alert className={
              withdrawalStatus === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
              withdrawalStatus === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
              withdrawalStatus === 'pending_correction' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
              ''
            }>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {withdrawalStatus === 'pending' && 'Sua solicitação de resgate está em análise. Você será notificado assim que for processada.'}
                {withdrawalStatus === 'verification_pending' && 'Aguardando verificação do código enviado por email.'}
                {withdrawalStatus === 'pending_manual' && 'Seu resgate está aguardando processamento manual pela equipe. Prazo: até 7 dias úteis.'}
                {withdrawalStatus === 'pending_correction' && 'O administrador solicitou correções nos dados bancários. Verifique as mensagens abaixo.'}
                {withdrawalStatus === 'approved' && (
                  <>
                    <span className="font-medium">✅ Seu resgate foi aprovado!</span>
                    <p className="mt-1">A transferência será processada em até 7 dias úteis.</p>
                  </>
                )}
                {withdrawalStatus === 'rejected' && (
                  <>
                    <span className="font-medium">❌ Seu resgate foi rejeitado.</span>
                    <p className="mt-1">Motivo: {withdrawalData?.rejection_reason || 'Não especificado'}</p>
                    {withdrawalData?.rejection_reason?.includes('[dados_incorretos]') && (
                      <p className="mt-2 font-medium">Você pode corrigir os dados e solicitar novamente.</p>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {(withdrawalStatus === 'rejected' || withdrawalStatus === 'pending_correction') && withdrawalData?.chat_active && (
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
                <p><strong>Taxa de saque (TED):</strong> R$ 3,67</p>
                <p className="text-lg font-bold"><strong>Valor líquido a receber:</strong> R$ {(netAmount - 3.67).toFixed(2)}</p>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Prazo de recebimento:</strong> Até 30 dias corridos após aprovação da prestação de contas.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="bank_code">Banco *</Label>
              <Select
                value={bankData.bank_code}
                onValueChange={(value) => setBankData({ ...bankData, bank_code: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[300px]">
                  {brazilianBanks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectContent className="bg-background z-50">
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
