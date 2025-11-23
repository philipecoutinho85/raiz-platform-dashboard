
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Shield, TrendingUp, Users, Zap, Heart } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: "Criação Estruturada",
    description: "Criação de projetos estruturada e orientada com verificação rigorosa de identidade e curadoria antes da publicação.",
    color: "from-raiz-primary to-raiz-accent"
  },
  {
    icon: TrendingUp,
    title: "RaizScore Transparente",
    description: "Reputação pública via RaizScore, baseada em entregas e transparência, sempre evolutiva e clara.",
    color: "from-raiz-gold to-amber-400"
  },
  {
    icon: Zap,
    title: "Validação Humana",
    description: "Validação humana antes de qualquer liberação de valores, garantindo segurança operacional.",
    color: "from-raiz-accent to-raiz-gold"
  },
  {
    icon: Users,
    title: "Linha do Tempo Organizada",
    description: "Linha do tempo organizada e prestação de contas comprovada em cada etapa do projeto.",
    color: "from-raiz-secondary to-raiz-primary"
  },
  {
    icon: Sprout,
    title: "Devolução Automática",
    description: "Devolução automática dos tokens se a meta não for atingida, protegendo apoiadores.",
    color: "from-emerald-500 to-raiz-accent"
  },
  {
    icon: Heart,
    title: "Prestação de contas rastreável",
    description: "Prestação de contas rastreável em cada etapa do projeto, garantindo transparência total.",
    color: "from-rose-500 to-raiz-gold"
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
              className="group card-hover border-raiz-gold/30 bg-white shadow-lg hover:shadow-2xl hover:shadow-raiz-gold/20 transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-raiz-dark group-hover:text-raiz-gold transition-colors duration-300">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-raiz-secondary text-center leading-relaxed">
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
