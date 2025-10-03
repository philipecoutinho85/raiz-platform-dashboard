import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Coins, Target, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Target className="w-8 h-8 text-raiz-accent" />,
      title: "1. Escolha um Projeto",
      description: "Navegue pelos projetos disponíveis e encontre aqueles que mais tocam seu coração e causas que você acredita."
    },
    {
      icon: <Coins className="w-8 h-8 text-raiz-accent" />,
      title: "2. Compre Tokens",
      description: "Adquira tokens digitais: cada R$ 1,00 equivale a 10 tokens (1 token = R$ 0,10). Valor mínimo de R$ 5,00 (50 tokens)."
    },
    {
      icon: <ArrowRight className="w-8 h-8 text-raiz-accent" />,
      title: "3. Apoie com Tokens",
      description: "Use seus tokens para apoiar o projeto. Acompanhe o progresso em tempo real através da barra de arrecadação."
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-raiz-accent" />,
      title: "4. Meta Atingida",
      description: "Se a meta for alcançada, o criador recebe os recursos e seus tokens ficam como registro permanente do seu apoio."
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-raiz-accent" />,
      title: "5. Proteção Garantida",
      description: "Meta não atingida? Seus tokens retornam automaticamente. Você também pode solicitar reembolso em reais a qualquer momento."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-raiz rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="text-2xl font-bold text-raiz-gold">RAIZ</span>
          </Link>
          <Link to="/">
            <Button variant="outline" className="text-raiz-light border-raiz-light hover:bg-raiz-light hover:text-raiz-primary">
              Voltar ao Início
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Como Funciona o 
            <span className="text-raiz-gold"> Raiz Token</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Bem-vindo ao Raiz Token! Nossa plataforma conecta pessoas e projetos de impacto social 
            através de tokens digitais simbólicos. Descubra como é simples, transparente e seguro apoiar causas importantes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-raiz-accent/20 hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-raiz-accent/20 rounded-full w-fit">
                  {step.icon}
                </div>
                <CardTitle className="text-raiz-light text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-light/80 text-center">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-raiz-gold mb-4">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              Por que escolher o Raiz Token?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-raiz-light">✨ Simplicidade</h3>
                <p className="text-raiz-light/80">Interface intuitiva que qualquer pessoa pode usar, sem complicações técnicas.</p>
                
                <h3 className="text-lg font-semibold text-raiz-light">🔒 Transparência Total</h3>
                <p className="text-raiz-light/80">Acompanhe cada token arrecadado em tempo real. Tudo é público e auditável.</p>
                
                <h3 className="text-lg font-semibold text-raiz-light">🛡️ Proteção Garantida</h3>
                <p className="text-raiz-light/80">Seus tokens são devolvidos se a meta não for atingida. Reembolso disponível a qualquer momento.</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-raiz-light">🎯 Impacto Real</h3>
                <p className="text-raiz-light/80">Cada token representa apoio direto a projetos que transformam comunidades.</p>
                
                <h3 className="text-lg font-semibold text-raiz-light">💳 Pagamento Seguro</h3>
                <p className="text-raiz-light/80">Integrações com os melhores gateways de pagamento do Brasil (PIX, cartão, débito).</p>
                
                <h3 className="text-lg font-semibold text-raiz-light">📱 Controle Total</h3>
                <p className="text-raiz-light/80">Sua carteira digital mostra todos os apoios realizados e tokens disponíveis.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-raiz-light/80 mb-8">
            Simples, transparente e seguro. Você apoia, acompanha e tem total clareza sobre onde seu dinheiro vai.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace">
              <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-primary font-semibold px-8">
                Explorar Projetos
              </Button>
            </Link>
            <Link to="/registro">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;