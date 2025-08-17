// Cypress E2E support file

import './commands';

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions in the application under test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Global before hook
beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set viewport for consistency
  cy.viewport(1280, 720);
});

// Global after hook
afterEach(() => {
  // Clean up any test data if needed
  cy.log('Test completed, cleaning up...');
});

// Custom Cypress configuration
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);