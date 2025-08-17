import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getProfile, login as apiLogin, register as apiRegister, initializeAPI, getApiStatus } from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [apiReady, setApiReady] = useState(false);

  const initializeApiConnection = useCallback(async () => {
    try {
      console.log('🔗 Initializing API connection...');
      const initialized = await initializeAPI();
      setApiReady(initialized);
      
      if (initialized) {
        const status = getApiStatus();
        console.log(`✅ API connected: ${status.currentUrl}`);
      } else {
        console.warn('⚠️ No API endpoints available - app will work in offline mode');
      }
      
      return initialized;
    } catch (error) {
      console.error('❌ API initialization failed:', error);
      setApiReady(false);
      return false;
    }
  }, []);

  const checkUserSession = useCallback(async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
    } catch (error) {
      // Error 401 es normal cuando el usuario no está autenticado
      if (error.response?.status === 401) {
        setUser(null);
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        // Error de red real - log para debugging pero no bloquear la app
        console.warn('Network error al verificar sesión (servidor posiblemente no disponible):', error.message);
        setUser(null);
      } else {
        // Otros errores inesperados
        console.error('Error inesperado al verificar sesión:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAndCheck = async () => {
      // Initialize API connection first
      await initializeApiConnection();
      // Then check user session
      await checkUserSession();
    };
    
    initAndCheck();
  }, [initializeApiConnection, checkUserSession]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await apiLogin(credentials);
      await checkUserSession();
      return res.data; 
    } catch (error) {
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await apiRegister(userData);
      await checkUserSession(); // Refresh user session after registration
      return res.data;
    } catch (error) {
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    apiReady,
    login,
    register,
    logout,
    checkUserSession,
    initializeApiConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};