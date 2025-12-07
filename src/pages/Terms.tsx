import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, Users, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <FileText className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Termos de 
            <span className="text-raiz-gold"> Uso</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Ao usar a plataforma Raiz Token, você concorda com os seguintes termos e condições.
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          
          {/* Natureza dos Tokens */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Natureza dos Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Os tokens utilizados na plataforma Raiz Token são <strong>digitais e simbólicos</strong>. 
                É importante entender que eles <strong>não representam</strong>:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ativos financeiros ou investimentos</li>
                <li>Valores mobiliários regulamentados</li>
                <li>Participação societária em empresas</li>
                <li>Direito a lucros ou dividendos</li>
                <li>Criptomoedas ou moedas digitais</li>
              </ul>
              <p>
                Os tokens servem exclusivamente como unidade de medida para apoios a projetos sociais na plataforma.
              </p>
            </CardContent>
          </Card>

          {/* Apoio a Projetos */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Apoio a Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Todo apoio realizado através da plataforma é <strong>voluntário e consciente</strong>. 
                O usuário compreende e aceita que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Os tokens não geram retorno financeiro ou lucro</li>
                <li>O apoio tem caráter social e filantrópico</li>
                <li>Não há garantia de contrapartidas além das oferecidas pelo criador</li>
                <li>O risco é limitado ao valor apoiado</li>
              </ul>
            </CardContent>
          </Card>

          {/* Devolução e Reembolso */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Devolução e Reembolso
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Meta Não Atingida:</h4>
                <p>Se o projeto não atingir a meta estabelecida no prazo, todos os tokens correspondentes ao apoio retornam automaticamente à carteira do usuário.</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Reembolso Antecipado:</h4>
                <p>O usuário pode solicitar reembolso em reais a qualquer momento antes do encerramento do projeto, sendo que:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>O valor será devolvido via o mesmo meio de pagamento utilizado (PIX/cartão)</li>
                  <li>A quantidade correspondente de tokens será removida da carteira</li>
                  <li>O processo pode levar até 5 dias úteis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Responsabilidade dos Criadores */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Responsabilidade dos Criadores
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Os criadores de projetos são <strong>integralmente responsáveis</strong> pelo cumprimento e execução de seus projetos. 
                O Raiz Token atua apenas como <strong>intermediador tecnológico</strong>, fornecendo a plataforma para conexão entre apoiadores e criadores.
              </p>
              <p>
                A plataforma realiza verificação básica de identidade e viabilidade, mas não se responsabiliza por aspectos técnicos, 
                cronogramas ou qualidade da execução dos projetos.
              </p>
            </CardContent>
          </Card>

          {/* Limitação de Responsabilidade */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                A plataforma Raiz Token <strong>não se responsabiliza</strong> por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Perdas indiretas, lucros cessantes ou danos consequenciais</li>
                <li>Promessas, compromissos ou declarações feitas pelos criadores</li>
                <li>Mal uso dos recursos arrecadados pelos criadores</li>
                <li>Atrasos, cancelamentos ou mudanças nos projetos</li>
                <li>Problemas técnicos temporários na plataforma</li>
                <li>Falhas em serviços de terceiros (gateways de pagamento)</li>
              </ul>
              <p className="mt-4">
                Nossa responsabilidade se limita à devolução dos tokens em caso de meta não atingida e 
                ao processamento de reembolsos conforme estabelecido nestes termos.
              </p>
            </CardContent>
          </Card>

          {/* Histórico de Alterações */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-raiz-accent/20">
                    <th className="text-left py-2 text-raiz-light">Data</th>
                    <th className="text-left py-2 text-raiz-light">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-raiz-accent/10">
                    <td className="py-2">07/12/2025</td>
                    <td className="py-2">Versão inicial publicada</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs mt-4 text-raiz-light/60">
                Futuras alterações serão adicionadas a esta tabela com a respectiva data e descrição.
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Agreement Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Termos Atualizados
          </h2>
          <p className="text-xl text-raiz-light/80 mb-8">
            Estes termos podem ser atualizados periodicamente. Sempre notificaremos os usuários sobre mudanças importantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contato">
              <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-black font-semibold px-8">
                Falar Conosco
              </Button>
            </Link>
            <Link to="/security">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Segurança
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;