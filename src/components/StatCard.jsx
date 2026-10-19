import React from 'react';

/**
 * Tarjeta de KPI moderna y dinámica con paleta corporativa de Wittur.
 */
export const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    colorScheme = 'teal',
    badge,
    onClick
}) => {
    const colorStyles = {
        teal: {
            bgIcon: 'bg-[#009ba4]/10 text-[#009ba4] dark:bg-[#009ba4]/20 dark:text-[#2ec0c7]',
            border: 'hover:border-[#009ba4]/40',
            accent: 'from-[#009ba4]/5 to-transparent'
        },
        emerald: {
            bgIcon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            border: 'hover:border-emerald-500/40',
            accent: 'from-emerald-500/5 to-transparent'
        },
        amber: {
            bgIcon: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
            border: 'hover:border-amber-500/40',
            accent: 'from-amber-500/5 to-transparent'
        },
        rose: {
            bgIcon: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
            border: 'hover:border-rose-500/40',
            accent: 'from-rose-500/5 to-transparent'
        },
        gray: {
            bgIcon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            border: 'hover:border-slate-400/40',
            accent: 'from-slate-500/5 to-transparent'
        }
    };

    const scheme = colorStyles[colorScheme] || colorStyles.teal;

    return (
        <div 
            onClick={onClick}
            className={`relative overflow-hidden bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 group ${scheme.border} ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Sutil gradiente de esquina */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-bl ${scheme.accent} rounded-bl-full pointer-events-none`} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                        {title}
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div className={`p-3.5 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-110 ${scheme.bgIcon}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>

            {badge && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {badge}
                </div>
            )}
        </div>
    );
};
