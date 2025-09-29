import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredLevel?: "admin" | "shop" | "cus";
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredLevel,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Lưu nơi cần đến (from) và cả state hiện tại (carry) để trả lại sau khi login
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, carry: location.state }}
      />
    );
  }

  if (requiredLevel && user.level_type !== requiredLevel) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
