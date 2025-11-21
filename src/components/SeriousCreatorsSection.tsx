import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const SeriousCreatorsSection = () => {
  return (
    <section className="py-20 bg-raiz-light">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-raiz-accent/20 bg-white/80 backdrop-blur-sm p-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Um ambiente para quem trata seu projeto com <span className="text-gradient">responsabilidade</span>
          </h2>
          <p className="text-xl text-raiz-secondary mb-8 max-w-2xl mx-auto">
            A plataforma é ideal para criadores que valorizam processos, clareza, organização e compromisso com sua comunidade.
          </p>
          <Button size="lg" asChild className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-dark text-lg px-8 py-6 h-auto">
            <Link to="/login">
              Criar meu Projeto
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
};

export default SeriousCreatorsSection;
