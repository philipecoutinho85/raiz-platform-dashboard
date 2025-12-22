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
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, FileCheck, Eye, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Withdrawal {
  id: string;
  project_id: string;
  user_id: string;
  net_amount: number;
  status: string;
  bank_account: {
    bank?: string;
    agency?: string;
    account?: string;
    holder_name?: string;
    cpf?: string;
  };
  created_at: string;
}

interface TransferReceipt {
  id: string;
  withdrawal_id: string;
  receipt_url: string;
  receipt_filename: string | null;
  transfer_date: string;
  transfer_amount: number;
  bank_name: string | null;
  uploaded_at: string;
  validated_at: string | null;
}

interface TransferReceiptsPanelProps {
  withdrawals: Withdrawal[];
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function TransferReceiptsPanel({ withdrawals, onRefresh }: TransferReceiptsPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    transfer_amount: '',
    bank_name: '',
    notes: ''
  });
  const [file, setFile] = useState<File | null>(null);

  // Filter withdrawals that are approved but not yet marked as transferred
  const pendingTransfers = withdrawals.filter(w => 
    w.status === 'approved' || w.status === 'processing'
  );

  const handleUpload = async () => {
    if (!selectedWithdrawal || !file || !user) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedWithdrawal.id}-${Date.now()}.${fileExt}`;
      const filePath = `transfer-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('backups')
        .getPublicUrl(filePath);

      // Insert receipt record
      const { error: insertError } = await supabase
        .from('transfer_receipts')
        .insert({
          withdrawal_id: selectedWithdrawal.id,
          receipt_url: urlData.publicUrl,
          receipt_filename: file.name,
          transfer_date: formData.transfer_date,
          transfer_amount: parseFloat(formData.transfer_amount) || selectedWithdrawal.net_amount,
          bank_name: formData.bank_name || null,
          uploaded_by: user.id,
          notes: formData.notes || null
        });

      if (insertError) throw insertError;

      // Update withdrawal status to paid
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Comprovante anexado e transferência confirmada'
      });

      setIsUploadOpen(false);
      setSelectedWithdrawal(null);
      setFile(null);
      setFormData({
        transfer_date: format(new Date(), 'yyyy-MM-dd'),
        transfer_amount: '',
        bank_name: '',
        notes: ''
      });
      onRefresh();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao anexar comprovante',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const openUploadDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setFormData({
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      transfer_amount: withdrawal.net_amount.toString(),
      bank_name: '',
      notes: ''
    });
    setIsUploadOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Transferências Pendentes de Comprovante
        </h4>
        <p className="text-sm text-amber-700 mt-1">
          Transferências sem comprovante permanecem como pendentes. 
          Anexe o comprovante bancário para marcar como concluída.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Transferências Aguardando Comprovante
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Todas as transferências possuem comprovante</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead>Dados Bancários</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransfers.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {format(new Date(withdrawal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{withdrawal.bank_account?.holder_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          CPF: {withdrawal.bank_account?.cpf || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{withdrawal.bank_account?.bank || '-'}</p>
                        <p className="text-muted-foreground">
                          Ag: {withdrawal.bank_account?.agency || '-'} | 
                          Cc: {withdrawal.bank_account?.account || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(withdrawal.net_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Aguardando Comprovante</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => openUploadDialog(withdrawal)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Anexar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Comprovante de Transferência</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Beneficiário:</strong> {selectedWithdrawal.bank_account?.holder_name}
                </p>
                <p className="text-sm">
                  <strong>Valor:</strong> {formatCurrency(selectedWithdrawal.net_amount)}
                </p>
              </div>

              <div>
                <Label>Data da Transferência</Label>
                <Input
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Valor Transferido</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.transfer_amount}
                  onChange={(e) => setFormData({ ...formData, transfer_amount: e.target.value })}
                />
              </div>

              <div>
                <Label>Banco Origem</Label>
                <Input
                  placeholder="Ex: Banco do Brasil"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Comprovante (PDF ou Imagem)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Notas adicionais sobre a transferência..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleUpload} 
                className="w-full"
                disabled={!file || uploading}
              >
                {uploading ? 'Enviando...' : 'Confirmar Transferência'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
