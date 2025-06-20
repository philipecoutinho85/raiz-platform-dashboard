
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  status: string;
  created_at: string;
  deadline?: string;
}

const MyProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    'Tecnologia',
    'Arte e Cultura',
    'Meio Ambiente',
    'Educação',
    'Saúde',
    'Esportes',
    'Negócios',
    'Outros'
  ];

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, categoryFilter]);

  const fetchUserProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos.",
          variant: "destructive"
        });
        return;
      }

      setProjects(projects || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar projetos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(project => project.category === categoryFilter);
    }

    setFilteredProjects(filtered);
  };

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meus Projetos</h1>
            <p className="text-raiz-secondary">
              Gerencie e acompanhe todos os seus projetos
            </p>
          </div>
          <Button asChild className="bg-raiz-primary hover:bg-raiz-primary/90">
            <Link to="/criar-projeto" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                <Input
                  placeholder="Buscar projetos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-raiz-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-raiz-primary" />
              </div>
              <h3 className="text-lg font-semibold text-raiz-dark mb-2">
                {projects.length === 0 ? 'Nenhum projeto criado' : 'Nenhum projeto encontrado'}
              </h3>
              <p className="text-raiz-secondary mb-6">
                {projects.length === 0
                  ? 'Crie seu primeiro projeto e comece a arrecadar fundos para suas ideias.'
                  : 'Tente ajustar os filtros ou criar um novo projeto.'
                }
              </p>
              <Button asChild className="bg-raiz-primary hover:bg-raiz-primary/90">
                <Link to="/criar-projeto">Criar Projeto</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 line-clamp-2">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusBadge(project.status)}
                        <Badge variant="outline">{project.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-raiz-secondary">
                        <DollarSign className="w-4 h-4" />
                        <span>Meta:</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(project.goal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-raiz-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>Criado:</span>
                      </div>
                      <span>{formatDate(project.created_at)}</span>
                    </div>

                    {project.deadline && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-raiz-secondary">
                          <Calendar className="w-4 h-4" />
                          <span>Prazo:</span>
                        </div>
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/projeto/${project.id}`} className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </Link>
                      </Button>
                      {project.status === 'pending' && (
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link to={`/editar-projeto/${project.id}`} className="flex items-center space-x-1">
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                          </Link>
                        </Button>
                      )}
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
