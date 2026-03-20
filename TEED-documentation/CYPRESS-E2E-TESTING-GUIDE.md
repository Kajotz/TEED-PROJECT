# E2E Testing Setup & Guide - Cypress

Complete guide for setting up and running E2E tests with Cypress for user profile and business profile synchronization.

## 📋 Prerequisites

- Node.js 16+ and npm installed
- Django backend running on `http://localhost:8000`
- React frontend running on `http://localhost:5173`

## 🚀 Installation

### 1. Install Cypress

```bash
cd teedhub_frontend
npm install --save-dev cypress
```

### 2. Install Required Packages

```bash
npm install --save-dev @cypress/schematic cypress-testing-library
```

### 3. Verify Configuration

Check that `cypress.config.js` exists in the root of `teedhub_frontend/`:

```bash
ls cypress.config.js
```

## 📂 File Structure

```
teedhub_frontend/
├── cypress/
│   ├── e2e/
│   │   ├── user-profile.cy.js          # Profile page tests
│   │   ├── business-detail.cy.js       # Business detail tests
│   │   ├── edit-business.cy.js         # Edit business tests
│   │   └── complete-flow.cy.js         # Complete navigation flow
│   └── support/
│       └── e2e.js                      # Custom commands & setup
├── cypress.config.js                   # Cypress configuration
├── package.json                        # Project dependencies
└── vite.config.js                      # Vite configuration
```

## 🎯 Running Tests

### Open Cypress Test Runner (Interactive Mode)

```bash
cd teedhub_frontend
npm run cypress:open
```

This opens the Cypress UI where you can:
- Select individual test files to run
- Watch tests execute in real-time
- Debug failures interactively
- View video recordings of test runs

### Run All Tests Headlessly

```bash
npm run cypress:run
```

This runs all tests in headless mode and outputs results to the terminal.

### Run Specific Test File

```bash
npx cypress run --spec "cypress/e2e/user-profile.cy.js"
```

### Run Tests with Specific Browser

```bash
# Chrome
npx cypress run --browser chrome

# Firefox
npx cypress run --browser firefox

# Edge
npx cypress run --browser edge
```

### Run Tests with Video Recording

```bash
# Videos are recorded by default in headless mode
npx cypress run --video
```

Videos are saved to: `cypress/videos/`

### Run Tests with Screenshots on Failure

```bash
# Screenshots are captured automatically on failure
npx cypress run --screenshot
```

Screenshots are saved to: `cypress/screenshots/`

## 📝 Available Test Files

### 1. User Profile Tests (`user-profile.cy.js`)
Tests for the profile page functionality:
- ✓ Display user profile header and info
- ✓ Display user businesses
- ✓ Edit profile functionality
- ✓ Navigation to business detail
- ✓ Error handling
- ✓ Loading states
- ✓ Empty states

**Run:** `npx cypress run --spec "cypress/e2e/user-profile.cy.js"`

### 2. Business Detail Tests (`business-detail.cy.js`)
Tests for the business detail page:
- ✓ Display business information
- ✓ Display profile data
- ✓ Edit button functionality
- ✓ Back navigation
- ✓ Access control (403/404 errors)
- ✓ Role-based UI

**Run:** `npx cypress run --spec "cypress/e2e/business-detail.cy.js"`

### 3. Edit Business Tests (`edit-business.cy.js`)
Tests for the edit business form:
- ✓ Load business data into form
- ✓ Form validation
- ✓ Update data
- ✓ Success/error messages
- ✓ Navigation after save
- ✓ All form sections

**Run:** `npx cypress run --spec "cypress/e2e/edit-business.cy.js"`

### 4. Complete Flow Tests (`complete-flow.cy.js`)
Integration tests for full user journey:
- ✓ Profile → Detail → Edit → Save → Back flow
- ✓ Data synchronization across pages
- ✓ Multiple business handling
- ✓ Authentication persistence
- ✓ Error recovery

**Run:** `npx cypress run --spec "cypress/e2e/complete-flow.cy.js"`

## 🔧 Custom Commands

Available custom commands in `cypress/support/e2e.js`:

### Authentication Commands

```javascript
// Mock login
cy.mockApiLogin();

// Mock profile API
cy.mockProfileApi({
  first_name: 'John',
  last_name: 'Doe',
  businesses: [...]
});

// Mock business list
cy.mockBusinessListApi([...]);

// Mock business detail
cy.mockBusinessDetailApi('business-id', {...});
```

### Usage Example

```javascript
describe('My Test', () => {
  beforeEach(() => {
    cy.mockApiLogin();
    cy.mockProfileApi();
    cy.visit('/profile');
    cy.wait('@getProfile');
  });

  it('displays user profile', () => {
    cy.contains('John Doe').should('be.visible');
  });
});
```

