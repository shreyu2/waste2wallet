import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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

/** Decode a JWT payload without a library (browser-safe). Returns null on failure. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Returns true when the JWT expiry (`exp` claim) is in the future. */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // Allow a 30-second buffer so we don't use a token that's about to expire
  return payload.exp * 1000 > Date.now() + 30_000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On mount, restore session from localStorage — but only if the token is still valid
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('w2w_token');
      const storedUser = localStorage.getItem('w2w_user');

      if (storedToken && storedUser && isTokenValid(storedToken)) {
        const parsed = JSON.parse(storedUser) as AuthUser;

        // Extra safety: ensure the role in localStorage matches the JWT
        const payload = decodeJwtPayload(storedToken);
        if (payload && payload.role === parsed.role) {
          setToken(storedToken);
          setUser(parsed);
        } else {
          // Role mismatch between JWT and stored user — clear everything
          localStorage.removeItem('w2w_token');
          localStorage.removeItem('w2w_user');
        }
      } else {
        // Token missing, expired, or user data missing — clean up
        localStorage.removeItem('w2w_token');
        localStorage.removeItem('w2w_user');
      }
    } catch {
      localStorage.removeItem('w2w_token');
      localStorage.removeItem('w2w_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    // Always clear previous session first
    localStorage.removeItem('w2w_token');
    localStorage.removeItem('w2w_user');

    // Set new session
    localStorage.setItem('w2w_token', newToken);
    localStorage.setItem('w2w_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('w2w_token');
    localStorage.removeItem('w2w_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem('w2w_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

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
