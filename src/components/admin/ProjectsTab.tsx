
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Check, X, Search, Filter } from 'lucide-react';

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

interface ProjectsTabProps {
  pendingProjects: Project[];
  onProjectAction: (projectId: string, action: string, reason?: string) => void;
  onRejectProject: (project: Project) => void;
  onViewProjectDetails: (project: Project) => void;
}

const ProjectsTab = ({ pendingProjects, onProjectAction, onRejectProject, onViewProjectDetails }: ProjectsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    'Tecnologia',
    'Arte',
    'Música',
    'Cinema',
    'Jogos',
    'Educação',
    'Saúde',
    'Meio Ambiente',
    'Social',
    'Negócios'
  ];

  const filteredProjects = pendingProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (pendingProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projetos Aguardando Aprovação</CardTitle>
          <CardDescription>Analise e aprove novos projetos submetidos à plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-raiz-secondary">Nenhum projeto aguardando aprovação.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos ({pendingProjects.length})</CardTitle>
        <CardDescription>Analise e gerencie projetos da plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros de busca */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-raiz-secondary" />
                <Input
                  placeholder="Buscar por título, autor ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {filteredProjects.map((project) => {
            const isExpired = project.deadline && new Date(project.deadline) < new Date();
            
            return (
              <div key={project.id} className="border border-raiz-accent/20 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-raiz-dark mb-2">{project.title}</h3>
                    <p className="text-raiz-secondary mb-2 line-clamp-2">{project.description}</p>
                    <div className="flex items-center flex-wrap gap-2 text-sm text-raiz-secondary mb-2">
                      <span>Por: {project.author}</span>
                      <Badge variant="outline">{project.category}</Badge>
                      <span>Meta: R$ {project.goal.toLocaleString()}</span>
                      <span>Submetido em: {project.submittedDate}</span>
                      {project.deadline && (
                        <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                          Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                          {isExpired && ' (Expirado)'}
                        </span>
                      )}
                    </div>
                    {project.raised_amount !== undefined && (
                      <div className="text-sm text-raiz-secondary">
                        Arrecadado: R$ {project.raised_amount.toLocaleString()} | {project.backers_count} apoiadores
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={project.status === 'approved' ? 'default' : project.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {project.status === 'approved' ? 'Aprovado' : project.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewProjectDetails(project)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {project.status === 'pending' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTab;
