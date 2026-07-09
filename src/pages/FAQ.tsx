import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, ShieldCheck, Coins, RefreshCw, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const FAQ = () => {
  const faqs = [
    {
      question: 'Como posso apoiar um projeto?',
      answer: 'O apoio aos projetos é realizado exclusivamente por meio de tokens. Caso não haja saldo suficiente, você poderá adquirir tokens antes de concluir o apoio. Após a compra, você será redirecionado automaticamente para finalizar seu apoio ao projeto.'
    },
    {
      question: 'Posso apoiar diretamente com PIX ou cartão?',
      answer: 'Não. O apoio aos projetos é feito apenas com tokens. Os métodos de pagamento são utilizados apenas para a compra de tokens. A opção de pagamento via PIX estará disponível em breve.'
    },
    {
      question: 'O que é um token?',
      answer: 'Um token é uma unidade digital simbólica dentro da plataforma. Cada token equivale a R$1,00 e representa seu apoio a um projeto. O token não é investimento, não gera rendimento e não representa participação no projeto.'
    },
    {
      question: 'Qual o valor mínimo para apoiar?',
      answer: 'O valor mínimo é de R$5,00, que gera 5 tokens. Essa quantidade permite que você já faça um apoio inicial dentro da plataforma.'
    },
    {
      question: 'O que acontece se o projeto não atingir a meta?',
      answer: 'Se a meta não for atingida no prazo estabelecido, todos os tokens correspondentes ao seu apoio são devolvidos automaticamente para sua carteira digital, conforme as regras da campanha e da plataforma.'
    },
    {
      question: 'Posso sacar meus tokens em dinheiro?',
      answer: 'Você pode solicitar o reembolso em reais antes do encerramento do projeto, conforme as regras aplicáveis. Nesse caso, a quantidade correspondente de tokens é removida da sua carteira.'
    },
    {
      question: 'É seguro apoiar projetos pelo Raiz Token?',
      answer: 'A plataforma usa processamento de pagamentos por provedores especializados, autenticação, regras de validação, devolução de tokens quando aplicável e mecanismos de transparência para reduzir riscos.'
    },
    {
      question: 'Como funciona o reembolso?',
      answer: 'Você pode solicitar reembolso do valor pago em reais antes do encerramento do projeto. O valor é devolvido pelo meio definido no fluxo operacional e os tokens correspondentes são removidos da carteira.'
    },
    {
      question: 'Os criadores de projeto são verificados?',
      answer: 'Sim. Criadores passam por processo de verificação de identidade e análise do projeto antes da publicação, reforçando a responsabilidade e a confiança da campanha.'
    },
    {
      question: 'Posso acompanhar o progresso dos projetos que apoiei?',
      answer: 'Sim. Em sua carteira digital, você pode visualizar projetos apoiados, tokens utilizados, andamento das campanhas e informações de acompanhamento disponíveis.'
    },
    {
      question: 'Há limite para quantos projetos posso apoiar?',
      answer: 'Não há limite de quantidade de projetos. Você pode apoiar diferentes campanhas, respeitando as regras e o mínimo de tokens por apoio.'
    },
    {
      question: 'E se eu mudar de ideia sobre um apoio?',
      answer: 'Enquanto o projeto estiver ativo e dentro das regras aplicáveis, você pode solicitar reembolso antes do encerramento. Após determinadas etapas da campanha, o apoio pode se tornar definitivo conforme as regras da plataforma.'
    },
    {
      question: 'Quais são as taxas para criadores de projetos?',
      answer: 'A plataforma cobra taxa administrativa sobre o valor líquido, após eventuais taxas da operadora de pagamento. As regras e exemplos de cálculo são apresentados de forma transparente no fluxo da plataforma.'
    },
    {
      question: 'Qual o prazo para receber os valores arrecadados?',
      answer: 'Após o encerramento do projeto e a aprovação da prestação de contas pela administração, o repasse ao autor segue o prazo operacional informado pela plataforma.'
    },
    {
      question: 'O que é a prestação de contas?',
      answer: 'É o relatório obrigatório em que o criador demonstra como os recursos foram utilizados. A prestação de contas fortalece a transparência e pode impactar a capacidade de criar novos projetos.'
    },
    {
      question: 'Como são calculadas as taxas sobre meu projeto?',
      answer: 'Primeiro são consideradas as taxas da operadora de pagamento. Depois, sobre o valor líquido restante, aplica-se a taxa administrativa da plataforma, conforme regras informadas ao criador.'
    }
  ];

  const highlights = [
    {
      icon: Coins,
      title: '1 token = R$1',
      description: 'Unidade simbólica de apoio dentro da plataforma.'
    },
    {
      icon: ShieldCheck,
      title: 'Validação prévia',
      description: 'Criadores e projetos passam por análise antes da publicação.'
    },
    {
      icon: RefreshCw,
      title: 'Devolução de tokens',
      description: 'Se a meta não for atingida, os tokens retornam ao apoiador.'
    },
    {
      icon: FileText,
      title: 'Prestação de contas',
      description: 'Transparência como parte central do ciclo do projeto.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes sobre Crowdfunding | Raiz Token</title>
        <meta name="description" content="Tire suas dúvidas sobre como funciona o crowdfunding na Raiz Token, taxas, prazos, validação de projetos e devolução de valores." />
        <link rel="canonical" href="https://raiztoken.com.br/faq" />
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)]">
      <main className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto max-w-7xl">
          <section className="mx-auto mb-14 max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              FAQ
            </div>

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-home-line bg-white/90 text-home-800 shadow-home-glass">
              <HelpCircle className="h-8 w-8" />
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              Perguntas frequentes sobre a Raiz Token.
            </h1>

            <p className="mx-auto max-w-3xl text-base leading-relaxed text-home-muted md:text-lg">
              Tire suas dúvidas sobre tokens, apoios, reembolsos, verificação de criadores, prestação de contas e regras da plataforma.
            </p>
          </section>

          <section className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-[26px] border-home-line bg-white/90 shadow-home-glass transition-all duration-300 hover:-translate-y-2 hover:shadow-home-card">
                  <CardContent className="p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-home-line bg-white text-home-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mb-2 font-display text-lg font-extrabold tracking-[-.025em] text-home-900">{item.title}</h2>
                    <p className="text-sm leading-relaxed text-home-muted">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <Card className="mx-auto mb-16 max-w-5xl overflow-hidden rounded-[34px] border-home-line bg-white/92 shadow-home-card backdrop-blur-xl">
            <CardContent className="p-5 md:p-8">
              <div className="mb-6 flex flex-col gap-3 border-b border-home-line pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-home-100/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-home-900">
                    Dúvidas principais
                  </div>
                  <h2 className="font-display text-2xl font-extrabold tracking-[-.03em] text-home-900 md:text-4xl">Respostas objetivas para apoiar com clareza.</h2>
                </div>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="rounded-2xl border border-home-line bg-white px-4 shadow-sm transition-colors hover:bg-home-100/55">
                    <AccordionTrigger className="text-left font-semibold text-home-900 hover:text-home-800 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-home-muted">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <section className="overflow-hidden rounded-[38px] bg-gradient-to-br from-home-900 to-home-800 p-8 text-white shadow-home-card md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">
                Ainda tem dúvidas?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
                Fale com a equipe da Raiz Token ou veja o funcionamento completo da plataforma.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/contato">
                  <Button size="lg" className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
                    Falar Conosco
                  </Button>
                </Link>
                <Link to="/como-funciona">
                  <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
                    Como Funciona
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

export default FAQ;
