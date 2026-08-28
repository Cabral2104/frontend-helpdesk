import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();

    // Mientras React verifica la sesión, mostramos una pantalla vacía o un loader
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando sistema...</div>;
    }

    // Si no hay token en el contexto, lo expulsamos a la pantalla de login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si todo está bien, lo dejamos ver la pantalla solicitada
    return children;
};