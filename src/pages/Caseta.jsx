import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, Video, X, Save, Camera } from 'lucide-react';

export const Caseta = () => {
    const [camaras, setCamaras] = useState([]);
    const [loading, setLoading] = useState(true);
    
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

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-slate-500">Conectando con infraestructura CCTV...</div>;
    }

    return (
        <div className="space-y-6 relative h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Video className="text-blue-600" size={28} />
                        Centro de Monitoreo
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Visualización en tiempo real y bitácora de novedades de seguridad.
                    </p>
                </div>
                <button onClick={() => openReportModal()} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                    <AlertTriangle size={18} /><span>Reportar Anomalía</span>
                </button>
            </div>

            {/* Cuadrícula de Cámaras */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {camaras.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No hay cámaras habilitadas para visualización en caseta.
                    </div>
                ) : (
                    camaras.map((camara) => (
                        <div key={camara.id} className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col group">
                            
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
                                
                                {/* Botón rápido de reporte sobre el video */}
                                <button 
                                    onClick={() => openReportModal(camara.id)}
                                    className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Reportar incidencia en esta cámara"
                                >
                                    <AlertTriangle size={18} />
                                </button>
                            </div>
                            
                            {/* Barra de estado de la cámara */}
                            <div className="p-3 bg-slate-800 flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-white">{camara.nombre_camara}</h4>
                                    <p className="text-xs text-slate-400">{camara.ubicacion}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">En vivo</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Reporte de Seguridad */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
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