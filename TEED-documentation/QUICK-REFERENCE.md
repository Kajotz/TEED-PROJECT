# Quick Reference - User Profile & Business Sync

## 🚀 Start Here

### 1. Start Backend
```bash
python manage.py runserver
# Runs on http://localhost:8000
```

### 2. Start Frontend
```bash
cd teedhub_frontend
npm run dev
# Runs on http://localhost:5173
```

### 3. Test Everything
```bash
# Backend tests
python manage.py test core.tests.test_integration

# Frontend tests
npm test -- --testPathPattern=integration

# E2E tests (interactive)
npm run cypress:open

# E2E tests (headless)
npm run cypress:run
```

---

## 🗂️ File Structure

```
TEED PROJECT/
├── core/
│   ├── tests/
│   │   └── test_integration.py          ← 25+ Backend Tests
│   ├── views/
│   │   └── user_profile.py              ← API Endpoints
│   ├── serializers.py                   ← Data Serialization
│   └── urls.py                          ← API Routes
│
└── teedhub_frontend/
    ├── src/
    │   ├── App.jsx                      ← Routes Updated ✅
    │   ├── pages/
    │   │   ├── UserProfilePage.jsx      ← Profile Page
    │   │   ├── BusinessDetailPage.jsx   ← Detail Page
    │   │   └── EditBusinessPage.jsx     ← Edit Form ✅ NEW
    │   ├── components/
    │   │   ├── Profile/                 ← Profile Components
    │   │   └── Business/                ← Business Components
    │   ├── hooks/
    │   │   ├── useUserProfile.js
    │   │   └── useBusiness.js
    │   ├── styles/
    │   │   └── EditBusinessPage.css     ← Edit Styles ✅ NEW
    │   ├── __tests__/
    │   │   └── integration.test.js      ← 50+ Frontend Tests ✅ NEW
    │   └── api/
    │       ├── userService.js
    │       └── businessService.js
    │
    ├── cypress/
    │   ├── e2e/
    │   │   ├── user-profile.cy.js       ← 15+ Tests ✅ NEW
    │   │   ├── business-detail.cy.js    ← 12+ Tests ✅ NEW
    │   │   ├── edit-business.cy.js      ← 16+ Tests ✅ NEW
    │   │   └── complete-flow.cy.js      ← 6+ Tests ✅ NEW
    │   ├── support/
    │   │   └── e2e.js                   ← Custom Commands ✅ NEW
    │   └── cypress.config.js            ← Config ✅ NEW
    │
    └── scripts/
        └── integration-test.js          ← 12 Integration Tests ✅ NEW

TEED-documentation/
├── FINAL-COMPLETION-SUMMARY.md         ← Executive Summary ✅ NEW
├── COMPLETE-SETUP-EXECUTION-GUIDE.md   ← Full Setup Guide ✅ NEW
├── CYPRESS-E2E-TESTING-GUIDE.md        ← E2E Guide ✅ NEW
├── COMPLETE-INTEGRATION-GUIDE.md       ← API Guide
└── FRONTEND-IMPLEMENTATION-CHECKLIST.md ← Implementation Guide
```

---

## 🔄 Navigation Flow

```
Profile Page        →  Business Detail    →  Edit Business
(see all            (view business        (update business
businesses)         information)          information)
     ↓                    ↓                    ↓
 - View profile    - Display profile     - Form sections:
 - Edit profile    - Show colors         • Basic Info
 - See owned &     - Show contact        • Branding
   member bus      - Show social         • Contact
 - Click business  - Edit button         • Social Media
                   - Back button         - Validate input
                                        - Save changes
                                        - Show success
                                        - Redirect to detail
```

---

## 📊 Test Commands

| Command | Purpose | Count |
|---------|---------|-------|
| `python manage.py test core.tests.test_integration` | Backend tests | 25+ |
| `npm test -- integration` | Frontend tests | 50+ |
| `npm run cypress:open` | E2E tests (interactive) | 49+ |
| `npm run cypress:run` | E2E tests (headless) | 49+ |
| `node scripts/integration-test.js` | Integration validation | 12 |
| **TOTAL** | All tests | **124+** |

---

## 🎯 Key Endpoints

### User Profile
- `GET /api/profile/` - Get user profile with businesses
- `PUT /api/profile/` - Update profile (first/last name)
- `GET /api/profile/businesses/` - Get all user businesses

### Business Detail
- `GET /api/profile/businesses/{id}/` - Get business with profile
- `POST /api/businesses/{id}/profile/` - Update business profile
- `POST /api/businesses/{id}/activate/` - Activate business

---

## 🔐 User Roles (Access Control)

| Role | Can View | Can Edit |
|------|----------|----------|
| Owner | ✅ All | ✅ Business |
| Admin | ✅ All | ✅ Business |
| Staff | ✅ All | ❌ Cannot |
| Member | ✅ All | ❌ Cannot |

---

## 📋 Features

✅ **Implemented**
- User profile display
- Business list (owned & member)
- Business detail view
- Business profile display
- Edit business form (CRUD)
- Navigation between pages
- Form validation
- Error handling
- Access control
- Data sync verification
- 124+ automated tests

