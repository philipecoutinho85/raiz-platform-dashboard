import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import footerLogo from '@/assets/RaizToken-footer-white.svg';

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

  const renderSocialIcon = (platform: 'linkedin' | 'instagram' | 'twitter') => {
    const url = socialLinks[platform];
    const Icon = platform === 'linkedin' ? Linkedin : platform === 'instagram' ? Instagram : Twitter;
    const label = platform === 'linkedin' ? 'LinkedIn' : platform === 'instagram' ? 'Instagram' : 'Twitter';
    
    if (!url || url.trim() === '') {
      return null;
    }

    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/75 transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:text-home-gold"
        aria-label={label}
      >
        <Icon className="h-5 w-5" />
      </a>
    );
  };

  return (
    <footer className="mt-auto w-full overflow-hidden bg-home-900 text-white/70">
      <div className="container mx-auto px-4 py-10 pb-24 md:px-6 md:py-16 md:pb-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5 md:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex" aria-label="Raiz Token">
              <img
                src={footerLogo}
                alt="Raiz Token"
                className="h-[48px] w-[140px] object-contain md:h-[54px] md:w-[160px]"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/68 md:text-base">
              Crowdfunding inteligente para projetos reais, com validação, reputação pública e prestação de contas.
            </p>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-relaxed text-white/58">
              1 token equivale a R$1 em apoio. Token não é investimento, não gera rendimento e não representa participação no projeto.
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-home-gold">Plataforma</h3>
            <ul className="space-y-3">
              <li><Link to="/projetos" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Explorar Projetos</Link></li>
              <li><Link to="/criar-projeto" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Criar Projeto</Link></li>
              <li><Link to="/como-funciona" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Como Funciona</Link></li>
              <li><Link to="/blog" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Blog</Link></li>
              <li><Link to="/faq" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-home-gold">Confiança</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Privacidade</Link></li>
              <li><Link to="/privacidade-apoiadores" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Privacidade Apoiadores</Link></li>
              <li><Link to="/privacidade-criadores" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Privacidade Criadores</Link></li>
              <li><Link to="/politica-de-cookies" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Política de Cookies</Link></li>
              <li><Link to="/terms" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Termos de Uso</Link></li>
              <li><Link to="/security" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Segurança</Link></li>
              <li><Link to="/contato" className="block text-sm text-white/68 transition-colors hover:text-white md:text-base">Contato</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-home-gold">Redes Sociais</h3>
            <div className="flex gap-3">
              {renderSocialIcon('linkedin')}
              {renderSocialIcon('instagram')}
              {renderSocialIcon('twitter')}
            </div>
          </div>
        </div>
        
        <div className="mt-10 border-t border-white/10 pt-6 text-center md:mt-12 md:pt-8">
          <p className="text-xs leading-relaxed text-white/45 md:text-sm">
            © 2026 Plataforma Raiz Token. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
