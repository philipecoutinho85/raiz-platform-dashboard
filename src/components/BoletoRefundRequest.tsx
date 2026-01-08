import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatToBrasilia } from '@/lib/dateUtils';
import { brazilianBanks } from '@/lib/brazilianBanks';
import { validateCPF, formatCPF } from '@/lib/cpfValidator';
import { validateCNPJ, formatCNPJ, validateCPForCNPJ, formatCPForCNPJ } from '@/lib/cnpjValidator';

interface BoletoPurchase {
  id: string;
  amount: number;
  price: number;
  created_at: string;
  updated_at: string;
  pagarme_transaction_id: string | null;
}

interface ExistingRefund {
  id: string;
  transaction_id: string;
  status: string;
}

const BoletoRefundRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<BoletoPurchase[]>([]);
  const [existingRefunds, setExistingRefunds] = useState<ExistingRefund[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingPurchases(true);

    try {
      // Fetch boleto purchases that are paid
      const { data: purchasesData } = await supabase
        .from('token_purchases')
        .select('id, amount, price, created_at, updated_at, pagarme_transaction_id')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .eq('payment_type', 'boleto')
        .order('created_at', { ascending: false });

      // Fetch existing refund requests to exclude already requested
      const { data: refundsData } = await supabase
        .from('refund_requests')
        .select('id, transaction_id, status')
        .eq('user_id', user.id);

      setPurchases(purchasesData || []);
      setExistingRefunds(refundsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Filter out purchases that already have refund requests
  const availablePurchases = purchases.filter(purchase => {
    return !existingRefunds.some(refund => refund.transaction_id === purchase.id);
  });

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCPForCNPJ(value);
    setCpfCnpj(formatted);
  };

  const isFormValid = () => {
    if (!selectedPurchase) return false;
    if (reason.length < 20) return false;
    if (!accountHolder.trim()) return false;
    if (!validateCPForCNPJ(cpfCnpj)) return false;
    if (!bankName) return false;
    if (!agency.trim()) return false;
    if (!accountNumber.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !isFormValid()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive"
      });
      return;
    }

    if (reason.length < 20) {
      toast({
        title: "Motivo muito curto",
        description: "O motivo deve ter pelo menos 20 caracteres.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const purchase = purchases.find(p => p.id === selectedPurchase);
      if (!purchase) return;

      // Get bank info
      const selectedBank = brazilianBanks.find(b => b.code === bankName);

      const { data: refundData, error } = await supabase
        .from('refund_requests')
        .insert({
          user_id: user.id,
          transaction_id: purchase.id,
          amount: purchase.price,
          reason: reason,
          status: 'solicitado',
          bank_account_holder: accountHolder.trim(),
          bank_cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
          bank_name: selectedBank ? `${selectedBank.code} - ${selectedBank.name}` : bankName,
          bank_account_agency: agency.trim(),
          bank_account_number: accountNumber.trim(),
          bank_account_type: accountType
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-boleto-refund-email', {
          body: {
            type: 'request_confirmation',
            refundId: refundData.id
          }
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      // Notify admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, sobrenome')
          .eq('id', user.id)
          .single();

        const userName = profile ? `${profile.nome} ${profile.sobrenome}` : 'Usuário';

        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          title: 'Nova solicitação de reembolso de boleto',
          message: `${userName} solicitou reembolso de R$ ${purchase.price.toFixed(2)} via boleto`,
          type: 'refund_request',
          related_id: refundData.id
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: "Solicitação enviada!",
        description: "Você receberá um e-mail de confirmação. Prazo de análise: 5 dias úteis.",
      });

      // Reset form
      setSelectedPurchase('');
      setReason('');
      setAccountHolder('');
      setCpfCnpj('');
      setBankName('');
      setAgency('');
      setAccountNumber('');
      setAccountType('checking');
      fetchData();
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPurchaseData = purchases.find(p => p.id === selectedPurchase);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Reembolso de Boleto
        </CardTitle>
        <CardDescription>
          Solicite o reembolso de pagamentos realizados via boleto bancário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Reembolsos de boleto são processados em até 5 dias úteis após aprovação. 
            O valor será transferido para a conta bancária informada.
          </AlertDescription>
        </Alert>

        {loadingPurchases ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : availablePurchases.length === 0 ? (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há pagamentos de boleto disponíveis para reembolso.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Transaction Selection */}
            <div className="space-y-2">
              <Label>Selecione a transação de boleto *</Label>
              <Select value={selectedPurchase} onValueChange={setSelectedPurchase}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma transação" />
                </SelectTrigger>
                <SelectContent>
                  {availablePurchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.amount} tokens • R$ {purchase.price.toFixed(2)} • {formatToBrasilia(purchase.created_at, "dd/MM/yyyy 'às' HH:mm")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPurchaseData && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Valor:</strong> R$ {selectedPurchaseData.price.toFixed(2)}</p>
                <p><strong>Tokens:</strong> {selectedPurchaseData.amount}</p>
                <p><strong>Data da compra:</strong> {formatToBrasilia(selectedPurchaseData.created_at, "dd/MM/yyyy 'às' HH:mm")}</p>
                {selectedPurchaseData.updated_at && (
                  <p><strong>Confirmação:</strong> {formatToBrasilia(selectedPurchaseData.updated_at, "dd/MM/yyyy 'às' HH:mm")}</p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo do reembolso * (mínimo 20 caracteres)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo da sua solicitação de reembolso..."
                rows={4}
                className={reason.length > 0 && reason.length < 20 ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/20 caracteres mínimos
              </p>
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg">Dados Bancários para Reembolso</h3>
              
              {/* Account Holder */}
              <div className="space-y-2">
                <Label>Nome do titular da conta *</Label>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nome completo conforme cadastro no banco"
                />
              </div>

              {/* CPF/CNPJ */}
              <div className="space-y-2">
                <Label>CPF ou CNPJ do titular *</Label>
                <Input
                  value={cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                />
                {cpfCnpj && !validateCPForCNPJ(cpfCnpj) && (
                  <p className="text-xs text-destructive">CPF/CNPJ inválido</p>
                )}
              </div>

              {/* Bank Selection */}
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {brazilianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.code} - {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agency and Account */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agência *</Label>
                  <Input
                    value={agency}
                    onChange={(e) => setAgency(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número da conta *</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label>Tipo de conta *</Label>
                <RadioGroup
                  value={accountType}
                  onValueChange={(value) => setAccountType(value as 'checking' | 'savings')}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="checking" id="checking" />
                    <Label htmlFor="checking" className="font-normal cursor-pointer">
                      Conta Corrente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="savings" id="savings" />
                    <Label htmlFor="savings" className="font-normal cursor-pointer">
                      Conta Poupança
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Solicitar Reembolso
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoletoRefundRequest;
