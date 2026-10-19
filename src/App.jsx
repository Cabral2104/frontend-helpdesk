import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Code-splitting con lazy loading para aligerar el bundle inicial (Recharts, CCTV, Inventario)
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const MainLayout = lazy(() => import('./layouts/MainLayout').then(m => ({ default: m.MainLayout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Tickets = lazy(() => import('./pages/Tickets').then(m => ({ default: m.Tickets })));
const Inventario = lazy(() => import('./pages/Inventario').then(m => ({ default: m.Inventario })));
const Cctv = lazy(() => import('./pages/Cctv').then(m => ({ default: m.Cctv })));
const Caseta = lazy(() => import('./pages/Caseta').then(m => ({ default: m.Caseta })));
const Usuarios = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Reportes = lazy(() => import('./pages/Reportes').then(m => ({ default: m.Reportes })));
const ReportesSeguridad = lazy(() => import('./pages/ReportesSeguridad').then(m => ({ default: m.ReportesSeguridad })));

const PageLoader = () => (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#009ba4] border-t-transparent shadow-xs"></div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando módulo...</span>
        </div>
    </div>
);

// Interceptor para bloquear rutas según el rol
const RequireRole = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    if (!user || !allowedRoles.includes(user.rol)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
  // Sincronización global del tema guardado al cargar la aplicación
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                {/* RUTAS PÚBLICAS PARA TODOS LOS LOGUEADOS */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets" element={<Tickets />} /> 

                {/* RUTAS BLOQUEADAS: Solo Administrador (Área de ICT) */}
                <Route path="/inventario" element={
                    <RequireRole allowedRoles={['Administrador']}>
                        <Inventario />
                    </RequireRole>
                } /> 
                <Route path="/cctv" element={
                    <RequireRole allowedRoles={['Administrador']}>
                        <Cctv />
                    </RequireRole>
                } />

                <Route path="/usuarios" element={
                    <RequireRole allowedRoles={['Administrador']}>
                      <Usuarios />
                    </RequireRole>
                } />

                <Route path="/exportar-reportes" element={<Reportes />} />
                
                {/* RUTAS BLOQUEADAS: Administrador y Seguridad */}
                <Route path="/caseta" element={
                    <RequireRole allowedRoles={['Administrador', 'Seguridad']}>
                        <Caseta />
                    </RequireRole>
                } />
                <Route path="/reportes-seguridad" element={
                    <RequireRole allowedRoles={['Administrador', 'Seguridad']}>
                        <ReportesSeguridad />
                    </RequireRole>
                } />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;