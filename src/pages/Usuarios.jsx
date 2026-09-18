import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Search, RefreshCw, Pencil, Trash2, X, Save, UserPlus } from 'lucide-react';

export const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortOrder, setSortOrder] = useState('desc');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        numero_nomina: '',
        nombre_completo: '',
        departamento_id: 1, // ICT por defecto
        rol: 'Operador'     // Rol por defecto
    });

    const rolesDisponibles = ["Administrador", "Operador", "Seguridad", "Administrativo"];

    const departamentosDisponibles = [
        { id: 1, nombre: "ICT / Sistemas" }, { id: 2, nombre: "Recursos Humanos" },
        { id: 3, nombre: "Producción" }, { id: 4, nombre: "Calidad" },
        { id: 5, nombre: "Mantenimiento" }, { id: 6, nombre: "Logística" },
        { id: 7, nombre: "Industrialización" }, { id: 8, nombre: "Ingeniería" },
        { id: 9, nombre: "Compras" }, { id: 10, nombre: "Gerencia" },
        { id: 11, nombre: "Almacén" }, { id: 12, nombre: "Enfermería" }
    ];

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/usuarios?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}`);
            setUsuarios(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, [currentPage, sortOrder]);

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ id: null, numero_nomina: '', nombre_completo: '', departamento_id: 1, rol: 'Operador' });
        setIsModalOpen(true);
    };

    const openEditModal = (usuario) => {
        setEditMode(true);
        setFormData({ ...usuario });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editMode) {
                await api.put(`/usuarios/${formData.id}`, formData);
            } else {
                await api.post('/usuarios', formData);
                setCurrentPage(1);
            }
            setIsModalOpen(false);
            fetchUsuarios();
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al guardar el usuario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de dar de baja a este usuario? Ya no podrá acceder al sistema.')) return;
        try {
            await api.delete(`/usuarios/${id}`);
            fetchUsuarios();
        } catch (error) {
            alert("Error al dar de baja al usuario.");
        }
    };

    const getDepartamentoNombre = (id) => {
        const depto = departamentosDisponibles.find(d => d.id === parseInt(id));
        return depto ? depto.nombre : `ID: ${id}`;
    };

    const filteredUsuarios = usuarios.filter(u => 
        u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.numero_nomina?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={28} className="text-blue-600" />
                        Gestión de Usuarios
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Administración de accesos, roles y personal del sistema.
                    </p>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                    <UserPlus size={18} /><span>Nuevo Usuario</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" placeholder="Buscar por nómina, nombre o rol..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={fetchUsuarios} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">Nómina</th>
                                <th className="p-4 font-semibold">Nombre Completo</th>
                                <th className="p-4 font-semibold">Departamento</th>
                                <th className="p-4 font-semibold">Rol (Acceso)</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Cargando usuarios...</td></tr>
                            ) : filteredUsuarios.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay usuarios registrados.</td></tr>
                            ) : (
                                filteredUsuarios.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{u.numero_nomina}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{u.nombre_completo}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{getDepartamentoNombre(u.departamento_id)}</td>
                                        <td className="p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">{u.rol}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(u)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1" title="Editar">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1" title="Dar de baja">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && usuarios.length > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Anterior</button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Página {currentPage} de {totalPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Siguiente</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editMode ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Número de Nómina</label>
                                <input required type="text" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.numero_nomina} onChange={(e) => setFormData({...formData, numero_nomina: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                                <input required type="text" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Departamento</label>
                                    <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.departamento_id} onChange={(e) => setFormData({...formData, departamento_id: parseInt(e.target.value)})}>
                                        {departamentosDisponibles.map(d => (
                                            <option key={d.id} value={d.id}>{d.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol de Acceso</label>
                                    <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                                        {rolesDisponibles.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                                    <Save size={18} /><span>{editMode ? 'Actualizar' : 'Guardar'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};