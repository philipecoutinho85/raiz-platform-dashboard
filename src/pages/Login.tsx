import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, BadgeCheck, RotateCcw, Gauge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/contexts/TokensContext';
import MaintenanceModal from '@/components/MaintenanceModal';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';

const Login = () => {
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const { syncWalletOnLogin } = useTokens();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking maintenance mode:', error);
        return null;
      }
      
      if (data) {
        const mode = data.value as any;
        setMaintenanceMode(mode);
        return mode;
      }
      return null;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/projetos');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let mode = null;
      try {
        mode = await checkMaintenanceMode();
      } catch (maintenanceError) {
        console.warn('Could not check maintenance mode, proceeding with login:', maintenanceError);
      }
      
      if (mode?.enabled) {
        const { error, session } = await signIn(formData.email, formData.password);
        
        if (error) {
          let errorMessage = "Erro ao fazer login. Tente novamente.";
          const errorText = error.message || error.toString() || '';
          
          if (errorText.includes('Invalid login credentials') || errorText.includes('invalid_credentials')) {
            errorMessage = "E-mail ou senha incorretos.";
          } else if (errorText.includes('Email not confirmed') || errorText.includes('email_not_confirmed')) {
            errorMessage = "Por favor, confirme seu e-mail antes de fazer login.";
          }
          
          toast({
            title: "Erro no Login",
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }
        
        if (session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (!roleData) {
            await supabase.auth.signOut();
            toast({
              title: "Acesso Negado",
              description: "Sistema em manutenção. Apenas administradores podem acessar.",
              variant: "destructive"
            });
            return;
          }
          
          syncWalletOnLogin();
          navigate('/projetos');
        }
        return;
      }
      
      const { error, session } = await signIn(formData.email, formData.password);
      
      if (error) {
        let errorMessage = "Erro ao fazer login. Tente novamente.";
        const errorText = error.message || error.toString() || '';
        
        if (errorText.includes('Invalid login credentials') || errorText.includes('invalid_credentials')) {
          errorMessage = "E-mail ou senha incorretos.";
        } else if (errorText.includes('Email not confirmed') || errorText.includes('email_not_confirmed')) {
          errorMessage = "Por favor, confirme seu e-mail antes de fazer login.";
        } else if (errorText.includes('User not found')) {
          errorMessage = "Usuário não encontrado.";
        }
        
        toast({
          title: "Erro no Login",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      if (session) {
        syncWalletOnLogin();
        navigate('/projetos');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://raiztoken.com.br/login" />
        <title>Entrar | Raiz Token</title>
      </Helmet>
      <MaintenanceModal />

      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)] px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="order-2 lg:order-1">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              Área segura
            </div>

            <h1 className="mb-5 max-w-2xl font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              Entre para acompanhar seus projetos e apoios.
            </h1>

            <p className="mb-8 max-w-xl text-base leading-relaxed text-home-muted md:text-lg">
              Acesse sua conta para visualizar carteira, apoiar campanhas, acompanhar prestação de contas e gerenciar sua jornada na Raiz Token.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-home-line bg-white/84 p-5 shadow-home-glass backdrop-blur-sm">
                <ShieldCheck className="mb-4 h-7 w-7 text-home-800" />
                <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">Acesso protegido</h2>
                <p className="text-sm leading-relaxed text-home-muted">Ambiente autenticado para apoiar projetos e acompanhar informações da conta.</p>
              </div>
              <div className="rounded-[26px] border border-home-line bg-white/84 p-5 shadow-home-glass backdrop-blur-sm">
                <Gauge className="mb-4 h-7 w-7 text-home-800" />
                <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">RaizScore e badges</h2>
                <p className="text-sm leading-relaxed text-home-muted">Sinais de reputação ajudam a entender melhor a confiança dos projetos.</p>
              </div>
            </div>
          </section>

          <section className="order-1 lg:order-2">
            <Card className="mx-auto w-full max-w-md overflow-hidden rounded-[34px] border-home-line bg-white/92 shadow-home-deep backdrop-blur-xl">
              <CardHeader className="space-y-3 border-b border-home-line/70 bg-white/72 px-7 py-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-home-900 text-home-gold shadow-home-glass">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-2xl font-extrabold tracking-[-.025em] text-home-900">Entrar</CardTitle>
                    <CardDescription className="text-home-muted">Acesse sua conta com segurança</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-7 py-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-home-900">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="h-12 rounded-2xl border-home-line bg-white pl-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-home-900">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        className="h-12 rounded-2xl border-home-line bg-white pl-11 pr-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-home-muted transition-colors hover:text-home-800"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link to="/esqueci-senha" className="text-sm font-semibold text-home-800 hover:text-home-900 hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-full bg-home-800 font-semibold text-white shadow-lg shadow-home-900/10 hover:bg-home-900" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="rounded-2xl border border-home-line bg-home-100/70 px-4 py-4 text-center text-sm text-home-muted">
                    Não tem uma conta?{' '}
                    <Link to="/registro" className="font-semibold text-home-800 hover:text-home-900 hover:underline">
                      Cadastre-se aqui
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Login;
