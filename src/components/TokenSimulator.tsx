import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TokenSimulatorProps {
  onGoalChange?: (goal: number) => void;
}

const TokenSimulator = ({ onGoalChange }: TokenSimulatorProps) => {
  const [tokens, setTokens] = useState<string>('1000');
  const TOKEN_VALUE = 1; // 1 token = R$ 1,00
  const ADMIN_FEE = 0.10; // 10% taxa administrativa

  useEffect(() => {
    const numericTokens = parseInt(tokens) || 0;
    if (onGoalChange) {
      onGoalChange(numericTokens);
    }
  }, [tokens, onGoalChange]);

  const calculateValues = () => {
    const numericTokens = parseInt(tokens) || 0;
    const totalValue = numericTokens * TOKEN_VALUE;
    const adminFee = totalValue * ADMIN_FEE;
    const netValue = totalValue - adminFee;

    return {
      totalValue: totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      adminFee: adminFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      netValue: netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
  };

  const values = calculateValues();

  return (
    <Card className="bg-gradient-to-br from-raiz-gold/10 to-raiz-secondary/10 border-raiz-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-raiz-dark">
          <Calculator className="w-5 h-5 text-raiz-gold" />
          Simulador de Captação
        </CardTitle>
        <CardDescription>
          Calcule quanto você receberá após a taxa administrativa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token-amount" className="text-raiz-dark font-semibold">
            Quantidade de Tokens (Meta)
          </Label>
          <Input
            id="token-amount"
            type="number"
            min="1"
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            placeholder="Digite a quantidade de tokens"
            className="text-lg font-semibold"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-raiz-gold/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-raiz-dark/70">Valor Total Arrecadado:</span>
            <span className="text-lg font-bold text-raiz-dark">{values.totalValue}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm text-raiz-dark/70">Taxa Administrativa (10%):</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-raiz-secondary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Taxa cobrada pela plataforma para manutenção, suporte e custos operacionais
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-lg font-semibold text-red-600">- {values.adminFee}</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-raiz-gold/30">
            <span className="text-sm font-bold text-raiz-dark">Valor Líquido (Você Recebe):</span>
            <span className="text-2xl font-bold text-green-600">{values.netValue}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-raiz-light/50 rounded-lg">
          <p className="text-xs text-raiz-dark/60 text-center">
            💡 1 Token = R$ 1,00 • Taxa administrativa de 10% + taxa do sistema de pagamento aplicadas sobre o valor arrecadado
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenSimulator;
