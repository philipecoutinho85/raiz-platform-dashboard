
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Sprout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import raizLogo from '@/assets/raiz-token-full-logo.png';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu e-mail.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao enviar e-mail. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitted(true);
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-raiz-primary rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-raiz-dark">E-mail Enviado!</h1>
            <p className="text-raiz-secondary">Verifique sua caixa de entrada</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-raiz-secondary">
                  Enviamos um link para redefinição de senha para <strong>{email}</strong>
                </p>
                <p className="text-sm text-raiz-secondary/70">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Tentar outro e-mail
                  </Button>
                  <Button asChild className="w-full bg-raiz-primary hover:bg-raiz-primary/90">
                    <Link to="/login">Voltar ao Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={raizLogo} alt="Raiz Token" className="h-20 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-raiz-dark">Esqueci Minha Senha</h1>
          <p className="text-raiz-secondary">Digite seu e-mail para redefinir sua senha</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Enviaremos um link para seu e-mail para redefinir sua senha
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-raiz-primary hover:bg-raiz-primary/90"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center space-x-2 text-sm text-raiz-primary hover:text-raiz-primary/80 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Login</span>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
