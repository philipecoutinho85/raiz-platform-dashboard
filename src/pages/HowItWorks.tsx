import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Coins, Target, Shield, RefreshCw, CheckCircle2, BadgeCheck, FileText, Wallet } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const HowItWorks = () => {
  const steps = [
    {
      icon: Target,
      title: 'Escolha um projeto',
      description: 'Navegue por campanhas publicadas, entenda a proposta, a meta e os sinais de confiança antes de apoiar.'
    },
    {
      icon: Coins,
      title: 'Compre tokens',
      description: 'Adquira tokens dentro da plataforma. Cada token equivale a R$1 em apoio, com compra mínima de R$5.'
    },
    {
      icon: ArrowRight,
      title: 'Apoie com tokens',
      description: 'Use seus tokens para apoiar uma campanha validada e acompanhe a evolução do projeto.'
    },
    {
      icon: CheckCircle2,
      title: 'Acompanhe a meta',
      description: 'Quando a meta é atingida, o projeto avança conforme as regras da campanha e da plataforma.'
    },
    {
      icon: RefreshCw,
      title: 'Proteção do apoiador',
      description: 'Se a meta não for atingida, os tokens retornam para a carteira do apoiador conforme as regras da campanha.'
    }
  ];

  const benefits = [
    {
      icon: BadgeCheck,
      title: 'Identidade verificada',
      description: 'Criadores passam por validações antes de publicar campanhas na plataforma.'
    },
    {
      icon: Shield,
      title: 'Governança visível',
      description: 'Campanhas têm regras, meta, informações públicas e acompanhamento estruturado.'
    },
    {
      icon: FileText,
      title: 'Prestação de contas',
      description: 'A transparência não termina no apoio: a prestação de contas faz parte do ciclo.'
    },
    {
      icon: Wallet,
      title: 'Carteira de tokens',
      description: 'O usuário acompanha saldo, apoios realizados e movimentações dentro da plataforma.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Como Funciona o Crowdfunding na Raiz Token</title>
        <meta name="description" content="Entenda o passo a passo do crowdfunding na Raiz Token, da validação humana do projeto até a prestação de contas para quem apoiou." />
        <link rel="canonical" href="https://raiztoken.com.br/como-funciona" />
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)]">
      <main className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto max-w-7xl">
          <section className="mx-auto mb-16 max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              Como funciona
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              Apoiar projetos precisa ser simples. E confiável.
            </h1>

            <p className="mx-auto max-w-3xl text-base leading-relaxed text-home-muted md:text-lg">
              A Raiz Token organiza o apoio por meio de tokens simbólicos, validação de projetos, prestação de contas e mecanismos de proteção para o apoiador.
            </p>
          </section>

          <section className="mb-16 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isProtection = index === steps.length - 1;

              return (
                <Card
                  key={step.title}
                  className={`group overflow-hidden rounded-[28px] border-home-line shadow-home-glass transition-all duration-300 hover:-translate-y-2 hover:shadow-home-card ${
                    isProtection ? 'bg-home-900 text-white' : 'bg-white/90 text-home-900'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      isProtection
                        ? 'border-white/10 bg-white/10 text-home-gold group-hover:bg-white/15'
                        : 'border-home-line bg-white text-home-800 group-hover:bg-home-900 group-hover:text-home-gold'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className={`mb-3 font-mono text-sm font-bold ${isProtection ? 'text-home-gold' : 'text-home-800'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <h2 className="mb-3 font-display text-xl font-extrabold tracking-[-.025em]">
                      {step.title}
                    </h2>
                    <p className={`text-sm leading-relaxed ${isProtection ? 'text-white/72' : 'text-home-muted'}`}>
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="mb-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
                <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
                Governança e confiança
              </div>
              <h2 className="mb-5 font-display text-3xl font-extrabold leading-tight tracking-[-.038em] text-home-900 md:text-5xl">
                O diferencial não é só arrecadar. É criar confiança ao redor do projeto.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-home-muted md:text-lg">
                A plataforma combina identidade verificada, sinais reputacionais, acompanhamento e prestação de contas para tornar o apoio mais transparente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <Card key={benefit.title} className="rounded-[28px] border-home-line bg-white/90 shadow-home-glass transition-all duration-300 hover:-translate-y-2 hover:shadow-home-card">
                    <CardContent className="p-6">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-home-line bg-white text-home-800">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">{benefit.title}</h3>
                      <p className="text-sm leading-relaxed text-home-muted">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-[38px] bg-gradient-to-br from-home-900 to-home-800 p-8 text-white shadow-home-card md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">
                Pronto para conhecer os projetos?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
                Explore campanhas, entenda suas regras e apoie com tokens dentro de um ambiente mais organizado e transparente.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/projetos">
                  <Button size="lg" className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
                    Explorar Projetos
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
};

export default HowItWorks;
