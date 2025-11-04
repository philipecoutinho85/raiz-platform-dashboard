import { Shield, Lock, Eye, Share2, FileText, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

const PrivacyCreators = () => {
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
            Para Criadores de Projetos
          </p>
          <p className="text-raiz-secondary mt-4 max-w-2xl mx-auto">
            A Raiz Token tem o compromisso de proteger a privacidade e os dados pessoais de todos os criadores que submetem projetos na plataforma.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Finalidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-raiz-primary" />
                Finalidade da coleta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-3">Ao cadastrar um projeto, o criador fornece informações que permitem:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Verificar identidade e legitimidade do responsável</li>
                <li>Analisar a viabilidade e credibilidade do projeto</li>
                <li>Processar repasses financeiros com segurança</li>
                <li>Cumprir obrigações legais e de auditoria</li>
              </ul>
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
                <h4 className="font-semibold text-raiz-dark mb-2">Dados pessoais obrigatórios:</h4>
                <p className="text-raiz-secondary">Nome completo, CPF, data de nascimento, e-mail e telefone celular.</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados de endereço:</h4>
                <p className="text-raiz-secondary">CEP, logradouro, número, complemento, bairro, cidade e estado (com preenchimento automático via CEP).</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados financeiros:</h4>
                <p className="text-raiz-secondary">Informações bancárias (conta e agência) apenas para repasse dos valores arrecadados.</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Dados de projeto:</h4>
                <p className="text-raiz-secondary">Título, descrição, metas, imagens, vídeos e informações públicas exibidas na plataforma.</p>
              </div>
              <div>
                <h4 className="font-semibold text-raiz-dark mb-2">Comprovantes e evidências:</h4>
                <p className="text-raiz-secondary">Documentos e fotos de resultados, quando aplicável, para validação de impacto e prestação de contas.</p>
              </div>
            </CardContent>
          </Card>

          {/* Uso e Tratamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-raiz-primary" />
                Uso e tratamento das informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-3">Os dados coletados são utilizados para:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Avaliar e aprovar projetos pela curadoria</li>
                <li>Exibir informações públicas sobre o projeto</li>
                <li>Processar pagamentos e repasses aos criadores</li>
                <li>Emitir relatórios e auditorias de impacto</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Enviar comunicações sobre status, badges e resultados</li>
              </ul>
              <p className="text-raiz-secondary mt-4 font-semibold">
                A Raiz Token não comercializa dados pessoais e mantém todas as informações sob confidencialidade e controle interno.
              </p>
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
                Os dados são armazenados em servidores seguros, com criptografia e controles de acesso.
              </p>
              <p className="text-raiz-secondary">
                Apenas colaboradores autorizados podem acessar informações sensíveis, mediante registro de auditoria.
              </p>
            </CardContent>
          </Card>

          {/* Direitos LGPD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-raiz-primary" />
                Direitos do criador (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-raiz-secondary">O criador pode solicitar, a qualquer momento:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Acesso aos dados armazenados</li>
                <li>Correção de informações</li>
                <li>Exclusão de dados pessoais (salvo obrigações legais em vigor)</li>
                <li>Esclarecimento sobre o tratamento de dados</li>
              </ul>
              <p className="text-raiz-secondary">
                Pedidos devem ser enviados para: <a href="mailto:contato@raiztoken.com.br" className="text-raiz-primary hover:underline">contato@raiztoken.com.br</a>
              </p>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-raiz-primary" />
                Compartilhamento de dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-3">O compartilhamento ocorre apenas quando necessário:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Com parceiros de pagamento e bancos para repasses em reais</li>
                <li>Com serviços de hospedagem e segurança (para funcionamento da plataforma)</li>
                <li>Com autoridades legais, mediante solicitação formal</li>
              </ul>
            </CardContent>
          </Card>

          {/* Retenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-raiz-primary" />
                Retenção e exclusão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-raiz-secondary mb-3">Os dados do criador e do projeto são mantidos pelo tempo necessário para:</p>
              <ul className="space-y-2 text-raiz-secondary list-disc pl-5">
                <li>Garantir a rastreabilidade e transparência dos repasses</li>
                <li>Cumprir obrigações legais e fiscais</li>
                <li>Assegurar histórico de impacto e relatórios públicos</li>
              </ul>
              <p className="text-raiz-secondary mt-4">
                Após esse período, os dados são anonimizados ou excluídos de forma segura.
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
                Esta Política poderá ser revisada periodicamente.
              </p>
              <p className="text-raiz-secondary">
                A versão atualizada será publicada no site, com data de vigência indicada.
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
                Para dúvidas ou solicitações relacionadas à privacidade:
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
              <Link to="/privacidade-apoiadores">Política para Apoiadores</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyCreators;
