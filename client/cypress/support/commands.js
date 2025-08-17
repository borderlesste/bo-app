// Custom Cypress commands

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  cy.url().should('not.include', '/login');
});

// Login as admin command
Cypress.Commands.add('loginAsAdmin', () => {
  const { email, password } = Cypress.env('adminUser');
  cy.login(email, password);
  cy.url().should('include', '/admin/dashboard');
});

// Login as regular user command
Cypress.Commands.add('loginAsUser', () => {
  const { email, password } = Cypress.env('testUser');
  cy.login(email, password);
});

// Create test project command
Cypress.Commands.add('createTestProject', (projectData = {}) => {
  const defaultProject = {
    titulo: 'Test Project E2E',
    descripcion: 'A project created during E2E testing',
    categoria: 'web',
    tecnologias: ['React', 'Node.js'],
    estado: 'planificado',
    presupuesto: 5000,
    ...projectData
  };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/projects`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    body: defaultProject
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body.data;
  });
});

// Delete test project command
Cypress.Commands.add('deleteTestProject', (projectId) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/projects/${projectId}`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  });
});

// Wait for API response command
Cypress.Commands.add('waitForApi', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// Check toast notification command
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get('[data-cy="toast"]', { timeout: 5000 })
    .should('be.visible')
    .and('contain.text', message);
  
  if (type) {
    cy.get('[data-cy="toast"]').should('have.class', `toast-${type}`);
  }
});

// Fill form field command
Cypress.Commands.add('fillField', (selector, value) => {
  cy.get(selector).clear().type(value);
});

// Upload file command
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/jpeg') => {
  cy.fixture(fileName).then(fileContent => {
    cy.get(selector).selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: fileType
    });
  });
});

// Check loading state command
Cypress.Commands.add('checkLoadingState', (shouldBeLoading = true) => {
  if (shouldBeLoading) {
    cy.get('[data-cy="loading-spinner"]').should('be.visible');
  } else {
    cy.get('[data-cy="loading-spinner"]').should('not.exist');
  }
});

// Wait for page load command
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy="loading-spinner"]').should('not.exist');
  cy.get('body').should('be.visible');
});

// Check accessibility command
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(null, null, cy.terminalLog);
});

// Custom assertion for element visibility
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

// Custom assertion for element text content
Cypress.Commands.add('shouldHaveText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text);
});

// Intercept API calls command
Cypress.Commands.add('interceptApi', (method, url, alias, response = {}) => {
  cy.intercept(method, `${Cypress.env('apiUrl')}${url}`, response).as(alias);
});

// Navigate to admin section command
Cypress.Commands.add('navigateToAdmin', (section) => {
  cy.visit(`/admin/${section}`);
  cy.waitForPageLoad();
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Check responsive design command
Cypress.Commands.add('checkResponsive', () => {
  // Desktop
  cy.viewport(1280, 720);
  cy.get('body').should('be.visible');
  
  // Tablet
  cy.viewport(768, 1024);
  cy.get('body').should('be.visible');
  
  // Mobile
  cy.viewport(375, 667);
  cy.get('body').should('be.visible');
  
  // Reset to desktop
  cy.viewport(1280, 720);
});