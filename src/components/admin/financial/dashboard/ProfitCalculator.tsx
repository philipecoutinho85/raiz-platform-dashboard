import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, Minus, Equal } from 'lucide-react';

interface ProfitCalculatorProps {
  filters: FinancialFilters;
}

export const ProfitCalculator = ({ filters }: ProfitCalculatorProps) => {
  const { monthlyMetrics, yearlyMetrics, manualCosts, setManualCosts } = useAdvancedFinancialData(filters);
  const [localCosts, setLocalCosts] = useState(manualCosts.toString());

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const netProfit = monthlyMetrics.platformRevenue - parseFloat(localCosts || '0');
  const yearlyProfit = yearlyMetrics.reduce((sum, y) => sum + y.platformRevenue, 0);

  const handleCostsChange = (value: string) => {
    setLocalCosts(value);
    const numValue = parseFloat(value) || 0;
    setManualCosts(numValue);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /><CardTitle>Cálculo de Lucro</CardTitle></div></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-emerald-600" /><span className="text-sm text-muted-foreground">Receita do Período</span></div>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(monthlyMetrics.platformRevenue)}</p>
            </div>
            <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2"><Minus className="h-5 w-5 text-destructive" /><Label htmlFor="costs" className="text-sm text-muted-foreground">Custos (manual)</Label></div>
              <Input id="costs" type="number" value={localCosts} onChange={(e) => handleCostsChange(e.target.value)} className="text-2xl font-bold h-12" placeholder="0" />
            </div>
            <div className={`p-6 rounded-lg border ${netProfit >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <div className="flex items-center gap-2 mb-2"><Equal className="h-5 w-5" /><span className="text-sm text-muted-foreground">Lucro Líquido</span></div>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(netProfit)}</p>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h4 className="font-medium mb-2">Lucro Acumulado no Ano</h4>
            <p className="text-4xl font-bold text-primary">{formatCurrency(yearlyProfit)}</p>
            <p className="text-sm text-muted-foreground mt-1">Soma da receita dos últimos 3 anos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
