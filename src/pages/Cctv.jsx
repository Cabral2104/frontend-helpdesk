import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Plus, Search, RefreshCw, X, Save, Pencil, Trash2, 
    Cctv as CctvIcon, MonitorPlay, ArrowUpDown, Network, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';

export const Cctv = () => {
    const { user } = useAuth();
    const { toast, confirm } = useNotification();
    const isAdmin = user?.rol === 'Administrador';

    const [camaras, setCamaras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCamaras, setTotalCamaras] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        nombre_camara: '',
        ubicacion: '',
        numero_serie: '',
        ip_asignada: '',
        switch_conexion: '',
        puerto_switch: '',
        stream_url: '',
        estatus_red: 1,
        visible_en_caseta: 0
    });

    const fetchCamaras = async (signal = null) => {
        setLoading(true);
        setFetchError(null);
        try {
            const isSignal = signal && typeof signal.addEventListener === 'function';
            const response = await api.get(
                `/cctv?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}&search=${searchTerm}`,
                isSignal ? { signal } : {}
            );
            setCamaras(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setTotalCamaras(response.data.meta?.total || (response.data.data ? response.data.data.length : 0));
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Error al cargar cámaras:", error);
            if (error.code === 'ECONNABORTED' || !error.response) {
                setFetchError("No se pudo conectar con el servidor o la base de datos MySQL en XAMPP. Asegúrate de que MySQL esté iniciado.");
            } else if (error.response?.status === 500) {
                setFetchError("Error 500 en el servidor. Verifica que MySQL esté activo en el panel de control de XAMPP.");
            } else {
                setFetchError("Ocurrió un error al cargar el circuito de cámaras.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const delay = searchTerm ? 350 : 0;
        const delayDebounce = setTimeout(() => {
            fetchCamaras(controller.signal);
        }, delay);

        return () => {
            clearTimeout(delayDebounce);
            controller.abort();
        };
    }, [searchTerm, currentPage, sortOrder]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ 
            id: null, 
            nombre_camara: '', 
            ubicacion: '', 
            numero_serie: '',
            ip_asignada: '',
            switch_conexion: '',
            puerto_switch: '',
            stream_url: '', 
            estatus_red: 1, 
            visible_en_caseta: 0 
        });
        setIsModalOpen(true);
    };

    const openEditModal = (camara) => {
        setEditMode(true);
        setFormData({ 
            ...camara,
            numero_serie: camara.numero_serie || '',
            ip_asignada: camara.ip_asignada || '',
            switch_conexion: camara.switch_conexion || '',
            puerto_switch: camara.puerto_switch || '',
            stream_url: camara.stream_url || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editMode) {
                await api.put(`/cctv/${formData.id}`, formData);
                toast.success("Cámara CCTV actualizada con éxito.");
            } else {
                await api.post('/cctv', formData);
                setCurrentPage(1);
                toast.success("Cámara CCTV agregada a la red exitosamente.");
            }
            setIsModalOpen(false); // Cierra el modal inmediatamente
            fetchCamaras();
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al guardar la cámara.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "¿Dar de baja cámara de la red?",
            message: "¿Estás seguro de dar de baja esta cámara del circuito? Se desconectará de caseta y del inventario de video.",
            confirmText: "Sí, dar de baja",
            cancelText: "Cancelar",
            variant: "rose"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/cctv/${id}`);
            fetchCamaras();
            toast.success("Cámara dada de baja del circuito correctamente.");
        } catch (error) {
            toast.error("Error al dar de baja la cámara.");
        }
    };

    const renderNetworkBadge = (status) => {
        const estatusNum = Number(status);
        if (estatusNum === 1) return <Badge variant="emerald" size="xs">Online</Badge>;
        if (estatusNum === 2) return <Badge variant="amber" size="xs">Mantenimiento</Badge>;
        return <Badge variant="rose" size="xs">Offline</Badge>;
    };

    return (
        <div className="space-y-6 relative font-sans">
            {/* CABECERA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <CctvIcon size={24} className="text-[#009ba4]" />
                        <span>Infraestructura CCTV & Cámaras</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Control de señal de video, asignación de switches y distribución de streams hacia caseta de vigilancia.
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={openCreateModal} 
                        className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Nueva Cámara</span>
                    </button>
                )}
            </div>

            {/* CONTENEDOR TABLA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar cámara, IP o ubicación..." 
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none"
                                value={searchTerm} 
                                onChange={handleSearchChange}
                            />
                        </div>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-[#009ba4] transition-all"
                        >
                            <ArrowUpDown size={14} className="text-[#009ba4]" />
                            <span>{sortOrder === 'desc' ? 'Recientes' : 'Antiguas'}</span>
                        </button>
                    </div>

                    <button 
                        onClick={fetchCamaras} 
                        className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#009ba4] hover:border-[#009ba4] transition-all bg-white dark:bg-slate-800 self-end sm:self-auto"
                        title="Actualizar listado"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* TABLA */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[780px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                                <th className="py-3.5 px-4">Cámara / Host</th>
                                <th className="py-3.5 px-4">Ubicación Física</th>
                                <th className="py-3.5 px-4">Red & Switch</th>
                                <th className="py-3.5 px-4">Estatus Señal</th>
                                <th className="py-3.5 px-4 text-center">Visibilidad Caseta</th>
                                {isAdmin && <th className="py-3.5 px-4 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <div className="h-4 w-4 border-2 border-[#009ba4] border-t-transparent rounded-full animate-spin" />
                                            <span>Verificando red de cámaras CCTV...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center">
                                        <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs">
                                            <p className="font-bold mb-1">Aviso de Conexión</p>
                                            <p className="mb-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">{fetchError}</p>
                                            <button
                                                onClick={fetchCamaras}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#009ba4] hover:bg-[#007e86] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                                            >
                                                <RefreshCw size={13} />
                                                <span>Reintentar conexión</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : camaras.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="p-4">
                                        <EmptyState 
                                            title="No hay cámaras registradas"
                                            description="No se encontraron dispositivos CCTV con los criterios seleccionados."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                camaras.map((camara) => (
                                    <tr key={camara.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-[#009ba4]/10 text-[#009ba4] flex items-center justify-center shrink-0">
                                                    <Radio size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                                        {camara.nombre_camara}
                                                    </span>
                                                    {camara.numero_serie && (
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            S/N: {camara.numero_serie}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {camara.ubicacion}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {camara.ip_asignada ? (
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                        {camara.ip_asignada}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {camara.switch_conexion || 'MDF'} {camara.puerto_switch ? `(Pto. ${camara.puerto_switch})` : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-mono">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {renderNetworkBadge(camara.estatus_red)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {camara.visible_en_caseta === 1 ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#009ba4] bg-[#009ba4]/10 px-2 py-0.5 rounded-full border border-[#009ba4]/20">
                                                    <MonitorPlay size={12} />
                                                    <span>En Caseta</span>
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">Oculta</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => openEditModal(camara)} 
                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer" 
                                                        title="Editar Configuración"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(camara.id)} 
                                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer" 
                                                        title="Dar de Baja"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
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
                    totalItems={totalCamaras}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* MODAL: Crear / Editar Cámara */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editMode ? 'Editar Cámara CCTV' : 'Registrar Nueva Cámara CCTV'}
                subtitle="Configuración de red, stream WebRTC y asignación para guardias de caseta."
                icon={CctvIcon}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nombre_camara" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Nombre o Identificador
                        </label>
                        <input 
                            required 
                            id="nombre_camara"
                            name="nombre_camara"
                            type="text" 
                            placeholder="Ej. CAM-01 Entrada Principal"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                            value={formData.nombre_camara} 
                            onChange={(e) => setFormData({...formData, nombre_camara: e.target.value})} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="ubicacion" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Ubicación Física
                            </label>
                            <input 
                                required 
                                id="ubicacion"
                                name="ubicacion"
                                type="text" 
                                placeholder="Ej. Puerta 1 Peatonal"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.ubicacion} 
                                onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label htmlFor="numero_serie" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Número de Serie
                            </label>
                            <input 
                                id="numero_serie"
                                name="numero_serie"
                                type="text" 
                                placeholder="Ej. D123456789" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.numero_serie} 
                                onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="ip_asignada" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Dirección IP Asignada
                        </label>
                        <input 
                            id="ip_asignada"
                            name="ip_asignada"
                            type="text" 
                            placeholder="Ej. 10.52.70.15" 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                            value={formData.ip_asignada} 
                            onChange={(e) => setFormData({...formData, ip_asignada: e.target.value})} 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="switch_conexion" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Switch de Conexión</label>
                            <input 
                                id="switch_conexion"
                                name="switch_conexion"
                                type="text" 
                                placeholder="Ej. SW-MDF-01" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.switch_conexion} 
                                onChange={(e) => setFormData({...formData, switch_conexion: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label htmlFor="puerto_switch" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Puerto</label>
                            <input 
                                id="puerto_switch"
                                name="puerto_switch"
                                type="text" 
                                placeholder="Ej. Port 24" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.puerto_switch} 
                                onChange={(e) => setFormData({...formData, puerto_switch: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                        <div>
                            <label htmlFor="estatus_red" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Estatus de Red</label>
                            <select 
                                id="estatus_red"
                                name="estatus_red"
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.estatus_red} 
                                onChange={(e) => setFormData({...formData, estatus_red: parseInt(e.target.value)})}
                            >
                                <option value={1}>Online (Transmitiendo)</option>
                                <option value={0}>Offline (Sin Señal)</option>
                                <option value={2}>Mantenimiento</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    id="visible_en_caseta"
                                    name="visible_en_caseta"
                                    type="checkbox" 
                                    className="h-4 w-4 rounded border-slate-300 text-[#009ba4] focus:ring-[#009ba4]" 
                                    checked={Number(formData.visible_en_caseta) === 1} 
                                    onChange={(e) => setFormData({...formData, visible_en_caseta: e.target.checked ? 1 : 0})} 
                                />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mostrar en Caseta</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stream_url" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            URL del Stream WebRTC / RTSP
                        </label>
                        <input 
                            id="stream_url"
                            name="stream_url"
                            type="text" 
                            placeholder="http://127.0.0.1:8889/camara_principal" 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-[#009ba4] outline-none" 
                            value={formData.stream_url} 
                            onChange={(e) => setFormData({...formData, stream_url: e.target.value})} 
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Servidor local MediaMTX o stream H.264 compatible.</p>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
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
                            className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                        >
                            <Save size={15} />
                            <span>{isSubmitting ? 'Guardando...' : (editMode ? 'Actualizar Cámara' : 'Guardar Cámara')}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};