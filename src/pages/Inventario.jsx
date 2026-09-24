import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Wrench, Pencil, Trash2, X, Save, AlertTriangle, Monitor, Printer, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Inventario = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador';

    // Estados Generales
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
        tecnico_asignado: user?.nombre_completo || '', // Toma el nombre del admin logueado
        fecha_servicio: new Date().toISOString().split('T')[0], // Fecha actual por defecto
        trabajo_realizado: ''
    });

    // ================= FUNCIONES API INVENTARIO ================= //

    const fetchEquipos = async () => {
        setLoading(true);
        try {
            // Agregamos el search a la URL
            const response = await api.get(`/equipos?page=${currentPage}&search=${searchTerm}`);
            setEquipos(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (error) {
            console.error("Error al cargar inventario:", error);
        } finally {
            setLoading(false);
        }
    };

    // Efecto unificado con debounce para la búsqueda y paginación
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchEquipos();
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, currentPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Regresamos a la página 1 cuando el usuario busca algo nuevo
    };

    // Crear o Editar Equipo
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSubmit = { ...formData, es_critico: formData.es_critico ? 1 : 0 };
            
            if (isEditMode) {
                await api.put(`/equipos/${selectedEquipoId}`, dataToSubmit);
            } else {
                await api.post('/equipos', dataToSubmit);
                setCurrentPage(1); // Solo regresa al inicio si es nuevo
            }
            
            setIsFormModalOpen(false);
            setFormData(initialForm);
            fetchEquipos();
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar el equipo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Preparar Edición
    const openEditModal = (equipo) => {
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
            es_critico: equipo.es_critico === 1
        });
        setSelectedEquipoId(equipo.id);
        setIsEditMode(true);
        setIsFormModalOpen(true);
    };

    // Borrado Lógico
    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este equipo del inventario?")) return;
        
        try {
            await api.delete(`/equipos/${id}`);
            fetchEquipos();
        } catch (error) {
            alert("Error al intentar eliminar el equipo.");
        }
    };

    // ================= FUNCIONES API BITÁCORA ================= //

    const openBitacora = async (equipo) => {
        setSelectedEquipoBitacora(equipo);
        setIsBitacoraModalOpen(true);
        loadBitacoraHistory(equipo.id);
    };

    const loadBitacoraHistory = async (id) => {
        try {
            const response = await api.get(`/equipos/${id}/bitacora`);
            setBitacoraList(response.data.data || []);
        } catch (error) {
            console.error("Error al cargar la bitácora:", error);
        }
    };

    const handleBitacoraSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post(`/equipos/${selectedEquipoBitacora.id}/bitacora`, bitacoraForm);
            setBitacoraForm({ ...bitacoraForm, trabajo_realizado: '' }); // Limpia solo el campo de notas
            loadBitacoraHistory(selectedEquipoBitacora.id);
        } catch (error) {
            alert("Error al registrar el mantenimiento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= RENDERIZADO ================= //

    const equiposCriticos = equipos.filter(eq => eq.es_critico === 1);
    const equiposGenerales = equipos.filter(eq => eq.es_critico === 0);

    const TableRow = ({ equipo }) => (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800 last:border-0">
            <td className="p-3 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">{equipo.usuario_asignado || 'Sin asignar'}</p>
                {equipo.es_critico === 1 && <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Producción</span>}
            </td>
            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200">{equipo.etiqueta || 'N/A'}</p>
                <p className="text-xs">PID: {equipo.prod_id || 'N/A'}</p>
            </td>
            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                <p>{equipo.numero_serie || 'N/A'}</p>
                <p className="text-xs bg-slate-100 dark:bg-slate-800 inline-block px-1 rounded mt-1 border border-slate-200 dark:border-slate-700">{equipo.nombre_red || 'N/A'}</p>
            </td>
            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                <p>{equipo.sistema_operativo || 'N/A'}</p>
                {equipo.tipo_dispositivo === 'Computadora' && <p className="text-xs">Build: {equipo.os_build || 'N/A'}</p>}
            </td>
            <td className="p-3 text-sm text-slate-600 dark:text-slate-300 max-w-50 truncate" title={equipo.marca_modelo}>
                {equipo.marca_modelo}
            </td>
            <td className="p-3">
                <div className="flex gap-2">
                    <button onClick={() => openBitacora(equipo)} className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors">
                        <Wrench size={14} /> Bitácora
                    </button>
                    {isAdmin && (
                        <>
                            <button onClick={() => openEditModal(equipo)} className="bg-amber-500 hover:bg-amber-600 text-white p-1.5 rounded transition-colors" title="Editar"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(equipo.id)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            {/* Cabecera Principal */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" placeholder="Buscar Usuario, PC o Serie..." 
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
                        value={searchTerm} 
                        onChange={handleSearchChange}
                    />
                </div>
                {isAdmin && (
                    <button onClick={() => { setIsEditMode(false); setFormData(initialForm); setIsFormModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                        <Plus size={18} /><span>Nuevo Registro</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-8 text-slate-500">Cargando inventario...</div>
            ) : (
                <>
                    {/* Tablas de Inventario */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
                        <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <AlertTriangle className="text-red-500" size={24} />
                            <h3 className="text-xl font-bold text-red-600 dark:text-red-500">Equipos de Producción (Críticos)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-200">
                                <thead>
                                    <tr className="bg-red-600 text-white text-xs uppercase tracking-wider">
                                        <th className="p-3 font-semibold">Usuario / Área</th>
                                        <th className="p-3 font-semibold">Etiqueta / ProdID</th>
                                        <th className="p-3 font-semibold">Serial / Nombre Red</th>
                                        <th className="p-3 font-semibold">Sistema Operativo</th>
                                        <th className="p-3 font-semibold">Hardware / Modelo</th>
                                        <th className="p-3 font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equiposCriticos.length === 0 ? <tr><td colSpan="6" className="p-6 text-center text-slate-500">No hay equipos registrados.</td></tr> : equiposCriticos.map(eq => <TableRow key={eq.id} equipo={eq} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <Monitor className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-500">Equipos Administrativos / Generales</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-200">
                                <thead>
                                    <tr className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                                        <th className="p-3 font-semibold">Usuario / Área</th>
                                        <th className="p-3 font-semibold">Etiqueta / ProdID</th>
                                        <th className="p-3 font-semibold">Serial / Nombre Red</th>
                                        <th className="p-3 font-semibold">Sistema Operativo</th>
                                        <th className="p-3 font-semibold">Hardware / Modelo</th>
                                        <th className="p-3 font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equiposGenerales.length === 0 ? <tr><td colSpan="6" className="p-6 text-center text-slate-500">No hay equipos registrados.</td></tr> : equiposGenerales.map(eq => <TableRow key={eq.id} equipo={eq} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación */}
                    {!loading && equipos.length > 0 && (
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mt-4">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">Anterior</button>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">Siguiente</button>
                        </div>
                    )}
                </>
            )}

            {/* MODAL 1: Crear / Editar Registro */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0 rounded-t-xl">
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{isEditMode ? 'Editar Equipo' : 'Nuevo Registro'}</h3>
                            <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg flex gap-6 items-center border border-slate-200 dark:border-slate-700">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Categoría del Dispositivo:</span>
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input type="radio" name="tipo" checked={formData.tipo_dispositivo === 'Computadora'} onChange={() => setFormData({...formData, tipo_dispositivo: 'Computadora', sistema_operativo: 'Windows 11 Enterprise'})} className="text-blue-600 focus:ring-blue-500" />
                                    <Monitor size={16} className="text-slate-500" /> Computadora / Laptop
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input type="radio" name="tipo" checked={formData.tipo_dispositivo === 'Impresora'} onChange={() => setFormData({...formData, tipo_dispositivo: 'Impresora', sistema_operativo: 'N/A', os_build: 'N/A'})} className="text-blue-600 focus:ring-blue-500" />
                                    <Printer size={16} className="text-slate-500" /> Impresora / Switch / Otro
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{formData.tipo_dispositivo === 'Computadora' ? 'Usuario Asignado' : 'Área Operativa o Usuario'}</label>
                                    <input type="text" required className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.usuario_asignado} onChange={(e) => setFormData({...formData, usuario_asignado: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Etiqueta</label>
                                        <input type="text" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.etiqueta} onChange={(e) => setFormData({...formData, etiqueta: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ProdID</label>
                                        <input type="text" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.prod_id} onChange={(e) => setFormData({...formData, prod_id: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">N/S (Serie)</label>
                                    <input type="text" required className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.numero_serie} onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{formData.tipo_dispositivo === 'Computadora' ? 'Nombre PC' : 'Nombre en Red / IP'}</label>
                                    <input type="text" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.nombre_red} onChange={(e) => setFormData({...formData, nombre_red: e.target.value})} />
                                </div>
                                
                                {formData.tipo_dispositivo === 'Computadora' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Versión SO</label>
                                            <input type="text" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.sistema_operativo} onChange={(e) => setFormData({...formData, sistema_operativo: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">OS Build</label>
                                            <input type="text" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.os_build} onChange={(e) => setFormData({...formData, os_build: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        {formData.tipo_dispositivo === 'Computadora' ? 'Hardware (Procesador, RAM, Almacenamiento)' : 'Descripción / Modelo'}
                                    </label>
                                    <input type="text" required placeholder={formData.tipo_dispositivo === 'Computadora' ? "Ej. HP Elite Mini 600 G9..." : "Ej. Impresora Zebra ZT411"} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={formData.marca_modelo} onChange={(e) => setFormData({...formData, marca_modelo: e.target.value})} />
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 h-4 w-4 text-red-600 rounded border-red-300 focus:ring-red-500" checked={formData.es_critico} onChange={(e) => setFormData({...formData, es_critico: e.target.checked})} />
                                    <div>
                                        <p className="font-bold text-red-700 dark:text-red-500 flex items-center gap-1"><AlertTriangle size={16}/> Prioridad Operativa</p>
                                        <p className="text-sm text-red-600/80 dark:text-red-400/80">Marcar como equipo crítico de Línea de Producción</p>
                                    </div>
                                </label>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex gap-2">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="w-1/3 bg-slate-500 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors">
                                    <Save size={18} /> {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Registro' : 'Guardar Registro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Bitácora de Mantenimiento */}
            {isBitacoraModalOpen && selectedEquipoBitacora && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                        {/* Cabecera Bitácora */}
                        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2"><Wrench size={24}/> Bitácora de Mantenimiento</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Equipo: <span className="font-semibold text-slate-900 dark:text-white">{selectedEquipoBitacora.nombre_red || 'N/A'}</span> | 
                                    S/N: <span className="font-semibold text-slate-900 dark:text-white">{selectedEquipoBitacora.numero_serie}</span> | 
                                    Usuario: <span className="font-semibold text-slate-900 dark:text-white">{selectedEquipoBitacora.usuario_asignado}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsBitacoraModalOpen(false)} className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded shadow-sm text-sm font-semibold transition-colors">
                                <ArrowLeft size={16}/> Volver al Inventario
                            </button>
                        </div>
                        
                        {/* Contenido a dos columnas */}
                        <div className="flex-1 overflow-hidden p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                                {/* Formulario Nuevo Servicio */}
                                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col h-full overflow-y-auto">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Registrar Nuevo Servicio</h3>
                                    <form onSubmit={handleBitacoraSubmit} className="space-y-4 flex-1">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Servicio</label>
                                            <select className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={bitacoraForm.tipo_servicio} onChange={e => setBitacoraForm({...bitacoraForm, tipo_servicio: e.target.value})}>
                                                <option value="Preventivo">Preventivo</option>
                                                <option value="Correctivo">Correctivo</option>
                                                <option value="Instalación">Instalación / Configuración</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Técnico Asignado</label>
                                            <input type="text" required className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={bitacoraForm.tecnico_asignado} onChange={e => setBitacoraForm({...bitacoraForm, tecnico_asignado: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha del Servicio</label>
                                            <input type="date" required className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={bitacoraForm.fecha_servicio} onChange={e => setBitacoraForm({...bitacoraForm, fecha_servicio: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Trabajo Realizado / Notas</label>
                                            <textarea rows="5" required className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none" value={bitacoraForm.trabajo_realizado} onChange={e => setBitacoraForm({...bitacoraForm, trabajo_realizado: e.target.value})}></textarea>
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded transition-colors flex justify-center items-center gap-2">
                                            <Save size={16}/> Guardar Registro
                                        </button>
                                    </form>
                                </div>

                                {/* Historial de Servicios */}
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
                                    <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Historial de Servicios</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-5">
                                        <table className="w-full text-left border-collapse min-w-125">
                                            <thead>
                                                <tr className="bg-blue-600 text-white text-xs uppercase font-bold">
                                                    <th className="p-2 w-24">Fecha</th>
                                                    <th className="p-2 w-32">Tipo</th>
                                                    <th className="p-2">Trabajo Realizado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bitacoraList.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-4 text-center text-sm text-slate-500 border border-slate-200 dark:border-slate-700">No hay registros de mantenimiento para este equipo.</td></tr>
                                                ) : (
                                                    bitacoraList.map(b => (
                                                        <tr key={b.id} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                            <td className="p-3 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-nowrap">{new Date(b.fecha_servicio).toLocaleDateString()}</td>
                                                            <td className="p-3 align-top">
                                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.tipo_servicio}</p>
                                                                <p className="text-xs text-slate-500 mt-1">Por: {b.tecnico_asignado}</p>
                                                            </td>
                                                            <td className="p-3 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-pre-wrap">{b.trabajo_realizado}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};