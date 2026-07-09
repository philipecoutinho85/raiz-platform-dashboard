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
            <div class="text-[11px] uppercase tracking-[.14em] font-semibold text-home-muted">RaizScore</div>
          </div>

          <div class="hero-project-card absolute right-10 top-24 w-full max-w-[560px] glass rounded-[34px] overflow-hidden shadow-home-deep z-10">
            <div class="h-[300px] hero-cover relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1400&h=900&fit=crop" alt="Capa do projeto NexoLab Criativo" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-home-950/80 via-home-950/20 to-transparent"></div>
              <div class="absolute top-5 left-5 bg-home-900/90 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md">
                <i class="ph-fill ph-shield-check text-home-gold mr-1"></i> Projeto validado
              </div>
            </div>
            <div class="p-7 bg-white">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div class="inline-flex items-center gap-2 bg-home-100 text-home-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[.12em] mb-3">Tecnologia + Criatividade</div>
                  <h3 class="font-display text-2xl font-extrabold tracking-[-.025em] text-home-900">NexoLab Criativo</h3>
                  <p class="text-home-muted mt-1">Um projeto independente para transformar ideias em soluções digitais acessíveis.</p>
                </div>
              </div>

              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                  <span><strong class="text-home-900">R$ 29.250</strong> arrecadados</span>
                  <span>Meta <strong class="text-home-900">R$ 40.000</strong></span>
                </div>
                <div class="h-3 rounded-full bg-home-line overflow-hidden">
                  <div class="h-full bg-home-800 rounded-full progress-fill" data-progress="73"></div>
                </div>
                <div class="text-right text-sm font-semibold text-home-900 mt-1">73%</div>
              </div>

              <div class="grid grid-cols-3 gap-3 text-sm">
                <div class="bg-home-100 rounded-2xl p-3">
                  <div class="flex -space-x-2 mb-2">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" class="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" class="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" class="w-6 h-6 rounded-full border-2 border-white" />
                  </div>
                  <strong class="text-home-900">128</strong><br><span class="text-home-muted">apoiadores</span>
                </div>
                <div class="bg-home-100 rounded-2xl p-3">
                  <i class="ph ph-clipboard-text text-xl text-home-800"></i><br>
                  <strong class="text-home-900">Prestação</strong><br><span class="text-home-800">em dia</span>
                </div>
                <div class="bg-home-100 rounded-2xl p-3">
                  <div class="w-8 h-8 rounded-full border-[5px] border-home-800 border-t-home-line mb-1"></div>
                  <strong class="text-home-900">92/100</strong><br><span class="text-home-muted">RaizScore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="como" class="py-24 section-white">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="text-center max-w-3xl mx-auto mb-14 reveal">
          <div class="section-badge mb-5 mx-auto">Jornada com governança</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-5">
            Da ideia ao apoio:<br />
            <span class="text-home-800">Uma jornada com validação e transparência.</span>
          </h2>
          <p class="text-lg text-home-muted leading-relaxed">Cada etapa foi desenhada para dar clareza ao criador e segurança para quem apoia.</p>
        </div>

        <div class="grid md:grid-cols-5 gap-4">
          <div class="support-step-card reveal bg-white border border-home-line rounded-3xl p-6 shadow-home-glass">
            <div class="support-icon w-12 h-12 rounded-2xl border border-home-line bg-home-100 flex items-center justify-center text-home-800 mb-5"><i class="ph ph-paper-plane-tilt text-2xl"></i></div>
            <div class="font-mono text-4xl font-semibold text-home-900 mb-3">01</div>
            <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">Envie seu projeto</h3>
            <p class="text-home-muted text-sm leading-relaxed">Conte sua ideia em poucos minutos.</p>
          </div>

          <div class="support-step-card reveal bg-white border border-home-line rounded-3xl p-6 shadow-home-glass" style="transition-delay:80ms;">
            <div class="support-icon w-12 h-12 rounded-2xl border border-home-line bg-home-100 flex items-center justify-center text-home-800 mb-5"><i class="ph ph-clipboard-text text-2xl"></i></div>
            <div class="font-mono text-4xl font-semibold text-home-900 mb-3">02</div>
            <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">Passe pela análise</h3>
            <p class="text-home-muted text-sm leading-relaxed">Nossa equipe valida viabilidade e impacto.</p>
          </div>

          <div class="support-step-card reveal bg-white border border-home-line rounded-3xl p-6 shadow-home-glass" style="transition-delay:160ms;">
            <div class="support-icon w-12 h-12 rounded-2xl border border-home-line bg-home-100 flex items-center justify-center text-home-800 mb-5"><i class="ph ph-shield-check text-2xl"></i></div>
            <div class="font-mono text-4xl font-semibold text-home-900 mb-3">03</div>
            <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">Publique com segurança</h3>
            <p class="text-home-muted text-sm leading-relaxed">Seu projeto ganha visibilidade e confiança.</p>
          </div>

          <div class="support-step-card reveal bg-white border border-home-line rounded-3xl p-6 shadow-home-glass" style="transition-delay:240ms;">
            <div class="support-icon w-12 h-12 rounded-2xl border border-home-line bg-home-100 flex items-center justify-center text-home-800 mb-5"><i class="ph ph-users-three text-2xl"></i></div>
            <div class="font-mono text-4xl font-semibold text-home-900 mb-3">04</div>
            <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">Receba apoios</h3>
            <p class="text-home-muted text-sm leading-relaxed">Apoiadores reais impulsionam sua jornada.</p>
          </div>

          <div class="support-step-card reveal bg-white border border-home-line rounded-3xl p-6 shadow-home-glass" style="transition-delay:320ms;">
            <div class="support-icon w-12 h-12 rounded-2xl border border-home-line bg-home-100 flex items-center justify-center text-home-800 mb-5"><i class="ph ph-file-check text-2xl"></i></div>
            <div class="font-mono text-4xl font-semibold text-home-900 mb-3">05</div>
            <h3 class="font-display font-extrabold text-xl tracking-[-.025em] text-home-900 mb-2">Preste contas</h3>
            <p class="text-home-muted text-sm leading-relaxed">Transparência contínua fortalece sua reputação.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="diferenciais" class="py-24 section-warm">
      <div class="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-[.9fr_1.1fr] gap-14 items-center">
        <div class="reveal">
          <div class="section-badge mb-5">Diferenciais</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-6">Não é só arrecadar. É construir confiança pública.</h2>
          <p class="text-lg text-home-muted leading-relaxed mb-8">A Raiz Token combina curadoria, reputação e prestação de contas para organizar uma nova camada de confiança no financiamento coletivo.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="differential-card bg-white rounded-3xl border border-home-line p-5 shadow-home-glass">
              <i class="ph-fill ph-identification-card text-3xl text-home-800"></i>
              <h3 class="font-display font-extrabold text-xl text-home-900 mt-4 mb-2">Identidade verificada</h3>
              <p class="text-sm text-home-muted leading-relaxed">O criador passa por validação antes da publicação.</p>
            </div>
            <div class="differential-card bg-white rounded-3xl border border-home-line p-5 shadow-home-glass">
              <i class="ph-fill ph-chart-donut text-3xl text-home-800"></i>
              <h3 class="font-display font-extrabold text-xl text-home-900 mt-4 mb-2">RaizScore</h3>
              <p class="text-sm text-home-muted leading-relaxed">Indicadores de reputação ajudam apoiadores a decidir.</p>
            </div>
            <div class="differential-card bg-white rounded-3xl border border-home-line p-5 shadow-home-glass">
              <i class="ph-fill ph-seal-check text-3xl text-home-800"></i>
              <h3 class="font-display font-extrabold text-xl text-home-900 mt-4 mb-2">Badges públicos</h3>
              <p class="text-sm text-home-muted leading-relaxed">Sinais visuais mostram consistência e transparência.</p>
            </div>
            <div class="differential-card bg-white rounded-3xl border border-home-line p-5 shadow-home-glass">
              <i class="ph-fill ph-arrows-clockwise text-3xl text-home-800"></i>
              <h3 class="font-display font-extrabold text-xl text-home-900 mt-4 mb-2">Token voltou</h3>
              <p class="text-sm text-home-muted leading-relaxed">Se a meta não for atingida, os tokens retornam à carteira.</p>
            </div>
          </div>
        </div>

        <div class="reveal glass-dark rounded-[42px] p-6 md:p-8 shadow-home-deep text-white" style="transition-delay:120ms;">
          <div class="flex items-center justify-between mb-8">
            <div>
              <div class="text-home-gold text-xs uppercase tracking-[.18em] font-semibold mb-2">Painel de confiança</div>
              <h3 class="font-display text-3xl font-extrabold">Apoio Confiável</h3>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><i class="ph ph-fingerprint text-2xl text-home-gold"></i></div>
          </div>

          <div class="space-y-4">
            <div class="bg-white/[0.08] border border-white/10 rounded-3xl p-5">
              <div class="flex justify-between text-sm mb-2"><span>Identidade do criador</span><span class="text-home-gold">verificada</span></div>
              <div class="h-2 bg-white/10 rounded-full overflow-hidden"><div class="h-full w-full bg-home-gold rounded-full"></div></div>
            </div>
            <div class="bg-white/[0.08] border border-white/10 rounded-3xl p-5">
              <div class="flex justify-between text-sm mb-2"><span>Prestação de contas</span><span class="text-home-gold">obrigatória</span></div>
              <div class="h-2 bg-white/10 rounded-full overflow-hidden"><div class="h-full w-[86%] bg-home-gold rounded-full"></div></div>
            </div>
            <div class="bg-white/[0.08] border border-white/10 rounded-3xl p-5">
              <div class="flex justify-between text-sm mb-2"><span>RaizScore</span><span class="text-home-gold">92/100</span></div>
              <div class="h-2 bg-white/10 rounded-full overflow-hidden"><div class="h-full w-[92%] bg-home-gold rounded-full"></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="apoiar" class="py-24 section-stone">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="grid lg:grid-cols-[.85fr_1.15fr] gap-12 items-start">
          <div class="reveal">
            <div class="section-badge mb-5">Como apoiar um projeto</div>
            <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-6">Do cadastro ao apoio, tudo precisa ser claro.</h2>
            <p class="text-lg text-home-muted leading-relaxed mb-8">O apoiador entende o fluxo antes de contribuir: cria conta, compra tokens, escolhe um projeto e acompanha a evolução da campanha.</p>
            <a href="/projetos" class="inline-flex items-center gap-2 bg-home-900 text-white px-7 py-4 rounded-full font-semibold hover:bg-home-800 transition-colors">Explorar projetos <i class="ph ph-arrow-right"></i></a>
          </div>

          <div class="bg-white/70 border border-home-line rounded-[40px] p-4 md:p-5 shadow-home-glass">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="support-step-card bg-white rounded-3xl border border-home-line p-6">
                <div class="support-icon w-12 h-12 rounded-2xl bg-home-100 border border-home-line flex items-center justify-center text-home-800 mb-5"><i class="ph ph-user-circle-plus text-2xl"></i></div>
                <h3 class="font-display text-xl font-extrabold text-home-900 mb-2">Crie sua conta</h3>
                <p class="text-home-muted text-sm leading-relaxed">Tenha acesso à carteira e aos projetos disponíveis.</p>
              </div>
              <div class="support-step-card bg-white rounded-3xl border border-home-line p-6">
                <div class="support-icon w-12 h-12 rounded-2xl bg-home-100 border border-home-line flex items-center justify-center text-home-800 mb-5"><i class="ph ph-coins text-2xl"></i></div>
                <h3 class="font-display text-xl font-extrabold text-home-900 mb-2">Compre tokens</h3>
                <p class="text-home-muted text-sm leading-relaxed">Compra mínima de R$5,00. Cada token representa R$1,00 em apoio.</p>
              </div>
              <div class="support-step-card bg-white rounded-3xl border border-home-line p-6">
                <div class="support-icon w-12 h-12 rounded-2xl bg-home-100 border border-home-line flex items-center justify-center text-home-800 mb-5"><i class="ph ph-hand-heart text-2xl"></i></div>
                <h3 class="font-display text-xl font-extrabold text-home-900 mb-2">Apoie projetos</h3>
                <p class="text-home-muted text-sm leading-relaxed">Escolha campanhas alinhadas aos seus interesses e acompanhe o progresso.</p>
              </div>
              <div class="support-step-card bg-home-900 text-white rounded-3xl border border-home-900 p-6">
                <div class="support-icon w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-home-gold mb-5"><i class="ph ph-arrow-u-down-left text-2xl"></i></div>
                <h3 class="font-display text-xl font-extrabold mb-2">Se a meta não for atingida</h3>
                <p class="text-white/70 text-sm leading-relaxed">Os tokens voltam automaticamente para a carteira do apoiador.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="projetos" class="py-24 section-white">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 reveal">
          <div>
            <div class="section-badge mb-5">Vitrine curada</div>
            <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-4">Projetos com cara de projeto real.</h2>
            <p class="text-lg text-home-muted max-w-2xl">A vitrine exibe informações que importam: meta, captação, apoiadores, prestação de contas e reputação.</p>
          </div>
          <a href="/projetos" class="inline-flex items-center gap-2 bg-home-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-home-800 transition-colors w-fit">Ver todos <i class="ph ph-arrow-right"></i></a>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <article class="reveal bg-white border border-home-line rounded-[34px] overflow-hidden shadow-home-glass hover:shadow-home-card hover:-translate-y-2 transition-all">
            <div class="h-56 relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&h=600&fit=crop" alt="Projeto NexoLab" class="w-full h-full object-cover" loading="lazy" decoding="async" />
              <div class="absolute inset-0 bg-gradient-to-t from-home-950/70 to-transparent"></div>
              <div class="absolute top-4 left-4 bg-white/90 text-home-900 px-3 py-1 rounded-full text-xs font-bold">Tecnologia</div>
            </div>
            <div class="p-6">
              <h3 class="font-display text-2xl font-extrabold text-home-900 mb-2">NexoLab Criativo</h3>
              <p class="text-home-muted text-sm leading-relaxed mb-5">Laboratório de criação digital para jovens talentos.</p>
              <div class="space-y-3">
                <div class="flex justify-between text-sm"><span>Arrecadado</span><strong>R$ 29.250</strong></div>
                <div class="flex justify-between text-sm"><span>Meta</span><strong>R$ 40.000</strong></div>
                <div class="h-2 bg-home-line rounded-full overflow-hidden"><div class="h-full w-[73%] bg-home-800 rounded-full"></div></div>
                <div class="grid grid-cols-3 gap-2 text-xs text-home-muted pt-2">
                  <span>128 apoiadores</span><span>Prestação em dia</span><span>RaizScore 92</span>
                </div>
              </div>
            </div>
          </article>

          <article class="reveal bg-white border border-home-line rounded-[34px] overflow-hidden shadow-home-glass hover:shadow-home-card hover:-translate-y-2 transition-all" style="transition-delay:100ms;">
            <div class="h-56 relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=600&fit=crop" alt="Projeto Escola Maker" class="w-full h-full object-cover" loading="lazy" decoding="async" />
              <div class="absolute inset-0 bg-gradient-to-t from-home-950/70 to-transparent"></div>
              <div class="absolute top-4 left-4 bg-white/90 text-home-900 px-3 py-1 rounded-full text-xs font-bold">Educação</div>
            </div>
            <div class="p-6">
              <h3 class="font-display text-2xl font-extrabold text-home-900 mb-2">Escola Maker</h3>
              <p class="text-home-muted text-sm leading-relaxed mb-5">Ferramentas práticas para aulas de tecnologia.</p>
              <div class="space-y-3">
                <div class="flex justify-between text-sm"><span>Arrecadado</span><strong>R$ 18.400</strong></div>
                <div class="flex justify-between text-sm"><span>Meta</span><strong>R$ 30.000</strong></div>
                <div class="h-2 bg-home-line rounded-full overflow-hidden"><div class="h-full w-[61%] bg-home-800 rounded-full"></div></div>
                <div class="grid grid-cols-3 gap-2 text-xs text-home-muted pt-2">
                  <span>82 apoiadores</span><span>Prestação em dia</span><span>RaizScore 88</span>
                </div>
              </div>
            </div>
          </article>

          <article class="reveal bg-white border border-home-line rounded-[34px] overflow-hidden shadow-home-glass hover:shadow-home-card hover:-translate-y-2 transition-all" style="transition-delay:200ms;">
            <div class="h-56 relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556761233-0971f5e8574a?w=900&h=600&fit=crop" alt="Projeto Comunidade Empreende" class="w-full h-full object-cover" loading="lazy" decoding="async" />
              <div class="absolute inset-0 bg-gradient-to-t from-home-950/70 to-transparent"></div>
              <div class="absolute top-4 left-4 bg-white/90 text-home-900 px-3 py-1 rounded-full text-xs font-bold">Empreendedorismo</div>
            </div>
            <div class="p-6">
              <h3 class="font-display text-2xl font-extrabold text-home-900 mb-2">Comunidade Empreende</h3>
              <p class="text-home-muted text-sm leading-relaxed mb-5">Capacitação para pequenos negócios locais.</p>
              <div class="space-y-3">
                <div class="flex justify-between text-sm"><span>Arrecadado</span><strong>R$ 42.100</strong></div>
                <div class="flex justify-between text-sm"><span>Meta</span><strong>R$ 55.000</strong></div>
                <div class="h-2 bg-home-line rounded-full overflow-hidden"><div class="h-full w-[76%] bg-home-800 rounded-full"></div></div>
                <div class="grid grid-cols-3 gap-2 text-xs text-home-muted pt-2">
                  <span>211 apoiadores</span><span>Prestação em dia</span><span>RaizScore 94</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="governanca" class="py-24 section-warm">
      <div class="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
        <div class="reveal">
          <div class="section-badge mb-5">Governança e confiança</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-6">Uma plataforma feita para reduzir ruído e aumentar clareza.</h2>
          <p class="text-lg text-home-muted leading-relaxed mb-8">Cada projeto precisa apresentar informações mínimas, critérios de validação e compromisso com prestação de contas.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="mini-feature-card bg-white border border-home-line rounded-3xl p-5 shadow-home-glass"><i class="ph-fill ph-user-focus text-3xl text-home-800"></i><h3 class="font-display text-xl font-extrabold text-home-900 mt-4 mb-2">Identidade</h3><p class="text-sm text-home-muted">Verificação do criador antes da publicação.</p></div>
            <div class="mini-feature-card bg-white border border-home-line rounded-3xl p-5 shadow-home-glass"><i class="ph-fill ph-clipboard-text text-3xl text-home-800"></i><h3 class="font-display text-xl font-extrabold text-home-900 mt-4 mb-2">Curadoria</h3><p class="text-sm text-home-muted">Análise humana antes de aparecer na vitrine.</p></div>
            <div class="mini-feature-card bg-white border border-home-line rounded-3xl p-5 shadow-home-glass"><i class="ph-fill ph-file-lock text-3xl text-home-800"></i><h3 class="font-display text-xl font-extrabold text-home-900 mt-4 mb-2">Prestação</h3><p class="text-sm text-home-muted">Transparência obrigatória após a campanha.</p></div>
            <div class="mini-feature-card bg-white border border-home-line rounded-3xl p-5 shadow-home-glass"><i class="ph-fill ph-arrows-clockwise text-3xl text-home-800"></i><h3 class="font-display text-xl font-extrabold text-home-900 mt-4 mb-2">Devolução</h3><p class="text-sm text-home-muted">Token volta se a meta não for atingida.</p></div>
          </div>
        </div>

        <div class="reveal bg-white border border-home-line rounded-[42px] p-5 shadow-home-card" style="transition-delay:120ms;">
          <div class="h-64 rounded-[32px] overflow-hidden mb-5 relative">
            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1000&h=700&fit=crop" alt="Painel da plataforma Raiz Token" class="w-full h-full object-cover" loading="lazy" decoding="async" />
            <div class="absolute inset-0 bg-gradient-to-t from-home-950/70 to-transparent"></div>
            <div class="absolute bottom-5 left-5 text-white"><div class="text-xs uppercase tracking-[.14em] text-home-gold font-bold mb-1">Painel da plataforma</div><div class="font-display text-2xl font-extrabold">Acompanhamento e confiança</div></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-home-100 rounded-3xl p-4"><div class="text-xs text-home-muted mb-1">Projeto</div><strong class="text-home-900">NexoLab Criativo</strong><div class="text-home-800 text-sm mt-1">Score 92</div></div>
            <div class="bg-home-100 rounded-3xl p-4"><div class="text-xs text-home-muted mb-1">Projeto</div><strong class="text-home-900">Escola Maker</strong><div class="text-home-800 text-sm mt-1">Score 88</div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="criadores" class="py-24 section-white">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="text-center max-w-3xl mx-auto mb-12 reveal">
          <div class="section-badge mb-5 mx-auto">Criadores e apoiadores</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-5">Dois lados. Um ambiente de confiança.</h2>
          <p class="text-lg text-home-muted leading-relaxed">A experiência foi pensada para quem cria e para quem apoia, com clareza sobre papéis, riscos e responsabilidades.</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-6 bg-home-100/70 rounded-[40px] p-4 border border-home-line shadow-home-glass">
          <div class="creator-card bg-white rounded-[34px] p-7 border border-home-line lg:border-r border-home-line">
            <div class="flex items-center gap-4 mb-6"><div class="mini-icon w-12 h-12 rounded-2xl bg-home-900 text-home-gold flex items-center justify-center"><i class="ph ph-rocket-launch text-2xl"></i></div><div><div class="text-xs uppercase tracking-[.16em] text-home-800 font-bold">Criador</div><h3 class="font-display text-3xl font-extrabold text-home-900">Transforme ideia em campanha.</h3></div></div>
            <ul class="space-y-4 text-home-muted">
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Publique com narrativa, meta e critérios claros.</span></li>
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Construa reputação com badges e prestação de contas.</span></li>
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Receba apoio sem perder clareza sobre responsabilidades.</span></li>
            </ul>
          </div>
          <div class="supporter-card bg-white rounded-[34px] p-7 border border-home-line">
            <div class="flex items-center gap-4 mb-6"><div class="mini-icon w-12 h-12 rounded-2xl bg-home-900 text-home-gold flex items-center justify-center"><i class="ph ph-hand-heart text-2xl"></i></div><div><div class="text-xs uppercase tracking-[.16em] text-home-800 font-bold">Apoiador</div><h3 class="font-display text-3xl font-extrabold text-home-900">Apoie sabendo o que acontece.</h3></div></div>
            <ul class="space-y-4 text-home-muted">
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Use tokens para apoiar projetos alinhados aos seus interesses.</span></li>
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Acompanhe meta, apoiadores, evolução e prestação de contas.</span></li>
              <li class="flex gap-3"><i class="ph-fill ph-check-circle text-home-800 mt-1"></i><span>Se a meta não for atingida, seus tokens retornam.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="py-24 section-stone">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="text-center max-w-3xl mx-auto mb-12 reveal">
          <div class="section-badge mb-5 mx-auto">Tipos de projetos</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-5">Uma vitrine para ideias sérias, criativas e executáveis.</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="mini-feature-card bg-white rounded-3xl border border-home-line p-6 shadow-home-glass"><i class="ph ph-cpu text-3xl text-home-800"></i><h3 class="font-display font-extrabold text-xl text-home-900 mt-4">Tecnologia</h3></div>
          <div class="mini-feature-card bg-white rounded-3xl border border-home-line p-6 shadow-home-glass"><i class="ph ph-graduation-cap text-3xl text-home-800"></i><h3 class="font-display font-extrabold text-xl text-home-900 mt-4">Educação</h3></div>
          <div class="mini-feature-card bg-white rounded-3xl border border-home-line p-6 shadow-home-glass"><i class="ph ph-storefront text-3xl text-home-800"></i><h3 class="font-display font-extrabold text-xl text-home-900 mt-4">Empreendedorismo</h3></div>
          <div class="mini-feature-card bg-white rounded-3xl border border-home-line p-6 shadow-home-glass"><i class="ph ph-paw-print text-3xl text-home-800"></i><h3 class="font-display font-extrabold text-xl text-home-900 mt-4">Causas legítimas</h3></div>
        </div>
      </div>
    </section>

    <section id="faq" class="py-24 section-white">
      <div class="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-[.8fr_1.2fr] gap-12 items-start">
        <div class="reveal">
          <div class="section-badge mb-5">FAQ</div>
          <h2 class="font-display text-4xl lg:text-5xl font-extrabold tracking-[-.035em] leading-[1.02] text-home-900 mb-6">Perguntas que precisam estar claras.</h2>
          <p class="text-lg text-home-muted leading-relaxed">Apoiar projetos exige confiança. Por isso, as regras principais precisam ser simples.</p>
        </div>
        <div class="space-y-4 reveal">
          <div class="bg-white border border-home-line rounded-[34px] p-6 shadow-home-glass"><h3 class="font-display text-xl font-extrabold text-home-900 mb-2">Token é investimento?</h3><p class="text-home-muted">Não. Token é uma unidade simbólica de apoio dentro da plataforma.</p></div>
          <div class="bg-white border border-home-line rounded-[34px] p-6 shadow-home-glass"><h3 class="font-display text-xl font-extrabold text-home-900 mb-2">Quanto vale 1 token?</h3><p class="text-home-muted">Cada token equivale a R$1,00 em apoio.</p></div>
          <div class="bg-white border border-home-line rounded-[34px] p-6 shadow-home-glass"><h3 class="font-display text-xl font-extrabold text-home-900 mb-2">E se o projeto não bater a meta?</h3><p class="text-home-muted">Os tokens voltam automaticamente para a carteira do apoiador.</p></div>
        </div>
      </div>
    </section>

    <section id="cta" class="py-24 section-warm">
      <div class="max-w-7xl mx-auto px-5 md:px-6">
        <div class="rounded-[42px] bg-gradient-to-br from-home-900 to-home-800 text-white p-10 md:p-16 text-center shadow-home-deep reveal">
          <div class="section-badge mb-6 mx-auto bg-white/10 border-white/10 text-white">Comece com clareza</div>
          <h2 class="font-display text-4xl lg:text-6xl font-extrabold tracking-[-.04em] leading-[.98] mb-6">Seu projeto merece apoio confiável.</h2>
          <p class="text-white/70 text-lg max-w-2xl mx-auto mb-8">Envie sua ideia para análise e transforme intenção em campanha com governança, reputação e transparência.</p>
          <a href="/criar-projeto" class="inline-flex items-center gap-2 bg-white text-home-900 px-8 py-4 rounded-full font-semibold hover:bg-home-100 transition-colors">Enviar projeto <i class="ph ph-arrow-right"></i></a>
        </div>
      </div>
    </section>
  </main>

  <footer class="bg-home-900 text-white/70 py-14">
    <div class="max-w-7xl mx-auto px-5 md:px-6 grid md:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center gap-3 mb-5"><div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-home-gold"><i class="ph-fill ph-tree"></i></div><span class="font-display text-xl font-extrabold text-white">Raiz Token</span></div>
        <p class="text-sm leading-relaxed">Crowdfunding inteligente para projetos reais, com validação, reputação pública e prestação de contas.</p>
      </div>
      <div><h3 class="text-white font-bold mb-4">Plataforma</h3><a href="/projetos" class="block mb-2 hover:text-white">Projetos</a><a href="/como-funciona" class="block mb-2 hover:text-white">Como funciona</a><a href="/faq" class="block mb-2 hover:text-white">FAQ</a></div>
      <div><h3 class="text-white font-bold mb-4">Confiança</h3><a href="/privacy" class="block mb-2 hover:text-white">Privacidade</a><a href="/terms" class="block mb-2 hover:text-white">Termos</a><a href="/contato" class="block mb-2 hover:text-white">Contato</a></div>
      <div><h3 class="text-white font-bold mb-4">Acesso</h3><a href="/login" class="block mb-2 hover:text-white">Entrar</a><a href="/registro" class="block mb-2 hover:text-white">Criar conta</a></div>
    </div>
  </footer>`;

const Index = () => {
  useEffect(() => {
    const revealElements = document.querySelectorAll('.raiz-public-home .reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach((element) => observer.observe(element));

    const progressBars = document.querySelectorAll<HTMLElement>('.raiz-public-home .progress-fill');
    window.setTimeout(() => {
      progressBars.forEach((bar) => {
        const progress = bar.dataset.progress || '0';
        bar.style.width = `${progress}%`;
      });
    }, 500);

    const navbar = document.getElementById('navbar');
    const onScroll = () => {
      if (!navbar) return;
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll);
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <Helmet>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/fill/style.css" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/bold/style.css" />
        <title>Raiz Token | Crowdfunding inteligente com confiança real</title>
        <meta name="description" content="Transforme projetos independentes em campanhas confiáveis com validação humana, reputação pública, prestação de contas e regras claras." />
        <link rel="canonical" href="https://raiztoken.com.br/" />
      </Helmet>
      <div className="raiz-public-home font-sans" dangerouslySetInnerHTML={{ __html: publicHomeMarkup }} />
    </>
  );
};

export default Index;
