import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldAlert, Search, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReportesSeguridad = () => {
    const { user } = useAuth();
    // Verificamos si es administrador
    const isAdmin = user?.rol === 'Administrador';
    
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReportes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reportes-seguridad');
            setReportes(response.data.data || []);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportes();
    }, []);

    // Función para actualizar el estatus en tiempo real
    const handleStatusChange = async (id, nuevoEstatus) => {
        try {
            await api.put(`/reportes-seguridad/${id}`, { estatus: nuevoEstatus });
            // Actualizamos el estado localmente para no tener que recargar toda la tabla
            setReportes(reportes.map(rep => rep.id === id ? { ...rep, estatus: nuevoEstatus } : rep));
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al actualizar el estatus.");
        }
    };

    // Helper para los colores de las etiquetas
    const getStatusStyles = (estatus) => {
        switch(estatus) {
            case 'Resuelto': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            case 'En_Revision': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'Pendiente':
            default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        }
    };

    const filteredReportes = reportes.filter(rep => 
        rep.tipo_incidente?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rep.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={28} className="text-red-600" />
                        Bitácora de Seguridad
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Historial de incidentes y novedades reportadas desde caseta.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" placeholder="Buscar por tipo o descripción..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchReportes} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Actualizar datos">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-225">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">Fecha / Hora</th>
                                <th className="p-4 font-semibold">Cámara (Origen)</th>
                                <th className="p-4 font-semibold">Tipo Incidente</th>
                                <th className="p-4 font-semibold">Descripción</th>
                                <th className="p-4 font-semibold text-center">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Cargando bitácora...</td></tr>
                            ) : filteredReportes.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay reportes de seguridad registrados.</td></tr>
                            ) : (
                                filteredReportes.map((rep) => (
                                    <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {new Date(rep.fecha_incidente).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {rep.camara ? `${rep.camara.nombre_camara} (${rep.camara.ubicacion})` : `Cámara ID: ${rep.camara_id}`}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-red-600 dark:text-red-400">
                                            {rep.tipo_incidente}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate" title={rep.descripcion}>
                                            {rep.descripcion}
                                        </td>
                                        <td className="p-4 text-center">
                                            {isAdmin ? (
                                                <select
                                                    value={rep.estatus || 'Pendiente'}
                                                    onChange={(e) => handleStatusChange(rep.id, e.target.value)}
                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border outline-none cursor-pointer appearance-none text-center shadow-sm transition-colors ${getStatusStyles(rep.estatus)}`}
                                                >
                                                    <option value="Pendiente" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Pendiente</option>
                                                    <option value="En_Revision" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">En Revisión</option>
                                                    <option value="Resuelto" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Resuelto</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyles(rep.estatus)}`}>
                                                    {rep.estatus?.replace('_', ' ') || 'Pendiente'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};