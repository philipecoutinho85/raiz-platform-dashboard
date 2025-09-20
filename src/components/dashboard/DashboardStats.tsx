
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Calendar, TrendingUp, Target, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalProjects: number;
    pendingProjects: number;
    approvedProjects: number;
    totalGoal: number;
    totalRaised: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingProjects}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvedProjects}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Total (Tokens)</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{formatTokens(stats.totalGoal)} tokens</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arrecadado (Tokens)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{formatTokens(stats.totalRaised)} tokens</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
