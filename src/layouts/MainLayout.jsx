import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, PcCase, Cctv, LogOut, Sun, Moon, UserCircle, Menu, X, MonitorPlay, ShieldAlert, Users, Download, Bell } from 'lucide-react';
import WitturLogo from '../assets/logo_wittur.png';
import api from '../api/axios';

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const isAdmin = user?.rol === 'Administrador';
    const isSeguridad = user?.rol === 'Seguridad';
    const canViewInfraestructura = isAdmin; 
    const canViewSeguridad = isAdmin || isSeguridad;

    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- ESTADOS NOTIFICACIONES ---
    const [notificaciones, setNotificaciones] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const notifRef = useRef(null);

    // Aplicar Modo Oscuro
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

    // --- LÓGICA NOTIFICACIONES ---
    const fetchNotificaciones = async () => {
        try {
            const res = await api.get('/notificaciones');
            const data = res.data.data || [];
            setNotificaciones(data);

            // Verificar si hay algo más nuevo que la última vez que se abrió la campana
            const lastSeen = localStorage.getItem('lastSeenNotif');
            if (data.length > 0) {
                // Tomamos la fecha más reciente de la lista (aunque estén ordenadas por prioridad, buscamos la más nueva)
                const mostRecentDate = new Date(Math.max(...data.map(n => new Date(n.fecha))));
                if (!lastSeen || mostRecentDate > new Date(lastSeen)) {
                    setHasUnread(true);
                }
            }
        } catch (error) {
            console.error("Error cargando notificaciones", error);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchNotificaciones();
            const interval = setInterval(fetchNotificaciones, 300000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    // Cerrar panel si hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleNotifPanel = () => {
        setIsNotifOpen(!isNotifOpen);
        if (!isNotifOpen) {
            // Al abrir, marcamos como leídas guardando la hora actual
            localStorage.setItem('lastSeenNotif', new Date().toISOString());
            setHasUnread(false);
        }
    };

    const handleNotifClick = (ruta) => {
        setIsNotifOpen(false);
        navigate(ruta);
    };

    const getPriorityColor = (prioridad) => {
        if (prioridad === 'Alta') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        if (prioridad === 'Media') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    };

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
        return departamentos[id] || user?.rol; 
    };

    const currentYear = new Date().getFullYear();

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
                        <img 
                            src={WitturLogo} 
                            alt="Wittur Logo" 
                            className="h-10 w-auto object-contain" 
                        />
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

                    {isAdmin && (
                        <>
                            <Link to="/usuarios" className={getLinkStyles('/usuarios')}>
                                <Users size={18} />
                                Gestión de Usuarios
                            </Link>
                            <Link to="/exportar-reportes" className={getLinkStyles('/exportar-reportes')}>
                                <Download size={18} />
                                Exportar Datos
                            </Link>
                        </>
                    )}

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

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
                    
                    <div className="flex items-center gap-3">
                        {/* CONTENEDOR NOTIFICACIONES - SOLO PARA ADMINISTRADORES */}
                        {isAdmin && (
                            <div className="relative" ref={notifRef}>
                                <button 
                                    onClick={toggleNotifPanel}
                                    className="relative p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Bell size={20} />
                                    {hasUnread && (
                                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                    )}
                                </button>

                                {/* DROPDOWN NOTIFICACIONES */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones (7 Días)</h3>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notificaciones.length === 0 ? (
                                                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    No hay notificaciones recientes.
                                                </div>
                                            ) : (
                                                notificaciones.map((notif) => (
                                                    <button 
                                                        key={notif.id}
                                                        onClick={() => handleNotifClick(notif.ruta)}
                                                        className="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col gap-1"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.titulo}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getPriorityColor(notif.prioridad)}`}>
                                                                {notif.prioridad}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{notif.descripcion}</p>
                                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                                            {new Date(notif.fecha).toLocaleString()}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={() => setDarkMode(!darkMode)}
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-300/50 dark:border-slate-700"
                        >
                            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
                            <span className="hidden sm:inline">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </main>

                <footer className="mt-auto py-4 px-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 shrink-0">
                    <div className="font-medium">
                        &copy; {currentYear} Wittur México. Todos los derechos reservados.
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 sm:mt-0 font-medium">
                        <span>Departamento ICT</span>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                        <span>Versión 1.0.0</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};