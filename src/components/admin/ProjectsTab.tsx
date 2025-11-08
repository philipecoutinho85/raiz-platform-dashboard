
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
import { Eye, Check, X, Search, Trash2 } from 'lucide-react';

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
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
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
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    por <strong>{project.author}</strong> • {project.submittedDate}
                  </p>
                  {project.status === 'approved' && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Meta: {formatTokens(project.goal)} tokens</span>
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
              Tem certeza de que deseja excluir este projeto? Esta ação é irreversível e todos os dados relacionados ao projeto serão perdidos.
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
