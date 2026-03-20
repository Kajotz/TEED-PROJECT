// cypress/support/e2e.js
// Support file for E2E tests

// Add custom commands
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('input[placeholder*="username"]').type(username);
  cy.get('input[placeholder*="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/profile');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('mockApiLogin', () => {
  cy.intercept('POST', '/api/token/', {
    access: 'mock-jwt-token',
    refresh: 'mock-refresh-token',
  }).as('login');
  
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', 'mock-jwt-token');
    win.localStorage.setItem('refresh_token', 'mock-refresh-token');
  });
});

Cypress.Commands.add('mockProfileApi', (profileData = {}) => {
  const defaultProfile = {
    id: 'user-1',
    username: 'testuser',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@test.com',
    businesses: [
      {
        id: 'business-1',
        name: 'My Business',
        slug: 'my-business',
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
    ],
  };
  
  cy.intercept('GET', '/api/profile/', {
    statusCode: 200,
    body: { ...defaultProfile, ...profileData },
  }).as('getProfile');
});

Cypress.Commands.add('mockBusinessListApi', (businesses = []) => {
  const defaultBusinesses = [
    {
      id: 'business-1',
      name: 'My Business',
      slug: 'my-business',
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
  ];
  
  cy.intercept('GET', '/api/profile/businesses/', {
    statusCode: 200,
    body: businesses.length > 0 ? businesses : defaultBusinesses,
  }).as('getBusinesses');
});

Cypress.Commands.add('mockBusinessDetailApi', (businessId, businessData = {}) => {
  const defaultBusiness = {
    id: businessId,
    name: 'Test Business',
    slug: 'test-business',
    business_type: 'retail',
    user_role: 'owner',
    user_joined_at: '2024-01-01T00:00:00Z',
    created_at: '2023-12-01T00:00:00Z',
    is_active: true,
    business_profile: {
      logo: 'logo.jpg',
      primary_color: '#3498db',
      secondary_color: '#2c3e50',
      theme: 'light',
      about: 'Test Business',
      email: 'business@test.com',
      phone: '+1234567890',
      website: 'https://test.com',
      address: '123 Main St',
      social_media: {
        instagram: '@testbusiness',
        facebook: 'testbusiness',
        tiktok: '@testbusiness',
        whatsapp: '+1234567890',
      },
    },
  };
  
  cy.intercept('GET', `/api/profile/businesses/${businessId}/`, {
    statusCode: 200,
    body: { ...defaultBusiness, ...businessData },
  }).as('getBusinessDetail');
});

// Ignore uncaught exceptions
Cypress.on('uncaught:exception', () => false);
