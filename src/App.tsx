import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Workspace from './components/Workspace';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {!isLoggedIn ? (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <Workspace onLogout={() => setIsLoggedIn(false)} />
      )}
    </div>
  );
}