## 📊 Test Attributes

Components are instrumented with `data-testid` attributes for reliable selection:

```javascript
// Profile page
[data-testid="profile-header"]
[data-testid="business-card"]
[data-testid="edit-profile-button"]
[data-testid="edit-profile-modal"]

// Business detail page
[data-testid="back-button"]
[data-testid="edit-button"]
[data-testid="primary-color"]
[data-testid="status-badge"]

// Edit business page
[data-testid="save-button"]
[data-testid="cancel-button"]
[data-testid="loading-spinner"]
```

## 🔐 Authentication in Tests

All tests automatically handle authentication:

1. **Mock JWT Token:** Cypress mocks the JWT token in localStorage
2. **API Interception:** All API calls are intercepted and mocked
3. **No Real Backend Needed:** Tests don't require actual backend responses

## ⚙️ Environment Configuration

In `cypress.config.js`:

```javascript
env: {
  apiUrl: 'http://localhost:8000/api',
  testUserUsername: 'testuser',
  testUserPassword: 'testpass123',
}
```

Access in tests:

```javascript
Cypress.env('apiUrl')        // 'http://localhost:8000/api'
Cypress.env('testUserUsername') // 'testuser'
```

## 📈 Continuous Integration

Add to your CI pipeline (GitHub Actions example):

```yaml
- name: Run Cypress tests
  run: |
    npm install
    npm run cypress:run

- name: Upload videos
  if: failure()
  uses: actions/upload-artifact@v2
  with:
    name: cypress-videos
    path: cypress/videos/
```

## 🐛 Debugging

### View Test Output

```bash
# Verbose logging
npx cypress run --reporter spec

# JSON reporter
npx cypress run --reporter json --reporter-options specReporterOutputFile=results.json
```

### Debug Single Test

```bash
# Open single test in interactive mode
npm run cypress:open
# Then select the test file from the UI
```

### Print Debug Info

```javascript
cy.debug(); // Log current state
cy.log('Message'); // Print to console
cy.pause(); // Pause execution
```

### View API Calls

```javascript
cy.intercept('GET', '/api/profile/', (req) => {
  console.log('Request:', req);
  req.reply((res) => {
    console.log('Response:', res);
  });
});
```

## 📋 Test Checklist

Before pushing code:

- [ ] All tests pass locally: `npm run cypress:run`
- [ ] No console errors in browser
- [ ] Screenshots captured for failures
- [ ] Videos reviewed for failed tests
- [ ] Custom commands working properly
- [ ] API mocks returning expected data
- [ ] Test timeouts configured appropriately

## 🚀 Performance Considerations

### Test Execution Time

- Single test file: ~10-15 seconds
- All tests: ~60-90 seconds
- With video recording: add 5-10 seconds

### Optimize Tests

```javascript
// ✓ Good - Direct element selection
cy.get('[data-testid="button"]').click();

// ✗ Bad - Fragile selector
cy.get('div > div > button').click();

// ✓ Good - Specific API mock
cy.intercept('GET', '/api/profile/', {...});

// ✗ Bad - Broad mock
cy.intercept('GET', '**');
```

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API Reference](https://docs.cypress.io/api/table-of-contents)
- [Testing Best Practices](https://docs.cypress.io/guides/references/best-practices)

## 🔗 Related Documentation

- [Backend Integration Tests](../core/tests/test_integration.py)
- [Frontend Unit Tests](__tests__/integration.test.js)
- [Frontend Setup Guide](FRONTEND-STRUCTURE.md)
- [Complete Integration Guide](COMPLETE-INTEGRATION-GUIDE.md)

## 💡 Common Issues & Solutions

### Issue: Tests timeout waiting for API

**Solution:** Check API is running and mocks are configured correctly

```bash
# Verify backend is running
curl http://localhost:8000/api/profile/
```

### Issue: Element not found errors

**Solution:** Verify `data-testid` attributes exist in components

```javascript
// Add to components:
<button data-testid="my-button">Click me</button>
```

### Issue: Token/Authentication errors

**Solution:** Ensure mockApiLogin() is called in beforeEach

```javascript
beforeEach(() => {
  cy.mockApiLogin();
  cy.mockProfileApi();
});
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Cypress opens without errors: `npm run cypress:open`
- [ ] Can view test files in Cypress UI
- [ ] Can run single test successfully
- [ ] Can run all tests successfully
- [ ] Video recording works
- [ ] Screenshots on failure works
- [ ] Custom commands available (cy.mockApiLogin(), etc.)
- [ ] API mocks working correctly
- [ ] Tests pass consistently

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Use ✅
