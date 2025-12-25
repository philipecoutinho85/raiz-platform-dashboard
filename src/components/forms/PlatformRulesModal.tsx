import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Info, 
  CreditCard, 
  Receipt, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  Coins,
  Clock
} from 'lucide-react';

interface PlatformRulesModalProps {
  trigger?: React.ReactNode;
}

export const CONSENT_VERSION = '1.0';
export const CONSENT_TEXT = `Declaro que li, entendi e estou ciente de todas as regras, taxas, prazos e do funcionamento do apoio por tokens da plataforma Raiz Token.`;

export const PlatformRulesModal = ({ trigger }: PlatformRulesModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="p-0 h-auto text-raiz-primary underline">
            Entenda as regras, taxas e prazos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Regras, Taxas e Prazos da Plataforma
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Apoio via Tokens */}
            <section>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Coins className="h-5 w-5 text-raiz-primary" />
                Apoio Exclusivamente por Tokens
              </h3>
              <p className="text-sm text-muted-foreground">
                O apoio aos projetos é realizado exclusivamente por meio de tokens. 
                Os métodos de pagamento (cartão e boleto) são utilizados apenas para a compra de tokens.
                <strong className="block mt-2">A opção de pagamento via PIX estará disponível em breve.</strong>
              </p>
            </section>

            {/* Prestação de Contas */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Prestação de Contas Obrigatória</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                Após o projeto atingir a meta ou ser encerrado, o autor deverá apresentar a prestação de 
                contas demonstrando como os recursos foram utilizados.
                <strong className="block mt-2">A criação de novos projetos ficará bloqueada até a aprovação da prestação de contas.</strong>
              </AlertDescription>
            </Alert>

            {/* Taxa da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Taxa Administrativa da Plataforma
              </h3>
              <p className="text-sm text-muted-foreground">
                A plataforma cobra uma taxa administrativa de <strong className="text-lg">10%</strong> sobre o valor 
                líquido (após taxas da operadora de pagamento). Esta taxa cobre custos operacionais, 
                suporte, infraestrutura e serviços da plataforma.
              </p>
            </section>

            {/* Taxas da Stripe */}
            <section>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5" />
                Taxas da Operadora de Pagamento (Stripe)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700">💳 Cartão Nacional</p>
                  <p className="text-gray-600">3,99% + R$ 0,39 por transação</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700">🌍 Cartão Internacional</p>
                  <p className="text-gray-600">3,99% + R$ 0,39 + 2% adicional</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700">📄 Boleto Bancário</p>
                  <p className="text-gray-600">R$ 3,45 por boleto pago</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-700">✅ Transferência para Criador</p>
                  <p className="text-green-600">Sem taxa adicional</p>
                </div>
              </div>
            </section>

            {/* Exemplo Prático */}
            <section>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Receipt className="h-5 w-5" />
                Exemplo Prático: Apoio de R$ 100,00
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cartão Nacional */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">💳 Via Cartão Nacional</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor do apoio:</span>
                      <span className="font-medium">R$ 100,00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>(-) Taxa Stripe:</span>
                      <span>- R$ 4,38</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>(-) Taxa Plataforma (10%):</span>
                      <span>- R$ 9,56</span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between font-bold text-green-700">
                      <span>Você recebe:</span>
                      <span>R$ 86,06</span>
                    </div>
                  </div>
                </div>

                {/* Boleto */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-medium text-purple-800 mb-2">📄 Via Boleto</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor do apoio:</span>
                      <span className="font-medium">R$ 100,00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>(-) Taxa Stripe:</span>
                      <span>- R$ 3,45</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>(-) Taxa Plataforma (10%):</span>
                      <span>- R$ 9,66</span>
                    </div>
                    <hr className="border-purple-200" />
                    <div className="flex justify-between font-bold text-green-700">
                      <span>Você recebe:</span>
                      <span>R$ 86,89</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Prazo de Recebimento */}
            <Alert className="border-emerald-300 bg-emerald-50">
              <Clock className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Prazo de Recebimento</AlertTitle>
              <AlertDescription className="text-emerald-700 text-sm">
                <strong>Após o encerramento do projeto e a aprovação da prestação de contas, 
                o valor líquido será repassado ao autor em até 30 dias corridos.</strong>
              </AlertDescription>
            </Alert>

            {/* Processo */}
            <section>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-green-600" />
                Como Funciona o Processo
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Período de carência:</strong> 30 dias após cada contribuição para garantir segurança contra estornos</li>
                <li><strong>Encerramento:</strong> Projeto encerra ao atingir a meta ou no prazo final</li>
                <li><strong>Prestação de contas:</strong> Obrigatória para liberação dos valores</li>
                <li><strong>Aprovação:</strong> Administração analisa e aprova a prestação de contas</li>
                <li><strong>Repasse:</strong> Até 30 dias corridos após aprovação da prestação de contas</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformRulesModal;
