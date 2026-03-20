# Complete Integration Guide: User Profile to Business Navigation

## 🎯 Executive Summary

A complete backend system has been implemented to enable users to navigate from their profile page to their business profiles. The system supports:

- ✅ Multiple businesses per user (owner/member roles)
- ✅ Role-based access control (owner, admin, staff, analyst)
- ✅ Rich business profiles with branding and contact info
- ✅ User profile management
- ✅ Business listing organized by role
- ✅ Detailed business information retrieval

**Status:** Backend Complete ✅ | Ready for Frontend Integration 🚀

---

## 📋 What's New

### Backend Components Added

#### 1. **Views** (`core/views/user_profile.py`)
```python
- UserProfileView           # Get/update user profile
- UserBusinessesListView    # List businesses by role
- BusinessDetailFromUserView # Get specific business details
```

#### 2. **Serializers** (`core/serializers.py`)
```python
- BusinessProfileSerializer   # Business branding/profile data
- BusinessListSerializer      # Business with user's role
- UserProfileSerializer       # User with all their businesses
```

#### 3. **URL Routes** (`core/urls.py`)
```python
GET  /api/profile/                           # User profile
GET  /api/profile/businesses/                # Businesses by role
GET  /api/profile/businesses/<business_id>/  # Specific business
PUT  /api/profile/                           # Update profile
```

---

## 🔗 Data Flow Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │         Signup/Login Flow                    │
    │  ┌──────────────────────────────────────┐   │
    │  │ User authenticates, gets JWT token  │   │
    │  └──────────────────────────────────────┘   │
    └────────────────┬─────────────────────────────┘
                     │
        ┌────────────▼────────────────┐
        │  GET /api/profile/          │
        │  (Returns user + businesses)│
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────────────────┐
        │      Display Profile Page               │
        │  - User info (email, name)              │
        │  - Owned businesses                    │
        │  - Joined businesses                    │
        └────────────┬─────────────────────────────┘
                     │
         User clicks business card
                     │
        ┌────────────▼──────────────────────────┐
        │ GET /api/profile/businesses/<id>/     │
        │ (Returns full business details)        │
        └────────────┬──────────────────────────┘
                     │
        ┌────────────▼──────────────────────────┐
        │ Display Business Profile/Dashboard    │
        │ - Full profile data                   │
        │ - Branding colors & logo             │
        │ - Contact info & social links        │
        └───────────────────────────────────────┘
```

---

## 📡 API Endpoint Details

### **1. GET /api/profile/**
**Purpose:** Fetch authenticated user's profile with all their businesses

**Request:**
```bash
GET /api/profile/
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2025-01-15T10:00:00Z",
  "businesses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Coffee Shop",
      "slug": "coffee-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": {
        "logo": "https://example.com/logo.png",
        "primary_color": "#8B4513",
        "secondary_color": "#D2B48C",
        "theme": "default",
        "about": "Best coffee in town",
        "contact_email": "hello@coffee.com",
        "contact_phone": "+1-555-0123",
        "website": "https://coffee.com",
        "instagram": "coffeeshop",
        "facebook": "coffeeshop",
        "tiktok": "coffeeshop",
        "whatsapp": "+1-555-0123"
      }
    }
  ],
  "owned_businesses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Coffee Shop",
      "slug": "coffee-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": { ... }
    }
  ]
}
```

**Use Case:** Load profile page with all available businesses

---

### **2. GET /api/profile/businesses/**
**Purpose:** List all businesses organized by user's role

**Request:**
```bash
GET /api/profile/businesses/
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "owner": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Coffee Shop",
      "role": "owner",
      "profile": { ... }
    }
  ],
  "admin": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "name": "Partner Bakery",
      "role": "admin",
      "profile": { ... }
    }
  ],
  "staff": [],
  "analyst": []
}
```

**Use Case:** Display businesses filtered by user's role

---

### **3. GET /api/profile/businesses/<business_id>/**
**Purpose:** Get detailed information for a specific business

**Request:**
```bash
GET /api/profile/businesses/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Coffee Shop",
  "slug": "coffee-shop",
  "business_type": "retail",
  "is_active": true,
  "created_at": "2025-01-10T10:00:00Z",
  "user_role": "owner",
  "user_joined_at": "2025-01-10T10:00:00Z",
  "profile": {
    "logo": "https://example.com/logo.png",
    "primary_color": "#8B4513",
    "secondary_color": "#D2B48C",
    "theme": "default",
    "about": "Best coffee in town",
    "contact_email": "hello@coffee.com",
    "contact_phone": "+1-555-0123",
    "website": "https://coffee.com",
    "instagram": "coffeeshop",
    "facebook": "coffeeshop",
    "tiktok": "coffeeshop",
    "whatsapp": "+1-555-0123"
  }
}
```

**Errors:**
- `404`: Business not found or user doesn't have access
- `401`: Unauthorized (invalid/missing token)

**Use Case:** Navigate to business profile with full details

---

### **4. PUT /api/profile/**
**Purpose:** Update user profile information

**Request:**
```bash
PUT /api/profile/
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "first_name": "Johnny",
  "last_name": "Doe"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "Johnny",
    "last_name": "Doe",
    "date_joined": "2025-01-15T10:00:00Z",
    "businesses": [ ... ],
    "owned_businesses": [ ... ]
  }
}
```

**Note:** Email and username cannot be changed via this endpoint

---

## 💻 Frontend Implementation Examples

### **React Hook for Profile Data**
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No authentication token');
      setLoading(false);
      return;
    }

    axios
      .get('/api/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setProfile(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading, error };
};
```

