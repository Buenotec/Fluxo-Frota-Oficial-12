import React, { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  Settings, 
  Edit3, 
  X, 
  Check, 
  Layers, 
  Database, 
  FileText, 
  Scale, 
  ArrowRight,
  ShieldCheck,
  Percent,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sliders,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PeriodBudgetCalculation, formatBRL } from '../utils/maintenanceBudgetUtils';

interface MaintenanceBudgetComparisonNeonCardProps {
  totalRealizado: number;
  totalEstoque: number;
  totalAvulso: number;
  totalRegistros: number;
  orcado: number;
  periodBudget?: PeriodBudgetCalculation;
  monthlyBudgets?: Record<string, number>;
  onUpdateOrcado: (newValue: number) => void;
  onUpdateMonthBudget?: (monthKey: string, newValue: number) => void;
  onResetAllMonthBudgets?: () => void;
  onNavigateToSettings?: () => void;
  appTheme?: 'light' | 'dark-neon';
}

export const MaintenanceBudgetComparisonNeonCard: React.FC<MaintenanceBudgetComparisonNeonCardProps> = ({
  totalRealizado,
  totalEstoque,
  totalAvulso,
  totalRegistros,
  orcado,
  periodBudget,
  monthlyBudgets = {},
  onUpdateOrcado,
  onUpdateMonthBudget,
  onResetAllMonthBudgets,
  onNavigateToSettings,
  appTheme = 'light'
}) => {
  const isDark = appTheme === 'dark-neon';
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  
  // Quick Edit Modal State
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<'base' | 'month'>('base');
  const [editInputVal, setEditInputVal] = useState('');
  const [selectedEditMonthKey, setSelectedEditMonthKey] = useState<string>('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Expandable Rateio Breakdown Drawer
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

  const monthsCount = periodBudget?.monthsCount || 9;
  const isRateio = monthsCount > 1;
  const activeMonthsList = periodBudget?.activeMonths || ['Mês Atual'];
  const breakdownList = periodBudget?.breakdown || [];
  const baseMonthly = periodBudget?.baseMonthlyBudget || (orcado > 0 && orcado < 500000 && orcado !== 750000 && orcado !== 752000 ? orcado : 120000);
  const hasCustomOverrides = breakdownList.some(b => b.isCustom);

  // Determine effective values (padrão 120 mil/mês x meses do período)
  const effectiveOrcado = (periodBudget && periodBudget.totalOrcado > 0) 
    ? periodBudget.totalOrcado 
    : (baseMonthly * monthsCount);
  const effectiveRealizado = (periodBudget && periodBudget.totalRealizado > 0) 
    ? periodBudget.totalRealizado 
    : (totalRealizado || 0);
  const effectiveEstoque = (periodBudget && periodBudget.totalEstoque > 0) 
    ? periodBudget.totalEstoque 
    : (totalEstoque || 0);
  const effectiveAvulso = (periodBudget && periodBudget.totalAvulso > 0) 
    ? periodBudget.totalAvulso 
    : (totalAvulso || 0);

  const diff = effectiveOrcado - effectiveRealizado;
  const isOverBudget = diff < 0;
  const percentUsed = effectiveOrcado > 0 ? (effectiveRealizado / effectiveOrcado) * 100 : (effectiveRealizado > 0 ? 999 : 0);

  const pctEstoque = effectiveRealizado > 0 ? (effectiveEstoque / effectiveRealizado) * 100 : 0;
  const pctAvulso = effectiveRealizado > 0 ? (effectiveAvulso / effectiveRealizado) * 100 : 0;

  // 3D tilt tracking
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4.2;
    const rotateY = ((x - centerX) / centerX) * 4.2;

    setTilt({ x: rotateX, y: rotateY });
    setMousePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  const openQuickEdit = (e?: React.MouseEvent, defaultMonthKey?: string) => {
    if (e) e.stopPropagation();
    if (defaultMonthKey) {
      setEditTab('month');
      setSelectedEditMonthKey(defaultMonthKey);
      const cur = monthlyBudgets[defaultMonthKey] || baseMonthly;
      setEditInputVal(cur.toString());
    } else {
      setEditTab('base');
      setEditInputVal(baseMonthly.toString());
    }
    setIsQuickEditOpen(true);
  };

  const handleQuickSave = () => {
    const parsed = parseFloat(editInputVal.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      if (editTab === 'base') {
        onUpdateOrcado(parsed);
      } else if (editTab === 'month' && selectedEditMonthKey && onUpdateMonthBudget) {
        onUpdateMonthBudget(selectedEditMonthKey, parsed);
      }
      setIsSavedFeedback(true);
      setTimeout(() => {
        setIsSavedFeedback(false);
        setIsQuickEditOpen(false);
      }, 700);
    } else {
      setIsQuickEditOpen(false);
    }
  };

  // Dynamic Glow, Halo and Border accents based on status and theme
  const neonHaloColor = isOverBudget ? 'rgba(244, 63, 94, 0.45)' : 'rgba(6, 182, 212, 0.45)';
  const neonSecondaryColor = isOverBudget ? 'rgba(225, 29, 72, 0.25)' : 'rgba(99, 102, 241, 0.30)';

  const glowAccent = isDark
    ? (isOverBudget ? 'rgba(244, 63, 94, 0.42)' : 'rgba(6, 182, 212, 0.40)')
    : (isOverBudget ? 'rgba(244, 63, 94, 0.18)' : 'rgba(6, 182, 212, 0.18)');

  const borderAccent = isDark
    ? (isOverBudget ? 'rgba(244, 63, 94, 0.75)' : 'rgba(6, 182, 212, 0.70)')
    : (isOverBudget ? 'rgba(244, 63, 94, 0.50)' : 'rgba(6, 182, 212, 0.50)');

  return (
    <div className="w-full relative">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        style={{ perspective: 1200 }}
        className="w-full"
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${isHovered ? '10px' : '0px'})`,
            transformStyle: 'preserve-3d',
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
            boxShadow: isHovered
              ? (isDark
                  ? `0 25px 65px -15px rgba(0, 0, 0, 0.95), 0 0 35px -5px ${neonHaloColor}, 0 0 15px 0px ${neonSecondaryColor}`
                  : `0 20px 45px -10px rgba(99, 102, 241, 0.20), 0 8px 25px -5px rgba(6, 182, 212, 0.15)`)
              : (isDark
                  ? '0 15px 40px -10px rgba(0, 0, 0, 0.8), 0 0 18px -3px rgba(6, 182, 212, 0.12)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.06)'),
          }}
          className={cn(
            "relative w-full rounded-3xl p-6 sm:p-8 transition-all duration-300 overflow-hidden cursor-default group",
            isDark 
              ? "bg-slate-900/95 text-white border border-slate-800" 
              : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/25 text-slate-900 border border-slate-200/90"
          )}
        >
          {/* Dynamic Ambient Background Glow Layer (Underglow profundo através dos vidros) */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
            style={{
              opacity: isHovered ? (isDark ? 0.95 : 0.75) : (isDark ? 0.35 : 0.2),
              background: `radial-gradient(circle 440px at ${mousePos.x}% ${mousePos.y}%, ${glowAccent} 0%, ${neonSecondaryColor} 45%, transparent 70%)`,
            }}
          />

          {/* Cyber Circuit & Grid Watermark */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none [background-size:24px_24px] z-0",
              isDark 
                ? "opacity-[0.06] bg-[radial-gradient(#6366f1_1px,transparent_1px)]" 
                : "opacity-[0.035] bg-[radial-gradient(#6366f1_1px,transparent_1px)]"
            )}
          />

          {/* Glowing Animated Top Laser Beam */}
          <div 
            className={cn(
              "absolute top-0 left-0 right-0 h-[2.5px] pointer-events-none animate-pulse z-10",
              isDark 
                ? "bg-gradient-to-r from-transparent via-cyan-400 to-emerald-400 opacity-80" 
                : "bg-gradient-to-r from-transparent via-cyan-500 to-indigo-500 opacity-70"
            )} 
          />
          <div 
            className={cn(
              "absolute -top-12 left-1/4 w-1/2 h-24 blur-3xl pointer-events-none z-0",
              isDark ? "bg-indigo-500/20" : "bg-indigo-400/10"
            )} 
          />

          {/* Dynamic Cursor Spotlight Trail (Rastro holográfico visível sobre todo o card que segue o cursor) */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-150 z-0 bg-transparent"
            style={{
              backgroundColor: 'transparent',
              opacity: isHovered ? (isDark ? 0.92 : 0.6) : 0,
              background: `radial-gradient(circle 340px at ${mousePos.x}% ${mousePos.y}%, ${
                isDark
                  ? (isOverBudget ? 'rgba(244, 63, 94, 0.32)' : 'rgba(6, 182, 212, 0.30)')
                  : (isOverBudget ? 'rgba(244, 63, 94, 0.13)' : 'rgba(6, 182, 212, 0.15)')
              } 0%, ${
                isDark
                  ? (isOverBudget ? 'rgba(225, 29, 72, 0.16)' : 'rgba(99, 102, 241, 0.18)')
                  : 'rgba(99, 102, 241, 0.06)'
              } 45%, transparent 70%)`,
              mixBlendMode: isDark ? 'screen' : 'multiply',
            }}
          />

          {/* Pinpoint Specular Core Shine (Ponto central brilhante do rastro no cursor em tema escuro) */}
          {isDark && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-100 z-0 bg-transparent"
              style={{
                backgroundColor: 'transparent',
                opacity: isHovered ? 0.85 : 0,
                background: `radial-gradient(circle 140px at ${mousePos.x}% ${mousePos.y}%, ${
                  isOverBudget ? 'rgba(255, 220, 230, 0.28)' : 'rgba(210, 250, 255, 0.30)'
                } 0%, transparent 70%)`,
                mixBlendMode: 'screen',
              }}
            />
          )}

          {/* Specular Neon Border Frame */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300 z-0 bg-transparent"
            style={{
              backgroundColor: 'transparent',
              border: `1.5px solid ${isHovered ? borderAccent : (isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(203, 213, 225, 0.8)')}`,
              boxShadow: isHovered 
                ? (isDark 
                    ? `inset 0 0 25px ${glowAccent}` 
                    : `inset 0 0 15px ${glowAccent}`) 
                : 'none'
            }}
          />

          {/* CARD CONTENT */}
          <div className="relative z-10 space-y-6">
            
            {/* 1. Header Bar: Title, Rateio Badge, Performance Pill, Quick Controls */}
            <div className={cn(
              "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5",
              isDark ? "border-b border-slate-800/80" : "border-b border-slate-200/80"
            )}>
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 ring-2 ring-cyan-400/30 group-hover:scale-105 transition-transform">
                  <Scale size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1",
                      isDark 
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" 
                        : "bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs"
                    )}>
                      <Sparkles size={11} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                      Auditoria Executiva • Radar Neon
                    </span>
                    
                    {/* Rateio Dynamic Tag */}
                    {isRateio ? (
                      <span 
                        title={`Rateio consolidado para ${monthsCount} meses: ${activeMonthsList.join(', ')}`}
                        className={cn(
                          "text-[10px] font-black tracking-wide px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5",
                          isDark 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                        )}
                      >
                        <Zap size={11} className={cn("animate-pulse", isDark ? "text-emerald-400" : "text-emerald-600")} />
                        {activeMonthsList.length <= 3 
                          ? `Rateio Ativo: ${monthsCount} Meses (${activeMonthsList.join(', ')})`
                          : `Rateio Ativo: ${monthsCount} Meses (${activeMonthsList.slice(0, 2).join(', ')} +${activeMonthsList.length - 2} m)`}
                      </span>
                    ) : (
                      <span className={cn(
                        "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1",
                        isDark 
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" 
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs"
                      )}>
                        <Calendar size={11} />
                        1 Mês ({activeMonthsList[0] || 'Base'})
                      </span>
                    )}
                  </div>
                  <h2 className={cn(
                    "text-lg sm:text-xl font-black tracking-tight mt-1 flex items-center gap-2",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Conciliação Orçamentária: Custo Orçado vs. Realizado
                  </h2>
                  <p className={cn(
                    "text-xs font-medium flex items-center gap-1.5 flex-wrap",
                    isDark ? "text-slate-400" : "text-slate-600"
                  )}>
                    <span>
                      {isRateio 
                        ? `Orçamento consolidado para ${monthsCount} meses com rateio proporcional automático.`
                        : 'Monitoramento em tempo real do teto financeiro mensal vs. custo consolidado auditado.'
                      }
                    </span>
                    {isRateio && (
                      <span className={isDark ? "text-cyan-300 font-bold" : "text-cyan-700 font-bold"}>
                        (Média mensal: {formatBRL(effectiveOrcado / monthsCount)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status Pills & Quick Edit Action */}
              <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
                {/* Performance Pill */}
                <div className={cn(
                  "px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-black shadow-sm uppercase tracking-wider backdrop-blur-md",
                  isDark
                    ? (isOverBudget 
                        ? "bg-rose-950/70 border-rose-500/40 text-rose-300 shadow-rose-900/30" 
                        : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-emerald-900/30")
                    : (isOverBudget
                        ? "bg-rose-50 border-rose-300 text-rose-700 shadow-rose-100/60"
                        : "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-emerald-100/60")
                )}>
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full animate-ping",
                    isOverBudget 
                      ? (isDark ? "bg-rose-500" : "bg-rose-600") 
                      : (isDark ? "bg-emerald-400" : "bg-emerald-500")
                  )} />
                  {isOverBudget ? (
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className={isDark ? "text-rose-400" : "text-rose-600"} />
                      Acima do Orçamento ({percentUsed.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                      Dentro da Meta ({percentUsed.toFixed(1)}%)
                    </span>
                  )}
                </div>

                {/* Rateio Breakdown Drawer Toggle Button */}
                {breakdownList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer",
                      isDark
                        ? (isBreakdownExpanded
                            ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
                            : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700 hover:border-slate-600")
                        : (isBreakdownExpanded
                            ? "bg-cyan-100 text-cyan-800 border-cyan-300 font-extrabold"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300")
                    )}
                    title="Exibir detalhamento do rateio mês a mês"
                  >
                    <Layers size={13} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                    <span>Rateio Mês a Mês</span>
                    {isBreakdownExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}

                {/* Quick Edit Budget Button */}
                <button
                  type="button"
                  onClick={(e) => openQuickEdit(e)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border",
                    isDark
                      ? "bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-slate-700 hover:border-cyan-500/50"
                      : "bg-white hover:bg-slate-50 text-cyan-700 border-slate-200 hover:border-cyan-300"
                  )}
                  title="Ajustar o valor orçado manualmente agora"
                >
                  <Edit3 size={13} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                  <span>Ajustar Orçado</span>
                </button>

                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className={cn(
                      "p-2 rounded-xl transition-all cursor-pointer border",
                      isDark
                        ? "bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white border-slate-700/80"
                        : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200"
                    )}
                    title="Abrir página completa de Configurações de Orçamento Mensal"
                  >
                    <Settings size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. MAIN DUAL DISPLAY: CUSTO ORÇADO (LEFT) VS. CUSTO REALIZADO (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LADO 1: CUSTO ORÇADO NO PERÍODO (META COM RATEIO) */}
              <div className={cn(
                "lg:col-span-5 relative rounded-2xl p-6 shadow-md overflow-hidden group/left flex flex-col justify-between transition-all",
                isDark
                  ? "bg-gradient-to-br from-slate-900/75 via-indigo-950/50 to-slate-900/75 border border-indigo-500/35 backdrop-blur-md hover:border-cyan-400/40"
                  : "bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/40 border border-indigo-200/80 shadow-indigo-100/50"
              )}>
                {/* Glow & Cyber Highlights */}
                <div className={cn(
                  "absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all",
                  isDark ? "bg-cyan-500/15 group-hover/left:bg-cyan-500/25" : "bg-cyan-400/12 group-hover/left:bg-cyan-400/20"
                )} />
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none",
                  isDark ? "bg-indigo-500/10" : "bg-indigo-400/10"
                )} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-xl border",
                        isDark 
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                          : "bg-cyan-100 text-cyan-700 border-cyan-300 shadow-xs"
                      )}>
                        <Target size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <span className={cn(
                          "text-[10px] font-black tracking-widest uppercase block",
                          isDark ? "text-cyan-400" : "text-cyan-700"
                        )}>
                          {isRateio ? `TETO ORÇADO (${monthsCount} MESES)` : 'TETO ORÇADO PREVISTO'}
                        </span>
                        <span className={cn(
                          "text-xs font-bold",
                          isDark ? "text-slate-300" : "text-slate-600"
                        )}>
                          {isRateio ? 'Rateio Orçamentário do Período' : 'Meta Orçamentária Mensal'}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide",
                      isDark 
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" 
                        : "bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs"
                    )}>
                      {isRateio ? `${monthsCount} Meses` : '1 Mês'}
                    </span>
                  </div>

                  {/* Big Number Display */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight transition-colors drop-shadow-sm",
                        isDark 
                          ? "text-white group-hover/left:text-cyan-300" 
                          : "text-slate-900 group-hover/left:text-cyan-700"
                      )}>
                        {formatBRL(effectiveOrcado)}
                      </span>
                    </div>

                    {/* Explanatory description */}
                    <div className={cn(
                      "text-[11px] font-medium space-y-0.5",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {isRateio ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("font-semibold", isDark ? "text-cyan-300" : "text-cyan-700")}>
                            Base: {formatBRL(baseMonthly)}/mês
                          </span>
                          <span>•</span>
                          <span>{monthsCount} meses acumulados no período selecionado</span>
                        </div>
                      ) : (
                        <p>Valor orçado para o mês atual selecionado</p>
                      )}

                      {hasCustomOverrides && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Existem meses com valor customizado
                          </span>
                          {onResetAllMonthBudgets && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResetAllMonthBudgets();
                              }}
                              className={cn(
                                "text-[10px] font-bold underline cursor-pointer transition-colors",
                                isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-700 hover:text-cyan-800"
                              )}
                            >
                              Redefinir todos para {formatBRL(baseMonthly)}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub info / Quick actions */}
                <div className={cn(
                  "mt-5 pt-4 border-t flex items-center justify-between text-xs",
                  isDark ? "border-slate-800/90" : "border-slate-200/90"
                )}>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px]",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    <ShieldCheck size={13} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                    <span 
                      title={activeMonthsList.join(' + ')}
                      className="truncate max-w-[170px] sm:max-w-none font-semibold"
                    >
                      {isRateio 
                        ? (activeMonthsList.length <= 3 ? activeMonthsList.join(' + ') : `${activeMonthsList.length} Meses Consolidados`) 
                        : 'Dotação Mensal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => openQuickEdit(e)}
                      className={cn(
                        "text-[11px] font-bold flex items-center gap-1 transition-colors hover:underline cursor-pointer",
                        isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-700 hover:text-cyan-800"
                      )}
                    >
                      <Edit3 size={11} />
                      Editar Base
                    </button>
                    {onNavigateToSettings && (
                      <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className={cn(
                          "text-[11px] font-bold flex items-center gap-1 transition-colors hover:underline cursor-pointer",
                          isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-700 hover:text-indigo-800"
                        )}
                      >
                        <Sliders size={11} />
                        Personalizar Mês
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CENTRO: HUD COMPARATIVO DINÂMICO (GAP & PERFORMANCE RATIO) */}
              <div className={cn(
                "lg:col-span-2 flex flex-col items-center justify-center p-4 rounded-2xl relative overflow-hidden text-center space-y-3 transition-all",
                isDark 
                  ? "bg-slate-900/65 border border-slate-800/80 backdrop-blur-md shadow-inner" 
                  : "bg-white/80 border border-slate-200/90 shadow-sm"
              )}>
                <div className={cn(
                  "absolute inset-0 pointer-events-none",
                  isDark 
                    ? "bg-gradient-to-b from-indigo-500/5 via-cyan-500/5 to-transparent" 
                    : "bg-gradient-to-b from-indigo-50/50 via-cyan-50/30 to-transparent"
                )} />
                
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  Consumo do Teto
                </span>

                {/* Radial / Percentage Badge */}
                <div className="relative">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex flex-col items-center justify-center p-2 border-2 shadow-md transition-all",
                    isDark
                      ? (isOverBudget 
                          ? "bg-rose-950/50 border-rose-500 text-rose-300 shadow-rose-900/40" 
                          : "bg-emerald-950/50 border-emerald-400 text-emerald-300 shadow-emerald-900/40")
                      : (isOverBudget
                          ? "bg-rose-50 border-rose-400 text-rose-700 shadow-rose-100"
                          : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-100")
                  )}>
                    <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                      {percentUsed > 999 ? '>999%' : `${percentUsed.toFixed(0)}%`}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide opacity-80 mt-0.5">
                      {isOverBudget ? 'Excedido' : 'Utilizado'}
                    </span>
                  </div>

                  {/* Pulsing indicator orb */}
                  <span className={cn(
                    "absolute top-0 right-0 w-3 h-3 rounded-full border-2 animate-ping",
                    isDark ? "border-slate-900" : "border-white",
                    isOverBudget 
                      ? (isDark ? "bg-rose-500" : "bg-rose-600") 
                      : (isDark ? "bg-emerald-400" : "bg-emerald-500")
                  )} />
                </div>

                {/* Difference / Delta */}
                <div className="space-y-0.5">
                  <span className={cn(
                    "text-[10px] font-bold uppercase block",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {isOverBudget ? 'Déficit Orçamentário' : 'Saldo Disponível'}
                  </span>
                  <span className={cn(
                    "text-xs sm:text-sm font-black tracking-tight block",
                    isDark
                      ? (isOverBudget ? "text-rose-400" : "text-emerald-400")
                      : (isOverBudget ? "text-rose-600" : "text-emerald-600")
                  )}>
                    {isOverBudget ? `- ${formatBRL(Math.abs(diff))}` : `+ ${formatBRL(diff)}`}
                  </span>
                </div>
              </div>

              {/* LADO 2: CUSTO REALIZADO (EXECUTADO TOTAL DO PERÍODO) */}
              <div className={cn(
                "lg:col-span-5 relative rounded-2xl p-6 shadow-md overflow-hidden group/right flex flex-col justify-between transition-all",
                isDark
                  ? "bg-gradient-to-br from-slate-900/75 via-slate-950/60 to-slate-900/75 border border-slate-800/90 backdrop-blur-md hover:border-slate-700/80"
                  : "bg-gradient-to-br from-slate-50/70 via-white to-slate-50/50 border border-slate-200/80 shadow-slate-100/60"
              )}>
                {/* Glow & Cyber Highlights */}
                <div className={cn(
                  "absolute -bottom-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-all",
                  isDark
                    ? (isOverBudget ? "bg-rose-500/15 group-hover/right:bg-rose-500/25" : "bg-emerald-500/15 group-hover/right:bg-emerald-500/25")
                    : (isOverBudget ? "bg-rose-500/10 group-hover/right:bg-rose-500/15" : "bg-emerald-500/10 group-hover/right:bg-emerald-500/15")
                )} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-xl border",
                        isDark
                          ? (isOverBudget 
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40" 
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40")
                          : (isOverBudget
                              ? "bg-rose-100 text-rose-700 border-rose-300 shadow-xs"
                              : "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs")
                      )}>
                        <TrendingUp size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <span className={cn(
                          "text-[10px] font-black tracking-widest uppercase block",
                          isDark
                            ? (isOverBudget ? "text-rose-400" : "text-emerald-400")
                            : (isOverBudget ? "text-rose-700" : "text-emerald-700")
                        )}>
                          {isRateio ? `CUSTO REALIZADO (${monthsCount} MESES)` : 'CUSTO TOTAL REALIZADO'}
                        </span>
                        <span className={cn(
                          "text-xs font-bold",
                          isDark ? "text-slate-300" : "text-slate-600"
                        )}>
                          Executado Efetivo
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wide",
                      isDark
                        ? (isOverBudget 
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30" 
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")
                        : (isOverBudget
                            ? "bg-rose-50 text-rose-700 border-rose-200 shadow-xs"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs")
                    )}>
                      Consolidado Frota
                    </span>
                  </div>

                  {/* Big Number Display */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight transition-colors drop-shadow-sm",
                        isDark
                          ? (isOverBudget ? "text-rose-200 group-hover/right:text-rose-300" : "text-white group-hover/right:text-emerald-300")
                          : (isOverBudget ? "text-rose-700 group-hover/right:text-rose-800" : "text-slate-900 group-hover/right:text-emerald-700")
                      )}>
                        {formatBRL(effectiveRealizado)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-[11px] font-medium",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      Soma total apurada de peças de estoque e ordens de pagamento avulsas no período
                    </p>
                  </div>
                </div>

                {/* Sub info / Breakdown Chips */}
                <div className={cn(
                  "mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs",
                  isDark ? "border-slate-800/90" : "border-slate-200/90"
                )}>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                      isDark
                        ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200 shadow-xs"
                    )}>
                      <Database size={11} /> Estoque: {formatBRL(effectiveEstoque)} ({pctEstoque.toFixed(0)}%)
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                      isDark
                        ? "text-sky-400 bg-sky-950/40 border-sky-800/50"
                        : "text-sky-700 bg-sky-50 border-sky-200 shadow-xs"
                    )}>
                      <FileText size={11} /> Avulso: {formatBRL(effectiveAvulso)} ({pctAvulso.toFixed(0)}%)
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {totalRegistros.toLocaleString('pt-BR')} registros
                  </span>
                </div>
              </div>

            </div>

            {/* 3. NEON PROGRESS BAR & HUD TIMELINE METER */}
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl space-y-2.5 transition-all",
              isDark 
                ? "bg-slate-900/70 border border-slate-800/80 backdrop-blur-md" 
                : "bg-white/90 border border-slate-200/90 shadow-xs"
            )}>
              <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap size={14} className={cn("animate-bounce", isDark ? "text-yellow-400" : "text-amber-500")} />
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                    Termômetro de Consumo do Orçamento:
                  </span>
                  <span className={cn(
                    "font-black px-2 py-0.5 rounded-md text-[11px]",
                    isDark
                      ? (isOverBudget ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300")
                      : (isOverBudget ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800")
                  )}>
                    {percentUsed.toFixed(1)}% executado
                  </span>
                </div>

                <div className={cn(
                  "flex items-center gap-3 text-[11px]",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  <span className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", isDark ? "bg-cyan-400" : "bg-cyan-600")} />
                    Meta ({monthsCount}M): {formatBRL(effectiveOrcado)}
                  </span>
                  <span>•</span>
                  <span className={cn(
                    "font-extrabold",
                    isDark
                      ? (isOverBudget ? "text-rose-400" : "text-emerald-400")
                      : (isOverBudget ? "text-rose-600" : "text-emerald-600")
                  )}>
                    {isOverBudget ? `Excesso: +${(percentUsed - 100).toFixed(1)}%` : `Margem: ${(100 - percentUsed).toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Glowing Multi-Segment Progress Bar */}
              <div className={cn(
                "relative w-full h-4 rounded-full overflow-hidden p-0.5 shadow-inner",
                isDark ? "bg-slate-950 border border-slate-800" : "bg-slate-100 border border-slate-200"
              )}>
                {/* 100% Target Milestone Marker line */}
                <div 
                  className={cn(
                    "absolute top-0 bottom-0 w-[2px] z-20",
                    isDark ? "bg-cyan-300 shadow-[0_0_8px_#22d3ee]" : "bg-cyan-600 shadow-[0_0_6px_#0891b2]"
                  )}
                  style={{ left: '100%' }}
                />

                {/* Progress bar fill */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(percentUsed, 1))}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "h-full rounded-full transition-all duration-700 relative overflow-hidden shadow-lg",
                    isOverBudget 
                      ? "bg-gradient-to-r from-indigo-500 via-amber-500 to-rose-500 shadow-rose-500/40" 
                      : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-emerald-500/40"
                  )}
                >
                  {/* Internal Shimmer Laser Line */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>

              {/* Progress Bar Footer Labels */}
              <div className={cn(
                "flex items-center justify-between text-[10px] font-bold pt-0.5",
                isDark ? "text-slate-500" : "text-slate-400"
              )}>
                <span>R$ 0,00</span>
                <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                  50% ({formatBRL(effectiveOrcado * 0.5)})
                </span>
                <span className={cn("font-extrabold", isDark ? "text-cyan-400" : "text-cyan-700")}>
                  100% Meta ({formatBRL(effectiveOrcado)})
                </span>
                {percentUsed > 100 && (
                  <span className={cn(
                    "font-extrabold animate-pulse",
                    isDark ? "text-rose-400" : "text-rose-600"
                  )}>
                    Atual: {percentUsed.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* 4. EXPANDABLE RATEIO BREAKDOWN ACCORDION */}
            <AnimatePresence>
              {isBreakdownExpanded && breakdownList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "overflow-hidden rounded-2xl p-5 space-y-4 border transition-all",
                    isDark 
                      ? "border-slate-800/90 bg-slate-900/80 backdrop-blur-md text-white" 
                      : "border-slate-200 bg-white/95 text-slate-900 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-between pb-3",
                    isDark ? "border-b border-slate-800" : "border-b border-slate-200"
                  )}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Layers size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                      <h4 className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
                        Detalhamento do Rateio por Mês ({breakdownList.length} {breakdownList.length === 1 ? 'mês' : 'meses'})
                      </h4>
                      <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                        isDark 
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" 
                          : "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-xs"
                      )}>
                        Total Orçado: {formatBRL(effectiveOrcado)}
                      </span>
                    </div>

                    <div className={cn(
                      "text-xs flex items-center gap-2",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      <span className="flex items-center gap-1 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Dentro
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Excedido
                      </span>
                    </div>
                  </div>

                  {/* Grid of Months */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {breakdownList.map((item) => {
                      const itemOver = item.diff < 0;
                      return (
                        <div
                          key={item.month}
                          className={cn(
                            "p-4 rounded-xl border transition-all space-y-2.5 relative group/month",
                            isDark
                              ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                              : "bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-900")}>
                                {item.month} {item.year}
                              </span>
                              {item.isCustom ? (
                                <span className={cn(
                                  "text-[9px] font-extrabold px-1.5 py-0.5 rounded border",
                                  isDark 
                                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" 
                                    : "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-xs"
                                )}>
                                  Personalizado
                                </span>
                              ) : (
                                <span className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded",
                                  isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200/70 text-slate-600"
                                )}>
                                  Base Padrão
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => openQuickEdit(undefined, `${item.year}-${item.month}`)}
                              className={cn(
                                "transition-opacity p-1 cursor-pointer",
                                isDark 
                                  ? "opacity-60 group-hover/month:opacity-100 text-cyan-400 hover:text-cyan-300" 
                                  : "opacity-70 group-hover/month:opacity-100 text-cyan-700 hover:text-cyan-800"
                              )}
                              title={`Editar orçamento específico de ${item.month}`}
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>

                          {/* Values comparison */}
                          <div className={cn(
                            "grid grid-cols-2 gap-2 text-xs pt-1 border-t",
                            isDark ? "border-slate-800/80" : "border-slate-200/80"
                          )}>
                            <div>
                              <span className={cn(
                                "text-[10px] block font-medium",
                                isDark ? "text-slate-400" : "text-slate-500"
                              )}>
                                Orçado:
                              </span>
                              <span className={cn("font-bold", isDark ? "text-cyan-300" : "text-cyan-700")}>
                                {formatBRL(item.orcado)}
                              </span>
                            </div>
                            <div>
                              <span className={cn(
                                "text-[10px] block font-medium",
                                isDark ? "text-slate-400" : "text-slate-500"
                              )}>
                                Realizado:
                              </span>
                              <span className={cn(
                                "font-bold",
                                itemOver 
                                  ? (isDark ? "text-rose-400" : "text-rose-600") 
                                  : (isDark ? "text-emerald-300" : "text-emerald-600")
                              )}>
                                {formatBRL(item.realizado)}
                              </span>
                            </div>
                          </div>

                          {/* Mini Progress bar */}
                          <div className="space-y-1">
                            <div className={cn(
                              "flex items-center justify-between text-[10px]",
                              isDark ? "text-slate-400" : "text-slate-500"
                            )}>
                              <span>Consumo</span>
                              <span className={cn(
                                "font-bold",
                                itemOver 
                                  ? (isDark ? "text-rose-400" : "text-rose-600") 
                                  : (isDark ? "text-emerald-400" : "text-emerald-600")
                              )}>
                                {item.percentUsed.toFixed(1)}%
                              </span>
                            </div>
                            <div className={cn(
                              "h-1.5 w-full rounded-full overflow-hidden",
                              isDark ? "bg-slate-800" : "bg-slate-200"
                            )}>
                              <div
                                style={{ width: `${Math.min(100, Math.max(item.percentUsed, 1))}%` }}
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  itemOver ? "bg-rose-500" : "bg-emerald-500"
                                )}
                              />
                            </div>
                          </div>

                          {/* Saldo */}
                          <div className={cn(
                            "flex items-center justify-between text-[10px] pt-1 border-t",
                            isDark ? "border-slate-900" : "border-slate-200"
                          )}>
                            <span className={isDark ? "text-slate-400" : "text-slate-500"}>Saldo do mês:</span>
                            <span className={cn(
                              "font-black",
                              itemOver 
                                ? (isDark ? "text-rose-400" : "text-rose-600") 
                                : (isDark ? "text-emerald-400" : "text-emerald-600")
                            )}>
                              {itemOver ? `- ${formatBRL(Math.abs(item.diff))}` : `+ ${formatBRL(item.diff)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>

      {/* QUICK EDIT MODAL POPUP (BASE OR MONTH) */}
      <AnimatePresence>
        {isQuickEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 border transition-all",
                isDark 
                  ? "bg-slate-900 border-slate-700 text-white" 
                  : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-between pb-4",
                isDark ? "border-b border-slate-800" : "border-b border-slate-200"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-2 rounded-xl border",
                    isDark 
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
                      : "bg-cyan-100 text-cyan-700 border-cyan-300 shadow-xs"
                  )}>
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>
                      Ajustar Custo Orçado
                    </h3>
                    <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                      Meta financeira para manutenção da frota
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isDark 
                      ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                      : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                  )}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Edit Mode Tabs */}
              <div className={cn(
                "flex p-1 rounded-xl border",
                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              )}>
                <button
                  type="button"
                  onClick={() => {
                    setEditTab('base');
                    setEditInputVal(baseMonthly.toString());
                  }}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer",
                    editTab === 'base' 
                      ? "bg-cyan-600 text-white shadow-sm" 
                      : (isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                  )}
                >
                  Orçamento Base Mensal
                </button>
                {activeMonthsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTab('month');
                      const firstMonth = activeMonthsList[0];
                      const primaryYear = periodBudget?.primaryYear || '2026';
                      const key = `${primaryYear}-${firstMonth}`;
                      setSelectedEditMonthKey(key);
                      const cur = monthlyBudgets[key] || monthlyBudgets[firstMonth] || baseMonthly;
                      setEditInputVal(cur.toString());
                    }}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer",
                      editTab === 'month' 
                        ? "bg-cyan-600 text-white shadow-sm" 
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                    )}
                  >
                    Mês Específico ({activeMonthsList[0]})
                  </button>
                )}
              </div>

              {/* Month selector if month tab */}
              {editTab === 'month' && (
                <div className="space-y-1.5">
                  <label className={cn(
                    "text-[11px] font-bold uppercase tracking-wider block",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    Selecione o Mês a Customizar:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeMonthsList.map((m) => {
                      const primaryYear = periodBudget?.primaryYear || '2026';
                      const key = `${primaryYear}-${m}`;
                      const isSelected = selectedEditMonthKey === key || selectedEditMonthKey === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedEditMonthKey(key);
                            const cur = monthlyBudgets[key] || monthlyBudgets[m] || baseMonthly;
                            setEditInputVal(cur.toString());
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                            isSelected
                              ? (isDark 
                                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-sm" 
                                  : "bg-cyan-100 text-cyan-800 border-cyan-400 shadow-sm")
                              : (isDark 
                                  ? "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700" 
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300")
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className={cn(
                  "text-xs font-bold uppercase tracking-wider block",
                  isDark ? "text-slate-300" : "text-slate-700"
                )}>
                  {editTab === 'base' ? 'Valor Base Padrão Mensal (R$)' : `Valor para ${selectedEditMonthKey} (R$)`}
                </label>
                <div className="relative">
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
                    value={editInputVal}
                    onChange={(e) => setEditInputVal(e.target.value)}
                    placeholder="Ex: 120000"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all",
                      isDark 
                        ? "bg-slate-950 border-slate-700 text-white placeholder-slate-600" 
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white"
                    )}
                    autoFocus
                  />
                </div>
                
                <p className={cn("text-[11px]", isDark ? "text-slate-400" : "text-slate-600")}>
                  {editTab === 'base' ? (
                    <>
                      Multiplicador automático: quando selecionar {monthsCount} meses, o rateio total será{' '}
                      <strong className={isDark ? "text-cyan-400" : "text-cyan-700"}>
                        {formatBRL((parseFloat(editInputVal) || 0) * monthsCount)}
                      </strong>.
                    </>
                  ) : (
                    <>
                      Este valor prevalecerá especificamente para o mês de{' '}
                      <strong className={isDark ? "text-cyan-300" : "text-cyan-700"}>
                        {selectedEditMonthKey}
                      </strong>.
                    </>
                  )}
                </p>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider block",
                    isDark ? "text-slate-500" : "text-slate-400"
                  )}>
                    Sugestões Rápidas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditInputVal('120000')}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition-colors cursor-pointer text-center",
                        editInputVal === '120000'
                          ? (isDark ? "bg-cyan-500/25 text-cyan-200 border-cyan-400" : "bg-cyan-100 text-cyan-800 border-cyan-400")
                          : (isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200")
                      )}
                    >
                      R$ 120k (Padrão)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditInputVal(Math.round(effectiveRealizado / monthsCount).toString())}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-center",
                        isDark 
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      )}
                    >
                      Média Real
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditInputVal(Math.round((effectiveRealizado / monthsCount) * 1.1).toString())}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-center",
                        isDark 
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      )}
                    >
                      +10% Margem
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditInputVal(Math.round((effectiveRealizado / monthsCount) * 1.25).toString())}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-center",
                        isDark 
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      )}
                    >
                      +25% Margem
                    </button>
                  </div>

                  {onResetAllMonthBudgets && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetAllMonthBudgets();
                          setIsSavedFeedback(true);
                          setTimeout(() => {
                            setIsSavedFeedback(false);
                            setIsQuickEditOpen(false);
                          }, 500);
                        }}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl text-xs font-bold border border-dashed transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isDark 
                            ? "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10" 
                            : "border-indigo-400 text-indigo-700 hover:bg-indigo-50"
                        )}
                      >
                        <RefreshCw size={12} />
                        Redefinir todos os {monthsCount} meses para R$ 120.000,00 (Total: {formatBRL(120000 * monthsCount)})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={cn(
                "flex items-center justify-between pt-4 border-t",
                isDark ? "border-slate-800" : "border-slate-200"
              )}>
                {onNavigateToSettings ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickEditOpen(false);
                      onNavigateToSettings();
                    }}
                    className={cn(
                      "text-xs font-bold underline cursor-pointer",
                      isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-700 hover:text-indigo-800"
                    )}
                  >
                    Abrir Configuração Completa
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                      isDark 
                        ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickSave}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer",
                      isSavedFeedback 
                        ? "bg-emerald-600 text-white" 
                        : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white"
                    )}
                  >
                    {isSavedFeedback ? (
                      <>
                        <Check size={14} />
                        Salvo!
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Salvar Meta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceBudgetComparisonNeonCard;
