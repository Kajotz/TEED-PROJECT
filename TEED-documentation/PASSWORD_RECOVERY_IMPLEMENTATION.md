# Password Recovery Implementation Guide

**Version**: 1.0  
**Date**: February 21, 2026  
**Status**: Complete ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [User Flow](#user-flow)
8. [Security Measures](#security-measures)
9. [Setup & Deployment](#setup--deployment)
10. [Testing Guide](#testing-guide)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Password Recovery system allows users who have forgotten their passwords to securely reset them through a multi-step verification process. The system is inspired by Meta and Apple's recovery flows, focusing on security and user experience.

### Key Features

- **5-step guided recovery process** with progress indicator
- **Identity verification** using username + recovery mobile number
- **12-digit recovery codes** with 30-minute expiry
- **Rate limiting**: 5 attempts per 24 hours
- **Automatic login** after successful password reset
- **Recovery contact display** showing recovery email/mobile for future use
- **Toast notifications** for all user feedback
- **Dark mode support** for entire recovery page
- **Email notifications** with formatted code and security warnings

---

## Architecture

```
LOGIN PAGE
    ↓
[Forgotten Password Button]
    ↓
RECOVERY PAGE (5 Steps)
    ├── Step 1: Email Entry
    ├── Step 2: Identity Verification (username + mobile)
    ├── Step 3: Recovery Code Sent (confirmation)
    ├── Step 4: Reset Password (code + new password)
    └── Step 5: Success (show recovery contacts + link to Profile)
    ↓
BACKEND ENDPOINTS
    ├── POST /api/auth/recover/initiate/
    ├── POST /api/auth/recover/verify-identity/
    └── POST /api/auth/recover/reset-password/
    ↓
EMAIL SERVICE
    └── send_password_reset_code() → Email with 12-digit code
    ↓
AUTO-LOGIN
    └── JWT tokens generated + stored in localStorage
```

---

## Backend Implementation

### 1. Database Model: PasswordRecoveryCode

**Location**: `core/models/email_verification.py`

```python
class PasswordRecoveryCode(models.Model):
    """
    Temporary 12-digit codes for password recovery process
    - Generated during forgot password flow
    - Expires after 30 minutes
    - Rate limited: 5 attempts per 24 hours
    - Only valid for the user who requested recovery
    """
    
    id = UUIDField(primary_key=True)
    user = ForeignKey(User, on_delete=CASCADE, related_name='password_recovery_codes')
    email = EmailField(db_index=True)  # Email used to request recovery
    code = CharField(max_length=12)     # 12-digit code
    is_used = BooleanField(default=False)
    attempts = IntegerField(default=0)  # Failed verification attempts
    created_at = DateTimeField(auto_now_add=True)
    expires_at = DateTimeField()        # 30 minutes from creation
    used_at = DateTimeField(null=True)  # When code was used
```

**Key Methods**:

```python
@staticmethod
def generate_code():
    """Generate random 12-digit recovery code"""
    return ''.join(str(secrets.randbelow(10)) for _ in range(12))

@staticmethod
def create_for_user(user, email):
    """Create new recovery code, invalidate old unused codes"""
    # Invalidate old codes
    PasswordRecoveryCode.objects.filter(user=user, is_used=False).update(
        expires_at=timezone.now()
    )
    # Create new code with 30-minute expiry
    return PasswordRecoveryCode.objects.create(
        user=user,
        email=email,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=30)
    )

def is_expired(self):
    """Check if code expired"""
    return timezone.now() > self.expires_at

def is_valid(self):
    """Check if code can still be used"""
    return not self.is_expired() and not self.is_used and self.attempts < 5

@staticmethod
def get_rate_limit_exceeded(user, hours=24):
    """Check if user exceeded 5 recovery attempts in past 24 hours"""
    cutoff_time = timezone.now() - timedelta(hours=hours)
    recent_attempts = PasswordRecoveryCode.objects.filter(
        user=user,
        created_at__gte=cutoff_time
    ).count()
    return recent_attempts >= 5
```

### 2. API Endpoints

**Location**: `core/views/auth.py`

#### Endpoint 1: Initiate Recovery

**URL**: `POST /api/auth/recover/initiate/`

**Request**:
```json
{
    "email": "user@example.com"
}
```

**Response (Success)**:
```json
{
    "message": "Recovery email sent successfully",
    "expires_in_minutes": 30
}
```

**Response (Rate Limited)**:
```json
{
    "error": "Too many recovery attempts. Please try again in 24 hours."
}
```

**Status Code**: HTTP 200 (success) or HTTP 429 (rate limited)

**Security Notes**:
- Doesn't reveal if email is registered (for user privacy)
- Always returns HTTP 200 even if email doesn't exist
- Checks rate limit before proceeding
- Invalidates old recovery codes

#### Endpoint 2: Verify Identity

**URL**: `POST /api/auth/recover/verify-identity/`

**Request**:
```json
{
    "email": "user@example.com",
    "username_display": "johndoe",
    "recovery_mobile": "+1234567890"
}
```

**Response (Success)**:
```json
{
    "message": "Identity verified successfully",
    "can_proceed": true
}
```

**Response (Failure)**:
```json
{
    "error": "Verification information does not match. Please try again."
}
```

**Status Code**: HTTP 200 (success) or HTTP 400 (verification failed)

**Security Notes**:
- Validates all three fields match user profile
- Uses username_display and recovery_mobile from UserProfile model
- Returns generic error if any field doesn't match

#### Endpoint 3: Reset Password

**URL**: `POST /api/auth/recover/reset-password/`

**Request**:
```json
{
    "email": "user@example.com",
    "code": "123456789012",
    "new_password": "NewSecurePassword123"
}
```

**Response (Success)**:
```json
{
    "message": "Password reset successfully. You can now login with your new password.",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "recovery_contact": {
        "email": "recovery@example.com",
        "mobile": "+1234567890"
    }
}
```

**Response (Invalid Code)**:
```json
{
    "error": "Invalid recovery code"
}
```

**Response (Expired Code)**:
```json
{
    "error": "Recovery code has expired. Please request a new one."
}
```

**Response (Too Many Attempts)**:
```json
{
    "error": "Too many failed attempts. Please request a new code."
}
```

**Status Code**: HTTP 200 (success) or HTTP 400 (validation error)

**Security Notes**:
- Validates code exists and belongs to user
- Checks code hasn't expired (30 minutes)
- Checks code hasn't been used
- Tracks failed attempts (max 5)
- Marks code as used after successful reset
- Generates JWT tokens for automatic login
- Returns recovery contact info for next steps

### 3. Email Service

**Location**: `core/utils/email_service.py`

**Method**: `send_password_reset_code(email, recovery_code, username_display)`

**Features**:
- HTML formatted email with visual presentation
- Recovery code formatted as: `XXXX-XXXX-XXXX` (easier to read)
- 30-minute expiry warning
- Security notice about code privacy
- Professional branding with links
- Fallback plain text version

**Email Template Structure**:
```
Header: "Password Reset Request"
Body:
  - Personalized greeting with username
  - Explanation of request
  - Prominent code display (formatted)
  - 30-minute expiry warning
  - Recovery steps (1-4)
  - Security notice (never share code)
Footer:
  - Links to security center and privacy policy
```

---

## Frontend Implementation

### 1. Recovery Page Component

**Location**: `teedhub_frontend/src/pages/Recovery.jsx`

**Key Features**:

```jsx
// Step management
const [step, setStep] = useState(1); // Steps 1-5

// Form data
const [email, setEmail] = useState('');
const [usernameDisplay, setUsernameDisplay] = useState('');
const [recoveryMobile, setRecoveryMobile] = useState('');
const [recoveryCode, setRecoveryCode] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

// UI state
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

// After successful reset
const [recoveryContact, setRecoveryContact] = useState(null);
```

### 2. Step-by-Step Flow

#### Step 1: Email Entry
- Input: Email address
- Action: `handleStep1Submit()` → Calls `/api/auth/recover/initiate/`
- Output: Advances to Step 2
- Error Handling: Shows error toast if email is empty

#### Step 2: Identity Verification
- Input: Username display + Recovery mobile number
- Action: `handleStep2Submit()` → Calls `/api/auth/recover/verify-identity/`
- Output: Advances to Step 3 (confirmation screen)
- Error Handling: Shows error toast if verification fails
- Back Button: Returns to Step 1

#### Step 3: Recovery Code Sent (Confirmation Only)
- Display: Shows which email received the code
- User Action: Click "I Have the Code" button to advance to Step 4
- Information: 30-minute expiry warning, spam folder notice
- Back Button: Returns to Step 2

#### Step 4: Reset Password
- Inputs: 
  - 12-digit recovery code (numbers only)
  - New password (min 8 characters)
  - Confirm password
- Action: `handleStep4Submit()` → Calls `/api/auth/recover/reset-password/`
- Output: Advances to Step 5
- Validation:
  - Code must be 12 digits
  - Both passwords must match
  - Password must be at least 8 characters
- Error Handling: Shows error toast for validation failures
- Back Button: Returns to Step 3

#### Step 5: Success
- Display:
  - Success checkmark icon
  - Confirmation message
  - Recovery contacts (email + mobile)
  - Explanation of future use
- Actions:
  - "Go to Profile" button → Redirects to `/profile`
  - "Back to Login" link → Redirects to `/login`

### 3. UI Components

**Step Progress Indicator**:
```jsx
[1] [2] [3] [4] [5]  // Current step is highlighted
↓
- Completed steps: Blue (#1F75FE) with checkmark
- Current step: Gold (#f2a705)
- Future steps: Gray
```

**Form Fields**:
- Email input with Mail icon
- Text inputs with proper labels
- Password inputs with show/hide toggle
- Code input (numeric only, max 12 digits)
- All fields have dark mode support

**Buttons**:
- Primary action (blue #1F75FE, hover variations)
- Secondary action (white/dark background, gray border)
- Back button (transparent, gray text)
- All buttons have loading states

### 4. Toast Notifications

Uses the `useToast` hook imported from `../hooks/useToast`:

```jsx
const { toasts, success, error: showError, info, removeToast } = useToast();

// Success: Password reset completed
success('Password reset successfully!');

// Error: Code validation failed
showError('Invalid recovery code');

// Info: Code sent confirmation
info('If this email exists, recovery instructions will be sent.');
```

**Toast Types**:
- `success()`: Green, 3-second duration
- `error()` / `showError()`: Red, 4-second duration
- `info()`: Blue, 3-second duration
- `warning()`: Amber, 3-second duration

---

## API Endpoints

### Summary Table

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/recover/initiate/` | POST | Start recovery by entering email | ❌ No |
| `/api/auth/recover/verify-identity/` | POST | Verify username + recovery mobile | ❌ No |
| `/api/auth/recover/reset-password/` | POST | Reset password with code | ❌ No |

### Request/Response Examples

See [API Endpoints](#api-endpoints) section above for detailed examples.

---

## Database Schema

### Table: password_recovery_codes

```sql
CREATE TABLE password_recovery_codes (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    email VARCHAR(254) NOT NULL,
    code VARCHAR(12) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_user_is_used (user_id, is_used),
    INDEX idx_code (code),
    INDEX idx_expires_at (expires_at)
)
```

### Related Tables Used

**UserProfile** (existing):
- `recovery_email` - Alternative email for recovery (unique)
- `recovery_mobile` - Phone number for recovery (unique)
- `username_display` - Display name (used in identity verification)

**auth_user** (Django built-in):
- `email` - Primary email
- `password` - Updated during reset

---

## User Flow

### Happy Path (Successful Recovery)

```
1. User at /login page
   ↓
2. Clicks "Forgotten Password?" button
   ↓
3. Redirected to /recover (Step 1)
   ↓
4. Enters email → System checks:
   - Email exists?
   - Rate limit (5 per 24h)? 
   - Show info: "If email exists, instructions sent"
   ↓
5. Step 2: Identity Verification
   - Enter username_display
   - Enter recovery_mobile
   - System validates against user profile
   - Email sent with 12-digit code
   ↓
6. Step 3: Confirmation
   - Shows which email code was sent to
   - User confirms receipt
   ↓
7. Step 4: Reset Password
   - Enter 12-digit code
   - Enter new password (min 8 chars)
   - Confirm password matches
   - Submit
   ↓
8. Step 5: Success
   - Shows recovery email/mobile
   - Shows "You can use these for future recovery"
   - Options: Go to Profile OR Back to Login
   ↓
9. User is auto-logged in
   - Tokens stored in localStorage
   - Can navigate to Profile immediately
```

### Error Scenarios

**Email Not Found**:
- Step 1 shows info message (doesn't reveal if registered)
- User can try again with different email
- Rate limit still applies (5 per 24h)

**Rate Limit Exceeded**:
- Step 1 shows error: "Too many attempts, try again in 24h"
- Returns HTTP 429

**Identity Verification Fails**:
- Step 2 shows error: "Information does not match"
- Username or mobile incorrect
- User can go back and retry

**Code Expired**:
- Step 4 shows error: "Code expired, request new one"
- 30-minute window has passed
- User must start over at Step 1

**Code Wrong/Invalid**:
- Step 4 shows error: "Invalid recovery code"
- Attempt counter increments
- After 5 attempts, code becomes invalid

**Password Validation Fails**:
- Step 4 shows error: "Password < 8 chars" OR "Passwords don't match"
- User can retry without losing code

---

## Security Measures

### 1. Rate Limiting

- **Limit**: 5 recovery attempts per 24 hours per user
- **Check**: `PasswordRecoveryCode.get_rate_limit_exceeded(user, hours=24)`
- **Response**: HTTP 429 Too Many Requests
- **Implementation**: Count codes created in past 24 hours

### 2. Code Expiry

- **Duration**: 30 minutes from creation
- **Check**: `is_expired()` method compares `timezone.now()` with `expires_at`
- **Storage**: `expires_at` field automatically calculated
- **Cleanup**: Old codes are soft-deleted (expires_at set to now) when new codes requested

### 3. Code Validation

- **Format**: 12 random digits (0-9)
- **Generation**: Using `secrets.randbelow(10)` for cryptographic randomness
- **Constraints**:
  - Cannot be reused (is_used = True after use)
  - Failed attempts tracked (max 5)
  - Bound to specific user and email

### 4. Attempt Tracking

- **Field**: `attempts` (incremented on each failed validation)
- **Limit**: 5 failed attempts
- **When Incremented**: 
  - Invalid code submitted
  - Expired code submitted
  - Code already used
- **Effect**: After 5 attempts, code becomes invalid

### 5. Password Requirements

- **Minimum Length**: 8 characters
- **No Additional Rules**: Simple but enforced
- **Hashing**: Django's default `make_password()` (PBKDF2)
- **Validation**: Frontend + Backend

### 6. Email Privacy

- **Policy**: Don't reveal if email is registered
- **Implementation**: All email lookup failures return HTTP 200 with generic message
- **Message**: "If an account with this email exists, recovery instructions have been sent"
- **Benefit**: Prevents user enumeration attacks

### 7. Identity Verification

- **Method**: Username + Recovery mobile must match
- **Source**: UserProfile model data
- **Validation**: Exact match required (case-insensitive for username)
- **Purpose**: Proves user has access to recovery contact method

### 8. Code Storage

- **Storage**: Plain-text in database (no hashing)
- **Rationale**: Only 12-digit codes, code itself is the token, users can see it in email
- **Further Protection**: 30-minute expiry + rate limiting

### 9. JWT Token Generation

- **Token Type**: JWT (JSON Web Token)
- **Created**: After successful password reset
- **Duration**: Access token (varies by config), Refresh token (longer)
- **Storage**: localStorage (frontend)
- **Usage**: Automatic login after recovery

---

## Setup & Deployment

### Prerequisites

- Django 5.2+ 
- djangorestframework
- djangorestframework-simplejwt
- React 18+
- Django email configured (SMTP or other backend)

### Backend Setup

#### 1. Apply Migration

```bash
cd c:\Users\jacktech\Desktop\TEED PROJECT
python manage.py migrate
```

This creates the `password_recovery_codes` table.

#### 2. Update URLs

Ensure this is in `core/urls.py`:

```python
from core.views.auth import (
    PasswordRecoveryInitiateView,
    PasswordRecoveryVerifyIdentityView,
    PasswordRecoveryResetView
)

urlpatterns = [
    # ... existing paths ...
    
    # Password Recovery (Forgot Password Flow)
    path("auth/recover/initiate/", PasswordRecoveryInitiateView.as_view(), name="password_recovery_initiate"),
    path("auth/recover/verify-identity/", PasswordRecoveryVerifyIdentityView.as_view(), name="password_recovery_verify_identity"),
    path("auth/recover/reset-password/", PasswordRecoveryResetView.as_view(), name="password_recovery_reset"),
]
```

#### 3. Restart Django

```bash
python manage.py runserver
```

### Frontend Setup

#### 1. Recovery Page Component

File: `teedhub_frontend/src/pages/Recovery.jsx`

Already created and ready to use.

#### 2. Update App Routes

Ensure `teedhub_frontend/src/App.jsx` has:

```jsx
import Recovery from "./pages/Recovery";

// In Routes:
<Route path="/recover" element={<Recovery />} />
```

#### 3. Login Page Update

Button already added to `teedhub_frontend/src/pages/Login.jsx`:

```jsx
<a
  href="/recover"
  className="w-full bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE]"
>
  Forgotten Password?
</a>
```

#### 4. Restart Frontend

```bash
cd teedhub_frontend
npm run dev
```

### Email Configuration

For password reset emails to work, configure Django email settings in `teedhub_backend/settings.py`:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # or your email provider
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # Use app-specific password
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'
```

Or use environment variables:

```python
import os
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
```

---

## Testing Guide

### Manual Testing Checklist

#### Step 1: Email Entry
- [ ] User can enter email
- [ ] Submit button is disabled if email empty
- [ ] System accepts any email format (doesn't validate existence)
- [ ] Info toast appears with generic message
- [ ] Advances to Step 2

#### Step 2: Identity Verification
- [ ] User can enter username and mobile
- [ ] Back button returns to Step 1
- [ ] Submit button disabled if any field empty
- [ ] Correct username + mobile → Success toast → Step 3
- [ ] Incorrect username → Error toast
- [ ] Incorrect mobile → Error toast
- [ ] Can try again without re-entering email

#### Step 3: Confirmation
- [ ] Shows email where code was sent
- [ ] Shows 30-minute expiry warning
- [ ] Shows spam folder notice
- [ ] "I Have the Code" button advances to Step 4
- [ ] Back button returns to Step 2

#### Step 4: Reset Password
- [ ] Code field accepts only numbers
- [ ] Code field max length is 12
- [ ] Password show/hide toggle works
- [ ] Invalid code (< 12 digits) → Error toast
- [ ] Invalid code (wrong code) → Error toast
- [ ] Password < 8 chars → Error toast
- [ ] Passwords don't match → Error toast
- [ ] Valid code + matching passwords → Success → Step 5
- [ ] Can try again without re-entering email/identity

#### Step 5: Success
- [ ] Shows recovery email
- [ ] Shows recovery mobile
- [ ] "Go to Profile" button redirects to `/profile`
- [ ] "Back to Login" link redirects to `/login`
- [ ] User is auto-logged in (can access profile immediately)

#### Dark Mode
- [ ] All text is readable in dark mode
- [ ] All buttons are visible in dark mode
- [ ] Form inputs have proper background in dark mode
- [ ] Step progress indicator looks good in dark mode

### Testing Rate Limiting (If Needed)

To test the 5-per-24h rate limit:

```python
# From Django shell
from django.contrib.auth import get_user_model
from core.models import PasswordRecoveryCode

User = get_user_model()
user = User.objects.get(username='testuser')

# Create 5 codes within 24h
for i in range(5):
    PasswordRecoveryCode.create_for_user(user, user.email)

# 6th attempt should be rate-limited
recovery = PasswordRecoveryCode.create_for_user(user, user.email)
# Check: PasswordRecoveryCode.get_rate_limit_exceeded(user) → True
```

### Testing Code Expiry

```python
from django.utils import timezone
from datetime import timedelta

# Manually create an expired code
expired_code = PasswordRecoveryCode.objects.create(
    user=user,
    email=user.email,
    code='123456789012',
    expires_at=timezone.now() - timedelta(minutes=1)  # Already expired
)

# Test: expired_code.is_valid() → False
```

### API Testing (Using cURL or Postman)

#### Test Endpoint 1: Initiate

```bash
curl -X POST http://localhost:8000/api/auth/recover/initiate/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Expected Response (200):
```json
{
    "message": "Recovery email sent successfully",
    "expires_in_minutes": 30
}
```

#### Test Endpoint 2: Verify Identity

```bash
curl -X POST http://localhost:8000/api/auth/recover/verify-identity/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username_display": "johndoe",
    "recovery_mobile": "+1234567890"
  }'
```

Expected Response (200):
```json
{
    "message": "Identity verified successfully",
    "can_proceed": true
}
```

#### Test Endpoint 3: Reset Password

```bash
curl -X POST http://localhost:8000/api/auth/recover/reset-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456789012",
    "new_password": "NewSecurePassword123"
  }'
```

Expected Response (200):
```json
{
    "message": "Password reset successfully. You can now login with your new password.",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "recovery_contact": {
        "email": "recovery@example.com",
        "mobile": "+1234567890"
    }
}
```

---

## Troubleshooting

### Issue: Email Not Sent

**Symptoms**: User completes Step 2 but doesn't receive email

**Solutions**:

1. Check Django email configuration:
```python
# In Django shell
from django.core.mail import send_mail
send_mail('Test', 'Message', 'from@example.com', ['to@example.com'])
```

2. Check email credentials (especially Gmail):
   - Use app-specific password, not regular password
   - Enable "Less secure app access" (if applicable)
   - Check 2FA settings

3. Check email logs:
```python
from django.core.mail import mail_admins
# Check Django logs for email errors
```

4. Verify `DEFAULT_FROM_EMAIL` is set correctly

### Issue: "Identity Verification Failed" Always

**Symptoms**: User enters correct username + mobile but gets error

**Solutions**:

1. Check UserProfile has recovery_mobile set:
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(email='user@example.com')
print(user.profile.username_display)
print(user.profile.recovery_mobile)
```

2. Verify exact format:
   - Username must match exactly (case-insensitive OK)
   - Mobile must be exact format in database

3. Check database directly:
```sql
SELECT username_display, recovery_mobile FROM core_userprofile WHERE user_id = 1;
```

### Issue: 415 Unsupported Media Type Error

**Symptoms**: Frontend gets 415 error when calling API

**Solutions**:

1. Verify endpoint uses JSONParser:
```python
# In core/views/auth.py
from rest_framework.parsers import JSONParser

class PasswordRecoveryResetView(APIView):
    parser_classes = [JSONParser]  # Add if missing
```

2. Verify frontend sends correct Content-Type:
```javascript
fetch(`${BACKEND_ROOT}/api/auth/recover/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },  // Must be included
    body: JSON.stringify(payload),
})
```

### Issue: Rate Limiting Not Working

**Symptoms**: User can request recovery > 5 times per 24h

**Solutions**:

1. Verify database has old codes:
```python
from core.models import PasswordRecoveryCode
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='testuser')
codes = PasswordRecoveryCode.objects.filter(user=user).count()
print(f"Total codes for user: {codes}")
```

2. Check rate limit calculation:
```python
is_limited = PasswordRecoveryCode.get_rate_limit_exceeded(user, hours=24)
print(f"Rate limited: {is_limited}")
```

### Issue: Code Expiry Not Working

**Symptoms**: User can use code after 30 minutes

**Solutions**:

1. Verify timezone is set correctly in Django:
```python
# In settings.py
TIME_ZONE = 'UTC'  # Or your timezone
USE_TZ = True
```

2. Check code is actually expired:
```python
from core.models import PasswordRecoveryCode
code = PasswordRecoveryCode.objects.get(code='123456789012')
print(f"Expired: {code.is_expired()}")
print(f"Created: {code.created_at}")
print(f"Expires: {code.expires_at}")
print(f"Now: {timezone.now()}")
```

### Issue: Toast Notifications Not Showing

**Symptoms**: Frontend doesn't show toast messages

**Solutions**:

1. Verify Toast component is imported:
```jsx
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
```

2. Verify Toast is rendered:
```jsx
return (
    <>
        {/* Recovery form content */}
        <Toast toasts={toasts} removeToast={removeToast} />
    </>
)
```

3. Check useToast hook works:
```jsx
const { toasts, success, error: showError, info, removeToast } = useToast();
// Should have all 4 methods
```

4. Test with simple call:
```jsx
success('Test message');  // Should show green toast
```

### Issue: Auto-Login Not Working After Reset

**Symptoms**: Password reset succeeds but user not logged in

**Solutions**:

1. Verify tokens are returned from backend:
```python
# In PasswordRecoveryResetView.post()
response_data = {
    'access': str(refresh.access_token),  # Must include
    'refresh': str(refresh),              # Must include
}
```

2. Verify tokens are stored in localStorage:
```javascript
// After reset succeeds
if (data.access) localStorage.setItem('access_token', data.access);
if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
```

3. Verify API auth uses localStorage tokens:
```javascript
// In utils/api.js or similar
const token = localStorage.getItem('access_token');
headers['Authorization'] = `Bearer ${token}`;
```

---

## Appendix: File Locations

### Backend Files
- `core/models/email_verification.py` - PasswordRecoveryCode model
- `core/migrations/0009_passwordrecoverycode.py` - Database migration
- `core/views/auth.py` - Recovery endpoints
- `core/utils/email_service.py` - send_password_reset_code() method
- `core/urls.py` - Recovery routes

### Frontend Files
- `teedhub_frontend/src/pages/Recovery.jsx` - Recovery page component
- `teedhub_frontend/src/pages/Login.jsx` - "Forgotten Password?" button
- `teedhub_frontend/src/App.jsx` - `/recover` route
- `teedhub_frontend/src/hooks/useToast.js` - Toast state management
- `teedhub_frontend/src/components/Toast.jsx` - Toast UI component

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 21, 2026 | Initial implementation (5-step recovery, 30min codes, rate limiting) |

---

## References

- [PASSWORD RECOVERY IMPLEMENTATION](./PASSWORD_RECOVERY_IMPLEMENTATION.md) - Quick reference
- [PROJECT-PROTOCOL.md](../PROJECT-PROTOCAL.md) - Coding standards
- [ARCHITECTURE-DIAGRAM.md](./ARCHITECTURE-DIAGRAM.md) - System architecture

---

**Last Updated**: February 21, 2026  
**Author**: AI Assistant  
**Status**: Complete ✅
