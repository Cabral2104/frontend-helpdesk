import axios from 'axios';

// Creamos una instancia maestra de Axios
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor: Antes de que salga cualquier petición, revisa si hay un Token guardado
api.interceptors.request.use(
    (config) => {
        // Buscamos el token en el almacenamiento local del navegador
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;