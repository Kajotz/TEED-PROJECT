# Implementation Architecture Diagram

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             TEED PROJECT                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND (React/Vue)                              │  │
│  │  ┌──────────────────┐         ┌──────────────────┐                    │  │
│  │  │  Signup Page     │         │  Profile Page    │                    │  │
│  │  │  - Email/Pass    │         │  - User Info     │                    │  │
│  │  │  - OAuth         │────────▶│  - Business List │                    │  │
│  │  │  - Phone OTP     │         │  - Action BTN    │                    │  │
│  │  └──────────────────┘         └────────┬─────────┘                    │  │
│  │                                        │                              │  │
│  │                           Click Business Card                         │  │
│  │                                        │                              │  │
│  │                        ┌───────────────▼─────────────┐                │  │
│  │                        │  Business Profile Page     │                │  │
│  │                        │  - Full Business Info      │                │  │
│  │                        │  - Branding & Logo        │                │  │
│  │                        │  - Contact Info           │                │  │
│  │                        │  - Social Media Links     │                │  │
│  │                        └───────────────────────────┘                │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│           │                                                  ▲                │
│           │                                                  │                │
│           │  HTTP Requests                    HTTP Responses │                │
│           │  (with JWT Token)                                │                │
│           │                                                  │                │
│  ┌────────▼──────────────────────────────────────────────────┴──────────────┐ │
│  │                      DJANGO REST API                                      │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  URL ROUTING (core/urls.py)                                        │  │ │
│  │  ├────────────────────────────────────────────────────────────────────┤  │ │
│  │  │                                                                    │  │ │
│  │  │  GET  /api/profile/                                              │  │ │
│  │  │       └─▶ UserProfileView.get()                                 │  │ │
│  │  │                                                                    │  │ │
│  │  │  GET  /api/profile/businesses/                                   │  │ │
│  │  │       └─▶ UserBusinessesListView.get()                          │  │ │
│  │  │                                                                    │  │ │
│  │  │  GET  /api/profile/businesses/<uuid>/                            │  │ │
│  │  │       └─▶ BusinessDetailFromUserView.get()                      │  │ │
│  │  │                                                                    │  │ │
│  │  │  PUT  /api/profile/                                              │  │ │
│  │  │       └─▶ UserProfileView.put()                                 │  │ │
│  │  │                                                                    │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  VIEW LAYER (core/views/user_profile.py)                           │  │ │
│  │  ├────────────────────────────────────────────────────────────────────┤  │ │
│  │  │                                                                    │  │ │
│  │  │  class UserProfileView(APIView)                                  │  │ │
│  │  │  ├─ permission_classes = [IsAuthenticated]                       │  │ │
│  │  │  ├─ get() ───────────────────────────────────────────────────┐   │  │ │
│  │  │  │  1. Get current user                                     │   │  │ │
│  │  │  │  2. Serialize with UserProfileSerializer                │   │  │ │
│  │  │  │  3. Return user + businesses + owned_businesses         │   │  │ │
│  │  │  └───────────────────────────────────────────────────────────┘   │  │ │
│  │  │  └─ put() ──────────────────────────────────────────────────┐    │  │ │
│  │  │     1. Get current user                                     │    │  │ │
│  │  │     2. Update allowed fields (first_name, last_name)       │    │  │ │
│  │  │     3. Return updated profile                              │    │  │ │
│  │  │     └──────────────────────────────────────────────────────┘    │  │ │
│  │  │                                                                    │  │ │
│  │  │  class UserBusinessesListView(APIView)                           │  │ │
│  │  │  ├─ get() ─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │  1. Get all active memberships for user                   │ │  │ │
│  │  │  │  2. Organize by role (owner, admin, staff, analyst)      │ │  │ │
│  │  │  │  3. Serialize each group                                 │ │  │ │
│  │  │  │  4. Return dict with roles as keys                       │ │  │ │
│  │  │  └────────────────────────────────────────────────────────────┘ │  │ │
│  │  │                                                                    │  │ │
│  │  │  class BusinessDetailFromUserView(APIView)                       │  │ │
│  │  │  ├─ get(business_id) ──────────────────────────────────────────┐ │  │ │
│  │  │  │  1. Check user has access to business                     │ │  │ │
│  │  │  │  2. Get membership to find user's role                    │ │  │ │
│  │  │  │  3. Serialize business with profile                       │ │  │ │
│  │  │  │  4. Include user_role and user_joined_at                  │ │  │ │
│  │  │  │  5. Return full business details                          │ │  │ │
│  │  │  └────────────────────────────────────────────────────────────┘ │  │ │
│  │  │                                                                    │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  SERIALIZER LAYER (core/serializers.py)                            │  │ │
│  │  ├────────────────────────────────────────────────────────────────────┤  │ │
│  │  │                                                                    │  │ │
│  │  │  BusinessProfileSerializer                                       │  │ │
│  │  │  ├─ Fields: logo, colors, theme, about, contact, social         │  │ │
│  │  │  └─ Used by: BusinessListSerializer                             │  │ │
│  │  │                                                                    │  │ │
│  │  │  BusinessListSerializer                                          │  │ │
│  │  │  ├─ Fields: id, name, slug, type, profile, role, is_active     │  │ │
│  │  │  ├─ Method: get_role() ─ Gets user's role in this business      │  │ │
│  │  │  └─ Used by: UserProfileSerializer                              │  │ │
│  │  │                                                                    │  │ │
│  │  │  UserProfileSerializer                                           │  │ │
│  │  │  ├─ Fields: id, email, username, name, date_joined             │  │ │
│  │  │  ├─ Method: get_businesses() ─ All businesses + memberships     │  │ │
│  │  │  ├─ Method: get_owned_businesses() ─ Only owned businesses      │  │ │
│  │  │  └─ Returns: User info + nested business data                   │  │ │
│  │  │                                                                    │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  MODEL LAYER (core/models/)                                        │  │ │
│  │  ├────────────────────────────────────────────────────────────────────┤  │ │
│  │  │                                                                    │  │ │
│  │  │  User (Django Built-in)                                          │  │ │
│  │  │  ├─ Relationships:                                               │  │ │
│  │  │  │  ├─ owned_businesses (reverse ForeignKey)                    │  │ │
│  │  │  │  └─ memberships (reverse ForeignKey)                         │  │ │
│  │  │  └─ Query: user.owned_businesses.all()                          │  │ │
│  │  │          user.memberships.all()                                 │  │ │
│  │  │                                                                    │  │ │
│  │  │  Business (core/models/business.py)                              │  │ │
│  │  │  ├─ id (UUID), name, slug, type, owner, is_active              │  │ │
│  │  │  ├─ Relationships:                                               │  │ │
│  │  │  │  ├─ owner (ForeignKey to User)                              │  │ │
│  │  │  │  ├─ memberships (reverse ForeignKey to Membership)          │  │ │
│  │  │  │  └─ profile (reverse OneToOneField to BusinessProfile)      │  │ │
│  │  │  └─ Signals: Auto-create profile & owner membership            │  │ │
│  │  │                                                                    │  │ │
│  │  │  Membership (core/models/membership.py)                          │  │ │
│  │  │  ├─ user (FK), business (FK), role, is_active, joined_at       │  │ │
│  │  │  ├─ Role choices: owner, admin, staff, analyst                 │  │ │
│  │  │  └─ Constraint: unique(user, business)                         │  │ │
│  │  │                                                                    │  │ │
│  │  │  BusinessProfile (core/models/business_profile.py)              │  │ │
│  │  │  ├─ business (OneToOne), logo, colors, theme                   │  │ │
│  │  │  ├─ about, contact info, website                                │  │ │
│  │  │  └─ Social media links (instagram, facebook, tiktok, whatsapp) │  │ │
│  │  │                                                                    │  │ │
│  │  │  ActiveBusiness (core/models/active_business.py)                │  │ │
│  │  │  ├─ user (OneToOne), business (FK), updated_at                 │  │ │
│  │  │  └─ Tracks current active business for user                     │  │ │
│  │  │                                                                    │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  DATABASE LAYER                                                    │  │ │
│  │  ├────────────────────────────────────────────────────────────────────┤  │ │
│  │  │                                                                    │  │ │
│  │  │  ┌──────────────────────────────────────────────────────────┐    │  │ │
│  │  │  │ auth_user                                                │    │  │ │
│  │  │  │ ├─ id (PK)                                              │    │  │ │
│  │  │  │ ├─ email, username, password                            │    │  │ │
│  │  │  │ └─ first_name, last_name, date_joined                  │    │  │ │
│  │  │  └──────────────────────────────────────────────────────────┘    │  │ │
│  │  │                     ▲                    ▲                        │  │ │
│  │  │                     │                    │                        │  │ │
│  │  │  ┌──────────────────┴──┐        ┌────────┴─────────────┐         │  │ │
│  │  │  │ core_business      │        │ core_membership      │         │  │ │
│  │  │  │ ├─ id (UUID)       │        │ ├─ user_id (FK)     │         │  │ │
│  │  │  │ ├─ name, slug      │        │ ├─ business_id (FK) │         │  │ │
│  │  │  │ ├─ type, owner_id  │        │ ├─ role             │         │  │ │
│  │  │  │ └─ is_active       │        │ └─ is_active        │         │  │ │
│  │  │  └───────────┬────────┘        └────────┬────────────┘          │  │ │
│  │  │              │                          │                       │  │ │
│  │  │              └──────────────┬───────────┘                       │  │ │
│  │  │                             │                                  │  │ │
│  │  │         ┌───────────────────▼────────────────┐                │  │ │
│  │  │         │ core_businessprofile               │                │  │ │
│  │  │         │ ├─ business_id (OneToOne FK)      │                │  │ │
│  │  │         │ ├─ logo, colors, theme            │                │  │ │
│  │  │         │ ├─ about, contact_email           │                │  │ │
│  │  │         │ └─ website, social links          │                │  │ │
│  │  │         └────────────────────────────────────┘                │  │ │
│  │  │                                                                │  │ │
│  │  │         ┌────────────────────────────────┐                   │  │ │
│  │  │         │ core_activebusiness            │                   │  │ │
│  │  │         │ ├─ user_id (OneToOne FK)      │                   │  │ │
│  │  │         │ ├─ business_id (FK)           │                   │  │ │
│  │  │         │ └─ updated_at                 │                   │  │ │
│  │  │         └────────────────────────────────┘                   │  │ │
│  │  │                                                                │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### **Flow 1: Get User Profile**

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ GET /api/profile/
       │ Authorization: Bearer <token>
       │
       ▼
