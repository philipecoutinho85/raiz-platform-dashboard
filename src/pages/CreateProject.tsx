
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, FileText, MapPin, Youtube, Building, Hash, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/ImageUpload';

const CreateProject = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    goal: '',
    deadline: '',
    youtubeUrl: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const categories = [
    'Tecnologia',
    'Arte e Cultura',
    'Meio Ambiente',
    'Educação',
    'Saúde',
    'Esportes',
    'Negócios',
    'Outros'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const sanitizeInput = (input: string) => {
    return input.trim().replace(/[<>'"]/g, '');
  };

  const validateForm = () => {
    const requiredFields = ['title', 'description', 'category', 'goal', 'youtubeUrl'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return false;
    }

    if (images.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, adicione pelo menos uma imagem de destaque.",
        variant: "destructive"
      });
      return false;
    }

    if (!validateYouTubeUrl(formData.youtubeUrl)) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma URL válida do YouTube.",
        variant: "destructive"
      });
      return false;
    }

    const goalValue = parseFloat(formData.goal);
    if (isNaN(goalValue) || goalValue <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, digite um valor de meta válido.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.deadline && new Date(formData.deadline) <= new Date()) {
      toast({
        title: "Erro",
        description: "A data limite deve ser futura.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um projeto.",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize all text inputs
      const sanitizedData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        category: formData.category,
        goal: parseFloat(formData.goal),
        deadline: formData.deadline || null,
        youtube_url: formData.youtubeUrl.trim(),
        endereco: formData.endereco ? sanitizeInput(formData.endereco) : null,
        numero: formData.numero ? sanitizeInput(formData.numero) : null,
        complemento: formData.complemento ? sanitizeInput(formData.complemento) : null,
        bairro: formData.bairro ? sanitizeInput(formData.bairro) : null,
        cidade: formData.cidade ? sanitizeInput(formData.cidade) : null,
        estado: formData.estado ? sanitizeInput(formData.estado) : null,
        user_id: user.id,
        status: 'pending'
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error('Project creation error:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar projeto. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Salvar imagens do projeto
      if (images.length > 0) {
        const imageRecords = images.map((url, index) => ({
          project_id: project.id,
          image_url: url,
          is_featured: index === 0 // primeira imagem é a destaque
        }));

        const { error: imageError } = await supabase
          .from('project_images')
          .insert(imageRecords);

        if (imageError) {
          console.error('Image save error:', imageError);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Projeto criado com sucesso. Aguarde aprovação.",
      });

      navigate('/meus-projetos');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
          <p className="text-raiz-secondary">Compartilhe sua ideia e encontre apoiadores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Informações do Projeto</span>
              </CardTitle>
              <CardDescription>
                Descreva seu projeto de forma clara e atrativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="title">Título do Projeto *</Label>
                <Input
                  id="title"
                  placeholder="Digite o título do seu projeto"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva seu projeto, seus objetivos e como pretende utilizá-lo"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)} disabled={loading}>
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
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="goal"
                      type="number"
                      placeholder="10000"
                      className="pl-10"
                      value={formData.goal}
                      onChange={(e) => handleInputChange('goal', e.target.value)}
                      required
                      disabled={loading}
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Data Limite (Opcional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="deadline"
                      type="date"
                      className="pl-10"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      disabled={loading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">URL do Vídeo (YouTube) *</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="youtubeUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      className="pl-10"
                      value={formData.youtubeUrl}
                      onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagens do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Image className="w-5 h-5" />
                <span>Imagens do Projeto *</span>
              </CardTitle>
              <CardDescription>
                Adicione imagens atrativas do seu projeto. A primeira será a imagem de destaque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImagesChange={setImages}
                maxImages={5}
                label="Imagens do Projeto (máximo 5)"
              />
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Localização (Opcional)</span>
              </CardTitle>
              <CardDescription>
                Informe onde o projeto será desenvolvido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="endereco"
                      placeholder="Rua das Flores"
                      className="pl-10"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="numero"
                      placeholder="123"
                      className="pl-10"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      disabled={loading}
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Apartamento 101, Bloco A"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  disabled={loading}
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Centro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              type="submit" 
              className="bg-raiz-primary hover:bg-raiz-primary/90 px-8"
              disabled={loading}
            >
              {loading ? 'Criando Projeto...' : 'Criar Projeto'}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
