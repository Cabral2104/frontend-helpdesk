import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { MainLayout } from './layouts/MainLayout';
import { Tickets } from './pages/Tickets'; // 1. Importar pantalla

// Dashboard temporal (Lo haremos real más adelante)
const Dashboard = () => (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Resumen del Sistema</h2>
        <p className="text-slate-600 dark:text-slate-400">Selecciona un módulo en el menú lateral.</p>
    </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} /> {/* 2. Agregar Ruta */}
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;