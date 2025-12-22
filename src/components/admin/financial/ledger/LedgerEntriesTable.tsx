import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, CreditCard, FileText, Clock } from 'lucide-react';

interface LedgerEntry {
  id: string;
  contribution_id: string | null;
  project_id: string | null;
  creator_id: string;
  supporter_id: string;
  token_amount: number;
  gross_amount: number;
  payment_method: string;
  stripe_fee_percentage: number;
  stripe_fee_fixed: number;
  stripe_fee_total: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  net_amount_creator: number;
  net_amount_platform: number;
  financial_status: string;
  grace_period_ends_at: string | null;
  released_at: string | null;
  created_at: string;
  is_deleted: boolean;
}

interface LedgerEntriesTableProps {
  entries: LedgerEntry[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    grace_period: { label: 'Em Carência', variant: 'secondary' },
    released: { label: 'Liberado', variant: 'default' },
    withdrawal_pending: { label: 'Saque Solicitado', variant: 'outline' },
    transfer_pending: { label: 'Transferindo', variant: 'outline' },
    transfer_completed: { label: 'Transferido', variant: 'default' },
    refunded: { label: 'Estornado', variant: 'destructive' }
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    card_national: 'Cartão Nacional',
    card_international: 'Cartão Internacional',
    boleto: 'Boleto',
    pix: 'PIX'
  };
  return labels[method] || method;
};

const getPaymentMethodIcon = (method: string) => {
  if (method.startsWith('card')) return <CreditCard className="h-4 w-4" />;
  if (method === 'boleto') return <FileText className="h-4 w-4" />;
  return <CreditCard className="h-4 w-4" />;
};

export function LedgerEntriesTable({ entries, loading }: LedgerEntriesTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Nenhum registro encontrado no ledger
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">Taxa Stripe</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead className="text-right">Líquido Criador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Carência</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className={entry.is_deleted ? 'opacity-50' : ''}>
                <TableCell className="font-medium">
                  {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(entry.payment_method)}
                    <span className="text-sm">{getPaymentMethodLabel(entry.payment_method)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(entry.gross_amount)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  -{formatCurrency(entry.stripe_fee_total)}
                </TableCell>
                <TableCell className="text-right text-purple-600">
                  {entry.platform_fee_percentage}% ({formatCurrency(entry.platform_fee_amount)})
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  {formatCurrency(entry.net_amount_creator)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(entry.financial_status)}
                </TableCell>
                <TableCell>
                  {entry.financial_status === 'grace_period' && entry.grace_period_ends_at && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.grace_period_ends_at), 'dd/MM', { locale: ptBR })}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro Financeiro</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Registro</label>
                  <p className="text-sm font-mono">{selectedEntry.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data/Hora</label>
                  <p className="text-sm">
                    {format(new Date(selectedEntry.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Valores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Tokens</label>
                    <p className="text-lg font-bold">{selectedEntry.token_amount}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Valor Bruto</label>
                    <p className="text-lg font-bold">{formatCurrency(selectedEntry.gross_amount)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Taxas Stripe</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Percentual</label>
                    <p className="text-sm">{(selectedEntry.stripe_fee_percentage * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Taxa Fixa</label>
                    <p className="text-sm">{formatCurrency(selectedEntry.stripe_fee_fixed)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Total Stripe</label>
                    <p className="text-sm text-red-600 font-medium">{formatCurrency(selectedEntry.stripe_fee_total)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Comissão da Plataforma</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Percentual</label>
                    <p className="text-sm">{selectedEntry.platform_fee_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Valor</label>
                    <p className="text-sm text-purple-600 font-medium">{formatCurrency(selectedEntry.platform_fee_amount)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Valores Líquidos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <label className="text-sm text-muted-foreground">Líquido Criador</label>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedEntry.net_amount_creator)}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <label className="text-sm text-muted-foreground">Líquido Plataforma</label>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedEntry.net_amount_platform)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Status</h4>
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedEntry.financial_status)}
                  {selectedEntry.grace_period_ends_at && selectedEntry.financial_status === 'grace_period' && (
                    <span className="text-sm text-muted-foreground">
                      Libera em: {format(new Date(selectedEntry.grace_period_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                  {selectedEntry.released_at && (
                    <span className="text-sm text-muted-foreground">
                      Liberado em: {format(new Date(selectedEntry.released_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {selectedEntry.is_deleted && (
                <div className="border-t pt-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Este registro foi excluído</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
