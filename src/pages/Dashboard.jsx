import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
    Activity, Ticket, CheckCircle, VideoOff, Cctv as CctvIcon, 
    ShieldAlert, PlusCircle, ArrowUpRight, Calendar, Sparkles
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { StatCard } from '../components/StatCard';

export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Identificadores de Rol
    const isAdmin = user?.rol === 'Administrador';
    const isSeguridad = user?.rol === 'Seguridad';
    
    const [dashboardData, setDashboardData] = useState({
        kpis: { tickets_activos: 0, tickets_resueltos: 0, camaras_offline: 0, camaras_total: 0 },
        graficas: { tickets_por_estatus: [], tickets_por_dia: [] }
    });
    const [loading, setLoading] = useState(true);

    // ==========================================
    // VARIABLES DINÁMICAS SEGÚN EL ROL
    // ==========================================
    const tituloActivos = isSeguridad ? 'Reportes Activos' : 'Tickets Activos';
    const tituloResueltos = isSeguridad ? 'Reportes Resueltos' : 'Tickets Resueltos';
    const tituloDonut = isSeguridad ? 'Distribución de Reportes por Estatus' : 'Distribución de Tickets por Estatus';
    const tituloBarras = isSeguridad ? 'Tendencia de Reportes (Últimos 7 días)' : 'Tendencia de Tickets (Últimos 7 días)';
    const mensajeVacioBarras = isSeguridad ? 'No se registraron reportes en los últimos 7 días.' : 'No se reportaron tickets en los últimos 7 días.';
    const nombreBarra = isSeguridad ? 'Reportes Creados' : 'Tickets Creados';
    const IconoPrincipal = isSeguridad ? ShieldAlert : Ticket;

    let subtituloHeader = 'Resumen del estado de tus reportes de soporte técnico.';
    if (isAdmin) subtituloHeader = 'Resumen general de la infraestructura y atención técnica.';
    if (isSeguridad) subtituloHeader = 'Resumen del estado de tus reportes de seguridad en caseta.';

    useEffect(() => {
        const controller = new AbortController();
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/dashboard/metricas', { signal: controller.signal });
                setDashboardData(response.data.data);
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error("Error al cargar métricas:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
        return () => controller.abort();
    }, []);

    // Colores corporativos Wittur para la gráfica circular
    const COLORS = {
        'Abierto': '#f59e0b',
        'En_Progreso': '#009ba4',      // Wittur Teal
        'Esperando_Piezas': '#8b5cf6',
        'Resuelto': '#10b981',
        'Cerrado': '#808084',          // Wittur Gray
        'Pendiente': '#f59e0b',
        'En_Revision': '#009ba4'       // Wittur Teal
    };

    // Formateador de fecha corto (ej. "2026-09-02" -> "02 sep")
    const formatearFecha = (fechaString) => {
        if (!fechaString) return '';
        const fecha = new Date(fechaString + 'T00:00:00'); 
        return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const fechaHoy = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-28 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
                    <div className="h-80 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative font-sans">
            {/* HERO BANNER DE BIENVENIDA */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-[#0e4449] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#009ba4]/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2ec0c7] uppercase tracking-wider mb-2">
                            <Calendar size={14} />
                            <span className="capitalize">{fechaHoy}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            ¡Bienvenido, {user?.nombre_completo?.split(' ')[0] || (isSeguridad ? 'Oficial' : 'Usuario')}!
                        </h2>
                        <p className="text-slate-300 text-sm mt-1.5 leading-relaxed font-normal">
                            {subtituloHeader}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {!isSeguridad && (
                            <button
                                onClick={() => navigate('/tickets')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009ba4] hover:bg-[#007e86] text-white text-xs font-bold shadow-md shadow-[#009ba4]/30 transition-all cursor-pointer"
                            >
                                <PlusCircle size={16} />
                                <span>{isAdmin ? 'Ver Tickets' : 'Nuevo Ticket'}</span>
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/inventario')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                            >
                                <span>Ver Inventario</span>
                                <ArrowUpRight size={15} />
                            </button>
                        )}
                        {isSeguridad && (
                            <button
                                onClick={() => navigate('/caseta')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009ba4] hover:bg-[#007e86] text-white text-xs font-bold shadow-md shadow-[#009ba4]/30 transition-all cursor-pointer"
                            >
                                <span>Abrir Monitor Caseta</span>
                                <ArrowUpRight size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* FILA 1: KPIs CON StatCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title={tituloActivos}
                    value={dashboardData.kpis.tickets_activos}
                    subtitle="Pendientes de atención"
                    icon={IconoPrincipal}
                    colorScheme="amber"
                    onClick={() => navigate(isSeguridad ? '/reportes-seguridad' : '/tickets')}
                />

                <StatCard 
                    title={tituloResueltos}
                    value={dashboardData.kpis.tickets_resueltos}
                    subtitle="Atendidos con éxito"
                    icon={CheckCircle}
                    colorScheme="emerald"
                    onClick={() => navigate(isSeguridad ? '/reportes-seguridad' : '/tickets')}
                />

                {isAdmin && (
                    <>
                        <StatCard 
                            title="Cámaras Offline"
                            value={dashboardData.kpis.camaras_offline}
                            subtitle={dashboardData.kpis.camaras_offline > 0 ? "Requieren revisión técnica" : "Todas en línea"}
                            icon={VideoOff}
                            colorScheme={dashboardData.kpis.camaras_offline > 0 ? "rose" : "teal"}
                            onClick={() => navigate('/cctv')}
                        />

                        <StatCard 
                            title="Total de Cámaras"
                            value={dashboardData.kpis.camaras_total}
                            subtitle="Red de vigilancia activa"
                            icon={CctvIcon}
                            colorScheme="teal"
                            onClick={() => navigate('/cctv')}
                        />
                    </>
                )}
            </div>

            {/* FILA 2: GRÁFICAS DE ANÁLISIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gráfica 1: Distribución por Estatus */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {tituloDonut}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Proporción según el ciclo de vida
                            </p>
                        </div>
                    </div>
                    
                    <div className="h-72">
                        {dashboardData.graficas.tickets_por_estatus?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dashboardData.graficas.tickets_por_estatus}
                                        cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4}
                                        dataKey="total" nameKey="estatus"
                                    >
                                        {dashboardData.graficas.tickets_por_estatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.estatus] || '#808084'} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [value, name.replace('_', ' ')]}
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: '1px solid rgba(128,128,132,0.2)', 
                                            backgroundColor: 'rgba(24, 28, 32, 0.95)',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend formatter={(value) => value.replace('_', ' ')} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No hay datos suficientes para generar la gráfica.
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfica 2: Tendencia (Últimos 7 días) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {tituloBarras}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Actividad reportada por día
                            </p>
                        </div>
                    </div>

                    <div className="h-72">
                        {dashboardData.graficas.tickets_por_dia?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.graficas.tickets_por_dia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                                    <XAxis 
                                        dataKey="fecha" 
                                        tickFormatter={formatearFecha} 
                                        tick={{ fontSize: 11, fill: '#808084' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        allowDecimals={false} 
                                        tick={{ fontSize: 11, fill: '#808084' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <Tooltip 
                                        labelFormatter={formatearFecha}
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: '1px solid rgba(128,128,132,0.2)', 
                                            backgroundColor: 'rgba(24, 28, 32, 0.95)',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        fill="#009ba4" 
                                        radius={[6, 6, 0, 0]} 
                                        name={nombreBarra} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                {mensajeVacioBarras}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};