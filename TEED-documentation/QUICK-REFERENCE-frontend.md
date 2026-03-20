# Quick Reference: User Profile to Business Navigation

## 3-Step Frontend Implementation

### Step 1: Import & Setup (in your Profile component)
```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';
const token = localStorage.getItem('access_token');

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};
```

### Step 2: Fetch User Profile with Businesses
```jsx
useEffect(() => {
  // Fetch user profile AND all their businesses in one call
  axios.get(`${API_BASE}/profile/`, axiosConfig)
    .then(res => {
      const { businesses, owned_businesses, ...userInfo } = res.data;
      setUserData(userInfo);
      setBusinesses(businesses);
      setOwnedBusinesses(owned_businesses);
    })
    .catch(err => console.error('Failed to fetch profile:', err));
}, []);
```

### Step 3: Navigate to Business
```jsx
const goToBusiness = (businessId) => {
  // Fetch business details
  axios.get(`${API_BASE}/profile/businesses/${businessId}/`, axiosConfig)
    .then(res => {
      // Set as active business (optional but recommended)
      return axios.post(
        `${API_BASE}/businesses/${businessId}/activate/`,
        {},
        axiosConfig
      ).then(() => res.data);
    })
    .then(businessData => {
      // Navigate to business dashboard
      navigate(`/business/${businessId}`, { state: { businessData } });
    })
    .catch(err => console.error('Failed to navigate:', err));
};
```

---

## API Response Structure

