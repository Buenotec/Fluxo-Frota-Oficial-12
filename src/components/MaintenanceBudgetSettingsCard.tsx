import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  DollarSign, 
  Check, 
  Sparkles, 
  TrendingUp, 
  Scale, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RotateCcw,
  Calendar,
  Layers,
  Sliders,
  Copy,
  Trash2,
  Calculator,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MONTH_NAMES_FULL, formatBRL, normalizeMonthKey } from '../utils/maintenanceBudgetUtils';

interface MaintenanceBudgetSettingsCardProps {
  currentBudget: number;
  monthlyBudgets?: Record<string, number>;
  totalRealizado: number;
  availableYears?: string[];
  onSaveBudget: (newBudget: number) => void;
  onSaveMonthlyBudgets?: (newMap: Record<string, number>) => void;
  onOpenMaintenanceTab?: () => void;
  appTheme?: 'light' | 'dark-neon';
}

export const MaintenanceBudgetSettingsCard: React.FC<MaintenanceBudgetSettingsCardProps> = ({
  currentBudget,
  monthlyBudgets = {},
  totalRealizado,
  availableYears = ['2026', '2025', '2027'],
  onSaveBudget,
  onSaveMonthlyBudgets,
  onOpenMaintenanceTab,
  appTheme = 'light'
}) => {
  const isDark = appTheme === 'dark-neon';
  // Base Monthly Budget State (padrão R$ 120 mil)
  const isBudgetValid = (b: number | undefined): b is number => typeof b === 'number' && b > 0 && b !== 750000 && b !== 752000 && b < 500000;
  const [baseValue, setBaseValue] = useState<string>(isBudgetValid(currentBudget) ? currentBudget.toString() : '120000');
  
  // Selected Year for Month Overrides
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || '2026');

  // Month-by-month overrides local copy (ignoring legacy test values)
  const [localMonthlyBudgets, setLocalMonthlyBudgets] = useState<Record<string, number>>(() => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(monthlyBudgets || {})) {
      if (typeof v === 'number' && v > 0 && v !== 752000 && v !== 750000 && v < 500000) clean[k] = v;
    }
    return clean;
  });

  // Success Feedback
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Rateio Simulator selection state
  const [simulatedMonths, setSimulatedMonths] = useState<string[]>(['Janeiro', 'Fevereiro']);

  useEffect(() => {
    setBaseValue(isBudgetValid(currentBudget) ? currentBudget.toString() : '120000');
  }, [currentBudget]);

  useEffect(() => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(monthlyBudgets || {})) {
      if (typeof v === 'number' && v > 0 && v !== 752000 && v !== 750000 && v < 500000) clean[k] = v;
    }
    setLocalMonthlyBudgets(clean);
  }, [monthlyBudgets]);

  const numBase = parseFloat(baseValue.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

  // Helper to get budget for a month in local state
  const getMonthVal = (m: string, yr: string = selectedYear): { value: number; isCustom: boolean; key: string } => {
    const key = `${yr}-${m}`;
    if (localMonthlyBudgets[key] !== undefined && localMonthlyBudgets[key] > 0) {
      return { value: localMonthlyBudgets[key], isCustom: true, key };
    }
    if (localMonthlyBudgets[m] !== undefined && localMonthlyBudgets[m] > 0) {
      return { value: localMonthlyBudgets[m], isCustom: true, key: m };
    }
    return { value: numBase, isCustom: false, key };
  };

  const handleMonthInputChange = (month: string, valStr: string) => {
    const key = `${selectedYear}-${month}`;
    const parsed = parseFloat(valStr.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    setLocalMonthlyBudgets(prev => {
      const next = { ...prev };
      if (!isNaN(parsed) && parsed > 0) {
        next[key] = parsed;
      } else {
        delete next[key];
        delete next[month];
      }
      return next;
    });
  };

  const handleResetMonthToBase = (month: string) => {
    const key = `${selectedYear}-${month}`;
    setLocalMonthlyBudgets(prev => {
      const next = { ...prev };
      delete next[key];
      delete next[month];
      return next;
    });
  };

  const handleCopyBaseToAllMonths = () => {
    setLocalMonthlyBudgets(prev => {
      const next = { ...prev };
      MONTH_NAMES_FULL.forEach(m => {
        next[`${selectedYear}-${m}`] = numBase;
      });
      return next;
    });
    showFeedback(`Valor base (${formatBRL(numBase)}) copiado para todos os 12 meses de ${selectedYear}!`);
  };

  const handleClearYearCustom = () => {
    setLocalMonthlyBudgets(prev => {
      const next = { ...prev };
      MONTH_NAMES_FULL.forEach(m => {
        delete next[`${selectedYear}-${m}`];
        delete next[m];
      });
      return next;
    });
    showFeedback(`Personalizações de ${selectedYear} removidas. Todos os meses estão na base padrão.`);
  };

  const handleAdjustAllPercentage = (pct: number) => {
    setLocalMonthlyBudgets(prev => {
      const next = { ...prev };
      MONTH_NAMES_FULL.forEach(m => {
        const cur = getMonthVal(m).value;
        const adjusted = Math.round(cur * (1 + pct / 100));
        next[`${selectedYear}-${m}`] = adjusted;
      });
      return next;
    });
    showFeedback(`Todos os meses de ${selectedYear} ajustados em ${pct > 0 ? `+${pct}%` : `${pct}%`}!`);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setFeedbackMessage('');
    }, 3000);
  };

  const handleSaveAll = () => {
    if (numBase >= 0) {
      onSaveBudget(numBase);
      if (onSaveMonthlyBudgets) {
        onSaveMonthlyBudgets(localMonthlyBudgets);
      }
      showFeedback('Configuração de orçamento mensal e rateios salva com sucesso!');
    }
  };

  // Simulator Calculation
  const simulationResult = useMemo(() => {
    let simTotalOrcado = 0;
    const items = simulatedMonths.map(m => {
      const { value, isCustom } = getMonthVal(m, selectedYear);
      simTotalOrcado += value;
      return { month: m, value, isCustom };
    });
    return {
      totalOrcado: simTotalOrcado,
      monthsCount: simulatedMonths.length,
      average: simulatedMonths.length > 0 ? simTotalOrcado / simulatedMonths.length : 0,
      items
    };
  }, [simulatedMonths, localMonthlyBudgets, numBase, selectedYear]);

  const toggleSimulatedMonth = (m: string) => {
    setSimulatedMonths(prev => {
      if (prev.includes(m)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(x => x !== m);
      } else {
        return [...prev, m];
      }
    });
  };

  return (
    <div className={cn(
      "p-6 sm:p-8 rounded-3xl border shadow-sm relative overflow-hidden space-y-8 transition-all",
      isDark ? "bg-slate-900/95 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
    )}>
      {/* Decorative ambient accent */}
      <div className={cn(
        "absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none",
        isDark ? "bg-cyan-500/10" : "bg-cyan-500/5"
      )} />

      {/* Header */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b",
        isDark ? "border-slate-800" : "border-slate-100"
      )}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/20">
            <Target size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                Orçamento de Manutenção da Frota & Rateio por Mês
              </h3>
              <span className={cn(
                "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                isDark ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-cyan-50 text-cyan-700 border-cyan-200"
              )}>
                Meta Mensal & Rateio Multi-Mês
              </span>
            </div>
            <p className={cn("text-xs sm:text-sm mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              Defina o valor base mensal e configure valores específicos para cada mês quando necessário. Quando múltiplos meses forem selecionados no painel, o rateio proporcional é calculado automaticamente.
            </p>
          </div>
        </div>

        {onOpenMaintenanceTab && (
          <button
            type="button"
            onClick={onOpenMaintenanceTab}
            className={cn(
              "self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer",
              isDark 
                ? "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700" 
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
          >
            <span>Ver no Radar Neon</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Success Notification Bar */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm",
              isDark 
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" 
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}
          >
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            <span>{feedbackMessage || 'Configurações de orçamento salvas com sucesso!'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEÇÃO 1: VALOR BASE PADRÃO MENSAL */}
      <div className={cn(
        "p-6 rounded-2xl border space-y-5 transition-all",
        isDark 
          ? "bg-slate-950/70 border-slate-800" 
          : "bg-gradient-to-br from-slate-50 to-indigo-50/40 border-slate-200/80"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <DollarSign size={18} />
            </div>
            <div>
              <h4 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>
                1. Valor Base Padrão (Mensal)
              </h4>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                Valor orçado padrão aplicado a cada mês que não possuir orçamento customizado individual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBaseValue('500000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              R$ 500k
            </button>
            <button
              type="button"
              onClick={() => setBaseValue('120000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                baseValue === '120000'
                  ? (isDark ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" : "bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold")
                  : (isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")
              )}
            >
              R$ 120k (Padrão)
            </button>
            <button
              type="button"
              onClick={() => setBaseValue('200000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              R$ 200k
            </button>
            <button
              type="button"
              onClick={() => setBaseValue('500000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              R$ 500k
            </button>
            <button
              type="button"
              onClick={() => setBaseValue('750000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              R$ 750k
            </button>
            <button
              type="button"
              onClick={() => setBaseValue('1000000')}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors",
                isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              R$ 1M
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-8 relative">
            <span className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              R$
            </span>
            <input
              type="number"
              step="1000"
              min="0"
              value={baseValue}
              onChange={(e) => setBaseValue(e.target.value)}
              placeholder="120000"
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold border focus:outline-none focus:ring-2 shadow-inner transition-all",
                isDark 
                  ? "bg-slate-900 border-slate-700 text-white focus:ring-cyan-500" 
                  : "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500"
              )}
            />
          </div>

          <div className="sm:col-span-4">
            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              <span>Salvar Orçamento Base</span>
            </button>
          </div>
        </div>

        <div className={cn("text-xs flex items-center gap-2 flex-wrap", isDark ? "text-slate-400" : "text-slate-500")}>
          <Info size={14} className={isDark ? "text-cyan-400" : "text-indigo-500"} />
          <span>
            Exemplo de rateio: se 2 meses forem selecionados, o teto somado será de{' '}
            <strong className={isDark ? "text-cyan-300 font-bold" : "text-indigo-700 font-bold"}>
              {formatBRL(numBase * 2)}
            </strong>.
          </span>
        </div>
      </div>

      {/* SEÇÃO 2: ORÇAMENTO ESPECÍFICO POR MÊS (QUANDO NECESSÁRIO) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600 text-white">
              <Calendar size={18} />
            </div>
            <div>
              <h4 className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                <span>2. Orçamento Específico por Mês (Personalizado)</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  isDark ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-cyan-50 text-cyan-700 border-cyan-200"
                )}>
                  Opcional
                </span>
              </h4>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                Defina valores customizados para meses com sazonalidade, paradas programadas ou revisões extraordinárias
              </p>
            </div>
          </div>

          {/* Year Selector Tabs */}
          <div className={cn(
            "flex items-center gap-1.5 p-1 rounded-xl self-start md:self-auto border",
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          )}>
            {availableYears.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  selectedYear === yr
                    ? (isDark ? "bg-cyan-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                    : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                )}
              >
                Ano {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Batch Actions Bar */}
        <div className={cn(
          "flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl border text-xs",
          isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200/70"
        )}>
          <span className={cn("font-bold flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-600")}>
            <Sliders size={14} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
            Ações em lote para {selectedYear}:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyBaseToAllMonths}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer",
                isDark 
                  ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
              title="Preenche todos os 12 meses com o valor base atual"
            >
              <Copy size={12} />
              Copiar Base ({formatBRL(numBase)}) p/ Todos
            </button>
            <button
              type="button"
              onClick={() => handleAdjustAllPercentage(5)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-colors cursor-pointer",
                isDark 
                  ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
            >
              +5% Geral
            </button>
            <button
              type="button"
              onClick={() => handleAdjustAllPercentage(-5)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-colors cursor-pointer",
                isDark 
                  ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
            >
              -5% Geral
            </button>
            <button
              type="button"
              onClick={handleClearYearCustom}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer",
                isDark 
                  ? "bg-rose-950/60 border-rose-800/70 hover:bg-rose-900/60 text-rose-300" 
                  : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700"
              )}
            >
              <RotateCcw size={12} />
              Restaurar Base em Todos
            </button>
          </div>
        </div>

        {/* 12-Months Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {MONTH_NAMES_FULL.map((month, idx) => {
            const { value: monthVal, isCustom, key } = getMonthVal(month, selectedYear);
            const diffWithBase = monthVal - numBase;
            const monthNumber = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={month}
                className={cn(
                  "p-4 rounded-2xl border transition-all space-y-3 relative group",
                  isCustom
                    ? (isDark 
                        ? "bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-sm" 
                        : "bg-cyan-50/40 border-cyan-300 ring-1 ring-cyan-200/50 shadow-sm")
                    : (isDark 
                        ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" 
                        : "bg-white border-slate-200 hover:border-slate-300")
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded",
                      isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}>
                      {monthNumber}
                    </span>
                    <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {month}
                    </span>
                  </div>

                  {isCustom ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-600 text-white shadow-xs">
                      Customizado
                    </span>
                  ) : (
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}>
                      Base Padrão
                    </span>
                  )}
                </div>

                {/* Input for this month */}
                <div className="relative">
                  <span className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs",
                    isDark ? "text-slate-400" : "text-slate-400"
                  )}>
                    R$
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={monthVal}
                    onChange={(e) => handleMonthInputChange(month, e.target.value)}
                    placeholder={numBase.toString()}
                    className={cn(
                      "w-full pl-9 pr-3 py-2 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 transition-all",
                      isCustom
                        ? (isDark 
                            ? "bg-slate-900 border-cyan-400 text-cyan-200 focus:ring-cyan-500 font-black" 
                            : "bg-white border-cyan-300 text-cyan-950 focus:ring-cyan-500 font-black")
                        : (isDark 
                            ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-500" 
                            : "bg-slate-50/70 border-slate-200 text-slate-700 focus:bg-white focus:ring-indigo-500")
                    )}
                  />
                </div>

                {/* Status / Quick Reset button */}
                <div className={cn(
                  "flex items-center justify-between text-[11px] pt-1 border-t",
                  isDark ? "border-slate-800" : "border-slate-100"
                )}>
                  {isCustom ? (
                    <>
                      <span className={cn(
                        "font-extrabold text-[10px]",
                        diffWithBase > 0 
                          ? (isDark ? "text-emerald-400" : "text-emerald-600") 
                          : (diffWithBase < 0 
                              ? (isDark ? "text-rose-400" : "text-rose-600") 
                              : (isDark ? "text-slate-400" : "text-slate-500"))
                      )}>
                        {diffWithBase > 0 ? `+${formatBRL(diffWithBase)}` : (diffWithBase < 0 ? formatBRL(diffWithBase) : 'Igual à base')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetMonthToBase(month)}
                        className={cn(
                          "text-[10px] font-bold transition-colors cursor-pointer",
                          isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-400 hover:text-rose-600"
                        )}
                        title="Usar valor base padrão neste mês"
                      >
                        Usar Base
                      </button>
                    </>
                  ) : (
                    <span className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>
                      Herda base ({formatBRL(numBase)})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: SIMULADOR DE RATEIO INTERATIVO */}
      <div className={cn(
        "p-6 rounded-2xl space-y-5 transition-all border",
        isDark ? "bg-slate-950/90 border-slate-800 text-white" : "bg-slate-900 border-slate-800 text-white"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Calculator size={18} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Simulador de Rateio Interativo</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Teste em Tempo Real
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Selecione os meses abaixo para ver exatamente como o valor orçado se acumula no painel de Manutenção
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Orçado Consolidado no Período ({simulationResult.monthsCount} Meses)
            </span>
            <span className="text-2xl font-black text-cyan-300">
              {formatBRL(simulationResult.totalOrcado)}
            </span>
          </div>
        </div>

        {/* 12-Month Selector Pills */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Clique para selecionar/desmarcar os meses a incluir no rateio:
          </span>
          <div className="flex flex-wrap gap-2">
            {MONTH_NAMES_FULL.map(m => {
              const isSelected = simulatedMonths.includes(m);
              const { value, isCustom } = getMonthVal(m, selectedYear);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleSimulatedMonth(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <span>{m.slice(0, 3)}.</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    ({formatBRL(value).replace(',00', '')})
                  </span>
                  {isSelected && <Check size={12} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Breakdown of simulated months */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span>Meses no Rateio ({simulationResult.monthsCount}):</span>
            <span className="font-bold text-slate-300">
              Média mensal no período: {formatBRL(simulationResult.average)}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {simulationResult.items.map(item => (
              <span
                key={item.month}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
              >
                <span className="font-bold text-white">{item.month}:</span>
                <span className="text-cyan-300 font-extrabold">{formatBRL(item.value)}</span>
                {item.isCustom && (
                  <span className="text-[9px] text-cyan-400 uppercase font-black">• Custom</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Global Save Button Footer */}
      <div className={cn(
        "pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        isDark ? "border-slate-800" : "border-slate-100"
      )}>
        <div className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
          As alterações entram em vigor imediatamente e persistem no armazenamento do sistema.
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={18} />
          <span>Salvar Todas as Configurações de Orçamento</span>
        </button>
      </div>
    </div>
  );
};

export default MaintenanceBudgetSettingsCard;
