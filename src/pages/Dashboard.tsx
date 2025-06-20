
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Folder, Eye, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  status: string;
  created_at: string;
  deadline?: string;
}

interface DashboardStats {
  totalProjects: number;
  pendingProjects: number;
  approvedProjects: number;
  totalGoal: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    pendingProjects: 0,
    approvedProjects: 0,
    totalGoal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos.",
          variant: "destructive"
        });
        return;
      }

      setProjects(projects || []);

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const pendingProjects = projects?.filter(p => p.status === 'pending').length || 0;
      const approvedProjects = projects?.filter(p => p.status === 'approved').length || 0;
      const totalGoal = projects?.reduce((sum, p) => sum + (p.goal || 0), 0) || 0;

      setStats({
        totalProjects,
        pendingProjects,
        approvedProjects,
        totalGoal
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">
            Bem-vindo ao Dashboard
          </h1>
          <p className="text-raiz-secondary">
            Gerencie seus projetos e acompanhe seu progresso
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalGoal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Comece um novo projeto ou gerencie os existentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full bg-raiz-primary hover:bg-raiz-primary/90">
                <Link to="/criar-projeto" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Projeto</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/meus-projetos" className="flex items-center space-x-2">
                  <Folder className="w-4 h-4" />
                  <span>Ver Todos os Projetos</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas de Sucesso</CardTitle>
              <CardDescription>
                Maximize suas chances de aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-raiz-secondary">
                <li>• Use um título claro e atrativo</li>
                <li>• Descreva detalhadamente seu projeto</li>
                <li>• Inclua um vídeo explicativo de qualidade</li>
                <li>• Defina metas realistas</li>
                <li>• Seja transparente sobre o uso dos recursos</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projetos Recentes</CardTitle>
              <CardDescription>
                Seus últimos 5 projetos criados
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/meus-projetos" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Ver Todos</span>
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-raiz-secondary/50 mx-auto mb-4" />
                <p className="text-raiz-secondary">Você ainda não criou nenhum projeto.</p>
                <Button asChild className="mt-4 bg-raiz-primary hover:bg-raiz-primary/90">
                  <Link to="/criar-projeto">Criar Primeiro Projeto</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-raiz-accent/10 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-raiz-dark">{project.title}</h3>
                      <p className="text-sm text-raiz-secondary mb-2 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-raiz-secondary">
                        <span>Categoria: {project.category}</span>
                        <span>Meta: {formatCurrency(project.goal)}</span>
                        <span>Criado: {formatDate(project.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(project.status)}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projeto/${project.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
