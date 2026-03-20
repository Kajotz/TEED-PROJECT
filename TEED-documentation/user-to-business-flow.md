# User Profile to Business Profile Navigation Flow

## Overview
This document describes the complete flow for users to navigate from their profile page to their business profiles. The system supports users with different roles (owner, admin, staff, analyst) across multiple businesses.

---

## Architecture & Models

### 1. **User Model** (Django Auth User)
- Standard Django User model with email, username, first_name, last_name
- Related to businesses through:
  - `owned_businesses` (reverse relation from Business.owner)
  - `memberships` (reverse relation from Membership.user)

### 2. **Business Model** (`core/models/business.py`)
```
- id (UUID)
- name
- slug
- business_type (retail, service, online, creator)
- owner (ForeignKey to User)
- is_active
- created_at / updated_at
```

**Relations:**
- One-to-Many: User → Business (via `owned_businesses`)
- One-to-Many: Business → Membership (users who have access)
- One-to-One: Business → BusinessProfile

### 3. **Membership Model** (`core/models/membership.py`)
Connects users to businesses with roles:
```
- user (ForeignKey to User)
- business (ForeignKey to Business)
- role (owner, admin, staff, analyst)
- is_active (boolean)
- joined_at (timestamp)

Unique Constraint: One user can only have one membership per business
```

### 4. **BusinessProfile Model** (`core/models/business_profile.py`)
Contains branding and public information:
```
- business (OneToOneField to Business)
- logo, primary_color, secondary_color, theme
- about, contact_email, contact_phone, website
- Social links (instagram, facebook, tiktok, whatsapp)
```

### 5. **ActiveBusiness Model** (`core/models/active_business.py`)
Tracks which business is currently active for a user:
```
- user (OneToOneField to User)
- business (ForeignKey to Business)
- updated_at
```

---

## API Endpoints

### **1. Get User Profile with All Businesses**
```
GET /api/profile/
Headers: Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2025-01-15T10:00:00Z",
  "businesses": [
    {
      "id": "uuid-1",
      "name": "My Shop",
      "slug": "my-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": {
        "logo": "url-to-logo",
        "primary_color": "#FF5733",
        "secondary_color": "#33FF57",
        "theme": "default",
        "about": "My retail business",
        "contact_email": "shop@example.com",
        "contact_phone": "+1234567890",
        "website": "https://myshop.com",
        "instagram": "myshop_ig",
        "facebook": "myshop_fb",
        "tiktok": "myshop_tiktok",
        "whatsapp": "+1234567890"
      }
    }
  ],
  "owned_businesses": [
    {
      "id": "uuid-1",
      "name": "My Shop",
      "slug": "my-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": { ... }
    }
  ]
}
```

**Use Case:** 
- Fetch on profile page load
- Display all user's businesses in a list/grid
- Show owned vs member businesses separately

---

### **2. Get All Businesses (Organized by Role)**
```
GET /api/profile/businesses/
Headers: Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "owner": [
    {
      "id": "uuid-1",
      "name": "My Shop",
      "role": "owner",
      "profile": { ... }
    }
  ],
  "admin": [
    {
      "id": "uuid-2",
      "name": "Managed Business",
      "role": "admin",
      "profile": { ... }
    }
  ],
  "staff": [
    {
      "id": "uuid-3",
      "name": "Staff Business",
      "role": "staff",
      "profile": { ... }
    }
  ],
  "analyst": [ ... ]
}
```

**Use Case:**
- Filter and display businesses by user's role
- Show different action buttons based on role (edit, view-only, etc.)

---

### **3. Get Specific Business Details**
```
GET /api/profile/businesses/<business_id>/
Headers: Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "uuid-1",
  "name": "My Shop",
  "slug": "my-shop",
  "business_type": "retail",
  "is_active": true,
  "created_at": "2025-01-10T10:00:00Z",
  "user_role": "owner",
  "user_joined_at": "2025-01-10T10:00:00Z",
  "profile": {
    "logo": "url-to-logo",
    "primary_color": "#FF5733",
    "secondary_color": "#33FF57",
    "theme": "default",
    "about": "My retail business",
    "contact_email": "shop@example.com",
    "contact_phone": "+1234567890",
    "website": "https://myshop.com",
    "instagram": "myshop_ig",
    "facebook": "myshop_fb",
    "tiktok": "myshop_tiktok",
    "whatsapp": "+1234567890"
  }
}
```

**Use Case:**
- Click on a business card to view full details
- Navigate to business profile page with all information
- Set as active business before viewing dashboard

---

### **4. Update User Profile**
```
PUT /api/profile/
Headers: Authorization: Bearer <jwt_token>
Body: {
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "data": { ... }
}
```

**Note:** Email and username cannot be changed through this endpoint for security.

---

## Frontend Implementation Flow

### **Step 1: User Signs Up → Lands on Profile Page**
```
1. User completes signup flow
2. Redirects to /profile or /user/profile page
3. Frontend calls GET /api/profile/
4. Display user's info and business cards
```

