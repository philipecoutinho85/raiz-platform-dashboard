import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyMetrics {
  totalMovement: number;
  totalMovementReais: number;
  platformRevenue: number;
  netProfit: number;
  projectsCreated: number;
  projectsCompleted: number;
  custodyBalance: number;
  refundsCount: number;
  refundsAmount: number;
  tokensInCirculation: number;
  totalPaidToCreators: number;
}

interface TokenMetrics {
  purchased: number;
  used: number;
  refunded: number;
  inactive: number;
}

interface WithdrawalMetrics {
  requested: number;
  approved: number;
  rejected: number;
  avgProcessingTime: number;
}

interface ProjectMetrics {
  completed: number;
  notFunded: number;
  cancelled: number;
  active: number;
}

interface CategoryMetrics {
  category: string;
  revenue: number;
  projectsCount: number;
  successRate: number;
  totalRaised: number;
}

interface YearlyMetrics {
  year: number;
  totalRaised: number;
  platformRevenue: number;
  refunds: number;
  newUsers: number;
  projectsCreated: number;
  projectsCompleted: number;
  growthRate: number;
}

interface FinancialReportData {
  period: {
    month?: number;
    year: number;
    startDate?: string;
    endDate?: string;
  };
  monthlyMetrics: MonthlyMetrics;
  tokenMetrics: TokenMetrics;
  withdrawalMetrics: WithdrawalMetrics;
  projectMetrics: ProjectMetrics;
  categoryMetrics: CategoryMetrics[];
  yearlyMetrics: YearlyMetrics[];
  purchases?: Array<{
    id: string;
    user_id: string;
    amount: number;
    price: number;
    status: string;
    created_at: string;
  }>;
  withdrawals?: Array<{
    id: string;
    user_id: string;
    requested_amount: number;
    net_amount: number;
    admin_fee: number;
    status: string;
    created_at: string;
  }>;
  refunds?: Array<{
    id: string;
    user_id: string;
    amount: number;
    reason: string;
    status: string;
    created_at: string;
  }>;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const getMonthName = (month: number): string => {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month - 1] || '';
};

