
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, DollarSign, MapPin, Youtube, User } from 'lucide-react';
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

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-raiz-secondary" />
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
                      <Calendar className="w-4 h-4 text-raiz-secondary" />
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
