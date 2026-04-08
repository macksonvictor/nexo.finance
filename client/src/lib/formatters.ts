// NEXO – Vault Architecture Design System
// Formatting utilities for financial data

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatMonthYear(monthId: string): string {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMonthShort(monthId: string): string {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Retorna todos os meses de janeiro de 2024 até dezembro do ano atual.
 * Sempre atualizado: se o ano mudar, automaticamente inclui o novo ano.
 * Ordena do mais recente para o mais antigo.
 */
export function getMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  const startYear = 2024;
  const endYear = now.getFullYear();

  for (let year = endYear; year >= startYear; year--) {
    // Para o ano atual: vai até dezembro (todos os meses do ano)
    // Para anos anteriores: todos os 12 meses
    const endMonth = 12; // sempre mostra até dezembro
    const startMonth = 1;

    for (let month = endMonth; month >= startMonth; month--) {
      const value = `${year}-${String(month).padStart(2, '0')}`;
      options.push({
        value,
        label: formatMonthYear(value),
      });
    }
  }

  return options;
}
