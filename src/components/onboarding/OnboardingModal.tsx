import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, Heart, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSelectRole: (role: 'creator' | 'supporter') => void;
}

const OnboardingModal = ({ open, onClose, onSelectRole }: OnboardingModalProps) => {
  const [selectedRole, setSelectedRole] = useState<'creator' | 'supporter' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Como você quer usar a Raiz Token?
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => setSelectedRole('creator')}
            className={cn(
              "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all",
              selectedRole === 'creator'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {selectedRole === 'creator' && (
              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
            )}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Sou Criador</h3>
            <p className="text-sm text-muted-foreground text-center">
              Quero criar projetos e receber apoio da comunidade
            </p>
          </button>

          <button
            onClick={() => setSelectedRole('supporter')}
            className={cn(
              "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all",
              selectedRole === 'supporter'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {selectedRole === 'supporter' && (
              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
            )}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Sou Apoiador</h3>
            <p className="text-sm text-muted-foreground text-center">
              Quero apoiar projetos e acompanhar seu desenvolvimento
            </p>
          </button>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={onClose}>
            Pular por agora
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="gap-2"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
