// NEXO – Vault Architecture Design System
// Export service for CSV and PDF generation

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORY_LABELS, type MonthData, type Transaction } from '@/types/finance';
import { formatCurrency, formatMonthYear, formatDate } from './formatters';

function getTransactionTypeLabel(type: Transaction['type']) {
  if (type === 'expense') return 'Despesa';
  if (type === 'income') return 'Receita';
  return 'Transferência';
}

export function exportToCSV(month: MonthData): void {
  const lines: string[] = [];
  const monthLabel = formatMonthYear(month.id);
  const totalAllocated = month.caixas.reduce((sum, caixa) => sum + caixa.allocated, 0);
  const totalSpent = month.caixas.reduce((sum, caixa) => sum + caixa.spent, 0);
  const allTransactions = month.caixas.flatMap((c) =>
    c.transactions.map((t) => ({
      ...t,
      caixaName: c.name,
    }))
  );

  // Header
  lines.push('Nexo Finance - Relatório do período selecionado');
  lines.push(`Período: ${monthLabel}`);
  lines.push(`Receita do período: ${formatCurrency(month.income)}`);
  lines.push(`Planejado nas caixas: ${formatCurrency(totalAllocated)}`);
  lines.push(`Registrado: ${formatCurrency(totalSpent)}`);
  lines.push(`Saldo para distribuir: ${formatCurrency(month.income - totalAllocated)}`);
  lines.push('');

  // Caixas summary
  lines.push('Distribuição das caixas');
  lines.push('Caixa,Planejado,Registrado,Disponível,Categoria');
  month.caixas.forEach((c) => {
    lines.push(
      `"${c.name}",${c.allocated.toFixed(2)},${c.spent.toFixed(2)},${(c.allocated - c.spent).toFixed(2)},"${CATEGORY_LABELS[c.category]}"`
    );
  });
  lines.push('');

  // Transactions
  lines.push('Movimentações do período');
  lines.push('Data,Caixa,Descrição,Valor,Tipo');
  if (allTransactions.length === 0) {
    lines.push('"Sem movimentações registradas neste período.",,,,');
  } else {
    allTransactions.forEach((t) => {
      lines.push(
        `${formatDate(t.date)},"${t.caixaName}","${t.description}",${t.amount.toFixed(2)},"${getTransactionTypeLabel(t.type)}"`
      );
    });
  }

  // Metas
  if (month.metas.length > 0) {
    lines.push('');
    lines.push('Metas do período');
    lines.push('Meta,Valor-alvo,Acumulado,Progresso');
    month.metas.forEach((m) => {
      const progress = m.targetAmount > 0 ? ((m.currentAmount / m.targetAmount) * 100).toFixed(1) : '0';
      lines.push(
        `"${m.name}",${m.targetAmount.toFixed(2)},${m.currentAmount.toFixed(2)},${progress}%`
      );
    });
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexo-relatorio-${month.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(month: MonthData): void {
  const doc = new jsPDF();
  const monthLabel = formatMonthYear(month.id);
  const totalAllocated = month.caixas.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = month.caixas.reduce((s, c) => s + c.spent, 0);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(13, 13, 13);
  doc.text('Nexo Finance', 20, 25);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório do período selecionado', 20, 32);

  // Month info
  doc.setFontSize(14);
  doc.setTextColor(13, 13, 13);
  doc.text(`Relatório: ${monthLabel}`, 20, 45);

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Receita do período: ${formatCurrency(month.income)}`, 20, 55);
  doc.text(`Planejado nas caixas: ${formatCurrency(totalAllocated)}`, 20, 62);
  doc.text(`Registrado: ${formatCurrency(totalSpent)}`, 20, 69);
  doc.text(`Saldo para distribuir: ${formatCurrency(month.income - totalAllocated)}`, 20, 76);

  // Caixas table
  doc.setFontSize(12);
  doc.setTextColor(13, 13, 13);
  doc.text('Distribuição das caixas', 20, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Caixa', 'Planejado', 'Registrado', 'Disponível', 'Categoria']],
    body: month.caixas.map((c) => [
      c.name,
      formatCurrency(c.allocated),
      formatCurrency(c.spent),
      formatCurrency(c.allocated - c.spent),
      CATEGORY_LABELS[c.category],
    ]),
    theme: 'grid',
    headStyles: { fillColor: [13, 13, 13], textColor: [245, 245, 245] },
    styles: { fontSize: 9 },
  });

  // Transactions
  const allTransactions = month.caixas.flatMap((c) =>
    c.transactions.map((t) => ({
      ...t,
      caixaName: c.name,
    }))
  );

  if (allTransactions.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(12);
    doc.text('Movimentações do período', 20, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Caixa', 'Descrição', 'Valor', 'Tipo']],
      body: allTransactions.map((t) => [
        formatDate(t.date),
        t.caixaName,
        t.description,
        formatCurrency(t.amount),
        getTransactionTypeLabel(t.type),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [13, 13, 13], textColor: [245, 245, 245] },
      styles: { fontSize: 8 },
    });
  } else {
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(12);
    doc.text('Movimentações do período', 20, finalY + 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Sem movimentações registradas neste período.', 20, finalY + 23);
  }

  // Metas
  if (month.metas.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text('Metas do período', 20, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Meta', 'Valor-alvo', 'Acumulado', 'Progresso', 'Prazo']],
      body: month.metas.map((m) => [
        m.name,
        formatCurrency(m.targetAmount),
        formatCurrency(m.currentAmount),
        `${m.targetAmount > 0 ? ((m.currentAmount / m.targetAmount) * 100).toFixed(1) : 0}%`,
        formatDate(m.deadline),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [13, 13, 13], textColor: [245, 245, 245] },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Nexo Finance – Página ${i} de ${pageCount}`, 20, 285);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 150, 285);
  }

  doc.save(`nexo-relatorio-${month.id}.pdf`);
}
