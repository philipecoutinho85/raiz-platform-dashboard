import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Lock, Eye, MessageSquare, Layout, History, TrendingUp, Shield } from 'lucide-react';

const tools = [
  {
    icon: BarChart,
    title: "Campos opcionais para Pixel da Meta e ID do Google",
    description: "Integração com ferramentas de tráfego pago com sanitização obrigatória"
  },
  {
    icon: Eye,
    title: "Projetos públicos mesmo sem login",
    description: "Máxima visibilidade para alcançar mais apoiadores"
  },
  {
    icon: MessageSquare,
    title: "Comentários protegidos",
    description: "Comentários e denúncias acessíveis apenas para usuários logados"
  },
  {
    icon: Layout,
    title: "Painel estruturado e orientado",
    description: "Interface clara para gerenciar seu projeto com facilidade"
  },
  {
    icon: Shield,
    title: "Análise interna antes de liberar valores",
    description: "Validação humana em cada etapa para garantir segurança"
  },
  {
    icon: History,
    title: "Histórico rastreável e organizado",
    description: "Todas as ações registradas e disponíveis para consulta"
  }
];

const CreatorToolsSection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Mais clareza. Mais organização. <span className="text-gradient">Mais alcance</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto mb-4">
            Ferramentas profissionais para criadores comprometidos com transparência e responsabilidade.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tools.map((tool, index) => (
            <Card 
              key={index} 
              className="card-hover border-raiz-accent/20 bg-white/80 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-raiz rounded-lg flex items-center justify-center mb-4">
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-2">{tool.title}</h3>
                <p className="text-raiz-secondary text-sm">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorToolsSection;
