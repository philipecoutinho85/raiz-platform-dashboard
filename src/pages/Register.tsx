import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Lock, Phone, ShieldCheck, BadgeCheck, FileCheck2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import MaintenanceModal from '@/components/MaintenanceModal';
import { supabase } from '@/integrations/supabase/client';
import TermsConsentCheckbox from '@/components/forms/TermsConsentCheckbox';

const Register = () => {
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
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
    
    if (!termsAccepted) {
      setTermsError('Você deve aceitar os Termos de Uso e Política de Privacidade.');
      toast({
        title: "Erro",
        description: "Você deve aceitar os Termos de Uso e Política de Privacidade.",
        variant: "destructive"
      });
      return;
    }
    setTermsError('');

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

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,64}$/;
    if (!passwordRegex.test(formData.senha)) {
      toast({
        title: "Erro",
        description: "A senha deve ter entre 8-64 caracteres, pelo menos 1 letra maiúscula e 1 número.",
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
        <title>Criar Conta | Raiz Token</title>
      </Helmet>
      <MaintenanceModal />

      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)] px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="lg:sticky lg:top-28">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              Novo cadastro
            </div>

            <h1 className="mb-5 max-w-2xl font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              Crie sua conta em uma plataforma de apoio confiável.
            </h1>

            <p className="mb-8 max-w-xl text-base leading-relaxed text-home-muted md:text-lg">
              Entre para apoiar projetos reais, acompanhar sua carteira e participar de campanhas com validação, reputação pública e prestação de contas.
            </p>

            <div className="grid gap-4">
              <div className="rounded-[26px] border border-home-line bg-white/84 p-5 shadow-home-glass backdrop-blur-sm">
                <ShieldCheck className="mb-4 h-7 w-7 text-home-800" />
                <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">Identidade e segurança</h2>
                <p className="text-sm leading-relaxed text-home-muted">A conta é o primeiro passo para apoiar projetos e acompanhar sua jornada dentro da plataforma.</p>
              </div>

              <div className="rounded-[26px] border border-home-line bg-white/84 p-5 shadow-home-glass backdrop-blur-sm">
                <FileCheck2 className="mb-4 h-7 w-7 text-home-800" />
                <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">Prestação de contas</h2>
                <p className="text-sm leading-relaxed text-home-muted">Projetos precisam sustentar uma relação transparente com seus apoiadores.</p>
              </div>

              <div className="rounded-[26px] border border-home-line bg-white/84 p-5 shadow-home-glass backdrop-blur-sm">
                <RotateCcw className="mb-4 h-7 w-7 text-home-800" />
                <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">Retorno dos tokens</h2>
                <p className="text-sm leading-relaxed text-home-muted">Se a meta não for atingida, os tokens retornam para a carteira do apoiador conforme as regras da campanha.</p>
              </div>
            </div>
          </section>

          <section>
            <Card className="overflow-hidden rounded-[34px] border-home-line bg-white/92 shadow-home-deep backdrop-blur-xl">
              <CardHeader className="space-y-3 border-b border-home-line/70 bg-white/72 px-6 py-7 md:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-home-900 text-home-gold shadow-home-glass">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-2xl font-extrabold tracking-[-.025em] text-home-900">Dados de cadastro</CardTitle>
                    <p className="text-sm text-home-muted">Preencha os campos para criar sua conta</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 py-7 md:px-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-home-900">Nome *</Label>
                      <Input
                        id="nome"
                        placeholder="João"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        required
                        disabled={loading}
                        maxLength={50}
                        className="h-12 rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sobrenome" className="text-home-900">Sobrenome *</Label>
                      <Input
                        id="sobrenome"
                        placeholder="Silva"
                        value={formData.sobrenome}
                        onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                        required
                        disabled={loading}
                        maxLength={50}
                        className="h-12 rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-home-900">E-mail *</Label>
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
                    <Label htmlFor="celular" className="text-home-900">Celular *</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                      <Input
                        id="celular"
                        placeholder="(11) 99999-9999"
                        className="h-12 rounded-2xl border-home-line bg-white pl-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                        maxLength={15}
                        value={formData.celular}
                        onChange={(e) => handleInputChange('celular', formatPhone(e.target.value))}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="senha" className="text-home-900">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                        <Input
                          id="senha"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Digite sua senha"
                          className="h-12 rounded-2xl border-home-line bg-white pl-11 pr-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                          value={formData.senha}
                          onChange={(e) => handleInputChange('senha', e.target.value)}
                          required
                          disabled={loading}
                          minLength={8}
                          maxLength={64}
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
                      <p className="text-xs leading-relaxed text-home-muted">
                        Mínimo 8 caracteres, máximo 64, pelo menos 1 letra maiúscula e 1 número.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha" className="text-home-900">Confirmar Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                        <Input
                          id="confirmarSenha"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme sua senha"
                          className="h-12 rounded-2xl border-home-line bg-white pl-11 pr-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                          value={formData.confirmarSenha}
                          onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                          required
                          disabled={loading}
                          minLength={8}
                          maxLength={64}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-home-muted transition-colors hover:text-home-800"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-home-line bg-home-100/70 p-4">
                    <TermsConsentCheckbox
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                      error={termsError}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button type="submit" className="h-12 rounded-full bg-home-800 px-8 font-semibold text-white shadow-lg shadow-home-900/10 hover:bg-home-900 sm:w-auto" disabled={loading}>
                      {loading ? 'Criando Conta...' : 'Criar Conta'}
                    </Button>
                    <Button variant="outline" type="button" asChild className="h-12 rounded-full border-home-line px-8 font-semibold text-home-900 hover:bg-home-100 sm:w-auto">
                      <Link to="/login">Já tenho uma conta</Link>
                    </Button>
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

export default Register;
