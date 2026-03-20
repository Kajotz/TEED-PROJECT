# Frontend Structure & Implementation Guide

## 📁 Project Structure

```
teedhub_frontend/src/
├── api/                        # API Service Layer
│   ├── userService.js         # User profile API calls
│   └── businessService.js     # Business API calls
├── hooks/                      # Custom React Hooks
│   ├── useUserProfile.js      # Profile fetching & updating
│   └── useBusiness.js         # Business fetching & actions
├── components/                 # Reusable Components
│   ├── Profile/
│   │   ├── ProfileHeader.jsx  # User header display
│   │   └── EditProfileModal.jsx # Edit user profile
│   └── Business/
│       ├── BusinessCard.jsx   # Single business card
│       ├── BusinessList.jsx   # Grid of business cards
│       └── BusinessDetailView.jsx # Detailed business view
├── pages/                      # Page Components
│   ├── UserProfilePage.jsx    # Main profile page
│   └── BusinessDetailPage.jsx # Business detail page
├── routes/                     # Routing Configuration
│   └── router.jsx             # React Router setup
├── styles/                     # CSS Styles
│   ├── BusinessCard.css
│   ├── BusinessList.css
│   ├── BusinessDetailView.css
│   ├── ProfileHeader.css
│   ├── EditProfileModal.css
│   ├── ProfilePage.css
│   └── BusinessDetailPage.css
└── utils/                      # Utilities
    └── constants.js           # API endpoints, constants, messages
```

---

## 🎯 Key Components Overview

### **1. API Services Layer** (`api/`)

#### `userService.js`
- `getProfile()` - Fetch user profile with all businesses
- `updateProfile(data)` - Update user first/last name
- `getBusinessesByRole()` - Get businesses organized by role

#### `businessService.js`
- `getBusinessDetail(businessId)` - Fetch business details
- `activateBusiness(businessId)` - Set as active business
- `updateBusinessProfile(businessId, data)` - Update business info

---

### **2. Custom Hooks** (`hooks/`)

#### `useUserProfile.js`
```javascript
// Fetch user profile
const { profile, businesses, ownedBusinesses, loading, error, refetch } = useUserProfile();

// Update user profile
const { updateProfile, loading, error, success } = useUpdateProfile();

// Get businesses by role
const { businessesByRole, loading, error, refetch } = useBusinessesByRole();
```

#### `useBusiness.js`
```javascript
// Fetch business details
const { business, loading, error, refetch } = useBusiness(businessId);

// Activate business
const { activateBusiness, loading, error, success } = useActivateBusiness();

// Update business profile
const { updateBusinessProfile, loading, error, success } = useUpdateBusinessProfile();
```

---

### **3. Components** (`components/`)

#### Profile Components

**ProfileHeader**
- Displays user avatar, name, email
- Shows join date and business count
- Edit profile button

**EditProfileModal**
- Modal form for updating first/last name
- Error handling and loading states
- Success callbacks

#### Business Components

**BusinessCard**
- Displays single business in card format
- Shows logo, name, type, role, status
- Click handler for navigation
- Responsive grid-ready

**BusinessList**
- Grid layout for multiple business cards
- Loading state with spinner
- Empty state handling
- Title and custom messages

**BusinessDetailView**
- Comprehensive business information display
- Profile branding section (colors, theme)
- Contact information (email, phone, website)
- Social media links
- Edit button for owners/admins
- Responsive layout

---

### **4. Pages** (`pages/`)

#### `UserProfilePage.jsx`
- Main profile page after login
- Displays user header with profile info
- Shows owned businesses section
- Shows member businesses section
- Edit profile modal
- Error handling and loading states
- Empty states with action buttons

#### `BusinessDetailPage.jsx`
- Displays detailed business information
- Navigation back to profile
- Floating action button to activate business
- Access control based on user role
- Edit button for authorized users

---

## 🔄 Data Flow

### **Profile Page Load Flow**

