
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Folder, Users, Trash2 } from 'lucide-react';
import { formatToBrasilia } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  custom_goal?: number;
  raised_amount: number;
  backers_count: number;
  status: string;
  created_at: string;
  deadline?: string;
}

interface RecentProjectsProps {
  projects: Project[];
  onRefresh?: () => void;
}

const RecentProjects = ({ projects, onRefresh }: RecentProjectsProps) => {
  const { toast } = useToast();
  const [cleaningProjects, setCleaningProjects] = useState(false);

  // Projetos inativos: rejeitados, cancelados, ou que não atingiram a meta (expirados)
  const getInactiveProjects = () => {
    return projects.filter(project => {
      if (project.status === 'rejected') return true;
      if (project.status === 'cancelled') return true;
      // Projetos expirados que não atingiram a meta
      const effectiveGoal = project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
      if (project.deadline) {
        const isExpired = new Date(project.deadline) < new Date();
        if (isExpired && project.raised_amount < effectiveGoal) return true;
      }
      return false;
    });
  };

  // Projetos concluídos: atingiram 100% da meta
  const getCompletedProjects = () => {
    return projects.filter(project => {
      if (project.status !== 'approved') return false;
      const effectiveGoal = project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
      return project.raised_amount >= effectiveGoal;
    });
  };

  const handleCleanInactiveProjects = async () => {
    const inactiveProjects = getInactiveProjects();
    if (inactiveProjects.length === 0) return;

    setCleaningProjects(true);
    try {
      const projectIds = inactiveProjects.map(p => p.id);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds);

      if (error) throw error;

      toast({
        title: 'Projetos removidos',
        description: `${inactiveProjects.length} projeto(s) inativo(s) removido(s).`,
      });

      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao limpar projetos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover os projetos.',
        variant: 'destructive',
      });
    } finally {
      setCleaningProjects(false);
    }
  };

  const handleCleanCompletedProjects = async () => {
    const completedProjects = getCompletedProjects();
    if (completedProjects.length === 0) return;

    setCleaningProjects(true);
    try {
      const projectIds = completedProjects.map(p => p.id);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds);

      if (error) throw error;

      toast({
        title: 'Projetos removidos',
        description: `${completedProjects.length} projeto(s) concluído(s) removido(s).`,
      });

      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao limpar projetos concluídos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover os projetos.',
        variant: 'destructive',
      });
    } finally {
      setCleaningProjects(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Cancelado</Badge>;
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

  const getEffectiveGoal = (project: Project) => {
    return project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
  };

  const inactiveCount = getInactiveProjects().length;
  const completedCount = getCompletedProjects().length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Meus Projetos</CardTitle>
          <CardDescription>
            Seus projetos criados
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-green-300 text-green-600 hover:bg-green-50">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Concluídos ({completedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover projetos concluídos?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Você tem {completedCount} projeto(s) que atingiram 100% da meta.</p>
                    <p>Esta ação irá remover permanentemente esses projetos do seu histórico.</p>
                    <p className="font-semibold text-destructive">Esta ação não pode ser desfeita. Tem certeza?</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCleanCompletedProjects}
                    disabled={cleaningProjects}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {cleaningProjects ? 'Removendo...' : 'Sim, remover'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {inactiveCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Inativos ({inactiveCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar projetos inativos?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Esta ação irá remover permanentemente {inactiveCount} projeto(s):</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Projetos rejeitados</li>
                      <li>Projetos cancelados</li>
                      <li>Projetos que não atingiram a meta</li>
                    </ul>
                    <p className="font-semibold text-destructive">Esta ação não pode ser desfeita.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCleanInactiveProjects}
                    disabled={cleaningProjects}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {cleaningProjects ? 'Removendo...' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/projetos" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Ver Todos</span>
            </Link>
          </Button>
        </div>
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
              const effectiveGoal = getEffectiveGoal(project);
              const progressPercentage = getProgressPercentage(project.raised_amount, effectiveGoal);
              
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
                          <span>{formatTokens(project.raised_amount)} de {formatTokens(getEffectiveGoal(project))} tokens</span>
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
                      <span>Meta: {formatTokens(getEffectiveGoal(project))} tokens</span>
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
