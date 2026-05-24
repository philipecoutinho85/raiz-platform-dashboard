
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Check, X, Search, Trash2, Clock, Archive, FileText, ShieldAlert } from 'lucide-react';
import ApproveProjectModal from './ApproveProjectModal';

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
  updated_at?: string;
  project_type?: 'seed' | 'regular';
  platform_fee_percentage?: number;
}

interface ProjectsTabProps {
  pendingProjects: Project[];
  onProjectAction: (projectId: string, action: string, reason?: string, projectType?: 'seed' | 'regular') => void;
  onRejectProject: (project: Project) => void;
  onViewProjectDetails: (project: Project) => void;
}

const ProjectsTab = ({ 
  pendingProjects, 
  onProjectAction, 
  onRejectProject, 
  onViewProjectDetails 
}: ProjectsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [approveProject, setApproveProject] = useState<Project | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const handleApproveWithType = async (projectId: string, projectType: 'seed' | 'regular') => {
    setIsApproving(true);
    await onProjectAction(projectId, 'approve', undefined, projectType);
    setIsApproving(false);
    setApproveProject(null);
  };

  const isInactiveProject = (project: Project) => {
    return ['cancelled', 'deleted', 'archived'].includes(project.status);
  };

  const hasFinancialHistory = (project: Project) => {
    return Boolean((project.raised_amount && project.raised_amount > 0) || (project.backers_count && project.backers_count > 0));
  };

  const draftProjectsCount = pendingProjects.filter(project => project.status === 'draft').length;
  const pendingProjectsCount = pendingProjects.filter(project => project.status === 'pending').length;
  const approvedProjectsCount = pendingProjects.filter(project => project.status === 'approved').length;
  const rejectedProjectsCount = pendingProjects.filter(project => project.status === 'rejected').length;

  const filteredProjects = pendingProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = (() => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return !isInactiveProject(project);
      if (statusFilter === 'awaiting_kyc') return project.status === 'draft';
      return project.status === statusFilter;
    })();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-800">Rascunho / aguardando KYC</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-100 text-orange-800">Cancelado</Badge>;
      case 'deleted':
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Arquivado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Aguardando análise</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getEffectiveGoal = (project: Project) => {
    return project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
  };

  const calculateDaysUntilDeletion = (project: Project) => {
    if (project.status !== 'approved') return null;
    
    const effectiveGoal = getEffectiveGoal(project);
    const isCompleted = project.raised_amount && project.raised_amount >= effectiveGoal;
    const today = new Date();
    
    if (isCompleted) {
      const referenceDate = new Date(project.updated_at || project.submittedDate);
      const daysPassed = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = 20 - daysPassed;
      return daysRemaining > 0 ? daysRemaining : 0;
    }
    
    if (project.deadline && !isCompleted) {
      const deadlineDate = new Date(project.deadline);
      deadlineDate.setHours(23, 59, 59, 999);
      
      if (today > deadlineDate) {
        const daysPassed = Math.floor((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = 20 - daysPassed;
        return daysRemaining > 0 ? daysRemaining : 0;
      }
    }
    
    return null;
  };

  const handleDeleteProject = (projectId: string) => {
    onProjectAction(projectId, 'delete');
    setDeleteProjectId(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-800">Rascunhos / aguardando KYC</p>
              <p className="text-2xl font-bold text-amber-900">{draftProjectsCount}</p>
            </div>
            <ShieldAlert className="w-7 h-7 text-amber-700" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aguardando análise</p>
              <p className="text-2xl font-bold">{pendingProjectsCount}</p>
            </div>
            <FileText className="w-7 h-7 text-gray-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Aprovados</p>
            <p className="text-2xl font-bold">{approvedProjectsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Rejeitados</p>
            <p className="text-2xl font-bold">{rejectedProjectsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Fluxo de rascunho:</strong> projetos em rascunho ainda não foram encaminhados para análise. O criador precisa concluir o KYC e enviar o projeto para validação. Após isso, a administração ainda deverá analisar e aprovar antes da publicação.
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="awaiting_kyc">Rascunhos / aguardando KYC</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="pending">Aguardando análise</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredProjects.length} projeto(s) encontrado(s)
        </div>
      </div>

      <div className="grid gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {getStatusBadge(project.status)}
                    <Badge variant="outline">{project.category}</Badge>
                    {(() => {
                      const daysRemaining = calculateDaysUntilDeletion(project);
                      if (daysRemaining !== null) {
                        return (
                          <Badge 
                            variant={daysRemaining <= 5 ? "destructive" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            {daysRemaining === 0 ? 'Revisar hoje' : `${daysRemaining} dias para revisão`}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    por <strong>{project.author}</strong> • {project.submittedDate}
                  </p>
                  {project.status === 'draft' && (
                    <p className="text-sm text-amber-800 mb-2">
                      Ainda não foi enviado para análise. Aguardando conclusão do KYC/envio pelo criador.
                    </p>
                  )}
                  {project.status === 'approved' && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Meta: {formatTokens(getEffectiveGoal(project))} tokens</span>
                      <span>Arrecadado: {formatTokens(project.raised_amount || 0)} tokens</span>
                      <span>Apoiadores: {project.backers_count || 0}</span>
                    </div>
                  )}
                </div>
                {project.featured_image && (
                  <img 
                    src={project.featured_image} 
                    alt={project.title}
                    className="w-24 h-16 object-cover rounded-lg ml-4"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 mb-4 line-clamp-2">
                {project.description}
              </p>

              {isInactiveProject(project) && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 flex items-start gap-2">
                  <Archive className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Projeto encerrado. Mantido somente para histórico, auditoria, prestação de contas e rastreabilidade financeira.
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProjectDetails(project)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Detalhes
                </Button>
                
                {project.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setApproveProject(project)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRejectProject(project)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </>
                )}
                
                {project.status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => onProjectAction(project.id, 'cancel')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar Projeto
                  </Button>
                )}

                {!isInactiveProject(project) && !hasFinancialHistory(project) && project.status !== 'draft' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteProjectId(project.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'active' 
                  ? 'Nenhum projeto encontrado com os filtros aplicados.' 
                  : 'Nenhum projeto ativo encontrado.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão definitiva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação só deve ser usada para projetos sem histórico financeiro. Projetos com apoios, tokens arrecadados ou prestação de contas devem ser cancelados/arquivados, não excluídos fisicamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApproveProjectModal
        isOpen={!!approveProject}
        onOpenChange={(open) => !open && setApproveProject(null)}
        project={approveProject}
        onApprove={handleApproveWithType}
        isLoading={isApproving}
      />
    </div>
  );
};

export default ProjectsTab;
