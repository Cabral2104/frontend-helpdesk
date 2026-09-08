import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, Video, X, Save, Camera, Maximize, Minimize, Square, Grid, Columns, LayoutGrid } from 'lucide-react';

export const Caseta = () => {
    const [camaras, setCamaras] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Controles de Vista
    const [gridCols, setGridCols] = useState(3);
    const [expandedCam, setExpandedCam] = useState(null);
    
    // Estados para el Reporte
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportData, setReportData] = useState({
        camara_id: '',
        tipo_incidente: 'Vehículo Sospechoso',
        descripcion: '',
        fecha_incidente: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        const fetchCamarasCaseta = async () => {
            try {
                const response = await api.get('/cctv/caseta');
                setCamaras(response.data.data || []);
            } catch (error) {
                console.error("Error al cargar cámaras de caseta:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCamarasCaseta();
    }, []);

    const openReportModal = (camaraId = '') => {
        setReportData({
            camara_id: camaraId,
            tipo_incidente: 'Vehículo Sospechoso',
            descripcion: '',
            fecha_incidente: new Date().toISOString().slice(0, 16)
        });
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/reportes-seguridad', reportData);
            setIsReportModalOpen(false);
            alert("Reporte de seguridad enviado exitosamente.");
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al enviar el reporte.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determinamos la clase de Tailwind para la cuadrícula
    const getGridClass = () => {
        switch(gridCols) {
            case 1: return 'grid-cols-1 md:w-2/3 mx-auto';
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 4: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
            case 3: 
            default: return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-slate-500">Conectando con infraestructura CCTV...</div>;
    }

    return (
        <div className="space-y-4 relative h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Video className="text-blue-600" size={28} />
                        Centro de Monitoreo
                    </h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    {/* Controles de Cuadrícula */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setGridCols(1)} className={`p-2 rounded-md transition-colors ${gridCols === 1 ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Vista Individual">
                            <Square size={18} />
                        </button>
                        <button onClick={() => setGridCols(2)} className={`p-2 rounded-md transition-colors ${gridCols === 2 ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Vista 2x2">
                            <Columns size={18} />
                        </button>
                        <button onClick={() => setGridCols(3)} className={`p-2 rounded-md transition-colors ${gridCols === 3 ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Vista 3x3">
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setGridCols(4)} className={`p-2 rounded-md transition-colors ${gridCols === 4 ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Vista 4x4">
                            <Grid size={18} />
                        </button>
                    </div>

                    <button onClick={() => openReportModal()} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                        <AlertTriangle size={18} /><span>Reportar Anomalía</span>
                    </button>
                </div>
            </div>

            {/* Cuadrícula Dinámica de Cámaras */}
            <div className={`grid gap-4 transition-all duration-300 ease-in-out ${getGridClass()}`}>
                {camaras.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No hay cámaras habilitadas para visualización en caseta.
                    </div>
                ) : (
                    camaras.map((camara) => (
                        <div key={camara.id} className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col group relative">
                            
                            {/* Área de Video WebRTC */}
                            <div className="aspect-video bg-black relative flex items-center justify-center">
                                {camara.stream_url && camara.stream_url !== 'N/A' ? (
                                    <iframe 
                                        src={camara.stream_url} 
                                        title={`Stream ${camara.nombre_camara}`}
                                        className="w-full h-full border-0 pointer-events-none"
                                        scrolling="no"
                                    ></iframe>
                                ) : (
                                    <div className="text-slate-700 flex flex-col items-center">
                                        <Camera size={48} />
                                        <span className="text-xs mt-2">Señal no disponible</span>
                                    </div>
                                )}
                                
                                {/* Overlay de controles (Hover) */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => openReportModal(camara.id)}
                                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                                            title="Reportar incidencia"
                                        >
                                            <AlertTriangle size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setExpandedCam(camara)}
                                            className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                                            title="Expandir cámara"
                                        >
                                            <Maximize size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Barra de estado inferior */}
                            <div className="p-3 bg-slate-800 flex justify-between items-center shrink-0">
                                <div className="truncate pr-2">
                                    <h4 className="text-sm font-bold text-white truncate">{camara.nombre_camara}</h4>
                                    <p className="text-xs text-slate-400 truncate">{camara.ubicacion}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL: Pantalla Completa de Cámara */}
            {expandedCam && (
                <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-linear-to-b from-black/80 to-transparent">
                        <div>
                            <h3 className="text-xl font-bold text-white">{expandedCam.nombre_camara}</h3>
                            <p className="text-slate-400">{expandedCam.ubicacion}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => openReportModal(expandedCam.id)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                <AlertTriangle size={18} /> <span className="hidden sm:inline">Generar Reporte</span>
                            </button>
                            <button onClick={() => setExpandedCam(null)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                <Minimize size={18} /> <span className="hidden sm:inline">Minimizar</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center p-4">
                        <iframe 
                            src={expandedCam.stream_url} 
                            title={`Expanded ${expandedCam.nombre_camara}`}
                            className="w-full max-w-7xl aspect-video rounded-xl shadow-2xl border border-slate-800 pointer-events-none"
                            scrolling="no"
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Modal de Reporte de Seguridad (Se mantiene igual que antes) */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    {/* ... (Contenido del modal de reporte intacto) ... */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20 shrink-0">
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle size={20} /> Bitácora de Novedades
                            </h3>
                            <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Cámara Involucrada</label>
                                    <select required className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" value={reportData.camara_id} onChange={(e) => setReportData({...reportData, camara_id: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {camaras.map(c => <option key={c.id} value={c.id}>{c.nombre_camara} ({c.ubicacion})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha y Hora Exacta</label>
                                    <input required type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" value={reportData.fecha_incidente} onChange={(e) => setReportData({...reportData, fecha_incidente: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Incidente</label>
                                <select required className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" value={reportData.tipo_incidente} onChange={(e) => setReportData({...reportData, tipo_incidente: e.target.value})}>
                                    <option value="Intrusión / Acceso no autorizado">Intrusión / Acceso no autorizado</option>
                                    <option value="Vehículo Sospechoso">Vehículo Sospechoso</option>
                                    <option value="Puerta/Acceso Abierto">Puerta/Acceso Abierto</option>
                                    <option value="Falsa Alarma">Falsa Alarma</option>
                                    <option value="Otro">Otro...</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción de los hechos</label>
                                <textarea required rows="4" placeholder="Describe las características de la persona/vehículo y qué sucedió..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none" value={reportData.descripcion} onChange={(e) => setReportData({...reportData, descripcion: e.target.value})}></textarea>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"><Save size={18} /><span>Registrar Novedad</span></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};