```
1. UserProfilePage mounts
   ↓
2. useUserProfile hook triggered
   ↓
3. userService.getProfile() called with JWT token
   ↓
4. Backend returns user + businesses
   ↓
5. State updated: profile, businesses, ownedBusinesses
   ↓
6. ProfileHeader renders with user info
   ↓
7. BusinessList renders owned businesses
   ↓
8. BusinessList renders member businesses
```

### **Business Detail Page Load Flow**

```
1. Navigate to /business/:businessId
   ↓
2. BusinessDetailPage mounts with businessId param
   ↓
3. useBusiness hook triggered with businessId
   ↓
4. businessService.getBusinessDetail(businessId) called
   ↓
5. Backend returns business details with profile
   ↓
6. BusinessDetailView renders full business info
```

### **Edit Profile Flow**

```
1. User clicks "Edit Profile" button
   ↓
2. EditProfileModal opens
   ↓
3. User updates first/last name
   ↓
4. User submits form
   ↓
5. useUpdateProfile hook calls updateProfile()
   ↓
6. userService.updateProfile() sends PUT request
   ↓
7. Backend updates user
   ↓
8. Modal closes
   ↓
9. Parent component refetches profile data
   ↓
10. UI updates with new profile info
```

---

## 🎨 Styling Approach

### **CSS File Organization**
- One CSS file per component
- Consistent BEM naming convention
- Mobile-first responsive design
- Shared utility classes

### **Responsive Breakpoints**
```css
Desktop:   1024px and up
Tablet:    768px - 1023px
Mobile:    480px - 767px
Small:     Below 480px
```

### **Color Scheme**
- Primary: #3498db (Blue)
- Success: #27ae60 (Green)
- Error: #e74c3c (Red)
- Text: #2c3e50 (Dark)
- Border: #ecf0f1 (Light Gray)

### **Role Badge Colors**
- Owner: #FF6B6B (Red)
- Admin: #4ECDC4 (Teal)
- Staff: #45B7D1 (Blue)
- Analyst: #96CEB4 (Green)

---

## 🚀 Usage Examples

### **Setup in App.jsx**

```jsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

### **Import Profile Page**

```jsx
import UserProfilePage from './pages/UserProfilePage';

// Use in route
<Route path="/profile" element={<UserProfilePage />} />
```

### **Import Business Detail Page**

```jsx
import BusinessDetailPage from './pages/BusinessDetailPage';

// Use in route
<Route path="/business/:businessId" element={<BusinessDetailPage />} />
```

### **Using Hooks in Custom Component**

```jsx
import { useUserProfile } from './hooks/useUserProfile';
import { useBusiness } from './hooks/useBusiness';

function MyComponent() {
  const { profile, businesses, loading, error } = useUserProfile();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Welcome, {profile?.first_name}</h1>
      <p>You have {businesses.length} businesses</p>
    </div>
  );
}
```

---

## 🔌 Environment Variables

Create `.env` file in project root:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

Or for production:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## 📱 Component Props Reference

### **ProfileHeader**
```jsx
<ProfileHeader
  user={{
    id, email, username, first_name, last_name, date_joined
  }}
  businessCount={5}
  onEdit={() => console.log('Edit clicked')}
/>
```

### **BusinessCard**
```jsx
<BusinessCard
  business={{
    id, name, slug, business_type, role, is_active, created_at, profile
  }}
  onClick={(businessId) => navigate(`/business/${businessId}`)}
  showRole={true}
/>
```

### **BusinessList**
```jsx
<BusinessList
  businesses={[...]}
  onBusinessClick={(businessId) => navigate(`/business/${businessId}`)}
  loading="success"
  title="My Businesses"
  emptyMessage="No businesses found"
/>
```

### **BusinessDetailView**
```jsx
<BusinessDetailView
  business={{
    id, name, slug, business_type, user_role, user_joined_at, 
    is_active, created_at, profile
  }}
  loading="success"
  error={null}
  canEdit={true}
  onEdit={() => navigate('/edit')}
  onBack={() => navigate(-1)}
