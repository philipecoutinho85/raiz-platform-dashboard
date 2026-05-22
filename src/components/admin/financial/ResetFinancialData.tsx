import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Shield, Lock } from 'lucide-react';

export const ResetFinancialData = () => {
  const { user } = useAuth();
  const [adminType, setAdminType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminType = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('admin_type')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (data?.admin_type) {
          setAdminType(data.admin_type);
        }
      } catch (error) {
        console.error('Erro ao verificar tipo de admin:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminType();
  }, [user]);

  if (loading) return null;
  if (adminType !== 'master') return null;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo - Reset de Dados Financeiros
        </CardTitle>
        <CardDescription>
          O reset financeiro direto pelo navegador foi desativado por segurança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Reset financeiro bloqueado no frontend</AlertTitle>
          <AlertDescription>
            Esta ação envolve exclusão/zeragem de dados financeiros sensíveis. Para proteger a integridade da Raiz Token, o reset não pode mais ser executado diretamente pelo painel do navegador. O fluxo correto deve passar por rotina backend protegida, com autenticação reforçada, registro em log e backup prévio.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-background p-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Lock className="h-4 w-4" />
            Status operacional
          </div>
          <p>Reset destrutivo no frontend: bloqueado.</p>
          <p>Reset seguro recomendado: Edge Function/RPC server-side com backup obrigatório, senha, 2FA real e log administrativo.</p>
          <p>Enquanto esse backend não estiver homologado, os dados financeiros ficam protegidos contra exclusão acidental pelo painel.</p>
        </div>

        <Button variant="destructive" disabled className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Reset financeiro desativado por segurança
        </Button>
      </CardContent>
    </Card>
  );
};
