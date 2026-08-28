import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Eye, RefreshCw, X, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Tickets = () => {
    // 1. Extraemos los datos del usuario actual desde nuestro contexto
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador';

    // 2. Estados principales de la tabla
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 3. Estados de la Modal (Solo los usarán los empleados normales)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        categoria_incidencia_id: 1
    });

    // Función para traer los tickets (El backend decidirá cuáles devolver según el rol)
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tickets');
            setTickets(response.data.data || []);
        } catch (error) {
            console.error("Error al cargar los tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Función para guardar un nuevo ticket
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await api.post('/tickets', formData);
            setIsModalOpen(false);
            setFormData({ titulo: '', descripcion: '', prioridad: 'Media', categoria_incidencia_id: 1 });
            fetchTickets(); 
        } catch (error) {
            console.error("Error al crear el ticket:", error);
            alert(error.response?.data?.message || "Ocurrió un error al guardar el ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Diseño visual para los estatus
    const getStatusBadge = (status) => {
        const styles = {
            'Abierto': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            'En Progreso': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            'Resuelto': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        };
        const defaultStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        
        return (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || defaultStyle}`}>
                {status || 'Abierto'}
            </span>
        );
    };

    return (
        <div className="space-y-6 relative">
            
            {/* Cabecera Inteligente (Depende del Rol) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isAdmin ? 'Gestión Global de Tickets' : 'Mis Tickets de Soporte'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isAdmin 
                            ? 'Administra y resuelve los reportes de toda la planta.' 
                            : 'Crea y da seguimiento a tus reportes de fallas.'}
                    </p>
                </div>
                
                {/* Botón de crear SOLO para usuarios normales */}
                {!isAdmin && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors"
                    >
                        <Plus size={18} />
                        <span>Nuevo Ticket</span>
                    </button>
                )}
            </div>

            {/* Tarjeta de la Tabla */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar ticket..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchTickets} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-150">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Asunto</th>
                                <th className="p-4 font-semibold">Prioridad</th>
                                <th className="p-4 font-semibold">Estatus</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay tickets registrados.</td></tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">#{ticket.id}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-37.5">{ticket.descripcion_falla}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{ticket.prioridad}</td>
                                        <td className="p-4">{getStatusBadge(ticket.estatus)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 transition-colors" title="Ver Detalles">
                                                    <Eye size={18} />
                                                </button>
                                                
                                                {/* Acción exclusiva de Administrador: Marcar como resuelto */}
                                                {isAdmin && ticket.estatus !== 'Resuelto' && (
                                                    <button className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1 transition-colors" title="Marcar como Resuelto">
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
            </div>

            {/* Modal para Crear Ticket (SOLO renderiza si NO eres admin) */}
            {!isAdmin && isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Nuevo Ticket</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Asunto breve</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Problema con impresora"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción del problema</label>
                                <textarea 
                                    required
                                    rows="4"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Detalla lo que está ocurriendo..."
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioridad</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.prioridad}
                                    onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                                >
                                    <option value="Baja">Baja (No afecta la operación)</option>
                                    <option value="Media">Media (Afecta parcialmente)</option>
                                    <option value="Alta">Alta (Operación detenida)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <Save size={18} />
                                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Ticket'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};