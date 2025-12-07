import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface LGPDConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const LGPDConsentCheckbox = ({ checked, onCheckedChange }: LGPDConsentCheckboxProps) => {
  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
          <strong>Aviso de Compartilhamento de Dados:</strong> Ao apoiar este projeto, autorizo que 
          meus dados (nome, e-mail e endereço, quando aplicável) sejam compartilhados com o criador 
          exclusivamente para comunicação e entrega de recompensas.
        </AlertDescription>
      </Alert>

      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border">
        <Checkbox
          id="lgpd-consent"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="lgpd-consent" className="text-sm font-medium cursor-pointer">
            Estou ciente e autorizo o compartilhamento *
          </Label>
          <p className="text-xs text-muted-foreground">
            Este consentimento é obrigatório para finalizar o apoio ao projeto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LGPDConsentCheckbox;