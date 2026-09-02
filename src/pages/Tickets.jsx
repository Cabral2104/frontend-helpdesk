import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Eye, RefreshCw, X, Save, CheckCircle, Pencil, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Tickets = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador';

    // Estados Globales
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados de Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortOrder, setSortOrder] = useState('desc'); 
    
    // Estados de Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createFormData, setCreateFormData] = useState({ titulo: '', descripcion: '', prioridad: 'Media', categoria_incidencia_id: 1 });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, descripcion_falla: '' });

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminUpdateData, setAdminUpdateData] = useState({ estatus: '', comentario_cambio: '' });

    // ================= FUNCIONES API ================= //

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tickets?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}`);
            setTickets(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (error) {
            console.error("Error al cargar los tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [currentPage, sortOrder]);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tickets', createFormData);
            setIsCreateModalOpen(false);
            setCreateFormData({ titulo: '', descripcion: '', prioridad: 'Media', categoria_incidencia_id: 1 });
            setCurrentPage(1); 
            fetchTickets(); 
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (ticket) => {
        setEditFormData({ id: ticket.id, descripcion_falla: ticket.descripcion_falla });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/tickets/${editFormData.id}`, { descripcion_falla: editFormData.descripcion_falla });
            setIsEditModalOpen(false);
            fetchTickets();
        } catch (error) {
            alert("Error al actualizar el ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewClick = async (ticketId) => {
        try {
            const response = await api.get(`/tickets/${ticketId}`);
            setSelectedTicket(response.data.data);
            setAdminUpdateData({ estatus: response.data.data.estatus, comentario_cambio: '' });
            setIsViewModalOpen(true);
        } catch (error) {
            alert("No se pudo cargar la información detallada del ticket.");
        }
    };

    const handleQuickResolve = async (ticketId) => {
        if (!window.confirm('¿Estás seguro de marcar este ticket como Resuelto?')) return;
        try {
            await api.put(`/tickets/${ticketId}`, { estatus: 'Resuelto', comentario_cambio: 'Cierre rápido desde el panel principal.' });
            fetchTickets();
        } catch (error) {
            alert("Ocurrió un error al intentar cerrar el ticket.");
        }
    };

    const handleAdminUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/tickets/${selectedTicket.id}`, adminUpdateData);
            const response = await api.get(`/tickets/${selectedTicket.id}`);
            setSelectedTicket(response.data.data);
            setAdminUpdateData({ estatus: response.data.data.estatus, comentario_cambio: '' });
            fetchTickets();
        } catch (error) {
            alert("Error al actualizar el estatus del ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= DISEÑO VISUAL ================= //

    const getStatusBadge = (status) => {
        const styles = {
            'Abierto': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            'En Progreso': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            'Resuelto': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        };
        const defaultStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || defaultStyle}`}>{status || 'Abierto'}</span>;
    };

    const filteredTickets = tickets.filter(ticket => 
        ticket.descripcion_falla?.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.id.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isAdmin ? 'Gestión Global de Tickets' : 'Mis Tickets de Soporte'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isAdmin ? 'Administra y resuelve los reportes de toda la planta.' : 'Crea y da seguimiento a tus reportes de fallas.'}
                    </p>
                </div>
                {!isAdmin && (
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                        <Plus size={18} /><span>Nuevo Ticket</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                {/* Barra de herramientas: Búsqueda, Filtro y Refresh */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" placeholder="Buscar en esta página..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc">Más recientes primero</option>
                            <option value="asc">Más antiguos primero</option>
                        </select>
                    </div>
                    <button onClick={fetchTickets} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-175">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Fecha</th>
                                <th className="p-4 font-semibold">Asunto</th>
                                <th className="p-4 font-semibold">Prioridad</th>
                                <th className="p-4 font-semibold">Estatus</th>
                                <th className="p-4 font-semibold">Último Mensaje</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron tickets en esta página.</td></tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">#{ticket.id}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(ticket.date_created).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-37.5" title={ticket.descripcion_falla}>{ticket.descripcion_falla}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{ticket.prioridad}</td>
                                        <td className="p-4">{getStatusBadge(ticket.estatus)}</td>
                                        <td className="p-4 text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-37.5" title={ticket.historial?.[0]?.comentario_cambio || 'Sin comentarios'}>
                                            {ticket.historial?.[0]?.comentario_cambio || 'Sin comentarios'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleViewClick(ticket.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 transition-colors" title="Ver Detalles">
                                                    <Eye size={18} />
                                                </button>
                                                {!isAdmin && ticket.estatus === 'Abierto' && (
                                                    <button onClick={() => handleEditClick(ticket)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 transition-colors" title="Editar Ticket">
                                                        <Pencil size={18} />
                                                    </button>
                                                )}
                                                {isAdmin && ticket.estatus !== 'Resuelto' && (
                                                    <button onClick={() => handleQuickResolve(ticket.id)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1 transition-colors" title="Cerrar Ticket">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Anterior
                    </button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Siguiente
                    </button>
                </div>
            </div>

            {/* MODAL 1: Crear Ticket */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Nuevo Ticket</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Asunto breve</label>
                                <input required type="text" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={createFormData.titulo} onChange={(e) => setCreateFormData({...createFormData, titulo: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                <textarea required rows="4" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={createFormData.descripcion} onChange={(e) => setCreateFormData({...createFormData, descripcion: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioridad</label>
                                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={createFormData.prioridad} onChange={(e) => setCreateFormData({...createFormData, prioridad: e.target.value})}>
                                    <option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"><Save size={18} /><span>Guardar</span></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Editar Ticket */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Corregir Reporte #{editFormData.id}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción del problema</label>
                                <textarea required rows="5" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none" value={editFormData.descripcion_falla} onChange={(e) => setEditFormData({...editFormData, descripcion_falla: e.target.value})}></textarea>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold"><Save size={18} /><span>Actualizar</span></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Ver Detalles */}
            {isViewModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ticket #{selectedTicket.id}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Reportado por: {selectedTicket.usuario_reporta?.nombre_completo || 'Desconocido'}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Estatus</p>
                                    <div className="mt-1">{getStatusBadge(selectedTicket.estatus)}</div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Prioridad</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedTicket.prioridad}</p>
                                </div>
                                <div className="col-span-2 mt-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Descripción Original</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedTicket.descripcion_falla}</p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mt-2">
                                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-3">Gestión de Ticket</h4>
                                    <form onSubmit={handleAdminUpdateSubmit} className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cambiar Estatus</label>
                                            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={adminUpdateData.estatus} onChange={(e) => setAdminUpdateData({...adminUpdateData, estatus: e.target.value})}>
                                                <option value="Abierto">Abierto</option>
                                                <option value="En_Progreso">En Progreso</option>
                                                <option value="Esperando_Piezas">Esperando Piezas</option>
                                                <option value="Resuelto">Resuelto</option>
                                                <option value="Cerrado">Cerrado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Comentario (Opcional)</label>
                                            <textarea rows="2" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500" placeholder="Justifica el cambio de estatus o da retroalimentación al usuario..." value={adminUpdateData.comentario_cambio} onChange={(e) => setAdminUpdateData({...adminUpdateData, comentario_cambio: e.target.value})}></textarea>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button type="submit" disabled={isSubmitting || adminUpdateData.estatus === selectedTicket.estatus} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"><Save size={16} />{isSubmitting ? 'Actualizando...' : 'Actualizar Ticket'}</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <Clock size={16} /> Historial de Actividad
                                </h4>
                                <div className="space-y-4">
                                    {selectedTicket.historial?.map((evento) => (
                                        <div key={evento.id} className="flex gap-4">
                                            <div className="w-2 bg-blue-200 dark:bg-blue-900/50 rounded-full shrink-0"></div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(evento.date_created).toLocaleString()}</p>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{evento.comentario_cambio}</p>
                                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                                    {evento.estatus_anterior} ➔ {evento.estatus_nuevo}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};