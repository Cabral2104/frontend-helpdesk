import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { MainLayout } from './layouts/MainLayout';
import { Tickets } from './pages/Tickets'; 
import { Cctv } from './pages/Cctv';
import { Dashboard } from './pages/Dashboard'; 
import { Caseta } from './pages/Caseta'; 
import { ReportesSeguridad } from './pages/ReportesSeguridad'; 
import { Inventario } from './pages/Inventario'; 
import { Usuarios } from './pages/Usuarios';

// Interceptor para bloquear rutas según el rol
const RequireRole = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    if (!user || !allowedRoles.includes(user.rol)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;