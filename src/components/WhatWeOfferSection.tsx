import { Card, CardContent } from '@/components/ui/card';
import { Shield, Award, TrendingUp, Target, CheckCircle, FileText, Activity, Heart } from 'lucide-react';

const offerings = [
  {
    icon: Shield,
    title: "Curadoria humana"
  },
  {
    icon: TrendingUp,
    title: "RaizScore transparente"
  },
  {
    icon: Award,
    title: "Badges de credibilidade"
  },
  {
    icon: Target,
    title: "Ferramentas profissionais para tráfego pago"
  },
  {
    icon: CheckCircle,
    title: "Processos de validação claros"
  },
  {
    icon: FileText,
    title: "Prestação de contas rastreável"
  },
  {
    icon: Activity,
    title: "Fluxos auditáveis"
  },
  {
    icon: Heart,
    title: "Foco em consistência e responsabilidade"
  }
];

const WhatWeOfferSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Construída para ser <span className="text-gradient">estável, clara e confiável</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            Curadoria especializada, reputação pública transparente, gestão financeira robusta e ferramentas profissionais para criadores e apoiadores que valorizam organização e responsabilidade.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {offerings.map((offering, index) => (
            <Card 
              key={index} 
              className="card-hover border-raiz-accent/20 bg-raiz-light/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="w-10 h-10 bg-gradient-raiz rounded-lg flex items-center justify-center flex-shrink-0">
                  <offering.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-raiz-dark font-medium text-sm">{offering.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeOfferSection;
