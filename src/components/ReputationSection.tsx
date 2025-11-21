import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Star, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReputationSection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
              Confiabilidade é <span className="text-gradient">construída, não declarada</span>
            </h2>
            <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
              O RaizScore apresenta níveis de confiança baseados em comportamento, entregas e transparência. É evolutivo, transparente e sem exposição negativa.
            </p>
          </div>

          <Card className="border-raiz-accent/20 bg-white/80 backdrop-blur-sm p-8">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-raiz-dark mb-2">Evolutivo</h3>
                <p className="text-raiz-secondary text-sm">
                  Cresce com suas entregas e comportamento na plataforma
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-raiz-dark mb-2">Transparente</h3>
                <p className="text-raiz-secondary text-sm">
                  Baseado em critérios públicos e verificáveis
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-raiz-dark mb-2">Sem Exposição Negativa</h3>
                <p className="text-raiz-secondary text-sm">
                  Foca em reconhecer conquistas, não em penalizar
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" asChild className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark">
                <Link to="/como-funciona">
                  Entenda o RaizScore
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReputationSection;
