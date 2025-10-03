import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, UserCheck, Database, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <Shield className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Política de 
            <span className="text-raiz-gold"> Privacidade</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            O Raiz Token respeita sua privacidade e cumpre rigorosamente a LGPD (Lei Geral de Proteção de Dados). 
            Conheça como protegemos suas informações.
          </p>
        </div>

        {/* Privacy Content */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          
          {/* Dados Coletados */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Database className="w-6 h-6" />
                Dados que Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>
                Coletamos apenas os dados <strong>estritamente necessários</strong> para operar a plataforma e garantir segurança:
              </p>
              
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">📋 Dados Pessoais:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome completo e e-mail (obrigatórios para cadastro)</li>
                  <li>CPF (exigido apenas para saques ou compliance fiscal)</li>
                  <li>Telefone (opcional, para notificações importantes)</li>
                  <li>Endereço (apenas se necessário para contrapartidas físicas)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">💰 Dados de Transações:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Histórico de apoios realizados e tokens adquiridos</li>
                  <li>Projetos apoiados e valores correspondentes</li>
                  <li>Dados de pagamento criptografados (processados por terceiros seguros)</li>
                  <li>Histórico de reembolsos e devoluções</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔍 Dados de Uso:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Navegação na plataforma (para melhorar a experiência)</li>
                  <li>Dispositivo e browser utilizados (para otimização)</li>
                  <li>Endereço IP (para segurança e prevenção de fraudes)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Como Protegemos */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Como Protegemos seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔐 Criptografia Avançada:</h4>
                <p>Todos os dados são armazenados de forma segura utilizando criptografia SSL/TLS de ponta. Senhas são protegidas com hash seguro.</p>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🏦 Infraestrutura Segura:</h4>
                <p>Utilizamos servidores certificados com backups automáticos, monitoramento 24/7 e atualizações de segurança constantes.</p>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">👥 Acesso Restrito:</h4>
                <p>Apenas funcionários autorizados têm acesso aos dados, sempre com propósito específico e sob supervisão.</p>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔍 Auditoria Regular:</h4>
                <p>Realizamos auditorias periódicas de segurança e conformidade com a LGPD.</p>
              </div>
            </CardContent>
          </Card>

          {/* Seus Direitos */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <UserCheck className="w-6 h-6" />
                Seus Direitos (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>Conforme a Lei Geral de Proteção de Dados, você tem os seguintes direitos:</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-raiz-light mb-2">✅ Acesso</h4>
                  <p className="text-sm">Consultar quais dados temos sobre você</p>
                  
                  <h4 className="font-semibold text-raiz-light mb-2 mt-4">📝 Correção</h4>
                  <p className="text-sm">Solicitar correção de dados incorretos</p>
                  
                  <h4 className="font-semibold text-raiz-light mb-2 mt-4">🗑️ Exclusão</h4>
                  <p className="text-sm">Pedir remoção dos seus dados pessoais</p>
                </div>
                <div>
                  <h4 className="font-semibold text-raiz-light mb-2">📄 Portabilidade</h4>
                  <p className="text-sm">Exportar seus dados em formato legível</p>
                  
                  <h4 className="font-semibold text-raiz-light mb-2 mt-4">🚫 Oposição</h4>
                  <p className="text-sm">Recusar processamento dos seus dados</p>
                  
                  <h4 className="font-semibold text-raiz-light mb-2 mt-4">ℹ️ Informação</h4>
                  <p className="text-sm">Saber como utilizamos seus dados</p>
                </div>
              </div>

              <div className="bg-raiz-accent/10 p-4 rounded-lg mt-6">
                <p className="text-center">
                  <strong>Para exercer qualquer direito:</strong><br />
                  Entre em contato através do e-mail: <span className="text-raiz-gold">contato@raiztoken.com.br</span><br />
                  <small>Responderemos em até 48 horas</small>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Compartilhamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <p className="text-center font-semibold">
                  🛡️ <strong>NUNCA compartilharemos seus dados pessoais com terceiros</strong> sem sua autorização expressa.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Exceções Legais:</h4>
                <p>Podemos compartilhar dados apenas quando:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Exigido por lei ou ordem judicial</li>
                  <li>Necessário para prevenir fraudes ou crimes</li>
                  <li>Para processar pagamentos (dados criptografados enviados aos gateways)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">Parceiros de Pagamento:</h4>
                <p>Utilizamos apenas gateways certificados e reconhecidos no mercado (como Mercado Pago, PagSeguro) 
                   que seguem as mesmas normas de segurança e privacidade.</p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-raiz-gold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Cookies e Tecnologias Similares
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <p>Utilizamos cookies para melhorar sua experiência na plataforma:</p>
              
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🍪 Cookies Essenciais:</h4>
                <p>Necessários para o funcionamento básico (login, carrinho, segurança)</p>
                
                <h4 className="font-semibold text-raiz-light mb-2 mt-4">📊 Cookies de Análise:</h4>
                <p>Ajudam a entender como você usa a plataforma (sempre anônimos)</p>
                
                <h4 className="font-semibold text-raiz-light mb-2 mt-4">⚙️ Cookies de Preferência:</h4>
                <p>Lembram suas configurações e melhoram a experiência personalizada</p>
              </div>

              <p className="text-sm bg-raiz-accent/10 p-3 rounded">
                💡 <strong>Dica:</strong> Você pode gerenciar cookies nas configurações do seu navegador, 
                mas isso pode afetar algumas funcionalidades da plataforma.
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Transparência Total
          </h2>
          <p className="text-xl text-raiz-light/80 mb-8">
            Sua privacidade é nossa prioridade. Qualquer dúvida, estamos à disposição para esclarecer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/security">
              <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-black font-semibold px-8">
                Segurança
              </Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Termos de Uso
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;