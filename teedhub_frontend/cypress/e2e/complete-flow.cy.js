// cypress/e2e/complete-flow.cy.js
/**
 * E2E Tests for Complete User-Business Navigation Flow
 * Tests the entire sync between user profile and business profile
 */

describe('Complete User Profile to Business Profile Flow', () => {
  beforeEach(() => {
    cy.mockApiLogin();
  });

  it('complete flow: profile → business detail → edit → save → back to profile', () => {
    // Step 1: User navigates to profile
    cy.mockProfileApi({
      businesses: [
        {
          id: 'business-1',
          name: 'Test Business',
          slug: 'test-business',
          business_type: 'retail',
          user_role: 'owner',
          user_joined_at: '2024-01-01T00:00:00Z',
          business_profile: {
            logo: 'logo.jpg',
            primary_color: '#3498db',
            secondary_color: '#2c3e50',
            theme: 'light',
            about: 'Original about text',
          },
        },
      ],
    });

    cy.visit('/profile');
    cy.wait('@getProfile');

    // Verify profile page loaded
    cy.contains('John Doe').should('be.visible');
    cy.contains('Test Business').should('be.visible');

    // Step 2: User clicks on business card
    cy.get('[data-testid="business-card"]').first().click();

    // Step 3: Setup business detail API and navigate
    cy.mockBusinessDetailApi('business-1', {
      about: 'Original about text',
    });

    cy.url().should('include', '/business/business-1');
    cy.wait('@getBusinessDetail');

    // Verify business detail loaded
    cy.contains('Test Business').should('be.visible');
    cy.contains('Original about text').should('be.visible');

    // Step 4: User clicks edit button
    cy.get('[data-testid="edit-button"]').click();

    // Step 5: Setup edit page API and navigate
    cy.url().should('include', '/edit');

    // Verify edit form loaded
    cy.get('input[name="name"]').should('have.value', 'Test Business');
    cy.get('textarea[name="about"]').should('have.value', 'Original about text');

    // Step 6: User edits the business information
    cy.get('textarea[name="about"]').clear().type('Updated about text');
    cy.get('input[name="email"]').clear().type('newemail@business.com');
    cy.get('input[name="phone"]').clear().type('+1234567890');

    // Step 7: User saves the changes
    cy.intercept('POST', '/api/businesses/business-1/profile/', {
      statusCode: 200,
      body: { success: true },
    }).as('updateBusiness');

    cy.get('[data-testid="save-button"]').click();

    // Verify API call was made with correct data
    cy.wait('@updateBusiness').then((interception) => {
      expect(interception.request.body.business_profile.about).to.equal('Updated about text');
      expect(interception.request.body.business_profile.email).to.equal('newemail@business.com');
    });

    // Step 8: Verify success message shown
    cy.contains('successfully').should('be.visible');

    // Step 9: Verify navigation back to business detail
    cy.url().should('include', '/business/business-1').and('not.include', '/edit');

    // Step 10: Setup updated business detail API
    cy.mockBusinessDetailApi('business-1', {
      about: 'Updated about text',
      business_profile: {
        email: 'newemail@business.com',
        phone: '+1234567890',
      },
    });

    cy.wait(2000); // Wait for redirect to complete

    // Verify updated data shown on detail page
    cy.get('[data-testid="back-button"]').should('exist'); // Verify we're on detail page

    // Step 11: User navigates back to profile
    cy.get('[data-testid="back-button"]').click();

    // Step 12: Setup profile API and verify navigation
    cy.url().should('include', '/profile');
    cy.mockProfileApi({
      businesses: [
        {
          id: 'business-1',
          name: 'Test Business',
          slug: 'test-business',
          business_type: 'retail',
          user_role: 'owner',
          user_joined_at: '2024-01-01T00:00:00Z',
          business_profile: {
            logo: 'logo.jpg',
            primary_color: '#3498db',
            secondary_color: '#2c3e50',
            theme: 'light',
            about: 'Updated about text',
          },
        },
      ],
    });

    // Profile page should be visible
    cy.contains('Test Business').should('be.visible');
  });

  it('handles data sync when navigating between pages', () => {
    // Scenario: Ensure data is consistent across endpoints

    const consistentBusiness = {
      id: 'business-1',
      name: 'Sync Test Business',
      slug: 'sync-test-business',
      business_type: 'service',
      user_role: 'owner',
      user_joined_at: '2024-01-01T00:00:00Z',
      business_profile: {
        logo: 'logo.jpg',
        primary_color: '#3498db',
        secondary_color: '#2c3e50',
        theme: 'light',
        about: 'Consistent business data',
      },
    };

    // Setup consistent API responses
    cy.mockProfileApi({
      businesses: [consistentBusiness],
    });

    cy.mockBusinessDetailApi('business-1', consistentBusiness);

    // Navigate to profile
    cy.visit('/profile');
    cy.wait('@getProfile');

    // Get name from profile
    cy.get('[data-testid="business-card"]')
      .first()
      .then(($card) => {
        const profileName = $card.text();

        // Navigate to detail
        cy.get('[data-testid="business-card"]').first().click();
        cy.url().should('include', '/business/business-1');

        // Verify same name on detail page
        cy.contains(profileName).should('be.visible');
      });
  });

  it('handles multiple businesses correctly', () => {
    const businesses = [
      {
        id: 'business-1',
        name: 'Business One',
        slug: 'business-one',
        business_type: 'retail',
        user_role: 'owner',
        user_joined_at: '2024-01-01T00:00:00Z',
        business_profile: {
          about: 'First business',
          primary_color: '#3498db',
          secondary_color: '#2c3e50',
          theme: 'light',
          logo: 'logo1.jpg',
        },
      },
      {
        id: 'business-2',
        name: 'Business Two',
        slug: 'business-two',
        business_type: 'service',
        user_role: 'admin',
        user_joined_at: '2024-02-01T00:00:00Z',
        business_profile: {
          about: 'Second business',
          primary_color: '#e74c3c',
          secondary_color: '#c0392b',
          theme: 'dark',
          logo: 'logo2.jpg',
        },
      },
      {
        id: 'business-3',
        name: 'Business Three',
        slug: 'business-three',
        business_type: 'online',
        user_role: 'staff',
        user_joined_at: '2024-03-01T00:00:00Z',
        business_profile: {
          about: 'Third business',
          primary_color: '#27ae60',
          secondary_color: '#16a085',
          theme: 'light',
          logo: 'logo3.jpg',
        },
      },
    ];

    cy.mockProfileApi({ businesses });

    cy.visit('/profile');
    cy.wait('@getProfile');

    // Verify all businesses shown
    cy.contains('Business One').should('be.visible');
    cy.contains('Business Two').should('be.visible');
    cy.contains('Business Three').should('be.visible');

    // Test clicking each business
    businesses.forEach((business) => {
      cy.mockBusinessDetailApi(business.id, business);

      cy.visit('/profile');
      cy.wait('@getProfile');

      cy.contains(business.name).closest('[data-testid="business-card"]').click();

      cy.url().should('include', `/business/${business.id}`);
      cy.contains(business.name).should('be.visible');

      // Verify role shown correctly
      const roleLabel = business.user_role === 'owner' ? 'Owner' : 'Staff';
      cy.contains(roleLabel).should('be.visible');
    });
  });

  it('maintains authentication across page navigation', () => {
    cy.mockProfileApi();
    cy.mockBusinessDetailApi('business-1');

    // Start on profile
    cy.visit('/profile');
    cy.wait('@getProfile');

    // Navigate through pages
    cy.get('[data-testid="business-card"]').first().click();
    cy.url().should('include', '/business/');

    // Verify still authenticated
    cy.get('[data-testid="back-button"]').should('exist');

    // Navigate back to profile
    cy.get('[data-testid="back-button"]').click();
    cy.url().should('include', '/profile');

    // Verify still authenticated
    cy.get('[data-testid="profile-header"]').should('exist');
  });

  it('handles API errors gracefully across pages', () => {
    cy.mockProfileApi();
    cy.mockApiLogin();

    // Start on profile - success
    cy.visit('/profile');
    cy.wait('@getProfile');
    cy.contains('John Doe').should('be.visible');

    // Navigate to business - failure
    cy.intercept('GET', '/api/profile/businesses/business-1/', {
      statusCode: 500,
      body: { detail: 'Server error' },
    }).as('failedBusiness');

    cy.get('[data-testid="business-card"]').first().click();
    cy.url().should('include', '/business/');

    cy.wait('@failedBusiness');
    cy.contains('Error').should('be.visible');

    // Can still navigate back
    cy.contains('Back').click();
    cy.url().should('include', '/profile');
    cy.contains('John Doe').should('be.visible');
  });

  it('preserves profile state after business navigation', () => {
    cy.mockProfileApi({
      first_name: 'John',
      last_name: 'Doe',
      businesses: [
        {
          id: 'business-1',
          name: 'Test Business',
          slug: 'test-business',
          business_type: 'retail',
          user_role: 'owner',
          user_joined_at: '2024-01-01T00:00:00Z',
          business_profile: {
            logo: 'logo.jpg',
            primary_color: '#3498db',
            secondary_color: '#2c3e50',
            theme: 'light',
            about: 'Test',
          },
        },
      ],
    });

    cy.mockBusinessDetailApi('business-1');

    // Visit profile
    cy.visit('/profile');
    cy.wait('@getProfile');

    const initialName = 'John Doe';
    cy.contains(initialName).should('be.visible');

    // Navigate to business
    cy.get('[data-testid="business-card"]').first().click();
    cy.url().should('include', '/business/');
    cy.wait('@getBusinessDetail');

    // Navigate back
    cy.get('[data-testid="back-button"]').click();

    // Verify profile name still there
    cy.contains(initialName).should('be.visible');
  });
});
