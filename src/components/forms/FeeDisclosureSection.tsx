import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Info, 
  CreditCard, 
  Receipt, 
  Calculator, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface FeeDisclosureSectionProps {
  goal?: number;
  projectType?: 'seed' | 'regular';
}

export function FeeDisclosureSection({ goal = 10000, projectType = 'regular' }: FeeDisclosureSectionProps) {
  const platformFee = projectType === 'seed' ? 0 : 10; // %
  
  // Stripe fees
  const cardNationalFee = 3.99; // %
  const cardNationalFixed = 0.39; // R$
  const cardInternationalFee = 5.99; // % (3.99 + 2)
  const cardInternationalFixed = 0.39; // R$
  const boletoFee = 3.45; // R$ fixo por boleto pago

  // Calculate example for R$ 100 contribution
  const exampleAmount = 100;
  
  // Cartão Nacional
  const cardStripeTotal = (exampleAmount * cardNationalFee / 100) + cardNationalFixed;
  const cardAfterStripe = exampleAmount - cardStripeTotal;
  const cardPlatformFee = cardAfterStripe * (platformFee / 100);
  const cardNetCreator = cardAfterStripe - cardPlatformFee;
  
  // Boleto
  const boletoStripeTotal = boletoFee;
  const boletoAfterStripe = exampleAmount - boletoStripeTotal;
  const boletoPlatformFee = boletoAfterStripe * (platformFee / 100);
  const boletoNetCreator = boletoAfterStripe - boletoPlatformFee;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
          <Calculator className="h-5 w-5" />
          Entenda as Taxas e Valores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regra de Prestação de Contas */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Regra Importante</AlertTitle>
          <AlertDescription className="text-blue-700 text-sm">
            <strong>Prestação de Contas Obrigatória:</strong> Após seu projeto atingir a meta, 
            você deverá apresentar a prestação de contas mostrando como os recursos foram utilizados. 
            <strong> Você só poderá criar um novo projeto após a aprovação da prestação de contas</strong> pela administração.
          </AlertDescription>
        </Alert>

        {/* Taxa da Plataforma */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Taxa Administrativa da Plataforma
          </h4>
          <p className="text-sm text-amber-800">
            A plataforma cobra uma taxa de <strong className="text-lg">{platformFee}%</strong> sobre o valor 
            líquido (após taxas da operadora de pagamento). Esta taxa cobre os custos operacionais, 
            suporte, infraestrutura e serviços da plataforma.
            {projectType === 'seed' && (
              <span className="block mt-1 text-green-700">
                🌱 Como Projeto Semente, você tem isenção da taxa administrativa!
              </span>
            )}
          </p>
        </div>

        {/* Taxas da Stripe/Operadora */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4" />
            Taxas da Operadora de Pagamento (Stripe)
          </h4>
          
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
        </div>

        {/* Exemplo Prático */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4" />
            Exemplo: Apoio de {formatCurrency(exampleAmount)}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cartão Nacional */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800 mb-2">💳 Via Cartão Nacional</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor do apoio:</span>
                  <span className="font-medium">{formatCurrency(exampleAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>(-) Taxa Stripe:</span>
                  <span>- {formatCurrency(cardStripeTotal)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>(-) Taxa Plataforma ({platformFee}%):</span>
                  <span>- {formatCurrency(cardPlatformFee)}</span>
                </div>
                <hr className="border-blue-200" />
                <div className="flex justify-between font-bold text-green-700">
                  <span>Você recebe:</span>
                  <span>{formatCurrency(cardNetCreator)}</span>
                </div>
              </div>
            </div>

            {/* Boleto */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-medium text-purple-800 mb-2">📄 Via Boleto</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor do apoio:</span>
                  <span className="font-medium">{formatCurrency(exampleAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>(-) Taxa Stripe:</span>
                  <span>- {formatCurrency(boletoStripeTotal)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>(-) Taxa Plataforma ({platformFee}%):</span>
                  <span>- {formatCurrency(boletoPlatformFee)}</span>
                </div>
                <hr className="border-purple-200" />
                <div className="flex justify-between font-bold text-green-700">
                  <span>Você recebe:</span>
                  <span>{formatCurrency(boletoNetCreator)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prazo de Recebimento */}
        <Alert className="border-emerald-300 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Prazo de Recebimento</AlertTitle>
          <AlertDescription className="text-emerald-700 text-sm">
            <strong>Após o encerramento do projeto e a aprovação da prestação de contas, 
            o valor líquido será repassado ao autor em até 30 dias corridos.</strong>
          </AlertDescription>
        </Alert>

        {/* Importante */}
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Como funciona o processo</AlertTitle>
          <AlertDescription className="text-green-700 text-sm">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Período de carência:</strong> 30 dias após cada contribuição para garantir segurança contra estornos</li>
              <li><strong>Encerramento:</strong> Projeto encerra ao atingir a meta ou no prazo final</li>
              <li><strong>Prestação de contas:</strong> Obrigatória para liberação dos valores</li>
              <li><strong>Aprovação:</strong> Administração analisa e aprova a prestação de contas</li>
              <li><strong>Repasse:</strong> Até 30 dias corridos após aprovação da prestação de contas</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default FeeDisclosureSection;
