import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface WithdrawalResponsibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const WithdrawalResponsibilityModal = ({
  isOpen,
  onClose,
  onConfirm,
}: WithdrawalResponsibilityModalProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (agreed) {
      onConfirm();
      setAgreed(false);
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Declaração de Responsabilidade do Titular
          </DialogTitle>
          <DialogDescription>
            Leia atentamente antes de prosseguir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Texto da declaração */}
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <p className="text-sm leading-relaxed">
              <strong>Eu declaro ser o titular da conta bancária que receberá os valores do projeto criado na plataforma.</strong>
            </p>
            
            <p className="text-sm leading-relaxed">
              Confirmo que <strong>todas as informações fornecidas são verdadeiras e inseridas por mim</strong>.
            </p>
            
            <p className="text-sm leading-relaxed">
              Estou ciente de que <strong>informações falsas, uso de CPF de terceiros, tentativa de fraude ou indução de terceiros a erro podem configurar crime</strong>, conforme os artigos <strong>299</strong> (falsidade ideológica), <strong>307</strong> (falsa identidade) e <strong>171</strong> (estelionato) do Código Penal brasileiro.
            </p>
            
            <p className="text-sm leading-relaxed font-semibold text-destructive">
              Assumo total responsabilidade civil e criminal pelas informações prestadas.
            </p>
          </div>

          {/* Checkbox de concordância */}
          <div className="flex items-start gap-3 p-4 border-2 border-primary rounded-lg bg-primary/5">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-1"
            />
            <Label
              htmlFor="agree"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Li e concordo com a Declaração de Responsabilidade. Confirmo que sou o titular da conta e que todas as informações prestadas são verdadeiras.
            </Label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!agreed}
            >
              Confirmar e Prosseguir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
