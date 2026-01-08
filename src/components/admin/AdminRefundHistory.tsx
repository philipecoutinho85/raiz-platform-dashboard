import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatusHistory {
  id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string;
  notes: string | null;
  proof_url: string | null;
  created_at: string;
  admin_name?: string;
}

interface AdminRefundHistoryProps {
  refundId: string;
  requestedAt: string;
}

const AdminRefundHistory = ({ refundId, requestedAt }: AdminRefundHistoryProps) => {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchHistory = async () => {
    if (!refundId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('refund_status_history')
        .select('*')
        .eq('refund_request_id', refundId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch admin names for each history entry
        const adminIds = [...new Set(data.map(h => h.changed_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome')
          .in('id', adminIds);

        const enrichedHistory = data.map(h => ({
          ...h,
          admin_name: profiles?.find(p => p.id === h.changed_by)
            ? `${profiles.find(p => p.id === h.changed_by)?.nome} ${profiles.find(p => p.id === h.changed_by)?.sobrenome}`
            : 'Admin'
        }));

        setHistory(enrichedHistory);
      }
    } catch (error) {
      console.error('Error fetching refund history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && history.length === 0) {
      fetchHistory();
    }
  }, [expanded, refundId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'em_analise':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'realizado':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejeitado':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      solicitado: 'Solicitação Recebida',
      em_analise: 'Em Análise',
      aprovado: 'Reembolso Aprovado',
      realizado: 'Pagamento Realizado',
      completed: 'Pagamento Realizado',
      rejeitado: 'Solicitação Rejeitada',
      rejected: 'Solicitação Rejeitada',
    };
    return labels[status] || status;
  };

  const handleViewProof = async (proofUrl: string) => {
    try {
      const { data } = await supabase.storage
        .from('refund-proofs')
        .createSignedUrl(proofUrl, 3600);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between p-0 h-auto font-semibold"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Histórico de Status
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Initial request */}
              <div className="flex items-start gap-3 text-sm border-l-2 border-orange-500 pl-3 py-2">
                <Clock className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Solicitação Recebida</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(requestedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Status changes */}
              {history.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 text-sm border-l-2 pl-3 py-2 ${
                    item.new_status === 'rejeitado' || item.new_status === 'rejected'
                      ? 'border-red-500'
                      : item.new_status === 'realizado' || item.new_status === 'completed'
                      ? 'border-green-500'
                      : item.new_status === 'aprovado'
                      ? 'border-blue-500'
                      : 'border-yellow-500'
                  }`}
                >
                  {getStatusIcon(item.new_status)}
                  <div className="flex-1">
                    <p className="font-medium">{getStatusLabel(item.new_status)}</p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>por {item.admin_name}</span>
                    </div>
                    {item.proof_url && (
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 h-auto text-xs mt-1"
                        onClick={() => handleViewProof(item.proof_url!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver comprovante
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aguardando análise
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRefundHistory;