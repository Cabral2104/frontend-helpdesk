import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Ticket, PcCase, Cctv, LogOut, Sun, Moon, 
    UserCircle, Menu, X, MonitorPlay, ShieldAlert, Users, Download, 
    Bell, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import WitturLogo from '../assets/logo_wittur.png';
import api from '../api/axios';
import { getCached } from '../api/cache';

// Precarga de módulos en hover para navegación instantánea a 60 FPS
const prefetchMap = {
    '/dashboard': () => import('../pages/Dashboard'),
    '/tickets': () => import('../pages/Tickets'),
    '/usuarios': () => import('../pages/Usuarios'),
    '/exportar-reportes': () => import('../pages/Reportes'),
    '/inventario': () => import('../pages/Inventario'),
    '/cctv': () => import('../pages/Cctv'),
    '/caseta': () => import('../pages/Caseta'),
    '/reportes-seguridad': () => import('../pages/ReportesSeguridad'),
};

const handlePrefetch = (path) => {
    if (prefetchMap[path]) {
        prefetchMap[path]();
    }
};

const routeTitles = {
    '/dashboard': 'Tablero de Control',
    '/tickets': 'Gestión de Tickets de Soporte',
    '/usuarios': 'Administración de Usuarios',
    '/exportar-reportes': 'Centro de Exportación de Datos',
    '/inventario': 'Inventario de Equipos ICT',
    '/cctv': 'Infraestructura CCTV & Cámaras',
    '/caseta': 'Monitor de Vigilancia - Caseta',
    '/reportes-seguridad': 'Bitácora de Incidentes de Seguridad',
};

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
    const [departamentosMap, setDepartamentosMap] = useState({});
    
    // --- ESTADOS NOTIFICACIONES ---
    const [notificaciones, setNotificaciones] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const notifRef = useRef(null);

    // Cargar catálogo de departamentos dinámico
    useEffect(() => {
        const fetchDeptos = async () => {
            try {
                const res = await getCached('/departamentos');
                if (res && res.data) {
                    const map = {};
                    res.data.forEach(d => { map[d.id] = d.nombre; });
                    setDepartamentosMap(map);
                }
            } catch (err) {
                console.error("No se pudo cargar el catálogo de departamentos:", err);
            }
        };
        fetchDeptos();
    }, []);

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

            const lastSeen = localStorage.getItem('lastSeenNotif');
            if (data.length > 0) {
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
            localStorage.setItem('lastSeenNotif', new Date().toISOString());
            setHasUnread(false);
        }
    };

    const handleNotifClick = (ruta) => {
        setIsNotifOpen(false);
        navigate(ruta);
    };

    const getPriorityColor = (prioridad) => {
        if (prioridad === 'Alta') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
        if (prioridad === 'Media') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        return 'bg-[#009ba4]/10 text-[#007e86] dark:text-[#2ec0c7] border-[#009ba4]/30';
    };

    const getLinkStyles = (path) => {
        const isActive = location.pathname === path;
        return `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive 
            ? 'bg-[#009ba4] text-white shadow-md shadow-[#009ba4]/25' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
        }`;
    };

    const getDepartamentoNombre = (id) => {
        if (departamentosMap[id]) return departamentosMap[id];
        const fallbacks = {
            1: "ICT / Sistemas", 2: "Recursos Humanos", 3: "Producción", 4: "Calidad",
            5: "Mantenimiento", 6: "Logística", 7: "Industrialización", 8: "Ingeniería",
            9: "Compras", 10: "Gerencia", 11: "Almacén", 12: "Enfermería"
        };
        return fallbacks[id] || user?.rol || 'General'; 
    };

    const currentYear = new Date().getFullYear();
    const currentSectionTitle = routeTitles[location.pathname] || 'Portal Operativo';

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Branding Wittur */}
                <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                            <img 
                                src={WitturLogo} 
                                alt="Wittur Logo" 
                                className="h-full w-auto object-contain" 
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">WITTUR</h2>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#009ba4]/15 text-[#009ba4] dark:bg-[#009ba4]/25 uppercase tracking-wider">ICT</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Helpdesk & Seguridad</p>
                        </div>
                    </div>
                    <button 
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Menú de Navegación */}
                <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
                    <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Principal
                    </p>
                    <Link to="/dashboard" onMouseEnter={() => handlePrefetch('/dashboard')} className={getLinkStyles('/dashboard')}>
                        <LayoutDashboard size={18} className="shrink-0" />
                        <span>Tablero</span>
                    </Link>
                    <Link to="/tickets" onMouseEnter={() => handlePrefetch('/tickets')} className={getLinkStyles('/tickets')}>
                        <Ticket size={18} className="shrink-0" />
                        <span>Gestión de Tickets</span>
                    </Link>

                    {isAdmin && (
                        <>
                            <Link to="/usuarios" onMouseEnter={() => handlePrefetch('/usuarios')} className={getLinkStyles('/usuarios')}>
                                <Users size={18} className="shrink-0" />
                                <span>Usuarios</span>
                            </Link>
                            <Link to="/exportar-reportes" onMouseEnter={() => handlePrefetch('/exportar-reportes')} className={getLinkStyles('/exportar-reportes')}>
                                <Download size={18} className="shrink-0" />
                                <span>Exportar Reportes</span>
                            </Link>
                        </>
                    )}

                    {canViewInfraestructura && (
                        <>
                            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">
                                Infraestructura TI
                            </p>
                            <Link to="/inventario" onMouseEnter={() => handlePrefetch('/inventario')} className={getLinkStyles('/inventario')}>
                                <PcCase size={18} className="shrink-0" />
                                <span>Inventario Equipos</span>
                            </Link>
                            <Link to="/cctv" onMouseEnter={() => handlePrefetch('/cctv')} className={getLinkStyles('/cctv')}>
                                <Cctv size={18} className="shrink-0" />
                                <span>Cámaras CCTV</span>
                            </Link>
                        </>
                    )}

                    {canViewSeguridad && (
                        <>
                            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">
                                Seguridad Patrimonial
                            </p>
                            <Link to="/caseta" onMouseEnter={() => handlePrefetch('/caseta')} className={getLinkStyles('/caseta')}>
                                <MonitorPlay size={18} className="shrink-0" />
                                <span>Monitor Caseta</span>
                            </Link>
                            <Link to="/reportes-seguridad" onMouseEnter={() => handlePrefetch('/reportes-seguridad')} className={getLinkStyles('/reportes-seguridad')}>
                                <ShieldAlert size={18} className="shrink-0" />
                                <span>Bitácora de Incidentes</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Perfil del Usuario en Sidebar */}
                <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-2.5 shadow-2xs">
                        <div className="h-9 w-9 rounded-lg bg-[#009ba4]/15 text-[#009ba4] dark:bg-[#009ba4]/25 flex items-center justify-center font-bold text-sm shrink-0">
                            {user?.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {user?.nombre_completo || 'Usuario'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-semibold text-[#009ba4] dark:text-[#2ec0c7] truncate">
                                    {user?.rol || 'Operador'}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {getDepartamentoNombre(user?.departamento_id)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl transition-colors border border-rose-200/80 dark:border-rose-900/40 cursor-pointer"
                    >
                        <LogOut size={14} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* HEADER SUPERIOR */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex justify-between items-center transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <button 
                            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {currentSectionTitle}
                                </h1>
                                <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    En Línea
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* BOTÓN Y PANEL DE NOTIFICACIONES */}
                        {isAdmin && (
                            <div className="relative" ref={notifRef}>
                                <button 
                                    onClick={toggleNotifPanel}
                                    className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                                    title="Notificaciones del sistema"
                                >
                                    <Bell size={18} />
                                    {hasUnread && (
                                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                                        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Bell size={16} className="text-[#009ba4]" />
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                    Notificaciones Recientes
                                                </h3>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-400">
                                                {notificaciones.length} eventos
                                            </span>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {notificaciones.length === 0 ? (
                                                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                                    No hay notificaciones pendientes.
                                                </div>
                                            ) : (
                                                notificaciones.map((notif) => (
                                                    <button 
                                                        key={notif.id}
                                                        onClick={() => handleNotifClick(notif.ruta)}
                                                        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col gap-1.5 cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                {notif.titulo}
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${getPriorityColor(notif.prioridad)}`}>
                                                                {notif.prioridad}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                            {notif.descripcion}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(notif.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TOGGLE MODO OSCURO / CLARO */}
                        <button 
                            onClick={() => setDarkMode(!darkMode)}
                            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                            {darkMode ? (
                                <>
                                    <Sun size={15} className="text-amber-400" />
                                    <span className="hidden sm:inline">Claro</span>
                                </>
                            ) : (
                                <>
                                    <Moon size={15} className="text-[#009ba4]" />
                                    <span className="hidden sm:inline">Oscuro</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* CONTENIDO DE LA PÁGINA */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>

                {/* FOOTER CORPORATIVO */}
                <footer className="py-3.5 px-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xs shrink-0 gap-2">
                    <div className="font-medium flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">&copy; {currentYear} Wittur México</span>
                        <span>•</span>
                        <span>Elevator Components & Systems</span>
                    </div>
                    
                    <div className="flex items-center gap-3 font-medium">
                        <span className="text-[#009ba4] font-semibold">Departamento ICT</span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span>Versión 2.0 Operativa</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};