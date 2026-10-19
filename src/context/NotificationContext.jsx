import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Trash2, HelpCircle } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    // Estado de Toasts
    const [toasts, setToasts] = useState([]);

    // Estado del Diálogo de Confirmación
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'teal',
        resolve: null
    });

    // Añadir toast
    const addToast = useCallback((type, message, title = '') => {
        const id = Date.now() + Math.random().toString(36).substring(2, 7);
        const newToast = { id, type, message, title };
        
        setToasts(prev => [...prev, newToast]);

        // Auto-eliminar después de 4.2 segundos
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4200);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useMemo(() => ({
        success: (message, title = 'Éxito') => addToast('success', message, title),
        error: (message, title = 'Atención') => addToast('error', message, title),
        warning: (message, title = 'Aviso') => addToast('warning', message, title),
        info: (message, title = 'Información') => addToast('info', message, title),
    }), [addToast]);

    // Diálogo de Confirmación Promisificado (reemplazo de window.confirm)
    const confirm = useCallback(({
        title = '¿Estás seguro?',
        message = 'Esta acción no se puede deshacer.',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        variant = 'teal'
    }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                resolve
            });
        });
    }, []);

    const handleConfirmClose = (result) => {
        if (confirmState.resolve) {
            confirmState.resolve(result);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false, resolve: null }));
    };

    const getToastStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    border: 'border-emerald-200 dark:border-emerald-800/60',
                    bg: 'bg-white dark:bg-slate-900',
                    icon: <CheckCircle2 size={18} className="text-[#009ba4] shrink-0" />,
                    titleColor: 'text-slate-900 dark:text-white',
                    bar: 'bg-[#009ba4]'
                };
            case 'error':
                return {
                    border: 'border-rose-200 dark:border-rose-800/60',
                    bg: 'bg-white dark:bg-slate-900',
                    icon: <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />,
                    titleColor: 'text-rose-700 dark:text-rose-300',
                    bar: 'bg-rose-500'
                };
            case 'warning':
                return {
                    border: 'border-amber-200 dark:border-amber-800/60',
                    bg: 'bg-white dark:bg-slate-900',
                    icon: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
                    titleColor: 'text-amber-800 dark:text-amber-300',
                    bar: 'bg-amber-500'
                };
            case 'info':
            default:
                return {
                    border: 'border-slate-200 dark:border-slate-800',
                    bg: 'bg-white dark:bg-slate-900',
                    icon: <Info size={18} className="text-[#009ba4] shrink-0" />,
                    titleColor: 'text-slate-900 dark:text-white',
                    bar: 'bg-[#009ba4]'
                };
        }
    };

    const getConfirmVariantStyles = (variant) => {
        switch (variant) {
            case 'rose':
            case 'danger':
                return {
                    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
                    icon: <Trash2 size={24} />,
                    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                };
            case 'amber':
            case 'warning':
                return {
                    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                    icon: <AlertTriangle size={24} />,
                    button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                };
            case 'teal':
            case 'success':
            default:
                return {
                    iconBg: 'bg-[#009ba4]/10 text-[#009ba4] dark:bg-[#009ba4]/20',
                    icon: <CheckCircle2 size={24} />,
                    button: 'bg-[#009ba4] hover:bg-[#007e86] text-white shadow-[#009ba4]/25'
                };
        }
    };

    const variantStyles = getConfirmVariantStyles(confirmState.variant);

    return (
        <NotificationContext.Provider value={{ toast, confirm }}>
            {children}

            {/* CONTENEDOR FLOTANTE DE TOASTS */}
            <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map(t => {
                    const styles = getToastStyles(t.type);
                    return (
                        <div 
                            key={t.id}
                            className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border ${styles.border} ${styles.bg} transition-all duration-300 animate-in slide-in-from-top-3 fade-in`}
                        >
                            {/* Barra de acento */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />

                            <div className="flex items-start gap-3 pl-1.5">
                                {styles.icon}
                                <div className="flex-1 min-w-0 pr-2">
                                    {t.title && (
                                        <h4 className={`text-xs font-bold ${styles.titleColor} tracking-tight`}>
                                            {t.title}
                                        </h4>
                                    )}
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                                        {t.message}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => removeToast(t.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL DE CONFIRMACIÓN ELEGANTE (REEMPLAZO WINDOW.CONFIRM) */}
            {confirmState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => handleConfirmClose(false)}
                    />

                    {/* Diálogo */}
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-150">
                        <div className="flex items-start gap-4">
                            <div className={`p-3.5 rounded-2xl shrink-0 ${variantStyles.iconBg}`}>
                                {variantStyles.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {confirmState.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {confirmState.message}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                                type="button"
                                onClick={() => handleConfirmClose(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                                {confirmState.cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleConfirmClose(true)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${variantStyles.button}`}
                            >
                                {confirmState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
