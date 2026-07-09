import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, UserCheck, Database, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { LegalCTA, LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Raiz Token</title>
        <meta name="description" content="Veja como a Raiz Token trata dados pessoais de criadores e apoiadores de campanhas de crowdfunding na plataforma." />
        <link rel="canonical" href="https://raiztoken.com.br/privacy" />
      </Helmet>

      <LegalPageLayout
      badge="Privacidade"
      title="Política de Privacidade."
      subtitle="A Raiz Token respeita sua privacidade e adota práticas alinhadas à LGPD para proteger dados pessoais tratados na plataforma."
      icon={<Shield className="h-8 w-8" />}
      footer={
        <LegalCTA>
          <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">Privacidade com transparência.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            Consulte as políticas específicas para apoiadores e criadores ou veja também os termos de uso.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
              <Link to="/privacidade-apoiadores">Para Apoiadores</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/privacidade-criadores">Para Criadores</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/terms">Termos de Uso</Link>
            </Button>
          </div>
        </LegalCTA>
      }
    >
      <LegalSection title="Dados que coletamos" icon={<Database className="h-5 w-5" />}>
        <p>Coletamos apenas os dados necessários para operar a plataforma, oferecer segurança e cumprir obrigações legais.</p>
        <h4>Dados pessoais</h4>
        <ul>
          <li>Nome completo e e-mail para cadastro.</li>
          <li>CPF, telefone e endereço quando necessários para operações, validações, saques, repasses ou obrigações legais.</li>
        </ul>
        <h4>Dados de transações</h4>
        <ul>
          <li>Histórico de apoios realizados e tokens adquiridos.</li>
          <li>Projetos apoiados, valores correspondentes, reembolsos e devoluções.</li>
          <li>Dados de pagamento processados por provedores especializados.</li>
        </ul>
        <h4>Dados de uso</h4>
        <ul>
          <li>Navegação na plataforma para melhoria de experiência.</li>
          <li>Dispositivo, navegador e endereço IP para segurança e prevenção de fraudes.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Como protegemos seus dados" icon={<Lock className="h-5 w-5" />}>
        <h4>Criptografia e segurança</h4>
        <p>Adotamos medidas técnicas para proteger dados em trânsito e em repouso, incluindo conexões seguras, autenticação e controles de acesso.</p>
        <h4>Infraestrutura e acesso restrito</h4>
        <p>O acesso aos dados é restrito a pessoas autorizadas e associado a finalidades operacionais, suporte, auditoria, segurança ou obrigações legais.</p>
        <h4>Auditoria e conformidade</h4>
        <p>Podemos realizar revisões periódicas de segurança e conformidade para reduzir riscos e aprimorar a proteção dos usuários.</p>
      </LegalSection>

      <LegalSection title="Seus direitos — LGPD" icon={<UserCheck className="h-5 w-5" />}>
        <p>Conforme a Lei Geral de Proteção de Dados, você pode solicitar:</p>
        <ul>
          <li>Acesso aos dados pessoais tratados pela plataforma.</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
          <li>Exclusão ou anonimização, respeitadas obrigações legais e regulatórias.</li>
          <li>Portabilidade, quando aplicável.</li>
          <li>Informações sobre compartilhamento e finalidade de tratamento.</li>
          <li>Revogação de consentimento, quando o tratamento depender dessa base legal.</li>
        </ul>
        <p>Para exercer seus direitos, entre em contato pelo e-mail: <a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a>.</p>
      </LegalSection>

      <LegalSection title="Compartilhamento de dados" icon={<Eye className="h-5 w-5" />} emphasis>
        <p>A Raiz Token não vende dados pessoais dos usuários.</p>
        <p>O compartilhamento pode ocorrer apenas quando necessário para:</p>
        <ul>
          <li>Cumprimento de obrigação legal, regulatória ou ordem judicial.</li>
          <li>Prevenção de fraude, segurança da plataforma e proteção de direitos.</li>
          <li>Processamento de pagamentos, reembolsos, repasses e serviços operacionais.</li>
          <li>Suporte, auditoria e funcionamento técnico da plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies e tecnologias similares" icon={<FileText className="h-5 w-5" />}>
        <p>Utilizamos cookies para melhorar sua experiência, manter funcionalidades essenciais, reforçar segurança e compreender o uso da plataforma.</p>
        <ul>
          <li><strong>Cookies essenciais:</strong> login, segurança, sessão e funcionamento básico.</li>
          <li><strong>Cookies de análise:</strong> entendimento de navegação e melhoria da experiência.</li>
          <li><strong>Cookies de preferência:</strong> configurações e escolhas do usuário.</li>
        </ul>
        <p>Você pode gerenciar cookies no navegador. Algumas funcionalidades podem ser afetadas se cookies essenciais forem bloqueados.</p>
      </LegalSection>

      <LegalSection title="Dados do controlador" icon={<Shield className="h-5 w-5" />}>
        <p><strong>Razão Social:</strong> Raiz Token Tecnologia LTDA</p>
        <p><strong>CNPJ:</strong> 32.351.662/0001-00</p>
        <p><strong>Endereço:</strong> Rua General Castrioto, 500, Barreto, Niterói-RJ</p>
        <p><strong>E-mail:</strong> contato@raiztoken.com.br</p>
      </LegalSection>

      <LegalSection title="Encarregado de dados — DPO" icon={<UserCheck className="h-5 w-5" />}>
        <p>O encarregado de dados será oficialmente nomeado. Até a nomeação, solicitações relacionadas à privacidade podem ser enviadas para <a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a>.</p>
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

export default Privacy;
