import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CheckCircle, AlertTriangle, Clock, FileCheck } from 'lucide-react';

interface BankReconciliation {
  id: string;
  reconciliation_date: string;
  stripe_expected_amount: number;
  stripe_transaction_count: number;
  bank_received_amount: number | null;
  bank_transaction_count: number | null;
  status: string;
  divergence_amount: number | null;
  divergence_reason: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface BankReconciliationPanelProps {
  reconciliations: BankReconciliation[];
  onCreateReconciliation: (data: Partial<BankReconciliation>) => Promise<void>;
  onUpdateReconciliation: (id: string, data: Partial<BankReconciliation>) => Promise<void>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'reconciled':
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Conciliado
        </Badge>
      );
    case 'divergent':
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Divergente
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>
      );
  }
};

export function BankReconciliationPanel({
  reconciliations,
  onCreateReconciliation,
  onUpdateReconciliation
}: BankReconciliationPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<BankReconciliation | null>(null);
  const [formData, setFormData] = useState({
    reconciliation_date: format(new Date(), 'yyyy-MM-dd'),
    stripe_expected_amount: '',
    stripe_transaction_count: '',
    bank_received_amount: '',
    bank_transaction_count: ''
  });
  const [resolveData, setResolveData] = useState({
    status: 'reconciled',
    divergence_amount: '',
    divergence_reason: '',
    resolution_notes: ''
  });

  const handleCreate = async () => {
    await onCreateReconciliation({
      reconciliation_date: formData.reconciliation_date,
      stripe_expected_amount: parseFloat(formData.stripe_expected_amount) || 0,
      stripe_transaction_count: parseInt(formData.stripe_transaction_count) || 0,
      bank_received_amount: formData.bank_received_amount ? parseFloat(formData.bank_received_amount) : null,
      bank_transaction_count: formData.bank_transaction_count ? parseInt(formData.bank_transaction_count) : null
    });
    setIsCreateOpen(false);
    setFormData({
      reconciliation_date: format(new Date(), 'yyyy-MM-dd'),
      stripe_expected_amount: '',
      stripe_transaction_count: '',
      bank_received_amount: '',
      bank_transaction_count: ''
    });
  };

  const handleResolve = async () => {
    if (!selectedReconciliation) return;
    
    await onUpdateReconciliation(selectedReconciliation.id, {
      status: resolveData.status as 'pending' | 'reconciled' | 'divergent',
      divergence_amount: resolveData.divergence_amount ? parseFloat(resolveData.divergence_amount) : null,
      divergence_reason: resolveData.divergence_reason || null,
      resolution_notes: resolveData.resolution_notes || null
    });
    
    setIsResolveOpen(false);
    setSelectedReconciliation(null);
    setResolveData({
      status: 'reconciled',
      divergence_amount: '',
      divergence_reason: '',
      resolution_notes: ''
    });
  };

  const pendingCount = reconciliations.filter(r => r.status === 'pending').length;
  const divergentCount = reconciliations.filter(r => r.status === 'divergent').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Conciliação Bancária</h3>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pendente(s)</Badge>
          )}
          {divergentCount > 0 && (
            <Badge variant="destructive">{divergentCount} divergente(s)</Badge>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conciliação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Conciliação Bancária</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data da Conciliação</Label>
                <Input
                  type="date"
                  value={formData.reconciliation_date}
                  onChange={(e) => setFormData({ ...formData, reconciliation_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Esperado (Stripe)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.stripe_expected_amount}
                    onChange={(e) => setFormData({ ...formData, stripe_expected_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Qtd. Transações (Stripe)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.stripe_transaction_count}
                    onChange={(e) => setFormData({ ...formData, stripe_transaction_count: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Recebido (Banco)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.bank_received_amount}
                    onChange={(e) => setFormData({ ...formData, bank_received_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Qtd. Transações (Banco)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.bank_transaction_count}
                    onChange={(e) => setFormData({ ...formData, bank_transaction_count: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Stripe (Esperado)</TableHead>
                <TableHead className="text-right">Banco (Recebido)</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma conciliação registrada
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((rec) => {
                  const difference = rec.bank_received_amount !== null 
                    ? rec.bank_received_amount - rec.stripe_expected_amount 
                    : null;
                  
                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        {format(new Date(rec.reconciliation_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{formatCurrency(rec.stripe_expected_amount)}</p>
                          <p className="text-xs text-muted-foreground">{rec.stripe_transaction_count} transações</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.bank_received_amount !== null ? (
                          <div>
                            <p className="font-medium">{formatCurrency(rec.bank_received_amount)}</p>
                            <p className="text-xs text-muted-foreground">{rec.bank_transaction_count || 0} transações</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {difference !== null ? (
                          <span className={difference === 0 ? 'text-green-600' : 'text-red-600'}>
                            {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                      <TableCell>
                        {rec.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReconciliation(rec);
                              setIsResolveOpen(true);
                            }}
                          >
                            <FileCheck className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Conciliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={resolveData.status}
                onValueChange={(value) => setResolveData({ ...resolveData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reconciled">Conciliado</SelectItem>
                  <SelectItem value="divergent">Divergente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resolveData.status === 'divergent' && (
              <>
                <div>
                  <Label>Valor da Divergência</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={resolveData.divergence_amount}
                    onChange={(e) => setResolveData({ ...resolveData, divergence_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Motivo da Divergência</Label>
                  <Textarea
                    placeholder="Descreva o motivo da divergência..."
                    value={resolveData.divergence_reason}
                    onChange={(e) => setResolveData({ ...resolveData, divergence_reason: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Notas de Resolução</Label>
              <Textarea
                placeholder="Notas adicionais sobre a resolução..."
                value={resolveData.resolution_notes}
                onChange={(e) => setResolveData({ ...resolveData, resolution_notes: e.target.value })}
              />
            </div>

            <Button onClick={handleResolve} className="w-full">
              Confirmar Resolução
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
