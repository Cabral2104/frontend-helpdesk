import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Estado vacío universal para listas, tablas y resultados de búsqueda
 */
export const EmptyState = ({
    icon: Icon = Inbox,
    title = 'No se encontraron resultados',
    description = 'No hay registros disponibles o no coinciden con los filtros aplicados.',
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
            <div className="h-16 w-16 rounded-2xl bg-[#009ba4]/10 dark:bg-[#009ba4]/20 text-[#009ba4] dark:text-[#2ec0c7] flex items-center justify-center mb-4 transition-transform hover:scale-105">
                <Icon size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 font-normal">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#009ba4] hover:bg-[#007e86] shadow-sm transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
