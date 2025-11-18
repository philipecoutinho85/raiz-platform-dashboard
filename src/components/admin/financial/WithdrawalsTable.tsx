import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Withdrawal } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
}

export const WithdrawalsTable = ({ withdrawals }: WithdrawalsTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      processing: 'outline',
    };

    const labels: Record<string, string> = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      processing: 'Processando',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Criador</TableHead>
            <TableHead>Valor Solicitado</TableHead>
            <TableHead>Taxa</TableHead>
            <TableHead>Valor Líquido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Solicitação</TableHead>
            <TableHead>Aprovação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Nenhum resgate encontrado
              </TableCell>
            </TableRow>
          ) : (
            withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-mono text-xs">
                  {withdrawal.id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {withdrawal.project_title}
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </TableCell>
                <TableCell>{withdrawal.creator_name}</TableCell>
                <TableCell>{formatCurrency(withdrawal.requested_amount)}</TableCell>
                <TableCell className="text-red-600">
                  {formatCurrency(withdrawal.admin_fee)}
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  {formatCurrency(withdrawal.net_amount)}
                </TableCell>
                <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(withdrawal.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-xs">
                  {withdrawal.reviewed_at
                    ? format(new Date(withdrawal.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
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
