import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

const CreateProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>();

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

      if (!featuredImageUrl) {
        toast({
          title: 'Erro',
          description: 'Imagem de destaque é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user?.id,
          title: data.title,
          category: data.category,
          description: data.description,
          goal: data.goal,
          deadline: data.deadline,
          youtube_url: data.youtube_url,
          endereco: data.endereco,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

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

      toast({
        title: 'Projeto criado!',
        description: 'Seu projeto foi enviado para análise e será publicado em breve.',
      });
      navigate('/meus-projetos');
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
          <p className="text-raiz-secondary">
            Compartilhe sua ideia e mobilize apoiadores para seu projeto.
          </p>
        </div>

        <Card>
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
                  <Label htmlFor="category">Categoria *</Label>
                  <select
                    id="category"
                    {...register('category', { required: 'Categoria é obrigatória' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="arte">Arte</option>
                    <option value="educacao">Educação</option>
                    <option value="saude">Saúde</option>
                    <option value="meio-ambiente">Meio Ambiente</option>
                    <option value="social">Social</option>
                    <option value="outros">Outros</option>
                  </select>
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
                  className="min-h-[120px]"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="goal">Meta de Arrecadação (R$) *</Label>
                  <Input
                    id="goal"
                    type="number"
                    {...register('goal', { 
                      required: 'Meta é obrigatória',
                      min: { value: 100, message: 'Meta mínima é R$ 100' }
                    })}
                    placeholder="5000"
                  />
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

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate('/meus-projetos')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;