### **Profile Page Component**
```jsx
import { useUserProfile } from './hooks/useUserProfile';
import BusinessCard from './components/BusinessCard';

export const ProfilePage = () => {
  const { profile, loading, error } = useUserProfile();
  const navigate = useNavigate();

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>No profile data</div>;

  const handleBusinessClick = (businessId) => {
    // Navigate to business profile
    navigate(`/business/${businessId}`);
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Welcome, {profile.first_name || profile.username}!</h1>
        <p>{profile.email}</p>
      </header>

      <section className="my-businesses">
        <h2>My Businesses ({profile.owned_businesses.length})</h2>
        <div className="business-grid">
          {profile.owned_businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onClick={() => handleBusinessClick(biz.id)}
            />
          ))}
        </div>
      </section>

      {profile.businesses.length > profile.owned_businesses.length && (
        <section className="member-businesses">
          <h2>I'm a Member of</h2>
          <div className="business-grid">
            {profile.businesses
              .filter((b) => !profile.owned_businesses.find((ob) => ob.id === b.id))
              .map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  onClick={() => handleBusinessClick(biz.id)}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

### **Business Card Component**
```jsx
export const BusinessCard = ({ business, onClick }) => {
  return (
    <div
      className="business-card"
      onClick={onClick}
      style={{
        borderColor: business.profile?.primary_color || '#ccc',
        backgroundColor: business.profile?.primary_color + '10'
      }}
    >
      {business.profile?.logo && (
        <img
          src={business.profile.logo}
          alt={business.name}
          className="business-logo"
        />
      )}

      <div className="business-info">
        <h3>{business.name}</h3>
        <p className="business-type">{business.business_type}</p>
        <p className="business-role">Role: {business.role}</p>
        <p className="joined-date">
          Joined: {new Date(business.created_at).toLocaleDateString()}
        </p>
      </div>

      {business.profile?.about && (
        <p className="business-about">{business.profile.about}</p>
      )}
    </div>
  );
};
```

### **Business Detail Page Component**
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export const BusinessDetailPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios
      .get(`/api/profile/businesses/${businessId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setBusiness(res.data))
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <div>Loading...</div>;
  if (!business) return <div>Business not found</div>;

  const canEdit = ['owner', 'admin'].includes(business.user_role);

  return (
    <div className="business-detail">
      <header
        className="business-header"
        style={{ backgroundColor: business.profile?.primary_color }}
      >
        {business.profile?.logo && (
          <img src={business.profile.logo} alt={business.name} />
        )}
        <h1>{business.name}</h1>
        <p>Your Role: {business.user_role}</p>
      </header>

      <div className="business-content">
        <section>
          <h2>Business Information</h2>
          <p><strong>Type:</strong> {business.business_type}</p>
          <p><strong>Created:</strong> {new Date(business.created_at).toLocaleDateString()}</p>
        </section>

        {business.profile?.about && (
          <section>
            <h2>About</h2>
            <p>{business.profile.about}</p>
          </section>
        )}

        {business.profile?.contact_email && (
          <section>
            <h2>Contact</h2>
            <p>Email: {business.profile.contact_email}</p>
            {business.profile.contact_phone && (
              <p>Phone: {business.profile.contact_phone}</p>
            )}
          </section>
        )}

        {business.profile?.website && (
          <section>
            <p>
              <a href={business.profile.website} target="_blank">
                Visit Website
              </a>
            </p>
          </section>
        )}
      </div>

      {canEdit && (
        <button onClick={() => navigate(`/business/${businessId}/edit`)}>
          Edit Profile
        </button>
      )}

      <button onClick={() => navigate('/profile')}>Back to Profile</button>
    </div>
  );
};
```

---

## 🧪 Testing Checklist

### **Manual Testing with cURL**

```bash
# 1. Get authentication token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Save the access token from response

