import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  role: 'CITIZEN' | 'COLLECTOR' | 'ADMIN';
  points: number;
  qrCode?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('w2w_user');
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('w2w_token')
  );

  const isLoading = false;

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('w2w_token', newToken);
    localStorage.setItem('w2w_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('w2w_token');
    localStorage.removeItem('w2w_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('w2w_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
