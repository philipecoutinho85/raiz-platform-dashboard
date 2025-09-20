
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sprout, TrendingUp, Users, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23%238FBC8F%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Login/Register buttons in top right */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <Button variant="outline" size="sm" asChild className="border-raiz-accent text-raiz-accent hover:bg-raiz-accent hover:text-raiz-dark">
          <Link to="/login" className="flex items-center space-x-2">
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </Link>
        </Button>
        <Button size="sm" asChild className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark">
          <Link to="/registro" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar</span>
          </Link>
        </Button>
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column - Main Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-raiz-gold/20 text-raiz-gold px-4 py-2 rounded-full mb-6">
              <Sprout className="w-4 h-4" />
              <span className="text-sm font-semibold">Plataforma de Crowdfunding</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Faça seus projetos 
              <span className="block text-raiz-gold">crescerem</span>
              <span className="block text-raiz-accent">como uma árvore</span>
            </h1>
            
            <p className="text-xl text-raiz-light/80 mb-8 max-w-2xl">
              Na <strong>$RAIZ</strong>, conectamos empreendedores visionários com apoiadores que acreditam no potencial de grandes ideias. 
              Sua ideia é a semente, nossos apoiadores são o adubo que fará ela florescer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" asChild className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark text-lg px-8 py-6 h-auto">
                <Link to="/registro" className="flex items-center space-x-2">
                  <span>Criar Meu Projeto</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-raiz-accent text-raiz-accent hover:bg-raiz-accent hover:text-raiz-dark text-lg px-8 py-6 h-auto"
              >
                <Play className="mr-2 w-5 h-5" />
                Como Funciona
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-raiz-gold">1.2K+</div>
                <div className="text-raiz-light/70 text-sm">Projetos</div>
              </div>
              <div className="text-center">
                 <div className="text-2xl font-bold text-raiz-gold">58M</div>
                <div className="text-raiz-light/70 text-sm">Tokens Arrecadados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-raiz-gold">25K+</div>
                <div className="text-raiz-light/70 text-sm">Apoiadores</div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Visual Elements */}
          <div className="relative animate-slide-in-right">
            <div className="relative">
              {/* Main visual card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-raiz-accent/20">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-raiz-gold rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-raiz-dark" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Projeto EcoTech</h3>
                      <p className="text-raiz-light/70 text-sm">Tecnologia Sustentável</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-raiz-light/70">Meta: 500.000 tokens</span>
                      <span className="text-raiz-gold font-semibold">78% atingido</span>
                    </div>
                    <div className="w-full bg-raiz-dark/30 rounded-full h-2">
                      <div className="bg-gradient-gold h-2 rounded-full w-[78%]"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-raiz-accent" />
                      <span className="text-raiz-light text-sm">156 apoiadores</span>
                    </div>
                    <div className="text-raiz-gold font-semibold">392.000 tokens</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-raiz-gold/20 rounded-full flex items-center justify-center animate-float">
                <Sprout className="w-8 h-8 text-raiz-gold" />
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-raiz-accent/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-raiz-accent font-bold text-xl">$</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
