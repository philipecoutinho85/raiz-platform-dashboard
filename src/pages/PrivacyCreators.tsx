import { Shield, Lock, Eye, Share2, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LegalCTA, LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const PrivacyCreators = () => {
  return (
    <LegalPageLayout
      badge="Privacidade"
      title="Política de Privacidade para Criadores."
      subtitle="A Raiz Token protege dados pessoais de criadores que submetem projetos, passam por validação e utilizam a plataforma para captar apoios."
      icon={<Shield className="h-8 w-8" />}
      footer={
        <LegalCTA>
          <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">Dúvidas sobre privacidade?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            Fale conosco ou consulte a política específica para apoiadores.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
              <Link to="/contato">Falar Conosco</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/privacidade-apoiadores">Política para Apoiadores</Link>
            </Button>
          </div>
        </LegalCTA>
      }
    >
      <LegalSection title="Finalidade da coleta" icon={<FileText className="h-5 w-5" />}>
        <p>Ao cadastrar um projeto, o criador fornece informações que permitem:</p>
        <ul>
          <li>Verificar identidade e legitimidade do responsável.</li>
          <li>Analisar a viabilidade e credibilidade do projeto.</li>
          <li>Processar repasses financeiros com segurança.</li>
          <li>Cumprir obrigações legais e de auditoria.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Quais dados coletamos" icon={<Eye className="h-5 w-5" />}>
        <h4>Dados pessoais obrigatórios</h4>
        <p>Nome completo, CPF, data de nascimento, e-mail e telefone celular.</p>
        <h4>Dados de endereço</h4>
        <p>CEP, logradouro, número, complemento, bairro, cidade e estado, com preenchimento automático via CEP quando aplicável.</p>
        <h4>Dados financeiros</h4>
        <p>Informações bancárias apenas para repasse dos valores arrecadados.</p>
        <h4>Dados de projeto</h4>
        <p>Título, descrição, metas, imagens, vídeos e informações públicas exibidas na plataforma.</p>
        <h4>Comprovantes e evidências</h4>
        <p>Documentos e fotos de resultados, quando aplicável, para validação de impacto e prestação de contas.</p>
      </LegalSection>

      <LegalSection title="Uso e tratamento das informações" icon={<Lock className="h-5 w-5" />}>
        <p>Os dados coletados são utilizados para:</p>
        <ul>
          <li>Avaliar e aprovar projetos pela curadoria.</li>
          <li>Exibir informações públicas sobre o projeto.</li>
          <li>Processar pagamentos e repasses aos criadores.</li>
          <li>Emitir relatórios e auditorias de impacto.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
          <li>Enviar comunicações sobre status, badges e resultados.</li>
        </ul>
        <p><strong>A Raiz Token não comercializa dados pessoais e mantém todas as informações sob confidencialidade e controle interno.</strong></p>
      </LegalSection>

      <LegalSection title="Armazenamento e segurança" icon={<Lock className="h-5 w-5" />}>
        <p>Os dados são armazenados em servidores seguros, com criptografia e controles de acesso.</p>
        <p>Apenas colaboradores autorizados podem acessar informações sensíveis, mediante registro de auditoria.</p>
      </LegalSection>

      <LegalSection title="Direitos do criador — LGPD" icon={<Eye className="h-5 w-5" />}>
        <p>O criador pode solicitar, a qualquer momento:</p>
        <ul>
          <li>Acesso aos dados armazenados.</li>
          <li>Correção de informações.</li>
          <li>Exclusão de dados pessoais, salvo obrigações legais em vigor.</li>
          <li>Esclarecimento sobre o tratamento de dados.</li>
        </ul>
        <p>Pedidos devem ser enviados para: <a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a>.</p>
      </LegalSection>

      <LegalSection title="Compartilhamento de dados" icon={<Share2 className="h-5 w-5" />}>
        <p>O compartilhamento ocorre apenas quando necessário:</p>
        <ul>
          <li>Com parceiros de pagamento e bancos para repasses em reais.</li>
          <li>Com serviços de hospedagem e segurança para funcionamento da plataforma.</li>
          <li>Com autoridades legais, mediante solicitação formal.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Retenção e exclusão" icon={<FileText className="h-5 w-5" />}>
        <p>Os dados do criador e do projeto são mantidos pelo tempo necessário para:</p>
        <ul>
          <li>Garantir a rastreabilidade e transparência dos repasses.</li>
          <li>Cumprir obrigações legais e fiscais.</li>
          <li>Assegurar histórico de impacto e relatórios públicos.</li>
        </ul>
        <p>Após esse período, os dados são anonimizados ou excluídos de forma segura.</p>
      </LegalSection>

      <LegalSection title="Alterações nesta política" icon={<Shield className="h-5 w-5" />}>
        <p>Esta Política poderá ser revisada periodicamente.</p>
        <p>A versão atualizada será publicada no site, com data de vigência indicada.</p>
      </LegalSection>

      <LegalSection title="Contato" icon={<Mail className="h-5 w-5" />} emphasis>
        <p>Para dúvidas ou solicitações relacionadas à privacidade:</p>
        <p><a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a></p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default PrivacyCreators;
