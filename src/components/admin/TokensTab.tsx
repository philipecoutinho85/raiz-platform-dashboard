
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Users, FolderOpen } from 'lucide-react';

interface TokensTabProps {
  stats: {
    totalTokens: number;
  };
}

const TokensTab = ({ stats }: TokensTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Tokens</CardTitle>
        <CardDescription>Monitore e gerencie a economia de tokens da plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-raiz-dark">Estatísticas de Tokens</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-raiz-accent/10 rounded-lg">
                <span>Tokens em Circulação</span>
                <span className="font-semibold">{stats.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-raiz-gold/10 rounded-lg">
                <span>Tokens Vendidos (Mês)</span>
                <span className="font-semibold">15.430</span>
              </div>
              <div className="flex justify-between p-3 bg-raiz-primary/10 rounded-lg">
                <span>Tokens Gastos (Mês)</span>
                <span className="font-semibold">8.920</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-raiz-dark">Ações Administrativas</h4>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Coins className="w-4 h-4 mr-2" />
                Ajustar Preços dos Tokens
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Conceder Tokens Promocionais
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="w-4 h-4 mr-2" />
                Relatório de Transações
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokensTab;
