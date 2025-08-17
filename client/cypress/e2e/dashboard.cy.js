describe('Dashboard', () => {
  beforeEach(() => {
    // Mock dashboard APIs
    cy.interceptApi('GET', '/admin/stats', 'getStats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalProjects: 15,
          activeProjects: 8,
          completedProjects: 7,
          totalUsers: 25,
          totalRevenue: 125000.00,
          monthlyRevenue: 15000.00,
          averageProjectValue: 8333.33,
          growthPercentage: 12.5
        }
      }
    });

    cy.interceptApi('GET', '/admin/charts', 'getCharts', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          monthlyProjects: [
            { month: 'Ene', completed: 2, started: 3 },
            { month: 'Feb', completed: 1, started: 2 },
            { month: 'Mar', completed: 3, started: 1 },
            { month: 'Abr', completed: 1, started: 4 }
          ],
          projectsByCategory: [
            { categoria: 'web', count: 8 },
            { categoria: 'mobile', count: 4 },
            { categoria: 'desktop', count: 2 },
            { categoria: 'consulting', count: 1 }
          ],
          revenueByMonth: [
            { month: 'Ene', revenue: 25000 },
            { month: 'Feb', revenue: 18000 },
            { month: 'Mar', revenue: 32000 },
            { month: 'Abr', revenue: 28000 }
          ]
        }
      }
    });

    cy.interceptApi('GET', '/admin/recent-activity', 'getActivity', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            descripcion: 'Nuevo proyecto creado: E-commerce Platform',
            usuario: 'Admin User',
            fecha: new Date().toISOString(),
            tipo: 'project_created'
          },
          {
            id: 2,
            descripcion: 'Proyecto completado: Mobile Banking App',
            usuario: 'John Doe',
            fecha: new Date(Date.now() - 86400000).toISOString(),
            tipo: 'project_completed'
          }
        ]
      }
    });

    cy.loginAsAdmin();
    cy.navigateToAdmin('dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should load dashboard successfully', () => {
      cy.waitForApi('@getStats');
      cy.waitForApi('@getCharts');
      cy.waitForApi('@getActivity');
      
      cy.get('[data-cy="dashboard-content"]').should('be.visible');
      cy.get('[data-cy="dashboard-title"]').should('contain.text', 'Dashboard');
    });

    it('should display welcome message', () => {
      cy.waitForApi('@getStats');
      
      cy.get('[data-cy="welcome-message"]').should('be.visible');
      cy.get('[data-cy="welcome-message"]').should('contain.text', 'Bienvenido');
    });

    it('should show loading state initially', () => {
      cy.visit('/admin/dashboard');
      cy.checkLoadingState(true);
    });

    it('should hide loading state after data loads', () => {
      cy.waitForApi('@getStats');
      cy.waitForApi('@getCharts');
      
      cy.checkLoadingState(false);
    });
  });

  describe('Statistics Cards', () => {
    beforeEach(() => {
      cy.waitForApi('@getStats');
    });

    it('should display all stat cards', () => {
      cy.get('[data-cy="stats-grid"]').should('be.visible');
      cy.get('[data-cy="stat-card"]').should('have.length', 7);
    });

    it('should show total projects stat', () => {
      cy.get('[data-cy="stat-total-projects"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '15');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Total Proyectos');
        cy.get('[data-cy="stat-icon"]').should('be.visible');
      });
    });

    it('should show active projects stat', () => {
      cy.get('[data-cy="stat-active-projects"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '8');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Proyectos Activos');
      });
    });

    it('should show completed projects stat', () => {
      cy.get('[data-cy="stat-completed-projects"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '7');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Proyectos Completados');
      });
    });

    it('should show total users stat', () => {
      cy.get('[data-cy="stat-total-users"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '25');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Total Usuarios');
      });
    });

    it('should show revenue stats with proper formatting', () => {
      cy.get('[data-cy="stat-total-revenue"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '$125,000.00');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Ingresos Totales');
      });

      cy.get('[data-cy="stat-monthly-revenue"]').within(() => {
        cy.get('[data-cy="stat-value"]').should('contain.text', '$15,000.00');
        cy.get('[data-cy="stat-label"]').should('contain.text', 'Ingresos del Mes');
      });
    });

    it('should show growth percentage', () => {
      cy.get('[data-cy="stat-growth"]').within(() => {
        cy.get('[data-cy="growth-percentage"]').should('contain.text', '+12.5%');
        cy.get('[data-cy="growth-indicator"]').should('have.class', 'text-green-600');
      });
    });
  });

  describe('Charts Section', () => {
    beforeEach(() => {
      cy.waitForApi('@getCharts');
    });

    it('should display charts container', () => {
      cy.get('[data-cy="charts-section"]').should('be.visible');
      cy.get('[data-cy="charts-title"]').should('contain.text', 'Análisis y Reportes');
    });

    it('should show monthly projects chart', () => {
      cy.get('[data-cy="monthly-projects-chart"]').should('be.visible');
      cy.get('[data-cy="chart-title"]').first().should('contain.text', 'Proyectos por Mes');
    });

    it('should show projects by category chart', () => {
      cy.get('[data-cy="category-chart"]').should('be.visible');
      cy.get('[data-cy="chart-title"]').eq(1).should('contain.text', 'Proyectos por Categoría');
    });

    it('should show revenue chart', () => {
      cy.get('[data-cy="revenue-chart"]').should('be.visible');
      cy.get('[data-cy="chart-title"]').eq(2).should('contain.text', 'Ingresos Mensuales');
    });

    it('should display chart legends', () => {
      cy.get('[data-cy="chart-legend"]').should('be.visible');
    });
  });

  describe('Recent Activity', () => {
    beforeEach(() => {
      cy.waitForApi('@getActivity');
    });

    it('should display recent activity section', () => {
      cy.get('[data-cy="recent-activity"]').should('be.visible');
      cy.get('[data-cy="activity-title"]').should('contain.text', 'Actividad Reciente');
    });

    it('should show activity items', () => {
      cy.get('[data-cy="activity-item"]').should('have.length', 2);
    });

    it('should display activity details', () => {
      cy.get('[data-cy="activity-item"]').first().within(() => {
        cy.get('[data-cy="activity-description"]')
          .should('contain.text', 'Nuevo proyecto creado: E-commerce Platform');
        cy.get('[data-cy="activity-user"]').should('contain.text', 'Admin User');
        cy.get('[data-cy="activity-date"]').should('be.visible');
        cy.get('[data-cy="activity-icon"]').should('be.visible');
      });
    });

    it('should show different activity types with appropriate icons', () => {
      cy.get('[data-cy="activity-item"]').each(($item) => {
        cy.wrap($item).find('[data-cy="activity-icon"]').should('be.visible');
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions section', () => {
      cy.get('[data-cy="quick-actions"]').should('be.visible');
      cy.get('[data-cy="quick-actions-title"]').should('contain.text', 'Acciones Rápidas');
    });

    it('should show action buttons', () => {
      cy.get('[data-cy="quick-action"]').should('have.length.greaterThan', 0);
    });

    it('should navigate to new project on click', () => {
      cy.get('[data-cy="quick-action-new-project"]').click();
      cy.url().should('include', '/admin/projects');
    });

    it('should navigate to users management', () => {
      cy.get('[data-cy="quick-action-users"]').click();
      cy.url().should('include', '/admin/users');
    });

    it('should navigate to reports', () => {
      cy.get('[data-cy="quick-action-reports"]').click();
      cy.url().should('include', '/admin/reports');
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when refresh button is clicked', () => {
      cy.waitForApi('@getStats');
      
      // Re-intercept APIs for refresh
      cy.interceptApi('GET', '/admin/stats', 'refreshStats', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalProjects: 16, // Updated value
            activeProjects: 9,
            completedProjects: 7,
            totalUsers: 26
          }
        }
      });

      cy.get('[data-cy="refresh-button"]').click();
      cy.waitForApi('@refreshStats');
      
      cy.get('[data-cy="stat-total-projects"]')
        .find('[data-cy="stat-value"]')
        .should('contain.text', '16');
    });

    it('should show loading state during refresh', () => {
      cy.waitForApi('@getStats');
      
      cy.interceptApi('GET', '/admin/stats', 'slowRefresh', {
        delay: 2000,
        statusCode: 200,
        body: { success: true, data: {} }
      });

      cy.get('[data-cy="refresh-button"]').click();
      cy.get('[data-cy="refresh-loading"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle stats API error', () => {
      cy.interceptApi('GET', '/admin/stats', 'statsError', {
        statusCode: 500,
        body: { success: false, error: 'Server error' }
      });

      cy.visit('/admin/dashboard');
      cy.waitForApi('@statsError');
      
      cy.get('[data-cy="stats-error"]').should('be.visible');
      cy.get('[data-cy="stats-error"]').should('contain.text', 'Error al cargar estadísticas');
    });

    it('should handle charts API error', () => {
      cy.waitForApi('@getStats');
      
      cy.interceptApi('GET', '/admin/charts', 'chartsError', {
        statusCode: 500,
        body: { success: false, error: 'Chart data error' }
      });

      cy.visit('/admin/dashboard');
      cy.waitForApi('@chartsError');
      
      cy.get('[data-cy="charts-error"]').should('be.visible');
    });

    it('should show retry button on error', () => {
      cy.interceptApi('GET', '/admin/stats', 'statsError', {
        statusCode: 500,
        body: { success: false, error: 'Server error' }
      });

      cy.visit('/admin/dashboard');
      cy.waitForApi('@statsError');
      
      cy.get('[data-cy="retry-button"]').should('be.visible');
      cy.get('[data-cy="retry-button"]').click();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport(375, 667);
      cy.waitForApi('@getStats');
      
      cy.get('[data-cy="stats-grid"]').should('have.class', 'grid-cols-1');
      cy.get('[data-cy="charts-section"]').should('be.visible');
    });

    it('should adapt to tablet viewport', () => {
      cy.viewport(768, 1024);
      cy.waitForApi('@getStats');
      
      cy.get('[data-cy="stats-grid"]').should('have.class', 'md:grid-cols-2');
    });

    it('should show full layout on desktop', () => {
      cy.viewport(1280, 720);
      cy.waitForApi('@getStats');
      
      cy.get('[data-cy="stats-grid"]').should('have.class', 'lg:grid-cols-4');
      cy.get('[data-cy="dashboard-content"]').should('be.visible');
    });
  });
});