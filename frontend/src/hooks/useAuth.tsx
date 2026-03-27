import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import jwt_decode from "jwt-decode";

interface TokenPayload {
  user_id: string;
  role: string;
  exp?: number;
}

interface AuthContextType {
  token: string;
  role: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwt_decode<TokenPayload>(token);
        setRole(decoded.role);
      } catch {
        setRole(null);
      }
    } else {
      setRole(null);
    }

    setIsLoading(false);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setRole(null);
  };

  const isAuthenticated = !!token && role === "teacher";

  return (
    <AuthContext.Provider
      value={{ token, role, login, logout, isAuthenticated, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};