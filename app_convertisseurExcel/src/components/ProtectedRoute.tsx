// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Si l'utilisateur n'est pas connecté, on le redirige vers la page de login
    return <Navigate to="/login" replace />;
  }

  // Sinon on affiche la page protégée
  return <>{children}</>;
};

export default ProtectedRoute;
