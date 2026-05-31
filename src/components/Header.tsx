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
import raizLogo from '@/assets/RaizToken-header.svg';
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
    <header className="sticky top-0 z-50 border-b border-home-line/80 bg-white/82 backdrop-blur-xl shadow-home-glass">
      <div className="container mx-auto px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-3 rounded-[24px] border border-home-line/80 bg-white/78 px-3 py-2 shadow-home-glass md:rounded-full md:px-5 md:py-3">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Raiz Token">
            <img
              src={raizLogo}
              alt="Raiz Token"
              className="h-[44px] w-[128px] object-contain transition-transform hover:scale-[1.02] md:h-[54px] md:w-[156px]"
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-home-muted lg:flex" data-tour="header-nav">
            {user ? (
              <>
                <Link to="/dashboard" className="transition-colors hover:text-home-800">
                  Dashboard
                </Link>
                <Link to="/projetos" className="transition-colors hover:text-home-800">
                  Projetos
                </Link>
                <Link to="/criar-projeto" className="transition-colors hover:text-home-800">
                  Criar Projeto
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="transition-colors hover:text-home-800">
                  Início
                </Link>
                <Link to="/projetos" className="transition-colors hover:text-home-800">
                  Projetos
                </Link>
                <Link to="/como-funciona" className="transition-colors hover:text-home-800">
                  Como Funciona
                </Link>
                <Link to="/faq" className="transition-colors hover:text-home-800">
                  FAQ
                </Link>
                <Link to="/contato" className="transition-colors hover:text-home-800">
                  Falar Conosco
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                <NotificationBell />

                <Link
                  to="/carteira"
                  className="hidden items-center gap-2 rounded-full border border-home-line bg-home-100/80 px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-home-glass sm:flex"
                  aria-label="Minha carteira"
                >
                  <Coins className="h-5 w-5 text-home-800" />
                  <span className="font-mono text-sm font-bold text-home-900">{tokens}</span>
                  <span className="hidden text-xs font-semibold text-home-muted md:inline">tokens</span>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-11 w-11 rounded-full border border-home-line bg-white p-0 shadow-sm hover:bg-home-100"
                      data-tour="user-menu"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile?.avatar_url || ''}
                          alt={`${profile?.nome || ''} ${profile?.sobrenome || ''}`}
                        />
                        <AvatarFallback className="bg-home-900 text-white">
                          {getInitials(profile?.nome, profile?.sobrenome)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 rounded-2xl border-home-line p-2 shadow-home-card" align="end" forceMount>
                    <div className="flex items-center justify-start gap-3 rounded-xl bg-home-100/70 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-home-900 text-white">
                          {getInitials(profile?.nome, profile?.sobrenome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col space-y-1 leading-none">
                        {profile?.nome && (
                          <p className="truncate font-semibold text-home-900">
                            {profile.nome} {profile.sobrenome}
                          </p>
                        )}
                        <p className="max-w-[180px] truncate text-sm text-home-muted">
                          {profile?.email || user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-2" />
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
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-full px-3 text-sm font-semibold text-home-900 hover:bg-home-100 hover:text-home-800 md:px-4">
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button className="rounded-full bg-home-800 px-4 text-sm font-semibold text-white shadow-lg shadow-home-900/10 hover:bg-home-900 md:px-5">
                    Cadastrar
                  </Button>
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