┌──────────────────────────────┐
│ URL Routing                  │
│ path("profile/", ...)        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ UserProfileView              │
│ permission_classes           │
│ [IsAuthenticated]            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 1. Get request.user          │
│ 2. Query owned_businesses    │
│ 3. Query memberships         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ UserProfileSerializer        │
│ ├─ user fields               │
│ ├─ get_businesses()          │
│ ├─ get_owned_businesses()    │
│ └─ nested serializers        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ JSON Response {              │
│   id, email, username,       │
│   businesses: [{...}],       │
│   owned_businesses: [{...}]  │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────┐
│   Frontend  │
│ Displays    │
│ Profile Page│
└─────────────┘
```

### **Flow 2: Navigate to Business**

```
┌─────────────┐
│   Frontend  │
│ User clicks │
│ business    │
└──────┬──────┘
       │
       │ GET /api/profile/businesses/<uuid>/
       │ Authorization: Bearer <token>
       │
       ▼
┌──────────────────────────────┐
│ BusinessDetailFromUserView   │
│ get(request, business_id)    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Query: Business.objects.get(      │
│      id=business_id,                 │
│      memberships__user=user,         │
│      memberships__is_active=True     │
│    )                                 │
│ 2. Get membership to find role       │
│ 3. Check access denied if needed     │
└──────┬────────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ BusinessListSerializer       │
│ + user_role                  │
│ + user_joined_at             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ JSON Response {              │
│   id, name, slug, type,      │
│   user_role: "owner",        │
│   user_joined_at: "...",     │
│   profile: {...}             │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────┐
│   Frontend  │
│ Navigates   │
│ to business │
│ detail page │
└─────────────┘
```

---

## Security & Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  REQUEST WITH JWT TOKEN                                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Permission Classes Check                                       │
│  [permissions.IsAuthenticated]                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
  ┌─────┐     ┌──────────┐
  │Valid│     │Invalid   │
  │Token│     │Token     │
  └──┬──┘     └────┬─────┘
     │             │
     ▼             ▼
 ┌──────┐      ┌────────┐
 │GET   │      │401 ERROR
 │User  │      │Unauthorized
 └──┬───┘      └────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│  FOR GET /api/profile/                                         │
│  - User is authenticated                                       │
│  - Return ONLY this user's data                                │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
        ┌──────┐
        │200 OK│
        └──────┘

┌────────────────────────────────────────────────────────────────┐
│  FOR GET /api/profile/businesses/<id>/                         │
│  - User is authenticated                                       │
│  - Check if user is member of business                         │
│  - Check if membership is active                               │
│  - Check if business is active                                 │
└────────────┬───────────────────────────────────────────────────┘
             │
      ┌──────┴──────┬──────────┐
      │             │          │
      ▼             ▼          ▼
  ┌─────┐    ┌────────┐    ┌─────┐
  │200  │    │403     │    │404  │
  │OK   │    │Forbidden   │Not Found
  └─────┘    │            │
             │Permission  │No access
             │Denied      │or doesn't
             │(inactive)  │exist
             └────────┘    └─────┘
```

---

## Database Query Optimization

```
┌─────────────────────────────────────────────────────┐
│ UNOPTIMIZED (N+1 Problem)                          │
└─────────────────────────────────────────────────────┘

businesses = Business.objects.filter(owner=user)

for business in businesses:
    print(business.profile.logo)  ◄─ Extra query!

Total Queries:
- 1 for businesses
- N for profiles


┌─────────────────────────────────────────────────────┐
│ OPTIMIZED (select_related)                         │
└─────────────────────────────────────────────────────┘

businesses = Business.objects.filter(
    owner=user
).select_related('profile')  ◄─ Joins profile

for business in businesses:
    print(business.profile.logo)  ◄─ No extra query!

Total Queries:
- 1 (with JOIN)
```

---

## Implementation Checklist

```
BACKEND IMPLEMENTATION
✅ models/membership.py          - Existing
✅ models/business.py             - Existing
✅ models/business_profile.py      - Existing
✅ views/user_profile.py           - CREATED
✅ serializers.py                  - UPDATED
✅ urls.py                         - UPDATED
✅ Syntax validation               - PASSED

FRONTEND IMPLEMENTATION (TODO)
⬜ Profile Page Component
⬜ Business Card Component
⬜ Business Detail Page Component
⬜ Error Handling
⬜ Loading States
⬜ Navigation Routing
⬜ State Management (Redux/Context)
⬜ Testing
⬜ Styling/CSS
⬜ Responsive Design

TESTING (TODO)
⬜ Manual cURL tests
⬜ Postman Collection
⬜ Unit Tests
⬜ Integration Tests
⬜ E2E Tests
```

---

## Signal Flow (Auto-creation)

```
┌──────────────────────────────────────────────┐
│ CREATE NEW BUSINESS                         │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ Business.objects.create(│
    │   name, slug, type,    │
    │   owner=user           │
    │ )                       │
    └────────────┬────────────┘
                 │
          (post_save signal triggers)
                 │
    ┌────────────▼────────────┐
    │ Create Profile Signal   │
    │                         │
    │ BusinessProfile.objects │
    │ .create(business=obj)   │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Create Membership Signal│
    │                         │
    │ Membership.objects      │
    │ .create(               │
    │   user=owner,          │
    │   business=obj,        │
    │   role='owner'         │
    │ )                      │
    └────────────┬────────────┘
                 │
                 ▼
    ┌──────────────────────┐
    │ RESULT:              │
    │ - Business created   │
    │ - Profile created    │
    │ - Owner membership   │
    │   created            │
    └──────────────────────┘
```

---

This completes the full system architecture! All components are in place and ready for frontend integration.
