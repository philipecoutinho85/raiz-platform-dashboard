import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock } from 'lucide-react';

interface ReauthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription: string;
}

export const ReauthenticationModal = ({
  isOpen,
  onClose,
  onSuccess,
  actionDescription,
}: ReauthenticationModalProps) => {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!password) {
      toast({
        title: 'Senha obrigatória',
        description: 'Por favor, digite sua senha.',
        variant: 'destructive',
      });
      return;
    }

    if (!twoFactorCode) {
      toast({
        title: 'Código 2FA obrigatório',
        description: 'Por favor, digite o código de autenticação.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Reautenticar com senha
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('Usuário não encontrado');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha fornecida está incorreta.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar 2FA (simulado por enquanto - implementar TOTP real futuramente)
      const { data: twoFAData } = await supabase
        .from('admin_2fa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!twoFAData || !twoFAData.is_enabled) {
        toast({
          title: '2FA não configurado',
          description: 'Por favor, configure o 2FA antes de realizar esta ação.',
          variant: 'destructive',
        });
        return;
      }

      // Verificação básica do código (substituir por TOTP real)
      if (twoFactorCode.length !== 6) {
        toast({
          title: 'Código inválido',
          description: 'O código deve ter 6 dígitos.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Reautenticação bem-sucedida',
        description: 'Você pode prosseguir com a ação.',
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro na reautenticação:', error);
      toast({
        title: 'Erro na reautenticação',
        description: error.message || 'Ocorreu um erro ao verificar suas credenciais.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setTwoFactorCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-destructive" />
            <DialogTitle>Reautenticação Necessária</DialogTitle>
          </div>
          <DialogDescription>
            Para realizar esta ação sensível, precisamos confirmar sua identidade:
            <br />
            <strong className="text-foreground">{actionDescription}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="2fa">Código 2FA (6 dígitos)</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="2fa"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="pl-10 tracking-widest text-center text-lg"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isVerifying}>
            Cancelar
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? 'Verificando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
