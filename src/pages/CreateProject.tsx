
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  goal: number;
  youtube_url: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  deadline: string;
}

const CreateProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProjectFormData>();

  const categories = [
    'Tecnologia',
    'Saúde',
    'Educação',
    'Meio Ambiente',
    'Arte e Cultura',
    'Esportes',
    'Social',
    'Negócios'
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar um projeto.',
        variant: 'destructive',
      });
      return;
    }

    if (!featuredImage) {
      toast({
        title: 'Erro',
        description: 'É obrigatório adicionar uma imagem de destaque para o projeto.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          goal: data.goal,
          youtube_url: data.youtube_url,
          endereco: data.endereco,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          deadline: data.deadline || null,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Adicionar a imagem de destaque
      const { error: imageError } = await supabase
        .from('project_images')
        .insert({
          project_id: project.id,
          image_url: featuredImage,
          is_featured: true
        });

      if (imageError) throw imageError;

      toast({
        title: 'Projeto criado com sucesso!',
        description: 'Seu projeto foi enviado para análise e será publicado após aprovação.',
      });

      navigate('/meus-projetos');
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erro ao criar projeto',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
          <p className="text-raiz-secondary">
            Preencha as informações do seu projeto para análise e aprovação.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  placeholder="Descreva seu projeto em detalhes"
                  rows={6}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Meta de Arrecadação (R$) *</Label>
                  <Input
                    id="goal"
                    type="number"
                    {...register('goal', { 
                      required: 'Meta é obrigatória',
                      valueAsNumber: true,
                      min: { value: 100, message: 'Meta mínima é R$ 100' }
                    })}
                    placeholder="10000"
                  />
                  {errors.goal && (
                    <p className="text-red-500 text-sm">{errors.goal.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured-image">Imagem de Destaque *</Label>
                <ImageUpload
                  onImageUploaded={setFeaturedImage}
                  bucket="project-images"
                  className="h-48"
                />
                <p className="text-sm text-raiz-secondary">
                  Adicione uma imagem atrativa que represente seu projeto (obrigatório)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL do Vídeo (YouTube) *</Label>
                <Input
                  id="youtube_url"
                  {...register('youtube_url', { required: 'URL do YouTube é obrigatória' })}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {errors.youtube_url && (
                  <p className="text-red-500 text-sm">{errors.youtube_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Data Limite (opcional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  {...register('deadline')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    {...register('complemento')}
                    placeholder="Apartamento, Sala, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    {...register('bairro')}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    {...register('cidade')}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select onValueChange={(value) => setValue('estado', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
