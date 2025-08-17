describe('Projects Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
  });

  describe('Projects List', () => {
    beforeEach(() => {
      cy.interceptApi('GET', '/projects*', 'getProjects', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              titulo: 'E-commerce Platform',
              descripcion: 'Full-featured e-commerce solution',
              categoria: 'web',
              tecnologias: ['React', 'Node.js'],
              estado: 'completado',
              presupuesto: 15000.00,
              fecha_inicio: '2024-01-01',
              fecha_fin: '2024-03-01'
            },
            {
              id: 2,
              titulo: 'Mobile Banking App',
              descripcion: 'Secure mobile banking application',
              categoria: 'mobile',
              tecnologias: ['React Native'],
              estado: 'en_progreso',
              presupuesto: 25000.00,
              fecha_inicio: '2024-02-01',
              fecha_fin: null
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });

      cy.navigateToAdmin('projects');
    });

    it('should display projects list', () => {
      cy.waitForApi('@getProjects');
      
      cy.get('[data-cy="projects-list"]').should('be.visible');
      cy.get('[data-cy="project-card"]').should('have.length', 2);
      
      // Check first project
      cy.get('[data-cy="project-card"]').first().within(() => {
        cy.get('[data-cy="project-title"]').should('contain.text', 'E-commerce Platform');
        cy.get('[data-cy="project-status"]').should('contain.text', 'completado');
        cy.get('[data-cy="project-budget"]').should('contain.text', '$15,000.00');
      });
    });

    it('should filter projects by category', () => {
      cy.waitForApi('@getProjects');
      
      cy.get('[data-cy="category-filter"]').select('web');
      
      cy.interceptApi('GET', '/projects*categoria=web*', 'getFilteredProjects', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              titulo: 'E-commerce Platform',
              categoria: 'web',
              estado: 'completado'
            }
          ],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 }
        }
      });
      
      cy.waitForApi('@getFilteredProjects');
      cy.get('[data-cy="project-card"]').should('have.length', 1);
    });

    it('should search projects', () => {
      cy.waitForApi('@getProjects');
      
      cy.get('[data-cy="search-input"]').type('E-commerce');
      
      cy.interceptApi('GET', '/projects*search=E-commerce*', 'getSearchResults', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              titulo: 'E-commerce Platform',
              categoria: 'web',
              estado: 'completado'
            }
          ],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 }
        }
      });
      
      cy.waitForApi('@getSearchResults');
      cy.get('[data-cy="project-card"]').should('have.length', 1);
      cy.get('[data-cy="project-title"]').should('contain.text', 'E-commerce');
    });

    it('should handle pagination', () => {
      cy.waitForApi('@getProjects');
      
      // Mock second page
      cy.interceptApi('GET', '/projects*page=2*', 'getPage2', {
        statusCode: 200,
        body: {
          success: true,
          data: [],
          pagination: { page: 2, limit: 10, total: 2, pages: 1 }
        }
      });
      
      cy.get('[data-cy="pagination-next"]').click();
      cy.waitForApi('@getPage2');
    });
  });

  describe('Create Project', () => {
    beforeEach(() => {
      cy.navigateToAdmin('projects');
      cy.get('[data-cy="create-project-button"]').click();
    });

    it('should open create project modal', () => {
      cy.get('[data-cy="project-modal"]').should('be.visible');
      cy.get('[data-cy="modal-title"]').should('contain.text', 'Crear Nuevo Proyecto');
    });

    it('should create project successfully', () => {
      cy.interceptApi('POST', '/projects', 'createProject', {
        statusCode: 201,
        body: {
          success: true,
          message: 'Proyecto creado exitosamente',
          data: { id: 3 }
        }
      });

      // Fill form
      cy.get('[data-cy="title-input"]').type('New Test Project');
      cy.get('[data-cy="description-input"]').type('A new project for testing');
      cy.get('[data-cy="category-select"]').select('web');
      cy.get('[data-cy="status-select"]').select('planificado');
      cy.get('[data-cy="budget-input"]').type('10000');
      cy.get('[data-cy="start-date-input"]').type('2024-04-01');
      
      // Add technologies
      cy.get('[data-cy="tech-input"]').type('React');
      cy.get('[data-cy="add-tech-button"]').click();
      cy.get('[data-cy="tech-tag"]').should('contain.text', 'React');
      
      cy.get('[data-cy="submit-button"]').click();
      
      cy.waitForApi('@createProject');
      cy.checkToast('Proyecto creado exitosamente', 'success');
      cy.get('[data-cy="project-modal"]').should('not.exist');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy="submit-button"]').click();
      
      cy.get('[data-cy="title-error"]').should('be.visible');
      cy.get('[data-cy="description-error"]').should('be.visible');
      cy.get('[data-cy="category-error"]').should('be.visible');
    });

    it('should close modal on cancel', () => {
      cy.get('[data-cy="cancel-button"]').click();
      cy.get('[data-cy="project-modal"]').should('not.exist');
    });
  });

  describe('Edit Project', () => {
    let testProject;

    beforeEach(() => {
      // Create a test project first
      cy.createTestProject().then((project) => {
        testProject = project;
      });
      
      cy.navigateToAdmin('projects');
      cy.get('[data-cy="project-card"]').first().within(() => {
        cy.get('[data-cy="edit-button"]').click();
      });
    });

    afterEach(() => {
      if (testProject) {
        cy.deleteTestProject(testProject.id);
      }
    });

    it('should open edit project modal with existing data', () => {
      cy.get('[data-cy="project-modal"]').should('be.visible');
      cy.get('[data-cy="modal-title"]').should('contain.text', 'Editar Proyecto');
      
      // Check if form is populated
      cy.get('[data-cy="title-input"]').should('have.value', 'Test Project E2E');
    });

    it('should update project successfully', () => {
      cy.interceptApi('PUT', '/projects/*', 'updateProject', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Proyecto actualizado exitosamente'
        }
      });

      cy.get('[data-cy="title-input"]').clear().type('Updated Project Title');
      cy.get('[data-cy="status-select"]').select('en_progreso');
      cy.get('[data-cy="submit-button"]').click();
      
      cy.waitForApi('@updateProject');
      cy.checkToast('Proyecto actualizado exitosamente', 'success');
    });
  });

  describe('Delete Project', () => {
    let testProject;

    beforeEach(() => {
      cy.createTestProject().then((project) => {
        testProject = project;
      });
      
      cy.navigateToAdmin('projects');
    });

    it('should delete project with confirmation', () => {
      cy.interceptApi('DELETE', '/projects/*', 'deleteProject', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Proyecto eliminado exitosamente'
        }
      });

      cy.get('[data-cy="project-card"]').first().within(() => {
        cy.get('[data-cy="delete-button"]').click();
      });
      
      // Confirm deletion
      cy.get('[data-cy="confirm-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-delete"]').click();
      
      cy.waitForApi('@deleteProject');
      cy.checkToast('Proyecto eliminado exitosamente', 'success');
    });

    it('should cancel deletion', () => {
      cy.get('[data-cy="project-card"]').first().within(() => {
        cy.get('[data-cy="delete-button"]').click();
      });
      
      cy.get('[data-cy="confirm-dialog"]').should('be.visible');
      cy.get('[data-cy="cancel-delete"]').click();
      
      cy.get('[data-cy="confirm-dialog"]').should('not.exist');
      cy.get('[data-cy="project-card"]').should('exist');
    });
  });

  describe('Project Details', () => {
    beforeEach(() => {
      cy.interceptApi('GET', '/projects/1', 'getProject', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            titulo: 'E-commerce Platform',
            descripcion: 'Full-featured e-commerce solution with payment integration',
            categoria: 'web',
            tecnologias: ['React', 'Node.js', 'MySQL'],
            estado: 'completado',
            presupuesto: 15000.00,
            fecha_inicio: '2024-01-01',
            fecha_fin: '2024-03-01',
            cliente_nombre: 'Tech Solutions Inc.'
          }
        }
      });

      cy.navigateToAdmin('projects');
      cy.get('[data-cy="project-card"]').first().click();
    });

    it('should display project details', () => {
      cy.waitForApi('@getProject');
      
      cy.get('[data-cy="project-details"]').should('be.visible');
      cy.get('[data-cy="project-title"]').should('contain.text', 'E-commerce Platform');
      cy.get('[data-cy="project-description"]').should('contain.text', 'Full-featured e-commerce');
      cy.get('[data-cy="project-budget"]').should('contain.text', '$15,000.00');
      cy.get('[data-cy="project-client"]').should('contain.text', 'Tech Solutions Inc.');
    });

    it('should display project timeline', () => {
      cy.waitForApi('@getProject');
      
      cy.get('[data-cy="project-timeline"]').should('be.visible');
      cy.get('[data-cy="start-date"]').should('contain.text', '01/01/2024');
      cy.get('[data-cy="end-date"]').should('contain.text', '01/03/2024');
    });

    it('should display technology tags', () => {
      cy.waitForApi('@getProject');
      
      cy.get('[data-cy="tech-tags"]').should('be.visible');
      cy.get('[data-cy="tech-tag"]').should('have.length', 3);
      cy.get('[data-cy="tech-tag"]').first().should('contain.text', 'React');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.navigateToAdmin('projects');
    });

    it('should be responsive on mobile devices', () => {
      cy.viewport(375, 667);
      
      cy.get('[data-cy="projects-list"]').should('be.visible');
      cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
      
      // Check if cards stack properly on mobile
      cy.get('[data-cy="project-card"]').each(($card) => {
        cy.wrap($card).should('have.css', 'width');
      });
    });

    it('should be responsive on tablet devices', () => {
      cy.viewport(768, 1024);
      
      cy.get('[data-cy="projects-list"]').should('be.visible');
      cy.get('[data-cy="project-card"]').should('be.visible');
    });
  });
});