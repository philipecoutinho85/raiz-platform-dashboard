import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Settings, BarChart3, Megaphone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <Cookie className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Política de 
            <span className="text-raiz-gold"> Cookies</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Entenda como utilizamos cookies para melhorar sua experiência na plataforma Raiz Token.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          
          {/* O que são Cookies */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Cookie className="w-6 h-6" />
                O que são Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou celular) 
                quando você visita um site. Eles permitem que o site reconheça seu dispositivo e lembre informações 
                sobre sua visita, como preferências de idioma, configurações de login e outras personalizações.
              </p>
              <p>
                Os cookies não coletam informações pessoais diretamente e não podem danificar seu dispositivo. 
                Eles são uma tecnologia padrão da internet, utilizada por praticamente todos os sites modernos.
              </p>
            </CardContent>
          </Card>

          {/* Tipos de Cookies */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Tipos de Cookies que Utilizamos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-6">
              
              <div className="bg-raiz-accent/10 p-4 rounded-lg">
                <h4 className="font-semibold text-raiz-light mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  1. Cookies Essenciais (Obrigatórios)
                </h4>
                <p className="text-sm">
                  São indispensáveis para o funcionamento básico da plataforma. Permitem que você navegue, 
                  faça login, acesse áreas seguras e utilize funcionalidades essenciais.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4 space-y-1">
                  <li>Autenticação e sessão de login</li>
                  <li>Segurança e prevenção de fraudes</li>
                  <li>Preferências de consentimento de cookies</li>
                  <li>Funcionamento do carrinho e checkout</li>
                </ul>
                <p className="text-xs mt-2 text-raiz-gold">
                  ⚠️ Estes cookies não podem ser desativados, pois são necessários para o site funcionar.
                </p>
              </div>

              <div className="bg-raiz-accent/10 p-4 rounded-lg">
                <h4 className="font-semibold text-raiz-light mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  2. Cookies de Desempenho e Analytics
                </h4>
                <p className="text-sm">
                  Coletam informações anônimas sobre como os visitantes usam o site, ajudando-nos a 
                  melhorar a experiência e corrigir problemas.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4 space-y-1">
                  <li>Páginas mais visitadas</li>
                  <li>Tempo de permanência no site</li>
                  <li>Origem do tráfego (como você chegou ao site)</li>
                  <li>Erros ou problemas de carregamento</li>
                </ul>
              </div>

              <div className="bg-raiz-accent/10 p-4 rounded-lg">
                <h4 className="font-semibold text-raiz-light mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  3. Cookies de Funcionalidade
                </h4>
                <p className="text-sm">
                  Permitem que o site lembre escolhas que você faz para proporcionar uma experiência 
                  mais personalizada.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4 space-y-1">
                  <li>Preferências de idioma e região</li>
                  <li>Configurações de exibição (tema claro/escuro)</li>
                  <li>Dados de formulários preenchidos anteriormente</li>
                  <li>Preferências de notificação</li>
                </ul>
              </div>

              <div className="bg-raiz-accent/10 p-4 rounded-lg">
                <h4 className="font-semibold text-raiz-light mb-2 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-400" />
                  4. Cookies de Marketing
                </h4>
                <p className="text-sm">
                  Utilizados para exibir anúncios relevantes e medir a eficácia das campanhas de marketing.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4 space-y-1">
                  <li>Anúncios personalizados com base em interesses</li>
                  <li>Medição de conversões de campanhas</li>
                  <li>Remarketing (anúncios para visitantes que já acessaram o site)</li>
                  <li>Integração com redes sociais</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Finalidades */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Finalidades do Uso de Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>Utilizamos cookies para as seguintes finalidades:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Autenticação segura:</strong> Manter sua sessão ativa enquanto navega</li>
                <li><strong>Preferências:</strong> Lembrar suas configurações e escolhas</li>
                <li><strong>Segurança:</strong> Detectar atividades suspeitas e proteger sua conta</li>
                <li><strong>Análise:</strong> Entender como você usa a plataforma para melhorá-la</li>
                <li><strong>Performance:</strong> Garantir que o site carregue rapidamente</li>
                <li><strong>Marketing:</strong> Exibir conteúdo relevante (com seu consentimento)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Como Gerenciar */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Como Gerenciar e Revogar Consentimento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Através do Navegador:</h4>
                <p>
                  Você pode configurar seu navegador para recusar cookies ou alertá-lo quando um cookie 
                  estiver sendo enviado. As opções variam conforme o navegador:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4 space-y-1">
                  <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
                  <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
                  <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
                  <li><strong>Edge:</strong> Configurações → Cookies e permissões de site</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Através da Plataforma:</h4>
                <p>
                  Usuários cadastrados podem gerenciar suas preferências de cookies e consentimentos 
                  diretamente no perfil, na seção "Central de Privacidade".
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Atenção:</strong> Desabilitar certos cookies pode afetar a funcionalidade 
                  do site. Cookies essenciais são necessários para o funcionamento básico e não podem 
                  ser desativados sem comprometer sua experiência.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alteração de Preferências */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold">
                Como Alterar Preferências Posteriormente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Você pode alterar suas preferências de cookies a qualquer momento através dos seguintes métodos:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>Banner de Cookies:</strong> Limpe os cookies do site nas configurações do seu 
                  navegador e, ao visitar novamente, o banner de consentimento será exibido.
                </li>
                <li>
                  <strong>Central de Privacidade:</strong> Acesse seu perfil e vá até a aba "Privacidade" 
                  para gerenciar suas preferências de consentimento.
                </li>
                <li>
                  <strong>Contato:</strong> Envie um e-mail para contato@raiztoken.com.br solicitando 
                  alteração das suas preferências.
                </li>
              </ol>
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

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-xl text-raiz-light/80 mb-8">
            Dúvidas sobre cookies? Estamos à disposição.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/privacy">
              <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-black font-semibold px-8">
                Política de Privacidade
              </Button>
            </Link>
            <Link to="/contato">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Falar Conosco
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CookiePolicy;