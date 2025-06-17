
import { Sprout, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-raiz-dark text-raiz-light">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-raiz rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">$</span>
              </div>
              <span className="text-2xl font-bold text-raiz-gold">RAIZ</span>
            </div>
            <p className="text-raiz-light/80">
              Transformando ideias em realidade através do poder da comunidade. 
              Sua plataforma de crowdfunding para projetos inovadores.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-raiz-accent hover:text-raiz-gold">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-raiz-accent hover:text-raiz-gold">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-raiz-accent hover:text-raiz-gold">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-raiz-accent hover:text-raiz-gold">
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-raiz-gold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#projetos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Explorar Projetos</a></li>
              <li><a href="#criar" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Criar Projeto</a></li>
              <li><a href="#como-funciona" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Como Funciona</a></li>
              <li><a href="#sucesso" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Cases de Sucesso</a></li>
              <li><a href="#blog" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Blog</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-raiz-gold mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li><a href="#faq" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">FAQ</a></li>
              <li><a href="#termos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Termos de Uso</a></li>
              <li><a href="#privacidade" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Política de Privacidade</a></li>
              <li><a href="#seguranca" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Segurança</a></li>
              <li><a href="#contato" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Contato</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-raiz-gold mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">contato@raiz.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">(11) 9999-9999</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">São Paulo, SP</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-raiz-accent/20 mt-12 pt-8 text-center">
          <p className="text-raiz-light/60">
            © 2024 $RAIZ Plataforma de Crowdfunding. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
