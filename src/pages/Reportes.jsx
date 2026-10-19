import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';
import { 
    FileText, FileSpreadsheet, FileJson, Download, ShieldAlert, 
    AlertCircle, Calendar, Check, ArrowRight, Layers
} from 'lucide-react';

export const Reportes = () => {
    const { user } = useAuth();
    const { toast } = useNotification();
    const isAdmin = user?.rol === 'Administrador';

    const [formData, setFormData] = useState({
        modulo: 'seguridad',
        fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        fecha_fin: new Date().toISOString().split('T')[0]
    });
    const [isExporting, setIsExporting] = useState(false);
    const [activeFormat, setActiveFormat] = useState(null);

    // Acceso restringido para no administradores
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Acceso Restringido</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    La descarga y exportación de bases de datos operativas está reservada exclusivamente para el departamento de ICT.
                </p>
            </div>
        );
    }

    const setDatePreset = (days) => {
        const end = new Date();
        const start = new Date();
        if (days === 0) {
            // Hoy
            setFormData({
                ...formData,
                fecha_inicio: end.toISOString().split('T')[0],
                fecha_fin: end.toISOString().split('T')[0]
            });
        } else {
            start.setDate(end.getDate() - days);
            setFormData({
                ...formData,
                fecha_inicio: start.toISOString().split('T')[0],
                fecha_fin: end.toISOString().split('T')[0]
            });
        }
    };

    const handleExport = async (formato) => {
        if (!formData.fecha_inicio || !formData.fecha_fin) {
            toast.warning('Por favor, selecciona un rango de fechas válido.');
            return;
        }

        setIsExporting(true);
        setActiveFormat(formato);
        try {
            const response = await api.get('/exportar', {
                params: { ...formData, formato },
                responseType: 'blob' 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const extension = formato === 'excel' ? 'csv' : formato;
            link.setAttribute('download', `Wittur_Reporte_${formData.modulo}_${formData.fecha_inicio}_a_${formData.fecha_fin}.${extension}`);
            
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success(`Reporte (${formato.toUpperCase()}) generado y descargado exitosamente.`);
        } catch (error) {
            console.error("Error al exportar:", error);
            toast.error("Hubo un error al generar el archivo. Verifica el rango de fechas e inténtalo de nuevo.");
        } finally {
            setIsExporting(false);
            setActiveFormat(null);
        }
    };

    const modulos = [
        { id: 'seguridad', label: 'Bitácora de Seguridad', desc: 'Incidentes y novedades de caseta' },
        { id: 'tickets', label: 'Tickets de Soporte TI', desc: 'Historial de fallas y resoluciones' },
        { id: 'inventario', label: 'Inventario de Equipos', desc: 'Hardware, series y asignaciones' },
        { id: 'cctv', label: 'Infraestructura CCTV', desc: 'Direcciones IP y switches' },
        { id: 'usuarios', label: 'Usuarios del Sistema', desc: 'Nóminas, roles y departamentos' },
        { id: 'todos', label: 'REPORTE GENERAL INTEGRAL', desc: 'Consolidado de todas las áreas' },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto font-sans">
            {/* CABECERA */}
            <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <Download size={24} className="text-[#009ba4]" />
                    <span>Centro de Exportación de Datos</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Generación de informes ejecutivos y exportación de bases de datos operativas de Wittur México.
                </p>
            </div>

            {/* PANEL PRINCIPAL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden p-6 sm:p-8">
                
                {/* Banner de información */}
                <div className="bg-[#009ba4]/10 border border-[#009ba4]/20 text-[#007e86] dark:text-[#2ec0c7] p-4 rounded-xl flex gap-3 mb-8 items-start">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#009ba4]" />
                    <p className="text-xs leading-relaxed font-medium">
                        Selecciona el módulo y el periodo requerido. Los archivos <strong>PDF</strong> son ideales para minutas de gerencia y firmas de entrega, mientras que <strong>CSV/Excel</strong> y <strong>JSON</strong> permiten análisis avanzado de KPIs.
                    </p>
                </div>

                {/* 1. SELECCIÓN DE MÓDULO */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                        1. Selecciona el Módulo de Información
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {modulos.map((m) => {
                            const isSelected = formData.modulo === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, modulo: m.id })}
                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        isSelected 
                                            ? 'border-[#009ba4] bg-[#009ba4]/10 text-[#007e86] dark:text-white shadow-2xs' 
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-[#009ba4]' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {m.label}
                                            </span>
                                            {isSelected && <Check size={14} className="text-[#009ba4]" />}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 font-normal">
                                            {m.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. RANGO DE FECHAS */}
                <div className="mb-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            2. Periodo del Reporte
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">Accesos rápidos:</span>
                            <button
                                type="button"
                                onClick={() => setDatePreset(0)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#009ba4]"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset(7)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#009ba4]"
                            >
                                7 Días
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset(30)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#009ba4]"
                            >
                                30 Días
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-[11px] font-semibold text-slate-500 mb-1">Desde (Fecha Inicio)</span>
                            <input 
                                type="date" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none"
                                value={formData.fecha_inicio}
                                onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                            />
                        </div>
                        <div>
                            <span className="block text-[11px] font-semibold text-slate-500 mb-1">Hasta (Fecha Fin)</span>
                            <input 
                                type="date" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#009ba4] outline-none"
                                value={formData.fecha_fin}
                                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. BOTONES DE FORMATO */}
                <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 text-center">
                        3. Selecciona Formato de Descarga
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Botón PDF */}
                        <button 
                            type="button"
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 text-left transition-all disabled:opacity-50 group cursor-pointer shadow-2xs"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-sm">
                                    <FileText size={20} />
                                </div>
                                <ArrowRight size={16} className="text-rose-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                                {isExporting && activeFormat === 'pdf' ? 'Generando PDF...' : 'Documento PDF'}
                            </h4>
                            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">
                                Formato formal con cabecera corporativa Wittur para firma e impresión.
                            </p>
                        </button>

                        {/* Botón Excel */}
                        <button 
                            type="button"
                            onClick={() => handleExport('excel')}
                            disabled={isExporting}
                            className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 text-left transition-all disabled:opacity-50 group cursor-pointer shadow-2xs"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <ArrowRight size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                                {isExporting && activeFormat === 'excel' ? 'Exportando Excel...' : 'Hoja Excel (CSV)'}
                            </h4>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                                Compatible con Microsoft Excel para filtros, tablas dinámicas y análisis.
                            </p>
                        </button>

                        {/* Botón JSON */}
                        <button 
                            type="button"
                            onClick={() => handleExport('json')}
                            disabled={isExporting}
                            className="p-5 rounded-2xl border border-[#009ba4]/30 bg-[#009ba4]/5 dark:bg-[#009ba4]/10 hover:bg-[#009ba4]/15 text-left transition-all disabled:opacity-50 group cursor-pointer shadow-2xs"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-xl bg-[#009ba4] text-white shadow-sm">
                                    <FileJson size={20} />
                                </div>
                                <ArrowRight size={16} className="text-[#009ba4] group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {isExporting && activeFormat === 'json' ? 'Generando JSON...' : 'Datos Raw (JSON)'}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Para integración de datos con otros sistemas o copias de seguridad de ICT.
                            </p>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};