# 2. Get user profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/profile/

# 3. Get businesses by role
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/profile/businesses/

# 4. Get specific business (replace UUID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/profile/businesses/BUSINESS_UUID/

# 5. Update profile
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe"}' \
  http://localhost:8000/api/profile/
```

### **Postman Collection**

```json
{
  "info": {
    "name": "User Profile to Business",
    "description": "API endpoints for profile and business navigation"
  },
  "item": [
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/profile/",
        "header": {
          "Authorization": "Bearer {{token}}"
        }
      }
    },
    {
      "name": "Get Businesses",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/profile/businesses/",
        "header": {
          "Authorization": "Bearer {{token}}"
        }
      }
    }
  ]
}
```

### **Django Test Cases**

```python
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from core.models import Business, Membership
from rest_framework.test import APIClient

User = get_user_model()

class ProfileAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@test.com',
            username='testuser',
            password='pass123'
        )
        
        # Create business
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            business_type='retail',
            owner=self.user
        )
        
        self.client.force_authenticate(self.user)

    def test_get_profile(self):
        """Test getting user profile"""
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'test@test.com')
        self.assertEqual(len(response.data['businesses']), 1)

    def test_get_businesses(self):
        """Test listing businesses by role"""
        response = self.client.get('/api/profile/businesses/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('owner', response.data)
        self.assertEqual(len(response.data['owner']), 1)

    def test_get_business_detail(self):
        """Test getting specific business"""
        response = self.client.get(f'/api/profile/businesses/{self.business.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Test Business')
        self.assertEqual(response.data['user_role'], 'owner')

    def test_access_denied_for_non_member(self):
        """Test access denied for non-member"""
        other_user = User.objects.create_user(
            email='other@test.com',
            username='otheruser',
            password='pass123'
        )
        self.client.force_authenticate(other_user)
        
        response = self.client.get(f'/api/profile/businesses/{self.business.id}/')
        self.assertEqual(response.status_code, 404)
```

---

## 🚀 Deployment Checklist

- [ ] Run migrations: `python manage.py migrate`
- [ ] Test API endpoints locally
- [ ] Frontend integration started
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Navigation routing set up
- [ ] Test on staging environment
- [ ] Test on production

---

## 📚 Documentation Files Created

1. **user-to-business-flow.md** - Complete technical documentation
2. **QUICK-REFERENCE-frontend.md** - Frontend quick start guide
3. **DATABASE-SCHEMA.md** - Database relationships and queries
4. **IMPLEMENTATION-SUMMARY.md** - What was implemented
5. **This file** - Complete integration guide

---

## ❓ FAQ

**Q: Can a user have multiple businesses?**
A: Yes, unlimited. Check the `owned_businesses` field in the profile response.

**Q: How do I know my role in a business?**
A: The `role` field in each business shows: owner, admin, staff, or analyst.

**Q: Can I change my email through the profile endpoint?**
A: No, for security. Email changes require a separate verification flow.

**Q: What happens when I create a business?**
A: Automatically creates a BusinessProfile and Membership (owner role) via signals.

**Q: How can I add members to my business?**
A: Use the `/api/businesses/<id>/members/add/` endpoint (create this next).

**Q: Are inactive members included in the API responses?**
A: No, only active members (is_active=True) are returned.

---

## 🔗 Related Endpoints (Existing)

- `POST /api/businesses/` - Create business
- `POST /api/businesses/<id>/activate/` - Set as active business
- `POST /api/businesses/<id>/profile/` - Update business profile
- `POST /api/businesses/<id>/members/<uid>/` - Update member role

---

## 📞 Support & Next Steps

1. **Frontend teams**: Use QUICK-REFERENCE-frontend.md to get started
2. **Database questions**: Check DATABASE-SCHEMA.md
3. **API questions**: Refer to this guide or the full documentation
4. **Issues**: Test endpoints with cURL/Postman first

**Ready to integrate!** 🎉
