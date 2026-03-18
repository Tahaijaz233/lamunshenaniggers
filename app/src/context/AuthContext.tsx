import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatar?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
          socketService.connect();
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    
    setUser(user);
    socketService.connect();
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const response = await authAPI.register(username, password, displayName);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    
    setUser(user);
    socketService.connect();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    socketService.disconnect();
  }, []);

  const updateProfile = useCallback(async (data: { displayName?: string; avatar?: string }) => {
    const response = await authAPI.updateProfile(data);
    setUser(response.data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
