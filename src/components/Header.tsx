
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sprout, Menu, X, Home, FolderPlus, Folder, User, Shield, Coins, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isAdmin, profile } = useAuth();
  const { tokens, loading: tokensLoading } = useTokens();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projetos', href: '/projetos', icon: Search },
    { name: 'Criar Projeto', href: '/criar-projeto', icon: FolderPlus },
    { name: 'Meus Projetos', href: '/meus-projetos', icon: Folder },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't show header on auth pages or home page
  if (['/login', '/registro', '/esqueci-senha', '/'].includes(location.pathname)) {
    return null;
  }

  // Don't show header if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-raiz-accent/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-raiz-primary rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-raiz-dark">$RAIZ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCurrentPath(item.href)
                    ? 'bg-raiz-primary/10 text-raiz-primary'
                    : 'text-raiz-secondary hover:text-raiz-primary hover:bg-raiz-primary/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {/* Token Counter */}
            <div className="hidden sm:flex items-center space-x-2 bg-raiz-gold/10 text-raiz-gold px-3 py-1 rounded-full">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {tokensLoading ? '...' : tokens.toLocaleString()}
              </span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.nome || user.email || ''} />
                    <AvatarFallback>
                      {profile?.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.nome ? `${profile.nome} ${profile.sobrenome}` : user.email}</p>
                    <div className="flex items-center space-x-2">
                      <Coins className="w-3 h-3 text-raiz-gold" />
                      <span className="text-xs text-muted-foreground">
                        {tokensLoading ? '...' : `${tokens.toLocaleString()} tokens`}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                      <Badge variant="secondary" className="ml-auto">Admin</Badge>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-raiz-accent/20">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCurrentPath(item.href)
                      ? 'bg-raiz-primary/10 text-raiz-primary'
                      : 'text-raiz-secondary hover:text-raiz-primary hover:bg-raiz-primary/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="px-3 py-2 border-t border-raiz-accent/20 mt-4 pt-4">
                <div className="flex items-center space-x-2 text-sm text-raiz-secondary">
                  <Coins className="w-4 h-4 text-raiz-gold" />
                  <span>
                    {tokensLoading ? '...' : `${tokens.toLocaleString()} tokens disponíveis`}
                  </span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
