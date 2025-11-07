
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderPlus, Folder, User, Shield, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const MobileNavigation = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  // Don't show navigation on auth pages, home page, or if user is not authenticated
  if (['/login', '/registro', '/esqueci-senha', '/'].includes(location.pathname) || !user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Criar', href: '/criar-projeto', icon: FolderPlus },
    { name: 'Projetos', href: '/meus-projetos', icon: Folder },
    { name: 'Carteira', href: '/carteira', icon: Wallet },
    { name: 'Perfil', href: '/perfil', icon: User },
  ];

  // Add admin if the user is admin
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-raiz-accent/20 md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors relative ${
              isCurrentPath(item.href)
                ? 'text-raiz-primary bg-raiz-primary/10'
                : 'text-raiz-secondary hover:text-raiz-primary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.name}</span>
            {item.name === 'Admin' && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                A
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;
