import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportConversation, SupportMessage, SupportMetrics } from './SupportDashboard';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SupportExportProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
  metrics: SupportMetrics;
}

const SupportExport = ({ conversations, messages, metrics }: SupportExportProps) => {
  const [exporting, setExporting] = useState(false);

  const formatTime = (ms: number) => {
    if (ms === 0) return '-';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Create CSV content
      const headers = [
        'ID',
        'Assunto',
        'Status',
        'Data Criação',
        'Data Atualização',
        'Data Fechamento',
        'Nº Mensagens'
      ];

      const rows = conversations.map(conv => {
        const msgCount = messages.filter(m => m.conversation_id === conv.id).length;
        return [
          conv.id,
          `"${conv.subject.replace(/"/g, '""')}"`,
          conv.status === 'open' ? 'Aberto' : 'Fechado',
          format(new Date(conv.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          format(new Date(conv.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          conv.closed_at ? format(new Date(conv.closed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
          msgCount
        ];
      });

      // Add metrics section
      const metricsSection = [
        '',
        'MÉTRICAS DE SUPORTE',
        `Chamados Abertos,${metrics.totalOpen}`,
        `Chamados Em Andamento,${metrics.totalInProgress}`,
        `Chamados Respondidos,${metrics.totalResponded}`,
        `Chamados Encerrados,${metrics.totalClosed}`,
        `Tempo Médio 1ª Resposta,${formatTime(metrics.avgFirstResponseTime)}`,
        `Tempo Médio Resolução,${formatTime(metrics.avgResolutionTime)}`,
        `Resolução 1º Contato,${metrics.firstContactResolutionRate.toFixed(1)}%`,
        `SLA 1ª Resposta,${metrics.slaMetFirstResponse.toFixed(1)}%`,
        `SLA Resolução,${metrics.slaMetResolution.toFixed(1)}%`
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
        ...metricsSection
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-suporte-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('Relatório de Suporte - Raiz Token', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

      // Metrics Section
      doc.setFontSize(14);
      doc.text('Métricas Gerais', 14, 40);

      const metricsData = [
        ['Chamados Abertos', metrics.totalOpen.toString()],
        ['Chamados Em Andamento', metrics.totalInProgress.toString()],
        ['Chamados Respondidos', metrics.totalResponded.toString()],
        ['Chamados Encerrados', metrics.totalClosed.toString()],
        ['Tempo Médio 1ª Resposta', formatTime(metrics.avgFirstResponseTime)],
        ['Tempo Médio Resolução', formatTime(metrics.avgResolutionTime)],
        ['Resolução 1º Contato', `${metrics.firstContactResolutionRate.toFixed(1)}%`],
        ['SLA 1ª Resposta', `${metrics.slaMetFirstResponse.toFixed(1)}%`],
        ['SLA Resolução', `${metrics.slaMetResolution.toFixed(1)}%`]
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 87, 34] }
      });

      // Tickets table
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Lista de Chamados', 14, finalY);

      const ticketsData = conversations.slice(0, 50).map(conv => {
        const msgCount = messages.filter(m => m.conversation_id === conv.id).length;
        return [
          conv.subject.substring(0, 40) + (conv.subject.length > 40 ? '...' : ''),
          conv.status === 'open' ? 'Aberto' : 'Fechado',
          format(new Date(conv.created_at), 'dd/MM/yyyy', { locale: ptBR }),
          msgCount.toString()
        ];
      });

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Assunto', 'Status', 'Data', 'Msgs']],
        body: ticketsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 87, 34] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 }
        }
      });

      // Save
      doc.save(`relatorio-suporte-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SupportExport;
