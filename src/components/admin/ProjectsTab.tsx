
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Check, X } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  goal: number;
  description: string;
  submittedDate: string;
  status: string;
}

interface ProjectsTabProps {
  pendingProjects: Project[];
  onProjectAction: (projectId: number, action: string, reason?: string) => void;
  onRejectProject: (project: Project) => void;
}

const ProjectsTab = ({ pendingProjects, onProjectAction, onRejectProject }: ProjectsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Aguardando Aprovação</CardTitle>
        <CardDescription>Analise e aprove novos projetos submetidos à plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pendingProjects.map((project) => (
            <div key={project.id} className="border border-raiz-accent/20 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-raiz-dark mb-2">{project.title}</h3>
                  <p className="text-raiz-secondary mb-2">{project.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-raiz-secondary">
                    <span>Por: {project.author}</span>
                    <Badge variant="outline">{project.category}</Badge>
                    <span>Meta: R$ {project.goal.toLocaleString()}</span>
                    <span>Submetido em: {project.submittedDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() => onProjectAction(project.id, 'approve')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onRejectProject(project)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTab;