### GET /api/profile/
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
      "id": "uuid-here",
      "name": "Business Name",
      "slug": "business-slug",
      "business_type": "retail|service|online|creator",
      "role": "owner|admin|staff|analyst",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": {
        "logo": "image-url",
        "primary_color": "#FF5733",
        "secondary_color": "#33FF57",
        "theme": "default",
        "about": "Business description",
        "contact_email": "contact@business.com",
        "contact_phone": "+1234567890",
        "website": "https://business.com",
        "instagram": "business_ig",
        "facebook": "business_fb",
        "tiktok": "business_tik",
        "whatsapp": "+1234567890"
      }
    }
  ],
  "owned_businesses": [
    // Same structure as businesses array, but only ones user owns
  ]
}
```

### GET /api/profile/businesses/<business_id>/
```json
{
  "id": "uuid-here",
  "name": "Business Name",
  "slug": "business-slug",
  "business_type": "retail",
  "is_active": true,
  "created_at": "2025-01-10T10:00:00Z",
  "user_role": "owner",
  "user_joined_at": "2025-01-10T10:00:00Z",
  "profile": {
    // Same profile object as above
  }
}
```

---

## Component Examples

### BusinessCard Component
```jsx
export const BusinessCard = ({ business, onNavigate }) => {
  return (
    <div 
      className="business-card" 
      onClick={() => onNavigate(business.id)}
      style={{ borderColor: business.profile?.primary_color }}
    >
      {business.profile?.logo && (
        <img src={business.profile.logo} alt={business.name} />
      )}
      <h3>{business.name}</h3>
      <p className="type">{business.business_type}</p>
      <p className="role">Role: {business.role}</p>
      <p className="joined">
        Joined: {new Date(business.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};
```

### Profile Page Component
```jsx
export const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/profile/', config);
        const { businesses, owned_businesses, ...user } = res.data;
        
        setUserInfo(user);
        setBusinesses(businesses);
        setOwnedBusinesses(owned_businesses);
      } catch (err) {
        console.error('Profile fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleBusinessClick = async (businessId) => {
    try {
      // Activate business
      await axios.post(
        `http://localhost:8000/api/businesses/${businessId}/activate/`,
        {},
        config
      );

      // Navigate to business dashboard
      navigate(`/business/${businessId}`);
    } catch (err) {
      console.error('Navigation failed:', err);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Welcome, {userInfo?.first_name || userInfo?.username}!</h1>
        <p>{userInfo?.email}</p>
      </header>

      <section className="my-businesses">
        <h2>My Businesses ({ownedBusinesses.length})</h2>
        {ownedBusinesses.length > 0 ? (
          <div className="business-grid">
            {ownedBusinesses.map(biz => (
              <BusinessCard 
                key={biz.id} 
                business={biz}
                onNavigate={handleBusinessClick}
              />
            ))}
          </div>
        ) : (
          <p>No businesses owned yet. <a href="/create-business">Create one</a></p>
        )}
      </section>

      {businesses.length > ownedBusinesses.length && (
        <section className="member-businesses">
          <h2>I'm a Member of ({businesses.length - ownedBusinesses.length})</h2>
          <div className="business-grid">
            {businesses
              .filter(b => !ownedBusinesses.find(ob => ob.id === b.id))
              .map(biz => (
                <BusinessCard 
                  key={biz.id} 
                  business={biz}
                  onNavigate={handleBusinessClick}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

### Business Detail Page Component
```jsx
export const BusinessDetailPage = ({ businessId }) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/profile/businesses/${businessId}/`,
          config
        );
        setBusiness(res.data);
      } catch (err) {
        console.error('Business fetch failed:', err);
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  if (loading) return <div>Loading business...</div>;
  if (!business) return <div>Business not found</div>;

  const { profile, user_role, ...businessInfo } = business;
  const canEdit = ['owner', 'admin'].includes(user_role);

  return (
    <div className="business-detail">
      <header 
        className="business-header"
        style={{ backgroundColor: profile?.primary_color }}
      >
        {profile?.logo && (
          <img src={profile.logo} alt={businessInfo.name} className="logo" />
        )}
        <h1>{businessInfo.name}</h1>
        <p className="role">Your Role: <strong>{user_role}</strong></p>
      </header>

      <div className="business-info">
        <section className="basic-info">
          <h2>Business Information</h2>
          <p><strong>Type:</strong> {businessInfo.business_type}</p>
          <p><strong>Slug:</strong> {businessInfo.slug}</p>
          <p><strong>Created:</strong> {new Date(businessInfo.created_at).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {businessInfo.is_active ? 'Active' : 'Inactive'}</p>
        </section>

        <section className="profile-info">
          <h2>Profile & Branding</h2>
          {profile?.about && <p><strong>About:</strong> {profile.about}</p>}
          {profile?.contact_email && <p><strong>Email:</strong> {profile.contact_email}</p>}
          {profile?.contact_phone && <p><strong>Phone:</strong> {profile.contact_phone}</p>}
          {profile?.website && <p><strong>Website:</strong> <a href={profile.website}>{profile.website}</a></p>}
        </section>

        {(profile?.instagram || profile?.facebook || profile?.tiktok) && (
          <section className="social-links">
            <h2>Follow Us</h2>
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} target="_blank">
                Instagram: @{profile.instagram}
              </a>
            )}
            {profile?.facebook && (
              <a href={`https://facebook.com/${profile.facebook}`} target="_blank">
                Facebook: {profile.facebook}
              </a>
            )}
            {profile?.tiktok && (
              <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank">
                TikTok: @{profile.tiktok}
              </a>
            )}
          </section>
        )}
      </div>

      {canEdit && (
        <button 
          className="edit-button"
          onClick={() => navigate(`/business/${businessId}/edit`)}
        >
          Edit Business Profile
        </button>
      )}

      <button 
        className="back-button"
        onClick={() => navigate('/profile')}
      >
        Back to Profile
      </button>
    </div>
  );
};
```

---

## Error Handling

```jsx
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Forbidden - user doesn't have access
    alert('You do not have access to this business');
  } else if (error.response?.status === 404) {
    // Not found
    alert('Business not found');
  } else {
    console.error('API Error:', error.response?.data || error.message);
  }
};
```

---

## Routing Setup (React Router)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfilePage } from './pages/ProfilePage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';

export const AppRoutes = () => (
  <Routes>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/business/:businessId" element={<BusinessDetailPage />} />
    {/* More routes */}
  </Routes>
);
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired or missing. Refresh token or redirect to login |
| 403 Forbidden | User doesn't have access to that business. Check membership |
| 404 Not Found | Business doesn't exist or user isn't a member |
| Empty businesses array | User hasn't created or joined any businesses yet |
| Missing profile data | BusinessProfile might not be created for that business |

---

## State Management Pattern (Redux example)

```javascript
// userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get('http://localhost:8000/api/profile/', config);
    return res.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    info: null,
    businesses: [],
    ownedBusinesses: [],
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const { businesses, owned_businesses, ...userInfo } = action.payload;
        state.info = userInfo;
        state.businesses = businesses;
        state.ownedBusinesses = owned_businesses;
        state.loading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  }
});

export default userSlice.reducer;
```

---

## Summary

**3 Main Endpoints to Use:**

1. **`GET /api/profile/`** → Load profile page with all businesses
2. **`GET /api/profile/businesses/<id>/`** → Show business details
3. **`POST /api/businesses/<id>/activate/`** → Set as active business (optional)

**User Flow:**
```
Signup → Profile Page (all businesses) → Click Business → Business Detail Page
```
