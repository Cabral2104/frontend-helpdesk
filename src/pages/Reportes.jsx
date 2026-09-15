import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FileText, FileSpreadsheet, FileJson, Download, ShieldAlert, AlertCircle } from 'lucide-react';

export const Reportes = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador';

    const [formData, setFormData] = useState({
        modulo: 'seguridad',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [isExporting, setIsExporting] = useState(false);

    // Si entra alguien que no es Admin, bloqueamos la vista
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                <ShieldAlert size={48} className="text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Acceso Restringido</h2>
                <p>Solo los administradores pueden exportar datos del sistema.</p>
            </div>
        );
    }

    const handleExport = async (formato) => {
        if (!formData.fecha_inicio || !formData.fecha_fin) {
            alert('Por favor, selecciona un rango de fechas.');
            return;
        }

        setIsExporting(true);
        try {
            // Hacemos la petición a Laravel indicando que esperamos un archivo (blob)
            const response = await api.get('/exportar', {
                params: { ...formData, formato },
                responseType: 'blob' 
            });

            // Lógica para descargar el archivo en el navegador
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Asignar la extensión correcta
            let extension = formato === 'excel' ? 'csv' : formato;
            link.setAttribute('download', `Reporte_${formData.modulo}_${formData.fecha_inicio}.${extension}`);
            
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error al exportar:", error);
            alert("Hubo un error al generar el archivo. Verifica las fechas e inténtalo de nuevo.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download size={28} className="text-blue-600" />
                    Exportación de Datos
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Genera reportes operativos de las diferentes áreas del sistema Wittur ICT.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6">
                
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex gap-3 mb-6 items-start border border-blue-100 dark:border-blue-800/30">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">Selecciona el módulo y el rango de fechas. Los archivos PDF son ideales para impresión y firmas, mientras que CSV/Excel y JSON son mejores para análisis de datos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Selector de Módulo */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Módulo de Origen</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.modulo}
                            onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                        >
                            <option value="seguridad">Bitácora de Seguridad</option>
                            <option value="tickets">Tickets de Soporte TI</option>
                            <option value="inventario">Inventario de Equipos</option>
                            <option value="cctv">Cámaras CCTV</option>
                            <option value="usuarios">Usuarios del Sistema</option>
                            <option value="todos" className="font-bold text-blue-600">TODOS LOS APARTADOS</option>
                        </select>
                    </div>

                    {/* Fechas */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha Inicio</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.fecha_inicio}
                                onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha Fin</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.fecha_fin}
                                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Botones de Exportación */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">Selecciona el formato de descarga</h3>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                        >
                            <FileText size={20} />
                            Generar PDF
                        </button>

                        <button 
                            onClick={() => handleExport('excel')}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet size={20} />
                            Exportar Excel (CSV)
                        </button>

                        <button 
                            onClick={() => handleExport('json')}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                        >
                            <FileJson size={20} />
                            Datos RAW (JSON)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};