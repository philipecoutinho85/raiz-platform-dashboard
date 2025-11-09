
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Target, Users, DollarSign, Clock, Edit2, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProjectCommunication from './ProjectCommunication';
import ManageProjectBadges from './ManageProjectBadges';
import { useAuth } from '@/contexts/AuthContext';

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
  custom_goal?: number;
  admin_fee_percentage?: number;
  rejection_reason?: string;
  pending_requirements?: string;
}

interface ProjectDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onUpdate?: () => void;
}

const ProjectDetailModal = ({ isOpen, onOpenChange, project, onUpdate }: ProjectDetailModalProps) => {
  const { isAdmin } = useAuth();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar estados quando o projeto mudar
  useEffect(() => {
    if (project) {
      setCustomGoal(project.custom_goal?.toString() || '');
      setAdminFee(project.admin_fee_percentage?.toString() || '10');
    }
  }, [project]);

  if (!project) return null;

  const effectiveGoal = project.custom_goal || project.goal;
  const progressPercentage = project.raised_amount && effectiveGoal 
    ? Math.min((project.raised_amount / effectiveGoal) * 100, 100) 
    : 0;

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleSaveGoal = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          custom_goal: customGoal ? parseFloat(customGoal) : null 
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Meta customizada atualizada com sucesso!');
      setIsEditingGoal(false);
      // Atualizar o projeto localmente
      if (project) {
        project.custom_goal = customGoal ? parseFloat(customGoal) : undefined;
      }
      // Chamar callback para atualizar lista no painel admin
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating custom goal:', error);
      toast.error('Erro ao atualizar meta customizada');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFee = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          admin_fee_percentage: adminFee ? parseFloat(adminFee) : 10 
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Taxa administrativa atualizada com sucesso!');
      setIsEditingFee(false);
      // Atualizar o projeto localmente
      if (project) {
        project.admin_fee_percentage = adminFee ? parseFloat(adminFee) : 10;
      }
      // Chamar callback para atualizar lista no painel admin
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating admin fee:', error);
      toast.error('Erro ao atualizar taxa administrativa');
    } finally {
      setIsSaving(false);
    }
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
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-raiz-secondary">
                      <Target className="w-4 h-4" />
                      <span>Meta Original: {formatTokens(project.goal)} tokens</span>
                    </div>
                    
                    {/* Meta Customizada */}
                    <div className="bg-raiz-light p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-raiz-dark">
                          Meta Customizada (Admin)
                        </Label>
                        {!isEditingGoal && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingGoal(true)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                      {isEditingGoal ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={customGoal}
                            onChange={(e) => setCustomGoal(e.target.value)}
                            placeholder="Meta em tokens"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveGoal}
                            disabled={isSaving}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditingGoal(false);
                              setCustomGoal(project?.custom_goal?.toString() || '');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-raiz-secondary">
                          {project.custom_goal 
                            ? `${formatTokens(project.custom_goal)} tokens` 
                            : 'Não definida (usando meta original)'}
                        </p>
                      )}
                      {project.custom_goal && (
                        <p className="text-xs text-raiz-gold font-semibold">
                          Meta Efetiva: {formatTokens(effectiveGoal)} tokens
                        </p>
                      )}
                    </div>

                    {/* Taxa Administrativa */}
                    <div className="bg-raiz-light p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-raiz-dark">
                          Taxa Administrativa
                        </Label>
                        {!isEditingFee && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingFee(true)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                      {isEditingFee ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={adminFee}
                            onChange={(e) => setAdminFee(e.target.value)}
                            placeholder="Taxa em %"
                            className="flex-1"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveFee}
                            disabled={isSaving}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditingFee(false);
                              setAdminFee(project?.admin_fee_percentage?.toString() || '10');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-raiz-secondary">
                          {project.admin_fee_percentage || 10}% sobre os recursos arrecadados
                        </p>
                      )}
                    </div>
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
                        {formatTokens(project.raised_amount)} tokens arrecadados
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
                        <span>Meta: {formatTokens(effectiveGoal)} tokens</span>
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

          {/* Admin Communication */}
          <ProjectCommunication
            projectId={project.id}
            currentStatus={project.status}
            rejectionReason={project.rejection_reason}
            pendingRequirements={project.pending_requirements}
            onUpdate={() => {
              if (onUpdate) onUpdate();
            }}
          />

          {/* Manage Project Badges */}
          {isAdmin && (
            <ManageProjectBadges
              projectId={project.id}
              isAdmin={isAdmin}
            />
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
