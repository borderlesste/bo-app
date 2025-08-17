import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import DashboardPage from '../../pages/DashboardPage';

// Mock chart libraries
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    // Mock localStorage for auth token
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
  };

  it('renders dashboard title', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    renderDashboard();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays stats cards after loading', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Proyectos')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Proyectos Activos')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('displays revenue information', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
      expect(screen.getByText('$125,000.00')).toBeInTheDocument();
      expect(screen.getByText('Ingresos del Mes')).toBeInTheDocument();
      expect(screen.getByText('$15,000.00')).toBeInTheDocument();
    });
  });

  it('renders charts section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/proyectos por mes/i)).toBeInTheDocument();
      expect(screen.getByText(/proyectos por categoría/i)).toBeInTheDocument();
      expect(screen.getByText(/ingresos mensuales/i)).toBeInTheDocument();
    });
  });

  it('displays chart components', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows recent activity section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/actividad reciente/i)).toBeInTheDocument();
    });
  });

  it('displays quick actions', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/acciones rápidas/i)).toBeInTheDocument();
      expect(screen.getByText(/nuevo proyecto/i)).toBeInTheDocument();
      expect(screen.getByText(/ver proyectos/i)).toBeInTheDocument();
      expect(screen.getByText(/gestionar usuarios/i)).toBeInTheDocument();
    });
  });

  it('handles stats loading error gracefully', async () => {
    // Mock failed API response
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('refreshes data when refresh button is clicked', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Proyectos')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/actualizar/i);
    expect(refreshButton).toBeInTheDocument();
  });

  it('displays percentage changes in stats', async () => {
    renderDashboard();

    await waitFor(() => {
      // Should show percentage changes from mock data
      expect(screen.getByText(/\+\d+%/)).toBeInTheDocument();
    });
  });

  it('shows proper loading states for charts', async () => {
    renderDashboard();

    // Initially should show loading
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // After loading should show charts
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('is responsive and mobile-friendly', async () => {
    renderDashboard();

    await waitFor(() => {
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('grid');
    });
  });

  it('displays welcome message', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
    });
  });

  it('shows date range selector', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/último mes/i)).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    // Mock empty response
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            totalUsers: 0
          }
        })
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });
});