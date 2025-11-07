
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, DollarSign, Users } from 'lucide-react';
import TransactionsTab from './TransactionsTab';

interface TokensTabProps {
  stats: {
    totalTokens: number;
  };
}

const TokensTab = ({ stats }: TokensTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Tokens</CardTitle>
          <CardDescription>Visão geral da economia de tokens da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-raiz-accent/10 rounded-lg">
              <Coins className="w-10 h-10 text-raiz-primary" />
              <div>
                <p className="text-sm text-raiz-secondary">Tokens em Circulação</p>
                <p className="text-2xl font-bold text-raiz-dark">{stats.totalTokens.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-raiz-gold/10 rounded-lg">
              <TrendingUp className="w-10 h-10 text-raiz-gold" />
              <div>
                <p className="text-sm text-raiz-secondary">Valor Total (R$)</p>
                <p className="text-2xl font-bold text-raiz-dark">R$ {(stats.totalTokens * 0.10).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-raiz-primary/10 rounded-lg">
              <Users className="w-10 h-10 text-raiz-primary" />
              <div>
                <p className="text-sm text-raiz-secondary">Usuários com Tokens</p>
                <p className="text-2xl font-bold text-raiz-dark">-</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TransactionsTab />
    </div>
  );
};

export default TokensTab;
