// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'admin';

export interface User {
  login: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock пользователи
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  user: {
    password: 'user',
    user: {
      login: 'user',
      role: 'user',
      name: 'Тестовый пользователь'
    }
  },
  admin: {
    password: 'admin',
    user: {
      login: 'admin',
      role: 'admin',
      name: 'Администратор'
    }
  },
  // Для удобства тестирования
  '99999': {
    password: '99999',
    user: {
      login: '99999',
      role: 'user',
      name: 'Пользователь ТестТест'
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    const mockUser = MOCK_USERS[username];
    
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}