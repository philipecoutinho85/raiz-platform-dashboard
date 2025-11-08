import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, MapPin, ExternalLink, Star } from 'lucide-react';
import UserBadges from '@/components/UserBadges';
import ManageBadges from '@/components/admin/ManageBadges';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  avatar_url: string;
  created_at: string;
  cidade?: string;
  estado?: string;
}

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
  featured_image?: string;
}

interface Testimonial {
  id: string;
  content: string;
  created_at: string;
  project_id: string;
  projects?: {
    title: string;
  };
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserProjects();
      fetchUserTestimonials();
    }
    if (user) {
      checkAdminStatus();
    }
  }, [userId, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro',
        description: 'Usuário não encontrado.',
        variant: 'destructive',
      });
    }
  };

  const fetchUserProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_images!left(image_url, is_featured)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = data?.map(project => ({
        ...project,
        featured_image: project.project_images?.find((img: any) => img.is_featured)?.image_url
      })) || [];

      setProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          projects:project_id (title)
        `)
        .eq('comment_type', 'testimonial')
        .in('project_id', projects.map(p => p.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const testimonialsWithProjects = await Promise.all(
        (data || []).map(async (testimonial) => {
          const { data: project } = await supabase
            .from('projects')
            .select('title')
            .eq('id', testimonial.project_id)
            .single();

          return {
            ...testimonial,
            projects: project,
          };
        })
      );

      setTestimonials(testimonialsWithProjects as Testimonial[]);
    } catch (error: any) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome?.charAt(0) || ''}${sobrenome?.charAt(0) || ''}`.toUpperCase();
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getCompletedProjects = () => {
    return projects.filter(p => p.raised_amount >= p.goal && p.status === 'approved').length;
  };

  const getPendingProjects = () => {
    return projects.filter(p => p.status === 'pending').length;
  };

  const getApprovedProjects = () => {
    return projects.filter(p => p.status === 'approved').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-raiz-dark mb-2">Usuário não encontrado</h1>
          <p className="text-raiz-secondary">O perfil solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} alt={`${profile.nome} ${profile.sobrenome}`} />
                <AvatarFallback className="bg-raiz-primary text-white text-xl">
                  {getInitials(profile.nome, profile.sobrenome)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-raiz-dark mb-2">
                  {profile.nome} {profile.sobrenome}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-raiz-secondary mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {(profile.cidade && profile.estado) && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.cidade}, {profile.estado}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="text-center px-4 py-2 bg-raiz-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-raiz-primary">{projects.length}</div>
                    <div className="text-sm text-raiz-secondary">Total de Projetos</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{getCompletedProjects()}</div>
                    <div className="text-sm text-raiz-secondary">Concluídos</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{getApprovedProjects()}</div>
                    <div className="text-sm text-raiz-secondary">Aprovados</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-yellow-100 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{getPendingProjects()}</div>
                    <div className="text-sm text-raiz-secondary">Pendentes</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-raiz-gold/20 rounded-lg">
                    <div className="text-2xl font-bold text-raiz-gold">
                      {formatTokens(projects.reduce((sum, p) => sum + p.raised_amount, 0))}
                    </div>
                    <div className="text-sm text-raiz-secondary">Tokens Arrecadados</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-raiz-accent/20 rounded-lg">
                    <div className="text-2xl font-bold text-raiz-accent">
                      {projects.reduce((sum, p) => sum + p.backers_count, 0)}
                    </div>
                    <div className="text-sm text-raiz-secondary">Apoiadores</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Badges */}
        <UserBadges userId={userId!} />

        {/* Admin: Manage Badges */}
        {isAdmin && (
          <div className="mt-6">
            <ManageBadges userId={userId!} isAdmin={isAdmin} />
          </div>
        )}

        {/* Testimonials Section */}
        {testimonials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Testemunhos Recebidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border-l-4 border-raiz-gold pl-4 py-2">
                    <p className="text-raiz-dark mb-2">{testimonial.content}</p>
                    <p className="text-sm text-raiz-secondary">
                      Projeto: {testimonial.projects?.title} • {new Date(testimonial.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Projetos Aprovados ({getApprovedProjects()})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-raiz-secondary">Este usuário ainda não possui projetos aprovados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.filter(p => p.status === 'approved').map((project) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {project.featured_image && (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={project.featured_image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="mb-2">
                          {project.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-raiz-dark mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      
                      <p className="text-raiz-secondary text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-raiz-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress(project.raised_amount, project.goal)}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-raiz-dark font-semibold">
                            {formatTokens(project.raised_amount)} tokens
                          </span>
                          <span className="text-raiz-secondary">
                            {Math.round(calculateProgress(project.raised_amount, project.goal))}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-raiz-secondary">
                          <span>Meta: {formatTokens(project.goal)} tokens</span>
                          <span>{project.backers_count} apoiadores</span>
                        </div>
                        
                        <Button 
                          className="w-full mt-4" 
                          size="sm"
                          onClick={() => navigate(`/projeto/${project.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Projeto
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicProfile;
