import { Card } from '@/components/ui/card';

const EmotionalConnectionSection = () => {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <Card className="max-w-5xl mx-auto border-raiz-gold/20 bg-white/10 backdrop-blur-md p-12">
          <div className="text-center space-y-6">
            <p className="text-2xl text-white leading-relaxed">
              Todo grande projeto nasce de quem vê o mundo de forma diferente. De quem não espera permissão para transformar.
            </p>
            <p className="text-2xl text-white leading-relaxed">
              Foi assim que criamos a Raiz Token, para criadores que querem ir além do comum e para apoiadores que desejam participar de algo que realmente importa.
            </p>
            <p className="text-2xl font-semibold text-raiz-gold leading-relaxed">
              Aqui você não encontra improviso. Encontra estrutura.
            </p>
            <p className="text-2xl font-semibold text-raiz-accent leading-relaxed">
              Não é só crowdfunding. É uma nova forma de construir impacto.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default EmotionalConnectionSection;
