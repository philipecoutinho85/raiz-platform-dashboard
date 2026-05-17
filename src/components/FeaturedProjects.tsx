
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp, Heart, Flame, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  featured_image?: string;
  project_type?: string;
  platform_fee_percentage?: number;
}

const demoProjects: Project[] = [
  {
    id: 'demo-agrofloresta',
    title: 'Agrofloresta Comunitaria do Vale',
    description: 'Implantacao de hortas agroflorestais, capacitacao de familias produtoras e distribuicao de alimentos frescos para escolas publicas da regiao.',
    category: 'Meio ambiente',
    goal: 85000,
    raised_amount: 61200,
    backers_count: 184,
    created_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=520&fit=crop',
  },
  {
    id: 'demo-lab-digital',
    title: 'Laboratorio Digital para Jovens',
    description: 'Um espaco de tecnologia com computadores, internet e mentoria para jovens aprenderem programacao, design e empreendedorismo social.',
    category: 'Educacao',
    goal: 120000,
    raised_amount: 94000,
    backers_count: 267,
    created_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=520&fit=crop',
  },
  {
    id: 'demo-cultura-raiz',
    title: 'Circuito Cultura Raiz',
    description: 'Producao de oficinas, apresentacoes e registros audiovisuais para preservar a memoria cultural de mestres, artistas e coletivos locais.',
    category: 'Cultura',
    goal: 65000,
    raised_amount: 65000,
    backers_count: 143,
    created_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=520&fit=crop',
  },
];

const FeaturedProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      // Buscar projetos aprovados com suas imagens
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
          project_type,
          platform_fee_percentage,
         project_images(image_url, is_featured)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      // Formatar dados dos projetos
      const formattedProjects = projectsData?.map(project => ({
        ...project,
       featured_image: project.project_images?.find((img: any) => img.is_featured)?.image_url || 
                        project.project_images?.[0]?.image_url || 
                        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop'
      })) || [];

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const getProgressPercentage = (project: Project) => {
    const goal = project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal;
    return Math.min((project.raised_amount / goal) * 100, 100);
  };

  const hasRealProjects = projects.length > 0;
  const displayProjects = hasRealProjects ? projects : demoProjects;

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary mx-auto"></div>
            <p className="mt-4 text-raiz-secondary">Carregando projetos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0 && demoProjects.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
              Projetos em <span className="text-gradient">Destaque</span>
            </h2>
            <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
              Em breve teremos projetos incríveis para você apoiar!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            {hasRealProjects ? 'Projetos que fortalecem comunidades e geram ' : 'Projetos em '}
            <span className="text-gradient">{hasRealProjects ? 'impacto verdadeiro' : 'Destaque'}</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            {hasRealProjects
              ? 'Explore iniciativas sociais, ambientais e culturais que utilizam a Raiz Token para ampliar alcance e viabilizar resultados reais.'
              : 'Conheça exemplos de projetos que mostram como a Raiz Token conecta pessoas, propósito e impacto real.'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayProjects.map((project, index) => {
            const progressPercentage = getProgressPercentage(project);
            const daysLeft = getDaysLeft(project.deadline);
            const isNearGoal = progressPercentage >= 70 && progressPercentage < 100;
            const isCompleted = progressPercentage >= 100;
            
            return (
              <Card 
                key={project.id} 
                className={`overflow-hidden border-raiz-accent/20 group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-raiz-primary/40 ${
                  hasRealProjects ? 'cursor-pointer' : ''
                } ${
                  isNearGoal ? 'ring-2 ring-orange-400/50' : ''
                } ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onClick={() => hasRealProjects && navigate(`/projeto/${project.id}`)}
              >
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
                  {!hasRealProjects && (
                    <Badge variant="secondary" className="absolute bottom-4 left-4 bg-white/90 text-raiz-dark">
                      Projeto demonstrativo
                    </Badge>
                  )}
                  
                  {/* Indicador de projeto próximo da meta */}
                  {isNearGoal && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-orange-500 text-white animate-pulse flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Quase lá!
                      </Badge>
                    </div>
                  )}
                  
                  {/* Indicador de meta atingida */}
                  {isCompleted && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Meta atingida!
                      </Badge>
                    </div>
                  )}
                  
                  {!isNearGoal && !isCompleted && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Heart className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-raiz-dark line-clamp-2 group-hover:text-raiz-primary transition-colors duration-300">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="text-raiz-secondary line-clamp-3">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-raiz-secondary">
                        {formatTokens(project.raised_amount)} tokens {hasRealProjects ? 'arrecadados' : 'simulados'}
                      </span>
                      <span className={`font-bold text-lg ${
                        isCompleted ? 'text-green-500' : isNearGoal ? 'text-orange-500' : 'text-raiz-gold'
                      }`}>
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={progressPercentage} 
                        className={`h-3 bg-gray-200 ${
                          isCompleted ? '[&>div]:bg-green-500' : isNearGoal ? '[&>div]:bg-orange-500' : ''
                        }`}
                      />
                      {isNearGoal && (
                        <div className="absolute -right-1 -top-1 w-5 h-5 bg-orange-500 rounded-full animate-ping opacity-75" />
                      )}
                    </div>
                    
                    <div className="text-xs text-raiz-secondary text-center">
                      {hasRealProjects ? 'Meta' : 'Meta ilustrativa'}: {formatTokens(project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal)} tokens
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-raiz-secondary border-t pt-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{project.backers_count}</span>
                      <span>apoiadores</span>
                    </div>
                    {daysLeft !== null && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{daysLeft} dias restantes</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className={`w-full font-medium py-3 rounded-lg transform transition-all duration-300 ${
                      hasRealProjects ? 'group-hover:scale-[1.02]' : 'cursor-default'
                    } ${
                      isCompleted 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : isNearGoal 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gradient-raiz hover:opacity-90 text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasRealProjects) {
                        navigate(`/projeto/${project.id}`);
                      }
                    }}
                  >
                    {hasRealProjects ? (isCompleted ? 'Ver Projeto Completo' : isNearGoal ? 'Ajude a Completar!' : 'Ver Projeto') : 'Exemplo de projeto'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-raiz-primary text-raiz-primary hover:bg-raiz-primary hover:text-white transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate('/marketplace')}
          >
            <TrendingUp className="mr-2 w-5 h-5" />
            Ver Todos os Projetos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
