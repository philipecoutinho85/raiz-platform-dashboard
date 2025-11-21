import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Heart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommunitySection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Uma comunidade que cresce por <span className="text-gradient">responsabilidade</span>
          </h2>
          <p className="text-xl text-raiz-secondary mb-12 max-w-3xl mx-auto">
            A Raiz Token reúne criadores sérios, apoiadores conscientes e projetos que realmente importam. Aqui, propósito, organização e transparência formam a base para construir impacto de verdade.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-raiz-accent/20 bg-white/80 backdrop-blur-sm p-6">
              <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-raiz-dark font-semibold mb-2">Criadores Sérios</h3>
              <p className="text-raiz-secondary text-sm">Comprometidos com entregas e transparência</p>
            </Card>

            <Card className="border-raiz-accent/20 bg-white/80 backdrop-blur-sm p-6">
              <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-raiz-dark font-semibold mb-2">Apoiadores Conscientes</h3>
              <p className="text-raiz-secondary text-sm">Que valorizam projetos com impacto real</p>
            </Card>

            <Card className="border-raiz-accent/20 bg-white/80 backdrop-blur-sm p-6">
              <div className="w-14 h-14 bg-gradient-raiz rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-raiz-dark font-semibold mb-2">Projetos que Importam</h3>
              <p className="text-raiz-secondary text-sm">Iniciativas com propósito e organização</p>
            </Card>
          </div>

          <Button size="lg" asChild className="bg-gradient-raiz text-white hover:opacity-90 text-lg px-8 py-6 h-auto">
            <Link to="/login">
              Começar agora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
