import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Users, Search, RefreshCw, Pencil, Trash2, Save, 
    UserPlus, ArrowUpDown, UserCircle, Shield, Briefcase
} from 'lucide-react';
import { getCached } from '../api/cache';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';

export const Usuarios = () => {
    const { toast, confirm } = useNotification();
    const [usuarios, setUsuarios] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        numero_nomina: '',
        nombre_completo: '',
        departamento_id: 1,
        rol: 'Operador'
    });

    const rolesDisponibles = ["Administrador", "Operador", "Seguridad", "Administrativo"];

    // Cargar departamentos desde la API con caché
    useEffect(() => {
        const fetchDepartamentos = async () => {
            try {
                const res = await getCached('/departamentos');
                if (res && res.data) {
                    setDepartamentos(res.data);
                }
            } catch (error) {
                console.error("Error al cargar departamentos:", error);
            }
        };
        fetchDepartamentos();
    }, []);

    const fetchUsuarios = async (signal = null) => {
        setLoading(true);
        try {
            const response = await api.get(
                `/usuarios?page=${currentPage}&sort_by=date_created&sort_order=${sortOrder}&search=${searchTerm}`,
                signal ? { signal } : {}
            );
            setUsuarios(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setTotalUsuarios(response.data.meta?.total || (response.data.data ? response.data.data.length : 0));
        } catch (error) {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                console.error("Error al cargar usuarios:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const delay = searchTerm ? 350 : 0;

        const timeoutId = setTimeout(() => {
            fetchUsuarios(controller.signal);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm, currentPage, sortOrder]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const openCreateModal = () => {
        setEditMode(false);
        const defaultDeptoId = departamentos.length > 0 ? departamentos[0].id : 1;
        setFormData({ 
            id: null, 
            numero_nomina: '', 
            nombre_completo: '', 
            departamento_id: defaultDeptoId, 
            rol: 'Operador' 
        });
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
                toast.success("Información del colaborador actualizada correctamente.");
            } else {
                await api.post('/usuarios', formData);
                setCurrentPage(1);
                toast.success("Nuevo colaborador registrado en el sistema.");
            }
            setIsModalOpen(false); // Cierra el modal inmediatamente
            fetchUsuarios();
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al guardar el usuario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "¿Dar de baja colaborador?",
            message: "¿Estás seguro de dar de baja a este colaborador? Su acceso quedará deshabilitado en el sistema.",
            confirmText: "Sí, dar de baja",
            cancelText: "Cancelar",
            variant: "rose"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/usuarios/${id}`);
            fetchUsuarios();
            toast.success("Colaborador dado de baja correctamente.");
        } catch (error) {
            toast.error("Error al dar de baja al usuario.");
        }
    };

    const getDepartamentoNombre = (id) => {
        const depto = departamentos.find(d => d.id === parseInt(id));
        return depto ? depto.nombre : `Departamento #${id}`;
    };

    const getRoleBadgeVariant = (rol) => {
        switch (rol) {
            case 'Administrador': return 'teal';
            case 'Seguridad': return 'amber';
            case 'Administrativo': return 'blue';
            case 'Operador':
            default: return 'gray';
        }
    };

    return (
        <div className="space-y-6 relative font-sans">
            {/* CABECERA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Users size={24} className="text-[#009ba4]" />
                        <span>Administración de Usuarios y Accesos</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Control de credenciales por nómina, asignación de áreas departamentales y permisos de rol.
                    </p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="inline-flex items-center gap-2 bg-[#009ba4] hover:bg-[#007e86] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#009ba4]/25 transition-all cursor-pointer"
                >
                    <UserPlus size={16} />
                    <span>Nuevo Usuario</span>
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
                                placeholder="Buscar nómina, nombre o rol..." 
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
                            <span>{sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}</span>
                        </button>
                    </div>

                    <button 
                        onClick={() => fetchUsuarios()} 
                        className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#009ba4] hover:border-[#009ba4] transition-all bg-white dark:bg-slate-800 self-end sm:self-auto"
                        title="Actualizar listado"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* TABLA DE USUARIOS */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                                <th className="py-3.5 px-4">Nómina</th>
                                <th className="py-3.5 px-4">Nombre Completo</th>
                                <th className="py-3.5 px-4">Departamento</th>
                                <th className="py-3.5 px-4">Rol de Acceso</th>
                                <th className="py-3.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <div className="h-4 w-4 border-2 border-[#009ba4] border-t-transparent rounded-full animate-spin" />
                                            <span>Consultando catálogo de usuarios...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4">
                                        <EmptyState 
                                            title="No se encontraron usuarios"
                                            description="No hay colaboradores que coincidan con la búsqueda."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-xs font-bold text-[#009ba4] dark:text-[#2ec0c7] bg-[#009ba4]/10 px-2.5 py-1 rounded-lg">
                                                {u.numero_nomina}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {u.nombre_completo ? u.nombre_completo.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {u.nombre_completo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {getDepartamentoNombre(u.departamento_id)}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <Badge variant={getRoleBadgeVariant(u.rol)} size="xs">
                                                {u.rol}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => openEditModal(u)} 
                                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer" 
                                                    title="Editar Usuario"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(u.id)} 
                                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer" 
                                                    title="Dar de Baja"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
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
                    totalItems={totalUsuarios}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* MODAL: Crear / Editar Usuario */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editMode ? 'Editar Colaborador' : 'Registrar Nuevo Usuario'}
                subtitle="Asigna número de nómina, departamento y nivel de acceso en el sistema."
                icon={UserPlus}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Número de Nómina
                        </label>
                        <input 
                            required 
                            type="text" 
                            placeholder="Ej. ICT001 o NÓMINA"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                            value={formData.numero_nomina} 
                            onChange={(e) => setFormData({...formData, numero_nomina: e.target.value})} 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Nombre Completo
                        </label>
                        <input 
                            required 
                            type="text" 
                            placeholder="Ej. Juan Pérez García"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none" 
                            value={formData.nombre_completo} 
                            onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Departamento
                            </label>
                            <select 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.departamento_id} 
                                onChange={(e) => setFormData({...formData, departamento_id: parseInt(e.target.value)})}
                            >
                                {departamentos.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Rol de Acceso
                            </label>
                            <select 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#009ba4] outline-none" 
                                value={formData.rol} 
                                onChange={(e) => setFormData({...formData, rol: e.target.value})}
                            >
                                {rolesDisponibles.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
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
                            <span>{editMode ? 'Actualizar Usuario' : 'Registrar Usuario'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};