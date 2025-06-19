import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Youtube, DollarSign, Calendar, Target, MapPin, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const CreateProject = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    goal: '',
    deadline: '',
    youtubeUrl: '',
    image: null as File | null,
    // Endereço do projeto
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validação básica
    if (!formData.title || !formData.description || !formData.category || !formData.goal || !formData.youtubeUrl) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios, incluindo o link do YouTube.",
        variant: "destructive"
      });
      return;
    }

    // Validação do YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(formData.youtubeUrl)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um link válido do YouTube.",
        variant: "destructive"
      });
      return;
    }

    // Simular envio
    toast({
      title: "Projeto criado com sucesso!",
      description: "Seu projeto foi enviado para análise e estará disponível em breve.",
    });
    
    console.log('Dados do projeto:', formData);
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      <Header />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
            <p className="text-raiz-secondary">
              Transforme sua ideia em realidade. Preencha os dados do seu projeto para começar sua campanha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Informações Básicas</span>
                </CardTitle>
                <CardDescription>
                  Dados fundamentais do seu projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: App revolucionário para educação"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva seu projeto de forma detalhada. Explique o problema que resolve, como funciona e qual o impacto esperado..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="educacao">Educação</SelectItem>
                        <SelectItem value="sustentabilidade">Sustentabilidade</SelectItem>
                        <SelectItem value="saude">Saúde</SelectItem>
                        <SelectItem value="arte-cultura">Arte e Cultura</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
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
                        placeholder="50000"
                        className="pl-10"
                        value={formData.goal}
                        onChange={(e) => handleInputChange('goal', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Data Limite da Campanha</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="deadline"
                      type="date"
                      className="pl-10"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização do Projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Localização do Projeto</span>
                </CardTitle>
                <CardDescription>
                  Informe onde o projeto será desenvolvido/executado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="endereco"
                      placeholder="Rua das Flores"
                      className="pl-10"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Sala 101, Andar 2"
                      value={formData.complemento}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      placeholder="Centro"
                      value={formData.bairro}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
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
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mídia e Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Mídia e Conteúdo</span>
                </CardTitle>
                <CardDescription>
                  Adicione imagens e vídeos para tornar seu projeto mais atrativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem Principal</Label>
                  <div className="border-2 border-dashed border-raiz-accent/30 rounded-lg p-8 text-center hover:border-raiz-accent/50 transition-colors">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="image" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-raiz-accent mx-auto mb-4" />
                      <p className="text-raiz-secondary mb-2">
                        {formData.image ? formData.image.name : 'Clique para enviar uma imagem'}
                      </p>
                      <p className="text-sm text-raiz-secondary/70">
                        Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                      </p>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">Link do YouTube *</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                    <Input
                      id="youtube"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="pl-10"
                      value={formData.youtubeUrl}
                      onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-sm text-raiz-secondary/70">
                    <strong>Obrigatório:</strong> Grave um vídeo se apresentando e falando sobre seu projeto. 
                    Explique quem você é, qual problema seu projeto resolve e como pretende executá-lo.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="outline" type="button" className="sm:w-auto">
                Salvar Rascunho
              </Button>
              <Button type="submit" className="bg-raiz-primary hover:bg-raiz-primary/90 sm:w-auto">
                Criar Projeto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
