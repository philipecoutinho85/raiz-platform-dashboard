
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
import { Eye, Check, X, Search, Trash2, Clock } from 'lucide-react';

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
}

interface ProjectsTabProps {
  pendingProjects: Project[];
  onProjectAction: (projectId: string, action: string, reason?: string) => void;
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const filteredProjects = pendingProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-100 text-orange-800">Cancelado</Badge>;
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
    
    // Projeto concluído (atingiu 100% da meta)
    if (isCompleted) {
      const referenceDate = new Date(project.updated_at || project.submittedDate);
      const daysPassed = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = 20 - daysPassed;
      return daysRemaining > 0 ? daysRemaining : 0;
    }
    
    // Projeto expirado (passou da deadline sem atingir a meta)
    if (project.deadline && !isCompleted) {
      const deadlineDate = new Date(project.deadline);
      deadlineDate.setHours(23, 59, 59, 999); // Final do dia
      
      // Só mostrar contador se já passou da deadline
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
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
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
                  <div className="flex items-center gap-2 mb-2">
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
                            {daysRemaining === 0 ? 'Excluir hoje' : `${daysRemaining} dias até exclusão`}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    por <strong>{project.author}</strong> • {project.submittedDate}
                  </p>
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
                      onClick={() => onProjectAction(project.id, 'approve')}
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
                
                {/* Opção de excluir para todos os status */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteProjectId(project.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum projeto encontrado com os filtros aplicados.' 
                  : 'Nenhum projeto encontrado.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este projeto? Esta ação é irreversível.
              {(() => {
                const project = pendingProjects.find(p => p.id === deleteProjectId);
                if (project && project.raised_amount && project.raised_amount > 0) {
                  const effectiveGoal = getEffectiveGoal(project);
                  const projectCompleted = project.raised_amount >= effectiveGoal;
                  const progressPercent = effectiveGoal > 0
                    ? Math.round((project.raised_amount / effectiveGoal) * 100)
                    : 0;
                  
                  if (projectCompleted) {
                    return (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          ℹ️ Projeto Concluído (100% da meta)
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Este projeto arrecadou <strong>{formatTokens(project.raised_amount)} tokens</strong> de <strong>{project.backers_count || 0} apoiador(es)</strong>.
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Como o projeto atingiu 100% da meta, <strong>os tokens NÃO serão devolvidos</strong>. Os apoiadores serão notificados sobre a exclusão.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                          ⚠️ Projeto Não Concluído ({progressPercent}% da meta)
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Este projeto arrecadou <strong>{formatTokens(project.raised_amount)} tokens</strong> de <strong>{project.backers_count || 0} apoiador(es)</strong>.
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Como o projeto NÃO atingiu a meta, <strong>todos os tokens serão devolvidos automaticamente</strong> aos apoiadores.
                        </p>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsTab;
