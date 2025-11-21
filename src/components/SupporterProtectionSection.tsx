import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, RefreshCw, Eye, CheckCircle, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const protections = [
  {
    icon: RefreshCw,
    title: "Devolução automática",
    description: "Caso a meta não seja atingida"
  },
  {
    icon: Eye,
    title: "Histórico público",
    description: "Dos criadores sempre organizado"
  },
  {
    icon: FileText,
    title: "Prestação de contas visível",
    description: "Transparência em cada etapa"
  },
  {
    icon: CheckCircle,
    title: "Validação manual",
    description: "Antes do pagamento ao criador"
  },
  {
    icon: Lock,
    title: "Registro interno",
    description: "De todas as ações realizadas"
  },
  {
    icon: Shield,
    title: "Informações essenciais",
    description: "Sempre acessíveis e claras"
  }
];

const SupporterProtectionSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Transparência <span className="text-gradient">do início ao fim</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {protections.map((protection, index) => (
            <Card 
              key={index} 
              className="card-hover border-raiz-accent/20 bg-raiz-light/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <protection.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-2">{protection.title}</h3>
                <p className="text-raiz-secondary text-sm">{protection.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" asChild className="bg-gradient-raiz text-white hover:opacity-90">
            <Link to="/marketplace">
              Apoiar Projetos
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SupporterProtectionSection;
