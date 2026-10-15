import api from './axios';

// Almacén en memoria volátil de la sesión del navegador
const memoryCache = new Map();

/**
 * Realiza una petición GET con caché en memoria.
 * Si los datos existen y están dentro del tiempo de vida (TTL), se resuelven en 0ms sin ir al servidor.
 * 
 * @param {string} url - Endpoint a consultar
 * @param {number} ttlMs - Tiempo de vida en milisegundos (por defecto 5 minutos)
 * @returns {Promise<any>}
 */
export const getCached = async (url, ttlMs = 300000) => {
    const now = Date.now();
    const cached = memoryCache.get(url);

    if (cached && (now - cached.timestamp < ttlMs)) {
        return cached.data;
    }

    const response = await api.get(url);
    memoryCache.set(url, {
        timestamp: now,
        data: response.data
    });

    return response.data;
};

/**
 * Limpia una URL de la memoria o toda la caché.
 * @param {string} [url]
 */
export const invalidateCache = (url = null) => {
    if (url) {
        memoryCache.delete(url);
    } else {
        memoryCache.clear();
    }
};
