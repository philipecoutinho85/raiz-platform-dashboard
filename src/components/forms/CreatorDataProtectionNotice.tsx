import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const CreatorDataProtectionNotice = () => {
  return (
    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
      <Shield className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
        Proteção de Dados Pessoais
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm mt-2 space-y-2">
        <p>
          O criador é <strong>corresponsável</strong> pelo tratamento dos dados dos apoiadores. 
          Esses dados só podem ser usados para comunicação sobre o projeto e entregas.
        </p>
        <p>
          É <strong>proibido</strong> utilizar dados para fins comerciais ou externos. 
          O uso indevido pode resultar na <strong>suspensão da conta</strong>.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default CreatorDataProtectionNotice;