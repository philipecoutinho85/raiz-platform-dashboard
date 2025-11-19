import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, CheckCircle, DollarSign, Award } from 'lucide-react';

interface CreatorStatsProps {
  userId: string;
}

interface Stats {
  totalProjects: number;
  completedProjects: number;
  approvedAccountabilities: number;
  totalRaised: number;
  totalBackers: number;
}

const CreatorStats = ({ userId }: CreatorStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    completedProjects: 0,
    approvedAccountabilities: 0,
    totalRaised: 0,
    totalBackers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Buscar todos os projetos do usuário
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('status, raised_amount, backers_count, goal, accountability_approved')
        .eq('user_id', userId);

      if (projectsError) throw projectsError;

      const totalProjects = projects?.length || 0;
      const completedProjects = projects?.filter(
        p => p.status === 'approved' && p.raised_amount >= p.goal
      ).length || 0;
      const approvedAccountabilities = projects?.filter(
        p => p.accountability_approved === true
      ).length || 0;
      const totalRaised = projects?.reduce((sum, p) => sum + (p.raised_amount || 0), 0) || 0;
      const totalBackers = projects?.reduce((sum, p) => sum + (p.backers_count || 0), 0) || 0;

      setStats({
        totalProjects,
        completedProjects,
        approvedAccountabilities,
        totalRaised,
        totalBackers,
      });
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: TrendingUp,
      label: 'Projetos Publicados',
      value: stats.totalProjects,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: CheckCircle,
      label: 'Projetos Concluídos',
      value: stats.completedProjects,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Award,
      label: 'Prestações Aprovadas',
      value: stats.approvedAccountabilities,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: DollarSign,
      label: 'Total Arrecadado',
      value: `R$ ${stats.totalRaised.toLocaleString('pt-BR')}`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Users,
      label: 'Total de Apoiadores',
      value: stats.totalBackers,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="w-5 h-5 text-primary" />
          Estatísticas do Criador
        </CardTitle>
        <CardDescription>
          Histórico de desempenho e conquistas na plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{item.label}</p>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorStats;
