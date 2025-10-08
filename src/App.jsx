// App.jsx
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './Page/Login.jsx';
import MainPage from './Page/MainPage.jsx';
import { ProtectedRoute } from './Components/ProtectedRoute.jsx';
import "./index.css";

// Landing Page Component
function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen" style={{ background: '#DDE6ED' }}>
      <div className="flex-1">
        <MainPage 
          user={null} 
          onLogout={null} 
          isLanding={true} 
          onGetStarted={() => navigate('/login')} 
        />
      </div>
    </div>
  );
}

// Main App Content Component
function AppContent() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#DDE6ED' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* Protected routes */}
      {/* /home route removed — use root (/) for landing/home page */}
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainPage user={user} onLogout={async () => { await logout(); navigate('/login', { replace: true }); }} selectedPage="dashboard" />
        </ProtectedRoute>
      } />
      
      <Route path="/assignuser" element={
        <ProtectedRoute requireAdmin>
          <MainPage user={user} onLogout={async () => { await logout(); navigate('/login', { replace: true }); }} selectedPage="assign" />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute requireNonAdmin>
          <MainPage user={user} onLogout={async () => { await logout(); navigate('/login', { replace: true }); }} selectedPage="profile" />
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute>
          <MainPage user={user} onLogout={async () => { await logout(); navigate('/login', { replace: true }); }} selectedPage="chat" />
        </ProtectedRoute>
      } />
              
      {/* Redirect any unknown routes */}
      <Route 
        path="*" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} 
      />
    </Routes>
  );
}

// Root App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Create root and render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);