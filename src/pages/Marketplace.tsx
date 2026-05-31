import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Heart, Users, Clock, MapPin, Target, Flame, Trophy, Hash, ShieldCheck, BadgeCheck, FileText } from 'lucide-react';
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
        return;
      }

      const formattedProjects = projectsData?.map(project => {
        const featuredImage = project.project_images?.find((img: any) => img.is_featured);
        return {
          ...project,
          featured_image: featuredImage?.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=380&fit=crop'
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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_100%)]">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-home-line bg-white/90 p-8 shadow-home-glass">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-home-line border-b-home-800" />
          <p className="text-sm font-semibold text-home-muted">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)]">
      <main className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto max-w-7xl">
          <section className="mb-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
                <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
                Vitrine curada
              </div>

              <h1 className="mb-6 max-w-3xl font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
                Explore projetos reais com apoio mais confiável.
              </h1>

              <p className="mb-8 max-w-2xl text-base leading-relaxed text-home-muted md:text-lg">
                Encontre campanhas publicadas na Raiz Token, acompanhe metas, apoiadores, progresso e sinais de confiança antes de decidir apoiar.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-home-line bg-white/88 p-4 shadow-home-glass">
                  <ShieldCheck className="mb-3 h-6 w-6 text-home-800" />
                  <p className="text-sm font-semibold text-home-900">Projetos validados</p>
                  <p className="mt-1 text-xs text-home-muted">Curadoria antes da publicação.</p>
                </div>
                <div className="rounded-[24px] border border-home-line bg-white/88 p-4 shadow-home-glass">
                  <FileText className="mb-3 h-6 w-6 text-home-800" />
                  <p className="text-sm font-semibold text-home-900">Prestação de contas</p>
                  <p className="mt-1 text-xs text-home-muted">Transparência no ciclo.</p>
                </div>
                <div className="rounded-[24px] border border-home-line bg-white/88 p-4 shadow-home-glass">
                  <BadgeCheck className="mb-3 h-6 w-6 text-home-800" />
                  <p className="text-sm font-semibold text-home-900">Sinais de confiança</p>
                  <p className="mt-1 text-xs text-home-muted">Dados para apoiar melhor.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-home-line bg-white/92 p-6 shadow-home-card backdrop-blur-xl md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-home-900 text-home-gold">
                  <Hash className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold tracking-[-.025em] text-home-900">Buscar campanha por ID</h2>
                  <p className="text-sm text-home-muted">Digite o número da campanha para acessar diretamente.</p>
                </div>
              </div>
              <CampaignIdSearch variant="full" placeholder="Digite o número da campanha (ex: 1047)" className="text-left" />
            </div>
          </section>

          <section className="mb-8 rounded-[34px] border border-home-line bg-white/92 p-5 shadow-home-glass backdrop-blur-xl md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-home-100/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-home-900">
                  Filtros
                </div>
                <h2 className="font-display text-2xl font-extrabold tracking-[-.03em] text-home-900">Encontre campanhas por perfil, categoria ou evolução.</h2>
              </div>
              <p className="text-sm font-semibold text-home-muted">
                {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-800" />
                  <Input
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 rounded-2xl border-home-line bg-white pl-11 text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 w-full rounded-2xl border-home-line bg-white text-home-900 focus:ring-home-800 lg:w-[220px]">
                  <Filter className="mr-2 h-4 w-4" />
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
                <SelectTrigger className="h-12 w-full rounded-2xl border-home-line bg-white text-home-900 focus:ring-home-800 lg:w-[220px]">
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
          </section>

          {filteredProjects.length === 0 ? (
            <section className="rounded-[34px] border border-home-line bg-white/92 p-10 text-center shadow-home-glass">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-home-100 text-home-800">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="mb-2 font-display text-2xl font-extrabold tracking-[-.03em] text-home-900">Nenhum projeto encontrado.</h2>
              <p className="text-home-muted">Tente ajustar seus filtros de busca ou pesquisar por outro termo.</p>
            </section>
          ) : (
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((project) => {
                const progressPercentage = getProgressPercentage(project);
                const daysLeft = getDaysLeft(project.deadline);
                const expired = isProjectExpired(project.deadline);
                const isNearGoal = progressPercentage >= 70 && progressPercentage < 100 && !expired;
                const isCompleted = progressPercentage >= 100;
                const goal = project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
                
                return (
                  <Card 
                    key={project.id} 
                    className={`group cursor-pointer overflow-hidden rounded-[30px] border-home-line bg-white/94 shadow-home-glass transition-all duration-300 hover:-translate-y-2 hover:shadow-home-card ${
                      expired ? 'opacity-75' : ''
                    } ${isNearGoal ? 'ring-2 ring-orange-400/50' : ''} ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
                  >
                    <Link to={`/projeto/${project.id}`}>
                      <div className="relative overflow-hidden">
                        <img 
                          src={project.featured_image} 
                          alt={project.title}
                          loading="lazy"
                          decoding="async"
                          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        <Badge className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-home-900 shadow-sm backdrop-blur hover:bg-white">
                          {project.category}
                        </Badge>
                        
                        {expired && (
                          <Badge className="absolute right-4 top-4 rounded-full bg-red-600 text-white">
                            Expirado
                          </Badge>
                        )}
                        
                        {isNearGoal && !expired && (
                          <div className="absolute right-4 top-4">
                            <Badge className="flex items-center gap-1 rounded-full bg-orange-500 text-white shadow-sm">
                              <Flame className="h-3 w-3" />
                              Quase lá
                            </Badge>
                          </div>
                        )}
                        
                        {isCompleted && !expired && (
                          <div className="absolute right-4 top-4">
                            <Badge className="flex items-center gap-1 rounded-full bg-green-500 text-white shadow-sm">
                              <Trophy className="h-3 w-3" />
                              Meta atingida
                            </Badge>
                          </div>
                        )}
                        
                        {!expired && !isNearGoal && !isCompleted && (
                          <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 rounded-full bg-white/20 p-0 text-white backdrop-blur-sm hover:bg-white/30"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <CardHeader className="space-y-3 pb-4">
                        <CardTitle className="line-clamp-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900 transition-colors duration-300 group-hover:text-home-800">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-home-muted">
                          {project.description}
                        </CardDescription>
                        
                        {(project.cidade || project.estado) && (
                          <div className="flex items-center gap-1 text-xs font-medium text-home-muted">
                            <MapPin className="h-3 w-3" />
                            <span>{project.cidade}{project.estado && `, ${project.estado}`}</span>
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-end justify-between gap-3 text-sm">
                            <div>
                              <p className="font-mono text-lg font-bold text-home-900">{formatTokens(project.raised_amount)}</p>
                              <p className="text-xs text-home-muted">tokens arrecadados</p>
                            </div>
                            <span className={`font-mono text-lg font-bold ${
                              isCompleted ? 'text-green-600' : isNearGoal ? 'text-orange-500' : 'text-home-800'
                            }`}>
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          
                          <div className="relative">
                            <Progress 
                              value={progressPercentage} 
                              className={`h-2.5 rounded-full bg-home-line ${
                                isCompleted ? '[&>div]:bg-green-500' : isNearGoal ? '[&>div]:bg-orange-500' : '[&>div]:bg-home-800'
                              }`}
                            />
                            {isNearGoal && (
                              <div className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-orange-500 opacity-75" />
                            )}
                          </div>
                          
                          <div className="rounded-2xl border border-home-line bg-home-100/60 p-3 text-xs text-home-muted">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span>Meta: {formatTokens(goal)} tokens</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-home-line pt-3 text-xs text-home-muted">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{project.backers_count} apoiadores</span>
                          </div>
                          {daysLeft !== null && !expired && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{daysLeft} dias</span>
                            </div>
                          )}
                          {expired && (
                            <div className="flex items-center gap-1 text-red-600">
                              <Clock className="h-3 w-3" />
                              <span>Expirado</span>
                            </div>
                          )}
                        </div>
                        
                        {expired && (
                          <div className="rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
                            Apoios indisponíveis — projeto expirado
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
