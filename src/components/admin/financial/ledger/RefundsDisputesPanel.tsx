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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  FileText,
  Download,
  RotateCcw,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Refund {
  id: string;
  user_id: string;
  project_id: string | null;
  contribution_id: string | null;
  amount: number;
  reason: string;
  status: string;
  requested_by: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  // Enriched data
  user_name?: string;
  user_email?: string;
  project_title?: string;
  processor_name?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value); // 1 token = R$ 1
};

export function RefundsDisputesPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);

      // Fetch refunds
      const { data: refundsData, error: refundsError } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (refundsError) throw refundsError;

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

      // Create lookup maps
      const profilesMap = new Map(profiles?.map(p => [p.id, p]));
      const projectsMap = new Map(projects?.map(p => [p.id, p.title]));

      // Enrich refunds
      const enrichedRefunds: Refund[] = (refundsData || []).map(refund => {
        const userProfile = profilesMap.get(refund.user_id);
        const processorProfile = refund.processed_by ? profilesMap.get(refund.processed_by) : null;

        return {
          ...refund,
          user_name: userProfile ? `${userProfile.nome} ${userProfile.sobrenome}` : 'Usuário desconhecido',
          user_email: userProfile?.email || '',
          project_title: refund.project_id ? projectsMap.get(refund.project_id) || null : null,
          processor_name: processorProfile ? `${processorProfile.nome} ${processorProfile.sobrenome}` : null
        };
      });

      setRefunds(enrichedRefunds);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de reembolsos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      completed: { label: 'Concluído', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
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

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      project_failed: 'Projeto não atingiu meta',
      did_not_use: 'Não utilizou',
      duplicate: 'Cobrança duplicada',
      fraud: 'Fraude',
      other: 'Outro'
    };
    return labels[reason] || reason;
  };

  const handleProcessRefund = async (refundId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingRefund(true);

      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      const { error } = await supabase
        .from('refunds')
        .update({
          status: newStatus,
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) throw error;

      // If approving, also credit the tokens back
      if (action === 'approve' && selectedRefund) {
        // Update user tokens
        const { data: currentTokens, error: fetchError } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', selectedRefund.user_id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const newBalance = (currentTokens?.balance || 0) + selectedRefund.amount;

        const { error: updateError } = await supabase
          .from('user_tokens')
          .upsert({
            user_id: selectedRefund.user_id,
            balance: newBalance,
            updated_at: new Date().toISOString()
          });

        if (updateError) throw updateError;

        // Log the transaction
        const { error: txnError } = await supabase
          .from('token_transactions')
          .insert({
            user_id: selectedRefund.user_id,
            amount: selectedRefund.amount,
            balance_after: newBalance,
            transaction_type: 'refund',
            description: `Reembolso de ${selectedRefund.amount} tokens`,
            reference_id: refundId
          });

        if (txnError) throw txnError;
      }

      toast({
        title: 'Sucesso',
        description: action === 'approve' ? 'Reembolso aprovado' : 'Reembolso rejeitado'
      });

      setSelectedRefund(null);
      fetchRefunds();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao processar reembolso',
        variant: 'destructive'
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const filteredRefunds = refunds.filter(refund =>
    refund.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRefunds = filteredRefunds.filter(r => r.status === 'pending');
  const completedRefunds = filteredRefunds.filter(r => r.status === 'completed');
  const rejectedRefunds = filteredRefunds.filter(r => r.status === 'rejected');

  const totalPending = pendingRefunds.reduce((sum, r) => sum + r.amount, 0);
  const totalCompleted = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
  const totalRejected = rejectedRefunds.reduce((sum, r) => sum + r.amount, 0);

  const exportToCSV = () => {
    const headers = ['ID', 'Usuário', 'Email', 'Tokens', 'Valor (R$)', 'Motivo', 'Status', 'Data', 'Processado por', 'Data Processamento'];

    const rows = filteredRefunds.map(r => [
      r.id,
      r.user_name || '',
      r.user_email || '',
      r.amount.toString(),
      r.amount.toString(), // 1 token = R$ 1
      getReasonLabel(r.reason),
      r.status,
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
      r.processor_name || '-',
      r.processed_at ? format(new Date(r.processed_at), 'dd/MM/yyyy HH:mm') : '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reembolsos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingRefunds.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{completedRefunds.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalCompleted)}</p>
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
                <p className="text-2xl font-bold">{rejectedRefunds.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalRejected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold">{refunds.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(refunds.reduce((sum, r) => sum + r.amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {pendingRefunds.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingRefunds.length} reembolso(s) aguardando análise
                </p>
                <p className="text-sm text-yellow-700">
                  Valor total pendente: {formatCurrency(totalPending)}
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
            placeholder="Buscar por usuário, email ou projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={fetchRefunds}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredRefunds.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingRefunds.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({completedRefunds.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitados ({rejectedRefunds.length})
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'completed', 'rejected'].map((tab) => {
          const dataMap: Record<string, Refund[]> = {
            all: filteredRefunds,
            pending: pendingRefunds,
            completed: completedRefunds,
            rejected: rejectedRefunds
          };

          return (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  {dataMap[tab].length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      Nenhum reembolso encontrado
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataMap[tab].map((refund) => (
                            <TableRow key={refund.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-sm">{refund.user_name}</p>
                                    <p className="text-xs text-muted-foreground">{refund.user_email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {refund.project_title || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {refund.amount}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatCurrency(refund.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getReasonLabel(refund.reason)}</Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(refund.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(refund.created_at), "dd/MM/yy HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedRefund(refund)}
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

      {/* Detail Modal */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Detalhes do Reembolso
            </DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-start">
                {getStatusBadge(selectedRefund.status)}
                <p className="text-sm text-muted-foreground">
                  ID: {selectedRefund.id.slice(0, 8)}...
                </p>
              </div>

              {/* User Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Solicitante
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <p className="font-medium">{selectedRefund.user_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedRefund.user_email}</p>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Quantidade de Tokens</p>
                    <p className="text-2xl font-bold">{selectedRefund.amount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Valor em R$</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedRefund.amount)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Projeto</label>
                  <p>{selectedRefund.project_title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Motivo</label>
                  <p>{getReasonLabel(selectedRefund.reason)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Data da Solicitação</label>
                  <p>{format(new Date(selectedRefund.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                {selectedRefund.processed_at && (
                  <div>
                    <label className="text-sm text-muted-foreground">Processado em</label>
                    <p>
                      {format(new Date(selectedRefund.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      {selectedRefund.processor_name && ` por ${selectedRefund.processor_name}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions for pending refunds */}
              {selectedRefund.status === 'pending' && (
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleProcessRefund(selectedRefund.id, 'reject')}
                    disabled={processingRefund}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleProcessRefund(selectedRefund.id, 'approve')}
                    disabled={processingRefund}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Reembolso
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
