import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Plus, Search, Wrench, Pencil, Trash2, Save, AlertTriangle, 
    Monitor, Printer, ArrowLeft, RefreshCw, Cpu, HardDrive, Check, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';

export const Inventario = () => {
    const { user } = useAuth();
    const { toast, confirm } = useNotification();
    const isAdmin = user?.rol === 'Administrador';

    // Estados Generales
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'criticos', 'computadoras', 'perifericos'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEquipos, setTotalEquipos] = useState(0);
    const [copiedSerial, setCopiedSerial] = useState(null);

    // Estados para el Modal de Registro / Edición
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedEquipoId, setSelectedEquipoId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialForm = {
        tipo_dispositivo: 'Computadora',
        usuario_asignado: '',
        etiqueta: '',
        prod_id: '',
        numero_serie: '',
        nombre_red: '',
        sistema_operativo: 'Windows 11 Enterprise',
        os_build: '',
        marca_modelo: '',
        es_critico: false
    };
    const [formData, setFormData] = useState(initialForm);

    // Estados para la Bitácora
    const [isBitacoraModalOpen, setIsBitacoraModalOpen] = useState(false);
    const [selectedEquipoBitacora, setSelectedEquipoBitacora] = useState(null);
    const [bitacoraList, setBitacoraList] = useState([]);
    const [bitacoraForm, setBitacoraForm] = useState({
        tipo_servicio: 'Preventivo',
        tecnico_asignado: user?.nombre_completo || '',
        fecha_servicio: new Date().toISOString().split('T')[0],
        trabajo_realizado: ''
    });

    // ================= FUNCIONES API INVENTARIO ================= //

    const fetchEquipos = async (signal = null) => {
        setLoading(true);
        try {
            const response = await api.get(
                `/equipos?page=${currentPage}&search=${searchTerm}`,
                signal ? { signal } : {}
            );
            setEquipos(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setTotalEquipos(response.data.meta?.total || (response.data.data ? response.data.data.length : 0));
        } catch (error) {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                console.error("Error al cargar inventario:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const delay = searchTerm ? 350 : 0;
        const timeoutId = setTimeout(() => {
            fetchEquipos(controller.signal);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm, currentPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedSerial(text);
        setTimeout(() => setCopiedSerial(null), 2000);
    };

    // Crear o Editar Equipo
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSubmit = { ...formData, es_critico: formData.es_critico ? 1 : 0 };
            
            if (isEditMode) {
                await api.put(`/equipos/${selectedEquipoId}`, dataToSubmit);
                toast.success("Equipo actualizado en el inventario con éxito.");
            } else {
                await api.post('/equipos', dataToSubmit);
                setCurrentPage(1);
                toast.success("Equipo registrado en el inventario con éxito.");
            }
            setIsFormModalOpen(false); // Cierra el modal inmediatamente
            fetchEquipos();
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al guardar el equipo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (equipo) => {
        setSelectedEquipoId(equipo.id);
        setIsEditMode(true);
        setFormData({
            tipo_dispositivo: equipo.tipo_dispositivo || 'Computadora',
            usuario_asignado: equipo.usuario_asignado || '',
            etiqueta: equipo.etiqueta || '',
            prod_id: equipo.prod_id || '',
            numero_serie: equipo.numero_serie || '',
            nombre_red: equipo.nombre_red || '',
            sistema_operativo: equipo.sistema_operativo || '',
            os_build: equipo.os_build || '',
            marca_modelo: equipo.marca_modelo || '',
            es_critico: equipo.es_critico === 1 || equipo.es_critico === true
        });
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "¿Eliminar equipo del inventario?",
            message: "Esta acción dará de baja el equipo del inventario de ICT y su historial quedará archivado.",
            confirmText: "Sí, eliminar equipo",
            cancelText: "Cancelar",
            variant: "rose"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/equipos/${id}`);
            fetchEquipos();
            toast.success("Equipo eliminado del inventario correctamente.");
        } catch (error) {
            toast.error("Error al eliminar el equipo.");
        }
    };

    // ================= FUNCIONES BITÁCORA ================= //

    const openBitacora = async (equipo) => {
        setSelectedEquipoBitacora(equipo);
        setBitacoraForm({
            tipo_servicio: 'Preventivo',
            tecnico_asignado: user?.nombre_completo || 'Técnico ICT',
            fecha_servicio: new Date().toISOString().split('T')[0],
            trabajo_realizado: ''
        });
        try {
            const response = await api.get(`/equipos/${equipo.id}/bitacora`);
            setBitacoraList(response.data.data || []);
            setIsBitacoraModalOpen(true);
        } catch (error) {
            toast.error("No se pudo cargar la bitácora del equipo.");
        }
    };

    const handleBitacoraSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post(`/equipos/${selectedEquipoBitacora.id}/bitacora`, bitacoraForm);
            const response = await api.get(`/equipos/${selectedEquipoBitacora.id}/bitacora`);
            setBitacoraList(response.data.data || []);
            setBitacoraForm({
                ...bitacoraForm,
                trabajo_realizado: ''
            });
            toast.success("Servicio técnico registrado en la bitácora del equipo.");
        } catch (error) {
            toast.error("Error al guardar el servicio en la bitácora.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtrado frontal según pestaña activa
    const equiposFiltrados = equipos.filter(eq => {
        if (filtroTipo === 'criticos') return eq.es_critico === 1 || eq.es_critico === true;
        if (filtroTipo === 'computadoras') return eq.tipo_dispositivo === 'Computadora';
        if (filtroTipo === 'perifericos') return eq.tipo_dispositivo !== 'Computadora';
        return true;
    });

    return (
        <div className="space-y-6 relative font-sans">
            {/* CABECERA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Inventario de Infraestructura ICT
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Control y monitoreo de computadoras, equipos críticos de producción y periféricos de planta.
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => { setIsEditMode(false); setFormData(initialForm); setIsFormModalOpen(true); }} 
                        className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Registrar Equipo</span>
                    </button>
                )}
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
                {/* BARRA DE HERRAMIENTAS Y PESTAÑAS */}
                <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar usuario, host o serie..." 
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] focus:border-transparent outline-none transition-all"
                                value={searchTerm} 
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Pestañas de filtrado rápido */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
                            <button
                                onClick={() => setFiltroTipo('todos')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filtroTipo === 'todos' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFiltroTipo('criticos')}
                                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${filtroTipo === 'criticos' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                <AlertTriangle size={12} />
                                <span>Críticos</span>
                            </button>
                            <button
                                onClick={() => setFiltroTipo('computadoras')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filtroTipo === 'computadoras' ? 'bg-white dark:bg-slate-700 text-[#009ba4] dark:text-[#2ec0c7] shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                PCs / Laptops
                            </button>
                            <button
                                onClick={() => setFiltroTipo('perifericos')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filtroTipo === 'perifericos' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                Periféricos
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <button 
                            onClick={() => fetchEquipos()} 
                            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#009ba4] hover:border-[#009ba4] transition-all bg-white dark:bg-slate-800"
                            title="Recargar inventario"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* TABLA DE EQUIPOS */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                                <th className="py-3.5 px-4">Tipo & Criticidad</th>
                                <th className="py-3.5 px-4">Usuario / Área</th>
                                <th className="py-3.5 px-4">Nombre en Red (Host)</th>
                                <th className="py-3.5 px-4">Número de Serie</th>
                                <th className="py-3.5 px-4">Hardware / Modelo</th>
                                <th className="py-3.5 px-4">Sistema Operativo</th>
                                <th className="py-3.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <div className="h-4 w-4 border-2 border-[#009ba4] border-t-transparent rounded-full animate-spin" />
                                            <span>Consultando inventario de equipos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : equiposFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4">
                                        <EmptyState 
                                            title="No se encontraron equipos"
                                            description="No hay registros que coincidan con la búsqueda o filtro seleccionado."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                equiposFiltrados.map((equipo) => {
                                    const isCritico = equipo.es_critico === 1 || equipo.es_critico === true;
                                    const isPC = equipo.tipo_dispositivo === 'Computadora';

                                    return (
                                        <tr 
                                            key={equipo.id} 
                                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                                                isCritico ? 'bg-rose-500/[0.02] dark:bg-rose-500/[0.03]' : ''
                                            }`}
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-xl shrink-0 ${
                                                        isPC ? 'bg-[#009ba4]/10 text-[#009ba4]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                        {isPC ? <Monitor size={15} /> : <Printer size={15} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                                            {equipo.tipo_dispositivo || 'Equipo'}
                                                        </span>
                                                        {isCritico && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                                Crítico
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    {equipo.usuario_asignado}
                                                </p>
                                                {equipo.etiqueta && (
                                                    <span className="text-[10px] text-slate-400 block font-medium">
                                                        Etq: {equipo.etiqueta}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs font-bold text-[#009ba4] dark:text-[#2ec0c7] bg-[#009ba4]/10 px-2 py-0.5 rounded-md">
                                                    {equipo.nombre_red || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    <span>{equipo.numero_serie}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(equipo.numero_serie)}
                                                        className="text-slate-400 hover:text-[#009ba4] transition-colors p-0.5"
                                                        title="Copiar número de serie"
                                                    >
                                                        {copiedSerial === equipo.numero_serie ? (
                                                            <Check size={13} className="text-emerald-500" />
                                                        ) : (
                                                            <Copy size={13} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-[200px]">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium" title={equipo.marca_modelo}>
                                                    {equipo.marca_modelo || '—'}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-[170px]">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate" title={`${equipo.sistema_operativo || ''} ${equipo.os_build ? `(${equipo.os_build})` : ''}`}>
                                                    {equipo.sistema_operativo || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => openBitacora(equipo)} 
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#009ba4]/10 hover:bg-[#009ba4]/20 text-[#007e86] dark:text-[#2ec0c7] transition-all cursor-pointer"
                                                        title="Historial de Mantenimiento"
                                                    >
                                                        <Wrench size={13} />
                                                        <span>Bitácora</span>
                                                    </button>
                                                    {isAdmin && (
                                                        <>
                                                            <button 
                                                                onClick={() => openEditModal(equipo)} 
                                                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer" 
                                                                title="Editar Equipo"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(equipo.id)} 
                                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer" 
                                                                title="Eliminar Registro"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
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
                    totalItems={totalEquipos}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* MODAL 1: Crear / Editar Equipo */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? 'Editar Equipo de Infraestructura' : 'Registrar Nuevo Equipo ICT'}
                subtitle="Ingresa las especificaciones y datos de asignación del dispositivo."
                icon={isEditMode ? Pencil : Plus}
                maxWidth="max-w-3xl"
            >
                <form onSubmit={handleFormSubmit} className="space-y-5">
                    {/* Selector de categoría */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-4 text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-wider">Tipo:</span>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                            <input 
                                type="radio" 
                                name="tipo" 
                                checked={formData.tipo_dispositivo === 'Computadora'} 
                                onChange={() => setFormData({...formData, tipo_dispositivo: 'Computadora', sistema_operativo: 'Windows 11 Enterprise'})} 
                                className="text-[#009ba4] focus:ring-[#009ba4]" 
                            />
                            <Monitor size={15} className="text-[#009ba4]" />
                            <span>Computadora / Laptop</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                            <input 
                                type="radio" 
                                name="tipo" 
                                checked={formData.tipo_dispositivo === 'Impresora'} 
                                onChange={() => setFormData({...formData, tipo_dispositivo: 'Impresora', sistema_operativo: 'N/A', os_build: 'N/A'})} 
                                className="text-[#009ba4] focus:ring-[#009ba4]" 
                            />
                            <Printer size={15} className="text-[#808084]" />
                            <span>Impresora / Switch / Red</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                {formData.tipo_dispositivo === 'Computadora' ? 'Usuario Asignado' : 'Área Operativa o Responsable'}
                            </label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Nombre completo o estación..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.usuario_asignado} 
                                onChange={(e) => setFormData({...formData, usuario_asignado: e.target.value})} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Etiqueta Wittur</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. WIT-0142"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                    value={formData.etiqueta} 
                                    onChange={(e) => setFormData({...formData, etiqueta: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">ProdID</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. 10B900"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                    value={formData.prod_id} 
                                    onChange={(e) => setFormData({...formData, prod_id: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Número de Serie (S/N)</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej. CZC2381290..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.numero_serie} 
                                onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                {formData.tipo_dispositivo === 'Computadora' ? 'Nombre en Red (Hostname)' : 'IP / Nombre de Red'}
                            </label>
                            <input 
                                type="text" 
                                placeholder="Ej. WIT-PC-ING01..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.nombre_red} 
                                onChange={(e) => setFormData({...formData, nombre_red: e.target.value})} 
                            />
                        </div>

                        {formData.tipo_dispositivo === 'Computadora' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Sistema Operativo</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                        value={formData.sistema_operativo} 
                                        onChange={(e) => setFormData({...formData, sistema_operativo: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">OS Build</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. 22631.3007..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                        value={formData.os_build} 
                                        onChange={(e) => setFormData({...formData, os_build: e.target.value})} 
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                {formData.tipo_dispositivo === 'Computadora' ? 'Especificaciones Hardware (Procesador, RAM, SSD)' : 'Marca y Modelo'}
                            </label>
                            <input 
                                type="text" 
                                required 
                                placeholder={formData.tipo_dispositivo === 'Computadora' ? "Ej. HP Elite Mini 600 G9, i7-13700, 16GB RAM, 512GB SSD" : "Ej. Zebra ZT411 Impresora de Etiquetas"} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.marca_modelo} 
                                onChange={(e) => setFormData({...formData, marca_modelo: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Checkbox Criticidad de Producción */}
                    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="mt-0.5 h-4 w-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500" 
                                checked={formData.es_critico} 
                                onChange={(e) => setFormData({...formData, es_critico: e.target.checked})} 
                            />
                            <div>
                                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                    <AlertTriangle size={15} />
                                    <span>Marcar como Equipo Crítico de Producción</span>
                                </p>
                                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-medium">
                                    Si este equipo falla, detiene una estación o línea activa en planta.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={() => setIsFormModalOpen(false)} 
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
                            <span>{isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Registro' : 'Guardar Equipo')}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: Bitácora de Mantenimiento */}
            <Modal
                isOpen={isBitacoraModalOpen && !!selectedEquipoBitacora}
                onClose={() => setIsBitacoraModalOpen(false)}
                title={`Bitácora de Servicios • ${selectedEquipoBitacora?.nombre_red || selectedEquipoBitacora?.numero_serie}`}
                subtitle={`Usuario: ${selectedEquipoBitacora?.usuario_asignado} | Modelo: ${selectedEquipoBitacora?.marca_modelo}`}
                icon={Wrench}
                maxWidth="max-w-5xl"
            >
                {selectedEquipoBitacora && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulario Registro de Servicio */}
                        <div className="lg:col-span-1 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Registrar Servicio Técnico
                            </h4>
                            <form onSubmit={handleBitacoraSubmit} className="space-y-3.5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Tipo de Servicio
                                    </label>
                                    <select 
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                        value={bitacoraForm.tipo_servicio} 
                                        onChange={e => setBitacoraForm({...bitacoraForm, tipo_servicio: e.target.value})}
                                    >
                                        <option value="Preventivo">Mantenimiento Preventivo</option>
                                        <option value="Correctivo">Mantenimiento Correctivo</option>
                                        <option value="Instalación">Instalación / Reinstalación</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Técnico Asignado
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                        value={bitacoraForm.tecnico_asignado} 
                                        onChange={e => setBitacoraForm({...bitacoraForm, tecnico_asignado: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Fecha de Ejecución
                                    </label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                        value={bitacoraForm.fecha_servicio} 
                                        onChange={e => setBitacoraForm({...bitacoraForm, fecha_servicio: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Trabajo Realizado / Refacciones
                                    </label>
                                    <textarea 
                                        rows={4} 
                                        required 
                                        placeholder="Limpieza de polvo, cambio de pasta térmica, actualización de drivers, etc..."
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#009ba4] outline-none resize-none" 
                                        value={bitacoraForm.trabajo_realizado} 
                                        onChange={e => setBitacoraForm({...bitacoraForm, trabajo_realizado: e.target.value})}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full inline-flex items-center justify-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#009ba4]/25 cursor-pointer"
                                >
                                    <Save size={15} />
                                    <span>{isSubmitting ? 'Guardando...' : 'Guardar en Bitácora'}</span>
                                </button>
                            </form>
                        </div>

                        {/* Listado Histórico de Mantenimientos */}
                        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                                Historial Registrado ({bitacoraList.length})
                            </h4>
                            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-3 pr-1">
                                {bitacoraList.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-slate-400">
                                        No hay servicios registrados en la bitácora de este equipo.
                                    </div>
                                ) : (
                                    bitacoraList.map(b => (
                                        <div key={b.id} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {b.tipo_servicio}
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                                    <span className="text-[11px] text-[#009ba4] font-semibold">
                                                        {b.tecnico_asignado}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(b.fecha_servicio).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {b.trabajo_realizado}
                                            </p>
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