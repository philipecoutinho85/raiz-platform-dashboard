import { Shield, Lock, Eye, Share2, Cookie, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

const PrivacySupporters = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-raiz-light via-white to-raiz-light">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-raiz-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-raiz-primary" />
          </div>
          <h1 className="text-4xl font-bold text-raiz-dark mb-4">
            Política de Privacidade
          </h1>
          <p className="text-xl text-raiz-secondary">
            Para Apoiadores de Projetos
          </p>
          <p className="text-raiz-secondary mt-4 max-w-2xl mx-auto">
            A Raiz Token valoriza a transparência e o respeito à privacidade de todos que apoiam causas e projetos dentro da plataforma.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Quem Somos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-raiz-primary" />
                Quem somos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">
                A Raiz Token é uma plataforma digital que conecta pessoas e iniciativas de impacto socioambiental. Atuamos como intermediadora de arrecadações, permitindo que apoiadores contribuam com projetos reais, sempre em moeda nacional (reais – R$), de forma segura e transparente.
              </p>
              <p className="text-raiz-secondary">
                Não operamos com criptomoedas ou blockchain no momento, e todos os repasses são realizados através de sistemas tradicionais de pagamento.
              </p>
            </CardContent>
          </Card>

          {/* Dados Coletados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-raiz-primary" />
                Quais dados coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados cadastrais básicos:</h4>
                <p className="text-raiz-secondary">Nome, sobrenome, e-mail e telefone celular (no momento do cadastro).</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados complementares (opcionais ou por exigência de operação):</h4>
                <p className="text-raiz-secondary">CPF, endereço e data de nascimento — solicitados apenas se forem necessários para cumprir obrigações legais ou para emissão de recibos.</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados de pagamento:</h4>
                <p className="text-raiz-secondary">Informações de transações, valores apoiados, datas e comprovantes (nunca armazenamos dados completos de cartão de crédito).</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados técnicos:</h4>
                <p className="text-raiz-secondary">Endereço IP, navegador, sistema operacional e logs de acesso (para fins de segurança).</p>
              </div>
            </CardContent>
          </Card>

          {/* Como Usamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-raiz-primary" />
                Como usamos essas informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Confirmar e registrar sua contribuição</li>
                <li>Emitir comprovantes e recibos eletrônicos</li>
                <li>Comunicar o andamento do projeto apoiado</li>
                <li>Notificar sobre conquistas, badges ou relatórios de impacto</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Melhorar a experiência do usuário dentro da plataforma</li>
              </ul>
              <p className="text-raiz-secondary mt-4 font-semibold">
                A Raiz Token nunca vende ou compartilha dados pessoais com terceiros para fins comerciais.
              </p>
            </CardContent>
          </Card>

          {/* Bases Legais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-raiz-primary" />
                Bases legais de tratamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li><strong>Consentimento do titular</strong>, ao criar uma conta e apoiar um projeto</li>
                <li><strong>Cumprimento de obrigação legal</strong>, em casos de emissão de comprovantes e relatórios</li>
                <li><strong>Execução de contrato</strong>, para viabilizar o apoio e os repasses aos criadores</li>
              </ul>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-raiz-primary" />
                Armazenamento e segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">
                Os dados são armazenados em servidores seguros, com acesso restrito e controle de autenticação.
              </p>
              <p className="text-raiz-secondary">
                A plataforma adota medidas técnicas e administrativas para prevenir acesso não autorizado, perda ou uso indevido das informações.
              </p>
            </CardContent>
          </Card>

          {/* Direitos LGPD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-raiz-primary" />
                Direitos do apoiador (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">Você pode, a qualquer momento:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Solicitar acesso, atualização ou exclusão dos seus dados</li>
                <li>Retirar seu consentimento</li>
                <li>Solicitar portabilidade das informações</li>
              </ul>
              <p className="text-raiz-secondary">
                Para exercer seus direitos, envie um e-mail para: <a href="mailto:contato@raiztoken.com.br" className="text-raiz-primary hover:underline">contato@raiztoken.com.br</a>
              </p>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-raiz-primary" />
                Compartilhamento de informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-3">Os dados podem ser compartilhados apenas com:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Fornecedores de pagamento (gateways), para processar as transações em reais</li>
                <li>Órgãos públicos ou judiciais, mediante solicitação legal</li>
                <li>Equipe interna da Raiz Token, para fins de suporte, auditoria e compliance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-raiz-primary" />
                Uso de cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">
                Utilizamos cookies para melhorar a navegação, lembrar preferências e entender como o site é usado.
              </p>
              <p className="text-raiz-secondary">
                Você pode gerenciar as permissões diretamente em seu navegador.
              </p>
            </CardContent>
          </Card>

          {/* Alterações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-raiz-primary" />
                Alterações nesta política
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">
                A Raiz Token poderá atualizar esta Política de Privacidade a qualquer momento.
              </p>
              <p className="text-raiz-secondary">
                Quando isso ocorrer, a nova versão será publicada nesta mesma página, com data de revisão atualizada.
              </p>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="bg-gradient-to-r from-raiz-primary/5 to-raiz-secondary/5 border-raiz-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-raiz-primary" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-4">
                Dúvidas sobre privacidade ou tratamento de dados podem ser enviadas para:
              </p>
              <a 
                href="mailto:contato@raiztoken.com.br" 
                className="text-raiz-primary hover:underline font-semibold"
              >
                contato@raiztoken.com.br
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild variant="default">
              <Link to="/contato">Falar Conosco</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/privacidade-criadores">Política para Criadores</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacySupporters;
