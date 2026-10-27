export const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

export type MonthName = typeof MONTH_NAMES_FULL[number];

export const normalizeMonthKey = (m: any): string => {
  if (!m) return '';
  const s = String(m).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, '').trim();
  const monthMap: Record<string, string> = {
    'jan': 'Janeiro', 'janeiro': 'Janeiro', '1': 'Janeiro', '01': 'Janeiro',
    'fev': 'Fevereiro', 'fevereiro': 'Fevereiro', '2': 'Fevereiro', '02': 'Fevereiro',
    'mar': 'Março', 'marco': 'Março', 'março': 'Março', '3': 'Março', '03': 'Março',
    'abr': 'Abril', 'abril': 'Abril', '4': 'Abril', '04': 'Abril',
    'mai': 'Maio', 'maio': 'Maio', '5': 'Maio', '05': 'Maio',
    'jun': 'Junho', 'junho': 'Junho', '6': 'Junho', '06': 'Junho',
    'jul': 'Julho', 'julho': 'Julho', '7': 'Julho', '07': 'Julho',
    'ago': 'Agosto', 'agosto': 'Agosto', '8': 'Agosto', '08': 'Agosto',
    'set': 'Setembro', 'setembro': 'Setembro', '9': 'Setembro', '09': 'Setembro',
    'out': 'Outubro', 'outubro': 'Outubro', '10': 'Outubro',
    'nov': 'Novembro', 'novembro': 'Novembro', '11': 'Novembro',
    'dez': 'Dezembro', 'dezembro': 'Dezembro', '12': 'Dezembro'
  };
  return monthMap[s] || String(m).trim();
};

export const formatBRL = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export interface MonthBudgetBreakdown {
  month: string;
  year: string;
  key: string;
  orcado: number;
  realizado: number;
  estoque: number;
  avulso: number;
  diff: number;
  percentUsed: number;
  isCustom: boolean;
}

export interface PeriodBudgetCalculation {
  totalOrcado: number;
  totalRealizado: number;
  totalEstoque: number;
  totalAvulso: number;
  diff: number;
  percentUsed: number;
  isOverBudget: boolean;
  baseMonthlyBudget: number;
  monthsCount: number;
  activeMonths: string[];
  activeYears: string[];
  primaryYear: string;
  isRateioApplied: boolean;
  isExplicitFilter: boolean;
  breakdown: MonthBudgetBreakdown[];
}

export const DEFAULT_ACTIVE_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro'
] as const;

/**
 * Resolves the budgeted amount for a given month and year.
 * Checks year-specific override first, then generic month override, then fallback to baseMonthlyBudget.
 * Safely filters out legacy test values (like 752k or 750k) that caused distorted accumulated sums.
 */
export const getMonthBudget = (
  month: string,
  year: string = '2026',
  baseMonthlyBudget: number = 120000,
  monthlyBudgets: Record<string, number> = {}
): { value: number; isCustom: boolean; key: string } => {
  const normM = normalizeMonthKey(month);
  const yearKey = `${year}-${normM}`;

  const cleanVal = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
    if (isNaN(num) || num <= 0) return null;
    // Discard any residual legacy test values (e.g. 752k or 750k from old preset testing)
    if (num === 752000 || num === 750000 || num >= 500000) return null;
    return num;
  };

  const yearOverride = cleanVal(monthlyBudgets[yearKey]);
  if (yearOverride !== null) {
    return { value: yearOverride, isCustom: true, key: yearKey };
  }

  const monthOverride = cleanVal(monthlyBudgets[normM]);
  if (monthOverride !== null) {
    return { value: monthOverride, isCustom: true, key: normM };
  }

  return { value: baseMonthlyBudget, isCustom: false, key: yearKey };
};

/**
 * Calculates rateio and budget for the selected period across filtered data.
 */
