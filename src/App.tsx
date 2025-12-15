// src/App.tsx
import React from 'react';
import LoginPage from './components/LoginPage';
import Workspace from './components/Workspace';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Внутренний компонент, который имеет доступ к AuthContext
function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="h-screen w-screen overflow-hidden">
      {!isAuthenticated ? (
        <LoginPage />
      ) : (
        <Workspace onLogout={logout} />
      )}
    </div>
  );
}

// Главный компонент оборачивает всё в AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}