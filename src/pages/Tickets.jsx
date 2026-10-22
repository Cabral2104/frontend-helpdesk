import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Plus, Search, Eye, RefreshCw, X, Save, CheckCircle, Pencil, 
    Clock, Filter, MessageSquare, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getCached } from '../api/cache';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';

export const Tickets = () => {
    const { user } = useAuth();
    const { toast, confirm } = useNotification();
    const isAdmin = user?.rol === 'Administrador';

    // Estados Globales
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    
    // Estados de Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc'); 
    
    // Estados de Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [createFormData, setCreateFormData] = useState({ titulo: '', descripcion: '', prioridad: 'Media', categoria_id: '' });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, descripcion_falla: '' });

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminUpdateData, setAdminUpdateData] = useState({ estatus: '', comentario_cambio: '' });

    // ================= FUNCIONES API ================= //

    const fetchTickets = async (signal = null) => {
        setLoading(true);
        try {
            const isSignal = signal && typeof signal.addEventListener === 'function';
            const response = await api.get(
                `/tickets?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}&search=${searchTerm}&categoria_id=${filterCategory}`,
                isSignal ? { signal } : {}
            );
            setTickets(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setTotalTickets(response.data.meta?.total || (response.data.data ? response.data.data.length : 0));
        } catch (error) {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                console.error("Error al cargar los tickets:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Efecto unificado: búsqueda con debounce, paginación/filtros inmediatos
    useEffect(() => {
        const controller = new AbortController();
        const delay = searchTerm ? 350 : 0;
        const timeoutId = setTimeout(() => {
            fetchTickets(controller.signal);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm, filterCategory, sortOrder, currentPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (e) => {
        setFilterCategory(e.target.value);
        setCurrentPage(1);
    };

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const data = await getCached('/categorias-incidencias');
                if (data.success) {
                    setCategorias(data.data);
                }
            } catch (error) {
                console.error("Error al cargar las categorías:", error);
            }
        };
        fetchCategorias();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tickets', createFormData);
            setIsCreateModalOpen(false);
            setCreateFormData({ titulo: '', descripcion: '', prioridad: 'Media', categoria_id: '' });
            setCurrentPage(1); 
            fetchTickets();
            toast.success("Ticket de soporte registrado correctamente.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al registrar el ticket.");
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
            toast.success("Descripción del ticket actualizada correctamente.");
        } catch (error) {
            toast.error("Error al actualizar la descripción del ticket.");
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
            toast.error("No se pudo cargar la información detallada del ticket.");
        }
    };

    const handleQuickResolve = async (ticketId) => {
        const confirmed = await confirm({
            title: "¿Confirmas marcar este ticket como Resuelto?",
            message: `El folio #${ticketId} cambiará de estatus a Resuelto y se registrará en la bitácora de seguimiento.`,
            confirmText: "Sí, resolver ticket",
            cancelText: "Cancelar",
            variant: "teal"
        });

        if (!confirmed) return;

        try {
            await api.put(`/tickets/${ticketId}`, { 
                estatus: 'Resuelto', 
                comentario_cambio: 'Cierre rápido desde el panel general de tickets.' 
            });
            fetchTickets();
            toast.success(`Ticket #${ticketId} marcado como Resuelto.`);
        } catch (error) {
            toast.error("Ocurrió un error al intentar resolver el ticket.");
        }
    };

    const handleAdminUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/tickets/${selectedTicket.id}`, adminUpdateData);
            setIsViewModalOpen(false); // Cierra el modal de seguimiento inmediatamente
            setSelectedTicket(null);
            fetchTickets();
            toast.success("Seguimiento y estatus del ticket actualizados con éxito.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al actualizar el estatus del ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative font-sans">
            {/* CABECERA DE SECCIÓN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {isAdmin ? 'Gestión Central de Tickets' : 'Mis Solicitudes de Soporte'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isAdmin ? 'Supervisa, asigna y da seguimiento a los tickets de incidencias técnicas en planta.' : 'Reporta fallas técnicas a ICT y revisa el estatus de tus solicitudes.'}
                    </p>
                </div>
                {!isAdmin && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Levantar Ticket</span>
                    </button>
                )}
            </div>

            {/* CONTENEDOR PRINCIPAL TABLA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
                {/* BARRA DE HERRAMIENTAS Y FILTROS */}
                <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar ID, asunto o falla..." 
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] focus:border-transparent outline-none transition-all"
                                value={searchTerm} 
                                onChange={handleSearchChange}
                            />
                        </div>

                        <select 
                            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none"
                            value={filterCategory}
                            onChange={handleCategoryChange}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-[#009ba4] transition-all"
                            title="Alternar orden cronológico"
                        >
                            <ArrowUpDown size={14} className="text-[#009ba4]" />
                            <span>{sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => fetchTickets()} 
                            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#009ba4] dark:hover:text-[#2ec0c7] hover:border-[#009ba4] transition-all cursor-pointer bg-white dark:bg-slate-800"
                            title="Actualizar listado"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* TABLA DE TICKETS */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                                <th className="py-3.5 px-4">Ticket</th>
                                <th className="py-3.5 px-4">Fecha</th>
                                <th className="py-3.5 px-4">Descripción / Asunto</th>
                                <th className="py-3.5 px-4">Categoría</th>
                                {isAdmin && <th className="py-3.5 px-4">Solicitante</th>}
                                <th className="py-3.5 px-4">Prioridad</th>
                                <th className="py-3.5 px-4">Estatus</th>
                                <th className="py-3.5 px-4">Última Nota</th>
                                <th className="py-3.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 9 : 8} className="p-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <div className="h-4 w-4 border-2 border-[#009ba4] border-t-transparent rounded-full animate-spin" />
                                            <span>Consultando tickets...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 9 : 8} className="p-4">
                                        <EmptyState 
                                            title="No se encontraron tickets"
                                            description="No hay incidencias que coincidan con los filtros de búsqueda aplicados."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr 
                                        key={ticket.id} 
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <td className="py-3.5 px-4">
                                            <span className="font-bold text-xs text-[#009ba4] dark:text-[#2ec0c7]">
                                                #{ticket.id}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(ticket.date_created).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-3.5 px-4 max-w-[220px]">
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={ticket.descripcion_falla}>
                                                {ticket.descripcion_falla}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                {ticket.categoria?.nombre || 'General'}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="py-3.5 px-4 max-w-[160px]">
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={ticket.usuario_reporta?.nombre_completo}>
                                                    {ticket.usuario_reporta?.nombre_completo || 'Desconocido'}
                                                </p>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4">
                                            <Badge status={ticket.prioridad} size="xs" />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <Badge status={ticket.estatus} size="xs" />
                                        </td>
                                        <td className="py-3.5 px-4 max-w-[180px]">
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate block" title={ticket.historial?.[0]?.comentario_cambio || 'Sin notas'}>
                                                {ticket.historial?.[0]?.comentario_cambio || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleViewClick(ticket.id)} 
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#009ba4] hover:bg-[#009ba4]/10 transition-colors" 
                                                    title="Ver Detalle y Seguimiento"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {!isAdmin && ticket.estatus === 'Abierto' && (
                                                    <button 
                                                        onClick={() => handleEditClick(ticket)} 
                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors" 
                                                        title="Editar Descripción"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {isAdmin && ticket.estatus !== 'Resuelto' && ticket.estatus !== 'Cerrado' && (
                                                    <button 
                                                        onClick={() => handleQuickResolve(ticket.id)} 
                                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" 
                                                        title="Marcar como Resuelto"
                                                    >
                                                        <CheckCircle size={16} />
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

                {/* PAGINACIÓN */}
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalTickets}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* MODAL 1: Crear Ticket */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Levantar Nuevo Ticket de Soporte"
                subtitle="El equipo de ICT atenderá tu solicitud con base en la prioridad asignada."
                icon={Plus}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Asunto o Falla Principal
                        </label>
                        <input 
                            required 
                            type="text" 
                            placeholder="Ej. Falla al abrir SAP o pantalla azul..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] focus:border-transparent outline-none transition-all"
                            value={createFormData.titulo} 
                            onChange={(e) => setCreateFormData({...createFormData, titulo: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Descripción Detallada
                        </label>
                        <textarea 
                            required 
                            rows={4} 
                            placeholder="Describe qué sucedió, código de error si existe, y ubicación física del equipo..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] focus:border-transparent outline-none resize-none transition-all" 
                            value={createFormData.descripcion} 
                            onChange={(e) => setCreateFormData({...createFormData, descripcion: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Categoría
                            </label>
                            <select 
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={createFormData.categoria_id} 
                                onChange={(e) => setCreateFormData({...createFormData, categoria_id: e.target.value})}
                            >
                                <option value="">Selecciona categoría...</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Prioridad
                            </label>
                            <select 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={createFormData.prioridad} 
                                onChange={(e) => setCreateFormData({...createFormData, prioridad: e.target.value})}
                            >
                                <option value="Baja">Baja (No urgente)</option>
                                <option value="Media">Media (Afecta tarea individual)</option>
                                <option value="Alta">Alta (Línea de producción o crítico)</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={() => setIsCreateModalOpen(false)} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                        >
                            <Save size={15} />
                            <span>{isSubmitting ? 'Guardando...' : 'Enviar Reporte'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: Editar Ticket */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Corregir Ticket #${editFormData.id}`}
                subtitle="Modifica la descripción si necesitas agregar detalles o clarificar la falla."
                icon={Pencil}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Descripción de la falla
                        </label>
                        <textarea 
                            required 
                            rows={5} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none resize-none" 
                            value={editFormData.descripcion_falla} 
                            onChange={(e) => setEditFormData({...editFormData, descripcion_falla: e.target.value})}
                        />
                    </div>
                    <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={() => setIsEditModalOpen(false)} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                            <Save size={15} />
                            <span>{isSubmitting ? 'Actualizando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: Ver Detalles y Gestión de Ticket */}
            <Modal
                isOpen={isViewModalOpen && !!selectedTicket}
                onClose={() => setIsViewModalOpen(false)}
                title={`Detalles del Ticket #${selectedTicket?.id}`}
                subtitle={`Reportado por ${selectedTicket?.usuario_reporta?.nombre_completo || 'Usuario'} • ${new Date(selectedTicket?.date_created || '').toLocaleString('es-ES')}`}
                icon={MessageSquare}
                maxWidth="max-w-2xl"
            >
                {selectedTicket && (
                    <div className="space-y-6">
                        {/* Resumen de Datos */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estatus</p>
                                <div className="mt-1"><Badge status={selectedTicket.estatus} size="xs" /></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</p>
                                <div className="mt-1"><Badge status={selectedTicket.prioridad} size="xs" /></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTicket.categoria?.nombre || 'General'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departamento</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTicket.usuario_reporta?.departamento?.nombre || 'Planta'}</p>
                            </div>
                        </div>

                        {/* Descripción de la Falla */}
                        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción del Problema</h4>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {selectedTicket.descripcion_falla}
                            </p>
                        </div>

                        {/* Panel Administrativo de Cambio de Estatus */}
                        {isAdmin && (
                            <div className="p-4 rounded-xl border border-[#009ba4]/30 bg-[#009ba4]/5 dark:bg-[#009ba4]/10">
                                <h4 className="text-xs font-bold text-[#007e86] dark:text-[#2ec0c7] uppercase tracking-wider mb-3">
                                    Actualización Administrativa (ICT)
                                </h4>
                                <form onSubmit={handleAdminUpdateSubmit} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                                Nuevo Estatus
                                            </label>
                                            <select 
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                                value={adminUpdateData.estatus} 
                                                onChange={(e) => setAdminUpdateData({...adminUpdateData, estatus: e.target.value})}
                                            >
                                                <option value="Abierto">Abierto</option>
                                                <option value="En_Progreso">En Progreso</option>
                                                <option value="Esperando_Piezas">Esperando Piezas</option>
                                                <option value="Resuelto">Resuelto</option>
                                                <option value="Cerrado">Cerrado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                            Comentario Técnico de Seguimiento
                                        </label>
                                        <textarea 
                                            rows={2} 
                                            placeholder="Detalla qué acciones se tomaron o si se requiere repuesto..." 
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none resize-none" 
                                            value={adminUpdateData.comentario_cambio} 
                                            onChange={(e) => setAdminUpdateData({...adminUpdateData, comentario_cambio: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting || adminUpdateData.estatus === selectedTicket.estatus} 
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#009ba4] hover:bg-[#007e86] disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            <Save size={14} />
                                            <span>{isSubmitting ? 'Guardando...' : 'Actualizar Ticket'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Historial y Línea de Tiempo */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={14} className="text-[#009ba4]" />
                                <span>Historial de Movimientos</span>
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {(!selectedTicket.historial || selectedTicket.historial.length === 0) ? (
                                    <p className="text-xs text-slate-400 italic">No hay registros de cambios en este ticket.</p>
                                ) : (
                                    selectedTicket.historial.map((evento) => (
                                        <div key={evento.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                                            <div className="h-2 w-2 rounded-full bg-[#009ba4] mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {evento.estatus_anterior || 'Inicio'} ➔ {evento.estatus_nuevo}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(evento.date_created).toLocaleString('es-ES')}
                                                    </span>
                                                </div>
                                                {evento.comentario_cambio && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                                        {evento.comentario_cambio}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};