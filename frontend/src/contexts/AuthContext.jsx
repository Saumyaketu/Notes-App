// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import * as authService from "../services/authService";
import { loadToken, saveToken, clearToken } from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(loadToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      authService
        .me(token)
        .then((u) => setUser(u.user || null))
        .catch(() => {
          setUser(null);
          setToken(null);
          clearToken();
        });
    }
  }, [token]);

  const login = async (emailOrToken, password) => {
    let res;
    if (typeof emailOrToken === 'string' && password) {
      // Standard email/password login
      res = await authService.login(emailOrToken, password);
    } else {
      // Google Sign-In with ID token
      res = await authService.googleLogin(emailOrToken);
    }
    
    if (res.token) {
      saveToken(res.token);
      setToken(res.token);
      return true;
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    if (res.token) {
      saveToken(res.token);
      setToken(res.token);
      return true;
    }
    return res;
  };
  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
