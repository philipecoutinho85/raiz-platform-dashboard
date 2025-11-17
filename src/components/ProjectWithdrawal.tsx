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
  
  const [pixData, setPixData] = useState({
    pix_key: '',
    pix_key_type: 'cpf' as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
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

    if (!pixData.pix_key || !pixData.pix_key_type || !pixData.cpf) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar CPF digitado
    const cpfNumbers = pixData.cpf.replace(/\D/g, '');
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
        payment_method: 'pix',
        pix_key: pixData.pix_key,
        pix_key_type: pixData.pix_key_type,
        status: 'verification_pending',
        bank_account: {
          holder_name: `${profile?.nome} ${profile?.sobrenome}`,
          document: validatedCpf,
          email: user?.email
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
            Solicitar Resgate via PIX
          </CardTitle>
          <CardDescription>
            Seu projeto atingiu a meta! Solicite o resgate via PIX.
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
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ⚡ Resgate exclusivo via PIX
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Após a aprovação, o pagamento será processado automaticamente pelo Pagar.me
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do Titular *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={pixData.cpf}
              onChange={(e) => {
                setPixData({ ...pixData, cpf: formatCPF(e.target.value) });
              }}
              maxLength={14}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_key_type">Tipo de Chave PIX *</Label>
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
            <Label htmlFor="pix_key">Chave PIX *</Label>
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
              Após aprovação, o PIX será processado automaticamente pelo Pagar.me em até 1 dia útil.
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
