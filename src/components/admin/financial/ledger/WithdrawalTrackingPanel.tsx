import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building2,
  Upload,
  FileText,
  Download,
  ArrowUpRight,
  AlertTriangle,
  Banknote
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  requested_amount: number;
  admin_fee: number;
  net_amount: number;
  status: string;
  bank_account: {
    bank?: string;
    bank_code?: string;
    agency?: string;
    account?: string;
    account_check_digit?: string;
    holder_name?: string;
    document?: string;
    email?: string;
  };
  pix_key?: string;
  pix_key_type?: string;
  payment_method: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Enriched data
  project_title?: string;
  user_name?: string;
  user_email?: string;
  reviewer_name?: string;
  has_receipt?: boolean;
  // Financial breakdown
  total_gross?: number;
  total_stripe_fees?: number;
  total_platform_fees?: number;
  total_net_creator?: number;
  // Financial breakdown by payment method
  boleto_gross?: number;
  boleto_stripe_fees?: number;
  card_gross?: number;
  card_stripe_fees?: number;
}

interface TransferReceipt {
  id: string;
  withdrawal_id: string;
  receipt_url: string;
  transfer_date: string;
  transfer_amount: number;
  bank_name: string | null;
  uploaded_at: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function WithdrawalTrackingPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [receipts, setReceipts] = useState<TransferReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    transfer_amount: 0,
    bank_name: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Fetch receipts
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('transfer_receipts')
        .select('*');

      if (receiptsError) throw receiptsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email');

      if (profilesError) throw profilesError;

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title');

      if (projectsError) throw projectsError;

      // Fetch financial data aggregated by project with payment method
      const { data: financialData, error: financialError } = await supabase
        .from('financial_ledger')
        .select('project_id, gross_amount, stripe_fee_total, platform_fee_amount, net_amount_creator, payment_method')
        .eq('is_deleted', false);

      if (financialError) throw financialError;

      // Aggregate financial data by project
      const financialByProject = new Map<string, {
        total_gross: number;
        total_stripe_fees: number;
        total_platform_fees: number;
        total_net_creator: number;
        boleto_gross: number;
        boleto_stripe_fees: number;
        card_gross: number;
        card_stripe_fees: number;
      }>();

      (financialData || []).forEach(entry => {
        if (!entry.project_id) return;
        const existing = financialByProject.get(entry.project_id) || {
          total_gross: 0,
          total_stripe_fees: 0,
          total_platform_fees: 0,
          total_net_creator: 0,
          boleto_gross: 0,
          boleto_stripe_fees: 0,
          card_gross: 0,
          card_stripe_fees: 0
        };
        
        const isBoleto = entry.payment_method === 'boleto';
        
        financialByProject.set(entry.project_id, {
          total_gross: existing.total_gross + Number(entry.gross_amount || 0),
          total_stripe_fees: existing.total_stripe_fees + Number(entry.stripe_fee_total || 0),
          total_platform_fees: existing.total_platform_fees + Number(entry.platform_fee_amount || 0),
          total_net_creator: existing.total_net_creator + Number(entry.net_amount_creator || 0),
          boleto_gross: existing.boleto_gross + (isBoleto ? Number(entry.gross_amount || 0) : 0),
          boleto_stripe_fees: existing.boleto_stripe_fees + (isBoleto ? Number(entry.stripe_fee_total || 0) : 0),
          card_gross: existing.card_gross + (!isBoleto ? Number(entry.gross_amount || 0) : 0),
          card_stripe_fees: existing.card_stripe_fees + (!isBoleto ? Number(entry.stripe_fee_total || 0) : 0)
        });
      });

      // Create lookup maps
      const profilesMap = new Map(profiles?.map(p => [p.id, p]));
      const projectsMap = new Map(projects?.map(p => [p.id, p.title]));
      const receiptsSet = new Set(receiptsData?.map(r => r.withdrawal_id));

