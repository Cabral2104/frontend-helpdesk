import React from 'react';

/**
 * Insignia estilizada (Badge) con los colores corporativos de Wittur
 * y soporte completo para modo claro y modo oscuro.
 */
export const Badge = ({ children, variant, status, size = 'sm', className = '' }) => {
    // Normalizar si se pasa el status directamente
    let computedVariant = variant;
    const lower = (status || (typeof children === 'string' ? children : '')).toLowerCase().trim();

    if (!computedVariant) {
        if (lower.includes('abierto') || lower.includes('pendiente')) computedVariant = 'amber';
        else if (lower.includes('en progreso') || lower.includes('en_progreso') || lower.includes('en revisión') || lower.includes('en_revision')) computedVariant = 'teal';
        else if (lower.includes('resuelto') || lower.includes('atendido') || lower.includes('online') || lower.includes('en línea')) computedVariant = 'emerald';
        else if (lower.includes('cerrado')) computedVariant = 'gray';
        else if (lower.includes('alta') || lower.includes('crítico') || lower.includes('critico') || lower.includes('offline')) computedVariant = 'rose';
        else if (lower.includes('media')) computedVariant = 'amber';
        else if (lower.includes('baja')) computedVariant = 'teal';
        else if (lower.includes('esperando_piezas') || lower.includes('esperando piezas')) computedVariant = 'purple';
        else computedVariant = 'gray';
    }

    const variantStyles = {
        teal: 'bg-[#009ba4]/10 text-[#007e86] dark:text-[#2ec0c7] border-[#009ba4]/30',
        gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
        rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
        purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    };

    const dotColors = {
        teal: 'bg-[#009ba4]',
        gray: 'bg-slate-400',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
    };

    const sizeStyles = {
        xs: 'px-2 py-0.5 text-[11px] gap-1',
        sm: 'px-2.5 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2'
    };

    const activeStyle = variantStyles[computedVariant] || variantStyles.gray;
    const activeDot = dotColors[computedVariant] || dotColors.gray;

    return (
        <span className={`inline-flex items-center font-medium rounded-full border transition-colors ${activeStyle} ${sizeStyles[size]} ${className}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${activeDot}`} />
            <span>{children || status}</span>
        </span>
    );
};