### **Step 2: Display Business List on Profile Page**
```jsx
// Example React component
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    // Fetch user profile with all businesses
    fetch('/api/profile/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => console.error(err));
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.first_name}</h1>
      
      {/* User's Profile Info */}
      <div className="profile-section">
        <p>Email: {user.email}</p>
        <p>Joined: {new Date(user.date_joined).toLocaleDateString()}</p>
      </div>

      {/* Owned Businesses */}
      <div className="businesses-section">
        <h2>My Businesses</h2>
        <div className="business-grid">
          {user.owned_businesses.map(biz => (
            <BusinessCard 
              key={biz.id} 
              business={biz} 
              onNavigate={handleBusinessClick}
            />
          ))}
        </div>
      </div>

      {/* Member Businesses (if any) */}
      {user.businesses.length > user.owned_businesses.length && (
        <div className="member-businesses-section">
          <h2>Businesses I'm Part Of</h2>
          <div className="business-grid">
            {user.businesses
              .filter(b => !user.owned_businesses.find(ob => ob.id === b.id))
              .map(biz => (
                <BusinessCard 
                  key={biz.id} 
                  business={biz} 
                  onNavigate={handleBusinessClick}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Step 3: Navigate to Business Profile**
```jsx
// When user clicks on a business card
const handleBusinessClick = (businessId) => {
  // Option 1: Fetch detailed business info then navigate
  fetch(`/api/profile/businesses/${businessId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    // Set as active business
    fetch(`/api/businesses/${businessId}/activate/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      // Navigate to business profile/dashboard
      navigate(`/business/${businessId}/dashboard`);
    });
  });
};
```

### **Step 4: Business Profile Page**
```jsx
const BusinessProfilePage = ({ businessId }) => {
  const [business, setBusiness] = useState(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetch(`/api/profile/businesses/${businessId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setBusiness(data))
    .catch(err => console.error(err));
  }, [businessId]);

  if (!business) return <div>Loading...</div>;

  return (
    <div>
      <h1>{business.name}</h1>
      
      {/* Business Profile */}
      <div className="profile-header">
        {business.profile.logo && (
          <img src={business.profile.logo} alt={business.name} />
        )}
        <h2 className="business-name">{business.name}</h2>
        <p className="user-role">Your Role: {business.user_role}</p>
      </div>

      {/* Branding */}
      <div className="branding-section">
        <p>Type: {business.business_type}</p>
        <p>Primary Color: {business.profile.primary_color}</p>
        <p>About: {business.profile.about}</p>
      </div>

      {/* Contact Info */}
      <div className="contact-section">
        <p>Email: {business.profile.contact_email}</p>
        <p>Phone: {business.profile.contact_phone}</p>
        <p>Website: {business.profile.website}</p>
      </div>

      {/* Social Links */}
      <div className="social-section">
        {business.profile.instagram && (
          <a href={`https://instagram.com/${business.profile.instagram}`}>
            Instagram
          </a>
        )}
        {business.profile.facebook && (
          <a href={`https://facebook.com/${business.profile.facebook}`}>
            Facebook
          </a>
        )}
        {/* More social links */}
      </div>

      {/* Show Edit Button only for Owner/Admin */}
      {['owner', 'admin'].includes(business.user_role) && (
        <button onClick={() => navigate(`/business/${businessId}/edit`)}>
          Edit Profile
        </button>
      )}
    </div>
  );
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Signup                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   /profile/      │
                    │  GET user info   │
                    └────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │ User has:       │
                    │ - owned_business│
                    │ - memberships   │
                    └────────┬────────┘
                             │
            ┌────────────────┼─────────────────┐
            │                │                  │
            ▼                ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   My Shops   │  │  Managed Co. │  │ Staff Role   │
    │   (owner)    │  │   (admin)    │  │   (staff)    │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           └─────────┬───────┴─────────┬───────┘
                     │                 │
              Click on business card   │
                     │                 │
             ┌───────▼───────┐         │
             │/profile/busi- │         │
             │nesses/ID/     │         │
             └───────┬───────┘         │
                     │                 │
        ┌────────────▼────────────┐    │
        │ Business Profile:       │◄───┘
        │ - Name, slug, type      │
        │ - Owner, active status  │
        │ - Profile (branding)    │
        │ - User role & joined_at │
        └────────┬───────────────┘
                 │
         ┌───────▼────────┐
         │ Navigate to    │
         │ business       │
         │ dashboard/     │
         │ profile page   │
         └────────────────┘
```

---

## Security Considerations

1. **Access Control:**
   - All endpoints require authentication
   - Users can only see businesses they have access to
   - Membership.is_active check ensures inactive members can't access

2. **Role-Based Actions:**
   - Only owner/admin can edit business profile
   - Role information is included in response for frontend permission checks

3. **Email Protection:**
   - Email/username cannot be changed through PUT /api/profile/
   - Separate endpoint needed for password/email changes

---

## Summary of Changes

### New Files Created:
1. **`core/views/user_profile.py`** - Three new view classes:
   - `UserProfileView` - Get/update user profile
   - `UserBusinessesListView` - List all user's businesses organized by role
   - `BusinessDetailFromUserView` - Get specific business details

### Updated Files:
1. **`core/serializers.py`** - Added three new serializers:
   - `BusinessProfileSerializer`
   - `BusinessListSerializer`
   - `UserProfileSerializer`

2. **`core/urls.py`** - Added three new URL patterns:
   - `/api/profile/` - User profile endpoint
   - `/api/profile/businesses/` - List all user's businesses
   - `/api/profile/businesses/<business_id>/` - Specific business detail

---

## Testing the Flow

```bash
# 1. Get user profile
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/profile/

# 2. Get all businesses by role
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/profile/businesses/

# 3. Get specific business
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/profile/businesses/<business_id>/

# 4. Update profile
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John", "last_name": "Doe"}' \
  http://localhost:8000/api/profile/
```

---

## Next Steps

1. **Frontend Implementation:**
   - Create ProfilePage component
   - Create BusinessCard component
   - Implement navigation logic

2. **Additional Features:**
   - Business profile edit page
   - Add/remove members from business
   - Change member roles
   - Deactivate/delete businesses

3. **Enhancements:**
   - Pagination for businesses if user has many
   - Search/filter businesses
   - Business analytics/stats
   - Team management interface
