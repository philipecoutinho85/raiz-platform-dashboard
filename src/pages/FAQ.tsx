import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const FAQ = () => {
  const faqs = [
    {
      question: "O que é um token?",
      answer: "Um token é uma unidade digital simbólica dentro da nossa plataforma. Cada token equivale a R$ 1,00 e representa seu apoio a um projeto. Os tokens são uma forma moderna e transparente de registrar suas contribuições para causas sociais importantes."
    },
    {
      question: "Qual o valor mínimo para apoiar?",
      answer: "O valor mínimo é de R$ 50,00, que gera 50 tokens. Essa quantidade permite que você já faça uma contribuição significativa para projetos menores ou combine com outros apoiadores em projetos maiores."
    },
    {
      question: "O que acontece se o projeto não atingir a meta?",
      answer: "Se a meta não for atingida no prazo estabelecido, todos os tokens correspondentes ao seu apoio são devolvidos automaticamente para sua carteira digital. Além disso, você pode solicitar o reembolso em reais antes do encerramento do projeto a qualquer momento."
    },
    {
      question: "Posso sacar meus tokens em dinheiro?",
      answer: "Não. Os tokens são simbólicos e servem apenas para apoiar projetos dentro da plataforma. Eles permanecem como registro histórico do seu apoio. Apenas o criador do projeto pode sacar os recursos arrecadados, e somente se a meta for alcançada no prazo."
    },
    {
      question: "É seguro apoiar projetos pelo Raiz Token?",
      answer: "Sim, é totalmente seguro. Utilizamos gateways de pagamento confiáveis e certificados, devolvemos os tokens automaticamente caso a meta não seja alcançada, e oferecemos transparência total na auditoria de cada projeto. Todos os dados são protegidos por criptografia SSL."
    },
    {
      question: "Como funciona o reembolso?",
      answer: "Você pode solicitar reembolso do valor pago em reais a qualquer momento antes do encerramento do projeto. O valor será devolvido via o mesmo meio de pagamento utilizado (PIX/cartão) e a quantidade correspondente de tokens será removida da sua carteira."
    },
    {
      question: "Os criadores de projeto são verificados?",
      answer: "Sim, todos os criadores passam por um processo de verificação que inclui validação de identidade, análise do projeto proposto e verificação de documentos. Isso garante a seriedade e viabilidade dos projetos na plataforma."
    },
    {
      question: "Posso acompanhar o progresso dos projetos que apoiei?",
      answer: "Claro! Em sua carteira digital você pode ver todos os projetos que apoiou, o progresso atual de cada um, quantos tokens você contribuiu e o status (ativo, financiado ou não financiado). Você recebe notificações sobre marcos importantes."
    },
    {
      question: "Há limite para quantos projetos posso apoiar?",
      answer: "Não há limite! Você pode apoiar quantos projetos quiser, com a quantidade de tokens que desejar (respeitando o mínimo de 50 tokens por apoio). Diversificar seus apoios ajuda mais projetos a alcançarem suas metas."
    },
    {
      question: "E se eu mudar de ideia sobre um apoio?",
      answer: "Enquanto o projeto estiver ativo e não tiver atingido a meta, você pode solicitar reembolso a qualquer momento. Após a meta ser atingida, o apoio é confirmado e os recursos são liberados para o criador."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <HelpCircle className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Perguntas 
            <span className="text-raiz-gold"> Frequentes</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Tire todas as suas dúvidas sobre como funciona o Raiz Token. 
            Se não encontrar a resposta que procura, entre em contato conosco!
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20 max-w-4xl mx-auto mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-raiz-gold text-center">
              Principais Dúvidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-raiz-accent/20">
                  <AccordionTrigger className="text-raiz-light hover:text-raiz-gold text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-raiz-light/80">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-raiz-light/80 mb-8">
            Nossa equipe está pronta para ajudar você com qualquer questão.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contato">
              <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-black font-semibold px-8">
                Falar Conosco
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;