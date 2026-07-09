import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { AlertTriangle, Clock, FileCheck, ShieldCheck, Upload, X, Plus } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlatformRulesModal, CONSENT_TEXT, CONSENT_VERSION } from '@/components/forms/PlatformRulesModal';
import CreatorDataProtectionNotice from '@/components/forms/CreatorDataProtectionNotice';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProjectDraftFormData {
  title: string;
  category: string;
  description: string;
  goal: number;
  deadline?: string;
  youtube_url?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  meta_pixel_id?: string;
  google_tag_id?: string;
}

type ProjectSubmitStatus = 'draft' | 'pending';

const PROJECT_CATEGORIES = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'educacao', label: 'Educacao' },
  { value: 'saude', label: 'Saude' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'social', label: 'Social' },
  { value: 'empreendedorismo', label: 'Empreendedorismo' },
  { value: 'bem-estar-animal', label: 'Bem-Estar Animal' },
  { value: 'outros', label: 'Outros' },
];

const toDeadlineIso = (deadline?: string) => {
  if (!deadline) return null;
  return new Date(`${deadline}T23:59:59-03:00`).toISOString();
};

const toDateInputValue = (deadline?: string | null) => {
  if (!deadline) return '';
  return new Date(deadline).toISOString().slice(0, 10);
};

