import { Card } from '@/components/ui/card';
import { Cpu, Lock, TrendingUp } from 'lucide-react';

const TechExclusivitySection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
              Uma plataforma criada para quem busca <span className="text-gradient">o próximo nível</span>
            </h2>
          </div>

          <Card className="border-raiz-accent/20 bg-raiz-light/50 p-10">
            <p className="text-xl text-raiz-secondary text-center leading-relaxed mb-8">
              A arquitetura da Raiz Token foi desenvolvida para criadores e apoiadores que valorizam ferramentas inteligentes, controle operacional sólido e processos contínuos de evolução. São recursos avançados operando de forma discreta, sem ostentação e sem riscos desnecessários. Uma combinação que cria um ambiente único, estável e preparado para escalar.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-3">
                  <Cpu className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-1">Ferramentas Inteligentes</h3>
                <p className="text-raiz-secondary text-sm">Tecnologia de ponta operando discretamente</p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-1">Controle Operacional</h3>
                <p className="text-raiz-secondary text-sm">Processos sólidos e sem riscos</p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-raiz-dark font-semibold mb-1">Preparado para Escalar</h3>
                <p className="text-raiz-secondary text-sm">Arquitetura estável e evolutiva</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TechExclusivitySection;
