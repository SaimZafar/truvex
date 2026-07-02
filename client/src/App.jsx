import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import HECDashboard from './pages/HECDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import EmployerDashboard from './pages/EmployerDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/hec" element={
        <ProtectedRoute allowedRoles={['hec']}>
          <HECDashboard />
        </ProtectedRoute>
      } />
      <Route path="/university" element={
        <ProtectedRoute allowedRoles={['university']}>
          <UniversityDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employer" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;