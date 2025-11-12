
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Folder, Users } from 'lucide-react';
import { formatToBrasilia } from '@/lib/dateUtils';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised_amount: number;
  backers_count: number;
  status: string;
  created_at: string;
  deadline?: string;
}

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects = ({ projects }: RecentProjectsProps) => {
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

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    return formatToBrasilia(dateString, 'dd/MM/yyyy');
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Meus Projetos</CardTitle>
          <CardDescription>
            Seus projetos criados
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/projetos" className="flex items-center space-x-2">
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
            {projects.map((project) => {
              const progressPercentage = getProgressPercentage(project.raised_amount, project.goal);
              
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-raiz-accent/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-raiz-dark">{project.title}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                    
                    <p className="text-sm text-raiz-secondary mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    
                    {project.status === 'approved' && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span>{formatTokens(project.raised_amount)} de {formatTokens(project.goal)} tokens</span>
                          <span className="font-medium">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex items-center space-x-4 text-xs text-raiz-secondary">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{project.backers_count} apoiadores</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-raiz-secondary">
                      <span>Categoria: {project.category}</span>
                      <span>Meta: {formatTokens(project.goal)} tokens</span>
                      <span>Criado: {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/projeto/${project.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentProjects;
