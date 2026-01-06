import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderPlus, Folder, User, Shield, MessageCircle, Menu, X, LogOut, Coins, HelpCircle, Settings, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportMessages } from '@/hooks/useSupportMessages';
import { useTokens } from '@/contexts/TokensContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { unreadCount: supportUnreadCount } = useSupportMessages();
  const { tokens } = useTokens();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Don't show navigation on auth pages, home page, or if user is not authenticated
  if (['/login', '/registro', '/esqueci-senha', '/'].includes(location.pathname) || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const getInitials = (nome?: string, sobrenome?: string) => {
    if (!nome && !sobrenome) return 'U';
    return `${nome?.charAt(0) || ''}${sobrenome?.charAt(0) || ''}`.toUpperCase();
  };

  const mainNavItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Criar', href: '/criar-projeto', icon: FolderPlus },
    { name: 'Projetos', href: '/meus-projetos', icon: Folder },
  ];

  const isCurrentPath = (path: string) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0];
    }
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {/* Main nav items */}
        {mainNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
              isCurrentPath(item.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}

        {/* Support with notification dot */}
        <Link
          to="/perfil?tab=support"
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors relative ${
            isCurrentPath('/perfil') && location.search.includes('support')
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {supportUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium">Suporte</span>
        </Link>

        {/* Menu button */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-primary">
              <div className="relative">
                <Menu className="w-5 h-5" />
                <ChevronUp className="w-3 h-3 absolute -top-1 -right-1" />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(profile?.nome, profile?.sobrenome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium">{profile?.nome} {profile?.sobrenome}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{tokens}</span>
                </div>
              </div>
            </SheetHeader>

            <Separator className="my-2" />

            <div className="space-y-1 py-2">
              <button
                onClick={() => handleNavigate('/perfil')}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Meu Perfil</span>
              </button>
              
              <button
                onClick={() => handleNavigate('/carteira')}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Coins className="w-5 h-5" />
                <span>Minha Carteira</span>
              </button>

              <button
                onClick={() => handleNavigate('/dashboard')}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  <span>Administração</span>
                </button>
              )}

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('startPlatformTour'));
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Tour da Plataforma</span>
              </button>
            </div>

            <Separator className="my-2" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileBottomNav;
