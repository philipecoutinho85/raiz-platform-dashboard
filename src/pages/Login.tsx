
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/contexts/TokensContext';
import raizTokenLogo from '@/assets/raiz-token-logo.png';
import Footer from '@/components/Footer';
import MaintenanceModal from '@/components/MaintenanceModal';
import { supabase } from '@/integrations/supabase/client';

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

  // Check maintenance mode on submit
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

  // Redirect if already authenticated - send to projects page instead of dashboard
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
      // Check maintenance mode first
      let mode = null;
      try {
        mode = await checkMaintenanceMode();
      } catch (maintenanceError) {
        console.warn('Could not check maintenance mode, proceeding with login:', maintenanceError);
      }
      
      if (mode?.enabled) {
        // In maintenance mode, use signIn first then check admin status
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
          // Check if user is admin
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
          
          // Admin login successful during maintenance
          syncWalletOnLogin();
          navigate('/projetos');
        }
        return;
      }
      
      // Normal login flow (no maintenance mode)
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
      
      // Login successful
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
      </Helmet>
      <MaintenanceModal />
      <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={raizTokenLogo} alt="Raiz Token Logo" className="h-32 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-raiz-dark">Bem-vindo ao Raiz Token</h1>
          <p className="text-raiz-secondary">Entre na sua conta para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary hover:text-raiz-primary"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/esqueci-senha" 
                  className="text-sm text-raiz-primary hover:text-raiz-primary/80 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-raiz-primary hover:bg-raiz-primary/90"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center text-sm text-raiz-secondary">
                Não tem uma conta?{' '}
                <Link to="/registro" className="text-raiz-primary hover:text-raiz-primary/80 hover:underline font-medium">
                  Cadastre-se aqui
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    <Footer />
  </>
  );
};

export default Login;
