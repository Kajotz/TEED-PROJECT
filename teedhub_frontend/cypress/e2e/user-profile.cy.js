// cypress/e2e/user-profile.cy.js
/**
 * E2E Tests for User Profile Page
 */

describe('User Profile Page', () => {
  beforeEach(() => {
    cy.mockApiLogin();
    cy.mockProfileApi();
    cy.visit('/profile');
    cy.wait('@getProfile');
  });

  it('displays user profile header with name', () => {
    cy.get('[data-testid="profile-header"]').should('exist');
    cy.contains('John Doe').should('be.visible');
  });

  it('displays user email', () => {
    cy.contains('john@test.com').should('be.visible');
  });

  it('displays owned businesses section', () => {
    cy.contains('My Businesses').should('be.visible');
  });

  it('displays business cards for each business', () => {
    cy.get('[data-testid="business-card"]').should('have.length.greaterThan', 0);
  });

  it('displays business name on card', () => {
    cy.get('[data-testid="business-card"]').first().contains('My Business').should('be.visible');
  });

  it('displays edit profile button', () => {
    cy.get('[data-testid="edit-profile-button"]').should('be.visible');
  });

  it('opens edit profile modal when edit button clicked', () => {
    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('[data-testid="edit-profile-modal"]').should('be.visible');
  });

  it('shows pre-filled form in edit modal', () => {
    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('input[name="first_name"]').should('have.value', 'John');
    cy.get('input[name="last_name"]').should('have.value', 'Doe');
  });

  it('closes modal when cancel button clicked', () => {
    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('[data-testid="edit-profile-modal"]').should('be.visible');
    
    cy.get('[data-testid="cancel-button"]').click();
    cy.get('[data-testid="edit-profile-modal"]').should('not.exist');
  });

  it('closes modal when clicking outside modal', () => {
    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('[data-testid="edit-profile-modal"]').should('be.visible');
    
    cy.get('[data-testid="modal-overlay"]').click('topLeft');
    cy.get('[data-testid="edit-profile-modal"]').should('not.exist');
  });

  it('updates profile when form submitted', () => {
    cy.intercept('PUT', '/api/profile/', {
      statusCode: 200,
      body: {
        id: 'user-1',
        username: 'testuser',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'john@test.com',
      },
    }).as('updateProfile');

    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('input[name="first_name"]').clear().type('Jane');
    cy.get('input[name="last_name"]').clear().type('Smith');
    
    cy.get('[data-testid="save-button"]').click();
    cy.wait('@updateProfile');
    
    cy.get('[data-testid="edit-profile-modal"]').should('not.exist');
  });

  it('shows success message after profile update', () => {
    cy.intercept('PUT', '/api/profile/', {
      statusCode: 200,
      body: {
        id: 'user-1',
        username: 'testuser',
        first_name: 'Jane',
        last_name: 'Smith',
      },
    }).as('updateProfile');

    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('input[name="first_name"]').clear().type('Jane');
    cy.get('[data-testid="save-button"]').click();
    
    cy.wait('@updateProfile');
    cy.contains('successfully').should('be.visible');
  });

  it('navigates to business detail when business card clicked', () => {
    cy.get('[data-testid="business-card"]').first().click();
    cy.url().should('include', '/business/');
  });

  it('shows loading spinner initially', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/', (req) => {
      req.reply((res) => {
        res.delay(1000);
      });
    }).as('slowProfile');

    cy.visit('/profile');
    cy.get('[data-testid="loading-spinner"]').should('exist');
    cy.wait('@slowProfile');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('shows error message on API failure', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/', {
      statusCode: 500,
      body: { detail: 'Server error' },
    }).as('failedProfile');

    cy.visit('/profile');
    cy.wait('@failedProfile');
    cy.contains('Error').should('be.visible');
  });

  it('retry button refetches profile data', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/', {
      statusCode: 500,
      body: { detail: 'Server error' },
    }).as('failedProfile');

    cy.visit('/profile');
    cy.wait('@failedProfile');

    cy.intercept('GET', '/api/profile/', {
      statusCode: 200,
      body: {
        id: 'user-1',
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        businesses: [],
      },
    }).as('successProfile');

    cy.contains('Retry').click();
    cy.wait('@successProfile');
    cy.contains('Error').should('not.exist');
  });

  it('shows empty state when no businesses', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/', {
      statusCode: 200,
      body: {
        id: 'user-1',
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        businesses: [],
      },
    }).as('emptyProfile');

    cy.visit('/profile');
    cy.wait('@emptyProfile');
    cy.contains('No Businesses Yet').should('be.visible');
  });

  it('displays different sections for owned and member businesses', () => {
    cy.mockProfileApi({
      businesses: [
        {
          id: 'business-1',
          name: 'Owned Business',
          slug: 'owned-business',
          business_type: 'retail',
          user_role: 'owner',
          user_joined_at: '2024-01-01T00:00:00Z',
          business_profile: {
            logo: 'logo.jpg',
            primary_color: '#3498db',
            secondary_color: '#2c3e50',
            theme: 'light',
            about: 'My business',
          },
        },
        {
          id: 'business-2',
          name: 'Member Business',
          slug: 'member-business',
          business_type: 'service',
          user_role: 'staff',
          user_joined_at: '2024-02-01T00:00:00Z',
          business_profile: {
            logo: 'logo2.jpg',
            primary_color: '#e74c3c',
            secondary_color: '#c0392b',
            theme: 'dark',
            about: 'Business where I am staff',
          },
        },
      ],
    });

    cy.visit('/profile');
    cy.wait('@getProfile');

    cy.contains('My Businesses').should('be.visible');
    cy.contains("I'm a Member Of").should('be.visible');
    cy.contains('Owned Business').should('be.visible');
    cy.contains('Member Business').should('be.visible');
  });
});
