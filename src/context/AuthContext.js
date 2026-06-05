import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    // Admin solo si hay sesión Y token (el backend exige el token en escrituras).
    // Así, tras el deploy de auth, un admin viejo sin token re-inicia sesión.
    return localStorage.getItem('isAdmin') === 'true' && !!localStorage.getItem('adminToken');
  });

  const login = async (password) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
        // Guardar el token que el backend exige en las peticiones de escritura.
        if (data.token) localStorage.setItem('adminToken', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminToken');
  };

  return <AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
