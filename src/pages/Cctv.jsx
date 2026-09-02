import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, RefreshCw, X, Save, Pencil, Trash2, Cctv as CctvIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Cctv = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador';

    const [camaras, setCamaras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortOrder, setSortOrder] = useState('desc');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        nombre_camara: '',
        ubicacion: '',
        stream_url: '',
        estatus_red: 1
    });

    const fetchCamaras = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/cctv?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}`);
            setCamaras(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (error) {
            console.error("Error al cargar cámaras:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCamaras();
    }, [currentPage, sortOrder]);

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ id: null, nombre_camara: '', ubicacion: '', stream_url: '', estatus_red: 1 });
        setIsModalOpen(true);
    };

    const openEditModal = (camara) => {
        setEditMode(true);
        setFormData({ ...camara });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editMode) {
                await api.put(`/cctv/${formData.id}`, formData);
            } else {
                await api.post('/cctv', formData);
                setCurrentPage(1);
            }
            setIsModalOpen(false);
            fetchCamaras();
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al guardar la cámara.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de dar de baja esta cámara? Se mantendrá en el registro histórico.')) return;
        try {
            await api.delete(`/cctv/${id}`);
            fetchCamaras();
        } catch (error) {
            alert("Error al dar de baja la cámara.");
        }
    };

    const getStatusBadge = (status) => {
        const estatusNum = Number(status);
        if (estatusNum === 1) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Online</span>;
        if (estatusNum === 2) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">Mantenimiento</span>;
        
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">Offline</span>;
    };

    const filteredCamaras = camaras.filter(cam => 
        cam.nombre_camara?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cam.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CctvIcon size={28} className="text-blue-600" />
                        Monitoreo CCTV
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gestión de infraestructura y ubicaciones físicas del circuito cerrado.
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={openCreateModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                        <Plus size={18} /><span>Registrar Cámara</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
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
                    <button onClick={fetchCamaras} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-175">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">Cámara</th>
                                <th className="p-4 font-semibold">Fecha Registro</th>
                                <th className="p-4 font-semibold">Ubicación</th>
                                <th className="p-4 font-semibold">Estatus Red</th>
                                {isAdmin && <th className="p-4 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={isAdmin ? "5" : "4"} className="p-8 text-center text-slate-500">Cargando infraestructura...</td></tr>
                            ) : filteredCamaras.length === 0 ? (
                                <tr><td colSpan={isAdmin ? "5" : "4"} className="p-8 text-center text-slate-500">No hay cámaras en esta página.</td></tr>
                            ) : (
                                filteredCamaras.map((camara) => (
                                    <tr key={camara.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{camara.nombre_camara}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(camara.date_created).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{camara.ubicacion}</td>
                                        <td className="p-4">{getStatusBadge(camara.estatus_red)}</td>
                                        {isAdmin && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(camara)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 transition-colors" title="Editar">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(camara.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 transition-colors" title="Dar de baja">
                                                        <Trash2 size={18} />
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

            {/* Modal de Registro/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editMode ? 'Editar Cámara' : 'Registrar Nueva Cámara'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre / Identificador</label>
                                <input required type="text" placeholder="Ej. CAM-EXT-01" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.nombre_camara} onChange={(e) => setFormData({...formData, nombre_camara: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ubicación Física</label>
                                <input required type="text" placeholder="Ej. Estacionamiento Norte" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estatus de Red</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.estatus_red} 
                                    onChange={(e) => setFormData({...formData, estatus_red: parseInt(e.target.value)})}
                                >
                                    <option value={1}>Online</option>
                                    <option value={0}>Offline</option>
                                    <option value={2}>Mantenimiento</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URL del Stream (Opcional)</label>
                                <input type="text" placeholder="rtsp://..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.stream_url} onChange={(e) => setFormData({...formData, stream_url: e.target.value})} />
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"><Save size={18} /><span>{editMode ? 'Actualizar' : 'Guardar'}</span></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};