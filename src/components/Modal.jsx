import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal universal para el sistema Wittur Helpdesk
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    children,
    footer,
    maxWidth = 'max-w-2xl'
}) => {
    // Cerrar con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Bloquear scroll del body al abrir
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop con blur */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Contenedor del Modal */}
            <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200`}>
                {/* Cabecera */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 rounded-xl bg-[#009ba4]/10 text-[#009ba4] dark:bg-[#009ba4]/20 shrink-0">
                                <Icon size={20} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Cerrar (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="px-6 py-5 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300">
                    {children}
                </div>

                {/* Pie de modal opcional */}
                {footer && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
