import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente unificado de Paginación para el sistema Wittur
 */
export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage = 15,
    className = ''
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>
            <div>
                {totalItems ? (
                    <span>
                        Mostrando <strong className="text-slate-700 dark:text-slate-200">{startItem}</strong> - <strong className="text-slate-700 dark:text-slate-200">{endItem}</strong> de <strong className="text-slate-700 dark:text-slate-200">{totalItems}</strong> registros
                    </span>
                ) : (
                    <span>
                        Página <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> de <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        currentPage <= 1
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-[#009ba4] dark:hover:border-[#009ba4] shadow-2xs'
                    }`}
                >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                </button>

                <div className="hidden sm:flex items-center gap-1 px-2">
                    <span className="h-6 min-w-6 flex items-center justify-center rounded-md bg-[#009ba4] text-white font-bold text-xs shadow-2xs">
                        {currentPage}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        {totalPages}
                    </span>
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        currentPage >= totalPages
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-[#009ba4] dark:hover:border-[#009ba4] shadow-2xs'
                    }`}
                >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
