import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { useFinancialData } from '@/hooks/useFinancialData';
import { PurchasesTable } from '../PurchasesTable';
import { WithdrawalsTable } from '../WithdrawalsTable';
import { RefundsTable } from '../RefundsTable';
import { Download, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinancialTablesProps {
  filters: FinancialFilters;
}

export const FinancialTables = ({ filters }: FinancialTablesProps) => {
  const { toast } = useToast();
  const { purchases, withdrawals, refunds, loading } = useFinancialData(filters.startDate, filters.endDate);

  const handleExport = (type: string, data: any[]) => {
    if (data.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há dados para exportar.', variant: 'destructive' });
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exportado!', description: `${type} exportado com sucesso.` });
  };

  return (
    <Card>
      <CardHeader><div className="flex items-center gap-2"><Table className="h-5 w-5 text-primary" /><CardTitle>Tabelas de Controle</CardTitle></div></CardHeader>
      <CardContent>
        <Tabs defaultValue="purchases">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchases">Compras ({purchases.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Resgates ({withdrawals.length})</TabsTrigger>
            <TabsTrigger value="refunds">Extornos ({refunds.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="purchases" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport('compras', purchases)}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button></div>
            <PurchasesTable purchases={purchases} />
          </TabsContent>
          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport('resgates', withdrawals)}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button></div>
            <WithdrawalsTable withdrawals={withdrawals} />
          </TabsContent>
          <TabsContent value="refunds" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport('extornos', refunds)}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button></div>
            <RefundsTable refunds={refunds} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
