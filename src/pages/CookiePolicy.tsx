import { Cookie, Settings, BarChart3, Megaphone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LegalCTA, LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const CookiePolicy = () => {
  return (
    <LegalPageLayout
      badge="Cookies"
      title="Política de Cookies."
      subtitle="Entenda como a Raiz Token utiliza cookies e tecnologias similares para manter a plataforma funcional, segura e mais eficiente."
      icon={<Cookie className="h-8 w-8" />}
      footer={
        <LegalCTA>
          <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] md:text-5xl">Dúvidas sobre cookies?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            Consulte também nossa Política de Privacidade ou fale diretamente com a equipe.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 font-semibold text-home-900 hover:bg-white/90">
              <Link to="/privacy">Política de Privacidade</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 font-semibold text-white hover:bg-white/15">
              <Link to="/contato">Falar Conosco</Link>
            </Button>
          </div>
        </LegalCTA>
      }
    >
      <LegalSection title="O que são cookies?" icon={<Cookie className="h-5 w-5" />}>
        <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site reconheça seu dispositivo e lembre informações sobre sua visita, como preferências de idioma, configurações de login e outras personalizações.</p>
        <p>Os cookies não coletam informações pessoais diretamente e não podem danificar seu dispositivo. Eles são uma tecnologia padrão da internet, utilizada por praticamente todos os sites modernos.</p>
      </LegalSection>

      <LegalSection title="Tipos de cookies que utilizamos" icon={<Settings className="h-5 w-5" />}>
        <h4>Cookies essenciais — obrigatórios</h4>
        <p>São indispensáveis para o funcionamento básico da plataforma. Permitem navegação, login, acesso a áreas seguras e funcionalidades essenciais.</p>
        <ul>
          <li>Autenticação e sessão de login.</li>
          <li>Segurança e prevenção de fraudes.</li>
          <li>Preferências de consentimento de cookies.</li>
          <li>Funcionamento do carrinho e checkout.</li>
        </ul>
        <p><strong>Estes cookies não podem ser desativados sem comprometer o funcionamento do site.</strong></p>

        <h4>Cookies de desempenho e analytics</h4>
        <p>Coletam informações anônimas sobre como visitantes usam o site, ajudando a melhorar a experiência e corrigir problemas.</p>
        <ul>
          <li>Páginas mais visitadas.</li>
          <li>Tempo de permanência no site.</li>
          <li>Origem do tráfego.</li>
          <li>Erros ou problemas de carregamento.</li>
        </ul>

        <h4>Cookies de funcionalidade</h4>
        <p>Permitem que o site lembre escolhas feitas por você para proporcionar uma experiência mais personalizada.</p>
        <ul>
          <li>Preferências de idioma e região.</li>
          <li>Configurações de exibição.</li>
          <li>Dados de formulários preenchidos anteriormente.</li>
          <li>Preferências de notificação.</li>
        </ul>

        <h4>Cookies de marketing</h4>
        <p>Utilizados para exibir anúncios relevantes e medir a eficácia de campanhas de marketing, quando houver consentimento aplicável.</p>
        <ul>
          <li>Anúncios personalizados com base em interesses.</li>
          <li>Medição de conversões de campanhas.</li>
          <li>Remarketing.</li>
          <li>Integração com redes sociais.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalidades do uso de cookies" icon={<BarChart3 className="h-5 w-5" />}>
        <p>Utilizamos cookies para as seguintes finalidades:</p>
        <ul>
          <li><strong>Autenticação segura:</strong> manter sua sessão ativa enquanto navega.</li>
          <li><strong>Preferências:</strong> lembrar configurações e escolhas.</li>
          <li><strong>Segurança:</strong> detectar atividades suspeitas e proteger sua conta.</li>
          <li><strong>Análise:</strong> entender como você usa a plataforma para melhorá-la.</li>
          <li><strong>Performance:</strong> garantir que o site carregue de forma adequada.</li>
          <li><strong>Marketing:</strong> exibir conteúdo relevante, quando permitido.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Como gerenciar e revogar consentimento" icon={<Shield className="h-5 w-5" />}>
        <h4>Através do navegador</h4>
        <p>Você pode configurar seu navegador para recusar cookies ou alertá-lo quando um cookie estiver sendo enviado. As opções variam conforme o navegador.</p>
        <ul>
          <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies.</li>
          <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies.</li>
          <li><strong>Safari:</strong> Preferências → Privacidade → Cookies.</li>
          <li><strong>Edge:</strong> Configurações → Cookies e permissões de site.</li>
        </ul>

        <h4>Através da plataforma</h4>
        <p>Usuários cadastrados podem gerenciar preferências de cookies e consentimentos diretamente no perfil, na seção Central de Privacidade, quando disponível.</p>
        <p><strong>Atenção:</strong> desabilitar certos cookies pode afetar funcionalidades da plataforma.</p>
      </LegalSection>

      <LegalSection title="Como alterar preferências posteriormente" icon={<Megaphone className="h-5 w-5" />}>
        <ol>
          <li><strong>Banner de Cookies:</strong> limpe os cookies do site nas configurações do navegador e, ao visitar novamente, o banner de consentimento será exibido.</li>
          <li><strong>Central de Privacidade:</strong> acesse seu perfil e vá até a aba Privacidade para gerenciar preferências.</li>
          <li><strong>Contato:</strong> envie um e-mail para contato@raiztoken.com.br solicitando alteração das suas preferências.</li>
        </ol>
      </LegalSection>

      <LegalSection title="Histórico de alterações" icon={<Shield className="h-5 w-5" />}>
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
  );
};

export default CookiePolicy;
