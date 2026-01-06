import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/contexts/TokensContext';
import { LogOut, User, Settings, Shield, Coins, HelpCircle } from 'lucide-react';
import raizLogo from '@/assets/raiz-logo.png';
import NotificationBell from '@/components/NotificationBell';

const Header = () => {
  const { user, signOut, profile, isAdmin } = useAuth();
  const { tokens } = useTokens();
  const navigate = useNavigate();

  const handleStartTour = () => {
    // Disparar evento customizado para iniciar tour
    window.dispatchEvent(new CustomEvent('startPlatformTour'));
    // Navegar para dashboard se não estiver lá
    if (window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (nome?: string, sobrenome?: string) => {
    if (!nome && !sobrenome) return 'U';
    return `${nome?.charAt(0) || ''}${sobrenome?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={raizLogo} alt="Raiz Token" className="h-12 md:h-20 w-auto object-contain transition-transform hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center space-x-6" data-tour="header-nav">
            {user ? (
              <>
                <Link to="/dashboard" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/projetos" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Projetos
                </Link>
                <Link to="/criar-projeto" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Criar Projeto
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Inicio
                </Link>
                <Link to="/projetos" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Projetos
                </Link>
                <Link to="/como-funciona" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Como Funciona
                </Link>
                <Link to="/faq" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  FAQ
                </Link>
                <Link to="/contato" className="text-lg font-semibold text-raiz-dark hover:text-raiz-primary transition-colors">
                  Falar Conosco
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-raiz-accent/20 to-raiz-primary/10 rounded-full border border-raiz-primary/20">
                  <Coins className="h-6 w-6 text-raiz-accent" />
                  <span className="text-lg font-bold text-raiz-primary">{tokens}</span>
                  <span className="text-sm font-medium text-raiz-dark">tokens</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-tour="user-menu">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={profile?.avatar_url || ''} 
                          alt={`${profile?.nome || ''} ${profile?.sobrenome || ''}`} 
                        />
                        <AvatarFallback className="bg-raiz-primary text-white">
                          {getInitials(profile?.nome, profile?.sobrenome)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.nome && (
                        <p className="font-medium">
                          {profile.nome} {profile.sobrenome}
                        </p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email || user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/carteira')}>
                    <Coins className="mr-2 h-4 w-4" />
                    <span>Minha Carteira</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Administração</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleStartTour}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Tour da Plataforma</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-base font-semibold">Entrar</Button>
                </Link>
                <Link to="/registro">
                  <Button className="text-base font-semibold">Cadastrar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
