import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole: Role;
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
};