export const calculatePeriodBudget = ({
  activeFilterMonths,
  activeFilterYears,
  allFilteredItems,
  baseMonthlyBudget = 120000,
  monthlyBudgets,
  defaultYear = '2026',
  availableMonths
}: {
  activeFilterMonths: string[];
  activeFilterYears: string[];
  allFilteredItems: any[];
  baseMonthlyBudget: number;
  monthlyBudgets: Record<string, number>;
  defaultYear?: string;
  availableMonths?: string[];
}): PeriodBudgetCalculation => {
  const primaryYear = activeFilterYears[0] || defaultYear;

  // Determine active months
  let effectiveMonths: string[] = [];
  let isExplicitFilter = false;

  if (activeFilterMonths && activeFilterMonths.length > 0) {
    effectiveMonths = Array.from(new Set(activeFilterMonths.map(normalizeMonthKey))).filter(Boolean);
    isExplicitFilter = true;
  } else if (allFilteredItems && allFilteredItems.length > 0) {
    const dataMonths = new Set<string>();
    allFilteredItems.forEach(item => {
      const mNorm = normalizeMonthKey(item.mes || item.nomeMes || item.mesAno);
      if (mNorm) dataMonths.add(mNorm);
    });
    if (dataMonths.size > 0) {
      effectiveMonths = Array.from(dataMonths).sort(
        (a, b) => MONTH_NAMES_FULL.indexOf(a as any) - MONTH_NAMES_FULL.indexOf(b as any)
      );
    }
  }

  // If still empty (e.g. no filter and no maintenance items), check availableMonths from system (e.g. 9 months in dataset)
  if (effectiveMonths.length === 0 && availableMonths && availableMonths.length > 0) {
    const availNorm = Array.from(new Set(availableMonths.map(normalizeMonthKey))).filter(Boolean);
    if (availNorm.length > 0) {
      effectiveMonths = availNorm.sort(
        (a, b) => MONTH_NAMES_FULL.indexOf(a as any) - MONTH_NAMES_FULL.indexOf(b as any)
      );
    }
  }

  // If still empty, default to the 9 active months of the period (Jan-Set) so that 120.000 x 9 = 1.080.000,00
  if (effectiveMonths.length === 0) {
    effectiveMonths = [...DEFAULT_ACTIVE_MONTHS];
  }

  let totalOrcado = 0;
  let totalRealizado = 0;
  let totalEstoque = 0;
  let totalAvulso = 0;

  const breakdown: MonthBudgetBreakdown[] = effectiveMonths.map(m => {
    const { value: monthOrcado, isCustom, key } = getMonthBudget(m, primaryYear, baseMonthlyBudget, monthlyBudgets);
    totalOrcado += monthOrcado;

    // Filter items matching this month
    const matchingItems = (allFilteredItems || []).filter(item => normalizeMonthKey(item.mes) === m);
    let mEstoque = 0;
    let mAvulso = 0;

    matchingItems.forEach(item => {
      const v = item.valor || 0;
      if (item.type === 'ESTOQUE') mEstoque += v;
      else mAvulso += v;
    });

    const mTotal = mEstoque + mAvulso;
    totalRealizado += mTotal;
    totalEstoque += mEstoque;
    totalAvulso += mAvulso;

    const mDiff = monthOrcado - mTotal;
    const mPercent = monthOrcado > 0 ? (mTotal / monthOrcado) * 100 : (mTotal > 0 ? 999 : 0);

    return {
      month: m,
      year: primaryYear,
      key,
      orcado: monthOrcado,
      realizado: mTotal,
      estoque: mEstoque,
      avulso: mAvulso,
      diff: mDiff,
      percentUsed: mPercent,
      isCustom
    };
  });

  // Fallback: If totalRealizado is 0 but there are filtered items, calculate totals directly from items
  if (totalRealizado === 0 && allFilteredItems && allFilteredItems.length > 0) {
    allFilteredItems.forEach(item => {
      const v = item.valor || 0;
      if (item.type === 'ESTOQUE') totalEstoque += v;
      else totalAvulso += v;
    });
    totalRealizado = totalEstoque + totalAvulso;
  }

  const diff = totalOrcado - totalRealizado;
  const percentUsed = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : (totalRealizado > 0 ? 999 : 0);

  return {
    totalOrcado,
    totalRealizado,
    totalEstoque,
    totalAvulso,
    diff,
    percentUsed,
    isOverBudget: diff < 0,
    baseMonthlyBudget,
    monthsCount: effectiveMonths.length,
    activeMonths: effectiveMonths,
    activeYears: activeFilterYears.length > 0 ? activeFilterYears : [primaryYear],
    primaryYear,
    isRateioApplied: effectiveMonths.length > 1,
    isExplicitFilter,
    breakdown
  };
};
