import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { 
    AlertTriangle, Video, X, Save, Camera, Maximize, Minimize, 
    Filter, Radio, Shield, Check, Clock
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { useNotification } from '../context/NotificationContext';

// Subcomponente memoizado para aislar el iframe del stream y evitar re-renders cuando cambian modales
const CameraCard = React.memo(({ camara, onOpenReport, onExpand }) => {
    return (
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-700/80 flex flex-col group relative">
            {/* Cabecera miniatura HUD */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 truncate pr-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <h4 className="text-xs font-bold text-white truncate font-mono tracking-tight">{camara.nombre_camara}</h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate shrink-0">{camara.ubicacion}</span>
            </div>

            {/* Área de Video WebRTC */}
            <div className="aspect-video bg-black relative flex items-center justify-center">
                {camara.stream_url && camara.stream_url !== 'N/A' ? (
                    <iframe 
                        src={camara.stream_url} 
                        title={`Stream ${camara.nombre_camara}`}
                        className="w-full h-full border-0 pointer-events-none"
                        scrolling="no"
                    />
                ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                        <Camera size={36} />
                        <span className="text-[11px] mt-1.5 font-medium text-slate-500">Señal no disponible</span>
                    </div>
                )}
                
                {/* Overlay de controles en Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-[#2ec0c7] bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                            LIVE STREAM
                        </span>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={() => onOpenReport(camara.id)}
                                className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                                title="Reportar Novedad en esta cámara"
                            >
                                <AlertTriangle size={15} />
                            </button>
                            <button 
                                onClick={() => onExpand(camara)}
                                className="bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-xl backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                                title="Ampliar a pantalla completa"
                            >
                                <Maximize size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="text-[11px] text-white/80 font-mono">
                        {camara.ip_asignada || 'IP DHCP'}
                    </div>
                </div>
            </div>
        </div>
    );
});

export const Caseta = () => {
    const { toast } = useNotification();
    const [camaras, setCamaras] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Controles de Vista
    const [expandedCam, setExpandedCam] = useState(null);
    
    // Filtro de Cámaras
    const [camarasSeleccionadas, setCamarasSeleccionadas] = useState([]);
    const [mostrarFiltro, setMostrarFiltro] = useState(false);
    
    // Estados para el Reporte
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportData, setReportData] = useState({
        camara_id: '',
        tipo_incidente: 'Vehículo Sospechoso',
        descripcion: '',
        fecha_incidente: new Date().toISOString().slice(0, 16)
    });

    // 1. CARGAR CÁMARAS Y RECUPERAR MEMORIA
    useEffect(() => {
        const controller = new AbortController();
        const fetchCamarasCaseta = async () => {
            try {
                const response = await api.get('/cctv/caseta', { signal: controller.signal });
                const fetchedCamaras = response.data.data || [];
                setCamaras(fetchedCamaras);
                
                const seleccionGuardada = localStorage.getItem('wittur_camaras_seleccionadas');
                
                if (seleccionGuardada) {
                    try {
                        const parsedIds = JSON.parse(seleccionGuardada);
                        const idsValidos = parsedIds.filter(id => fetchedCamaras.some(cam => cam.id === id));
                        
                        if (idsValidos.length > 0) {
                            setCamarasSeleccionadas(idsValidos);
                        } else {
                            setCamarasSeleccionadas(fetchedCamaras.map(cam => cam.id));
                        }
                    } catch (e) {
                        setCamarasSeleccionadas(fetchedCamaras.map(cam => cam.id));
                    }
                } else {
                    setCamarasSeleccionadas(fetchedCamaras.map(cam => cam.id));
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error("Error al cargar cámaras de caseta:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCamarasCaseta();
        return () => controller.abort();
    }, []);

    // 2. GUARDAR EN MEMORIA CADA VEZ QUE CAMBIA LA SELECCIÓN
    useEffect(() => {
        if (!loading && camaras.length > 0) {
            localStorage.setItem('wittur_camaras_seleccionadas', JSON.stringify(camarasSeleccionadas));
        }
    }, [camarasSeleccionadas, loading, camaras]);

    const toggleCamara = useCallback((id) => {
        setCamarasSeleccionadas(prev => 
            prev.includes(id) 
                ? prev.filter(camId => camId !== id)
                : [...prev, id]
        );
    }, []);

    const openReportModal = useCallback((camaraId = '') => {
        setReportData({
            camara_id: camaraId,
            tipo_incidente: 'Vehículo Sospechoso',
            descripcion: '',
            fecha_incidente: new Date().toISOString().slice(0, 16)
        });
        setIsReportModalOpen(true);
    }, []);

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/reportes-seguridad', reportData);
            setIsReportModalOpen(false); // Cierra el modal de inmediato
            toast.success("Novedad registrada exitosamente en la bitácora de seguridad.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Ocurrió un error al enviar el reporte.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const camarasVisibles = useMemo(() => {
        const selectedSet = new Set(camarasSeleccionadas);
        return camaras.filter(cam => selectedSet.has(cam.id));
    }, [camaras, camarasSeleccionadas]);

    const getGridClass = () => {
        const count = camarasSeleccionadas.length;
        if (count === 0) return 'grid-cols-1';
        if (count === 1) return 'grid-cols-1 md:w-3/4 lg:w-2/3 mx-auto';
        if (count === 2) return 'grid-cols-1 md:grid-cols-2';
        if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        if (count === 4) return 'grid-cols-1 md:grid-cols-2'; 
        if (count >= 5 && count <= 9) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'; 
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-16 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-video bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative h-full flex flex-col font-sans">
            {/* BARRA SUPERIOR DE CONTROL */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <Video className="text-[#009ba4]" size={22} />
                        <span>Monitor de Vigilancia - Caseta</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Circuito asignado para seguridad patrimonial. Solo cámaras activas en caseta.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Botón y Menú de Filtro */}
                    <div className="relative">
                        <button 
                            onClick={() => setMostrarFiltro(!mostrarFiltro)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
                        >
                            <Filter size={15} className="text-[#009ba4]" />
                            <span>Cámaras en pantalla</span>
                            <span className="bg-[#009ba4]/15 text-[#009ba4] dark:bg-[#009ba4]/30 py-0.5 px-2 rounded-full text-[11px] font-bold">
                                {camarasSeleccionadas.length} / {camaras.length}
                            </span>
                        </button>

                        {mostrarFiltro && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in zoom-in-95 duration-150">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cámaras Visibles</h4>
                                    <button 
                                        onClick={() => setCamarasSeleccionadas(camaras.map(c => c.id))}
                                        className="text-[11px] text-[#009ba4] hover:underline font-bold"
                                    >
                                        Marcar todas
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                                    {camaras.map(cam => (
                                        <label key={cam.id} className="flex items-center gap-2.5 cursor-pointer pt-1.5 pb-1 hover:text-[#009ba4]">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-[#009ba4] focus:ring-[#009ba4] h-4 w-4"
                                                checked={camarasSeleccionadas.includes(cam.id)}
                                                onChange={() => toggleCamara(cam.id)}
                                            />
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                {cam.nombre_camara}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => openReportModal()} 
                        className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                    >
                        <AlertTriangle size={15} />
                        <span>Reportar Novedad</span>
                    </button>
                </div>
            </div>

            {/* Cuadrícula Dinámica de Cámaras */}
            <div className={`grid gap-4 transition-all duration-300 ease-in-out ${getGridClass()}`}>
                {camarasVisibles.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No hay cámaras seleccionadas. Utiliza el botón de filtro superior para visualizarlas.
                    </div>
                ) : (
                    camarasVisibles.map((camara) => (
                        <CameraCard 
                            key={camara.id}
                            camara={camara}
                            onOpenReport={openReportModal}
                            onExpand={setExpandedCam}
                        />
                    ))
                )}
            </div>

            {/* MODAL: Pantalla Completa de Cámara */}
            {expandedCam && (
                <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <h3 className="text-lg font-bold text-white font-mono">{expandedCam.nombre_camara}</h3>
                                <p className="text-xs text-slate-400">{expandedCam.ubicacion}</p>
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button 
                                onClick={() => openReportModal(expandedCam.id)} 
                                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                                <AlertTriangle size={15} />
                                <span>Reportar Novedad</span>
                            </button>
                            <button 
                                onClick={() => setExpandedCam(null)} 
                                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                                <Minimize size={15} />
                                <span>Minimizar</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center p-4">
                        <iframe 
                            src={expandedCam.stream_url} 
                            title={`Expanded ${expandedCam.nombre_camara}`}
                            className="w-full max-w-7xl aspect-video rounded-2xl shadow-2xl border border-slate-800 pointer-events-none"
                            scrolling="no"
                        />
                    </div>
                </div>
            )}

            {/* MODAL: Reportar Novedad de Seguridad */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title="Registrar Novedad en Bitácora de Caseta"
                subtitle="El reporte quedará asentado con fecha, hora y cámara vinculada para auditoría de seguridad."
                icon={AlertTriangle}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleReportSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Cámara de Evidencia
                            </label>
                            <select 
                                required 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none" 
                                value={reportData.camara_id} 
                                onChange={(e) => setReportData({...reportData, camara_id: e.target.value})}
                            >
                                <option value="">-- Seleccionar cámara --</option>
                                {camaras.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre_camara} ({c.ubicacion})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Fecha y Hora del Evento
                            </label>
                            <input 
                                required 
                                type="datetime-local" 
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none" 
                                value={reportData.fecha_incidente} 
                                onChange={(e) => setReportData({...reportData, fecha_incidente: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Tipo de Incidente
                        </label>
                        <select 
                            required 
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none" 
                            value={reportData.tipo_incidente} 
                            onChange={(e) => setReportData({...reportData, tipo_incidente: e.target.value})}
                        >
                            <option value="Vehículo Sospechoso">Vehículo Sospechoso</option>
                            <option value="Intrusión / Acceso no autorizado">Intrusión / Acceso no autorizado</option>
                            <option value="Puerta/Acceso Abierto">Puerta / Acceso Abierto</option>
                            <option value="Falsa Alarma">Falsa Alarma</option>
                            <option value="Condición Insegura">Condición Insegura en Perímetro</option>
                            <option value="Otro">Otro incidente...</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Descripción de los Hechos
                        </label>
                        <textarea 
                            required 
                            rows={4} 
                            placeholder="Detalla placas, personas involucradas, vestimenta o acciones tomadas por el guardia..." 
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none" 
                            value={reportData.descripcion} 
                            onChange={(e) => setReportData({...reportData, descripcion: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={() => setIsReportModalOpen(false)} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                        >
                            <Save size={15} />
                            <span>{isSubmitting ? 'Guardando...' : 'Asentar Novedad'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};