      // Enrich withdrawals
      const enrichedWithdrawals: Withdrawal[] = (withdrawalsData || []).map(w => {
        const userProfile = profilesMap.get(w.user_id);
        const reviewerProfile = w.reviewed_by ? profilesMap.get(w.reviewed_by) : null;
        const bankAccount = typeof w.bank_account === 'object' && w.bank_account !== null 
          ? w.bank_account as Withdrawal['bank_account']
          : {};
        const projectFinancials = w.project_id ? financialByProject.get(w.project_id) : null;

        return {
          ...w,
          bank_account: bankAccount,
          project_title: w.project_id ? projectsMap.get(w.project_id) || null : null,
          user_name: userProfile ? `${userProfile.nome} ${userProfile.sobrenome}` : 'Usuário desconhecido',
          user_email: userProfile?.email || '',
          reviewer_name: reviewerProfile ? `${reviewerProfile.nome} ${reviewerProfile.sobrenome}` : null,
          has_receipt: receiptsSet.has(w.id),
          total_gross: projectFinancials?.total_gross || 0,
          total_stripe_fees: projectFinancials?.total_stripe_fees || 0,
          total_platform_fees: projectFinancials?.total_platform_fees || 0,
          total_net_creator: projectFinancials?.total_net_creator || 0,
          boleto_gross: projectFinancials?.boleto_gross || 0,
          boleto_stripe_fees: projectFinancials?.boleto_stripe_fees || 0,
          card_gross: projectFinancials?.card_gross || 0,
          card_stripe_fees: projectFinancials?.card_stripe_fees || 0
        };
      });

