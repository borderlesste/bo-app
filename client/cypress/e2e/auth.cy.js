describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login', () => {
    it('should redirect to login page when not authenticated', () => {
      cy.url().should('include', '/login');
      cy.get('[data-cy="login-form"]').should('be.visible');
    });

    it('should display login form elements', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      cy.get('[data-cy="register-link"]').should('be.visible');
      cy.get('[data-cy="forgot-password-link"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="email-error"]').should('contain.text', 'El email es requerido');
      cy.get('[data-cy="password-error"]').should('contain.text', 'La contraseña es requerida');
    });

    it('should validate email format', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="email-error"]').should('contain.text', 'Formato de email inválido');
    });

    it('should handle invalid credentials', () => {
      cy.interceptApi('POST', '/auth/login', 'loginRequest', {
        statusCode: 401,
        body: { success: false, error: 'Credenciales inválidas' }
      });

      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('wrong@example.com');
      cy.get('[data-cy="password-input"]').type('wrongpassword');
      cy.get('[data-cy="login-button"]').click();
      
      cy.waitForApi('@loginRequest');
      cy.checkToast('Credenciales inválidas', 'error');
    });

    it('should login successfully with valid credentials', () => {
      cy.interceptApi('POST', '/auth/login', 'loginRequest', {
        statusCode: 200,
        body: {
          success: true,
          user: { id: 1, nombre: 'Test User', email: 'test@example.com', rol: 'admin' },
          token: 'mock-jwt-token'
        }
      });

      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('admin@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.waitForApi('@loginRequest');
      cy.url().should('include', '/admin/dashboard');
      cy.checkToast('Bienvenido', 'success');
    });

    it('should toggle password visibility', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
      cy.get('[data-cy="password-toggle"]').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
      cy.get('[data-cy="password-toggle"]').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });

    it('should navigate to register page', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="register-link"]').click();
      cy.url().should('include', '/register');
    });

    it('should handle loading state', () => {
      cy.interceptApi('POST', '/auth/login', 'loginRequest', {
        delay: 2000,
        statusCode: 200,
        body: { success: true, token: 'mock-token' }
      });

      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="login-button"]').should('be.disabled');
      cy.get('[data-cy="login-button"]').should('contain.text', 'Iniciando sesión...');
    });
  });

  describe('Register', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should display register form elements', () => {
      cy.get('[data-cy="register-form"]').should('be.visible');
      cy.get('[data-cy="name-input"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="confirm-password-input"]').should('be.visible');
      cy.get('[data-cy="phone-input"]').should('be.visible');
      cy.get('[data-cy="company-input"]').should('be.visible');
      cy.get('[data-cy="register-button"]').should('be.visible');
      cy.get('[data-cy="login-link"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy="register-button"]').click();
      
      cy.get('[data-cy="name-error"]').should('be.visible');
      cy.get('[data-cy="email-error"]').should('be.visible');
      cy.get('[data-cy="password-error"]').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('different-password');
      cy.get('[data-cy="register-button"]').click();
      
      cy.get('[data-cy="confirm-password-error"]')
        .should('contain.text', 'Las contraseñas no coinciden');
    });

    it('should register successfully', () => {
      cy.interceptApi('POST', '/auth/register', 'registerRequest', {
        statusCode: 201,
        body: { success: true, message: 'Usuario registrado exitosamente' }
      });

      cy.get('[data-cy="name-input"]').type('Test User');
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('password123');
      cy.get('[data-cy="phone-input"]').type('1234567890');
      cy.get('[data-cy="company-input"]').type('Test Company');
      cy.get('[data-cy="register-button"]').click();
      
      cy.waitForApi('@registerRequest');
      cy.checkToast('Usuario registrado exitosamente', 'success');
      cy.url().should('include', '/login');
    });

    it('should handle existing user error', () => {
      cy.interceptApi('POST', '/auth/register', 'registerRequest', {
        statusCode: 400,
        body: { success: false, error: 'El usuario ya existe' }
      });

      cy.get('[data-cy="name-input"]').type('Existing User');
      cy.get('[data-cy="email-input"]').type('existing@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('password123');
      cy.get('[data-cy="register-button"]').click();
      
      cy.waitForApi('@registerRequest');
      cy.checkToast('El usuario ya existe', 'error');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      // First login
      cy.loginAsAdmin();
      
      // Then logout
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      
      cy.url().should('include', '/login');
      cy.checkToast('Sesión cerrada exitosamente', 'success');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login for protected routes', () => {
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/login');
    });

    it('should access protected routes when authenticated', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/admin/dashboard');
      cy.get('[data-cy="dashboard-content"]').should('be.visible');
    });
  });
});