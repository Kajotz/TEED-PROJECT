# Frontend Integration Guide - TEED Hub

## Components Overview

### 1. PersonalInfo Component
**Location**: `src/components/PersonalInfo.jsx`

**Purpose**: Display and manage user's personal information

**Props**: None (uses context for API calls)

**State Management**:
- `profile`: Current user profile data
- `loading`: Loading state
- `error`: Error message
- `success`: Success message
- `editing`: Edit mode toggle
- `formData`: Form state with all profile fields
- `profileImage`: Image file object
- `previewImage`: Image preview URL

**Usage**:
```jsx
import PersonalInfo from '../components/PersonalInfo';

function ProfilePage() {
  return (
    <div>
      <PersonalInfo />
    </div>
  );
}
```

**Features**:
- ✅ View personal information
- ✅ Edit all fields
- ✅ Upload profile image with preview
- ✅ Select from 27 countries
- ✅ Character counter for bio (500 max)
- ✅ Save changes
- ✅ Error/success messaging
- ✅ Auto-load on mount

**API Calls**:
- `GET /api/personal-info/get_personal_info/`
- `PATCH /api/personal-info/update_personal_info/`
- `POST /api/personal-info/upload_profile_image/`

**Styling**:
- Brand colors: Navy (#1F75FE), Orange (#f2a705)
- Dark mode supported
- Responsive grid layout
- Motion animations with Framer Motion

---

### 2. SocialAccountManager Component
**Location**: `src/components/SocialAccountManager.jsx`

**Purpose**: Manage business social media accounts across 15 platforms

**Props**:
- `businessId` (string, required): UUID of the business

**Usage**:
```jsx
import SocialAccountManager from '../components/SocialAccountManager';

function BusinessPage() {
  return (
    <div>
      <SocialAccountManager businessId="550e8400-e29b-41d4-a716-446655440000" />
    </div>
  );
}
```

**Features**:
- ✅ View connected social accounts
- ✅ Link new accounts (15 platforms)
- ✅ Display followers count
- ✅ Show connection status with badges
- ✅ Sync account data
- ✅ Disconnect accounts safely
- ✅ Platform filtering
- ✅ Error handling

**API Calls**:
- `GET /api/social-accounts/by_business/?business_id=...`
- `POST /api/social-accounts/` (create)
- `POST /api/social-accounts/{id}/sync/`
- `POST /api/social-accounts/{id}/disconnect/`
- `DELETE /api/social-accounts/{id}/`

**Supported Platforms** (15):
```javascript
Instagram, Facebook, TikTok, YouTube, Twitter/X,
LinkedIn, Pinterest, Snapchat, WhatsApp, Telegram,
Discord, Twitch, Reddit, Tumblr, Threads
```

**Styling**:
- Platform-specific colors
- Emoji icons for each platform
- Status badges (Connected, Error, Disconnected)
- Dark mode support
- Responsive grid

---

### 3. Profile Page
**Location**: `src/pages/Profile.jsx`

**Purpose**: Main user dashboard with tabbed interface

**Routes**: `/profile`

**Features**:
- ✅ Tabbed navigation (Personal Info, Security, Businesses)
- ✅ Personal information management
- ✅ Password change
- ✅ Account status display
- ✅ Business list with management
- ✅ Logout functionality

**State**:
- `user`: Current user data
- `businesses`: User's business profiles
- `activeTab`: Current active tab
- `loading`: Initial load state
- `error`: Error messages
- `message`: Success messages

**API Calls**:
- `GET /dj-rest-auth/user/` (get user profile)
- `GET /api/profile/businesses/` (get businesses)
- `POST /dj-rest-auth/password/change/` (change password)
- `POST /auth/logout/` (logout)

**Styling**:
- Navy (#1F75FE) and Orange (#f2a705) brand colors
- Gradient background
- Dark mode support
- Sticky header
- Responsive layout

---

## API Integration

### Authentication
All API calls include JWT token from localStorage:
```javascript
const token = localStorage.getItem("access_token");
const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};
```

### Base URL Configuration
```javascript
// Use environment variable in Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

**Environment File** (`.env`):
```
VITE_API_URL=http://localhost:8000
```

### Error Handling
Standard error handling pattern:
```javascript
try {
  const resp = await fetch(endpoint, options);
  
  if (resp.status === 401) {
    // Clear tokens and redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    return;
  }
  
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || "Request failed");
  }
  
  // Handle success
} catch (err) {
  console.error(err);
  setError(err.message);
}
```

---

## Component Integration Examples

### Example 1: Complete Profile Setup
```jsx
import React, { useState } from 'react';
import PersonalInfo from '../components/PersonalInfo';

