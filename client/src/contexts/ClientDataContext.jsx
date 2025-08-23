import { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

// Estados de carga
const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_STATS: 'SET_STATS',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_INVOICES: 'SET_INVOICES',
  SET_ERROR: 'SET_ERROR',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE'
};

// Initial state
const initialState = {
  stats: null,
  projects: [],
  invoices: [],
  loading: {
    stats: LoadingState.IDLE,
    projects: LoadingState.IDLE,
    invoices: LoadingState.IDLE
  },
  error: {
    stats: null,
    projects: null,
    invoices: null
  },
  cache: {
    stats: { data: null, timestamp: null },
    projects: { data: null, timestamp: null },
    invoices: { data: null, timestamp: null }
  }
};

// Reducer
function clientDataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: LoadingState.LOADING
        },
        error: {
          ...state.error,
          [action.payload.type]: null
        }
      };

    case ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload.data,
        loading: {
          ...state.loading,
          stats: LoadingState.SUCCESS
        },
        cache: {
          ...state.cache,
          stats: {
            data: action.payload.data,
            timestamp: Date.now()
          }
        }
      };

    case ACTIONS.SET_PROJECTS:
      return {
        ...state,
        projects: action.payload.data,
        loading: {
          ...state.loading,
          projects: LoadingState.SUCCESS
        },
        cache: {
          ...state.cache,
          projects: {
            data: action.payload.data,
            timestamp: Date.now()
          }
        }
      };

    case ACTIONS.SET_INVOICES:
      return {
        ...state,
        invoices: action.payload.data,
        loading: {
          ...state.loading,
          invoices: LoadingState.SUCCESS
        },
        cache: {
          ...state.cache,
          invoices: {
            data: action.payload.data,
            timestamp: Date.now()
          }
        }
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: LoadingState.ERROR
        },
        error: {
          ...state.error,
          [action.payload.type]: action.payload.error
        }
      };

    case ACTIONS.INVALIDATE_CACHE: {
      const cacheToInvalidate = action.payload?.type || 'all';
      if (cacheToInvalidate === 'all') {
        return {
          ...state,
          cache: {
            stats: { data: null, timestamp: null },
            projects: { data: null, timestamp: null },
            invoices: { data: null, timestamp: null }
          }
        };
      } else {
        return {
          ...state,
          cache: {
            ...state.cache,
            [cacheToInvalidate]: { data: null, timestamp: null }
          }
        };
      }
    }

    default:
      return state;
  }
}

// Context
const ClientDataContext = createContext();

// Hook para usar el contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useClientData = () => {
  const context = useContext(ClientDataContext);
  if (!context) {
    throw new Error('useClientData must be used within a ClientDataProvider');
  }
  return context;
};

// Provider
export const ClientDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(clientDataReducer, initialState);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  const isCacheValid = useCallback((type) => {
    const cache = state.cache[type];
    return cache.data && cache.timestamp && (Date.now() - cache.timestamp < CACHE_DURATION);
  }, [state.cache, CACHE_DURATION]);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('stats')) {
      return state.cache.stats.data;
    }

    if (state.loading.stats === LoadingState.LOADING) {
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'stats' } });

    try {
      const response = await api.get('/api/client/dashboard/stats');
      const data = response.data;
      
      dispatch({ type: ACTIONS.SET_STATS, payload: { data } });
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: { type: 'stats', error: error.message } 
      });
      throw error;
    }
  }, [isCacheValid, state.loading.stats, state.cache.stats.data]);

  const fetchProjects = useCallback(async (limit = null, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('projects')) {
      return state.cache.projects.data;
    }

    if (state.loading.projects === LoadingState.LOADING) {
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'projects' } });

    try {
      const params = limit ? { limit } : {};
      const response = await api.get('/api/client/dashboard/projects', { params });
      const projectsData = (response.data && response.data.data) ? response.data.data : [];
      
      // Normalizar datos
      const normalizedProjects = projectsData.map(project => ({
        id: project.id,
        numero_pedido: project.numero_pedido || project.numero_order,
        name: project.name || project.descripcion || 'Proyecto sin nombre',
        description: project.description || project.descripcion || '',
        servicio: project.servicio,
        value: parseFloat(project.value) || parseFloat(project.presupuesto_estimado) || parseFloat(project.total) || 0,
        presupuesto_estimado: parseFloat(project.presupuesto_estimado) || 0,
        total: parseFloat(project.total) || 0,
        status: project.estado || project.status || 'nuevo',
        priority: project.prioridad || project.priority || 'normal',
        date: project.date ? new Date(project.date) : (project.created_at ? new Date(project.created_at) : new Date()),
        fecha_inicio: project.fecha_inicio,
        fecha_entrega_estimada: project.fecha_entrega_estimada,
        fecha_entrega_deseada: project.fecha_entrega_deseada,
        deliveryDate: project.deliveryDate ? new Date(project.deliveryDate) : null,
        notas_adicionales: project.notas_adicionales,
        progress: project.progress || 0
      }));

      dispatch({ type: ACTIONS.SET_PROJECTS, payload: { data: normalizedProjects } });
      return normalizedProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: { type: 'projects', error: error.message } 
      });
      throw error;
    }
  }, [isCacheValid, state.loading.projects, state.cache.projects.data]);

  const fetchInvoices = useCallback(async (limit = null, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('invoices')) {
      return state.cache.invoices.data;
    }

    if (state.loading.invoices === LoadingState.LOADING) {
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'invoices' } });

    try {
      const params = limit ? { limit } : {};
      const response = await api.get('/api/client/invoices', { params });
      const data = response.data || [];
      
      dispatch({ type: ACTIONS.SET_INVOICES, payload: { data } });
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: { type: 'invoices', error: error.message } 
      });
      throw error;
    }
  }, [isCacheValid, state.loading.invoices, state.cache.invoices.data]);

  const invalidateCache = useCallback((type = 'all') => {
    dispatch({ type: ACTIONS.INVALIDATE_CACHE, payload: { type } });
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStats(true),
      fetchProjects(null, true),
      fetchInvoices(null, true)
    ]);
  }, [fetchStats, fetchProjects, fetchInvoices]);

  const value = {
    // Data
    stats: state.stats,
    projects: state.projects,
    invoices: state.invoices,
    
    // Loading states
    loading: state.loading,
    
    // Error states
    error: state.error,
    
    // Actions
    fetchStats,
    fetchProjects,
    fetchInvoices,
    invalidateCache,
    refreshAll,
    
    // Utils
    isLoading: (type) => state.loading[type] === LoadingState.LOADING,
    hasError: (type) => state.error[type] !== null,
    isCacheValid
  };

  return (
    <ClientDataContext.Provider value={value}>
      {children}
    </ClientDataContext.Provider>
  );
};

ClientDataProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ClientDataContext;