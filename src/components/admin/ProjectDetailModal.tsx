
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Target, Users, DollarSign, Clock, Edit2, Save, Sprout, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProjectCommunication from './ProjectCommunication';
import ManageProjectBadges from './ManageProjectBadges';
import { useAuth } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  project_type?: 'seed' | 'regular';
  platform_fee_percentage?: number;
  accountability_report?: string;
  accountability_images?: string[];
  accountability_submitted_at?: string;
  accountability_approved?: boolean;
}

interface ProjectDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onUpdate?: () => void;
}

const ProjectDetailModal = ({ isOpen, onOpenChange, project, onUpdate }: ProjectDetailModalProps) => {
  const { isAdmin, user } = useAuth();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [projectType, setProjectType] = useState<'seed' | 'regular'>('regular');
  const [isSavingType, setIsSavingType] = useState(false);
  const [isApprovingAccountability, setIsApprovingAccountability] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setUserIsAdmin(!!data);
      console.log('User is admin:', !!data);
    };
    
    checkAdminStatus();
  }, [user]);

  // Atualizar estados quando o projeto mudar
  useEffect(() => {
    if (project) {
      setCustomGoal(project.custom_goal?.toString() || '');
      setProjectType(project.project_type || 'regular');
    }
  }, [project]);

  const handleSaveProjectType = async (newType: 'seed' | 'regular') => {
    if (newType === projectType) return; // Evitar chamadas desnecessárias
    
    setIsSavingType(true);
    try {
      const platformFee = newType === 'seed' ? 0 : 10;
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          project_type: newType,
          platform_fee_percentage: platformFee
        })
        .eq('id', project?.id);

      if (error) throw error;

      setProjectType(newType);
      toast.success(`Tipo de projeto atualizado para ${newType === 'seed' ? 'Projeto Semente (0%)' : 'Projeto Regular (10%)'}`);
      
      // Atualizar o projeto localmente para refletir imediatamente
      if (project) {
        project.project_type = newType;
        project.platform_fee_percentage = platformFee;
      }
    } catch (error) {
      console.error('Error updating project type:', error);
      toast.error('Erro ao atualizar tipo de projeto');
    } finally {
      setIsSavingType(false);
    }
  };

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
      const newGoalValue = customGoal ? parseFloat(customGoal) : null;
      
      console.log('Tentando salvar meta:', newGoalValue);
      console.log('User is admin:', userIsAdmin);
      
      // Validação: apenas admins podem definir metas menores que 1000
      if (newGoalValue && newGoalValue < 1000 && !userIsAdmin) {
        toast.error('Apenas administradores podem definir metas menores que 1000 tokens');
        setIsSaving(false);
        return;
      }
      
      if (newGoalValue && newGoalValue <= 0) {
        toast.error('A meta deve ser maior que zero');
        setIsSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          custom_goal: newGoalValue
        })
        .eq('id', project.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Meta salva com sucesso!');
      toast.success('Meta customizada atualizada com sucesso!');
      setIsEditingGoal(false);
      
      // Atualizar o projeto localmente para refletir imediatamente
      if (project) {
        project.custom_goal = newGoalValue || undefined;
      }
      
      // Chamar callback para atualizar lista no painel admin
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error updating custom goal:', error);
      toast.error('Erro ao atualizar meta customizada');
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
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <Badge variant="outline">{project.category}</Badge>
                    <Badge variant={project.status === 'pending' ? 'destructive' : 'default'}>
                      {project.status === 'pending' ? 'Pendente' : project.status}
                    </Badge>
                    {project.project_type === 'seed' ? (
                      <Badge className="bg-emerald-500 text-white">
                        <Sprout className="w-3 h-3 mr-1" />
                        Taxa 0%
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">
                        <Target className="w-3 h-3 mr-1" />
                        Taxa 10%
                      </Badge>
                    )}
                  </div>
                  
                  {/* Tipo de Projeto */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-lg space-y-3 border border-amber-200 dark:border-amber-800">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-amber-600" />
                      Tipo de Projeto e Taxa
                    </Label>
                    <RadioGroup
                      value={projectType}
                      onValueChange={(value: 'seed' | 'regular') => handleSaveProjectType(value)}
                      className="space-y-2"
                      disabled={isSavingType}
                    >
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        projectType === 'seed' 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                          : 'border-border hover:border-emerald-300'
                      }`}>
                        <RadioGroupItem value="seed" id="seed-detail" />
                        <Label htmlFor="seed-detail" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Sprout className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold">Projeto Semente</span>
                            <Badge className="bg-emerald-500 text-white text-xs">0%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Para projetos iniciantes - sem taxa da plataforma
                          </p>
                        </Label>
                      </div>
                      
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        projectType === 'regular' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                          : 'border-border hover:border-blue-300'
                      }`}>
                        <RadioGroupItem value="regular" id="regular-detail" />
                        <Label htmlFor="regular-detail" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">Projeto Regular</span>
                            <Badge className="bg-blue-500 text-white text-xs">10%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Taxa padrão da plataforma de 10%
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>
                    {isSavingType && (
                      <p className="text-xs text-amber-600 animate-pulse">Salvando...</p>
                    )}
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
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={customGoal}
                              onChange={(e) => setCustomGoal(e.target.value)}
                              placeholder={userIsAdmin ? "Qualquer valor (mín: 1)" : "Mínimo: 1000 tokens"}
                              className="flex-1"
                              min="1"
                              step="1"
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveGoal}
                              disabled={isSaving}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {isSaving ? 'Salvando...' : 'Salvar'}
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
                          {userIsAdmin && (
                            <p className="text-xs text-raiz-gold font-semibold">
                              ✓ Como administrador, você pode definir qualquer meta (incluindo valores abaixo de 1000 tokens)
                            </p>
                          )}
                          {!userIsAdmin && (
                            <p className="text-xs text-raiz-secondary">
                              Meta mínima: 1000 tokens
                            </p>
                          )}
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

          {/* Accountability Section for Admin */}
          {project.accountability_submitted_at && (
            <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Prestação de Contas
                  {project.accountability_approved ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprovada
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Aguardando Aprovação</Badge>
                  )}
                </h3>
                {!project.accountability_approved && (
                  <Button
                    onClick={async () => {
                      setIsApprovingAccountability(true);
                      try {
                        const { error } = await supabase
                          .from('projects')
                          .update({
                            accountability_approved: true,
                            can_create_new_project: true
                          })
                          .eq('id', project.id);

                        if (error) throw error;

                        toast.success('Prestação de contas aprovada! O criador pode criar novos projetos.');
                        if (onUpdate) onUpdate();
                      } catch (error) {
                        console.error('Error approving accountability:', error);
                        toast.error('Erro ao aprovar prestação de contas');
                      } finally {
                        setIsApprovingAccountability(false);
                      }
                    }}
                    disabled={isApprovingAccountability}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isApprovingAccountability ? 'Aprovando...' : 'Aprovar Prestação'}
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Enviada em: {new Date(project.accountability_submitted_at).toLocaleDateString('pt-BR')}
              </div>
              
              {project.accountability_report && (
                <div>
                  <h4 className="font-medium mb-2">Relatório:</h4>
                  <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">{project.accountability_report}</p>
                </div>
              )}
              
              {project.accountability_images && project.accountability_images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Comprovantes ({project.accountability_images.length}):</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {project.accountability_images.map((file, idx) => {
                      const isPdf = file.toLowerCase().endsWith('.pdf');
                      return isPdf ? (
                        <a
                          key={idx}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-24 bg-muted rounded hover:bg-muted/80 transition-colors border"
                        >
                          <FileText className="w-8 h-8 text-red-500" />
                          <span className="text-xs flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> PDF
                          </span>
                        </a>
                      ) : (
                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer">
                          <img src={file} alt={`Comprovante ${idx + 1}`} className="w-full h-24 object-cover rounded border hover:opacity-90" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
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