function ProfileSetup() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#1F75FE] mb-8">
          Complete Your Profile
        </h1>
        
        {step === 1 && (
          <div>
            <PersonalInfo />
            <button 
              onClick={() => setStep(2)}
              className="mt-6 px-6 py-3 bg-[#1F75FE] text-white rounded-lg"
            >
              Continue to Businesses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSetup;
```

### Example 2: Business Dashboard with Social Accounts
```jsx
import React, { useState, useEffect } from 'react';
import SocialAccountManager from '../components/SocialAccountManager';

function BusinessDashboard({ businessId }) {
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    const token = localStorage.getItem("access_token");
    const resp = await fetch(
      `http://localhost:8000/api/businesses/${businessId}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await resp.json();
    setBusiness(data);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1F75FE]">
          {business?.name}
        </h1>
      </div>
      
      <SocialAccountManager businessId={businessId} />
    </div>
  );
}

export default BusinessDashboard;
```

### Example 3: User Settings Page
```jsx
import React, { useState } from 'react';
import PersonalInfo from '../components/PersonalInfo';
import { Lock, Key } from 'lucide-react';

function UserSettings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'profile' 
              ? 'border-b-2 border-[#1F75FE] text-[#1F75FE]'
              : 'text-gray-600'
          }`}
        >
          <Lock size={20} /> Personal Profile
        </button>
        
        <button
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-b-2 border-[#1F75FE] text-[#1F75FE]'
              : 'text-gray-600'
          }`}
        >
          <Key size={20} /> Security
        </button>
      </div>

      {activeTab === 'profile' && <PersonalInfo />}
      {activeTab === 'security' && <SecuritySettings />}
    </div>
  );
}

export default UserSettings;
```

---

## Styling & Brand Consistency

### Color Palette
```javascript
const BRAND_COLORS = {
  primary: '#1F75FE',      // Navy Blue
  secondary: '#f2a705',    // Orange
  success: '#10b981',      // Green
  error: '#ef4444',        // Red
  warning: '#f59e0b',      // Amber
};
```

### Common Tailwind Classes
```javascript
// Primary Button
"bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold rounded-lg"

// Secondary Button
"bg-[#f2a705] hover:bg-orange-600 text-white font-semibold rounded-lg"

// Input Focus
"focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent"

// Header
"text-3xl font-bold text-[#1F75FE]"

// Badge Success
"bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"

// Badge Error
"bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
```

### Dark Mode Support
```jsx
// Tailwind dark: prefix is used throughout
className="bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200"

// Example card
<div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-lg p-6">
  {/* Content */}
</div>
```

---

## Form Validation

### Client-side Validation Examples

**Email Validation**:
```javascript
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

**URL Validation**:
```javascript
const validateUrl = (url) => {
  return url.startsWith('http://') || url.startsWith('https://');
};
```

**Password Validation**:
```javascript
const validatePassword = (password) => {
  return password.length >= 8;
};
```

**Phone Validation**:
```javascript
const validatePhone = (phone) => {
  const regex = /^[\d\-\+\(\)\s]+$/;
  return regex.test(phone) && phone.length >= 10;
};
```

---

## Image Upload Handling

### Profile Image Upload
```javascript
const handleImageUpload = async (file) => {
  // Validate file
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    setError('Only JPEG, PNG, GIF, and WebP images are allowed');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError('Image size must be less than 5MB');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setPreviewImage(reader.result);
  };
  reader.readAsDataURL(file);

  // Upload to API
  const formData = new FormData();
  formData.append('profile_image', file);

  const token = localStorage.getItem('access_token');
  const resp = await fetch(`${API_BASE_URL}/api/personal-info/upload_profile_image/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (resp.ok) {
    setSuccess('Image uploaded successfully!');
  }
};
```

---

## State Management Patterns

### usePersonalInfo Hook (Custom)
```javascript
// hooks/usePersonalInfo.js
import { useState, useEffect } from 'react';

export const usePersonalInfo = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const resp = await fetch(`${API_BASE_URL}/api/personal-info/get_personal_info/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    // Implementation
  };

  return { profile, loading, error, updateProfile };
};
```

---

## Error Recovery

### Auto-logout on 401
```javascript
if (resp.status === 401) {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

### Retry Logic
```javascript
const retryFetch = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok) return resp;
      if (resp.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      return resp;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

---

## Performance Optimization

### Lazy Loading Components
```javascript
import { lazy, Suspense } from 'react';

const PersonalInfo = lazy(() => import('../components/PersonalInfo'));
const SocialAccountManager = lazy(() => import('../components/SocialAccountManager'));

function Profile() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PersonalInfo />
      <SocialAccountManager businessId={id} />
    </Suspense>
  );
}
```

### Debounce Search
```javascript
import { useEffect, useState } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## Testing Components

### Jest Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import PersonalInfo from '../components/PersonalInfo';

describe('PersonalInfo Component', () => {
  it('renders personal info form', () => {
    render(<PersonalInfo />);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    render(<PersonalInfo />);
    const input = screen.getByPlaceholderText('Your username');
    fireEvent.change(input, { target: { value: 'testuser' } });
    // Assert
  });
});
```

---

## Browser Compatibility

**Supported Browsers**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

**APIs Used**:
- Fetch API (Polyfill available)
- FileReader (for image upload)
- localStorage
- Fetch with FormData

---

## Accessibility Features

### ARIA Labels
```jsx
<input
  aria-label="Username"
  aria-describedby="username-help"
  type="text"
/>
<p id="username-help" className="text-xs text-gray-500">
  Username for display
</p>
```

### Keyboard Navigation
```jsx
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSubmit();
  }}
>
  Submit
</button>
```

### Semantic HTML
```jsx
// Good
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  <button type="submit">Submit</button>
</form>

// Bad
<div onClick={handleSubmit}>
  <div>Email</div>
  <input />
</div>
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API base URL set correctly
- [ ] Error boundaries implemented
- [ ] Loading states handled
- [ ] Image optimization done
- [ ] Dark mode tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit passed
- [ ] Performance optimized
- [ ] Error logging configured

---

**Last Updated**: 2024-01-15
**Frontend Version**: 1.0
**Status**: ✅ Production Ready
