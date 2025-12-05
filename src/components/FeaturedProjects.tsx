
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp, Heart } from 'lucide-react';
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
}

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
          project_images!inner(image_url, is_featured)
        `)
        .eq('status', 'approved')
        .eq('project_images.is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos.",
          variant: "destructive"
        });
        return;
      }

      // Formatar dados dos projetos
      const formattedProjects = projectsData?.map(project => ({
        ...project,
        featured_image: project.project_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop'
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

  if (projects.length === 0) {
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
            Projetos que fortalecem comunidades e geram <span className="text-gradient">impacto verdadeiro</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            Explore iniciativas sociais, ambientais e culturais que utilizam a Raiz Token para ampliar alcance e viabilizar resultados reais.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project, index) => {
            const progressPercentage = getProgressPercentage(project);
            const daysLeft = getDaysLeft(project.deadline);
            
            return (
              <Card 
                key={project.id} 
                className="card-hover overflow-hidden border-raiz-accent/20 group cursor-pointer"
                style={{ animationDelay: `${index * 0.2}s` }}
                onClick={() => navigate(`/projeto/${project.id}`)}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={project.featured_image} 
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-4 left-4 bg-raiz-gold text-raiz-dark hover:bg-raiz-gold/90">
                    {project.category}
                  </Badge>
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 p-0"
                    >
                      <Heart className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-raiz-dark line-clamp-2 group-hover:text-raiz-primary transition-colors">
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
                        {formatTokens(project.raised_amount)} tokens arrecadados
                      </span>
                      <span className="text-raiz-gold font-bold text-lg">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    
                    <Progress 
                      value={progressPercentage} 
                      className="h-3 bg-gray-200"
                    />
                    
                    <div className="text-xs text-raiz-secondary text-center">
                      Meta: {formatTokens(project.custom_goal && project.custom_goal > 0 ? project.custom_goal : project.goal)} tokens
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
                    className="w-full bg-gradient-raiz hover:opacity-90 text-white font-medium py-3 rounded-lg transform hover:scale-[1.02] transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projeto/${project.id}`);
                    }}
                  >
                    Ver Projeto
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
