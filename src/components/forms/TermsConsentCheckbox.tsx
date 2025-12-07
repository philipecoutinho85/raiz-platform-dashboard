import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface TermsConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

const TermsConsentCheckbox = ({ checked, onCheckedChange, error }: TermsConsentCheckboxProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border">
        <Checkbox
          id="terms-consent"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="terms-consent" className="text-sm cursor-pointer">
            Confirmo que li e aceito os{' '}
            <Link to="/terms" className="text-raiz-primary hover:underline font-medium">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacy" className="text-raiz-primary hover:underline font-medium">
              Política de Privacidade
            </Link>
            . *
          </Label>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm ml-1">{error}</p>
      )}
    </div>
  );
};

export default TermsConsentCheckbox;