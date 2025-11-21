
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Shield, TrendingUp, Users, Zap, Heart } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: "Criação Estruturada",
    description: "Criação de projetos estruturada e orientada com verificação rigorosa de identidade e curadoria antes da publicação."
  },
  {
    icon: TrendingUp,
    title: "RaizScore Transparente",
    description: "Reputação pública via RaizScore, baseada em entregas e transparência, sempre evolutiva e clara."
  },
  {
    icon: Zap,
    title: "Validação Humana",
    description: "Validação humana antes de qualquer liberação de valores, garantindo segurança operacional."
  },
  {
    icon: Users,
    title: "Linha do Tempo Organizada",
    description: "Linha do tempo organizada e prestação de contas comprovada em cada etapa do projeto."
  },
  {
    icon: Sprout,
    title: "Devolução Automática",
    description: "Devolução automática dos tokens se a meta não for atingida, protegendo apoiadores."
  },
  {
    icon: Heart,
    title: "Projetos Sempre Acessíveis",
    description: "Projetos sempre acessíveis para visitantes, mesmo sem login, promovendo transparência total."
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Clareza para quem cria. <span className="text-gradient">Segurança operacional</span> para quem apoia.
          </h2>
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
