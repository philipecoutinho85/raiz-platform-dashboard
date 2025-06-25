import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, DollarSign, MapPin, Youtube, User, Users, Target, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectContributors from '@/components/ProjectContributors';

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
  deadline?: string;
  youtube_url: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  user_id: string;
}

interface Profile {
  nome: string;
  sobrenome: string;
  email: string;
}

interface ProjectImage {
  id: string;
  image_url: string;
  is_featured: boolean;
}

import ProjectGallery from '@/components/ProjectGallery';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Erro",
          description: "Projeto não encontrado.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setProject(project);

      // Fetch project owner profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nome, sobrenome, email')
        .eq('id', project.user_id)
        .single();

      if (!profileError) {
        setProfile(profile);
      }

      // Fetch project images
      const { data: images, error: imagesError } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', id)
        .order('is_featured', { ascending: false });

      if (!imagesError && images) {
        setImages(images);
        const featuredImage = images.find(img => img.is_featured);
        setSelectedImage(featuredImage?.image_url || images[0]?.image_url || '');
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar projeto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const getYouTubeEmbedUrl = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getProgressPercentage = () => {
    if (!project) return 0;
    return Math.min((project.raised_amount / project.goal) * 100, 100);
  };

  const getDaysLeft = () => {
    if (!project?.deadline) return null;
    
    const today = new Date();
    const endDate = new Date(project.deadline);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const isOwner = user?.id === project?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-raiz-dark mb-2">Projeto não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(project.youtube_url);
  const progressPercentage = getProgressPercentage();
  const daysLeft = getDaysLeft();

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/meus-projetos')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
          {getStatusBadge(project.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Images */}
            {images.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt={project.title}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((image) => (
                          <img
                            key={image.id}
                            src={image.image_url}
                            alt={`Projeto ${project.title}`}
                            className={`w-full h-20 object-cover rounded cursor-pointer transition-all ${
                              selectedImage === image.image_url 
                                ? 'ring-2 ring-raiz-primary' 
                                : 'hover:opacity-80'
                            }`}
                            onClick={() => setSelectedImage(image.image_url)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge variant="outline">{project.category}</Badge>
                      {profile && (
                        <div className="flex items-center space-x-1 text-sm text-raiz-secondary">
                          <User className="w-4 h-4" />
                          <span>por {profile.nome} {profile.sobrenome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-secondary leading-relaxed">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* Video */}
            {embedUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Youtube className="w-5 h-5" />
                    <span>Vídeo do Projeto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      title="Project Video"
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Gallery */}
            <ProjectGallery projectId={project.id} isOwner={isOwner} />

            {/* Contributors */}
            <ProjectContributors projectId={project.id} />

            {/* Location */}
            {(project.endereco || project.cidade || project.estado) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Localização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-raiz-secondary">
                    {project.endereco && (
                      <p>
                        {project.endereco}
                        {project.numero && `, ${project.numero}`}
                        {project.complemento && `, ${project.complemento}`}
                      </p>
                    )}
                    {project.bairro && <p>{project.bairro}</p>}
                    {(project.cidade || project.estado) && (
                      <p>
                        {project.cidade}
                        {project.estado && `, ${project.estado}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso da Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-raiz-primary mb-2">
                    {formatCurrency(project.raised_amount)}
                  </div>
                  <div className="text-sm text-raiz-secondary">
                    arrecadados de {formatCurrency(project.goal)}
                  </div>
                </div>

                <Progress value={progressPercentage} className="h-3" />

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xl font-bold text-raiz-gold">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-xs text-raiz-secondary">da meta</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-raiz-primary">
                      {project.backers_count}
                    </div>
                    <div className="text-xs text-raiz-secondary">apoiadores</div>
                  </div>
                  {daysLeft !== null && (
                    <div>
                      <div className="text-xl font-bold text-raiz-dark">
                        {daysLeft}
                      </div>
                      <div className="text-xs text-raiz-secondary">dias restantes</div>
                    </div>
                  )}
                </div>

                {project.status === 'approved' && !isOwner && (
                  <Button className="w-full bg-raiz-primary hover:bg-raiz-primary/90 text-white font-medium py-3">
                    Apoiar este Projeto
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-raiz-secondary" />
                    <span className="text-sm text-raiz-secondary">Meta:</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(project.goal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-raiz-secondary" />
                    <span className="text-sm text-raiz-secondary">Criado:</span>
                  </div>
                  <span>{formatDate(project.created_at)}</span>
                </div>

                {project.deadline && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-raiz-secondary" />
                      <span className="text-sm text-raiz-secondary">Prazo:</span>
                    </div>
                    <span>{formatDate(project.deadline)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.status === 'pending' && (
                    <Button variant="outline" className="w-full">
                      Editar Projeto
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.open(project.youtube_url, '_blank')}
                    className="w-full flex items-center space-x-2"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Ver no YouTube</span>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            {profile && !isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Contato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{profile.nome} {profile.sobrenome}</p>
                    <p className="text-sm text-raiz-secondary">{profile.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
