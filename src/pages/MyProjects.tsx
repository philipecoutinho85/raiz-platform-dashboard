
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Eye, Edit, Calendar, DollarSign, Users } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised_amount: number;
  backers_count: number;
  status: string;
  created_at: string;
  admin_notes?: string;
  featured_image?: string;
}

const MyProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_images!left(image_url, is_featured)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = data?.map(project => ({
        ...project,
        featured_image: project.project_images?.find((img: any) => img.is_featured)?.image_url
      })) || [];

      setProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar projetos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Aguardando Aprovação', color: 'text-yellow-600' },
      approved: { variant: 'default' as const, label: 'Aprovado', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, label: 'Rejeitado', color: 'text-red-600' },
      draft: { variant: 'outline' as const, label: 'Rascunho', color: 'text-gray-600' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meus Projetos</h1>
            <p className="text-raiz-secondary">
              Gerencie e acompanhe todos os seus projetos em um só lugar.
            </p>
          </div>
          
          <Link to="/criar-projeto">
            <Button className="w-full lg:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Aguardando Aprovação</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-raiz-dark mb-2">
                  {projects.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-raiz-secondary mb-6">
                  {projects.length === 0 
                    ? 'Comece criando seu primeiro projeto e compartilhe sua ideia com o mundo.'
                    : 'Tente ajustar seus filtros de busca para encontrar o que procura.'
                  }
                </p>
                {projects.length === 0 && (
                  <Link to="/criar-projeto">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Project Image */}
                    {project.featured_image && (
                      <div className="lg:w-64 h-48 lg:h-auto bg-gray-200">
                        <img
                          src={project.featured_image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Project Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-raiz-dark">{project.title}</h3>
                            {getStatusBadge(project.status)}
                          </div>
                          
                          <p className="text-raiz-secondary mb-4 line-clamp-2">
                            {project.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-raiz-secondary mb-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <Badge variant="outline">{project.category}</Badge>
                          </div>

                          {/* Progress for approved projects */}
                          {project.status === 'approved' && (
                            <div className="space-y-2 mb-4">
                              <Progress value={calculateProgress(project.raised_amount, project.goal)} />
                              <div className="flex justify-between text-sm">
                                <span className="text-raiz-dark font-semibold">
                                  {formatCurrency(project.raised_amount)}
                                </span>
                                <span className="text-raiz-secondary">
                                  {Math.round(calculateProgress(project.raised_amount, project.goal))}% da meta
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Stats for approved projects */}
                          {project.status === 'approved' && (
                            <div className="flex gap-6 mb-4">
                              <div className="flex items-center space-x-2 text-sm">
                                <DollarSign className="w-4 h-4 text-raiz-gold" />
                                <span className="text-raiz-secondary">Meta:</span>
                                <span className="font-semibold text-raiz-dark">{formatCurrency(project.goal)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Users className="w-4 h-4 text-raiz-accent" />
                                <span className="text-raiz-secondary">Apoiadores:</span>
                                <span className="font-semibold text-raiz-dark">{project.backers_count}</span>
                              </div>
                            </div>
                          )}

                          {/* Rejection reason */}
                          {project.status === 'rejected' && project.admin_notes && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-sm text-red-800">
                                <strong>Motivo da rejeição:</strong> {project.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3">
                        <Link to={`/projeto/${project.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                        
                        {(project.status === 'draft' || project.status === 'rejected') && (
                          <Button variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
