
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Share2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Play,
  MessageCircle,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProjectDetail = () => {
  const { toast } = useToast();
  const [supportAmount, setSupportAmount] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Mock data do projeto
  const project = {
    id: 1,
    title: 'EcoTech Sustentável - Revolucionando a Energia Verde',
    description: 'Desenvolvimento de tecnologia verde inovadora para redução significativa de carbono e criação de soluções energéticas sustentáveis para o futuro do planeta.',
    fullDescription: `
      Este projeto visa desenvolver uma tecnologia revolucionária de captação e armazenamento de energia renovável, 
      combinando painéis solares de última geração com sistemas de armazenamento inteligente.
      
      Nossa solução permitirá que residências e empresas reduzam em até 80% sua dependência da rede elétrica tradicional,
      contribuindo significativamente para a redução das emissões de carbono.
      
      O projeto inclui:
      - Desenvolvimento de painéis solares 40% mais eficientes
      - Sistema de bateria inteligente com IA
      - App de monitoramento em tempo real
      - Instalação e manutenção gratuita por 2 anos
    `,
    category: 'Tecnologia',
    goal: 50000,
    raised: 39200,
    supporters: 156,
    daysLeft: 15,
    image: '/placeholder.svg',
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    creator: {
      name: 'João Silva',
      avatar: '/placeholder.svg',
      bio: 'Engenheiro Ambiental com 15 anos de experiência em energia renovável'
    },
    updates: [
      {
        id: 1,
        date: '2024-02-10',
        title: 'Protótipo finalizado!',
        content: 'Acabamos de finalizar o primeiro protótipo funcional do nosso sistema.'
      },
      {
        id: 2,
        date: '2024-02-05',
        title: 'Parceria estratégica',
        content: 'Firmamos parceria com a GreenEnergy para distribuição nacional.'
      }
    ],
    rewards: [
      { amount: 25, title: 'Apoiador Bronze', description: 'Acesso antecipado ao app + E-book exclusivo', backers: 45 },
      { amount: 100, title: 'Apoiador Prata', description: 'Todos os benefícios anteriores + Consulta gratuita', backers: 78 },
      { amount: 500, title: 'Apoiador Ouro', description: 'Todos os benefícios + Kit de energia solar residencial', backers: 23 },
      { amount: 1000, title: 'Apoiador Diamante', description: 'Todos os benefícios + Instalação gratuita completa', backers: 10 }
    ]
  };

  const progressPercentage = Math.min((project.raised / project.goal) * 100, 100);

  const handleSupport = () => {
    if (!supportAmount || parseFloat(supportAmount) < 10) {
      toast({
        title: "Valor inválido",
        description: "O valor mínimo de apoio é R$ 10,00",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Apoio registrado!",
      description: `Obrigado por apoiar com R$ ${supportAmount}!`,
    });
    setSupportAmount('');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: isLiked ? "Projeto removido da sua lista" : "Projeto salvo na sua lista de favoritos",
    });
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      {/* Hero Section */}
      <div className="bg-white border-b border-raiz-accent/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-raiz-accent/10 text-raiz-primary">
                  {project.category}
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-bold text-raiz-dark leading-tight">
                  {project.title}
                </h1>
                <p className="text-lg text-raiz-secondary">
                  {project.description}
                </p>
              </div>

              {/* Vídeo/Imagem */}
              <div className="aspect-video bg-raiz-accent/10 rounded-lg overflow-hidden">
                {project.youtubeUrl ? (
                  <iframe
                    src={project.youtubeUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Vídeo do projeto"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Button size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                        <Play className="w-6 h-6 mr-2" />
                        Assistir Vídeo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleLike}
                  className={isLiked ? "text-red-500 border-red-500" : ""}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Curtido" : "Curtir"}
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Comentários
                </Button>
              </div>
            </div>

            {/* Sidebar de Apoio */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-raiz-primary">
                    R$ {project.raised.toLocaleString()}
                  </CardTitle>
                  <CardDescription>
                    de R$ {project.goal.toLocaleString()} (meta)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercentage} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-raiz-dark">{progressPercentage.toFixed(0)}%</div>
                      <div className="text-sm text-raiz-secondary">Atingido</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-raiz-dark">{project.supporters}</div>
                      <div className="text-sm text-raiz-secondary">Apoiadores</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 text-raiz-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>{project.daysLeft} dias restantes</span>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="support-amount">Valor do apoio (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                      <Input
                        id="support-amount"
                        type="number"
                        placeholder="100"
                        className="pl-10"
                        value={supportAmount}
                        onChange={(e) => setSupportAmount(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleSupport} 
                      className="w-full bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark font-semibold"
                      size="lg"
                    >
                      Apoiar Projeto
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Criador */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Criador do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={project.creator.avatar} />
                      <AvatarFallback>{project.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-raiz-dark">{project.creator.name}</h4>
                      <p className="text-sm text-raiz-secondary">{project.creator.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="description" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Descrição</TabsTrigger>
                <TabsTrigger value="updates">Atualizações</TabsTrigger>
                <TabsTrigger value="comments">Comentários</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre o Projeto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {project.fullDescription.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 text-raiz-secondary leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="updates" className="space-y-4">
                {project.updates.map((update) => (
                  <Card key={update.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <span className="text-sm text-raiz-secondary">{update.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-raiz-secondary">{update.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="comments">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-raiz-accent mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-raiz-dark mb-2">
                        Sistema de comentários em desenvolvimento
                      </h3>
                      <p className="text-raiz-secondary">
                        Em breve você poderá interagir com outros apoiadores
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Recompensas */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recompensas</CardTitle>
                <CardDescription>
                  Escolha sua recompensa e apoie o projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.rewards.map((reward, index) => (
                  <div 
                    key={index} 
                    className="border border-raiz-accent/20 rounded-lg p-4 hover:border-raiz-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-raiz-dark">R$ {reward.amount}</h4>
                      <span className="text-sm text-raiz-secondary">{reward.backers} apoiadores</span>
                    </div>
                    <h5 className="font-medium text-raiz-primary mb-2">{reward.title}</h5>
                    <p className="text-sm text-raiz-secondary">{reward.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
