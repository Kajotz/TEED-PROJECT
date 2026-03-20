# Database Schema & Relationships

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      auth.User (Django)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id, email, username, first_name, last_name, ...         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
     ▲                          ▲                         ▲
     │ owner                    │ user (FK)              │ user (OneToOne)
     │ (one-to-many)            │ (many-to-many)         │
     │                          │                        │
     │                    ┌─────┴──────────┐             │
     │                    │                │             │
     │              ┌─────▼────────┐  ┌────▼──────────┐  │
     │              │  Membership  │  │ ActiveBusiness│  │
     │              ├──────────────┤  ├───────────────┤  │
     │              │ id (PK)      │  │ id (PK)       │  │
     │              │ user_id (FK) │  │ user_id (FK)  │  │
     │              │ business_id  │  │ business_id   │  │
     │              │   (FK)       │  │   (FK)        │  │
     │              │ role*        │  │ updated_at    │  │
     │              │ is_active    │  └───────────────┘  │
     │              │ joined_at    │                      │
     │              └─────┬────────┘                      │
     │                    │                              │
     │            business_id (FK)                       │
     │                    │                              │
     │                    ▼                              │
     │              ┌──────────────────────────┐         │
     │              │    Business              │         │
     │              ├──────────────────────────┤         │
     │              │ id (UUID, PK)            │         │
     │              │ name                     │◄────────┘
     │              │ slug                     │
     │              │ business_type*           │
     │              │ owner_id (FK) ───────────┘
     │              │ is_active                │
     │              │ created_at               │
     │              │ updated_at               │
     └──────────────│                          │
                    └──────────────┬───────────┘
                                   │
                         business_id (OneToOne)
                                   │
                                   ▼
                         ┌──────────────────────────┐
                         │  BusinessProfile         │
                         ├──────────────────────────┤
                         │ id (PK)                  │
                         │ business_id (OneToOne FK)│
                         │ logo (ImageField)        │
                         │ primary_color            │
                         │ secondary_color          │
                         │ theme                    │
                         │ about (TextField)        │
                         │ contact_email            │
                         │ contact_phone            │
                         │ website                  │
                         │ instagram                │
                         │ facebook                 │
                         │ tiktok                   │
                         │ whatsapp                 │
                         └──────────────────────────┘

* role choices: owner, admin, staff, analyst
* business_type choices: retail, service, online, creator
```

---

## Relationship Types

### 1. **User → Business (One-to-Many)**
```
One user can OWN multiple businesses
Related Name: owned_businesses

Example:
user = User.objects.get(id=1)
user.owned_businesses.all()  # All businesses owned by user
```

### 2. **User ↔ Business (Many-to-Many through Membership)**
```
One user can be MEMBER of many businesses
One business can have many members

Related Names:
  - From User: memberships
  - From Business: memberships

Example:
user = User.objects.get(id=1)
user.memberships.all()  # All memberships for this user

business = Business.objects.get(id='uuid')
business.memberships.all()  # All members of this business
```

### 3. **Business → BusinessProfile (One-to-One)**
```
One business has exactly one profile

Related Name: profile

Example:
business = Business.objects.get(id='uuid')
business.profile  # Single BusinessProfile instance
```

### 4. **User → ActiveBusiness (One-to-One)**
```
One user has one active business at a time

Related Name: active_business

Example:
user = User.objects.get(id=1)
user.active_business  # Current active business for user
```

---

## Data Query Examples

### **Get all businesses a user has access to:**
```python
from core.models import Business, Membership

user = User.objects.get(id=1)

# Method 1: Through owned businesses + memberships
owned = Business.objects.filter(owner=user, is_active=True)
member_of = Business.objects.filter(
    memberships__user=user,
    memberships__is_active=True,
    is_active=True
).distinct()

# All businesses (combined)
all_businesses = (owned | member_of).distinct()
```

### **Get user's role in a specific business:**
```python
from core.models import Membership

user = User.objects.get(id=1)
business = Business.objects.get(id='uuid')

membership = Membership.objects.get(user=user, business=business)
print(membership.role)  # 'owner', 'admin', 'staff', or 'analyst'
print(membership.is_active)  # True/False
print(membership.joined_at)  # Datetime
```

### **Get all members of a business:**
```python
from core.models import Business, Membership

business = Business.objects.get(id='uuid')

# All active members
active_members = business.memberships.filter(is_active=True)

# Members by role
owners = business.memberships.filter(role='owner')
admins = business.memberships.filter(role='admin')
staff = business.memberships.filter(role='staff')

# With user information
for membership in business.memberships.select_related('user'):
    print(f"{membership.user.email} - {membership.role}")
```

### **Get business profile:**
```python
from core.models import Business

business = Business.objects.get(id='uuid')

# Get profile
profile = business.profile
print(profile.logo)
print(profile.primary_color)
print(profile.about)
```

### **Get all active businesses for a user (efficient query):**
```python
from django.db.models import Q
from core.models import Business

user = User.objects.get(id=1)

