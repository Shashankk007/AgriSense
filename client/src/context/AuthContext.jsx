import React, { createContext, useEffect, useState } from 'react';
import { getCurrentUserAPI, logoutAPI } from '../api/farmApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // User data is stored strictly in React memory
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const data = await getCurrentUserAPI();
        if (isMounted && data) { // 'data' exist karta hai tabhi set karega
          // 🟢 BUG FIXED: phoneNumber add kar diya hai
         setUser({
            id: data._id || data.id,
            fullName: data.fullName || data.name,
            name: data.fullName || data.name,    // 👈 YAHAN ADD KIYA: Taki Sidebar hamesha name dikhaye
            phoneNumber: data.phoneNumber,
            email: data.email,
            picture: data.profileImage,
            profileImage: data.profileImage,
          });
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await logoutAPI(); // Tell backend to clear the HttpOnly cookie
      setUser(null);     // Clear user from React memory
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};