import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldAlert, Search, RefreshCw, Pencil, Trash2, X, Save, UserCircle } from 'lucide-react'; // Agregué el icono UserCircle
import { useAuth } from '../context/AuthContext';

export const ReportesSeguridad = () => {
    const { user } = useAuth();
    // Verificamos si es administrador
    const isAdmin = user?.rol === 'Administrador';
    
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados de Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortOrder, setSortOrder] = useState('desc');

    // Estados para el Modal de Edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        tipo_incidente: '',
        descripcion: '',
        estatus: 'Pendiente'
    });

    const fetchReportes = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reportes-seguridad?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}`);
            setReportes(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportes();
    }, [currentPage, sortOrder]);

    // Actualización rápida de estatus (Solo para Admin desde la tabla)
    const handleStatusChange = async (id, nuevoEstatus) => {
        try {
            await api.put(`/reportes-seguridad/${id}`, { estatus: nuevoEstatus });
            setReportes(reportes.map(rep => rep.id === id ? { ...rep, estatus: nuevoEstatus } : rep));
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al actualizar el estatus.");
        }
    };

    // Abrir modal con los datos del reporte seleccionado
    const openEditModal = (rep) => {
        setFormData({
            id: rep.id,
            tipo_incidente: rep.tipo_incidente || '',
            descripcion: rep.descripcion || '',
            estatus: rep.estatus || 'Pendiente'
        });
        setIsModalOpen(true);
    };

    // Guardar edición desde el modal
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/reportes-seguridad/${formData.id}`, formData);
            setIsModalOpen(false);
            fetchReportes();
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al guardar los cambios.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Soft Delete del reporte
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este reporte de la bitácora?')) return;
        try {
            await api.delete(`/reportes-seguridad/${id}`);
            fetchReportes();
        } catch (error) {
            alert("Error al eliminar el reporte.");
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
        rep.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // También permitimos al admin buscar por nombre del guardia
        (isAdmin && rep.guardia?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={28} className="text-red-600" />
                        Bitácora de Seguridad
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Historial de incidentes y novedades reportadas desde caseta.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" placeholder={isAdmin ? "Buscar por incidente, descripción o guardia..." : "Buscar por tipo o descripción..."}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select 
                            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc">Más recientes primero</option>
                            <option value="asc">Más antiguos primero</option>
                        </select>
                    </div>

                    <button onClick={fetchReportes} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Actualizar datos">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">Fecha / Hora</th>
                                {/* NUEVA COLUMNA: Solo visible para Administrador */}
                                {isAdmin && <th className="p-4 font-semibold">Reportado Por</th>}
                                <th className="p-4 font-semibold">Cámara (Origen)</th>
                                <th className="p-4 font-semibold">Tipo Incidente</th>
                                <th className="p-4 font-semibold">Descripción</th>
                                <th className="p-4 font-semibold text-center">Estatus</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={isAdmin ? "7" : "6"} className="p-8 text-center text-slate-500">Cargando bitácora...</td></tr>
                            ) : filteredReportes.length === 0 ? (
                                <tr><td colSpan={isAdmin ? "7" : "6"} className="p-8 text-center text-slate-500">No hay reportes de seguridad registrados.</td></tr>
                            ) : (
                                filteredReportes.map((rep) => {
                                    const canEdit = isAdmin || rep.usuario_reporta_id === user?.id || rep.user_create_id === user?.id;

                                    return (
                                        <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {new Date(rep.fecha_incidente || rep.date_created).toLocaleString()}
                                            </td>
                                            
                                            {/* NUEVO DATO: Nombre del guardia, solo visible para Administrador */}
                                            {isAdmin && (
                                                <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle size={16} className="text-slate-400" />
                                                        <span className="font-semibold">{rep.guardia?.nombre_completo || 'Desconocido'}</span>
                                                    </div>
                                                </td>
                                            )}

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
                                            <td className="p-4">
                                                {canEdit && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openEditModal(rep)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 transition-colors" title="Editar Reporte">
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(rep.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors" title="Eliminar Reporte">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && reportes.length > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1} 
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Anterior
                        </button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages} 
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Editar Reporte
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Incidente</label>
                                <input 
                                    required 
                                    type="text" 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" 
                                    value={formData.tipo_incidente} 
                                    onChange={(e) => setFormData({...formData, tipo_incidente: e.target.value})} 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                <textarea 
                                    required 
                                    rows="4"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none" 
                                    value={formData.descripcion} 
                                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estatus del Reporte</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                                    value={formData.estatus} 
                                    onChange={(e) => setFormData({...formData, estatus: e.target.value})}
                                    disabled={!isAdmin} 
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En_Revision">En Revisión</option>
                                    <option value="Resuelto">Resuelto</option>
                                </select>
                                {!isAdmin && <p className="text-xs text-slate-500 mt-1">Solo el administrador de ICT puede cambiar el estatus.</p>}
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                    <Save size={18} /><span>Actualizar Reporte</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};