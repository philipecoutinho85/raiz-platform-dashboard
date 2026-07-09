import { Button } from '@/components/ui/button';
import { FileText, Shield, Users, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { LegalCTA, LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | Raiz Token</title>
        <meta name="description" content="Consulte os termos de uso da Raiz Token, plataforma de crowdfunding para projetos independentes no Brasil." />
        <link rel="canonical" href="https://raiztoken.com.br/terms" />
      </Helmet>

      <LegalPageLayout
      badge="Termos"
      title="Termos de Uso."
      subtitle="Ao usar a plataforma Raiz Token, você concorda com as regras de funcionamento, apoio, tokens, reembolsos e responsabilidades descritas nesta página."
      icon={<FileText className="h-8 w-8" />}
      footer={
        <LegalCTA>
          <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">Termos atualizados e transparentes.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            Estes termos podem ser atualizados periodicamente. Mudanças relevantes serão comunicadas aos usuários quando aplicável.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
              <Link to="/contato">Falar Conosco</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/security">Segurança</Link>
            </Button>
          </div>
        </LegalCTA>
      }
    >
      <LegalSection title="Natureza dos tokens" icon={<Shield className="h-5 w-5" />} emphasis>
        <p>Os tokens utilizados na plataforma Raiz Token são digitais e simbólicos.</p>
        <p>É importante entender que eles não representam:</p>
        <ul>
          <li>Ativos financeiros ou investimentos.</li>
          <li>Valores mobiliários regulamentados.</li>
          <li>Participação societária em empresas.</li>
          <li>Direito a lucros ou dividendos.</li>
          <li>Criptomoedas ou moedas digitais.</li>
        </ul>
        <p>Os tokens servem exclusivamente como unidade de medida para apoios a projetos dentro da plataforma.</p>
      </LegalSection>

      <LegalSection title="Apoio a projetos" icon={<Users className="h-5 w-5" />}>
        <p>Todo apoio realizado através da plataforma é voluntário e consciente. O usuário compreende e aceita que:</p>
        <ul>
          <li>Os tokens não geram retorno financeiro ou lucro.</li>
          <li>O apoio tem caráter de contribuição a projetos publicados na plataforma.</li>
          <li>Não há garantia de contrapartidas além das oferecidas pelo criador.</li>
          <li>O risco é limitado ao valor apoiado, conforme as regras da plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Devolução e reembolso" icon={<AlertTriangle className="h-5 w-5" />}>
        <h4>Meta não atingida</h4>
        <p>Se o projeto não atingir a meta estabelecida no prazo, os tokens correspondentes ao apoio retornam automaticamente à carteira do usuário.</p>
        <h4>Reembolso antecipado</h4>
        <p>O usuário pode solicitar reembolso em reais antes do encerramento do projeto, observadas as regras aplicáveis.</p>
        <ul>
          <li>O valor será devolvido pelo meio operacional aplicável.</li>
          <li>A quantidade correspondente de tokens será removida da carteira.</li>
          <li>O processamento pode depender de prazos operacionais de terceiros.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Responsabilidade dos criadores" icon={<Users className="h-5 w-5" />}>
        <p>Os criadores de projetos são integralmente responsáveis pelo cumprimento e execução de seus projetos.</p>
        <p>A Raiz Token atua como intermediadora tecnológica, fornecendo a plataforma para conexão entre apoiadores e criadores.</p>
        <p>A plataforma realiza verificação básica de identidade e análise de viabilidade, mas não se responsabiliza por aspectos técnicos, cronogramas ou qualidade da execução dos projetos.</p>
      </LegalSection>

      <LegalSection title="Limitação de responsabilidade" icon={<AlertTriangle className="h-5 w-5" />}>
        <p>A plataforma Raiz Token não se responsabiliza por:</p>
        <ul>
          <li>Perdas indiretas, lucros cessantes ou danos consequenciais.</li>
          <li>Promessas, compromissos ou declarações feitas pelos criadores.</li>
          <li>Mau uso dos recursos arrecadados pelos criadores.</li>
          <li>Atrasos, cancelamentos ou mudanças nos projetos.</li>
          <li>Problemas técnicos temporários na plataforma.</li>
          <li>Falhas em serviços de terceiros, como provedores de pagamento.</li>
        </ul>
        <p>Nossa responsabilidade se limita às regras de funcionamento da plataforma, devolução de tokens quando aplicável e processamento de reembolsos conforme estes termos.</p>
      </LegalSection>

      <LegalSection title="Histórico de alterações" icon={<FileText className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-home-line">
                <th className="py-2 text-left text-home-900">Data</th>
                <th className="py-2 text-left text-home-900">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-home-line/70">
                <td className="py-2">07/12/2025</td>
                <td className="py-2">Versão inicial publicada</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Futuras alterações serão adicionadas nesta tabela com a respectiva data e descrição.</p>
      </LegalSection>
      </LegalPageLayout>
    </>
  );
};

export default Terms;
