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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Coins, 
  ArrowUpCircle, 
  ArrowDownCircle,
  RefreshCw,
  User,
  Eye,
  TrendingUp,
  TrendingDown,
  Download,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserToken {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
}

interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  reference_id: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  project_title?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value * 5); // 1 token = R$ 5
};

export function TokenTrackingPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserToken | null>(null);
  const [userTransactions, setUserTransactions] = useState<TokenTransaction[]>([]);
  const [loadingUserTransactions, setLoadingUserTransactions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('user_tokens')
        .select('*')
        .order('balance', { ascending: false });

      if (tokensError) throw tokensError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email');

      if (profilesError) throw profilesError;

      // Fetch recent transactions
      const { data: txns, error: txnsError } = await supabase
        .from('token_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (txnsError) throw txnsError;

      // Fetch projects for reference
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title');

      if (projectsError) throw projectsError;

      // Create lookup maps
      const profilesMap = new Map(profiles?.map(p => [p.id, p]));
      const projectsMap = new Map(projects?.map(p => [p.id, p.title]));

      // Enrich user tokens
      const enrichedTokens: UserToken[] = (tokens || []).map(token => {
        const profile = profilesMap.get(token.user_id);
        return {
          ...token,
          user_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Usuário desconhecido',
          user_email: profile?.email || ''
        };
      });

      // Enrich transactions
      const enrichedTxns: TokenTransaction[] = (txns || []).map(txn => {
        const profile = profilesMap.get(txn.user_id);
        return {
          ...txn,
          user_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Usuário desconhecido',
          user_email: profile?.email || '',
          project_title: txn.reference_id ? projectsMap.get(txn.reference_id) || null : null
        };
      });

      setUserTokens(enrichedTokens);
      setTransactions(enrichedTxns);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de tokens',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    try {
      setLoadingUserTransactions(true);

      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch projects for reference
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title');

      const projectsMap = new Map(projects?.map(p => [p.id, p.title]));

      const enrichedTxns: TokenTransaction[] = (data || []).map(txn => ({
        ...txn,
        project_title: txn.reference_id ? projectsMap.get(txn.reference_id) || null : null
      }));

      setUserTransactions(enrichedTxns);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
    } finally {
      setLoadingUserTransactions(false);
    }
  };

  const handleViewUser = async (user: UserToken) => {
    setSelectedUser(user);
    await fetchUserTransactions(user.user_id);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'credit':
      case 'admin_credit':
      case 'refund':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'support':
      case 'debit':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Compra',
      credit: 'Crédito',
      admin_credit: 'Crédito Admin',
      refund: 'Reembolso',
      support: 'Apoio',
      debit: 'Débito'
    };
    return labels[type] || type;
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'credit':
      case 'admin_credit':
      case 'refund':
        return 'default' as const;
      case 'support':
      case 'debit':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const filteredTokens = userTokens.filter(token =>
    token.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(txn =>
    txn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTokens = userTokens.reduce((sum, u) => sum + u.balance, 0);
  const totalValue = totalTokens * 5; // R$ 5 per token

  const exportToCSV = () => {
    const headers = ['Usuário', 'Email', 'Saldo', 'Valor (R$)', 'Última Atualização'];
    const rows = filteredTokens.map(token => [
      token.user_name,
      token.user_email,
      token.balance.toString(),
      (token.balance * 5).toString(),
      format(new Date(token.updated_at), 'dd/MM/yyyy HH:mm')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokens-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
              <div className="p-2 bg-primary/10 rounded-lg">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Tokens</p>
                <p className="text-2xl font-bold">{totalTokens}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalTokens)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários com Tokens</p>
                <p className="text-2xl font-bold">{userTokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <History className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transações Recentes</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário ou email..."
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

      {/* Main Tabs */}
      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Saldos ({filteredTokens.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transações ({filteredTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Saldos de Tokens por Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{token.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {token.user_email}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{token.balance}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(token.balance)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(token.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(token)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Saldo Após</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {format(new Date(txn.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{txn.user_name}</p>
                            <p className="text-xs text-muted-foreground">{txn.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(txn.transaction_type)}
                            <Badge variant={getTransactionBadgeVariant(txn.transaction_type)}>
                              {getTransactionLabel(txn.transaction_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount > 0 ? '+' : ''}{txn.amount}
                        </TableCell>
                        <TableCell className="text-right">
                          {txn.balance_after}
                        </TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">
                          {txn.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Histórico de Tokens - {selectedUser?.user_name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      {selectedUser.balance}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Valor em R$</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedUser.balance)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total de Transações</p>
                    <p className="text-2xl font-bold">{userTransactions.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* User Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <p className="font-medium">{selectedUser.user_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedUser.user_email}</p>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div>
                <h4 className="font-medium mb-3">Histórico de Transações</h4>
                {loadingUserTransactions ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : userTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground p-4">Nenhuma transação encontrada</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {userTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(txn.transaction_type)}
                          <div>
                            <p className="font-medium text-sm">{getTransactionLabel(txn.transaction_type)}</p>
                            <p className="text-xs text-muted-foreground">{txn.description}</p>
                            {txn.project_title && (
                              <p className="text-xs text-primary">Projeto: {txn.project_title}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.amount > 0 ? '+' : ''}{txn.amount} tokens
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {txn.balance_after}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(txn.created_at), "dd/MM/yy HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