export const generateFinancialReportPDF = (data: FinancialReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Primary green
  doc.text('Raiz Token', 14, currentY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório Financeiro', 14, currentY + 8);
  
  // Period
  const periodText = data.period.month 
    ? `${getMonthName(data.period.month)} de ${data.period.year}`
    : `Ano ${data.period.year}`;
  doc.text(periodText, 14, currentY + 14);
  
  // Generation date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - 14, currentY, { align: 'right' });
  
  currentY += 30;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 10;

  // Section: Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resumo do Período', 14, currentY);
  currentY += 10;

  const summaryData = [
    ['Total Movimentado', formatNumber(data.monthlyMetrics.totalMovement) + ' tokens', formatCurrency(data.monthlyMetrics.totalMovementReais)],
    ['Receita da Plataforma', '', formatCurrency(data.monthlyMetrics.platformRevenue)],
    ['Lucro Líquido', '', formatCurrency(data.monthlyMetrics.netProfit)],
    ['Projetos Criados', formatNumber(data.monthlyMetrics.projectsCreated), ''],
    ['Projetos Concluídos', formatNumber(data.monthlyMetrics.projectsCompleted), ''],
    ['Saldo em Custódia', '', formatCurrency(data.monthlyMetrics.custodyBalance)],
    ['Extornos', formatNumber(data.monthlyMetrics.refundsCount), formatCurrency(data.monthlyMetrics.refundsAmount)],
    ['Tokens em Circulação', formatNumber(data.monthlyMetrics.tokensInCirculation), ''],
    ['Total Pago a Criadores', '', formatCurrency(data.monthlyMetrics.totalPaidToCreators)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Métrica', 'Quantidade', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Section: Tokens
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Movimentação de Tokens', 14, currentY);
  currentY += 10;

  const tokenData = [
    ['Tokens Comprados', formatNumber(data.tokenMetrics.purchased)],
    ['Tokens Utilizados', formatNumber(data.tokenMetrics.used)],
    ['Tokens Devolvidos', formatNumber(data.tokenMetrics.refunded)],
    ['Tokens Inativos (90+ dias)', formatNumber(data.tokenMetrics.inactive)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Tipo', 'Quantidade']],
    body: tokenData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Section: Withdrawals
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resgates', 14, currentY);
  currentY += 10;

  const withdrawalData = [
    ['Solicitados', formatNumber(data.withdrawalMetrics.requested)],
    ['Aprovados', formatNumber(data.withdrawalMetrics.approved)],
    ['Rejeitados', formatNumber(data.withdrawalMetrics.rejected)],
    ['Tempo Médio de Análise', data.withdrawalMetrics.avgProcessingTime.toFixed(1) + ' dias'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Status', 'Quantidade']],
    body: withdrawalData,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Section: Projects
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Projetos', 14, currentY);
  currentY += 10;

  const projectData = [
    ['Concluídos (Meta Atingida)', formatNumber(data.projectMetrics.completed)],
    ['Não Financiados', formatNumber(data.projectMetrics.notFunded)],
    ['Cancelados', formatNumber(data.projectMetrics.cancelled)],
    ['Ativos', formatNumber(data.projectMetrics.active)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Status', 'Quantidade']],
    body: projectData,
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Section: Categories
  if (data.categoryMetrics.length > 0) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho por Categoria', 14, currentY);
    currentY += 10;

    const categoryData = data.categoryMetrics.map(c => [
      c.category,
      formatNumber(c.projectsCount),
      formatCurrency(c.totalRaised),
      formatCurrency(c.revenue),
      c.successRate.toFixed(1) + '%',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Categoria', 'Projetos', 'Arrecadado', 'Receita', 'Taxa Sucesso']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Section: Yearly Evolution
  if (data.yearlyMetrics.length > 0) {
    doc.addPage();
    currentY = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução Anual', 14, currentY);
    currentY += 10;

    const yearlyData = data.yearlyMetrics.map(y => [
      y.year.toString(),
      formatCurrency(y.totalRaised),
      formatCurrency(y.platformRevenue),
      formatCurrency(y.refunds),
      formatNumber(y.newUsers),
      formatNumber(y.projectsCreated),
      formatNumber(y.projectsCompleted),
      (y.growthRate > 0 ? '+' : '') + y.growthRate.toFixed(1) + '%',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Ano', 'Arrecadação', 'Receita', 'Extornos', 'Novos Usuários', 'Projetos Criados', 'Concluídos', 'Crescimento']],
      body: yearlyData,
      theme: 'striped',
      headStyles: { fillColor: [20, 184, 166], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        7: { halign: 'right' },
      },
    });
  }

  // Detailed Tables (if data provided)
  if (data.purchases && data.purchases.length > 0) {
    doc.addPage();
    currentY = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento de Compras', 14, currentY);
    currentY += 10;

    const purchaseData = data.purchases.slice(0, 50).map(p => [
      format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      p.user_id.slice(0, 8) + '...',
      formatNumber(p.amount),
      formatCurrency(p.price),
      p.status === 'paid' ? 'Pago' : p.status,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Usuário', 'Tokens', 'Valor', 'Status']],
      body: purchaseData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });
  }

  if (data.withdrawals && data.withdrawals.length > 0) {
    doc.addPage();
    currentY = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento de Resgates', 14, currentY);
    currentY += 10;

    const withdrawalDetailData = data.withdrawals.slice(0, 50).map(w => [
      format(new Date(w.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      w.user_id.slice(0, 8) + '...',
      formatCurrency(w.requested_amount),
      formatCurrency(w.admin_fee),
      formatCurrency(w.net_amount),
      w.status === 'approved' ? 'Aprovado' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Usuário', 'Solicitado', 'Taxa', 'Líquido', 'Status']],
      body: withdrawalDetailData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} | Raiz Token - Relatório Financeiro Confidencial`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = data.period.month 
    ? `raiz-token-financeiro-${getMonthName(data.period.month)}-${data.period.year}.pdf`
    : `raiz-token-financeiro-${data.period.year}.pdf`;
  
  doc.save(fileName);
};

export const generateCSVExport = (
  data: Array<Record<string, unknown>>,
  filename: string
): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
