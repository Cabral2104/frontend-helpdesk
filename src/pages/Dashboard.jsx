import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Ticket, CheckCircle, VideoOff, Cctv as CctvIcon, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const Dashboard = () => {
    const { user } = useAuth();
    
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
    const IconoPrincipal = isSeguridad ? ShieldAlert : Ticket; // Cambia el icono de la tarjeta

    let subtituloHeader = 'Resumen del estado de tus reportes de soporte técnico.';
    if (isAdmin) subtituloHeader = 'Resumen general de la infraestructura y atención técnica.';
    if (isSeguridad) subtituloHeader = 'Resumen del estado de tus reportes de seguridad en caseta.';

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/dashboard/metricas');
                setDashboardData(response.data.data);
            } catch (error) {
                console.error("Error al cargar métricas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-slate-500">Cargando métricas operativas...</div>;
    }

    // Colores para la gráfica circular (Incluye los estatus de TI y los de Seguridad)
    const COLORS = {
        'Abierto': '#f59e0b',
        'En_Progreso': '#3b82f6',
        'Esperando_Piezas': '#8b5cf6',
        'Resuelto': '#10b981',
        'Cerrado': '#64748b',
        // Estatus exclusivos de Seguridad
        'Pendiente': '#f59e0b',
        'En_Revision': '#3b82f6'
    };

    // Formateador de fecha corto (ej. "2026-09-02" -> "02 sep")
    const formatearFecha = (fechaString) => {
        if (!fechaString) return '';
        const fecha = new Date(fechaString + 'T00:00:00'); 
        return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6 relative">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-blue-600" size={28} />
                    ¡Hola, {user?.nombre_completo?.split(' ')[0] || (isSeguridad ? 'Guardia' : 'Operador')}!
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {subtituloHeader}
                </p>
            </div>

            {/* Fila 1: KPIs (Tarjetas de resumen) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <IconoPrincipal size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{tituloActivos}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData.kpis.tickets_activos}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{tituloResueltos}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData.kpis.tickets_resueltos}</h3>
                    </div>
                </div>

                {/* Solo el Administrador ve las métricas de las cámaras */}
                {isAdmin && (
                    <>
                        <div className={`p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${dashboardData.kpis.camaras_offline > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                            <div className={`p-3 rounded-lg ${dashboardData.kpis.camaras_offline > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                <VideoOff size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cámaras Offline</p>
                                <h3 className={`text-2xl font-bold ${dashboardData.kpis.camaras_offline > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{dashboardData.kpis.camaras_offline}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><CctvIcon size={24} /></div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Cámaras</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData.kpis.camaras_total}</h3>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Fila 2: Gráficas de Análisis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gráfica 1: Distribución por Estatus */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{tituloDonut}</h3>
                    <div className="h-72">
                        {dashboardData.graficas.tickets_por_estatus?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dashboardData.graficas.tickets_por_estatus}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}
                                        dataKey="total" nameKey="estatus" label
                                    >
                                        {dashboardData.graficas.tickets_por_estatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.estatus] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [value, name.replace('_', ' ')]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend formatter={(value) => value.replace('_', ' ')} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                No hay datos suficientes para generar la gráfica.
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfica 2: Tendencia (Últimos 7 días) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{tituloBarras}</h3>
                    <div className="h-72">
                        {dashboardData.graficas.tickets_por_dia?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.graficas.tickets_por_dia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="fecha" 
                                        tickFormatter={formatearFecha} 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        allowDecimals={false} 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <Tooltip 
                                        labelFormatter={formatearFecha}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={nombreBarra} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                {mensajeVacioBarras}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};