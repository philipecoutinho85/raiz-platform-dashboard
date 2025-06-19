
import { Card, CardContent } from '@/components/ui/card';
import { Users, FolderOpen, AlertTriangle, Coins } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    activeProjects: number;
    pendingApproval: number;
    totalTokens: number;
  };
}

const AdminStats = ({ stats }: AdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-raiz-secondary">Total de Usuários</p>
              <p className="text-2xl font-bold text-raiz-dark">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-raiz-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-raiz-secondary">Projetos Ativos</p>
              <p className="text-2xl font-bold text-raiz-primary">{stats.activeProjects}</p>
            </div>
            <FolderOpen className="w-8 h-8 text-raiz-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-raiz-secondary">Aguardando Aprovação</p>
              <p className="text-2xl font-bold text-raiz-gold">{stats.pendingApproval}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-raiz-gold" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-raiz-secondary">Tokens Circulando</p>
              <p className="text-2xl font-bold text-raiz-accent">{stats.totalTokens.toLocaleString()}</p>
            </div>
            <Coins className="w-8 h-8 text-raiz-accent" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
