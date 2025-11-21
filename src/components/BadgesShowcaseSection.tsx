import { Card, CardContent } from '@/components/ui/card';
import { Badge as BadgeIcon, CheckCircle, Star, Award, Shield } from 'lucide-react';

const badges = [
  {
    icon: CheckCircle,
    name: "Verificado Raiz Token",
    description: "Identidade confirmada e projeto validado"
  },
  {
    icon: Star,
    name: "Curadoria Aprovada",
    description: "Projeto analisado e aprovado pela equipe"
  },
  {
    icon: Award,
    name: "Criador Experiente",
    description: "Histórico comprovado de projetos bem-sucedidos"
  },
  {
    icon: BadgeIcon,
    name: "Entrega Comprovada",
    description: "Prestação de contas realizada com sucesso"
  },
  {
    icon: Shield,
    name: "Zero Denúncias",
    description: "Sem denúncias ou problemas reportados"
  }
];

const BadgesShowcaseSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Reconhecimento para quem <span className="text-gradient">entrega valor</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            Os badges destacam criadores e projetos com responsabilidade comprovada.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {badges.map((badge, index) => (
            <Card 
              key={index} 
              className="card-hover border-raiz-accent/20 bg-raiz-light/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <badge.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-2 text-sm">{badge.name}</h3>
                <p className="text-raiz-secondary text-xs">{badge.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BadgesShowcaseSection;
