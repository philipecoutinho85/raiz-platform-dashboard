import { Shield, Lock, Eye, Share2, Cookie, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LegalCTA, LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const PrivacySupporters = () => {
  return (
    <LegalPageLayout
      badge="Privacidade"
      title="Política de Privacidade para Apoiadores."
      subtitle="A Raiz Token valoriza a transparência e o respeito à privacidade de todos que apoiam projetos dentro da plataforma."
      icon={<Shield className="h-8 w-8" />}
      footer={
        <LegalCTA>
          <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">Dúvidas sobre seus dados?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            Fale conosco ou consulte a política específica para criadores.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
              <Link to="/contato">Falar Conosco</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/privacidade-criadores">Política para Criadores</Link>
            </Button>
          </div>
        </LegalCTA>
      }
    >
      <LegalSection title="Quem somos" icon={<Shield className="h-5 w-5" />}>
        <p>A Raiz Token é uma plataforma digital que conecta pessoas e iniciativas de impacto socioambiental. Atuamos como intermediadora de arrecadações, permitindo que apoiadores contribuam com projetos reais, sempre em moeda nacional, de forma segura e transparente.</p>
        <p>Não operamos com criptomoedas ou blockchain no momento, e todos os repasses são realizados através de sistemas tradicionais de pagamento.</p>
      </LegalSection>

      <LegalSection title="Quais dados coletamos" icon={<Eye className="h-5 w-5" />}>
        <h4>Dados cadastrais básicos</h4>
        <p>Nome, sobrenome, e-mail e telefone celular no momento do cadastro.</p>
        <h4>Dados complementares</h4>
        <p>CPF, endereço e data de nascimento, quando necessários para cumprir obrigações legais ou para emissão de recibos.</p>
        <h4>Dados de pagamento</h4>
        <p>Informações de transações, valores apoiados, datas e comprovantes. Não armazenamos dados completos de cartão de crédito.</p>
        <h4>Dados técnicos</h4>
        <p>Endereço IP, navegador, sistema operacional e logs de acesso para fins de segurança.</p>
      </LegalSection>

      <LegalSection title="Como usamos essas informações" icon={<Lock className="h-5 w-5" />}>
        <ul>
          <li>Confirmar e registrar sua contribuição.</li>
          <li>Emitir comprovantes e recibos eletrônicos.</li>
          <li>Comunicar o andamento do projeto apoiado.</li>
          <li>Notificar sobre conquistas, badges ou relatórios de impacto.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
          <li>Melhorar a experiência do usuário dentro da plataforma.</li>
        </ul>
        <p><strong>A Raiz Token nunca vende ou compartilha dados pessoais com terceiros para fins comerciais.</strong></p>
      </LegalSection>

      <LegalSection title="Bases legais de tratamento" icon={<Shield className="h-5 w-5" />}>
        <ul>
          <li><strong>Consentimento do titular</strong>, ao criar uma conta e apoiar um projeto.</li>
          <li><strong>Cumprimento de obrigação legal</strong>, em casos de emissão de comprovantes e relatórios.</li>
          <li><strong>Execução de contrato</strong>, para viabilizar o apoio e os repasses aos criadores.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Armazenamento e segurança" icon={<Lock className="h-5 w-5" />}>
        <p>Os dados são armazenados em servidores seguros, com acesso restrito e controle de autenticação.</p>
        <p>A plataforma adota medidas técnicas e administrativas para prevenir acesso não autorizado, perda ou uso indevido das informações.</p>
      </LegalSection>

      <LegalSection title="Direitos do apoiador — LGPD" icon={<Eye className="h-5 w-5" />}>
        <p>Você pode, a qualquer momento:</p>
        <ul>
          <li>Solicitar acesso, atualização ou exclusão dos seus dados.</li>
          <li>Retirar seu consentimento.</li>
          <li>Solicitar portabilidade das informações.</li>
        </ul>
        <p>Para exercer seus direitos, envie um e-mail para: <a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a>.</p>
      </LegalSection>

      <LegalSection title="Compartilhamento de informações" icon={<Share2 className="h-5 w-5" />}>
        <p>Os dados podem ser compartilhados apenas com:</p>
        <ul>
          <li>Fornecedores de pagamento, para processar transações em reais.</li>
          <li>Órgãos públicos ou judiciais, mediante solicitação legal.</li>
          <li>Equipe interna da Raiz Token, para suporte, auditoria e compliance.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Uso de cookies" icon={<Cookie className="h-5 w-5" />}>
        <p>Utilizamos cookies para melhorar a navegação, lembrar preferências e entender como o site é usado.</p>
        <p>Você pode gerenciar permissões diretamente em seu navegador.</p>
      </LegalSection>

      <LegalSection title="Alterações nesta política" icon={<Shield className="h-5 w-5" />}>
        <p>A Raiz Token poderá atualizar esta Política de Privacidade a qualquer momento.</p>
        <p>Quando isso ocorrer, a nova versão será publicada nesta mesma página, com data de revisão atualizada.</p>
      </LegalSection>

      <LegalSection title="Contato" icon={<Mail className="h-5 w-5" />} emphasis>
        <p>Dúvidas sobre privacidade ou tratamento de dados podem ser enviadas para:</p>
        <p><a href="mailto:contato@raiztoken.com.br">contato@raiztoken.com.br</a></p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default PrivacySupporters;