businesses = Business.objects.filter(
    Q(owner=user) |  # User owns the business
    Q(memberships__user=user, memberships__is_active=True)
).filter(
    is_active=True
).select_related(
    'profile'  # Prefetch profile to avoid N+1
).distinct()
```

---

## Serialization View (What API Returns)

### **When a Business is Serialized:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Coffee Shop",
  "slug": "my-coffee-shop",
  "business_type": "retail",
  "is_active": true,
  "created_at": "2025-01-10T10:00:00Z",
  "profile": {
    "logo": "https://cdn.example.com/logos/abc123.png",
    "primary_color": "#8B4513",
    "secondary_color": "#D2B48C",
    "theme": "default",
    "about": "Best coffee in town",
    "contact_email": "hello@coffeeshop.com",
    "contact_phone": "+1-555-0123",
    "website": "https://mycoffeeshop.com",
    "instagram": "mycoffeeshop",
    "facebook": "mycoffeeshop",
    "tiktok": "mycoffeeshop",
    "whatsapp": "+1-555-0123"
  },
  "role": "owner"
}
```

### **When a User is Serialized (with businesses):**

```json
{
  "id": 1,
  "email": "owner@example.com",
  "username": "coffee_owner",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2025-01-05T08:00:00Z",
  "businesses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Coffee Shop",
      "slug": "my-coffee-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": { ... }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "name": "Partner Bakery",
      "slug": "partner-bakery",
      "business_type": "service",
      "role": "admin",
      "is_active": true,
      "created_at": "2025-01-12T14:00:00Z",
      "profile": { ... }
    }
  ],
  "owned_businesses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Coffee Shop",
      "slug": "my-coffee-shop",
      "business_type": "retail",
      "role": "owner",
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z",
      "profile": { ... }
    }
  ]
}
```

---

## Access Control Logic

### **Permission Matrix:**

| Action | Owner | Admin | Staff | Analyst |
|--------|-------|-------|-------|---------|
| View Profile | ✅ | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ❌ | ❌ |
| Add Members | ✅ | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ❌ | ❌ | ❌ |
| Deactivate Member | ✅ | ✅ | ❌ | ❌ |
| Delete Business | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ |

### **Code Implementation:**
```python
def check_can_edit_business(user, business):
    try:
        membership = Membership.objects.get(user=user, business=business)
        return membership.role in ['owner', 'admin']
    except Membership.DoesNotExist:
        return False

def check_can_manage_members(user, business):
    try:
        membership = Membership.objects.get(user=user, business=business)
        return membership.role in ['owner', 'admin']
    except Membership.DoesNotExist:
        return False

def check_can_change_roles(user, business):
    try:
        membership = Membership.objects.get(user=user, business=business)
        return membership.role == 'owner'
    except Membership.DoesNotExist:
        return False
```

---

## Migration Path

### **When a Business is Created:**

```python
# In signals.py or post_save signal
@receiver(post_save, sender=Business)
def create_business_profile(sender, instance, created, **kwargs):
    if created:
        # Create empty profile
        BusinessProfile.objects.create(business=instance)
        
        # Create owner membership
        Membership.objects.create(
            user=instance.owner,
            business=instance,
            role='owner'
        )
```

### **When a User is Added to Business:**

```python
# Create membership
membership = Membership.objects.create(
    user=new_user,
    business=business,
    role='staff'  # or other role
)
# User can now access this business
```

### **When User Joins Multiple Businesses:**

```python
# User's memberships list
user.memberships.all()  # Shows all Membership objects
# Each membership points to a different business
```

---

## Performance Considerations

### **N+1 Query Problem Solutions:**

```python
# ❌ Bad - causes N+1 queries
for membership in business.memberships.all():
    print(membership.user.email)  # Extra query per iteration

# ✅ Good - uses select_related
for membership in business.memberships.select_related('user'):
    print(membership.user.email)  # Only one query

# ❌ Bad - causes N+1 queries
for business in user_businesses:
    print(business.profile.logo)  # Extra query per iteration

# ✅ Good - uses select_related
for business in user_businesses.select_related('profile'):
    print(business.profile.logo)  # Only one query
```

### **Recommended Indexes:**
```python
# Add to model Meta classes:
class Membership(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['business', 'is_active']),
        ]

class Business(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['owner', 'is_active']),
        ]
```

---

## Testing Data Setup

```python
# Create test user
user = User.objects.create_user(
    email='test@test.com',
    username='testuser',
    password='testpass123'
)

# Create business
business = Business.objects.create(
    name='Test Business',
    slug='test-business',
    business_type='retail',
    owner=user
)
# Note: BusinessProfile and Membership are created automatically via signals

# Add another member
member_user = User.objects.create_user(
    email='member@test.com',
    username='memberuser',
    password='testpass123'
)

Membership.objects.create(
    user=member_user,
    business=business,
    role='staff'
)

# Now both users can access the business:
# user -> owner
# member_user -> staff
```

---

## Summary

- **Users** can own multiple businesses
- **Users** can be members of many businesses with different roles
- **Businesses** have one **BusinessProfile** with branding info
- **Memberships** connect users to businesses with roles
- **ActiveBusiness** tracks the user's current active business
- All queries should use `select_related` for profiles/relationships to avoid N+1
- Access control is based on membership role
- Automatic creation of profile and owner membership happens via signals
