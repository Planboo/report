import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginNew';
import PhotosPage from './pages/Photos';
import HomePage from './pages/Home';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function RootRedirect() {
  const { state } = useAuth();
  if (state.isAuthenticated) {
    return <Navigate to={state.isAdmin ? '/photos' : '/home'} replace />;
  }
  return <Navigate to="/login" replace />;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
