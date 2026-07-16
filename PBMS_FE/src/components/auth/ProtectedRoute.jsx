// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Logged in but doesn't have the right role -> send them to their fallback base home
    if (user?.role.toLowerCase() === 'staff') return <Navigate to="/checkin" replace />;
    if (user?.role.toLowerCase() === 'admin' || user?.role.toLowerCase() === 'manager') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Permitted! Render the nested child route components
  return <Outlet />;
};

export default ProtectedRoute;