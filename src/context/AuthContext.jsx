import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import api from '../api/axios';

// 1. Inicializamos el contexto
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 2. Inicialización perezosa de la sesión sin renders dobles
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Error al leer sesión almacenada:", e);
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    // 3. Función centralizada para iniciar sesión (memoizada)
    const login = useCallback(async (numero_nomina) => {
        try {
            const response = await api.post('/login', { numero_nomina });
            
            if (response.data.success) {
                const { token: newToken, data: userData } = response.data;
                
                setToken(newToken);
                setUser(userData);
                
                // Guardamos en el navegador para no perder la sesión al actualizar
                localStorage.setItem('token', newToken);
                localStorage.setItem('user', JSON.stringify(userData));
                
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error al conectar con el servidor.'
            };
        }
    }, []);

    // 4. Función centralizada para cerrar sesión (memoizada)
    const logout = useCallback(async () => {
        try {
            if (token) {
                await api.post('/logout'); // Le avisamos a Laravel que destruya el token
            }
        } catch (error) {
            console.error("Error cerrando sesión en el servidor", error);
        } finally {
            // Limpiamos todo el estado local sin importar qué pase en el servidor
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }, [token]);

    // 5. Memoizamos el valor del contexto para evitar re-renders en cascada de los consumidores
    const contextValue = useMemo(() => ({
        user,
        token,
        login,
        logout,
        loading
    }), [user, token, login, logout, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar este contexto fácilmente en otras pantallas
export const useAuth = () => useContext(AuthContext);