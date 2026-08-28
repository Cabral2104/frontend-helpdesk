import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// 1. Inicializamos el contexto
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 2. Definimos los estados globales de la sesión
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // 3. Al recargar la página, verificamos si ya había una sesión guardada
    useEffect(() => {
        if (token) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        }
        setLoading(false);
    }, [token]);

    // 4. Función centralizada para iniciar sesión
    const login = async (numero_nomina) => {
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
    };

    // 5. Función centralizada para cerrar sesión
    const logout = async () => {
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
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar este contexto fácilmente en otras pantallas
export const useAuth = () => useContext(AuthContext);