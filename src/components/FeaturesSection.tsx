
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Shield, TrendingUp, Users, Zap, Heart } from 'lucide-react';

const features = [
  {
    icon: Sprout,
    title: "Crescimento Orgânico",
    description: "Sua ideia cresce de forma natural com o apoio da comunidade, como uma árvore que se desenvolve com cuidado e paciência."
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Transações seguras e transparentes. Sua confiança é nossa prioridade máxima em cada etapa do processo."
  },
  {
    icon: TrendingUp,
    title: "Crescimento Sustentável",
    description: "Acompanhe o progresso do seu projeto em tempo real com métricas detalhadas e insights valiosos."
  },
  {
    icon: Users,
    title: "Comunidade Engajada",
    description: "Conecte-se com apoiadores genuinamente interessados em ver seu projeto florescer e ter sucesso."
  },
  {
    icon: Zap,
    title: "Processo Ágil",
    description: "Criar e gerenciar projetos nunca foi tão simples. Interface intuitiva para máxima eficiência."
  },
  {
    icon: Heart,
    title: "Apoio Personalizado",
    description: "Nossa equipe está sempre pronta para ajudar você a alcançar seus objetivos e superar desafios."
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Por que escolher a <span className="text-gradient">Plataforma Raiz Token</span>?
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            Nossa plataforma foi desenvolvida pensando em cada detalhe para oferecer a melhor experiência 
            tanto para criadores quanto para apoiadores de projetos.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="card-hover border-raiz-accent/20 bg-white/80 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-raiz-dark">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-raiz-secondary text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
