
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderPlus, Folder, User, Shield, Wallet, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportMessages } from '@/hooks/useSupportMessages';

const MobileNavigation = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { unreadCount: supportUnreadCount } = useSupportMessages();

  // Don't show navigation on auth pages, home page, or if user is not authenticated
  if (['/login', '/registro', '/esqueci-senha', '/'].includes(location.pathname) || !user) {
    return null;
  }

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Criar', href: '/criar-projeto', icon: FolderPlus },
    { name: 'Projetos', href: '/meus-projetos', icon: Folder },
    { name: 'Suporte', href: '/perfil?tab=support', icon: MessageCircle, badge: supportUnreadCount },
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
            className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-colors relative ${
              isCurrentPath(item.href) || (item.href.includes('?') && location.pathname === item.href.split('?')[0])
                ? 'text-raiz-primary bg-raiz-primary/10'
                : 'text-raiz-secondary hover:text-raiz-primary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
            {item.badge && item.badge > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-orange-500 text-white text-[9px]">
                {item.badge}
              </Badge>
            )}
            {item.name === 'Admin' && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 text-[9px] px-1">
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
