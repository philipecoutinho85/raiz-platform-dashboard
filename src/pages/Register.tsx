import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import raizTokenLogo from '@/assets/raiz-token-logo.png';
import Footer from '@/components/Footer';
import MaintenanceModal from '@/components/MaintenanceModal';
import { supabase } from '@/integrations/supabase/client';
import { validateCPF, formatCPF } from '@/lib/cpfValidator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Register = () => {
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    celular: '',
    senha: '',
    confirmarSenha: '',
  });

  const checkMaintenanceMode = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    if (data) {
      const mode = data.value as any;
      setMaintenanceMode(mode);
      return mode;
    }
    return null;
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) return formData.celular;
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const sanitizeInput = (input: string) => {
    return input.trim().replace(/[<>'"]/g, '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const mode = await checkMaintenanceMode();
    if (mode?.enabled) {
      toast({
        title: "Sistema em Manutenção",
        description: "Não é possível criar novas contas durante a manutenção.",
        variant: "destructive"
      });
      return;
    }
    
    const requiredFields = ['nome', 'sobrenome', 'email', 'celular', 'senha', 'confirmarSenha'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
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

    if (formData.senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.celular)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um celular válido com 11 dígitos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const sanitizedData = {
        nome: sanitizeInput(formData.nome),
        sobrenome: sanitizeInput(formData.sobrenome),
        celular: formData.celular.replace(/\D/g, ''),
      };

      const { error } = await signUp(formData.email, formData.senha, sanitizedData);
      
      if (error) {
        let errorMessage = "Erro ao criar conta. Tente novamente.";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "Este e-mail já está cadastrado.";
        } else if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "E-mail inválido.";
        }
        
        toast({
          title: "Erro no Cadastro",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Conta Criada!",
          description: "Agora você pode fazer login e completar seu perfil.",
        });
        navigate('/login');
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
      <Helmet>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://raiztoken.com.br/registro" />
      </Helmet>
      <MaintenanceModal />
      <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <img src={raizTokenLogo} alt="Raiz Token Logo" className="h-36 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-raiz-dark mb-4 text-left">Crie sua conta na plataforma de crowdfunding Raiz Token</h1>
            <p className="text-raiz-secondary text-base leading-relaxed mb-6 text-left">
              A Raiz Token é uma plataforma de crowdfunding que se destaca pela transparência, credibilidade e processos bem estruturados para apoiar projetos de impacto. Com práticas modernas de avaliação, validação e acompanhamento, a plataforma oferece um ambiente profissional e confiável para criadores e apoiadores. Ao registrar sua conta, você passa a integrar um ecossistema comprometido com seriedade, governança e a evolução sustentável das iniciativas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Dados de Cadastro</span>
                </CardTitle>
                <CardDescription>
                  Complete seu perfil depois com CPF, data de nascimento e endereço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      placeholder="João"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      required
                      disabled={loading}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sobrenome">Sobrenome *</Label>
                    <Input
                      id="sobrenome"
                      placeholder="Silva"
                      value={formData.sobrenome}
                      onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                      required
                      disabled={loading}
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
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
                  <Label htmlFor="celular">Celular *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="celular"
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                      maxLength={15}
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', formatPhone(e.target.value))}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        className="pl-10 pr-10"
                        value={formData.senha}
                        onChange={(e) => handleInputChange('senha', e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                      <Input
                        id="confirmarSenha"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        className="pl-10 pr-10"
                        value={formData.confirmarSenha}
                        onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary hover:text-raiz-primary"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Após o cadastro, você precisará completar seu perfil com CPF, data de nascimento e endereço para poder apoiar ou criar projetos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                type="submit" 
                className="bg-raiz-primary hover:bg-raiz-primary/90 sm:w-auto"
                disabled={loading}
              >
                {loading ? 'Criando Conta...' : 'Criar Conta'}
              </Button>
              <Button variant="outline" type="button" asChild className="sm:w-auto">
                <Link to="/login">Já tenho uma conta</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Register;
