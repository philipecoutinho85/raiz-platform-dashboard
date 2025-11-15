import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RejectWithdrawalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawalId: string | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  rejectionCategory: string;
  setRejectionCategory: (category: string) => void;
  onReject: () => void;
  onCancel: () => void;
  loading: boolean;
}

const RejectWithdrawalModal = ({ 
  isOpen, 
  onOpenChange, 
  withdrawalId,
  rejectionReason, 
  setRejectionReason,
  rejectionCategory,
  setRejectionCategory,
  onReject, 
  onCancel,
  loading
}: RejectWithdrawalModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Resgate</DialogTitle>
          <DialogDescription>
            Informe a categoria e o motivo da rejeição do resgate
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-category">Categoria da Rejeição *</Label>
            <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dados_incorretos">Dados Bancários Incorretos</SelectItem>
                <SelectItem value="documentacao_invalida">Documentação Inválida</SelectItem>
                <SelectItem value="suspeita_fraude">Suspeita de Fraude</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            {rejectionCategory === 'dados_incorretos' && (
              <p className="text-xs text-muted-foreground">
                ℹ️ O usuário poderá corrigir os dados e solicitar novamente
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo Detalhado *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explique o motivo da rejeição..."
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onReject}
              disabled={loading || !rejectionReason.trim() || !rejectionCategory}
            >
              {loading ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectWithdrawalModal;
