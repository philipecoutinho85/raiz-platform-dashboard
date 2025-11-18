import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TokenPurchase } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchasesTableProps {
  purchases: TokenPurchase[];
}

export const PurchasesTable = ({ purchases }: PurchasesTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };

    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      bank_slip: 'Boleto',
    };
    return labels[method] || method;
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
            <TableHead>Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Valor (R$)</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>ID Pagar.me</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Nenhuma compra encontrada
              </TableCell>
            </TableRow>
          ) : (
            purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-mono text-xs">
                  {purchase.id.substring(0, 8)}...
                </TableCell>
                <TableCell>{purchase.user_name}</TableCell>
                <TableCell className="text-xs">{purchase.user_email}</TableCell>
                <TableCell className="font-semibold">{purchase.amount}</TableCell>
                <TableCell>{formatCurrency(purchase.price)}</TableCell>
                <TableCell>{getPaymentMethodLabel(purchase.payment_method)}</TableCell>
                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(purchase.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {purchase.pagarme_transaction_id?.substring(0, 12) || 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
