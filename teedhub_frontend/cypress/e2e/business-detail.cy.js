// cypress/e2e/business-detail.cy.js
/**
 * E2E Tests for Business Detail Page
 */

describe('Business Detail Page', () => {
  beforeEach(() => {
    cy.mockApiLogin();
    cy.mockBusinessDetailApi('business-1');
    cy.visit('/business/business-1');
    cy.wait('@getBusinessDetail');
  });

  it('displays business name', () => {
    cy.contains('Test Business').should('be.visible');
  });

  it('displays business type badge', () => {
    cy.contains('Retail').should('be.visible');
  });

  it('displays user role badge', () => {
    cy.contains('Owner').should('be.visible');
  });

  it('displays business description', () => {
    cy.contains('Test Business').should('be.visible');
  });

  it('displays primary color section', () => {
    cy.get('[data-testid="primary-color"]').should('be.visible');
  });

  it('displays secondary color section', () => {
    cy.get('[data-testid="secondary-color"]').should('be.visible');
  });

  it('displays contact information', () => {
    cy.contains('business@test.com').should('be.visible');
    cy.contains('+1234567890').should('be.visible');
  });

  it('displays business address', () => {
    cy.contains('123 Main St').should('be.visible');
  });

  it('displays social media links', () => {
    cy.contains('@testbusiness').should('be.visible');
  });

  it('displays back button', () => {
    cy.get('[data-testid="back-button"]').should('be.visible');
  });

  it('displays edit button for owner', () => {
    cy.get('[data-testid="edit-button"]').should('be.visible');
  });

  it('navigates back to profile when back button clicked', () => {
    cy.get('[data-testid="back-button"]').click();
    cy.url().should('include', '/profile');
  });

  it('navigates to edit page when edit button clicked', () => {
    cy.get('[data-testid="edit-button"]').click();
    cy.url().should('include', '/edit');
  });

  it('shows loading spinner initially', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/businesses/business-1/', (req) => {
      req.reply((res) => {
        res.delay(1000);
      });
    }).as('slowDetail');

    cy.visit('/business/business-1');
    cy.get('[data-testid="loading-spinner"]').should('exist');
    cy.wait('@slowDetail');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('shows 403 error for non-members', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/businesses/business-1/', {
      statusCode: 403,
      body: { detail: 'Permission denied' },
    }).as('forbiddenBusiness');

    cy.visit('/business/business-1');
    cy.wait('@forbiddenBusiness');
    cy.contains('Access Denied').should('be.visible');
  });

  it('shows 404 error for non-existent business', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/businesses/business-1/', {
      statusCode: 404,
      body: { detail: 'Not found' },
    }).as('notFoundBusiness');

    cy.visit('/business/business-1');
    cy.wait('@notFoundBusiness');
    cy.contains('Not found').should('be.visible');
  });

  it('does not show edit button for non-owners', () => {
    cy.mockApiLogin();
    cy.mockBusinessDetailApi('business-1', {
      user_role: 'staff',
    });

    cy.visit('/business/business-1');
    cy.wait('@getBusinessDetail');
    cy.get('[data-testid="edit-button"]').should('not.exist');
  });

  it('displays joined date', () => {
    cy.contains('2024-01-01').should('be.visible');
  });

  it('displays created date', () => {
    cy.contains('2023-12-01').should('be.visible');
  });

  it('shows active status', () => {
    cy.get('[data-testid="status-badge"]').should('contain', 'Active');
  });

  it('displays all branding information', () => {
    cy.get('[data-testid="branding-section"]').should('be.visible');
    cy.contains('Light').should('be.visible');
  });

  it('displays logo when present', () => {
    cy.get('[data-testid="business-logo"]').should('have.attr', 'src');
  });
});
