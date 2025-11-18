import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Refund } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RefundsTableProps {
  refunds: Refund[];
}

export const RefundsTable = ({ refunds }: RefundsTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };

    const labels: Record<string, string> = {
      completed: 'Completo',
      pending: 'Pendente',
      rejected: 'Rejeitado',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      project_failed: 'Projeto não financiado',
      project_cancelled: 'Projeto cancelado',
      user_request: 'Solicitação do usuário',
      admin_action: 'Ação administrativa',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Solicitado em</TableHead>
            <TableHead>Processado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {refunds.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum reembolso encontrado
              </TableCell>
            </TableRow>
          ) : (
            refunds.map((refund) => (
              <TableRow key={refund.id}>
                <TableCell className="font-mono text-xs">
                  {refund.id.substring(0, 8)}...
                </TableCell>
                <TableCell>{refund.user_name}</TableCell>
                <TableCell>{refund.project_title}</TableCell>
                <TableCell className="font-semibold">{refund.amount}</TableCell>
                <TableCell className="text-xs">{getReasonLabel(refund.reason)}</TableCell>
                <TableCell>{getStatusBadge(refund.status)}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(refund.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-xs">
                  {refund.processed_at
                    ? format(new Date(refund.processed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
