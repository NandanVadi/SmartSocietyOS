import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const readSession = () => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const login = useCallback((token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setSession({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession({ token: null, user: null });
  }, []);

  // Merge changes (e.g. after the profile page saves) into the stored user
  const updateUser = useCallback((patch) => {
    setSession((s) => {
      const user = { ...s.user, ...patch };
      localStorage.setItem("user", JSON.stringify(user));
      return { ...s, user };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user: session.user, token: session.token, login, logout, updateUser, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