⏳ **Future Enhancements**
- Create business from UI
- Delete business
- Team management
- Search & filter
- Advanced analytics

---

## 🧪 Test All 4 Stages

### Stage 1: Router Configuration ✅
```
Routes created in App.jsx:
/profile → UserProfilePage
/business/:id → BusinessDetailPage  
/business/:id/edit → EditBusinessPage
```

### Stage 2: Integration Testing ✅
```bash
# Run all tests
python manage.py test core.tests.test_integration
npm test -- integration
npm run cypress:run
```

### Stage 3: Edit Business Page ✅
```
Created EditBusinessPage.jsx with:
- 4 Form sections
- Full validation
- Success/error messaging
- Access control
```

### Stage 4: E2E Testing ✅
```bash
npm run cypress:open
# Then select test file:
# - user-profile.cy.js
# - business-detail.cy.js
# - edit-business.cy.js
# - complete-flow.cy.js
```

---

## 🆘 Troubleshooting

### Tests Failing?
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run cypress:run
```

### Backend not responding?
```bash
# Verify backend is running
curl http://localhost:8000/api/profile/
# Should return 401 Unauthorized (not connection error)
```

### Routes not working?
```bash
# Check App.jsx has these imports
import UserProfilePage from "./pages/UserProfilePage";
import BusinessDetailPage from "./pages/BusinessDetailPage";
import EditBusinessPage from "./pages/EditBusinessPage";

# Check routes are defined
<Route path="/profile" element={<UserProfilePage />} />
<Route path="/business/:businessId" element={<BusinessDetailPage />} />
<Route path="/business/:businessId/edit" element={<EditBusinessPage />} />
```

---

## 📱 Responsive Design

✅ Mobile (< 480px)
- Touch-friendly buttons
- Single column layout
- Large form inputs

✅ Tablet (480-1024px)
- Two column grid (optional)
- Medium spacing
- Optimized card size

✅ Desktop (> 1024px)
- Full layout
- Multi-column grid
- Compact spacing

---

## 📊 Data Sync Verification

Run this manual flow to verify sync:

1. **Navigate to profile**
   - See: User name + businesses

2. **Click business card**
   - See: Business detail + updated info

3. **Click edit button**
   - See: Form pre-filled with data

4. **Update about text**
   - Change: "Old" → "New"

5. **Click save**
   - Verify: Success message
   - Redirect: Back to detail

6. **Check updated data**
   - See: "New" about text displayed

7. **Back to profile**
   - Verify: Business shows updated data

✅ **Sync Complete!**

---

## 🎓 API Response Example

### GET /api/profile/
```json
{
  "id": "user-1",
  "username": "john",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@test.com",
  "businesses": [
    {
      "id": "biz-1",
      "name": "My Business",
      "user_role": "owner",
      "business_profile": {
        "logo": "url",
        "primary_color": "#3498db",
        "about": "Business description"
      }
    }
  ]
}
```

---

## 🔗 Documentation Links

| Document | Purpose |
|----------|---------|
| [FINAL-COMPLETION-SUMMARY.md](FINAL-COMPLETION-SUMMARY.md) | Executive summary |
| [COMPLETE-SETUP-EXECUTION-GUIDE.md](COMPLETE-SETUP-EXECUTION-GUIDE.md) | Full setup & execution |
| [CYPRESS-E2E-TESTING-GUIDE.md](CYPRESS-E2E-TESTING-GUIDE.md) | E2E testing guide |
| [COMPLETE-INTEGRATION-GUIDE.md](COMPLETE-INTEGRATION-GUIDE.md) | API integration guide |
| [FRONTEND-IMPLEMENTATION-CHECKLIST.md](FRONTEND-IMPLEMENTATION-CHECKLIST.md) | Implementation checklist |

---

## ✅ Verification Checklist

Before deploying:

- [ ] Backend running: `python manage.py runserver`
- [ ] Frontend running: `npm run dev`
- [ ] Backend tests pass: `python manage.py test core.tests.test_integration`
- [ ] Frontend tests pass: `npm test -- integration`
- [ ] E2E tests pass: `npm run cypress:run`
- [ ] Can navigate: Profile → Detail → Edit → Save
- [ ] Data syncs correctly
- [ ] Error handling works
- [ ] Access control enforced
- [ ] Responsive on mobile

---

## 🎉 Status: ALL COMPLETE ✅

**All 4 Stages Implemented & Tested**

1. ✅ Router Configuration
2. ✅ Integration Testing (124+ tests)
3. ✅ Edit Business Page (CRUD)
4. ✅ E2E Testing (Cypress)

**Ready for Production! 🚀**

---

**Quick Links:**
- 📊 [Summary](FINAL-COMPLETION-SUMMARY.md)
- 🚀 [Setup Guide](COMPLETE-SETUP-EXECUTION-GUIDE.md)
- 🧪 [Test Guide](CYPRESS-E2E-TESTING-GUIDE.md)
- 🔗 [Integration Guide](COMPLETE-INTEGRATION-GUIDE.md)

Last Updated: January 15, 2026
