import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CreditCard, Eye, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Security = () => {
  const securityFeatures = [
    {
      icon: <CreditCard className="w-8 h-8 text-raiz-accent" />,
      title: "Pagamentos 100% Seguros",
      description: "PIX, débito e crédito processados através de parceiros certificados como Mercado Pago e PagSeguro, com criptografia bancária."
    },
    {
      icon: <Shield className="w-8 h-8 text-raiz-accent" />,
      title: "Proteção Anti-Fraude",
      description: "Sistema automático de devolução de tokens, auditoria pública em tempo real e verificação rigorosa de todos os criadores."
    },
    {
      icon: <Server className="w-8 h-8 text-raiz-accent" />,
      title: "Infraestrutura Blindada",
      description: "Criptografia SSL de ponta, autenticação em duas etapas, backups automáticos e monitoramento 24/7 por especialistas."
    },
    {
      icon: <Eye className="w-8 h-8 text-raiz-accent" />,
      title: "Transparência Total",
      description: "Todos os projetos têm auditoria pública com registro completo de contribuições, devoluções e repasses de recursos."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-raiz rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="text-2xl font-bold text-raiz-gold">RAIZ</span>
          </Link>
          <Link to="/">
            <Button variant="outline" className="text-raiz-light border-raiz-light hover:bg-raiz-light hover:text-raiz-primary">
              Voltar ao Início
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <Shield className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Segurança 
            <span className="text-raiz-gold"> Máxima</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Levamos a segurança a sério. O Raiz Token adota as melhores práticas de mercado para 
            proteger tanto apoiadores quanto criadores de projetos.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-raiz-accent/20 hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-raiz-accent/20 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-raiz-light text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-light/80 text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Security Sections */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          
          {/* Payment Security */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl text-raiz-gold flex items-center gap-2">
                <CreditCard className="w-8 h-8" />
                Segurança de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🏦 Parceiros Certificados:</h4>
                <p>Trabalhamos exclusivamente com gateways de pagamento líderes de mercado:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li><strong>Mercado Pago:</strong> Certificação PCI DSS, usado por milhões de brasileiros</li>
                  <li><strong>PagSeguro:</strong> Empresa do grupo UOL, regulamentada pelo Banco Central</li>
                  <li><strong>PIX:</strong> Sistema de pagamentos instantâneos do Banco Central do Brasil</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔐 Criptografia Bancária:</h4>
                <p>Todos os dados de pagamento são criptografados com os mesmos padrões utilizados pelos bancos:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>SSL/TLS 256 bits para transmissão segura</li>
                  <li>Dados de cartão nunca armazenados em nossos servidores</li>
                  <li>Tokenização para proteção adicional</li>
                  <li>Monitoramento em tempo real contra fraudes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Protection */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl text-raiz-gold flex items-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                Proteção Anti-Fraude
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🛡️ Devolução Automática:</h4>
                <p>Sistema inteligente que protege seu investimento:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Tokens devolvidos automaticamente se a meta não for atingida</li>
                  <li>Reembolso disponível a qualquer momento antes do encerramento</li>
                  <li>Processo transparente e auditável</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔍 Verificação de Criadores:</h4>
                <p>Todos os criadores de projeto passam por rigorosa verificação:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Validação de identidade com documentos oficiais</li>
                  <li>Análise de viabilidade técnica e financeira do projeto</li>
                  <li>Verificação de histórico e referências</li>
                  <li>Acompanhamento contínuo durante a campanha</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">📊 Auditoria Pública:</h4>
                <p>Transparência total para a comunidade:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Registro público de todas as contribuições</li>
                  <li>Histórico completo de devoluções e reembolsos</li>
                  <li>Acompanhamento em tempo real do progresso</li>
                  <li>Relatórios financeiros acessíveis a todos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Security */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl text-raiz-gold flex items-center gap-2">
                <Server className="w-8 h-8" />
                Infraestrutura Segura
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔒 Criptografia Avançada:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Certificados SSL/TLS de última geração</li>
                  <li>Criptografia AES-256 para dados armazenados</li>
                  <li>Senhas protegidas com hash bcrypt</li>
                  <li>Chaves de API criptografadas e rotacionadas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🏢 Servidores Certificados:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Hospedagem em data centers certificados ISO 27001</li>
                  <li>Redundância geográfica para alta disponibilidade</li>
                  <li>Firewall de aplicação web (WAF) ativo</li>
                  <li>Proteção DDoS empresarial</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">⚡ Monitoramento 24/7:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Equipe de segurança especializada</li>
                  <li>Alertas automáticos para atividades suspeitas</li>
                  <li>Logs detalhados de todas as operações</li>
                  <li>Backups automáticos e criptografados a cada hora</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Security */}
          <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl text-raiz-gold flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                Segurança do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="text-raiz-light/80 space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🔐 Autenticação Reforçada:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Autenticação em duas etapas (2FA) disponível</li>
                  <li>Senhas com critérios de segurança rigorosos</li>
                  <li>Sessões criptografadas com timeout automático</li>
                  <li>Notificações de login em novos dispositivos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-raiz-light mb-2">🛡️ Proteção de Conta:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Bloqueio automático após tentativas de login suspeitas</li>
                  <li>Verificação de e-mail para ações sensíveis</li>
                  <li>Histórico completo de atividades da conta</li>
                  <li>Opção de logout remoto de todos os dispositivos</li>
                </ul>
              </div>

              <div className="bg-raiz-accent/10 p-4 rounded-lg">
                <h4 className="font-semibold text-raiz-light mb-2">💡 Dicas de Segurança:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Use senhas únicas e complexas</li>
                  <li>Ative a autenticação em duas etapas</li>
                  <li>Mantenha seu e-mail seguro</li>
                  <li>Nunca compartilhe suas credenciais</li>
                  <li>Acesse sempre através do site oficial</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Mission Statement */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Nossa Missão
          </h2>
          <p className="text-xl text-raiz-light/80 mb-8">
            Unir impacto social e inovação digital, sempre com <strong>confiança em primeiro lugar</strong>. 
            Sua segurança é a base de toda nossa operação.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-raiz-gold hover:bg-raiz-gold/90 text-raiz-primary font-semibold px-8">
              Reportar Problema de Segurança
            </Button>
            <Link to="/privacy">
              <Button variant="outline" size="lg" className="text-raiz-light border-raiz-light hover:bg-raiz-light hover:text-raiz-primary px-8">
                Política de Privacidade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;