      setWithdrawals(enrichedWithdrawals);
      setReceipts(receiptsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de saques',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      pending_manual: { label: 'Aguardando Transferência', variant: 'secondary', icon: <ArrowUpRight className="h-3 w-3" /> },
      approved: { label: 'Aprovado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      processing: { label: 'Processando', variant: 'secondary', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
      paid: { label: 'Pago', variant: 'default', icon: <Banknote className="h-3 w-3" /> },
      rejected: { label: 'Rejeitado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleUploadReceipt = async () => {
    if (!selectedWithdrawal || !selectedFile) return;

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `receipts/${selectedWithdrawal.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transfer-receipts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('transfer-receipts')
        .getPublicUrl(fileName);

      // Create receipt record
      const { error: insertError } = await supabase
        .from('transfer_receipts')
        .insert({
          withdrawal_id: selectedWithdrawal.id,
          receipt_url: urlData.publicUrl,
          receipt_filename: selectedFile.name,
          transfer_date: formData.transfer_date,
          transfer_amount: formData.transfer_amount || selectedWithdrawal.net_amount,
          bank_name: formData.bank_name || selectedWithdrawal.bank_account?.bank,
          account_info: `Ag: ${selectedWithdrawal.bank_account?.agency} / CC: ${selectedWithdrawal.bank_account?.account}`,
          uploaded_by: user?.id
        });

      if (insertError) throw insertError;

      // Update withdrawal status to paid
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Comprovante anexado e saque marcado como pago'
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setFormData({
        transfer_date: format(new Date(), 'yyyy-MM-dd'),
        transfer_amount: 0,
        bank_name: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao anexar comprovante',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const openUploadDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setFormData({
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      transfer_amount: withdrawal.net_amount,
      bank_name: withdrawal.bank_account?.bank || ''
    });
    setUploadDialogOpen(true);
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    w.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWithdrawals = filteredWithdrawals.filter(w => ['pending', 'pending_manual', 'approved', 'processing'].includes(w.status));
  const paidWithdrawals = filteredWithdrawals.filter(w => w.status === 'paid');
  const rejectedWithdrawals = filteredWithdrawals.filter(w => w.status === 'rejected');

  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + Number(w.net_amount), 0);
  const totalPaid = paidWithdrawals.reduce((sum, w) => sum + Number(w.net_amount), 0);

  const exportToCSV = () => {
    const headers = ['Projeto', 'Criador', 'Email', 'Valor Solicitado', 'Taxa', 'Valor Líquido', 'Status', 'Data Solicitação', 'Data Pagamento', 'Comprovante'];
    const rows = filteredWithdrawals.map(w => [
      w.project_title || '',
      w.user_name || '',
      w.user_email || '',
      w.requested_amount.toString(),
      w.admin_fee.toString(),
      w.net_amount.toString(),
      w.status,
      format(new Date(w.requested_at), 'dd/MM/yyyy HH:mm'),
      w.paid_at ? format(new Date(w.paid_at), 'dd/MM/yyyy HH:mm') : '-',
      w.has_receipt ? 'Sim' : 'Não'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saques-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV gerado com sucesso'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Pagamento</p>
                <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Banknote className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold">{paidWithdrawals.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold">{rejectedWithdrawals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comprovantes</p>
                <p className="text-2xl font-bold">{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending transfers */}
      {pendingWithdrawals.filter(w => w.status === 'pending_manual' || w.status === 'approved').length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingWithdrawals.filter(w => w.status === 'pending_manual' || w.status === 'approved').length} saque(s) aguardando transferência manual
                </p>
                <p className="text-sm text-yellow-700">
                  Realize a transferência bancária e anexe o comprovante
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por criador, email ou projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingWithdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagos ({paidWithdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({filteredWithdrawals.length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'paid', 'all'].map((tab) => {
          const dataMap: Record<string, Withdrawal[]> = {
            pending: pendingWithdrawals,
            paid: paidWithdrawals,
            all: filteredWithdrawals
          };

          return (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  {dataMap[tab].length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      Nenhum saque encontrado
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Criador</TableHead>
                            <TableHead className="text-right">Detalhamento Financeiro</TableHead>
                            <TableHead>Dados Bancários</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Comprovante</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataMap[tab].map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell className="font-medium max-w-[150px] truncate">
                                {withdrawal.project_title || '-'}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{withdrawal.user_name}</p>
                                  <p className="text-xs text-muted-foreground">{withdrawal.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">
                                    Bruto: {formatCurrency(withdrawal.total_gross || withdrawal.requested_amount)}
                                  </div>
                                  <div className="text-xs text-red-500">
                                    Stripe: -{formatCurrency(withdrawal.total_stripe_fees || 0)}
                                  </div>
                                  <div className="text-xs text-orange-500">
                                    Admin: -{formatCurrency(withdrawal.admin_fee)}
                                  </div>
                                  <div className="font-bold text-green-600 border-t pt-1">
                                    {formatCurrency(withdrawal.net_amount)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span>
                                    {withdrawal.bank_account?.bank_code} | Ag: {withdrawal.bank_account?.agency} | CC: {withdrawal.bank_account?.account}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(withdrawal.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(withdrawal.requested_at), "dd/MM/yy HH:mm")}
                              </TableCell>
                              <TableCell>
                                {withdrawal.has_receipt ? (
                                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                                    <CheckCircle className="h-3 w-3" />
                                    Anexado
                                  </Badge>
                                ) : withdrawal.status === 'pending_manual' || withdrawal.status === 'approved' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openUploadDialog(withdrawal)}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Anexar
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedWithdrawal(withdrawal)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Upload Receipt Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Comprovante de Transferência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWithdrawal && (
              <div className="space-y-3">
                {/* Dados do Beneficiário */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Dados do Beneficiário</h4>
                  <p className="text-sm">
                    <strong>Projeto:</strong> {selectedWithdrawal.project_title}
                  </p>
                  <p className="text-sm">
                    <strong>Beneficiário:</strong> {selectedWithdrawal.bank_account?.holder_name}
                  </p>
                  <p className="text-sm">
                    <strong>CPF:</strong> {selectedWithdrawal.bank_account?.document}
                  </p>
                  <p className="text-sm">
                    <strong>Banco:</strong> {selectedWithdrawal.bank_account?.bank_code} - {selectedWithdrawal.bank_account?.bank}
                  </p>
                  <p className="text-sm">
                    <strong>Agência:</strong> {selectedWithdrawal.bank_account?.agency}
                  </p>
                  <p className="text-sm">
                    <strong>Conta:</strong> {selectedWithdrawal.bank_account?.account}-{selectedWithdrawal.bank_account?.account_check_digit}
                  </p>
                </div>

                {/* Detalhamento das Taxas */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm text-blue-800">Detalhamento das Taxas</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Bruto:</span>
                      <span className="font-medium">{formatCurrency(selectedWithdrawal.total_gross || selectedWithdrawal.requested_amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Taxa Stripe:</span>
                      <span>-{formatCurrency(selectedWithdrawal.total_stripe_fees || 0)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Taxa Admin (10%):</span>
                      <span>-{formatCurrency(selectedWithdrawal.admin_fee)}</span>
                    </div>
                  </div>
                </div>

                {/* Valor Final */}
                <div className="bg-green-100 p-4 rounded-lg border-2 border-green-500">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-800">VALOR A DEPOSITAR:</span>
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(selectedWithdrawal.net_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Data da Transferência</Label>
              <Input
                type="date"
                value={formData.transfer_date}
                onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Valor Transferido</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.transfer_amount}
                onChange={(e) => setFormData({ ...formData, transfer_amount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label>Comprovante (PDF ou Imagem)</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadReceipt} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Detail Modal */}
      <Dialog open={!!selectedWithdrawal && !uploadDialogOpen} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex justify-between items-start">
                {getStatusBadge(selectedWithdrawal.status)}
                <p className="text-sm text-muted-foreground">
                  ID: {selectedWithdrawal.id.slice(0, 8)}...
                </p>
              </div>

              {/* Project & User */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Projeto</label>
                  <p className="font-medium">{selectedWithdrawal.project_title}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Criador</label>
                  <p className="font-medium">{selectedWithdrawal.user_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.user_email}</p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Detalhamento Financeiro
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-sm text-muted-foreground">Valor Bruto Arrecadado</span>
                    <span className="font-medium">{formatCurrency(selectedWithdrawal.total_gross || selectedWithdrawal.requested_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b text-red-600">
                    <span className="text-sm">Taxa Stripe (processamento)</span>
                    <span className="font-medium">-{formatCurrency(selectedWithdrawal.total_stripe_fees || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b text-orange-600">
                    <span className="text-sm">Taxa Administrativa (10%)</span>
                    <span className="font-medium">-{formatCurrency(selectedWithdrawal.admin_fee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-green-50 rounded px-2 mt-2">
                    <span className="font-bold text-green-800">VALOR A DEPOSITAR</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(selectedWithdrawal.net_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Bruto</p>
                    <p className="text-sm font-bold">{formatCurrency(selectedWithdrawal.total_gross || selectedWithdrawal.requested_amount)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Stripe</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(selectedWithdrawal.total_stripe_fees || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Admin</p>
                    <p className="text-sm font-bold text-orange-600">-{formatCurrency(selectedWithdrawal.admin_fee)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Líquido</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(selectedWithdrawal.net_amount)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bank Account */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados Bancários
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Titular</label>
                    <p>{selectedWithdrawal.bank_account?.holder_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">CPF</label>
                    <p>{selectedWithdrawal.bank_account?.document}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Banco</label>
                    <p>{selectedWithdrawal.bank_account?.bank_code} - {selectedWithdrawal.bank_account?.bank}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Agência / Conta</label>
                    <p>{selectedWithdrawal.bank_account?.agency} / {selectedWithdrawal.bank_account?.account}-{selectedWithdrawal.bank_account?.account_check_digit}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Solicitado em:</span>
                  <span className="font-medium">
                    {format(new Date(selectedWithdrawal.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {selectedWithdrawal.reviewed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Analisado em:</span>
                    <span className="font-medium">
                      {format(new Date(selectedWithdrawal.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {selectedWithdrawal.reviewer_name && ` por ${selectedWithdrawal.reviewer_name}`}
                    </span>
                  </div>
                )}
                {selectedWithdrawal.paid_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4 text-green-500" />
                    <span>Pago em:</span>
                    <span className="font-medium">
                      {format(new Date(selectedWithdrawal.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              {/* Rejection reason */}
              {selectedWithdrawal.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Motivo da Rejeição:</strong> {selectedWithdrawal.rejection_reason}
                  </p>
                </div>
              )}

              {/* Action button for pending manual */}
              {(selectedWithdrawal.status === 'pending_manual' || selectedWithdrawal.status === 'approved') && !selectedWithdrawal.has_receipt && (
                <div className="border-t pt-4">
                  <Button onClick={() => openUploadDialog(selectedWithdrawal)} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Comprovante e Confirmar Pagamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