/>
```

---

## 🧪 Testing

### **Testing Hooks**

```jsx
import { renderHook, act } from '@testing-library/react';
import { useUserProfile } from './hooks/useUserProfile';

test('should fetch user profile', async () => {
  const { result } = renderHook(() => useUserProfile());
  
  expect(result.current.loading).toBe('loading');
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  expect(result.current.profile).toBeDefined();
});
```

### **Testing Components**

```jsx
import { render, screen } from '@testing-library/react';
import BusinessCard from './components/Business/BusinessCard';

test('should render business card with name', () => {
  const business = {
    id: '123',
    name: 'Test Business',
    business_type: 'retail',
    role: 'owner',
    is_active: true,
    created_at: new Date().toISOString(),
    profile: {}
  };
  
  render(<BusinessCard business={business} onClick={() => {}} />);
  
  expect(screen.getByText('Test Business')).toBeInTheDocument();
});
```

---

## 🐛 Error Handling

### **API Errors**
- 401: Token expired → Redirect to login
- 403: No permission → Show error message
- 404: Resource not found → Show not found page
- 500: Server error → Show retry button

### **Network Errors**
- No response: Show network error message
- Timeout: Show timeout message with retry

### **Validation Errors**
- Required fields: Show inline errors
- Format errors: Show format-specific messages

---

## 📊 Performance Tips

1. **Use `select_related` in API** - Avoid N+1 queries
2. **Memoize heavy components** - Use `React.memo()`
3. **Lazy load images** - Use `loading="lazy"`
4. **Debounce search** - If adding search feature
5. **Cache API responses** - Consider Redux/Context
6. **Code split routes** - Use `React.lazy()`

---

## 🔐 Security Checklist

- ✅ JWT token stored in localStorage
- ✅ Token included in Authorization header
- ✅ Redirect to login on 401
- ✅ No sensitive data in localStorage
- ✅ HTTPS in production
- ✅ CORS configured properly
- ✅ Input validation on forms
- ✅ Sanitize rendered HTML

---

## 📚 Additional Features to Implement

1. **Edit Business Profile** - `/business/:id/edit`
2. **Create Business** - `/create-business`
3. **Manage Team Members** - Add/remove users
4. **Business Analytics** - Dashboard with stats
5. **Search & Filter** - Search businesses
6. **Pagination** - For users with many businesses
7. **Dark Mode** - Theme toggle
8. **Notifications** - Toast alerts

---

## 🎓 File-by-File Breakdown

### Entry Points
- `api/userService.js` - All user-related API calls
- `api/businessService.js` - All business-related API calls

### Hooks
- `hooks/useUserProfile.js` - User data management
- `hooks/useBusiness.js` - Business data management

### UI Components (Atomic)
- `components/Profile/ProfileHeader.jsx` - Profile display
- `components/Profile/EditProfileModal.jsx` - Profile editing
- `components/Business/BusinessCard.jsx` - Business display
- `components/Business/BusinessList.jsx` - Business grid
- `components/Business/BusinessDetailView.jsx` - Business details

### Pages (Feature)
- `pages/UserProfilePage.jsx` - Profile feature page
- `pages/BusinessDetailPage.jsx` - Business feature page

### Styling
- `styles/*.css` - Component styles
- BEM naming convention used throughout

### Configuration
- `utils/constants.js` - All constants, endpoints, messages
- `routes/router.jsx` - Route definitions

---

## ✅ Implementation Checklist

- [x] API services created
- [x] Custom hooks created
- [x] Components built (Profile, Business)
- [x] Pages created
- [x] Styling implemented
- [x] Constants and utilities defined
- [ ] Integration testing
- [ ] E2E testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation complete

---

## 📞 Quick Links

- Backend Integration Guide: See `COMPLETE-INTEGRATION-GUIDE.md`
- Database Schema: See `DATABASE-SCHEMA.md`
- API Endpoints: See `user-to-business-flow.md`
- Quick Reference: See `QUICK-REFERENCE-frontend.md`

**Status:** Frontend Structure Complete ✅ | Ready for Integration Testing 🚀
