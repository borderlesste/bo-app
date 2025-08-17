import { useMemo } from 'react';
import useOptimizedQuery from './useOptimizedQuery';
import { getAdminStats, getChartsData, getFinancialSummary } from '../api/axios';

// Configuración base reutilizable
const defaultOptions = {
  enabled: true,
  retry: 2,
  staleTime: 2 * 60 * 1000, // 2 minutos
  cacheTime: 5 * 60 * 1000  // 5 minutos
};

// Hook para estadísticas del dashboard
export const useDashboardStats = (options = {}) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  // Admin stats query
  const statsQuery = useOptimizedQuery(
    'admin-stats',
    async ({ signal }) => {
      const response = await getAdminStats({ signal });
      return response.data.success ? response.data.data : null;
    },
    {
      ...defaultOptions,
      enabled,
      refetchInterval // ahora se aplica correctamente
    }
  );

  // Charts data query
  const chartsQuery = useOptimizedQuery(
    'charts-data',
    async ({ signal }) => {
      const response = await getChartsData({ signal });
      return response.data.success ? response.data.data : null;
    },
    {
      ...defaultOptions,
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchInterval
    }
  );

  // Financial summary query
  const financialQuery = useOptimizedQuery(
    'financial-summary',
    async ({ signal }) => {
      const response = await getFinancialSummary({ signal });
      return response.data.success ? response.data.data : null;
    },
    {
      ...defaultOptions,
      enabled,
      staleTime: 3 * 60 * 1000,
      cacheTime: 8 * 60 * 1000,
      refetchInterval
    }
  );

  // Resultado combinado y memoizado
  const result = useMemo(() => ({
    stats: statsQuery.data,
    charts: chartsQuery.data,
    financial: financialQuery.data,
    isLoading: statsQuery.isLoading || chartsQuery.isLoading || financialQuery.isLoading,
    isError: statsQuery.isError || chartsQuery.isError || financialQuery.isError,
    error: statsQuery.error || chartsQuery.error || financialQuery.error,
    isSuccess: statsQuery.isSuccess && chartsQuery.isSuccess && financialQuery.isSuccess,
    // estados más granulares (extra)
    states: {
      stats: statsQuery,
      charts: chartsQuery,
      financial: financialQuery
    },
    refetch: () => {
      statsQuery.refetch();
      chartsQuery.refetch();
      financialQuery.refetch();
    },
    invalidate: () => {
      statsQuery.invalidate();
      chartsQuery.invalidate();
      financialQuery.invalidate();
    }
  }), [statsQuery, chartsQuery, financialQuery]);

  return result;
};

// Hook para estadísticas de entidades específicas
export const useEntityStats = (entity, entityId = null, options = {}) => {
  const { enabled = true } = options;
  const queryKey = entityId ? `${entity}-stats-${entityId}` : `${entity}-stats`;

  return useOptimizedQuery(
    queryKey,
    async ({ signal }) => {
      let apiCall;
      switch (entity) {
        case 'clients':
          apiCall = (await import('../api/axios')).getClientStats;
          break;
        case 'quotations':
          apiCall = (await import('../api/axios')).getQuotationStats;
          break;
        case 'invoices':
          apiCall = (await import('../api/axios')).getInvoiceStats;
          break;
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }

      const response = await apiCall({ signal });
      return response.data.success ? response.data.data : null;
    },
    {
      ...defaultOptions,
      enabled,
      ...options
    }
  );
};

export default useDashboardStats;
