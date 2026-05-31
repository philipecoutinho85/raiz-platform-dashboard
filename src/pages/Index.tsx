import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import homeLogo from '@/assets/raiz-token-home-logo.png';
import homeLogoMobile from '@/assets/raiz-token-home-logo-mobile.png';
import '@/styles/public-home.css';

const publicHomeMarkup = String.raw`<div class="fixed inset-0 bg-grid pointer-events-none -z-10"></div>

  <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-5 md:px-6 py-4">
      <div class="glass rounded-full px-5 md:px-6 py-3 flex items-center justify-between shadow-home-glass">
        <a href="/" class="flex items-center shrink-0" aria-label="Raiz Token">
          <picture class="block shrink-0">
            <source media="(max-width: 767px)" srcset="${homeLogoMobile}" />
            <img src="${homeLogo}" alt="Raiz Token" class="block w-[112px] h-[40px] md:w-[140px] md:h-[48px] object-contain" />
          </picture>
        </a>

        <div class="hidden lg:flex items-center gap-8 text-sm font-semibold text-home-muted">
          <a href="#projetos" class="hover:text-home-800 transition-colors">Projetos</a>
          <a href="#como" class="hover:text-home-800 transition-colors">Como funciona</a>
          <a href="#apoiar" class="hover:text-home-800 transition-colors">Como apoiar</a>
          <a href="#diferenciais" class="hover:text-home-800 transition-colors">Diferenciais</a>
          <a href="#governanca" class="hover:text-home-800 transition-colors">Governança</a>
          <a href="#criadores" class="hover:text-home-800 transition-colors">Criadores</a>
          <a href="#faq" class="hover:text-home-800 transition-colors">FAQ</a>
        </div>

        <div class="flex items-center gap-3">
          <a href="/login" class="hidden md:inline-flex px-4 py-2 text-sm font-semibold text-home-900 hover:text-home-800">Entrar</a>
          <a href="/criar-projeto" class="inline-flex items-center gap-2 bg-home-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-home-900/20 hover:bg-home-900 hover:-translate-y-0.5 transition-all">
            Enviar projeto <i class="ph-bold ph-arrow-right"></i>
          </a>
          <button class="lg:hidden text-2xl text-home-900"><i class="ph ph-list"></i></button>
        </div>
      </div>
    </div>
  </nav>

  <main>
    <section class="relative min-h-screen pt-32 pb-16 overflow-hidden section-soft">
      <div class="absolute top-16 right-0 w-[620px] h-[620px] rounded-full bg-white/70 blur-[80px] -z-10"></div>
      <div class="absolute bottom-10 left-0 w-[520px] h-[520px] rounded-full bg-home-gold/[0.18] blur-[100px] -z-10"></div>

      <div class="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-[.95fr_1.05fr] gap-12 lg:gap-16 items-center hero-mobile-grid">
        <div class="reveal">
          <div class="section-badge mb-6">Crowdfunding inteligente</div>

          <h1 class="font-display font-extrabold text-[3.35rem] sm:text-6xl lg:text-7xl leading-[.96] tracking-[-.028em] text-home-900 mb-7 max-w-3xl">
            Projetos reais merecem apoio confiável.
          </h1>

          <p class="text-lg leading-relaxed text-home-muted max-w-2xl mb-8">
            Uma plataforma para transformar projetos independentes em campanhas confiáveis, com validação humana, reputação pública, prestação de contas e regras claras do início ao fim.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 mb-5 mobile-button-stack">
            <a href="/criar-projeto" class="inline-flex items-center justify-center gap-2 bg-home-800 text-white px-8 py-4 rounded-full font-semibold shadow-xl shadow-home-900/20 hover:bg-home-900 hover:-translate-y-1 transition-all group">
              Enviar projeto para análise
              <i class="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </a>
            <a href="#como" class="inline-flex items-center justify-center gap-2 bg-white/[0.80] border border-home-line px-8 py-4 rounded-full font-semibold text-home-900 hover:bg-white hover:-translate-y-1 transition-all">
              <i class="ph ph-play-circle text-xl"></i> Como funciona
            </a>
          </div>

          <p class="flex items-center gap-2 text-sm text-home-muted mb-8">
            <i class="ph-fill ph-check-circle text-home-800"></i>
            Criar é gratuito. A validação acontece antes da publicação.
          </p>

          <div class="flex flex-wrap gap-3">
            <span class="glass px-4 py-2 rounded-full text-sm font-semibold text-home-900"><i class="ph-fill ph-user-check text-home-800 mr-1"></i> Validação humana</span>
            <span class="glass px-4 py-2 rounded-full text-sm font-semibold text-home-900"><i class="ph-fill ph-file-text text-home-800 mr-1"></i> Prestação de contas</span>
            <span class="glass px-4 py-2 rounded-full text-sm font-semibold text-home-900"><i class="ph-fill ph-arrows-clockwise text-home-800 mr-1"></i> Devolução automática</span>
          </div>
        </div>

        <div class="relative h-[700px] reveal hero-visual" style="transition-delay:160ms;">
          <div class="absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/80 via-white/20 to-home-gold/20 blur-0"></div>
          <div class="absolute right-0 top-0 w-[520px] h-[520px] rounded-full border border-home-900/10 animate-home-floatSlow"></div>
          <div class="absolute right-16 top-16 w-[370px] h-[370px] rounded-full border border-home-800/20 animate-home-floatSlow" style="animation-delay:-4s"></div>

          <div class="absolute left-0 top-14 glass rounded-3xl p-4 shadow-home-card animate-home-float z-20 max-w-[220px] hero-floating">
            <div class="text-[11px] uppercase tracking-[.18em] font-semibold text-home-800 mb-1">Pitch verificado</div>
            <div class="text-sm font-semibold text-home-900 leading-snug">Cada campanha nasce com contexto, meta e critérios claros.</div>
          </div>

          <div class="absolute right-0 top-8 glass rounded-3xl p-4 shadow-home-card animate-home-float z-20 text-center w-[136px] hero-floating" style="animation-delay:-1.6s">
            <div class="font-mono font-semibold text-3xl text-home-800">92</div>
            <div class="text-xs font-semibold text-home-muted">RaizScore</div>
          </div>

          <div class="absolute left-4 bottom-20 glass rounded-3xl p-4 shadow-home-card animate-home-float z-20 w-[210px] hero-floating" style="animation-delay:-3s">
            <div class="text-xs font-semibold text-home-800 uppercase tracking-[.12em] mb-2">Governança</div>
            <div class="flex items-center justify-between text-sm font-semibold text-home-900"><span>Identidade</span><i class="ph-fill ph-check-circle text-home-800"></i></div>
            <div class="flex items-center justify-between text-sm font-semibold text-home-900"><span>Regras</span><i class="ph-fill ph-check-circle text-home-800"></i></div>
            <div class="flex items-center justify-between text-sm font-semibold text-home-900"><span>Conta</span><i class="ph-fill ph-check-circle text-home-800"></i></div>
          </div>

          <article class="absolute right-8 top-24 w-full max-w-[540px] rounded-[34px] bg-white border border-home-line shadow-home-deep overflow-hidden z-10 hero-project-card">
            <div class="relative h-80 overflow-hidden hero-cover">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=85" alt="Equipe apresentando projeto em ambiente moderno" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/[0.12] to-transparent"></div>
              <div class="absolute top-5 left-5 px-3 py-1.5 rounded-full bg-white/[0.92] backdrop-blur text-xs font-semibold text-home-900 shadow-lg">
                <i class="ph-fill ph-shield-check text-home-800"></i> Projeto validado
              </div>
            </div>

            <div class="p-7">
              <div class="text-xs font-semibold text-home-800 uppercase tracking-[.15em] mb-2">Tecnologia + Criatividade</div>
              <h2 class="font-display font-extrabold text-3xl tracking-[-.025em] text-home-900 mb-2">NexoLab Criativo</h2>
              <p class="text-sm leading-relaxed text-home-muted mb-6">Um projeto independente para transformar ideias em soluções digitais acessíveis.</p>

              <div class="flex items-end justify-between gap-4 mb-3">
                <div>
                  <div class="font-mono font-semibold text-xl text-home-900">R$ 29.250</div>
                  <div class="text-xs text-home-muted">arrecadados</div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-semibold text-xl text-home-900">Meta R$ 40.000</div>
                  <div class="text-xs text-home-muted">73% concluído</div>
                </div>
              </div>

              <div class="h-3 w-full rounded-full bg-white border border-home-line overflow-hidden mb-6">
                <div class="progress-fill h-full rounded-full bg-gradient-to-r from-home-800 to-home-gold" data-width="73%"></div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">128</div>
                  <div class="text-[11px] text-home-muted">apoiadores</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">Em dia</div>
                  <div class="text-[11px] text-home-muted">prestação</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">92/100</div>
                  <div class="text-[11px] text-home-muted">RaizScore</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="como" class="py-24 section-white border-y border-home-line/70">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-end mb-12 reveal">
          <div>
            <div class="section-badge mb-4">Jornada com governança</div>
            <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] text-home-900">
              Da ideia ao apoio:<br><span class="text-home-900">uma jornada com validação e transparência.</span>
            </h2>
          </div>
          <p class="text-lg leading-relaxed text-home-muted max-w-xl">
            A experiência foi desenhada para reduzir atrito no início e elevar segurança no momento certo. A confiança cresce junto com a maturidade do projeto.
          </p>
        </div>

        <div class="grid md:grid-cols-5 gap-4 relative">
          <div class="hidden md:block absolute top-16 left-10 right-10 h-px border-t-2 border-dashed border-home-900/20"></div>

          <div class="reveal relative bg-white rounded-[28px] border border-home-line p-5 shadow-home-glass hover:-translate-y-2 transition-all">
            <div class="font-display font-extrabold text-5xl text-home-800 tracking-[-.052em] mb-5">01</div>
            <h3 class="font-display font-extrabold text-xl text-home-900 mb-2 tracking-[-.025em]">Envie seu projeto</h3>
            <p class="text-sm text-home-muted leading-relaxed">Conte sua ideia em poucos minutos.</p>
          </div>

          <div class="reveal relative bg-white rounded-[28px] border border-home-line p-5 shadow-home-glass hover:-translate-y-2 transition-all" style="transition-delay:80ms">
            <div class="font-display font-extrabold text-5xl text-home-800 tracking-[-.052em] mb-5">02</div>
            <h3 class="font-display font-extrabold text-xl text-home-900 mb-2 tracking-[-.025em]">Passe pela análise</h3>
            <p class="text-sm text-home-muted leading-relaxed">Nossa equipe valida viabilidade e coerência.</p>
          </div>

          <div class="reveal relative bg-home-900 text-white rounded-[28px] border border-home-900 p-5 shadow-home-card hover:-translate-y-2 transition-all" style="transition-delay:160ms">
            <div class="font-display font-extrabold text-5xl text-home-gold tracking-[-.052em] mb-5">03</div>
            <h3 class="font-display font-extrabold text-xl mb-2 tracking-[-.025em]">Publique com segurança</h3>
            <p class="text-sm text-white/70 leading-relaxed">Seu projeto ganha selo, página e confiança.</p>
          </div>

          <div class="reveal relative bg-white rounded-[28px] border border-home-line p-5 shadow-home-glass hover:-translate-y-2 transition-all" style="transition-delay:240ms">
            <div class="font-display font-extrabold text-5xl text-home-800 tracking-[-.052em] mb-5">04</div>
            <h3 class="font-display font-extrabold text-xl text-home-900 mb-2 tracking-[-.025em]">Receba apoios</h3>
            <p class="text-sm text-home-muted leading-relaxed">Apoiadores impulsionam sua jornada.</p>
          </div>

          <div class="reveal relative bg-white rounded-[28px] border border-home-line p-5 shadow-home-glass hover:-translate-y-2 transition-all" style="transition-delay:320ms">
            <div class="font-display font-extrabold text-5xl text-home-800 tracking-[-.052em] mb-5">05</div>
            <h3 class="font-display font-extrabold text-xl text-home-900 mb-2 tracking-[-.025em]">Preste contas</h3>
            <p class="text-sm text-home-muted leading-relaxed">Transparência fortalece reputação.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="apoiar" class="py-24 section-warm relative overflow-hidden border-b border-home-line/70">
      <div class="absolute inset-x-0 top-16 mx-auto w-[860px] h-[420px] rounded-full bg-white/70 blur-3xl -z-10"></div>

      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="grid lg:grid-cols-[.86fr_1.14fr] gap-12 items-start">
          <div class="reveal">
            <div class="section-badge mb-5">Como apoiar um projeto</div>

            <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] text-home-900 mb-5">
              Apoiar precisa ser simples. <span class="text-home-900">E também seguro.</span>
            </h2>

            <p class="text-home-muted text-lg leading-relaxed mb-8">
              Na Raiz Token, o apoio acontece por meio de tokens dentro da plataforma. O usuário cria sua conta, compra tokens a partir de R$5,00 e escolhe quais projetos deseja apoiar.
            </p>

            <div class="rounded-[28px] bg-white border border-home-line shadow-home-glass p-6">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl">
                  <i class="ph-fill ph-info"></i>
                </div>
                <div>
                  <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">
                    1 token equivale a R$1 em apoio.
                  </h3>
                  <p class="text-sm text-home-muted leading-relaxed">
                    O token não é investimento, não gera rendimento e não representa participação no projeto. Ele funciona como unidade de apoio dentro da plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="reveal" style="transition-delay:120ms">
            <div class="relative rounded-[40px] bg-white/[0.88] border border-home-line shadow-home-card p-5 md:p-7 overflow-hidden">
              <div class="relative grid md:grid-cols-2 gap-4">
                <div class="support-step-card rounded-[28px] border border-home-line bg-white p-5 shadow-sm">
                  <div class="support-icon w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5 transition-all">
                    <i class="ph-fill ph-user-circle-plus"></i>
                  </div>
                  <div class="text-xs font-semibold uppercase tracking-[.14em] text-home-muted mb-2">Etapa 01</div>
                  <h3 class="font-display font-extrabold text-2xl tracking-[-.028em] text-home-900 mb-2">Crie sua conta</h3>
                  <p class="text-sm text-home-muted leading-relaxed">
                    O apoiador cria uma conta gratuita para acessar a carteira, acompanhar apoios e visualizar projetos.
                  </p>
                </div>

                <div class="support-step-card rounded-[28px] border border-home-line bg-white p-5 shadow-sm">
                  <div class="support-icon w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5 transition-all">
                    <i class="ph-fill ph-coins"></i>
                  </div>
                  <div class="text-xs font-semibold uppercase tracking-[.14em] text-home-muted mb-2">Etapa 02</div>
                  <h3 class="font-display font-extrabold text-2xl tracking-[-.028em] text-home-900 mb-2">Compre tokens</h3>
                  <p class="text-sm text-home-muted leading-relaxed">
                    A compra pode começar a partir de <strong class="text-home-900">R$5,00</strong>. Cada token equivale a R$1 em apoio.
                  </p>
                </div>

                <div class="support-step-card rounded-[28px] border border-home-line bg-white p-5 shadow-sm">
                  <div class="support-icon w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5 transition-all">
                    <i class="ph-fill ph-hand-heart"></i>
                  </div>
                  <div class="text-xs font-semibold uppercase tracking-[.14em] text-home-muted mb-2">Etapa 03</div>
                  <h3 class="font-display font-extrabold text-2xl tracking-[-.028em] text-home-900 mb-2">Apoie um projeto</h3>
                  <p class="text-sm text-home-muted leading-relaxed">
                    Escolha uma campanha validada, defina quantos tokens deseja apoiar e acompanhe a evolução.
                  </p>
                </div>

                <div class="support-step-card rounded-[28px] border border-home-line bg-home-900 text-white p-5 shadow-home-card">
                  <div class="support-icon w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-home-gold text-2xl mb-5 transition-all">
                    <i class="ph-fill ph-arrows-clockwise"></i>
                  </div>
                  <div class="text-xs font-semibold uppercase tracking-[.14em] text-home-gold mb-2">Proteção</div>
                  <h3 class="font-display font-extrabold text-2xl tracking-[-.028em] mb-2">Se a meta não for atingida</h3>
                  <p class="text-sm text-white/70 leading-relaxed">
                    Os tokens retornam para a carteira do apoiador, conforme as regras da campanha e da plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section id="projetos" class="py-24 section-stone border-b border-home-line/70">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 reveal">
          <div class="max-w-2xl">
            <div class="section-badge mb-4">Vitrine curada</div>
            <h2 class="font-display font-extrabold text-4xl md:text-5xl tracking-[-.038em] text-home-900 mb-4">
              Projetos elegíveis com cara de projeto sério.
            </h2>
            <p class="text-home-muted leading-relaxed">
              Exemplos de campanhas que combinam narrativa, estrutura, validação, reputação pública e prestação de contas.
            </p>
          </div>

          <a href="/projetos" class="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-home-line bg-white font-semibold text-home-900 hover:text-home-800 hover:-translate-y-1 transition-all shadow-home-glass">
            Ver projetos <i class="ph-bold ph-arrow-right"></i>
          </a>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <article class="reveal group bg-white rounded-[30px] border border-home-line shadow-home-glass overflow-hidden hover:-translate-y-2 hover:shadow-home-card transition-all">
            <div class="relative h-56 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85" alt="Equipe de startup trabalhando em planejamento de produto" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              <span class="absolute top-5 left-5 glass px-3 py-1.5 rounded-full text-xs font-semibold text-home-900">Projeto validado</span>
            </div>

            <div class="p-6">
              <div class="text-xs font-semibold uppercase tracking-[.12em] text-home-800 mb-2">Tecnologia + Criatividade</div>
              <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-2">NexoLab Criativo</h3>
              <p class="text-sm text-home-muted leading-relaxed mb-5">
                Ferramentas digitais para pequenos criadores estruturarem ideias e campanhas com mais clareza.
              </p>

              <div class="flex items-end justify-between gap-4 mb-3">
                <div>
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 29.250</div>
                  <div class="text-xs text-home-muted">arrecadados</div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 40.000</div>
                  <div class="text-xs text-home-muted">meta</div>
                </div>
              </div>

              <div class="h-2.5 bg-white border border-home-line rounded-full overflow-hidden mb-5">
                <div class="progress-fill h-full bg-gradient-to-r from-home-800 to-home-gold" data-width="73%"></div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">128</div>
                  <div class="text-[11px] text-home-muted">apoiadores</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">Em dia</div>
                  <div class="text-[11px] text-home-muted">prestação</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">92/100</div>
                  <div class="text-[11px] text-home-muted">RaizScore</div>
                </div>
              </div>
            </div>
          </article>

          <article class="reveal group bg-white rounded-[30px] border border-home-line shadow-home-glass overflow-hidden hover:-translate-y-2 hover:shadow-home-card transition-all" style="transition-delay:120ms">
            <div class="relative h-56 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85" alt="Equipe apresentando proposta em reunião de negócios" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              <span class="absolute top-5 left-5 glass px-3 py-1.5 rounded-full text-xs font-semibold text-home-900">Curadoria aprovada</span>
            </div>

            <div class="p-6">
              <div class="text-xs font-semibold uppercase tracking-[.12em] text-home-800 mb-2">Cultura + Produção autoral</div>
              <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-2">Estúdio Autoral</h3>
              <p class="text-sm text-home-muted leading-relaxed mb-5">
                Produção independente com narrativa clara, meta definida e acompanhamento público da execução.
              </p>

              <div class="flex items-end justify-between gap-4 mb-3">
                <div>
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 18.600</div>
                  <div class="text-xs text-home-muted">arrecadados</div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 30.000</div>
                  <div class="text-xs text-home-muted">meta</div>
                </div>
              </div>

              <div class="h-2.5 bg-white border border-home-line rounded-full overflow-hidden mb-5">
                <div class="progress-fill h-full bg-gradient-to-r from-home-800 to-home-gold" data-width="62%"></div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">84</div>
                  <div class="text-[11px] text-home-muted">apoiadores</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">Ativa</div>
                  <div class="text-[11px] text-home-muted">prestação</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">87/100</div>
                  <div class="text-[11px] text-home-muted">RaizScore</div>
                </div>
              </div>
            </div>
          </article>

          <article class="reveal group bg-white rounded-[30px] border border-home-line shadow-home-glass overflow-hidden hover:-translate-y-2 hover:shadow-home-card transition-all" style="transition-delay:240ms">
            <div class="relative h-56 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85" alt="Empreendedores analisando operação de pequeno negócio" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              <span class="absolute top-5 left-5 glass px-3 py-1.5 rounded-full text-xs font-semibold text-home-900">Prestação em dia</span>
            </div>

            <div class="p-6">
              <div class="text-xs font-semibold uppercase tracking-[.12em] text-home-800 mb-2">Empreendedorismo</div>
              <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-2">Café Independente</h3>
              <p class="text-sm text-home-muted leading-relaxed mb-5">
                Negócio local com meta clara, comunicação profissional e plano de execução acompanhável.
              </p>

              <div class="flex items-end justify-between gap-4 mb-3">
                <div>
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 12.400</div>
                  <div class="text-xs text-home-muted">arrecadados</div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-semibold text-lg text-home-900">R$ 25.000</div>
                  <div class="text-xs text-home-muted">meta</div>
                </div>
              </div>

              <div class="h-2.5 bg-white border border-home-line rounded-full overflow-hidden mb-5">
                <div class="progress-fill h-full bg-gradient-to-r from-home-800 to-home-gold" data-width="49%"></div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">51</div>
                  <div class="text-[11px] text-home-muted">apoiadores</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">Em dia</div>
                  <div class="text-[11px] text-home-muted">prestação</div>
                </div>
                <div class="rounded-2xl bg-white border border-home-line p-3">
                  <div class="font-mono font-semibold text-home-900">81/100</div>
                  <div class="text-[11px] text-home-muted">RaizScore</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="diferenciais" class="py-24 section-white border-b border-home-line/70">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="max-w-3xl mb-12 reveal">
          <div class="section-badge mb-4">Diferenciais da plataforma</div>

          <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] text-home-900 mb-5">
            O que diferencia a Raiz Token das campanhas comuns.
          </h2>

          <p class="text-home-muted text-lg leading-relaxed">
            A proposta da Raiz Token não é apenas permitir arrecadação. É criar uma camada de confiança, validação e reputação para projetos reais.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="differential-card bg-white border border-home-line rounded-[30px] p-6 shadow-home-glass reveal">
            <div class="w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5">
              <i class="ph-fill ph-gauge"></i>
            </div>
            <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-3">RaizScore</h3>
            <p class="text-sm text-home-muted leading-relaxed">
              Indicador reputacional para sinalizar maturidade, histórico e confiança percebida do projeto.
            </p>
          </div>

          <div class="differential-card bg-white border border-home-line rounded-[30px] p-6 shadow-home-glass reveal" style="transition-delay:80ms">
            <div class="w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5">
              <i class="ph-fill ph-medal"></i>
            </div>
            <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-3">Badges</h3>
            <p class="text-sm text-home-muted leading-relaxed">
              Selos visuais para destacar validação, prestação em dia, histórico e outros sinais de confiança.
            </p>
          </div>

          <div class="differential-card bg-white border border-home-line rounded-[30px] p-6 shadow-home-glass reveal" style="transition-delay:160ms">
            <div class="w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5">
              <i class="ph-fill ph-identification-badge"></i>
            </div>
            <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-3">Identidade verificada</h3>
            <p class="text-sm text-home-muted leading-relaxed">
              Projetos passam por validações antes da publicação, reduzindo improviso e aumentando responsabilidade.
            </p>
          </div>

          <div class="differential-card bg-white border border-home-line rounded-[30px] p-6 shadow-home-glass reveal" style="transition-delay:240ms">
            <div class="w-12 h-12 rounded-2xl bg-white border border-home-line flex items-center justify-center text-home-800 text-2xl mb-5">
              <i class="ph-fill ph-file-text"></i>
            </div>
            <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-3">Prestação de contas</h3>
            <p class="text-sm text-home-muted leading-relaxed">
              O projeto não termina no apoio: transparência, acompanhamento e responsabilidade fazem parte do ciclo.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="governanca" class="py-24 bg-home-900 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] bg-[size:46px_46px]"></div>

      <div class="max-w-7xl mx-auto px-5 md:px-6 relative z-10 grid lg:grid-cols-2 gap-14 items-center">
        <div class="reveal">
          <div class="section-badge mb-4 bg-white/10 border-white/[0.15] text-white shadow-none">Governança e confiança</div>

          <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] text-white mb-6">
            Confiança não deve ser detalhe. Deve ser sistema.
          </h2>

          <p class="text-white/70 text-lg leading-relaxed mb-8">
            A experiência pública da Raiz Token precisa deixar evidente que cada projeto tem regras, validação, reputação e acompanhamento.
          </p>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="bg-white/[0.08] border border-white/10 rounded-3xl p-5">
              <i class="ph-fill ph-shield-check text-home-gold text-2xl"></i>
              <h3 class="font-semibold text-white mt-3 mb-1">Validação humana</h3>
              <p class="text-sm text-white/60">Curadoria antes da publicação.</p>
            </div>

            <div class="bg-white/[0.08] border border-white/10 rounded-3xl p-5">
              <i class="ph-fill ph-file-text text-home-gold text-2xl"></i>
              <h3 class="font-semibold text-white mt-3 mb-1">Prestação de contas</h3>
              <p class="text-sm text-white/60">Transparência como regra.</p>
            </div>
          </div>
        </div>

        <div class="reveal relative">
          <div class="absolute -inset-8 rounded-full bg-home-gold/[0.12] blur-3xl"></div>

          <div class="glass-dark rounded-[34px] p-5 md:p-6 shadow-2xl relative overflow-hidden">
            <div class="flex items-center gap-2 border-b border-white/10 pb-4 mb-5">
              <span class="w-3 h-3 rounded-full bg-red-400"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span class="w-3 h-3 rounded-full bg-green-400"></span>
              <span class="font-mono text-xs text-white/40 ml-3">Painel Raiz Token</span>
            </div>

            <div class="bg-white rounded-[30px] overflow-hidden shadow-2xl">
              <div class="relative h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85" alt="Equipe apresentando projeto em reunião" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/[0.45] via-black/10 to-transparent"></div>

                <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-home-900 shadow">
                  <i class="ph-fill ph-shield-check text-home-800"></i> Projeto validado
                </div>

                <div class="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-home-900 shadow">
                  RaizScore 92
                </div>
              </div>

              <div class="p-5 md:p-6">
                <div class="text-xs font-semibold uppercase tracking-[.12em] text-home-800 mb-2">Visão da plataforma</div>
                <h3 class="font-display font-extrabold text-2xl tracking-[-.025em] text-home-900 mb-2">Projetos com governança visível</h3>
                <p class="text-sm text-home-muted leading-relaxed mb-5">
                  O apoiador entende rapidamente o status dos projetos, sua validação e a prestação de contas.
                </p>

                <div class="space-y-3 mb-5">
                  <div class="rounded-2xl border border-home-line p-4">
                    <div class="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div class="font-display font-extrabold text-lg tracking-[-.02em] text-home-900">NexoLab Criativo</div>
                        <div class="text-xs text-home-muted">Tecnologia + Criatividade</div>
                      </div>
                      <span class="text-xs font-semibold text-home-800 bg-white border border-home-line rounded-full px-3 py-1">92/100</span>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-3">
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Identidade</div>
                        <div class="font-semibold text-home-900">Verificada</div>
                      </div>
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Prestação</div>
                        <div class="font-semibold text-home-900">Em dia</div>
                      </div>
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Apoiadores</div>
                        <div class="font-semibold text-home-900">128</div>
                      </div>
                    </div>

                    <div class="h-2.5 bg-white border border-home-line rounded-full overflow-hidden">
                      <div class="h-full w-[73%] rounded-full bg-gradient-to-r from-home-800 to-home-gold"></div>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-home-line p-4">
                    <div class="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div class="font-display font-extrabold text-lg tracking-[-.02em] text-home-900">Estúdio Autoral</div>
                        <div class="text-xs text-home-muted">Cultura + Produção autoral</div>
                      </div>
                      <span class="text-xs font-semibold text-home-800 bg-white border border-home-line rounded-full px-3 py-1">87/100</span>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-3">
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Identidade</div>
                        <div class="font-semibold text-home-900">Verificada</div>
                      </div>
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Prestação</div>
                        <div class="font-semibold text-home-900">Ativa</div>
                      </div>
                      <div class="rounded-xl bg-white border border-home-line p-3">
                        <div class="text-[11px] text-home-muted mb-1">Apoiadores</div>
                        <div class="font-semibold text-home-900">84</div>
                      </div>
                    </div>

                    <div class="h-2.5 bg-white border border-home-line rounded-full overflow-hidden">
                      <div class="h-full w-[62%] rounded-full bg-gradient-to-r from-home-800 to-home-gold"></div>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between rounded-2xl border border-home-line px-4 py-3">
                    <div class="flex items-center gap-2 text-sm text-home-900 font-semibold">
                      <i class="ph-fill ph-identification-badge text-home-800"></i>
                      Identidade do criador
                    </div>
                    <span class="text-xs font-semibold text-home-800">VERIFICADA</span>
                  </div>

                  <div class="flex items-center justify-between rounded-2xl border border-home-line px-4 py-3">
                    <div class="flex items-center gap-2 text-sm text-home-900 font-semibold">
                      <i class="ph-fill ph-shield-check text-home-800"></i>
                      Regras da campanha
                    </div>
                    <span class="text-xs font-semibold text-home-800">VISÍVEIS</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    <section id="criadores" class="py-24 section-stone relative overflow-hidden border-b border-home-line/70">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="max-w-4xl mx-auto text-center mb-14 reveal">
          <div class="section-badge mx-auto mb-5">Criadores e apoiadores</div>

          <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] text-home-900 mb-5">
            A confiança acontece entre os dois lados.
          </h2>

          <p class="text-home-muted text-lg leading-relaxed max-w-3xl mx-auto">
            A Raiz Token organiza a relação entre quem tira projetos do papel e quem decide apoiar. O criador ganha estrutura. O apoiador ganha clareza. E a plataforma sustenta essa conexão com governança.
          </p>
        </div>

        <div class="reveal relative rounded-[40px] border border-home-line bg-white/[0.88] backdrop-blur-xl shadow-home-card overflow-hidden" style="transition-delay:120ms">
          <div class="grid lg:grid-cols-[1fr_320px_1fr]">

            <div class="p-7 md:p-10 lg:border-r lg:border-home-line/80">
              <div class="flex items-center gap-4 mb-8">
                <div class="mini-icon w-14 h-14 rounded-2xl bg-white border border-home-line text-home-800 flex items-center justify-center text-3xl shadow-home-glass transition-all">
                  <i class="ph-fill ph-rocket-launch"></i>
                </div>
                <div class="inline-flex items-center rounded-full border border-home-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[.12em] text-home-800">
                  Criador
                </div>
              </div>

              <h3 class="font-display font-extrabold text-3xl tracking-[-.028em] text-home-900 mb-3">
                Estrutura para apresentar bem uma boa ideia.
              </h3>

              <p class="text-home-muted leading-relaxed mb-8 max-w-xl">
                Em vez de improvisar, o criador organiza seu projeto com mais clareza, mais credibilidade e mais consistência para captar apoio de forma séria.
              </p>

              <div class="space-y-4">
                <div class="creator-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Página estruturada</h4>
                  <p class="text-sm text-home-muted leading-relaxed">Meta, contexto, narrativa e proposta apresentados com mais qualidade.</p>
                </div>

                <div class="creator-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Validação antes da publicação</h4>
                  <p class="text-sm text-home-muted leading-relaxed">A campanha não entra no ar sem passar pelos critérios da plataforma.</p>
                </div>

                <div class="creator-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Reputação construída no tempo</h4>
                  <p class="text-sm text-home-muted leading-relaxed">Prestação de contas, histórico e sinais públicos fortalecem a confiança.</p>
                </div>
              </div>
            </div>

            <div class="relative bg-home-900 text-white px-6 py-10 md:px-8 flex flex-col justify-center overflow-hidden">
              <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-home-gold/20 blur-2xl"></div>
              <div class="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>

              <div class="relative z-10 text-center">
                <div class="w-16 h-16 mx-auto rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-home-gold text-3xl mb-5">
                  <i class="ph-fill ph-shield-check"></i>
                </div>

                <div class="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-home-gold mb-5">
                  Camada Raiz
                </div>

                <h3 class="font-display font-extrabold text-2xl tracking-[-.028em] mb-4">
                  A plataforma faz a ponte.
                </h3>

                <p class="text-sm text-white/70 leading-relaxed mb-7">
                  A Raiz conecta intenção e confiança por meio de validação, transparência e acompanhamento.
                </p>

                <div class="space-y-3">
                  <div class="mini-feature-card rounded-2xl bg-white/[0.08] border border-white/10 px-4 py-3 flex items-center justify-between">
                    <span class="text-sm font-semibold">Validação</span>
                    <i class="ph-fill ph-check-circle text-home-gold"></i>
                  </div>
                  <div class="mini-feature-card rounded-2xl bg-white/[0.08] border border-white/10 px-4 py-3 flex items-center justify-between">
                    <span class="text-sm font-semibold">Reputação</span>
                    <i class="ph-fill ph-check-circle text-home-gold"></i>
                  </div>
                  <div class="mini-feature-card rounded-2xl bg-white/[0.08] border border-white/10 px-4 py-3 flex items-center justify-between">
                    <span class="text-sm font-semibold">Transparência</span>
                    <i class="ph-fill ph-check-circle text-home-gold"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-7 md:p-10">
              <div class="flex items-center gap-4 mb-8">
                <div class="mini-icon w-14 h-14 rounded-2xl bg-white border border-home-line text-home-800 flex items-center justify-center text-3xl shadow-home-glass transition-all">
                  <i class="ph-fill ph-hand-heart"></i>
                </div>
                <div class="inline-flex items-center rounded-full border border-home-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[.12em] text-home-800">
                  Apoiador
                </div>
              </div>

              <h3 class="font-display font-extrabold text-3xl tracking-[-.028em] text-home-900 mb-3">
                Clareza para apoiar com mais segurança.
              </h3>

              <p class="text-home-muted leading-relaxed mb-8 max-w-xl">
                O apoiador entende melhor o projeto, acompanha seu andamento e sabe quais mecanismos aumentam a confiabilidade da campanha.
              </p>

              <div class="space-y-4">
                <div class="supporter-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Leitura mais clara do projeto</h4>
                  <p class="text-sm text-home-muted leading-relaxed">O projeto apresenta objetivo, meta, contexto e proposta de forma mais compreensível.</p>
                </div>

                <div class="supporter-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Acompanhamento da evolução</h4>
                  <p class="text-sm text-home-muted leading-relaxed">O apoiador consegue acompanhar andamento, atualizações e sinais de reputação.</p>
                </div>

                <div class="supporter-card rounded-2xl border border-home-line bg-white p-4 shadow-sm">
                  <h4 class="font-semibold text-home-900 mb-1">Mais previsibilidade</h4>
                  <p class="text-sm text-home-muted leading-relaxed">Se a meta não for atingida, os tokens retornam conforme as regras da plataforma.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    <section id="faq" class="py-24 section-white border-b border-home-line/70">
      <div class="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-[.75fr_1.25fr] gap-12">
        <div class="reveal">
          <div class="section-badge mb-4">FAQ</div>

          <h2 class="font-display font-extrabold text-4xl md:text-5xl tracking-[-.038em] text-home-900 mb-4">
            Transparência antes do primeiro apoio.
          </h2>

          <p class="text-home-muted leading-relaxed">
            O site precisa explicar rápido o que a Raiz é, o que o token representa e o que ele não representa.
          </p>
        </div>

        <div class="reveal bg-white rounded-[34px] border border-home-line p-7 shadow-home-glass">
          <details open class="border-b border-home-line py-5">
            <summary class="cursor-pointer font-semibold text-home-900 flex justify-between">O que é a Raiz Token?<span>+</span></summary>
            <p class="text-home-muted mt-3 leading-relaxed">Uma plataforma de crowdfunding confiável para projetos reais, com validação, reputação pública e prestação de contas.</p>
          </details>

          <details class="border-b border-home-line py-5">
            <summary class="cursor-pointer font-semibold text-home-900 flex justify-between">O que são tokens?<span>+</span></summary>
            <p class="text-home-muted mt-3 leading-relaxed">Na Raiz Token, o token funciona como unidade de apoio dentro da plataforma. 1 token equivale a R$1 em apoio.</p>
          </details>

          <details class="border-b border-home-line py-5">
            <summary class="cursor-pointer font-semibold text-home-900 flex justify-between">É investimento?<span>+</span></summary>
            <p class="text-home-muted mt-3 leading-relaxed">Não. O token não é investimento, não gera rendimento e não representa participação no projeto.</p>
          </details>

          <details class="py-5">
            <summary class="cursor-pointer font-semibold text-home-900 flex justify-between">O que acontece se a meta não for atingida?<span>+</span></summary>
            <p class="text-home-muted mt-3 leading-relaxed">Os tokens retornam para a carteira do apoiador, conforme as regras da campanha e da plataforma.</p>
          </details>
        </div>
      </div>
    </section>

    <section id="cta" class="py-24 section-warm">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="relative overflow-hidden rounded-[42px] bg-gradient-to-br from-home-900 to-home-800 p-10 md:p-16 shadow-home-card text-white reveal">
          <div class="absolute right-0 top-0 w-[520px] h-[520px] rounded-full bg-home-gold/20 blur-3xl"></div>

          <div class="relative z-10 max-w-3xl">
            <h2 class="font-display font-extrabold text-4xl md:text-6xl tracking-[-.038em] leading-[.98] mb-5">
              Seu projeto merece uma estrutura confiável.
            </h2>

            <p class="text-white/75 text-lg leading-relaxed mb-8">
              Envie sua ideia para análise e veja como a Raiz Token pode ajudar a transformar apoio em uma campanha organizada, transparente e segura.
            </p>

            <a href="/" class="inline-flex items-center gap-2 bg-white text-home-900 px-8 py-4 rounded-full font-semibold hover:-translate-y-1 transition-all">
              Enviar projeto para análise <i class="ph-bold ph-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="bg-home-900 text-white/70 pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-5 md:px-6">
      <div class="grid md:grid-cols-4 gap-10 mb-12">
        <div>
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <i class="ph ph-tree-structure text-white text-xl"></i>
            </div>
            <span class="font-display font-bold text-xl text-white">RaizToken</span>
          </div>

          <p class="text-sm leading-relaxed">
            Crowdfunding inteligente para projetos reais, com validação, reputação pública e prestação de contas.
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-white mb-4">Plataforma</h4>
          <a class="block mb-3 hover:text-white" href="#como">Como funciona</a>
          <a class="block mb-3 hover:text-white" href="#apoiar">Como apoiar</a>
          <a class="block mb-3 hover:text-white" href="#projetos">Projetos</a>
        </div>

        <div>
          <h4 class="font-semibold text-white mb-4">Confiança</h4>
          <a class="block mb-3 hover:text-white" href="#diferenciais">Diferenciais</a>
          <a class="block mb-3 hover:text-white" href="#governanca">Governança</a>
          <a class="block mb-3 hover:text-white" href="#faq">FAQ</a>
        </div>

        <div>
          <h4 class="font-semibold text-white mb-4">Legal</h4>
          <a class="block mb-3 hover:text-white" href="/">Termos</a>
          <a class="block mb-3 hover:text-white" href="/">Privacidade</a>
          <a class="block mb-3 hover:text-white" href="/">LGPD</a>
        </div>
      </div>

      <div class="border-t border-white/10 pt-6 text-sm text-white/50 leading-relaxed">
        © 2026 Plataforma Raiz Token. Todos os direitos reservados.
      </div>
    </div>
  </footer>

  <nav class="mobile-bottom-nav" aria-label="Navegação mobile">
    <a href="#projetos">
      <i class="ph-fill ph-squares-four"></i>
      Projetos
    </a>

    <a href="#apoiar">
      <i class="ph-fill ph-hand-heart"></i>
      Apoiar
    </a>

    <a href="/criar-projeto" class="active">
      <i class="ph-fill ph-plus-circle"></i>
      Enviar
    </a>

    <a href="#diferenciais">
      <i class="ph-fill ph-medal"></i>
      Confiança
    </a>

    <a href="/login">
      <i class="ph-fill ph-user-circle"></i>
      Entrar
    </a>
  </nav>`;

const Index = () => {
  useEffect(() => {
    const root = document.querySelector('.raiz-public-home');
    if (!root) return;

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    const activate = (element: HTMLElement) => {
      element.classList.add('active');
      element.querySelectorAll<HTMLElement>('.progress-fill').forEach((bar) => {
        window.setTimeout(() => {
          const targetWidth = bar.getAttribute('data-width');
          if (targetWidth) bar.style.width = targetWidth;
        }, 280);
      });
    };

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(activate);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activate(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>Raiz Token | Crowdfunding Inteligente e Confi?vel</title>
        <meta
          name="description"
          content="Crowdfunding inteligente para projetos reais, com valida??o humana, reputa??o p?blica, presta??o de contas e regras claras do in?cio ao fim."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://unpkg.com/@phosphor-icons/web" />
      </Helmet>
      <div className="raiz-public-home antialiased font-sans" dangerouslySetInnerHTML={{ __html: publicHomeMarkup }} />
    </>
  );
};

export default Index;
