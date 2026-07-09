import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, DollarSign, MapPin, Youtube, User, Users, Target, Clock, Edit, Save, X, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectContributors from '@/components/ProjectContributors';
import Footer from '@/components/Footer';
import { formatToBrasilia } from '@/lib/dateUtils';

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
  description_edited_at?: string;
  description_edit_count?: number;
  accountability_report?: string;
  accountability_images?: string[];
  accountability_submitted_at?: string;
  accountability_approved?: boolean;
  can_create_new_project?: boolean;
  admin_fee_percentage?: number;
  custom_goal?: number;
  platform_fee_percentage?: number;
  project_type?: string;
  short_id?: number;
}

interface Profile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  avatar_url?: string;
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
}

interface ProjectImage {
  id: string;
  image_url: string;
  is_featured: boolean;
}

import ProjectGallery from '@/components/ProjectGallery';
import SocialShare from '@/components/SocialShare';
import ProjectComments from '@/components/ProjectComments';
import UserBadges from '@/components/UserBadges';
import ProjectAccountability from '@/components/ProjectAccountability';
import ProjectBadges from '@/components/ProjectBadges';
import TokenSupportDialog from '@/components/TokenSupportDialog';
import { ProjectWithdrawal } from '@/components/ProjectWithdrawal';
import { ProjectReport } from '@/components/ProjectReport';
import { LoginRequiredModal } from '@/components/LoginRequiredModal';
import RaizScore from '@/components/RaizScore';
import { WithdrawalCorrectionAlert } from '@/components/WithdrawalCorrectionAlert';
import { StripePaymentButton } from '@/components/StripePaymentButton';
import ProjectUpdates from '@/components/ProjectUpdates';
import CampaignQRShare from '@/components/CampaignQRShare';

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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    };
    
    checkAdminStatus();
  }, [user]);

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
      setEditedDescription(project.description);

      // Fetch project owner profile with Stripe info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email, avatar_url, stripe_account_id, stripe_onboarding_complete')
        .eq('id', project.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        setProfile(profile as Profile);
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

      // Check if current user is a supporter
      if (user) {
        const { data: contribution } = await supabase
          .from('project_contributions')
          .select('id')
          .eq('project_id', id)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .maybeSingle();
        setIsSupporter(!!contribution);
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

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    return formatToBrasilia(dateString, 'dd/MM/yyyy');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getEffectiveGoal = () => {
    if (!project) return 0;
    return project.custom_goal || project.goal;
  };

  const getProgressPercentage = () => {
    if (!project) return 0;
    const effectiveGoal = getEffectiveGoal();
    return Math.min((project.raised_amount / effectiveGoal) * 100, 100);
  };

  const getDaysLeft = () => {
    if (!project?.deadline) return null;
    
    const today = new Date();
    const endDate = new Date(project.deadline);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const isProjectExpired = () => {
    if (!project?.deadline) return false;
    const today = new Date();
    const endDate = new Date(project.deadline);
    return today > endDate;
  };

  const isProjectCompleted = () => {
    if (!project) return false;
    const effectiveGoal = getEffectiveGoal();
    return project.raised_amount >= effectiveGoal;
  };

  const canSupportProject = () => {
    if (!project || isOwner) return false;
    if (project.status !== 'approved') return false;
    if (isProjectExpired()) return false;
    if (isProjectCompleted()) return false;
    return true;
  };

  const isOwner = user?.id === project?.user_id;

  const handleSaveDescription = async () => {
    if (!project || !editedDescription.trim()) {
      toast({
        title: "Erro",
        description: "A descrição não pode estar vazia.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          description: editedDescription,
          description_edited_at: new Date().toISOString(),
          description_edit_count: (project.description_edit_count || 0) + 1
        })
        .eq('id', project.id);

      if (error) throw error;

      setProject({
        ...project,
        description: editedDescription,
        description_edited_at: new Date().toISOString(),
        description_edit_count: (project.description_edit_count || 0) + 1
      });
      setIsEditingDescription(false);

      toast({
        title: "Sucesso",
        description: "Descrição atualizada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error updating description:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar descrição.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedDescription(project?.description || '');
    setIsEditingDescription(false);
  };

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
  const seoDescriptionSource = project.description?.trim();
  const seoDescription = seoDescriptionSource
    ? seoDescriptionSource.slice(0, 155)
    : 'Conheça este projeto de crowdfunding validado na Raiz Token e apoie com segurança e transparência.';

  return (
    <>
      <Helmet>
        <title>{`${project.title} | Crowdfunding na Raiz Token`}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`https://raiztoken.com.br/projeto/${id || project.id}`} />
      </Helmet>

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
          <div className="flex items-center gap-3">
            <ProjectReport projectId={project.id} />
            <SocialShare 
              title={project.title}
              description={project.description}
              url={window.location.href}
            />
            {getStatusBadge(project.status)}
          </div>
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

            {/* Badges do Projeto */}
            {project && (
              <ProjectBadges projectId={project.id} showTitle={true} compact={false} />
            )}

            {/* Project Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                    <div className="flex flex-col space-y-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{project.category}</Badge>
                        {profile && (
                          <Link 
                            to={`/usuario/${profile.id}`}
                            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={profile.avatar_url} alt={`${profile.nome} ${profile.sobrenome}`} />
                              <AvatarFallback className="bg-raiz-primary text-white text-xs">
                                {profile.nome?.charAt(0)}{profile.sobrenome?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs text-raiz-secondary">Autor do Projeto</span>
                              <span className="text-sm font-medium text-raiz-dark">
                                {profile.nome} {profile.sobrenome}
                              </span>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingDescription ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="min-h-[200px] resize-y"
                      placeholder="Descreva seu projeto em detalhes..."
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveDescription} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-raiz-secondary leading-relaxed whitespace-pre-wrap">
                      {project.description}
                    </p>
                    {project.description_edited_at && (
                      <p className="text-xs text-raiz-secondary italic">
                        Descrição editada em {formatDate(project.description_edited_at)}
                      </p>
                    )}
                    {isOwner && (
                      <Button 
                        onClick={() => setIsEditingDescription(true)} 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Descrição
                      </Button>
                    )}
                  </div>
                )}
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

            {/* Social Share */}
            <SocialShare 
              title={project.title}
              description={project.description}
              url={window.location.href}
            />

            {/* Novidades do Projeto */}
            <ProjectUpdates
              projectId={project.id}
              projectOwnerId={project.user_id}
              isSupporter={isSupporter}
              projectStatus={project.status}
              onLoginRequired={() => setShowLoginModal(true)}
            />

            {/* Comments and Feedback */}
            <ProjectComments 
              projectId={project.id}
              projectOwnerId={project.user_id}
              isProjectCompleted={project.status === 'approved' && project.raised_amount >= getEffectiveGoal()}
              onLoginRequired={() => setShowLoginModal(true)}
            />

            {/* Contributors */}
            <ProjectContributors projectId={project.id} />

            {/* Accountability */}
            <ProjectAccountability
              projectId={project.id}
              projectUserId={project.user_id}
              currentUserId={user?.id}
              accountabilityReport={project.accountability_report}
              accountabilityImages={project.accountability_images}
              accountabilitySubmittedAt={project.accountability_submitted_at}
              accountabilityApproved={project.accountability_approved}
              goalReached={project.raised_amount >= getEffectiveGoal()}
              projectStatus={project.status}
              isSupporter={isSupporter}
              isAdmin={isAdmin}
            />

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
                    {formatTokens(project.raised_amount)} tokens
                  </div>
                  <div className="text-sm text-raiz-secondary">
                    arrecadados de {formatTokens(getEffectiveGoal())} tokens
                  </div>
                  
                  {/* Mostrar valores líquidos para o criador */}
                  {isOwner && project.raised_amount > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-lg text-left">
                      <p className="text-xs text-muted-foreground mb-1">Valores para você:</p>
                      {project.project_type === 'seed' ? (
                        <p className="text-sm font-medium text-green-600">
                          💰 Você recebe: R$ {formatTokens(project.raised_amount)},00 (sem taxa)
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-primary">
                          💰 Você recebe: R$ {formatTokens(Math.round(project.raised_amount * 0.9))},00
                        </p>
                      )}
                    </div>
                  )}
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

                {!isOwner && canSupportProject() && (
                  <div className="space-y-3">
                    {/* Stripe Payment (Real Money) */}
                    <StripePaymentButton
                      projectId={project.id}
                      projectTitle={project.title}
                      creatorHasStripe={!!profile?.stripe_onboarding_complete}
                      isOwner={isOwner}
                    />
                    
                    {/* Token Support (Platform Tokens) */}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (!user) {
                          setShowLoginModal(true);
                          return;
                        }
                        setIsSupportDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      Apoiar com Tokens
                    </Button>
                  </div>
                )}
                
                {!isOwner && !canSupportProject() && (
                  <Button 
                    disabled
                    className="w-full opacity-50 cursor-not-allowed"
                  >
                    {isProjectExpired() ? 'Projeto Expirado' : 
                     isProjectCompleted() ? 'Meta Atingida' : 
                     'Apoiar'}
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
                  <span className="font-semibold">{formatTokens(getEffectiveGoal())} tokens</span>
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

            {/* Campaign ID & QR Code - Visible to owner */}
            {isOwner && project.short_id && (
              <CampaignQRShare 
                shortId={project.short_id} 
                projectTitle={project.title}
              />
            )}

            {/* Campaign ID badge - Visible to all */}
            {!isOwner && project.short_id && (
              <CampaignQRShare 
                shortId={project.short_id} 
                projectTitle={project.title}
                compact={true}
              />
            )}
            {isOwner && (
              <WithdrawalCorrectionAlert 
                projectId={project.id} 
                userId={user?.id || ''}
              />
            )}

            {/* Withdrawal Request - apenas para projetos que atingiram a meta */}
            {isOwner && project.status === 'approved' && progressPercentage >= 100 && (
              <ProjectWithdrawal
                projectId={project.id}
                userId={user?.id || ''}
                raisedAmount={project.raised_amount}
                adminFee={project.admin_fee_percentage || 10}
                isOwner={isOwner}
              />
            )}

            {/* Credibilidade do Criador */}
            {profile && (
              <Card className="border-2 border-raiz-gold/30 bg-gradient-to-br from-raiz-gold/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-raiz-gold">
                    <Award className="w-5 h-5" />
                    Credibilidade do Criador
                  </CardTitle>
                  <CardDescription>
                    Reconhecimentos conquistados por {profile.nome}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* RaizScore */}
                  <div className="mb-4">
                    <RaizScore userId={profile.id} showDetails={false} />
                  </div>
                  {/* Badges */}
                  <UserBadges userId={profile.id} showTitle={false} compact={true} />
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      <TokenSupportDialog
        isOpen={isSupportDialogOpen}
        onClose={() => setIsSupportDialogOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        projectGoal={getEffectiveGoal()}
        projectRaisedAmount={project.raised_amount}
        onSuccess={fetchProject}
      />

      <LoginRequiredModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <Footer />
      </div>
    </>
  );
};

export default ProjectDetail;
