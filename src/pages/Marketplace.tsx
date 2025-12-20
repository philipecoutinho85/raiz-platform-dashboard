
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Heart, Users, Clock, MapPin, Target, Flame, Trophy, Sprout, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import CampaignIdSearch from '@/components/CampaignIdSearch';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  custom_goal?: number;
  raised_amount: number;
  backers_count: number;
  created_at: string;
  deadline?: string;
  cidade?: string;
  estado?: string;
  featured_image?: string;
  project_type?: string;
  platform_fee_percentage?: number;
}

const Marketplace = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

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

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, selectedCategory, sortBy]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          category,
          goal,
          custom_goal,
          raised_amount,
          backers_count,
          created_at,
          deadline,
          cidade,
          estado,
          project_type,
          platform_fee_percentage,
          project_images(image_url, is_featured)
        `)
        .eq('status', 'approved')
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

      const formattedProjects = projectsData?.map(project => {
        const featuredImage = project.project_images?.find((img: any) => img.is_featured);
        return {
          ...project,
          featured_image: featuredImage?.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop'
        };
      }) || [];

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    const getEffectiveGoal = (project: Project) =>
      project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'goal_high': {
          const goalA = getEffectiveGoal(a);
          const goalB = getEffectiveGoal(b);
          return goalB - goalA;
        }
        case 'goal_low': {
          const goalA = getEffectiveGoal(a);
          const goalB = getEffectiveGoal(b);
          return goalA - goalB;
        }
        case 'progress': {
          const goalA = getEffectiveGoal(a) || 1;
          const goalB = getEffectiveGoal(b) || 1;
          const progressA = (a.raised_amount / goalA) * 100;
          const progressB = (b.raised_amount / goalB) * 100;
          return progressB - progressA;
        }
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getProgressPercentage = (project: Project) => {
    const goal = project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
    return Math.min((project.raised_amount / goal) * 100, 100);
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const isProjectExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light">
      {/* Hero Section */}
      <div className="bg-gradient-raiz text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Descubra Projetos Incríveis
          </h1>
          <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Explore centenas de projetos inovadores e apoie ideias que transformam o mundo
          </p>
          
          {/* Busca por ID em destaque */}
          <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Hash className="w-5 h-5" />
              <span className="font-semibold">Buscar campanha por ID</span>
            </div>
            <CampaignIdSearch variant="full" placeholder="Digite o número da campanha (ex: 1047)" className="text-left" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-raiz-accent/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-raiz-secondary" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="goal_high">Maior meta</SelectItem>
                <SelectItem value="goal_low">Menor meta</SelectItem>
                <SelectItem value="progress">Maior progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-raiz-secondary">
            {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-raiz-secondary">Nenhum projeto encontrado.</p>
            <p className="text-raiz-secondary mt-2">Tente ajustar seus filtros de busca.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => {
              const progressPercentage = getProgressPercentage(project);
              const daysLeft = getDaysLeft(project.deadline);
              const expired = isProjectExpired(project.deadline);
              const isNearGoal = progressPercentage >= 70 && progressPercentage < 100 && !expired;
              const isCompleted = progressPercentage >= 100;
              
              return (
                <Card 
                  key={project.id} 
                  className={`overflow-hidden border-raiz-accent/20 group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-raiz-primary/40 ${
                    expired ? 'opacity-75' : ''
                  } ${isNearGoal ? 'ring-2 ring-orange-400/50' : ''} ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
                >
                  <Link to={`/projeto/${project.id}`}>
                    <div className="relative overflow-hidden">
                      <img 
                        src={project.featured_image} 
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-4 left-4 bg-raiz-gold text-raiz-dark hover:bg-raiz-gold/90 transition-transform group-hover:scale-105">
                        {project.category}
                      </Badge>
                      
                      {/* Indicador de expirado */}
                      {expired && (
                        <Badge className="absolute top-4 right-4 bg-red-600 text-white">
                          Expirado
                        </Badge>
                      )}
                      
                      {/* Indicador de projeto próximo da meta */}
                      {isNearGoal && !expired && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-orange-500 text-white animate-pulse flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Quase lá!
                          </Badge>
                        </div>
                      )}
                      
                      {/* Indicador de meta atingida */}
                      {isCompleted && !expired && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Meta atingida!
                          </Badge>
                        </div>
                      )}
                      
                      {/* Botão de favorito */}
                      {!expired && !isNearGoal && !isCompleted && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <Heart className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {project.project_type === 'seed' ? (
                          <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                            <Sprout className="w-3 h-3" />
                            Taxa 0%
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Taxa 10%
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-raiz-dark line-clamp-2 group-hover:text-raiz-primary transition-colors duration-300">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-raiz-secondary line-clamp-2">
                        {project.description}
                      </CardDescription>
                      
                      {(project.cidade || project.estado) && (
                        <div className="flex items-center space-x-1 text-xs text-raiz-secondary">
                          <MapPin className="w-3 h-3" />
                          <span>{project.cidade}{project.estado && `, ${project.estado}`}</span>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-raiz-secondary">
                            {formatTokens(project.raised_amount)} tokens
                          </span>
                          <span className={`font-bold ${
                            isCompleted ? 'text-green-500' : isNearGoal ? 'text-orange-500' : 'text-raiz-gold'
                          }`}>
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        
                        <div className="relative">
                          <Progress 
                            value={progressPercentage} 
                            className={`h-2 bg-gray-200 ${
                              isCompleted ? '[&>div]:bg-green-500' : isNearGoal ? '[&>div]:bg-orange-500' : ''
                            }`}
                          />
                          {isNearGoal && (
                            <div className="absolute -right-1 -top-1 w-4 h-4 bg-orange-500 rounded-full animate-ping opacity-75" />
                          )}
                        </div>
                        
                        <div className="text-xs text-raiz-secondary">
                          <div className="flex items-center space-x-1 mb-1">
                            <Target className="w-3 h-3" />
                            <span>Meta: {formatTokens(project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal)} tokens</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-raiz-secondary border-t pt-3">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{project.backers_count} apoiadores</span>
                        </div>
                        {daysLeft !== null && !expired && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{daysLeft} dias</span>
                          </div>
                        )}
                        {expired && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <Clock className="w-3 h-3" />
                            <span>Expirado</span>
                          </div>
                        )}
                      </div>
                      
                      {expired && (
                        <div className="text-center text-xs text-red-600 font-medium">
                          Doações não disponíveis - Projeto expirado
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;
