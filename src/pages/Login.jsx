import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
    const [numeroNomina, setNumeroNomina] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación básica frontal
        if (!numeroNomina.trim()) {
            setError('Por favor, ingresa tu número de nómina.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        // Llamamos a la función centralizada de nuestro contexto
        const result = await login(numeroNomina);

        if (result.success) {
            // Si el login es exitoso, lo enviamos al panel de control
            navigate('/dashboard');
        } else {
            // Si falla, mostramos el error que nos devolvió Laravel
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors duration-300 p-4">
            
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-t-4 border-blue-600 dark:border-blue-500 transition-colors duration-300">
                <div className="p-8">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Wittur México
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                            Portal de Soporte ICT y Gestión CCTV
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div>
                            <label 
                                htmlFor="nomina" 
                                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Número de Nómina
                            </label>
                            <input
                                id="nomina"
                                type="text"
                                value={numeroNomina}
                                onChange={(e) => setNumeroNomina(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                placeholder="Ej. ICT001"
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                        </div>

                        {/* Contenedor de mensajes de error */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
                        </button>
                    </form>
                    
                </div>
            </div>
            
        </div>
    );
};