const CreateProjectDraft = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const isEditing = Boolean(projectId);
  const [loadingAction, setLoadingAction] = useState<ProjectSubmitStatus | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [editingProjectStatus, setEditingProjectStatus] = useState<string | null>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState<boolean | null>(null);
  const [activeProject, setActiveProject] = useState<{ id: string; title: string; status: string } | null>(null);
  const [pendingAccountability, setPendingAccountability] = useState<{ id: string; title: string } | null>(null);
  const [checkingUserState, setCheckingUserState] = useState(true);

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm<ProjectDraftFormData>({
    defaultValues: {
      title: '',
      category: '',
      description: '',
      goal: 1000,
      youtube_url: '',
    },
  });

  useEffect(() => {
    const checkUserState = async () => {
      if (!user) {
        setCheckingUserState(false);
        return;
      }

      try {
        const [{ data: roleData }, { data: profile }, { data: projects }] = await Promise.all([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('stripe_onboarding_complete, is_identity_verified')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('projects')
            .select('id, title, status, goal, custom_goal, raised_amount, deadline, accountability_approved')
            .eq('user_id', user.id)
            .in('status', ['pending', 'approved']),
        ]);

        setIsAdmin(!!roleData);
        setIsIdentityVerified(!!(profile?.stripe_onboarding_complete || profile?.is_identity_verified));

        const now = new Date();
        const blockingProject = projects?.find((project) => {
          if (project.status === 'pending') return true;
          if (project.status !== 'approved') return false;

          const effectiveGoal = project.custom_goal || project.goal;
          const hasReachedGoal = project.raised_amount >= effectiveGoal;
          const hasExpired = project.deadline && new Date(project.deadline) < now;

          return !hasReachedGoal && !hasExpired;
        });

        if (blockingProject) {
          setActiveProject({
            id: blockingProject.id,
            title: blockingProject.title,
            status: blockingProject.status,
          });
        }

        const projectWithPendingAccountability = projects?.find((project) => {
          if (project.status !== 'approved') return false;
          const effectiveGoal = project.custom_goal || project.goal;
          return project.raised_amount >= effectiveGoal && !project.accountability_approved;
        });

        if (projectWithPendingAccountability) {
          setPendingAccountability({
            id: projectWithPendingAccountability.id,
            title: projectWithPendingAccountability.title,
          });
        }
      } catch (error) {
        console.error('Error checking project draft eligibility:', error);
      } finally {
        setCheckingUserState(false);
      }
    };

    checkUserState();
  }, [user]);

  useEffect(() => {
    const loadProjectForEdit = async () => {
      if (!user || !projectId) return;

      try {
        setLoadingProject(true);

        const { data: project, error } = await (supabase as any)
          .from('projects')
          .select('*, project_images(image_url, is_featured)')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!project) {
          toast({
            title: 'Projeto nao encontrado',
            description: 'Nao foi possivel localizar um rascunho deste usuario para edicao.',
            variant: 'destructive',
          });
          navigate('/meus-projetos');
          return;
        }

        if (!['draft', 'rejected'].includes(project.status)) {
          toast({
            title: 'Edicao bloqueada',
            description: 'Somente projetos em rascunho ou rejeitados podem ser editados por aqui.',
            variant: 'destructive',
          });
          navigate('/meus-projetos');
          return;
        }

        reset({
          title: project.title || '',
          category: project.category || '',
          description: project.description || '',
          goal: Number(project.goal || 1000),
          deadline: toDateInputValue(project.deadline),
          youtube_url: project.youtube_url || '',
          endereco: project.endereco || '',
          numero: project.numero || '',
          complemento: project.complemento || '',
          bairro: project.bairro || '',
          cidade: project.cidade || '',
          estado: project.estado || '',
          meta_pixel_id: project.meta_pixel_id || '',
          google_tag_id: project.google_tag_id || '',
        });

        const images = Array.isArray(project.project_images) ? project.project_images : [];
        const featuredImage = images.find((image: any) => image?.is_featured)?.image_url || '';
        const gallery = images
          .filter((image: any) => !image?.is_featured && image?.image_url)
          .map((image: any) => image.image_url);

        setFeaturedImageUrl(featuredImage);
        setGalleryImages(gallery);
        setEditingProjectStatus(project.status);
      } catch (error: any) {
        console.error('Error loading project for edit:', error);
        toast({
          title: 'Erro ao carregar projeto',
          description: error.message || 'Nao foi possivel preparar a edicao do projeto.',
          variant: 'destructive',
        });
        navigate('/meus-projetos');
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectForEdit();
  }, [projectId, user, reset, navigate, toast]);

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingFeatured(true);

      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `featured/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('project-images').getPublicUrl(fileName);
      setFeaturedImageUrl(data.publicUrl);

      toast({
        title: 'Imagem enviada',
        description: 'A imagem de destaque foi salva para este projeto.',
      });
    } catch (error) {
      console.error('Error uploading featured image:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingGallery(true);

      const files = Array.from(event.target.files || []);
      if (!files.length || !user) return;

      const imageUrls = await Promise.all(
        files.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery/${user.id}/${Date.now()}-${index}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('project-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('project-images').getPublicUrl(fileName);
          return data.publicUrl;
        }),
      );

      setGalleryImages((currentImages) => [...currentImages, ...imageUrls]);
      toast({
        title: 'Galeria atualizada',
        description: 'As imagens adicionais foram salvas para este projeto.',
      });
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      toast({
        title: 'Erro ao enviar galeria',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((currentImages) => currentImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const validateReviewSubmission = () => {
    if (!isAdmin && !isIdentityVerified) {
      toast({
        title: 'Verificacao de identidade necessaria',
        description: 'Voce pode salvar o projeto como rascunho agora. Para enviar para analise, conclua a verificacao de identidade.',
        variant: 'destructive',
      });
      navigate('/perfil?tab=payouts');
      return false;
    }

    if (!isAdmin && activeProject) {
      toast({
        title: 'Projeto ativo encontrado',
        description: 'Voce ja possui um projeto ativo ou aguardando analise. Salve este como rascunho e envie depois.',
        variant: 'destructive',
      });
      return false;
    }

    if (!isAdmin && pendingAccountability) {
      toast({
        title: 'Prestacao de contas pendente',
        description: 'Finalize a prestacao de contas do projeto anterior antes de enviar um novo projeto para analise.',
        variant: 'destructive',
      });
      return false;
    }

    if (!rulesAccepted && !isAdmin) {
      toast({
        title: 'Aceite das regras necessario',
        description: 'Para enviar o projeto para analise, leia e aceite as regras da plataforma.',
        variant: 'destructive',
      });
      return false;
    }

    if (!featuredImageUrl) {
      toast({
        title: 'Imagem de destaque necessaria',
        description: 'Para enviar o projeto para analise, adicione uma imagem de destaque.',
        variant: 'destructive',
      });
      return false;
    }

    const values = getValues();
    if (Number(values.goal) < 1000) {
      toast({
        title: 'Meta minima necessaria',
        description: 'Para enviar para analise, a meta deve ser de pelo menos 1.000 tokens.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const saveProject = async (data: ProjectDraftFormData, status: ProjectSubmitStatus) => {
    if (!user) return;

    if (status === 'pending' && !validateReviewSubmission()) {
      return;
    }

    try {
      setLoadingAction(status);

      const savedStatus = isEditing && status === 'pending' ? 'draft' : status;
      const projectPayload = {
        title: data.title.trim(),
        category: data.category,
        description: data.description.trim(),
        goal: Number(data.goal),
        deadline: toDeadlineIso(data.deadline),
        youtube_url: data.youtube_url?.trim() || '',
        endereco: data.endereco?.trim() || null,
        numero: data.numero?.trim() || null,
        complemento: data.complemento?.trim() || null,
        bairro: data.bairro?.trim() || null,
        cidade: data.cidade?.trim() || null,
        estado: data.estado?.trim() || null,
        meta_pixel_id: data.meta_pixel_id?.trim() || null,
        google_tag_id: data.google_tag_id?.trim() || null,
        status: savedStatus,
        updated_at: new Date().toISOString(),
      };

      let savedProjectId = projectId;

      if (isEditing && projectId) {
        const { data: existingProject, error: existingError } = await supabase
          .from('projects')
          .select('id, status')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingError) throw existingError;
        if (!existingProject) throw new Error('Projeto nao encontrado para edicao.');
        if (!['draft', 'rejected'].includes(existingProject.status)) {
          throw new Error('Somente projetos em rascunho ou rejeitados podem ser editados.');
        }

        const { error } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', projectId)
          .eq('user_id', user.id)
          .in('status', ['draft', 'rejected']);

        if (error) throw error;
      } else {
        const { data: project, error } = await supabase
          .from('projects')
          .insert({
            ...projectPayload,
            user_id: user.id,
            project_type: 'regular',
            platform_fee_percentage: 10,
          })
          .select('id')
          .single();

        if (error) throw error;
        savedProjectId = project.id;
      }

      if (!savedProjectId) throw new Error('Projeto salvo sem identificador.');

      if (isEditing) {
        const { error: deleteImagesError } = await supabase
          .from('project_images')
          .delete()
          .eq('project_id', savedProjectId);

        if (deleteImagesError) throw deleteImagesError;
      }

      if (featuredImageUrl) {
        const { error: featuredError } = await supabase
          .from('project_images')
          .insert({
            project_id: savedProjectId,
            image_url: featuredImageUrl,
            is_featured: true,
          });

        if (featuredError) throw featuredError;
      }

      if (galleryImages.length) {
        const { error: galleryError } = await supabase
          .from('project_images')
          .insert(
            galleryImages.map((imageUrl) => ({
              project_id: savedProjectId,
              image_url: imageUrl,
              is_featured: false,
            })),
          );

        if (galleryError) throw galleryError;
      }

      if (isEditing && status === 'pending') {
        const { error: submitError } = await (supabase as any).rpc('submit_project_draft_for_review', {
          p_project_id: savedProjectId,
        });

        if (submitError) throw submitError;
      }

      if (status === 'pending' && !isAdmin) {
        await supabase.from('creator_consent_records').insert({
          user_id: user.id,
          project_id: savedProjectId,
          consent_version: CONSENT_VERSION,
          consent_text: CONSENT_TEXT,
          user_agent: navigator.userAgent,
        });
      }

      toast({
        title: status === 'draft'
          ? (isEditing ? 'Alteracoes salvas' : 'Rascunho salvo')
          : 'Projeto enviado para analise',
        description: status === 'draft'
          ? 'Voce podera revisar e enviar para analise depois.'
          : 'A equipe tecnica avaliara o projeto antes da publicacao.',
      });

      navigate('/meus-projetos');
    } catch (error: any) {
      console.error('Error saving project draft:', error);
      toast({
        title: 'Erro ao salvar projeto',
        description: error.message || 'Nao foi possivel salvar o projeto agora.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  if (checkingUserState || loadingProject) {
    return (
      <div className="min-h-screen bg-raiz-light py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary" />
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
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">
            {isEditing ? 'Editar Projeto' : 'Criar Projeto'}
          </h1>
          <p className="text-raiz-secondary">
            {isEditing
              ? 'Atualize seu rascunho e avance para analise quando estiver tudo pronto.'
              : 'Salve sua ideia como rascunho e avance para analise quando estiver tudo pronto.'}
          </p>
        </div>

        <Alert className="mb-6 border-green-300 bg-green-50">
          <ShieldCheck className="h-5 w-5 text-green-700" />
          <AlertTitle className="text-green-900">Comece agora e publique com seguranca depois</AlertTitle>
          <AlertDescription className="text-green-800 space-y-2">
            <p>
              Voce pode preencher seu projeto e salvar como rascunho sem concluir a verificacao de identidade. O KYC sera exigido apenas antes do envio para analise, como parte das regras de seguranca, curadoria e confianca da Raiz Token.
            </p>
            <p className="font-medium">
              Rascunho: sem KYC obrigatorio. Envio para analise: KYC obrigatorio.
            </p>
          </AlertDescription>
        </Alert>

        {isEditing && editingProjectStatus === 'rejected' && (
          <Alert className="mb-6 border-orange-300 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-700" />
            <AlertTitle className="text-orange-900">Projeto rejeitado em revisao</AlertTitle>
            <AlertDescription className="text-orange-800">
              Ajuste as informacoes solicitadas e salve as alteracoes antes de reenviar para analise.
            </AlertDescription>
          </Alert>
        )}

        {!isAdmin && activeProject && (
          <Alert className="mb-6 border-blue-300 bg-blue-50">
            <Clock className="h-5 w-5 text-blue-700" />
            <AlertTitle className="text-blue-900">Projeto ativo encontrado</AlertTitle>
            <AlertDescription className="text-blue-800">
              Voce ainda pode salvar este projeto como rascunho, mas o envio para analise ficara bloqueado enquanto houver outro projeto ativo ou aguardando analise.
            </AlertDescription>
          </Alert>
        )}

        {!isAdmin && pendingAccountability && (
          <Alert className="mb-6 border-amber-300 bg-amber-50">
            <FileCheck className="h-5 w-5 text-amber-700" />
            <AlertTitle className="text-amber-900">Prestacao de contas pendente</AlertTitle>
            <AlertDescription className="text-amber-800">
              Salve o rascunho agora e envie para analise depois que a prestacao de contas pendente for aprovada.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados do projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => saveProject(data, 'draft'))} className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titulo do projeto *</Label>
                  <Input
                    id="title"
                    {...register('title', {
                      required: 'Informe um titulo para salvar o rascunho.',
                      minLength: { value: 5, message: 'Use pelo menos 5 caracteres.' },
                    })}
                    placeholder="Ex: Biblioteca comunitaria no bairro"
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: 'Escolha uma categoria.' }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descricao *</Label>
                  <Textarea
                    id="description"
                    {...register('description', {
                      required: 'Descreva o projeto para salvar o rascunho.',
                      minLength: { value: 30, message: 'Use pelo menos 30 caracteres.' },
                    })}
                    rows={6}
                    placeholder="Explique o problema, a solucao e o impacto esperado."
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal">Meta em tokens *</Label>
                    <Input
                      id="goal"
                      type="number"
                      min="1"
                      step="1"
                      {...register('goal', {
                        required: 'Informe uma meta.',
                        min: { value: 1, message: 'A meta precisa ser maior que zero.' },
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-raiz-secondary">
                      Para envio a analise, a meta minima continua sendo 1.000 tokens.
                    </p>
                    {errors.goal && <p className="text-sm text-red-500">{errors.goal.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo final</Label>
                    <Input id="deadline" type="date" {...register('deadline')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">URL do video (YouTube opcional)</Label>
                  <Input
                    id="youtube_url"
                    {...register('youtube_url')}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-sm text-raiz-secondary">
                    O video ajuda na apresentacao, mas nao e obrigatorio para salvar o rascunho.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featured-image">Imagem de destaque</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <label htmlFor="featured-image" className="cursor-pointer mt-3 block text-sm font-medium text-gray-900">
                      Clique para enviar uma imagem
                    </label>
                    <input
                      id="featured-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      disabled={uploadingFeatured}
                      className="hidden"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Opcional no rascunho. Obrigatoria para envio a analise.
                    </p>
                  </div>
                  {uploadingFeatured && <p className="text-sm text-blue-600">Enviando imagem...</p>}
                  {featuredImageUrl && (
                    <img
                      src={featuredImageUrl}
                      alt="Imagem de destaque"
                      className="w-full max-w-md h-48 object-cover rounded-lg mt-4"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Galeria de imagens</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Plus className="mx-auto h-8 w-8 text-gray-400" />
                    <label htmlFor="gallery-images" className="cursor-pointer mt-2 block text-sm font-medium text-gray-900">
                      Adicionar imagens
                    </label>
                    <input
                      id="gallery-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      disabled={uploadingGallery}
                      className="hidden"
                    />
                  </div>
                  {uploadingGallery && <p className="text-sm text-blue-600">Enviando imagens...</p>}
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {galleryImages.map((image, index) => (
                        <div key={image} className="relative">
                          <img src={image} alt={`Galeria ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            aria-label="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900">Configuracoes de rastreamento</h3>
                <p className="text-sm text-blue-700">
                  Opcional. Informe apenas IDs, nunca scripts completos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_pixel_id">ID do Meta Pixel</Label>
                    <Input
                      id="meta_pixel_id"
                      {...register('meta_pixel_id', {
                        validate: (value) => {
                          if (!value) return true;
                          return /^[0-9]{10,20}$/.test(value.trim()) || 'Use apenas numeros, com 10 a 20 digitos.';
                        },
                      })}
                      maxLength={20}
                      placeholder="123456789012345"
                    />
                    {errors.meta_pixel_id && <p className="text-sm text-red-500">{errors.meta_pixel_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_tag_id">ID da Google Tag</Label>
                    <Input
                      id="google_tag_id"
                      {...register('google_tag_id', {
                        validate: (value) => {
                          if (!value) return true;
                          const trimmed = value.trim();
                          return /^(GTM|G|UA|AW|DC)-[A-Z0-9-]+$/.test(trimmed) || 'Formato invalido para Google Tag.';
                        },
                      })}
                      maxLength={30}
                      placeholder="GTM-XXXXXXX ou G-XXXXXXXXXX"
                    />
                    {errors.google_tag_id && <p className="text-sm text-red-500">{errors.google_tag_id.message}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Localizacao</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereco</Label>
                    <Input id="endereco" {...register('endereco')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Numero</Label>
                    <Input id="numero" {...register('numero')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" {...register('bairro')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" {...register('cidade')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" {...register('estado')} placeholder="SP, RJ, MG..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" {...register('complemento')} />
                  </div>
                </div>
              </div>

              <CreatorDataProtectionNotice />

              <div className={`space-y-4 rounded-lg p-4 ${rulesAccepted ? 'border border-green-300 bg-green-50' : 'border border-amber-300 bg-amber-50'}`}>
                <div className="flex items-center gap-2">
                  <FileCheck className={`h-5 w-5 ${rulesAccepted ? 'text-green-700' : 'text-amber-700'}`} />
                  <span className={`font-semibold ${rulesAccepted ? 'text-green-900' : 'text-amber-900'}`}>
                    Regras da plataforma
                  </span>
                </div>
                <p className={`text-sm ${rulesAccepted ? 'text-green-800' : 'text-amber-800'}`}>
                  O aceite nao bloqueia o rascunho, mas sera necessario para enviar o projeto para analise.
                </p>
                <PlatformRulesModal />
                <div className={`flex items-start space-x-3 pt-2 border-t ${rulesAccepted ? 'border-green-200' : 'border-amber-200'}`}>
                  <Checkbox
                    id="rules-consent"
                    checked={rulesAccepted}
                    onCheckedChange={(checked) => setRulesAccepted(checked === true)}
                    className="mt-1 h-5 w-5"
                  />
                  <Label htmlFor="rules-consent" className="text-sm cursor-pointer leading-relaxed">
                    Declaro que li, entendi e estou ciente das regras, taxas, prazos e do funcionamento do apoio por tokens da plataforma Raiz Token.
                  </Label>
                </div>
              </div>

              <div className="bg-raiz-primary/10 border border-raiz-primary/20 rounded-lg p-4 text-sm text-raiz-dark">
                {isEditing
                  ? 'Salvar alteracoes agora. Voce podera revisar e enviar para analise depois.'
                  : 'Salvar rascunho agora. Voce podera revisar e enviar para analise depois.'}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/meus-projetos')}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!!loadingAction}
                  onClick={handleSubmit((data) => saveProject(data, 'pending'))}
                >
                  {loadingAction === 'pending' ? 'Enviando...' : 'Enviar para analise'}
                </Button>
                <Button type="submit" disabled={!!loadingAction}>
                  {loadingAction === 'draft'
                    ? 'Salvando...'
                    : (isEditing ? 'Salvar alteracoes' : 'Salvar rascunho')}
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

export default CreateProjectDraft;
