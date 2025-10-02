import { Shield } from 'lucide-react';
import raizLogo from '@/assets/raiz-logo.png';

const AdminHeader = () => {
  return (
    <div className="bg-white border-b border-raiz-accent/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-3 mb-4">
          <img src={raizLogo} alt="Raiz Token" className="h-10 w-auto" />
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-raiz-primary" />
            <h1 className="text-3xl font-bold text-raiz-dark">Painel Administrativo</h1>
          </div>
        </div>
        <p className="text-raiz-secondary">Gerencie usuários, projetos e tokens da plataforma</p>
      </div>
    </div>
  );
};

export default AdminHeader;
