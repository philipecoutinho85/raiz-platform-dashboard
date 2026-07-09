import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, X, Plus, Coins, Info, AlertTriangle, ShieldAlert, FileCheck, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PlatformRulesModal, CONSENT_VERSION, CONSENT_TEXT } from '@/components/forms/PlatformRulesModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import TokenSimulator from '@/components/TokenSimulator';
import { useTokens } from '@/contexts/TokensContext';
import { toZonedTime } from 'date-fns-tz';
import CreatorDataProtectionNotice from '@/components/forms/CreatorDataProtectionNotice';

interface ProjectFormData {
  title: string;
  category: string;
  description: string;
  goal: number;
  deadline?: string;
  youtube_url: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  meta_pixel_id?: string;
  google_tag_id?: string;
  project_type?: 'seed' | 'regular';
}

const PROJECT_CATEGORIES = [
  {
    value: 'tecnologia',
    label: 'Tecnologia',
    description: 'Projetos de inovação, software, aplicativos, IA, robótica, soluções digitais, ferramentas para negócios e tecnologia educacional.'
  },
  {
    value: 'cultura',
    label: 'Cultura',
    description: 'Projetos de arte, música, fotografia, literatura, dança, teatro, produções culturais e eventos comunitários.'
  },
  {
    value: 'educacao',
    label: 'Educação',
    description: 'Projetos de aprendizagem, cursos, materiais didáticos, bolsas, capacitação profissional, inclusão educacional e iniciativas para estudantes.'
  },
  {
    value: 'saude',
    label: 'Saúde',
    description: 'Tratamentos médicos, exames, cirurgias, medicamentos, reabilitação e ações de apoio à saúde física ou mental.'
  },
  {
    value: 'ambiental',
    label: 'Ambiental',
    description: 'Projetos ligados à preservação, reciclagem, reflorestamento, sustentabilidade, economia circular e causas ambientais.'
  },
  {
    value: 'social',
    label: 'Social',
    description: 'Ações humanitárias, auxílio a famílias, assistência social, apoio emergencial, vulnerabilidade, inclusão social e projetos com impacto direto na comunidade.'
  },
  {
    value: 'empreendedorismo',
    label: 'Empreendedorismo',
    description: 'Projetos de MEIs, pequenos negócios, iniciativas locais, microempreendedores, expansão de negócios e ações de economia criativa.'
  },
  {
    value: 'bem-estar-animal',
    label: 'Bem-Estar Animal',
    description: 'Projetos de proteção animal, resgate, alimentação, cuidados veterinários, abrigo, adoção e preservação de animais domésticos ou silvestres.'
  },
  {
    value: 'outros',
    label: 'Outros',
    description: 'Categoria aberta para projetos que não se encaixam nas categorias existentes, garantindo liberdade e flexibilidade.'
  }
];

const CreateProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tokens } = useTokens();
  const [loading, setLoading] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialInvestment, setInitialInvestment] = useState<string>('');
  const [projectType, setProjectType] = useState<'seed' | 'regular'>('regular');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  
  // Validation states
  const [isIdentityVerified, setIsIdentityVerified] = useState<boolean | null>(null);
  const [pendingAccountability, setPendingAccountability] = useState<{ projectId: string; projectTitle: string } | null>(null);
  const [activeProject, setActiveProject] = useState<{ projectId: string; projectTitle: string; status: string } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
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

  // Check eligibility for creating projects
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setCheckingEligibility(false);
        return;
      }

      try {
        // Check if identity is verified (using stripe_onboarding_complete as KYC proxy)
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_onboarding_complete, is_identity_verified')
          .eq('id', user.id)
          .single();
        
        // For now, we'll consider stripe_onboarding_complete or is_identity_verified as KYC
        setIsIdentityVerified(profile?.stripe_onboarding_complete || profile?.is_identity_verified || false);

        // Check for active projects (pending or approved that are still running)
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id, title, status, goal, raised_amount, custom_goal, deadline, accountability_approved')
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved']);

        const now = new Date();

        // Find any active project that blocks new creation
        const activeProjectFound = userProjects?.find(p => {
          // Pending projects always block
          if (p.status === 'pending') {
            return true;
          }

          // For approved projects, check if it's still active
          if (p.status === 'approved') {
            const effectiveGoal = p.custom_goal || p.goal;
            const hasReachedGoal = p.raised_amount >= effectiveGoal;
            const hasExpired = p.deadline && new Date(p.deadline) < now;

            // Project is still active if:
            // - Has not reached goal AND has not expired
            if (!hasReachedGoal && !hasExpired) {
              return true;
            }

            // Project reached goal but accountability not approved yet
            if (hasReachedGoal && !p.accountability_approved) {
              return false; // This will be handled by pendingAccountability check
            }
          }

          return false;
        });

        if (activeProjectFound) {
          setActiveProject({
            projectId: activeProjectFound.id,
            projectTitle: activeProjectFound.title,
            status: activeProjectFound.status
          });
        }

        // Check for projects with pending accountability (100% funded but not approved)
        const projectWithPendingAccountability = userProjects?.find(p => {
          if (p.status !== 'approved') return false;
          const effectiveGoal = p.custom_goal || p.goal;
          return p.raised_amount >= effectiveGoal && !p.accountability_approved;
        });

        if (projectWithPendingAccountability) {
          setPendingAccountability({
            projectId: projectWithPendingAccountability.id,
            projectTitle: projectWithPendingAccountability.title
          });
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [user]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<ProjectFormData>();

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingFeatured(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `featured/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('project-images').getPublicUrl(fileName);
      setFeaturedImageUrl(data.publicUrl);

      toast({
        title: 'Sucesso',
        description: 'Imagem de destaque enviada!',
      });
    } catch (error: any) {
      console.error('Error uploading featured image:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar imagem de destaque.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingGallery(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const files = Array.from(event.target.files);
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery/${user?.id}/${Date.now()}-${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('project-images').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      setGalleryImages(prevImages => [...prevImages, ...imageUrls]);

      toast({
        title: 'Sucesso',
        description: 'Imagens da galeria enviadas!',
      });
    } catch (error: any) {
      console.error('Error uploading gallery images:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar imagens da galeria.',
        variant: 'destructive',
      });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setLoading(true);

      // Validate rules acceptance
      if (!rulesAccepted && !isAdmin) {
        toast({
          title: 'Erro',
          description: 'Você precisa aceitar as regras da plataforma para criar um projeto.',
          variant: 'destructive',
        });
        return;
      }

      if (!featuredImageUrl) {
        toast({
          title: 'Erro',
          description: 'Imagem de destaque é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      // Garantir que campos obrigatórios não sejam vazios
      if (!data.youtube_url || data.youtube_url.trim() === '') {
        toast({
          title: 'Erro',
          description: 'URL do vídeo do YouTube é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      // Processar deadline para horário de Brasília às 23:59:59
      let deadlineISO = null;
      if (data.deadline) {
        // Criar data no horário de Brasília às 23:59:59
        const [year, month, day] = data.deadline.split('-').map(Number);
        const brasiliaDate = toZonedTime(new Date(year, month - 1, day, 23, 59, 59), 'America/Sao_Paulo');
        deadlineISO = brasiliaDate.toISOString();
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user?.id,
          title: data.title.trim(),
          category: data.category,
          description: data.description.trim(),
          goal: data.goal,
          deadline: deadlineISO,
          youtube_url: data.youtube_url.trim(),
          endereco: data.endereco?.trim() || null,
          numero: data.numero?.trim() || null,
          complemento: data.complemento?.trim() || null,
          bairro: data.bairro?.trim() || null,
          cidade: data.cidade?.trim() || null,
          estado: data.estado?.trim() || null,
          meta_pixel_id: data.meta_pixel_id?.trim() || null,
          google_tag_id: data.google_tag_id?.trim() || null,
          status: 'pending',
          project_type: isAdmin ? projectType : 'regular',
          platform_fee_percentage: (isAdmin && projectType === 'seed') ? 0 : 10,
        })
        .select()
        .single();

      if (error) throw error;

      // Record consent for non-admin users
      if (!isAdmin && project) {
        await supabase.from('creator_consent_records').insert({
          user_id: user?.id,
          project_id: project.id,
          consent_version: CONSENT_VERSION,
          consent_text: CONSENT_TEXT,
          user_agent: navigator.userAgent
        });
      }

      // Upload featured image metadata
      await supabase
        .from('project_images')
        .insert({
          project_id: project.id,
          image_url: featuredImageUrl,
          is_featured: true,
        });

      // Upload gallery images metadata
      const galleryImageUploads = galleryImages.map(async (imageUrl) => {
        await supabase
          .from('project_images')
          .insert({
            project_id: project.id,
            image_url: imageUrl,
            is_featured: false,
          });
      });

      await Promise.all(galleryImageUploads);

      // Se o admin especificou um investimento inicial, processar
      if (isAdmin && initialInvestment && parseInt(initialInvestment) > 0) {
        const investAmount = parseInt(initialInvestment);
        
        if (investAmount > tokens) {
          toast({
            title: 'Aviso',
            description: 'Projeto criado com sucesso, mas você não tem tokens suficientes para o investimento inicial.',
            variant: 'default',
          });
        } else {
          try {
            const { error: investmentError } = await supabase.rpc(
              'support_project_with_tokens' as never,
              {
                p_project_id: project.id,
                p_amount: investAmount,
                p_description: `Investimento inicial no projeto: ${data.title}`
              } as never
            ) as { error: { message: string } | null };

            if (investmentError) throw investmentError;


            toast({
              title: 'Sucesso!',
              description: `Projeto criado e ${investAmount} tokens investidos automaticamente!`,
            });
          } catch (investError) {
            console.error('Erro ao processar investimento inicial:', investError);
            toast({
              title: 'Aviso',
              description: 'Projeto criado com sucesso, mas houve erro ao processar o investimento inicial.',
              variant: 'default',
            });
          }
        }
      } else {
        toast({
          title: 'Projeto criado!',
          description: 'Seu projeto foi enviado para análise e será publicado em breve.',
        });
      }

      navigate('/meus-projetos');
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      let errorMessage = 'Erro ao criar projeto.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.code === '23502') {
        errorMessage = 'Todos os campos obrigatórios devem ser preenchidos.';
      }
      
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can create projects
  const canCreateProject = isAdmin || (isIdentityVerified && !pendingAccountability && !activeProject);

  if (checkingEligibility) {
    return (
      <div className="min-h-screen bg-raiz-light py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Crie sua Campanha de Crowdfunding | Raiz Token</title>
        <meta name="description" content="Envie seu projeto para análise e crie uma campanha de crowdfunding na Raiz Token. Criar é gratuito e a validação acontece antes da publicação." />
        <link rel="canonical" href="https://raiztoken.com.br/criar-projeto" />
      </Helmet>

      <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
          <p className="text-raiz-secondary">
            Compartilhe sua ideia e mobilize apoiadores para seu projeto.
          </p>
        </div>

        {/* KYC Verification Required */}
        {!isAdmin && isIdentityVerified === false && (
          <Alert className="mb-6 border-red-300 bg-red-50">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Verificação de Identidade Necessária</AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mb-3">
                Para criar projetos na plataforma, você precisa completar a verificação de identidade (KYC).
                Isso garante a segurança e confiabilidade de todos os projetos.
              </p>
              <Button 
                onClick={() => navigate('/perfil?tab=payouts')}
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Completar Verificação
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Project Blocking */}
        {!isAdmin && activeProject && (
          <Alert className="mb-6 border-blue-300 bg-blue-50">
            <Clock className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">Você já possui um projeto ativo</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-3">
                Você só pode ter um projeto por vez. Para criar um novo projeto, seu projeto atual deve ser:
              </p>
              <ul className="list-disc list-inside mb-3 text-sm">
                <li>Cancelado pela administração</li>
                <li>Expirado (não atingiu a meta no prazo)</li>
                <li>Concluído (atingiu 100% da meta com prestação de contas aprovada)</li>
              </ul>
              <p className="font-medium mb-3">
                Projeto ativo: "{activeProject.projectTitle}" ({activeProject.status === 'pending' ? 'Aguardando aprovação' : 'Em andamento'})
              </p>
              <Button 
                onClick={() => navigate(activeProject.status === 'pending' ? '/meus-projetos' : `/projeto/${activeProject.projectId}`)}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {activeProject.status === 'pending' ? 'Ver Meus Projetos' : 'Ver Projeto'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Accountability Required */}
        {!isAdmin && !activeProject && pendingAccountability && (
          <Alert className="mb-6 border-amber-300 bg-amber-50">
            <FileCheck className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Prestação de Contas Pendente</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-3">
                Você possui um projeto que atingiu 100% da meta e precisa de prestação de contas aprovada 
                antes de criar um novo projeto.
              </p>
              <p className="font-medium mb-3">
                Projeto: "{pendingAccountability.projectTitle}"
              </p>
              <Button 
                onClick={() => navigate(`/projeto/${pendingAccountability.projectId}`)}
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Ir para Prestação de Contas
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className={!canCreateProject ? 'opacity-60 pointer-events-none' : ''}>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Título é obrigatório' })}
                    placeholder="Digite o título do seu projeto"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-raiz-secondary cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="text-sm">Escolha a categoria que melhor descreve seu projeto. Passe o mouse sobre cada categoria para ver sua descrição completa.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: 'Categoria é obrigatória' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <TooltipProvider>
                            {PROJECT_CATEGORIES.map((category) => (
                              <Tooltip key={category.value} delayDuration={200}>
                                <TooltipTrigger asChild>
                                  <SelectItem value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p className="text-sm">{category.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </TooltipProvider>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-red-500 text-sm">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  placeholder="Descreva seu projeto em detalhes..."
                  className="min-h-[200px] resize-y"
                />
                <p className="text-xs text-raiz-secondary">
                  Dica: Use quebras de linha para organizar sua descrição em parágrafos e facilitar a leitura.
                </p>
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>

              {/* Financial Information */}
              <div className="space-y-6">
                {/* Link to Rules Modal */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-amber-900">Taxas e Regras da Plataforma</h4>
                      <p className="text-sm text-amber-700">Clique no link abaixo para entender as taxas, prazos e regras</p>
                    </div>
                    <PlatformRulesModal />
                  </div>
                </div>
                
                <TokenSimulator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="goal">Meta em Tokens *</Label>
                    <Input
                      id="goal"
                      type="number"
                      {...register('goal', { 
                        required: 'Meta é obrigatória',
                        min: { 
                          value: isAdmin ? 1 : 1000, 
                          message: isAdmin ? 'Meta deve ser maior que zero' : 'Meta mínima é 1.000 tokens' 
                        },
                        valueAsNumber: true
                      })}
                      placeholder={isAdmin ? "Qualquer valor" : "50000"}
                      step="1"
                      min={isAdmin ? "1" : "1000"}
                    />
                    <p className="text-xs text-raiz-secondary">
                      {isAdmin 
                        ? "Como administrador, você pode definir qualquer meta"
                        : "1 token = R$ 1,00 | Meta mínima: 1.000 tokens | Taxa administrativa: 10%"
                      }
                    </p>
                    {errors.goal && (
                      <p className="text-red-500 text-sm">{errors.goal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo Final</Label>
                    <Input
                      id="deadline"
                      type="date"
                      {...register('deadline')}
                    />
                  </div>
                </div>

                {/* Admin Project Type Selection */}
                {isAdmin && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-raiz-dark font-semibold">
                        Tipo de Projeto
                      </Label>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          projectType === 'seed' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="projectType"
                          value="seed"
                          checked={projectType === 'seed'}
                          onChange={() => setProjectType('seed')}
                          className="w-4 h-4 text-green-500"
                        />
                        <div>
                          <span className="font-medium">🌱 Projeto Semente</span>
                          <p className="text-xs text-gray-600">Taxa 0% - para projetos iniciantes</p>
                        </div>
                      </label>
                      <label 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          projectType === 'regular' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="projectType"
                          value="regular"
                          checked={projectType === 'regular'}
                          onChange={() => setProjectType('regular')}
                          className="w-4 h-4 text-blue-500"
                        />
                        <div>
                          <span className="font-medium">🎯 Projeto Regular</span>
                          <p className="text-xs text-gray-600">Taxa 10%</p>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-amber-700">
                      ⚠️ Apenas administradores podem selecionar o tipo de projeto
                    </p>
                  </div>
                )}

                {/* Admin Initial Investment */}
                {isAdmin && (
                  <div className="bg-raiz-accent/10 border border-raiz-accent/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-raiz-primary" />
                        <Label htmlFor="initialInvestment" className="text-raiz-dark font-semibold">
                          Investimento Inicial (Opcional)
                        </Label>
                      </div>
                      <span className="text-sm text-raiz-secondary">
                        Saldo: {tokens} tokens
                      </span>
                    </div>
                    <Input
                      id="initialInvestment"
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(e.target.value)}
                      placeholder="Digite a quantidade de tokens"
                      min="0"
                      max={tokens}
                      step="1"
                      className="text-base"
                    />
                    <p className="text-xs text-raiz-secondary">
                      💡 Como administrador, você pode investir tokens no projeto durante sua criação para dar impulso inicial.
                      {parseInt(initialInvestment) > tokens && (
                        <span className="text-red-500 block mt-1 font-semibold">
                          ⚠️ Você não tem tokens suficientes para este investimento.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featured-image">Imagem de Destaque *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="featured-image" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Clique para enviar ou arraste e solte
                          </span>
                          <input
                            id="featured-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFeaturedImageUpload}
                            disabled={uploadingFeatured}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-2 text-xs text-gray-500">
                          <strong>Tamanho recomendado:</strong> 1200x800 pixels (proporção 3:2)
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Formato:</strong> JPG, PNG ou WebP | <strong>Tamanho máximo:</strong> 5MB
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Esta imagem será exibida como capa do seu projeto
                        </p>
                      </div>
                    </div>
                  </div>
                  {uploadingFeatured && (
                    <p className="text-sm text-blue-600">Enviando imagem...</p>
                  )}
                  {featuredImageUrl && (
                    <div className="mt-4">
                      <img
                        src={featuredImageUrl}
                        alt="Imagem de destaque"
                        className="w-full max-w-md h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Galeria de Imagens (opcional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <label htmlFor="gallery-images" className="cursor-pointer">
                        <Plus className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Adicionar mais imagens
                        </span>
                        <input
                          id="gallery-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          disabled={uploadingGallery}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Até 10 imagens adicionais para mostrar mais detalhes do projeto
                      </p>
                    </div>
                  </div>
                  {uploadingGallery && (
                    <p className="text-sm text-blue-600">Enviando imagens...</p>
                  )}
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {galleryImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Galeria ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Video */}
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL do Vídeo (YouTube) *</Label>
                <Input
                  id="youtube_url"
                  {...register('youtube_url', { required: 'URL do vídeo é obrigatória' })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.youtube_url && (
                  <p className="text-red-500 text-sm">{errors.youtube_url.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Adicione um vídeo explicativo do seu projeto
                </p>
              </div>

              {/* Tracking Configuration */}
              <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900">Configurações de Rastreamento (Opcional)</h3>
                <p className="text-sm text-blue-700">
                  Configure pixels de conversão para tráfego pago. <strong>Insira apenas o ID</strong>, não coloque códigos completos ou scripts.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_pixel_id">ID do Meta Pixel (Facebook/Instagram)</Label>
                    <Input
                      id="meta_pixel_id"
                      {...register('meta_pixel_id', {
                        validate: (value) => {
                          if (!value) return true;
                          const trimmed = value.trim();
                          if (!/^[0-9]{10,20}$/.test(trimmed)) {
                            return 'ID inválido. Deve conter apenas números (10-20 dígitos)';
                          }
                          return true;
                        }
                      })}
                      placeholder="123456789012345"
                      maxLength={20}
                    />
                    {errors.meta_pixel_id && (
                      <p className="text-red-500 text-sm">{errors.meta_pixel_id.message}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      Exemplo: 123456789012345 (apenas números)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_tag_id">ID da Google Tag (GTM/GA4)</Label>
                    <Input
                      id="google_tag_id"
                      {...register('google_tag_id', {
                        validate: (value) => {
                          if (!value) return true;
                          const trimmed = value.trim();
                          if (!/^(GTM|G|UA|AW|DC)-[A-Z0-9-]+$/.test(trimmed)) {
                            return 'ID inválido. Formato: GTM-XXXXXX, G-XXXXXXXXXX, UA-XXXXXXX-X, etc.';
                          }
                          if (trimmed.length > 30) {
                            return 'ID muito longo';
                          }
                          return true;
                        }
                      })}
                      placeholder="GTM-XXXXXXX ou G-XXXXXXXXXX"
                      maxLength={30}
                    />
                    {errors.google_tag_id && (
                      <p className="text-red-500 text-sm">{errors.google_tag_id.message}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      Exemplos: GTM-ABC123, G-ABCD123456, UA-123456-1
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-100 border border-blue-300 rounded p-3 text-sm text-blue-800">
                  <strong>⚠️ Importante:</strong> A plataforma implementará os scripts automaticamente de forma segura. 
                  Não insira códigos HTML, JavaScript ou snippets completos.
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Localização (opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      {...register('endereco')}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      {...register('numero')}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      {...register('bairro')}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      {...register('cidade')}
                      placeholder="Nome da cidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      {...register('estado')}
                      placeholder="SP, RJ, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      {...register('complemento')}
                      placeholder="Apt, Casa, etc."
                    />
                  </div>
                </div>
              </div>

              {/* LGPD Data Protection Notice */}
              <CreatorDataProtectionNotice />

              {/* Rules Consent - Obrigatório para todos os usuários */}
              <div className={`space-y-4 rounded-lg p-4 ${rulesAccepted ? 'border border-green-300 bg-green-50' : 'border-2 border-red-400 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  <FileCheck className={`h-5 w-5 ${rulesAccepted ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-semibold ${rulesAccepted ? 'text-green-900' : 'text-red-900'}`}>
                    ⚠️ Aceite Obrigatório para Criar Projeto
                  </span>
                </div>
                
                <p className={`text-sm ${rulesAccepted ? 'text-green-800' : 'text-red-800'}`}>
                  {rulesAccepted 
                    ? '✓ Você aceitou as regras da plataforma.' 
                    : 'Antes de criar seu projeto, você DEVE ler e aceitar as regras da plataforma:'}
                </p>
                
                <PlatformRulesModal />
                
                <div className={`flex items-start space-x-3 pt-2 border-t ${rulesAccepted ? 'border-green-200' : 'border-red-200'}`}>
                  <Checkbox
                    id="rules-consent"
                    checked={rulesAccepted}
                    onCheckedChange={(checked) => setRulesAccepted(checked === true)}
                    className="mt-1 h-5 w-5"
                    required
                  />
                  <Label 
                    htmlFor="rules-consent" 
                    className={`text-sm cursor-pointer leading-relaxed font-medium ${rulesAccepted ? 'text-green-900' : 'text-red-900'}`}
                  >
                    Declaro que li, entendi e estou ciente de todas as regras, taxas, prazos e do 
                    funcionamento do apoio por tokens da plataforma Raiz Token.
                  </Label>
                </div>
                
                {!rulesAccepted && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      Você precisa aceitar as regras acima para criar o projeto. O botão "Criar Projeto" está desabilitado até você marcar o checkbox.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate('/meus-projetos')}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !rulesAccepted || !canCreateProject}
                >
                  {loading ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
      </div>
    </>
  );
};

export default CreateProject;
