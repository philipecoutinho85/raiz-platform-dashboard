import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Lock, Phone, Calendar, MapPin, Home, Sprout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import raizTokenLogo from '@/assets/raiz-token-logo.png';
import Footer from '@/components/Footer';
import MaintenanceModal from '@/components/MaintenanceModal';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    sobrenome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    celular: '',
    dataNascimento: '',
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  // Check maintenance mode on submit
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

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) return formData.cpf;
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) return formData.celular;
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 8) return formData.cep;
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
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
      return;
    }
    
    // Validação básica
    const requiredFields = [
      'nome', 'sobrenome', 'email', 'senha', 'confirmarSenha', 'cpf', 'celular', 'dataNascimento',
      'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado'
    ];
    
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validações específicas
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

    if (!validateCPF(formData.cpf)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um CPF válido.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.celular)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um celular válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Sanitize all inputs
      const sanitizedData = {
        nome: sanitizeInput(formData.nome),
        sobrenome: sanitizeInput(formData.sobrenome),
        cpf: formData.cpf.replace(/\D/g, ''),
        celular: formData.celular.replace(/\D/g, ''),
        data_nascimento: formData.dataNascimento,
        endereco: sanitizeInput(formData.endereco),
        numero: sanitizeInput(formData.numero),
        complemento: sanitizeInput(formData.complemento),
        bairro: sanitizeInput(formData.bairro),
        cidade: sanitizeInput(formData.cidade),
        estado: sanitizeInput(formData.estado),
        cep: formData.cep.replace(/\D/g, ''),
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
      <MaintenanceModal />
      <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={raizTokenLogo} alt="Raiz Token Logo" className="h-36 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-raiz-dark">Criar Conta no $RAIZ</h1>
          <p className="text-raiz-secondary">Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Dados Pessoais</span>
              </CardTitle>
              <CardDescription>
                Todas as informações são obrigatórias
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                    required
                    disabled={loading}
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="dataNascimento"
                      type="date"
                      className="pl-10"
                      value={formData.dataNascimento}
                      onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                      required
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Endereço</span>
              </CardTitle>
              <CardDescription>
                Informações de localização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    maxLength={9}
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="endereco"
                      placeholder="Rua das Flores"
                      className="pl-10"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      required
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    required
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apartamento 101"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Centro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
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
