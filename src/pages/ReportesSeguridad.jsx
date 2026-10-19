import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    ShieldAlert, Search, RefreshCw, Pencil, Trash2, Save, 
    UserCircle, Plus, ArrowUpDown, Camera, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getCached } from '../api/cache';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';

export const ReportesSeguridad = () => {
    const { user } = useAuth();
    const { toast, confirm } = useNotification();
    const isAdmin = user?.rol === 'Administrador';
    
    const [reportes, setReportes] = useState([]);
    const [camaras, setCamaras] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReportes, setTotalReportes] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        camara_id: '',
        fecha_hora: '',
        tipo_incidente: '',
        descripcion: '',
        estatus: 'Pendiente'
    });

    const fetchReportes = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reportes-seguridad?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}&search=${searchTerm}`);
            setReportes(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setTotalReportes(response.data.meta?.total || (response.data.data ? response.data.data.length : 0));
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCamaras = async () => {
        try {
            // Solo cámaras visibles en caseta para el personal de vigilancia
            const data = await getCached('/cctv/catalogo?solo_caseta=1');
            setCamaras(data.data || []);
        } catch (error) {
            console.error("Error al cargar cámaras para caseta:", error);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchReportes();
        }, 350);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, currentPage, sortOrder]);

    useEffect(() => {
        fetchCamaras(); 
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    const formatForDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleStatusChange = async (id, nuevoEstatus) => {
        try {
            await api.put(`/reportes-seguridad/${id}`, { estatus: nuevoEstatus });
            setReportes(reportes.map(rep => rep.id === id ? { ...rep, estatus: nuevoEstatus } : rep));
            toast.success(`Estatus del folio #${id} actualizado a ${nuevoEstatus}.`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al actualizar el estatus.");
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({
            id: null,
            camara_id: '',
            fecha_hora: formatForDateTimeLocal(new Date()),
            tipo_incidente: 'Vehículo Sospechoso',
            descripcion: '',
            estatus: 'Pendiente'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rep) => {
        const isCreator = Number(rep.usuario_reporta_id) === Number(user?.id) || Number(rep.guardia?.id) === Number(user?.id);
        if (!isCreator) {
            toast.error("Acceso denegado: Únicamente el usuario u oficial que redactó este reporte puede modificarlo.");
            return;
        }
        setEditMode(true);
        setFormData({
            id: rep.id,
            camara_id: rep.camara_id || '',
            fecha_hora: formatForDateTimeLocal(rep.fecha_incidente || rep.date_created),
            tipo_incidente: rep.tipo_incidente || '',
            descripcion: rep.descripcion || '',
            estatus: rep.estatus || 'Pendiente'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                camara_id: formData.camara_id,
                fecha_incidente: formData.fecha_hora,
                tipo_incidente: formData.tipo_incidente,
                descripcion: formData.descripcion,
                estatus: formData.estatus
            };

            if (editMode) {
                await api.put(`/reportes-seguridad/${formData.id}`, payload);
                toast.success("Novedad actualizada correctamente.");
            } else {
                await api.post('/reportes-seguridad', payload);
                setCurrentPage(1); 
                toast.success("Novedad registrada exitosamente en la bitácora.");
            }
            
            setIsModalOpen(false); // Cierra el modal inmediatamente
            fetchReportes();
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al guardar el reporte.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "¿Dar de baja reporte de la bitácora?",
            message: `¿Estás seguro de eliminar el folio #${id}? Esta acción quedará registrada en auditoría.`,
            confirmText: "Sí, dar de baja",
            cancelText: "Cancelar",
            variant: "rose"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/reportes-seguridad/${id}`);
            fetchReportes();
            toast.success(`Folio #${id} eliminado de la bitácora.`);
        } catch (error) {
            toast.error("Error al eliminar el reporte de seguridad.");
        }
    };

    return (
        <div className="space-y-6 relative font-sans">
            {/* CABECERA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <ShieldAlert size={24} className="text-rose-600" />
                        <span>Bitácora de Seguridad Patrimonial</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Registro oficial de novedades, inspecciones y rondines reportados por guardias de caseta.
                    </p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                    <Plus size={16} />
                    <span>Registrar Novedad</span>
                </button>
            </div>

            {/* CONTENEDOR TABLA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder={isAdmin ? "Buscar ID, incidente o guardia..." : "Buscar tipo o descripción..."}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                                value={searchTerm} 
                                onChange={handleSearchChange}
                            />
                        </div>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-rose-500 transition-all"
                        >
                            <ArrowUpDown size={14} className="text-rose-500" />
                            <span>{sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}</span>
                        </button>
                    </div>

                    <button 
                        onClick={fetchReportes} 
                        className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-500 transition-all bg-white dark:bg-slate-800 self-end sm:self-auto"
                        title="Actualizar bitácora"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* TABLA DE REPORTES */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                                <th className="py-3.5 px-4">Folio</th>
                                <th className="py-3.5 px-4">Fecha & Hora</th>
                                <th className="py-3.5 px-4">Oficial en Turno</th>
                                <th className="py-3.5 px-4">Cámara Vinculada</th>
                                <th className="py-3.5 px-4">Tipo de Novedad</th>
                                <th className="py-3.5 px-4">Descripción de Hechos</th>
                                <th className="py-3.5 px-4 text-center">Estatus</th>
                                <th className="py-3.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <div className="h-4 w-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                            <span>Cargando bitácora de seguridad...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : reportes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-4">
                                        <EmptyState 
                                            title="No hay novedades reportadas"
                                            description="No se encontraron registros de seguridad con los criterios de búsqueda actuales."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                reportes.map((rep) => {
                                    const isCreator = Number(rep.usuario_reporta_id) === Number(user?.id) || Number(rep.guardia?.id) === Number(user?.id);
                                    const canEdit = isCreator; // Solo el usuario que redactó el reporte puede editar su contenido
                                    const canDelete = isAdmin || isCreator; // El administrador o el autor pueden eliminarlo

                                    return (
                                        <tr key={rep.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                                                    #{rep.id}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                {new Date(rep.fecha_incidente || rep.date_created).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                                        {rep.guardia?.nombre_completo ? rep.guardia.nombre_completo.charAt(0) : 'G'}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                        {rep.guardia?.nombre_completo || 'Guardia'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-[180px]">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                                                    <Camera size={13} className="text-[#009ba4] shrink-0" />
                                                    <span className="truncate" title={rep.camara ? `${rep.camara.nombre_camara} (${rep.camara.ubicacion})` : `Cámara ${rep.camara_id}`}>
                                                        {rep.camara ? `${rep.camara.nombre_camara}` : `Cam #${rep.camara_id}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                                                    {rep.tipo_incidente}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-[240px]">
                                                <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={rep.descripcion}>
                                                    {rep.descripcion}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {isAdmin ? (
                                                    <select
                                                        value={rep.estatus || 'Pendiente'}
                                                        onChange={(e) => handleStatusChange(rep.id, e.target.value)}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none cursor-pointer shadow-2xs hover:border-[#009ba4]"
                                                    >
                                                        <option value="Pendiente">Pendiente</option>
                                                        <option value="En_Revision">En Revisión</option>
                                                        <option value="Resuelto">Resuelto</option>
                                                    </select>
                                                ) : (
                                                    <Badge status={rep.estatus} size="xs" />
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => openEditModal(rep)} 
                                                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors" 
                                                            title="Editar mi reporte"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(rep.id)} 
                                                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors" 
                                                            title="Eliminar Reporte"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                    {!canEdit && !canDelete && (
                                                        <span className="text-xs text-slate-400 font-mono">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalReportes}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* MODAL: REGISTRO Y EDICIÓN */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editMode ? 'Editar Novedad de Seguridad' : 'Registrar Novedad en Caseta'}
                subtitle="El incidente quedará registrado con sello de tiempo y oficial a cargo."
                icon={ShieldAlert}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Cámara de Evidencia
                            </label>
                            <select 
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                                value={formData.camara_id || ''} 
                                onChange={(e) => setFormData({...formData, camara_id: e.target.value})}
                            >
                                <option value="">-- Seleccionar cámara --</option>
                                {camaras.map(cam => (
                                    <option key={cam.id} value={cam.id}>
                                        {cam.nombre_camara} ({cam.ubicacion})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Fecha y Hora del Evento
                            </label>
                            <input 
                                required
                                type="datetime-local" 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                                value={formData.fecha_hora || ''} 
                                onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Tipo de Incidente
                        </label>
                        <select 
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                            value={formData.tipo_incidente || ''} 
                            onChange={(e) => setFormData({...formData, tipo_incidente: e.target.value})}
                        >
                            <option value="Vehículo Sospechoso">Vehículo Sospechoso</option>
                            <option value="Persona Sospechosa">Persona Sospechosa en Perímetro</option>
                            <option value="Intrusión / Acceso no autorizado">Intrusión / Acceso no autorizado</option>
                            <option value="Puerta/Acceso Abierto">Puerta / Acceso Abierto</option>
                            <option value="Falla de Equipo">Falla de Equipo o Cámara</option>
                            <option value="Accidente">Accidente o Daño a Instalaciones</option>
                            <option value="Robo/Intento">Robo o Intento de Sustracción</option>
                            <option value="Otro">Otro incidente...</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Descripción de los Hechos
                        </label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                            placeholder="Describe qué sucedió, placas de vehículos, vestimenta o acciones tomadas..."
                            value={formData.descripcion || ''} 
                            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        />
                    </div>

                    {editMode && isAdmin && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                Estatus del Reporte
                            </label>
                            <select 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold outline-none"
                                value={formData.estatus || 'Pendiente'} 
                                onChange={(e) => setFormData({...formData, estatus: e.target.value})}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En_Revision">En Revisión</option>
                                <option value="Resuelto">Resuelto</option>
                            </select>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                        >
                            <Save size={15} />
                            <span>{editMode ? 'Actualizar Reporte' : 'Registrar Novedad'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};