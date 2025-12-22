import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, FileText, Smartphone, AlertTriangle } from 'lucide-react';

interface StripeFeeConfig {
  id: string;
  payment_method: string;
  percentage_fee: number;
  fixed_fee: number;
  additional_percentage: number;
  is_enabled: boolean;
  disabled_reason: string | null;
  description: string | null;
}

interface StripeFeeConfigTableProps {
  configs: StripeFeeConfig[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'card_national':
    case 'card_international':
      return <CreditCard className="h-4 w-4" />;
    case 'boleto':
      return <FileText className="h-4 w-4" />;
    case 'pix':
      return <Smartphone className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const getMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    card_national: 'Cartão Nacional',
    card_international: 'Cartão Internacional',
    boleto: 'Boleto',
    pix: 'PIX'
  };
  return labels[method] || method;
};

// Calcular exemplo de taxa para R$ 100
const calculateExampleFee = (config: StripeFeeConfig) => {
  const amount = 100;
  const percentage = config.percentage_fee + (config.additional_percentage || 0);
  const fee = (amount * percentage) + config.fixed_fee;
  return fee;
};

export function StripeFeeConfigTable({ configs }: StripeFeeConfigTableProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">Custos Operacionais do Stripe</h4>
        <p className="text-sm text-blue-700 mt-1">
          Estas são as taxas reais do Stripe aplicadas a cada transação. Os valores são calculados automaticamente
          e impactam diretamente o valor líquido do criador.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método de Pagamento</TableHead>
              <TableHead className="text-right">Taxa Percentual</TableHead>
              <TableHead className="text-right">Taxa Fixa</TableHead>
              <TableHead className="text-right">Adicional</TableHead>
              <TableHead className="text-right">Ex: R$ 100</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id} className={!config.is_enabled ? 'opacity-60' : ''}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(config.payment_method)}
                    <div>
                      <p className="font-medium">{getMethodLabel(config.payment_method)}</p>
                      {config.description && (
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {(config.percentage_fee * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(config.fixed_fee)}
                </TableCell>
                <TableCell className="text-right">
                  {config.additional_percentage > 0 
                    ? `+${(config.additional_percentage * 100).toFixed(2)}%` 
                    : '-'}
                </TableCell>
                <TableCell className="text-right text-red-600 font-medium">
                  -{formatCurrency(calculateExampleFee(config))}
                </TableCell>
                <TableCell>
                  {config.is_enabled ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Desabilitado
                      </Badge>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">PIX Desabilitado</h4>
            <p className="text-sm text-amber-700 mt-1">
              O Stripe ainda não liberou PIX como método de pagamento no Brasil. 
              O sistema está preparado para quando este método for disponibilizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
