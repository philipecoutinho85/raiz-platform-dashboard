import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

interface WithdrawalVerificationModalProps {
  open: boolean;
  onClose: () => void;
  withdrawalId: string;
  expiresAt: string;
  onSuccess: () => void;
}

export const WithdrawalVerificationModal = ({
  open,
  onClose,
  withdrawalId,
  expiresAt,
  onSuccess
}: WithdrawalVerificationModalProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && expiresAt) {
      // Calcular tempo restante
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0) {
          setError('Código expirado. Solicite um novo código.');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [open, expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (code.length !== 5) {
      setError('Digite o código de 5 dígitos');
      return;
    }

    if (timeLeft === 0) {
      setError('Código expirado. Solicite um novo código.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar código no banco
      const { data: codeData, error: fetchError } = await supabase
        .from('withdrawal_verification_codes')
        .select('*')
        .eq('withdrawal_id', withdrawalId)
        .eq('code', code)
        .is('used_at', null)
        .single();

      if (fetchError || !codeData) {
        setError('Código inválido');
        setLoading(false);
        return;
      }

      // Verificar se expirou
      const now = new Date();
      const expiry = new Date(codeData.expires_at);
      
      if (now > expiry) {
        setError('Código expirado. Solicite um novo código.');
        setLoading(false);
        return;
      }

      // Marcar código como usado
      const { error: updateError } = await supabase
        .from('withdrawal_verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Código verificado com sucesso!');
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCode(value);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificação de Código</DialogTitle>
          <DialogDescription>
            Digite o código de 5 dígitos enviado para seu email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {timeLeft > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Código expira em: {formatTime(timeLeft)}</span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="00000"
              value={code}
              onChange={handleCodeChange}
              className="text-center text-2xl tracking-widest"
              maxLength={5}
              disabled={loading || timeLeft === 0}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 5 || timeLeft === 0}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
