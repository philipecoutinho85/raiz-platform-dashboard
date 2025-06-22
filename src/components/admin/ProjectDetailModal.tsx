
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Target, Users, DollarSign, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Project {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  goal: number;
  description: string;
  submittedDate: string;
  status: string;
  user_id: string;
  raised_amount?: number;
  backers_count?: number;
  deadline?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  youtube_url?: string;
  featured_image?: string;
}

interface ProjectDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

const ProjectDetailModal = ({ isOpen, onOpenChange, project }: ProjectDetailModalProps) => {
  if (!project) return null;

  const progressPercentage = project.raised_amount && project.goal 
    ? Math.min((project.raised_amount / project.goal) * 100, 100) 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.title}</DialogTitle>
          <DialogDescription>
            Detalhes completos do projeto submetido por {project.author}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Project Image */}
          {project.featured_image && (
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img 
                src={project.featured_image} 
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Project Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-raiz-dark mb-2">Informações do Projeto</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{project.category}</Badge>
                    <Badge variant={project.status === 'pending' ? 'destructive' : 'default'}>
                      {project.status === 'pending' ? 'Pendente' : project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-raiz-secondary">
                    <Target className="w-4 h-4" />
                    <span>Meta: {formatCurrency(project.goal)}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center space-x-2 text-sm text-raiz-secondary">
                      <Clock className="w-4 h-4" />
                      <span>Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-raiz-dark mb-2">Criador do Projeto</h3>
                <div className="space-y-1 text-sm text-raiz-secondary">
                  <p><strong>Nome:</strong> {project.author}</p>
                  <p><strong>Email:</strong> {project.authorEmail}</p>
                  <p><strong>Data de Submissão:</strong> {project.submittedDate}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Progress Info */}
              {project.raised_amount !== undefined && (
                <div>
                  <h3 className="font-semibold text-raiz-dark mb-2">Progresso do Financiamento</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-raiz-secondary">
                        {formatCurrency(project.raised_amount)} arrecadados
                      </span>
                      <span className="text-raiz-gold font-bold">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="flex items-center justify-between text-sm text-raiz-secondary">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{project.backers_count || 0} apoiadores</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Meta: {formatCurrency(project.goal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {(project.endereco || project.cidade) && (
                <div>
                  <h3 className="font-semibold text-raiz-dark mb-2">Localização</h3>
                  <div className="flex items-start space-x-2 text-sm text-raiz-secondary">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div>
                      {project.endereco && <p>{project.endereco}</p>}
                      {project.cidade && project.estado && (
                        <p>{project.cidade}, {project.estado}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-raiz-dark mb-2">Descrição</h3>
            <p className="text-raiz-secondary leading-relaxed">{project.description}</p>
          </div>

          {/* YouTube Video */}
          {project.youtube_url && (
            <div>
              <h3 className="font-semibold text-raiz-dark mb-2">Vídeo do Projeto</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={project.youtube_url.replace('watch?v=', 'embed/')}
                  title="Vídeo do Projeto"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailModal;
