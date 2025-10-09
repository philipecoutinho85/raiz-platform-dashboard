
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import raizTokenLogo from '@/assets/raiz-token-logo.png';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check maintenance mode
  useEffect(() => {
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (data) {
        setMaintenanceMode(data.value as any);
      }
    };
    checkMaintenance();
  }, []);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (maintenanceMode?.enabled) {
      toast({
        title: "Sistema em Manutenção",
        description: maintenanceMode.message,
        variant: "destructive"
      });
      return;
    }
    
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
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        let errorMessage = "Erro ao fazer login. Tente novamente.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "E-mail ou senha incorretos.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu e-mail antes de fazer login.";
        }
        
        toast({
          title: "Erro no Login",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        navigate('/projetos');
      }
    } catch (error) {
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

        {maintenanceMode?.enabled && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {maintenanceMode.message}
            </AlertDescription>
          </Alert>
        )}

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
