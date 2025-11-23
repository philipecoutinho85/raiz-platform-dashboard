
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, Users, TestTube, BadgeCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TransactionsTab from './TransactionsTab';

interface TokensTabProps {
  stats: {
    totalTokens: number;
  };
}

const TokensTab = ({ stats }: TokensTabProps) => {
  // Atualmente todos os tokens são de teste
  const realTokens = 0;
  const testTokens = stats.totalTokens;

  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <TestTube className="h-4 w-4 text-primary" />
        <AlertDescription>
          Atualmente todos os tokens na plataforma são <strong>tokens de teste</strong>. Nenhum token real foi emitido ainda.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens Reais */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              Tokens Reais
            </CardTitle>
            <CardDescription>Tokens em circulação real na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <Coins className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tokens em Circulação</p>
                  <p className="text-2xl font-bold">{realTokens.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <TrendingUp className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total (R$)</p>
                  <p className="text-2xl font-bold">R$ {(realTokens * 1.00).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <Users className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Usuários com Tokens</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens de Teste */}
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-accent" />
              Tokens de Teste
            </CardTitle>
            <CardDescription>Tokens para desenvolvimento e testes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <Coins className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Tokens em Circulação</p>
                  <p className="text-2xl font-bold">{testTokens.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <TrendingUp className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total (R$)</p>
                  <p className="text-2xl font-bold">R$ {(testTokens * 1.00).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-accent/10 rounded-lg">
                <Users className="w-10 h-10 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Usuários com Tokens</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionsTab />
    </div>
  );
};

export default TokensTab;
