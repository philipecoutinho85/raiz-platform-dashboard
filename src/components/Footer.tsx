import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import raizLogo from '@/assets/raiz-logo-light.png';

const Footer = () => {
  return (
    <footer className="bg-raiz-dark text-raiz-light">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={raizLogo} alt="$RAIZ Logo" className="h-16 w-auto" />
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
              <li><Link to="/projetos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Explorar Projetos</Link></li>
              <li><Link to="/criar-projeto" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Criar Projeto</Link></li>
              <li><Link to="/como-funciona" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Como Funciona</Link></li>
              <li><Link to="/projetos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Cases de Sucesso</Link></li>
              <li><Link to="/projetos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-raiz-gold mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacy" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/security" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Segurança</Link></li>
              <li><a href="mailto:contato@raiztoken.com.br" className="text-raiz-light/80 hover:text-raiz-gold transition-colors">Contato</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-raiz-gold mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">contato@raiztoken.com.br</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">(21) 96883-9616</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-raiz-accent" />
                <span className="text-raiz-light/80">Niterói, RJ</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-raiz-accent/20 mt-12 pt-8 text-center">
          <p className="text-raiz-light/60">
            © 2025 $RAIZ Plataforma de Crowdfunding. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
