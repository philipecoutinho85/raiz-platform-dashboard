import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedFinancialData, FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InactiveTokensViewProps {
  filters: FinancialFilters;
}

export const InactiveTokensView = ({ filters }: InactiveTokensViewProps) => {
  const { inactiveTokens, tokenMetrics } = useAdvancedFinancialData(filters);

  const formatNumber = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const totalInactive = inactiveTokens.reduce((sum, t) => sum + t.balance, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><span className="text-sm text-muted-foreground">Total Tokens Inativos</span></div>
            <p className="text-3xl font-bold text-amber-600">{formatNumber(totalInactive)}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(totalInactive)}</p>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Usuários com Tokens Parados</span></div><p className="text-3xl font-bold">{inactiveTokens.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 mb-2"><Clock className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Média de Inatividade</span></div><p className="text-3xl font-bold">{inactiveTokens.length > 0 ? Math.round(inactiveTokens.reduce((s, t) => s + t.daysInactive, 0) / inactiveTokens.length) : 0} dias</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Usuários com Tokens Inativos (30+ dias)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Dias Inativo</TableHead><TableHead>Risco</TableHead></TableRow></TableHeader>
            <TableBody>
              {inactiveTokens.slice(0, 20).map((t) => (
                <TableRow key={t.userId}>
                  <TableCell className="font-medium">{t.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email}</TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(t.balance)}</TableCell>
                  <TableCell className="text-right">{t.daysInactive}</TableCell>
                  <TableCell><Badge variant={t.daysInactive > 90 ? 'destructive' : t.daysInactive > 60 ? 'secondary' : 'outline'}>{t.daysInactive > 90 ? 'Alto' : t.daysInactive > 60 ? 'Médio' : 'Baixo'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
