
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Coins, User, Settings } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-raiz-accent/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-raiz rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="text-2xl font-bold text-gradient">RAIZ</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#projetos" className="text-raiz-dark hover:text-raiz-primary transition-colors">
              Projetos
            </a>
            <a href="#como-funciona" className="text-raiz-dark hover:text-raiz-primary transition-colors">
              Como Funciona
            </a>
            <a href="#sobre" className="text-raiz-dark hover:text-raiz-primary transition-colors">
              Sobre
            </a>
            <a href="#contato" className="text-raiz-dark hover:text-raiz-primary transition-colors">
              Contato
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-raiz-secondary">
              <Coins className="w-5 h-5" />
              <span className="font-semibold">1,250 tokens</span>
            </div>
            <Button variant="outline" className="border-raiz-primary text-raiz-primary hover:bg-raiz-primary hover:text-white">
              Entrar
            </Button>
            <Button className="bg-gradient-raiz hover:opacity-90 text-white">
              Cadastrar
            </Button>
            <Button variant="ghost" size="icon" className="text-raiz-secondary hover:text-raiz-primary">
              <User className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-raiz-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-raiz-accent/20">
            <nav className="flex flex-col space-y-4 mt-4">
              <a href="#projetos" className="text-raiz-dark hover:text-raiz-primary transition-colors">
                Projetos
              </a>
              <a href="#como-funciona" className="text-raiz-dark hover:text-raiz-primary transition-colors">
                Como Funciona
              </a>
              <a href="#sobre" className="text-raiz-dark hover:text-raiz-primary transition-colors">
                Sobre
              </a>
              <a href="#contato" className="text-raiz-dark hover:text-raiz-primary transition-colors">
                Contato
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <div className="flex items-center space-x-2 text-raiz-secondary">
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">1,250 tokens</span>
                </div>
                <Button variant="outline" className="border-raiz-primary text-raiz-primary hover:bg-raiz-primary hover:text-white">
                  Entrar
                </Button>
                <Button className="bg-gradient-raiz hover:opacity-90 text-white">
                  Cadastrar
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
