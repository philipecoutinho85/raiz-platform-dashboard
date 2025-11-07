import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useReauthentication } from '@/hooks/useReauthentication';
import { ReauthenticationModal } from '@/components/ReauthenticationModal';
import Admin2FASetup from '@/components/Admin2FASetup';

const Admin2FAManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isReauthModalOpen, pendingAction, requireReauth, handleReauthSuccess, handleReauthClose } = useReauthentication();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    check2FAStatus();
  }, [user]);

  const check2FAStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('admin_2fa')
        .select('is_enabled')
        .eq('user_id', user.id)
        .single();

      setIs2FAEnabled(data?.is_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const performDisable2FA = async () => {
    try {
      const { error } = await supabase
        .from('admin_2fa')
        .update({ is_enabled: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Enviar alerta de 2FA desativado
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nome')
        .eq('id', user?.id)
        .single();

      if (profile) {
        await supabase.functions.invoke('send-admin-alert', {
          body: {
            type: '2fa_disabled',
            adminEmail: profile.email,
            adminName: profile.nome,
          }
        });
      }

      toast({
        title: '2FA Desativado',
        description: 'A autenticação de dois fatores foi desativada.',
        variant: 'destructive'
      });

      setIs2FAEnabled(false);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desativar 2FA.',
        variant: 'destructive'
      });
    }
  };

  const handleDisable2FA = () => {
    requireReauth(
      performDisable2FA,
      'Desativar autenticação de dois fatores (2FA)'
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Autenticação de Dois Fatores (2FA)
              </CardTitle>
              <CardDescription>
                Gerencie sua segurança adicional
              </CardDescription>
            </div>
            {is2FAEnabled ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Ativado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Desativado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
            Você precisará fornecer um código de verificação além da sua senha ao fazer login.
          </p>

          <div className="flex gap-2">
            {is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Desativar 2FA
              </Button>
            ) : (
              <Button
                onClick={() => setShowSetup(true)}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Ativar 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Admin2FASetup
        isOpen={showSetup}
        onClose={() => {
          setShowSetup(false);
          check2FAStatus();
        }}
        isRequired={false}
      />

      <ReauthenticationModal
        isOpen={isReauthModalOpen}
        onClose={handleReauthClose}
        onSuccess={handleReauthSuccess}
        actionDescription={pendingAction?.description || ''}
      />
    </>
  );
};

export default Admin2FAManagement;
