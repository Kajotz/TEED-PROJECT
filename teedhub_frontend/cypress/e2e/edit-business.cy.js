// cypress/e2e/edit-business.cy.js
/**
 * E2E Tests for Edit Business Page
 */

describe('Edit Business Page', () => {
  beforeEach(() => {
    cy.mockApiLogin();
    cy.mockBusinessDetailApi('business-1');
    cy.visit('/business/business-1/edit');
    cy.wait('@getBusinessDetail');
  });

  it('displays edit form header', () => {
    cy.contains('Edit Business Profile').should('be.visible');
  });

  it('displays all form sections', () => {
    cy.contains('Basic Information').should('be.visible');
    cy.contains('Branding').should('be.visible');
    cy.contains('Contact Information').should('be.visible');
    cy.contains('Social Media').should('be.visible');
  });

  it('loads business data into form', () => {
    cy.get('input[name="name"]').should('have.value', 'Test Business');
    cy.get('input[name="slug"]').should('have.value', 'test-business');
  });

  it('loads business profile data', () => {
    cy.get('input[name="email"]').should('have.value', 'business@test.com');
    cy.get('input[name="phone"]').should('have.value', '+1234567890');
  });

  it('loads social media data', () => {
    cy.get('input[name="instagram"]').should('have.value', '@testbusiness');
    cy.get('input[name="facebook"]').should('have.value', 'testbusiness');
  });

  it('displays cancel button', () => {
    cy.get('[data-testid="cancel-button"]').should('be.visible');
  });

  it('displays save button', () => {
    cy.get('[data-testid="save-button"]').should('be.visible');
  });

  it('navigates back on cancel', () => {
    cy.get('[data-testid="cancel-button"]').click();
    cy.url().should('include', '/business/business-1');
  });

  it('updates business name', () => {
    cy.intercept('POST', '/api/businesses/business-1/profile/', {
      statusCode: 200,
      body: { success: true },
    }).as('updateBusiness');

    cy.get('input[name="name"]').clear().type('Updated Business');
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@updateBusiness').then((interception) => {
      expect(interception.request.body.name).to.equal('Updated Business');
    });
  });

  it('validates required fields', () => {
    cy.get('input[name="name"]').clear();
    cy.get('[data-testid="save-button"]').click();

    cy.contains('required').should('be.visible');
  });

  it('validates email format', () => {
    cy.get('input[name="email"]').clear().type('invalid-email');
    cy.get('[data-testid="save-button"]').click();

    cy.contains('valid email').should('be.visible');
  });

  it('validates website format', () => {
    cy.get('input[name="website"]').clear().type('not-a-url');
    cy.get('[data-testid="save-button"]').click();

    cy.contains('http').should('be.visible');
  });

  it('limits about text to 500 characters', () => {
    const longText = 'a'.repeat(600);
    cy.get('textarea[name="about"]').type(longText);
    cy.get('textarea[name="about"]').invoke('val').then((val) => {
      expect(val.length).to.be.lte(500);
    });
  });

  it('displays character count for about field', () => {
    cy.get('textarea[name="about"]').type('Test about text');
    cy.contains(/\d+\/500/).should('be.visible');
  });

  it('allows color selection', () => {
    cy.get('input[name="primary_color"]').invoke('val').then((color) => {
      expect(color).to.match(/^#[0-9A-F]{6}$/i);
    });
  });

  it('shows loading state during save', () => {
    cy.intercept('POST', '/api/businesses/business-1/profile/', (req) => {
      req.reply((res) => {
        res.delay(1000);
      });
    }).as('slowSave');

    cy.get('input[name="name"]').clear().type('Updated');
    cy.get('[data-testid="save-button"]').click();

    cy.get('[data-testid="save-button"]').should('contain', 'Saving');
    cy.get('[data-testid="save-button"]').should('be.disabled');

    cy.wait('@slowSave');
    cy.get('[data-testid="save-button"]').should('not.be.disabled');
  });

  it('shows success message after save', () => {
    cy.intercept('POST', '/api/businesses/business-1/profile/', {
      statusCode: 200,
      body: { success: true },
    }).as('saveBusiness');

    cy.get('input[name="name"]').clear().type('Updated');
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@saveBusiness');
    cy.contains('successfully').should('be.visible');
  });

  it('navigates back to detail page after save', () => {
    cy.intercept('POST', '/api/businesses/business-1/profile/', {
      statusCode: 200,
      body: { success: true },
    }).as('saveBusiness');

    cy.get('input[name="name"]').clear().type('Updated');
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@saveBusiness');
    cy.url().should('include', '/business/business-1').and('not.include', '/edit');
  });

  it('shows error message on save failure', () => {
    cy.intercept('POST', '/api/businesses/business-1/profile/', {
      statusCode: 500,
      body: { detail: 'Server error' },
    }).as('failedSave');

    cy.get('input[name="name"]').clear().type('Updated');
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@failedSave');
    cy.contains('Error').should('be.visible');
  });

  it('does not show edit page for non-owners', () => {
    cy.mockApiLogin();
    cy.mockBusinessDetailApi('business-1', {
      user_role: 'staff',
    });

    cy.visit('/business/business-1/edit');
    cy.wait('@getBusinessDetail');

    cy.contains('Access Denied').should('be.visible');
  });

  it('allows editing all contact fields', () => {
    const newData = {
      email: 'newemail@test.com',
      phone: '+9876543210',
      website: 'https://newwebsite.com',
      address: '456 Oak St',
    };

    Object.entries(newData).forEach(([field, value]) => {
      cy.get(`input[name="${field}"]`).clear().type(value);
    });

    cy.get('input[name="email"]').should('have.value', newData.email);
    cy.get('input[name="phone"]').should('have.value', newData.phone);
    cy.get('input[name="website"]').should('have.value', newData.website);
    cy.get('input[name="address"]').should('have.value', newData.address);
  });

  it('allows editing all social media fields', () => {
    const newSocial = {
      instagram: '@newinstagram',
      facebook: 'newfacebook',
      tiktok: '@newtiktok',
      whatsapp: '+9876543210',
    };

    Object.entries(newSocial).forEach(([field, value]) => {
      cy.get(`input[name="${field}"]`).clear().type(value);
    });

    Object.entries(newSocial).forEach(([field, value]) => {
      cy.get(`input[name="${field}"]`).should('have.value', value);
    });
  });

  it('shows loading spinner while loading', () => {
    cy.mockApiLogin();
    cy.intercept('GET', '/api/profile/businesses/business-1/', (req) => {
      req.reply((res) => {
        res.delay(1000);
      });
    }).as('slowLoad');

    cy.visit('/business/business-1/edit');
    cy.get('[data-testid="loading-spinner"]').should('exist');
    cy.wait('@slowLoad');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });
});
