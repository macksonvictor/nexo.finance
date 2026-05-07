export function formatCurrency(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
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

export function formatDate(dateString: string, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatMonthYear(monthId: string, locale = "pt-BR"): string {
  const [year, month] = monthId.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMonthShort(monthId: string): string {
  const [year, month] = monthId.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

export function getCurrentCalendarMonthId() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function compareMonthIds(a: string, b: string) {
  return a.localeCompare(b);
}

export function getEarliestMonthId(monthIds: string[], fallback?: string) {
  if (monthIds.length === 0) {
    return fallback ?? getCurrentCalendarMonthId();
  }

  return [...monthIds].sort(compareMonthIds)[0];
}

export function getMonthOptions(
  startMonthId = getCurrentCalendarMonthId(),
  endMonthId = getCurrentCalendarMonthId()
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const [startYear, startMonth] = startMonthId.split("-").map(Number);
  const [endYear, endMonth] = endMonthId.split("-").map(Number);

  let cursor = new Date(endYear, endMonth - 1, 1);
  const limit = new Date(startYear, startMonth - 1, 1);

  while (cursor >= limit) {
    const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    options.push({
      value,
      label: formatMonthYear(value),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }

  return options;
}
