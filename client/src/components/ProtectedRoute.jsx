import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, adminOnly = false, clientOnly = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.rol !== 'admin') {
    return <Navigate to="/" replace />; // Redirigir a la página de inicio si no es admin
  }

  if (clientOnly && user?.rol !== 'cliente') {
    return <Navigate to="/" replace />; // Redirigir a la página de inicio si no es cliente
  }

  return children;
};

export default ProtectedRoute;

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
  clientOnly: PropTypes.bool,
};