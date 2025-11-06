import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Admin2FASetupProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

const Admin2FASetup = ({ isOpen, onClose, isRequired = false }: Admin2FASetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');

  useEffect(() => {
    if (isOpen && step === 'setup') {
      generateSecret();
    }
  }, [isOpen, step]);

  const generateSecret = async () => {
    // Gerar segredo TOTP (simulado - em produção, use uma biblioteca adequada)
    const newSecret = Math.random().toString(36).substring(2, 18).toUpperCase();
    setSecret(newSecret);
    
    // Gerar QR Code (simulado - em produção, use qrcode.react ou similar)
    const appName = 'RaizToken';
    const userEmail = user?.email || '';
    const otpauth = `otpauth://totp/${appName}:${userEmail}?secret=${newSecret}&issuer=${appName}`;
    setQrCode(otpauth);
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Erro",
        description: "Digite um código de 6 dígitos válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Em produção, verificar o código TOTP aqui
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      await supabase.from('admin_2fa').upsert({
        user_id: user?.id,
        is_enabled: true,
        secret: secret,
        backup_codes: codes
      });

      toast({
        title: "2FA Configurado",
        description: "Autenticação de dois fatores ativada com sucesso!",
      });

      setStep('backup');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao configurar 2FA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (!isRequired) {
      onClose();
    }
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={isRequired ? undefined : onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-raiz-primary" />
            Configuração 2FA Obrigatória
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            {isRequired && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Como administrador, você precisa configurar a autenticação de dois fatores (2FA) para acessar o sistema.
                </p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Passo 1: Escaneie o QR Code</CardTitle>
                <CardDescription>
                  Use um aplicativo autenticador (Google Authenticator, Authy, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4 bg-white border rounded-lg">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <Key className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-raiz-secondary mb-2">Ou digite manualmente:</p>
                  <code className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                    {secret}
                  </code>
                </div>
                <Button onClick={() => setStep('verify')} className="w-full">
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'verify' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Passo 2: Verificar Código</CardTitle>
              <CardDescription>
                Digite o código de 6 dígitos do seu aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <Button 
                onClick={handleVerify} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? 'Verificando...' : 'Verificar e Ativar'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'backup' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Códigos de Backup</CardTitle>
              <CardDescription>
                Guarde estes códigos em local seguro. Você pode usá-los se perder acesso ao aplicativo autenticador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono text-center">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Estes códigos são exibidos apenas uma vez. Salve-os agora!
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                {isRequired ? 'Concluir e Acessar Sistema' : 'Concluir'}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Admin2FASetup;
