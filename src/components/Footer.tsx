import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import raizLogo from '@/assets/raiz-logo-light.png';

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    instagram: '',
    twitter: ''
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'social_links')
        .single();
      
      if (data?.value) {
        setSocialLinks(data.value as any);
      }
    };
    
    fetchSocialLinks();
  }, []);

  // Render social icon with external link support
  const renderSocialIcon = (platform: 'linkedin' | 'instagram' | 'twitter') => {
    const url = socialLinks[platform];
    const Icon = platform === 'linkedin' ? Linkedin : platform === 'instagram' ? Instagram : Twitter;
    const label = platform === 'linkedin' ? 'LinkedIn' : platform === 'instagram' ? 'Instagram' : 'Twitter';
    
    // Se não houver URL, não renderiza o ícone
    if (!url || url.trim() === '') {
      return null;
    }

    // External links use <a> tag with target="_blank"
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-raiz-light hover:text-raiz-gold transition-colors p-3 bg-raiz-light/10 rounded-lg hover:bg-raiz-light/20 flex items-center justify-center"
        aria-label={label}
      >
        <Icon className="w-6 h-6" />
      </a>
    );
  };

  return (
    <footer className="bg-raiz-dark text-raiz-light w-full mt-auto">
      <div className="container mx-auto px-4 py-6 pb-24 md:py-16 md:pb-16 w-full">
        {/* Grid responsivo melhorado para mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and Description - Full width on mobile */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <img src={raizLogo} alt="Plataforma Raiz Token Logo" className="h-12 md:h-16 w-auto" />
            </div>
            <p className="text-raiz-light/80 text-sm md:text-base">
              Transformando ideias em realidade através do poder da comunidade. 
              Sua plataforma de crowdfunding para projetos inovadores.
            </p>
          </div>
          
          {/* Quick Links - Sempre visíveis */}
          <div className="col-span-1">
            <h3 className="text-base md:text-lg font-semibold text-raiz-gold mb-3 md:mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/projetos" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Explorar Projetos</Link></li>
              <li><Link to="/criar-projeto" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Criar Projeto</Link></li>
              <li><Link to="/como-funciona" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Como Funciona</Link></li>
              <li><Link to="/blog" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Blog</Link></li>
              <li><Link to="/faq" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">FAQ</Link></li>
            </ul>
          </div>
          
          {/* Políticas e Suporte */}
          <div className="col-span-1">
            <h3 className="text-base md:text-lg font-semibold text-raiz-gold mb-3 md:mb-4">Políticas</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Privacidade</Link></li>
              <li><Link to="/privacidade-apoiadores" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Privacidade Apoiadores</Link></li>
              <li><Link to="/privacidade-criadores" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Privacidade Criadores</Link></li>
              <li><Link to="/politica-de-cookies" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Política de Cookies</Link></li>
              <li><Link to="/terms" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Termos de Uso</Link></li>
              <li><Link to="/security" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Segurança</Link></li>
              <li><Link to="/contato" className="text-raiz-light/80 hover:text-raiz-gold transition-colors text-sm md:text-base block py-1">Contato</Link></li>
            </ul>
          </div>
          
          {/* Social - ícones apenas (links externos bloqueados) */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-base md:text-lg font-semibold text-raiz-gold mb-3 md:mb-4">Redes Sociais</h3>
            <div className="flex gap-3">
              {renderSocialIcon('linkedin')}
              {renderSocialIcon('instagram')}
              {renderSocialIcon('twitter')}
            </div>
          </div>
        </div>
        
        <div className="border-t border-raiz-accent/20 mt-6 md:mt-12 pt-4 md:pt-8 text-center">
          <p className="text-raiz-light/60 text-xs md:text-sm">
            © 2026 Plataforma Raiz Token. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
