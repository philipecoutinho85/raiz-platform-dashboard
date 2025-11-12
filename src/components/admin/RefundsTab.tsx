import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';
import { formatToBrasilia } from '@/lib/dateUtils';

interface Refund {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  user_profile?: {
    nome: string;
    sobrenome: string;
    email: string;
  };
}

const RefundsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurity();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const { data: refundsData, error } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar profiles separadamente
      if (refundsData && refundsData.length > 0) {
        const userIds = [...new Set(refundsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome, email')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
        
        const refundsWithProfiles = refundsData.map(refund => ({
          ...refund,
          user_profile: profilesMap.get(refund.user_id)
        }));

        setRefunds(refundsWithProfiles as Refund[]);
      } else {
        setRefunds([]);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reembolsos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (refundId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      const refund = refunds.find(r => r.id === refundId);
      if (!refund) return;

      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      const { error } = await supabase
        .from('refunds')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', refundId);

      if (error) throw error;

      // Log admin action
      await logAdminAction(
        action === 'approve' ? 'approve_refund' : 'reject_refund',
        'refund',
        refundId,
        { amount: refund.amount, user_id: refund.user_id }
      );

      toast({
        title: "Sucesso",
        description: `Reembolso ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`,
      });

      fetchRefunds();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reembolso.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Gerenciar Reembolsos
            </CardTitle>
            <CardDescription>
              Aprovar ou rejeitar solicitações de reembolso
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRefunds}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {refunds.length === 0 ? (
          <div className="text-center py-8 text-raiz-secondary">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma solicitação de reembolso encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {refund.user_profile?.nome} {refund.user_profile?.sobrenome}
                      </span>
                      <span className="text-xs text-raiz-secondary">
                        {refund.user_profile?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{refund.amount} tokens</TableCell>
                  <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                  <TableCell>
                    {formatToBrasilia(refund.created_at)}
                  </TableCell>
                  <TableCell>{getStatusBadge(refund.status)}</TableCell>
                  <TableCell>
                    {refund.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleRefundAction(refund.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRefundAction(refund.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RefundsTab;
