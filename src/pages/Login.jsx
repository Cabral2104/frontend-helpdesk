import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, ArrowRight, Lock, AlertCircle, Sun, Moon } from 'lucide-react';
import WitturLogo from '../assets/logo_wittur.png';

export const Login = () => {
    const [numeroNomina, setNumeroNomina] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // Sincronizar tema con la clase en <html>
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!numeroNomina.trim()) {
            setError('Por favor, ingresa tu número de nómina.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        const result = await login(numeroNomina.trim());

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Credenciales no válidas. Contacta a ICT.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden p-4 sm:p-6 font-sans transition-colors duration-300">
            {/* Botón flotante para alternar tema Claro / Oscuro en el login */}
            <button 
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="fixed top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-sm hover:border-[#009ba4]"
                title="Cambiar tema visual"
            >
                {darkMode ? (
                    <>
                        <Sun size={15} className="text-amber-400" />
                        <span className="hidden sm:inline">Modo Claro</span>
                    </>
                ) : (
                    <>
                        <Moon size={15} className="text-[#009ba4]" />
                        <span className="hidden sm:inline">Modo Oscuro</span>
                    </>
                )}
            </button>

            {/* Elementos ambientales de fondo - Gradientes Wittur */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#009ba4]/10 dark:bg-[#009ba4]/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-300/40 dark:bg-[#808084]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 relative z-10 transition-colors duration-300">
                {/* Acento superior de color de marca Wittur */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#009ba4] via-[#2ec0c7] to-[#808084]" />

                <div className="p-8 sm:p-10">
                    {/* Logotipo e Identidad */}
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/80 mb-4">
                            <img 
                                src={WitturLogo} 
                                alt="Wittur Group Logo" 
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            WITTUR MÉXICO
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs font-semibold uppercase tracking-wider">
                            Portal Central ICT & Caseta CCTV
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label 
                                htmlFor="nomina" 
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                            >
                                Número de Nómina
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="nomina"
                                    type="text"
                                    value={numeroNomina}
                                    onChange={(e) => setNumeroNomina(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#009ba4] focus:border-transparent transition-all duration-200 text-sm font-medium"
                                    placeholder="Ingresa tu ID (ej. ICT001)"
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Contenedor de error */}
                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                                <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#009ba4] hover:bg-[#007e86] active:scale-[0.99] shadow-lg shadow-[#009ba4]/25 transition-all duration-200 cursor-pointer ${
                                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Verificando credenciales...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Aviso de seguridad de planta */}
                    <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <Shield size={14} className="text-[#009ba4]" />
                        <span>Acceso restringido a colaboradores autorizados</span>
                    </div>
                </div>
            </div>
        </div>
    );
};