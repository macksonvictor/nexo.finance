// NEXO – Vault Architecture Design System
// Export service for CSV and PDF generation

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonthData } from '@/types/finance';
import { formatCurrency, formatMonthYear, formatDate } from './formatters';

export function exportToCSV(month: MonthData): void {
  const lines: string[] = [];
  const monthLabel = formatMonthYear(month.id);

  // Header
  lines.push('NEXO - Relatório Financeiro');
  lines.push(`Mês: ${monthLabel}`);
  lines.push(`Receita: ${formatCurrency(month.income)}`);
  lines.push('');

  // Caixas summary
  lines.push('Caixa,Alocado,Gasto,Saldo,Categoria');
  month.caixas.forEach((c) => {
    lines.push(
      `"${c.name}",${c.allocated.toFixed(2)},${c.spent.toFixed(2)},${(c.allocated - c.spent).toFixed(2)},"${c.category}"`
    );
  });
  lines.push('');

  // Transactions
  lines.push('Data,Caixa,Descrição,Valor,Tipo');
  month.caixas.forEach((c) => {
    c.transactions.forEach((t) => {
      lines.push(
        `${formatDate(t.date)},"${c.name}","${t.description}",${t.amount.toFixed(2)},"${t.type}"`
      );
    });
  });

  // Metas
  if (month.metas.length > 0) {
    lines.push('');
    lines.push('Meta,Valor Alvo,Valor Atual,Progresso');
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
  doc.text('NEXO', 20, 25);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Sistema de Gestão Financeira Pessoal', 20, 32);

  // Month info
  doc.setFontSize(14);
  doc.setTextColor(13, 13, 13);
  doc.text(`Relatório: ${monthLabel}`, 20, 45);

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Receita: ${formatCurrency(month.income)}`, 20, 55);
  doc.text(`Total Alocado: ${formatCurrency(totalAllocated)}`, 20, 62);
  doc.text(`Total Gasto: ${formatCurrency(totalSpent)}`, 20, 69);
  doc.text(`Saldo Restante: ${formatCurrency(month.income - totalAllocated)}`, 20, 76);

  // Caixas table
  doc.setFontSize(12);
  doc.setTextColor(13, 13, 13);
  doc.text('Distribuição por Caixas', 20, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Caixa', 'Alocado', 'Gasto', 'Saldo', 'Categoria']],
    body: month.caixas.map((c) => [
      c.name,
      formatCurrency(c.allocated),
      formatCurrency(c.spent),
      formatCurrency(c.allocated - c.spent),
      c.category.charAt(0).toUpperCase() + c.category.slice(1),
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
    doc.text('Transações', 20, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Caixa', 'Descrição', 'Valor', 'Tipo']],
      body: allTransactions.map((t) => [
        formatDate(t.date),
        t.caixaName,
        t.description,
        formatCurrency(t.amount),
        t.type === 'expense' ? 'Despesa' : t.type === 'income' ? 'Receita' : 'Transferência',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [13, 13, 13], textColor: [245, 245, 245] },
      styles: { fontSize: 8 },
    });
  }

  // Metas
  if (month.metas.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text('Metas Financeiras', 20, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Meta', 'Valor Alvo', 'Valor Atual', 'Progresso', 'Prazo']],
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
    doc.text(`NEXO – Página ${i} de ${pageCount}`, 20, 285);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 150, 285);
  }

  doc.save(`nexo-relatorio-${month.id}.pdf`);
}
