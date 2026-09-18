import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { getCurrentUserAPI, logoutAPI } from '../api/farmApi';

export const AuthProvider = ({ children }) => {
  // User data is stored strictly in React memory
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const data = await getCurrentUserAPI();
        if (isMounted) {
          setUser({
            id: data._id || data.id,
            name: data.username || data.name,
            email: data.email,
            picture: data.profileImage,
            profileImage: data.profileImage,
            phone: data.phone || '',
            address: data.address || '',
          });
        }
      } catch {
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
    } catch (error) {
      console.error("Error logging out", error);
    } finally {
      setUser(null);     // Always clear the local session, even if the server call failed
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};