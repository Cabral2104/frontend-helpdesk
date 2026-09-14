import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, PcCase, Cctv, LogOut, Sun, Moon, UserCircle, Menu, X, MonitorPlay, ShieldAlert, Users } from 'lucide-react';

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // VALIDACIONES DE PERMISOS CORRECTAS
    const isAdmin = user?.rol === 'Administrador';
    const isSeguridad = user?.rol === 'Seguridad';
    
    // TI (Admin) ve Infraestructura completa. Guardia ve Seguridad.
    const canViewInfraestructura = isAdmin; 
    const canViewSeguridad = isAdmin || isSeguridad;

    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const getLinkStyles = (path) => {
        const isActive = location.pathname === path;
        return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`;
    };

    const getDepartamentoNombre = (id) => {
        const departamentos = {
            1: "ICT / Sistemas", 2: "Recursos Humanos", 3: "Producción", 4: "Calidad",
            5: "Mantenimiento", 6: "Logística", 7: "Industrialización", 8: "Ingeniería",
            9: "Compras", 10: "Gerencia", 11: "Almacén", 12: "Enfermería"
        };
        return departamentos[id] || user?.rol; // Muestra el rol como respaldo si no encuentra el ID
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                
                <div className="p-6 border-b border-slate-200 dark:border-slate-800/60 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/30">
                            <PcCase size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Wittur ICT</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Helpdesk & Monitor</p>
                        </div>
                    </div>
                    <button 
                        className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
                    <Link to="/dashboard" className={getLinkStyles('/dashboard')}>
                        <LayoutDashboard size={18} />
                        Tablero
                    </Link>
                    <Link to="/tickets" className={getLinkStyles('/tickets')}>
                        <Ticket size={18} />
                        Gestión de Tickets
                    </Link>

                    {/* Solo el Administrador puede ver y gestionar usuarios */}
                    {isAdmin && (
                        <Link to="/usuarios" className={getLinkStyles('/usuarios')}>
                            <Users size={18} />
                            Gestión de Usuarios
                        </Link>
                    )}

                    {/* INFRAESTRUCTURA: Estrictamente para Administrador */}
                    {canViewInfraestructura && (
                        <>
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Infraestructura</p>
                            <Link to="/inventario" className={getLinkStyles('/inventario')}>
                                <PcCase size={18} />
                                Inventario
                            </Link>
                            <Link to="/cctv" className={getLinkStyles('/cctv')}>
                                <Cctv size={18} />
                                Cámaras CCTV
                            </Link>
                        </>
                    )}

                    {/* SEGURIDAD: Para Administrador y Seguridad */}
                    {canViewSeguridad && (
                        <>
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Seguridad</p>
                            <Link to="/caseta" className={getLinkStyles('/caseta')}>
                                <MonitorPlay size={18} />
                                Monitor Caseta
                            </Link>
                            <Link to="/reportes-seguridad" className={getLinkStyles('/reportes-seguridad')}>
                                <ShieldAlert size={18} />
                                Bitácora de Seguridad
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <UserCircle size={32} className="text-slate-500 dark:text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.nombre_completo || 'Administrador'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {getDepartamentoNombre(user?.departamento_id)}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-400/10 dark:hover:bg-red-400/20 rounded-xl transition-colors border border-red-200 dark:border-red-400/20"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button 
                            className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">
                            Portal Operativo
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-300/50 dark:border-slate-700"
                    >
                        {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
                        <span className="hidden sm:inline">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};