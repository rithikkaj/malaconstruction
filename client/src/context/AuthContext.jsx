import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('mc_user'));
      if (!parsed) return null;
      return {
        ...parsed,
        role: String(parsed.role || '').toLowerCase(),
      };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_token');
    if (token && !user) {
      getProfile()
        .then((res) =>
          setUser({
            ...res.data,
            role: String(res.data?.role || '').toLowerCase(),
          })
        )
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    const normalizedUser = {
      ...userData,
      role: String(userData?.role || '').toLowerCase(),
    };

    localStorage.setItem('mc_token', token);
    localStorage.setItem('mc_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
