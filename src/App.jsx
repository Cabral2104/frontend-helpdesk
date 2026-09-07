import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { MainLayout } from './layouts/MainLayout';
import { Tickets } from './pages/Tickets'; // 1. Importar pantalla
import { Cctv } from './pages/Cctv';
import { Dashboard } from './pages/Dashboard'; // 2. Importar pantalla
import { Caseta } from './pages/Caseta'; // 3. Importar pantalla


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} /> {/* 2. Agregar Ruta */}
              <Route path="/cctv" element={<Cctv />} /> {/* 3. Agregar Ruta */}
              <Route path="/caseta" element={<Caseta />} /> {/* 4. Agregar Ruta */}
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;