import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, Video, X, Save, Camera, Maximize, Minimize, Filter } from 'lucide-react';

export const Caseta = () => {
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
        const fetchCamarasCaseta = async () => {
            try {
                const response = await api.get('/cctv/caseta');
                const fetchedCamaras = response.data.data || [];
                setCamaras(fetchedCamaras);
                
                // Intentamos recuperar la selección previa del navegador
                const seleccionGuardada = localStorage.getItem('wittur_camaras_seleccionadas');
                
                if (seleccionGuardada) {
                    try {
                        const parsedIds = JSON.parse(seleccionGuardada);
                        // Filtramos para asegurar que los IDs guardados sigan existiendo en la BD
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
                    // Si es la primera vez que entra, encendemos todas por defecto
                    setCamarasSeleccionadas(fetchedCamaras.map(cam => cam.id));
                }
            } catch (error) {
                console.error("Error al cargar cámaras de caseta:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCamarasCaseta();
    }, []);

    // 2. GUARDAR EN MEMORIA CADA VEZ QUE CAMBIA LA SELECCIÓN
    useEffect(() => {
        if (!loading && camaras.length > 0) {
            localStorage.setItem('wittur_camaras_seleccionadas', JSON.stringify(camarasSeleccionadas));
        }
    }, [camarasSeleccionadas, loading, camaras]);

    const toggleCamara = (id) => {
        setCamarasSeleccionadas(prev => 
            prev.includes(id) 
                ? prev.filter(camId => camId !== id)
                : [...prev, id]
        );
    };

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

    // LÓGICA ADAPTATIVA: Calculamos la cuadrícula en base a la cantidad seleccionada
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
                    {/* Botón y Menú de Filtro */}
                    <div className="relative">
                        <button 
                            onClick={() => setMostrarFiltro(!mostrarFiltro)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-colors text-slate-700 dark:text-slate-200 shadow-sm"
                        >
                            <Filter size={18} />
                            <span className="hidden sm:inline">Filtrar Cámaras</span>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 py-0.5 px-2 rounded-full text-xs ml-1">
                                {camarasSeleccionadas.length}
                            </span>
                        </button>

                        {mostrarFiltro && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Seleccionar Visibles</h4>
                                    <button 
                                        onClick={() => setCamarasSeleccionadas(camaras.map(c => c.id))}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                    >
                                        Ver todas
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
                                    {camaras.map(cam => (
                                        <label key={cam.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                                checked={camarasSeleccionadas.includes(cam.id)}
                                                onChange={() => toggleCamara(cam.id)}
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                {cam.nombre_camara}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => openReportModal()} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors">
                        <AlertTriangle size={18} /><span className="hidden sm:inline">Reportar Anomalía</span>
                    </button>
                </div>
            </div>

            {/* Cuadrícula Dinámica de Cámaras Adaptativa */}
            <div className={`grid gap-4 transition-all duration-300 ease-in-out ${getGridClass()}`}>
                {camarasSeleccionadas.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No hay cámaras seleccionadas. Abre el filtro para visualizar.
                    </div>
                ) : (
                    camaras.filter(cam => camarasSeleccionadas.includes(cam.id)).map((camara) => (
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

            {/* Modal de Reporte de Seguridad */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
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