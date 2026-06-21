import React, { createContext, useState } from 'react';
import { logoutAPI } from '../api/farmApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // User data is stored strictly in React memory
  const [user, setUser] = useState(null);

  const logout = async () => {
    try {
      await logoutAPI(); // Tell backend to clear the HttpOnly cookie
      setUser(null);     // Clear user from React memory
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};