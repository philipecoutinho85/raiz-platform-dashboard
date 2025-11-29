import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompletedProject {
  id: string;
  title: string;
  user_id: string;
  goal: number;
  custom_goal: number | null;
  raised_amount: number;
  updated_at: string;
  daysOld: number;
}

const CompletedProjectsCounter = () => {
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompletedProjects = async () => {
    try {
      setLoading(true);

      // Calcular data de 20 dias atrás
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const { data, error } = await supabase
        .from('projects')
        .select('id, title, user_id, goal, custom_goal, raised_amount, updated_at')
        .eq('status', 'approved')
        .lt('updated_at', twentyDaysAgo.toISOString());

      if (error) throw error;

      // Filtrar projetos que atingiram 100% e calcular dias
      const completed = (data || [])
        .filter(p => {
          const effectiveGoal = p.custom_goal && p.custom_goal > 0 ? p.custom_goal : p.goal;
          return p.raised_amount >= effectiveGoal;
        })
        .map(p => {
          const updatedDate = new Date(p.updated_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - updatedDate.getTime());
          const daysOld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...p, daysOld };
        })
        .sort((a, b) => b.daysOld - a.daysOld);

      setProjects(completed);
    } catch (error: any) {
      console.error('Error fetching completed projects:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar projetos concluídos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${projects.length} projeto(s) concluído(s) há mais de 20 dias?`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-completed-projects');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${projects.length} projeto(s) excluído(s) com sucesso`,
      });

      fetchCompletedProjects();
    } catch (error: any) {
      console.error('Error deleting projects:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir os projetos',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchCompletedProjects();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Projetos Concluídos (20+ dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Projetos Concluídos (20+ dias)
            </CardTitle>
            <CardDescription className="mt-1">
              Projetos que atingiram 100% da meta há mais de 20 dias serão excluídos automaticamente
            </CardDescription>
          </div>
          {projects.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos ({projects.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum projeto concluído há mais de 20 dias</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {project.daysOld} dias atrás
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Meta: {project.custom_goal || project.goal} tokens
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Arrecadado: {project.raised_amount} tokens
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedProjectsCounter;
