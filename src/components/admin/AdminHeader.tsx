import { Shield } from 'lucide-react';
import raizLogo from '@/assets/raiz-logo.png';

const AdminHeader = () => {
  return (
    <div className="bg-white border-b border-raiz-accent/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-4 mb-4">
          <img src={raizLogo} alt="Raiz Token" className="h-14 w-auto" />
          <div className="flex items-center space-x-2">
            <Shield className="w-7 h-7 text-raiz-primary" />
            <h1 className="text-3xl font-bold text-raiz-dark">Painel Administrativo</h1>
          </div>
        </div>
        <p className="text-raiz-secondary ml-[calc(3.5rem+1rem)]">Gerencie usuários, projetos e tokens da plataforma</p>
      </div>
    </div>
  );
};

export default AdminHeader;
