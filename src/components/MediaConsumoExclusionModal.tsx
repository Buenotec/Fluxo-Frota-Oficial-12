import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EyeOff, 
  Search, 
  X, 
  Check, 
  Filter, 
  Truck, 
  AlertTriangle, 
  Trash2, 
  CheckSquare, 
  Square, 
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface MediaConsumoExclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFrotas: (string | { label: string; value: string })[];
  allPlacas: (string | { label: string; value: string })[];
  excludedFrotas: string[];
  setExcludedFrotas: (frotas: string[]) => void;
  excludedPlacas: string[];
  setExcludedPlacas: (placas: string[]) => void;
  appTheme?: 'light' | 'dark-neon';
}

export const MediaConsumoExclusionModal: React.FC<MediaConsumoExclusionModalProps> = ({
  isOpen,
  onClose,
  allFrotas,
  allPlacas,
  excludedFrotas,
  setExcludedFrotas,
  excludedPlacas,
  setExcludedPlacas,
  appTheme = 'light'
}) => {
  const isDark = appTheme === 'dark-neon';
  const [activeTab, setActiveTab] = useState<'all' | 'frotas' | 'placas'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract clean string lists
  const normalizedFrotas = useMemo(() => {
    return allFrotas.map(f => typeof f === 'object' ? f.value : String(f)).filter(Boolean);
  }, [allFrotas]);

  const normalizedPlacas = useMemo(() => {
    return allPlacas.map(p => typeof p === 'object' ? p.value : String(p)).filter(Boolean);
  }, [allPlacas]);

  // Filtered lists based on search
  const filteredFrotasList = useMemo(() => {
    if (!searchTerm.trim()) return normalizedFrotas;
    const term = searchTerm.toLowerCase();
    return normalizedFrotas.filter(f => f.toLowerCase().includes(term));
  }, [normalizedFrotas, searchTerm]);

  const filteredPlacasList = useMemo(() => {
    if (!searchTerm.trim()) return normalizedPlacas;
    const term = searchTerm.toLowerCase();
    return normalizedPlacas.filter(p => p.toLowerCase().includes(term));
  }, [normalizedPlacas, searchTerm]);

  // Toggle handlers
  const toggleFrota = (frota: string) => {
    if (excludedFrotas.includes(frota)) {
      setExcludedFrotas(excludedFrotas.filter(f => f !== frota));
    } else {
      setExcludedFrotas([...excludedFrotas, frota]);
    }
  };

  const togglePlaca = (placa: string) => {
    if (excludedPlacas.includes(placa)) {
      setExcludedPlacas(excludedPlacas.filter(p => p !== placa));
    } else {
      setExcludedPlacas([...excludedPlacas, placa]);
    }
  };

  const selectAllFrotas = () => {
    setExcludedFrotas(Array.from(new Set([...excludedFrotas, ...filteredFrotasList])));
  };

  const deselectAllFrotas = () => {
    setExcludedFrotas(excludedFrotas.filter(f => !filteredFrotasList.includes(f)));
  };

  const selectAllPlacas = () => {
    setExcludedPlacas(Array.from(new Set([...excludedPlacas, ...filteredPlacasList])));
  };

  const deselectAllPlacas = () => {
    setExcludedPlacas(excludedPlacas.filter(p => !filteredPlacasList.includes(p)));
  };

  const clearAllExclusions = () => {
    setExcludedFrotas([]);
    setExcludedPlacas([]);
  };

  const totalExcluded = excludedFrotas.length + excludedPlacas.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
            isDark 
              ? "bg-slate-900 border-slate-800 text-slate-100 shadow-black/80" 
              : "bg-white border-slate-200 text-slate-900 shadow-slate-200/80"
          )}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 shadow-md">
                <EyeOff size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Filtro de Exclusão — Ocultar do Relatório PDF
                  </h3>
                  {totalExcluded > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white shadow-xs animate-pulse">
                      {totalExcluded} Selecionado(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Fleque todas as frotas e placas que você <strong>NÃO deseja exibir</strong>. Ao marcar, esses veículos serão removidos do cálculo de médias e <strong>NÃO sairão nos relatórios em PDF</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search and Action Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl text-xs font-black">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer",
                    activeTab === 'all' 
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  Visão Geral ({totalExcluded})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('frotas')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'frotas' 
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  <span>Frotas / Prefixos</span>
                  {excludedFrotas.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {excludedFrotas.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('placas')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'placas' 
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  <span>Placas / Veículos</span>
                  {excludedPlacas.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {excludedPlacas.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar frota ou placa..."
                  className={cn(
                    "w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium outline-none transition-all border",
                    isDark
                      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500"
                      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  )}
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Bulk Selection Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2 flex-wrap">
                {(activeTab === 'all' || activeTab === 'frotas') && (
                  <>
                    <button
                      type="button"
                      onClick={selectAllFrotas}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Marcar Todas as Frotas
                    </button>
                    {excludedFrotas.length > 0 && (
                      <button
                        type="button"
                        onClick={deselectAllFrotas}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Desmarcar Frotas
                      </button>
                    )}
                  </>
                )}

                {(activeTab === 'all' || activeTab === 'placas') && (
                  <>
                    <button
                      type="button"
                      onClick={selectAllPlacas}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Marcar Todas as Placas
                    </button>
                    {excludedPlacas.length > 0 && (
                      <button
                        type="button"
                        onClick={deselectAllPlacas}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Desmarcar Placas
                      </button>
                    )}
                  </>
                )}
              </div>

              {totalExcluded > 0 && (
                <button
                  type="button"
                  onClick={clearAllExclusions}
                  className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer ml-auto"
                >
                  <Trash2 size={12} />
                  <span>Limpar Todas as Exclusões</span>
                </button>
              )}
            </div>
          </div>

          {/* Body Content - Scrollable Dual Column Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
            {/* Column Grid: Frotas & Placas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION 1: FROTAS / PREFIXOS */}
              {(activeTab === 'all' || activeTab === 'frotas') && (
                <div className={cn(
                  "p-4 rounded-2xl border",
                  isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Frotas / Prefixos ({filteredFrotasList.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {excludedFrotas.length} ocultada(s)
                    </span>
                  </div>

                  {filteredFrotasList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Nenhuma frota encontrada para "{searchTerm}".
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredFrotasList.map((frota) => {
                        const isChecked = excludedFrotas.includes(frota);
                        return (
                          <div
                            key={`frota-${frota}`}
                            onClick={() => toggleFrota(frota)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none",
                              isChecked
                                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-2xs"
                                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                              />
                              <span className="font-mono text-sm tracking-tight">#{frota}</span>
                            </div>

                            {isChecked ? (
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
                                Não Exibir no PDF
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Exibição Normal</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: PLACAS / VEÍCULOS */}
              {(activeTab === 'all' || activeTab === 'placas') && (
                <div className={cn(
                  "p-4 rounded-2xl border",
                  isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-emerald-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Placas / Veículos ({filteredPlacasList.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {excludedPlacas.length} ocultada(s)
                    </span>
                  </div>

                  {filteredPlacasList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Nenhuma placa encontrada para "{searchTerm}".
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredPlacasList.map((placa) => {
                        const isChecked = excludedPlacas.includes(placa);
                        return (
                          <div
                            key={`placa-${placa}`}
                            onClick={() => togglePlaca(placa)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none",
                              isChecked
                                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-2xs"
                                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                              />
                              <span className="font-mono text-sm tracking-tight font-black">{placa}</span>
                            </div>

                            {isChecked ? (
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
                                Não Exibir no PDF
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Exibição Normal</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanatory Notice */}
            <div className={cn(
              "p-3.5 rounded-2xl border text-xs flex items-start gap-3",
              isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-blue-50/60 border-blue-200 text-blue-900"
            )}>
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Como funciona a exclusão:</strong>
                <p className="opacity-90 leading-relaxed">
                  Os filtros convencionais (Veículo, Prefixo, Combustível, Período, etc.) continuam funcionando exatamente como antes. O <strong>Filtro de Exclusão</strong> atua como uma lista negra seletiva: qualquer ativo flegado aqui é sumariamente ocultado dos cálculos, tabelas, dashboards e dos relatórios <code>.PDF</code> (Consolidado, Mensal, Por Placa, Por Data e Gráficos).
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <EyeOff size={15} className="text-rose-500" />
              <span>
                Total excluído: <strong className="text-rose-600 dark:text-rose-400">{totalExcluded} ativo(s)</strong> ({excludedFrotas.length} frotas, {excludedPlacas.length} placas)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Check size={16} />
                <span>Salvar & Aplicar aos Relatórios PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
