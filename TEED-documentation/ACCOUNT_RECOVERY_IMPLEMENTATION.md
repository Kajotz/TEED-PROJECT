# Account Recovery & Alternative Login System - Implementation Guide

## Overview

This document outlines the complete implementation of an advanced account recovery system that allows users to:
1. Set recovery email and phone number for account access if primary email is lost
2. Use 10 one-time 12-digit recovery codes for emergency account access
3. Login using recovery codes if they lose email access
4. Set a new password when using recovery codes

## Database Schema

### Updated Models

#### UserProfile (Extended)
- `recovery_email` (EmailField, nullable, blank) - Alternative email for recovery
- `recovery_mobile` (CharField, max 20, nullable, blank) - Phone number for recovery
- Migration: `0007_rename_account_rec_user_id_is_used_idx_account_rec_user_id_114b84_idx_and_more`

#### AccountRecoveryCode (Existing)
- `id` (UUIDField) - Primary key
- `user` (ForeignKey to User) - User who owns the code
- `code_hash` (CharField, unique) - SHA256 hash of the 12-digit code
- `code_display` (CharField) - Last 4 digits for user reference
- `is_used` (BooleanField) - Marks code as used
- `used_at` (DateTimeField) - When code was used
- `created_at` (DateTimeField) - When created

#### RecoveryContact (Existing)
- `id` (UUIDField)
- `user` (ForeignKey to User)
- `contact_type` (CharField: 'email' or 'phone')
- `contact_value` (CharField) - Email or phone number
- `is_verified` (BooleanField)
- `is_primary` (BooleanField)
- `verification_code` (CharField, 6 digits)
- `verification_attempts` (IntegerField)
- `created_at` (DateTimeField)
- `verified_at` (DateTimeField)

## Backend API Endpoints

### 1. Update Recovery Information
**Endpoint:** `POST /api/personal-info/update_recovery_info/`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "recovery_email": "backup@example.com",
  "recovery_mobile": "+1-234-567-8900"
}
```

**Response (200 OK):**
```json
{
  "message": "Recovery information updated successfully",
  "data": {
    "id": "uuid",
    "user_email": "user@example.com",
    "username": "user",
    "username_display": "User Name",
    "phone_number": "+1-555-0100",
    "recovery_email": "backup@example.com",
    "recovery_mobile": "+1-234-567-8900",
    "country": "US",
    "profile_image": null,
    "created_at": "2026-02-17T...",
    "updated_at": "2026-02-17T..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email format or email already in use
- `400 Bad Request` - Invalid phone format
- `401 Unauthorized` - Not authenticated

### 2. Recovery Code Login (12-Digit Emergency Access)
**Endpoint:** `POST /api/auth/recovery-login/`

**Headers:**
```
Content-Type: application/json
(No Authorization required - this is unauthenticated)
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "recovery_code": "123456789012",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": "user-uuid",
  "message": "Account recovered successfully. Password has been updated."
}
```

**Error Responses:**
- `400 Bad Request` - Password mismatch or too short (<8 chars)
- `400 Bad Request` - Recovery code is invalid or already used
- `404 Not Found` - User not found

## Frontend Components

### 1. Security Tab - Profile Page
**File:** `teedhub_frontend/src/pages/UserProfilePage.jsx`

**New States:**
```javascript
const [recoveryData, setRecoveryData] = useState({
  recovery_email: '',
  recovery_mobile: '',
});
const [showRecoveryEmailForm, setShowRecoveryEmailForm] = useState(false);
const [showRecoveryMobileForm, setShowRecoveryMobileForm] = useState(false);
```

**New Handler:**
```javascript
const handleUpdateRecoveryInfo = async (e) => {
  // Updates recovery_email and/or recovery_mobile via API
  // Calls POST /api/personal-info/update_recovery_info/
  // Shows success/error messages
  // Refreshes profile data
}
```

**UI Components:**
- "Account Recovery Options" section replaces "Change Email" section
- Recovery Email input with "Set" button
- Recovery Phone input with "Set" button
- Blue info box explaining 12-digit recovery codes

### 2. Login Page - Recovery Tab
**File:** `teedhub_frontend/src/pages/Login.jsx`

**New Component:**
```javascript
const RecoveryCodeLogin = () => {
  // Handles login using 12-digit recovery code
  // Fields: email, recovery_code, new_password, confirm_password
  // Validates all inputs
  // Calls POST /api/auth/recovery-login/
  // Stores JWT tokens on success
  // Redirects to /profile
}
```

**Tab Options:**
- Email (original)
- Phone (existing)
- Recovery (new)

**Recovery Form Fields:**
- Email address (required)
- 12-digit recovery code (numeric input, max 12)
- New password (write-only, min 8 chars)
- Confirm password (write-only)

## User Workflow

### Setting Up Recovery Options

1. **User navigates to Profile** → Security tab
2. **Optional: Set Recovery Email**
   - Click "Set" under Recovery Email
   - Enter alternative email
   - Click "Update Recovery Email"
   - Confirmation message displays

3. **Optional: Set Recovery Phone**
   - Click "Set" under Recovery Phone
   - Enter phone number (10-15 digits)
   - Click "Update Recovery Phone"
   - Confirmation message displays

4. **Recovery Codes Ready**
   - 10 one-time codes generated during signup
   - Each code is 12 digits
   - Codes sent to primary email
   - User can regenerate/view in account settings

### Emergency Login (Lost Email Access)

1. **User cannot login to primary email**
2. **Go to Login page**
3. **Click "Recovery" tab**
4. **Enter information:**
   - Primary email address
   - One unused 12-digit recovery code
   - New password (replaces old password)
   - Confirm new password

5. **Click "Recover & Sign In"**
6. **System validates:**
   - Email exists
   - Recovery code is valid
   - Code hasn't been used yet
   - Passwords match and meet requirements

7. **On success:**
   - Code marked as used
   - Password updated
   - JWT tokens issued
   - User logged in
   - Redirect to dashboard

## Security Considerations

### Password Hashing
- Recovery codes stored as SHA256 hashes in database
- Never stored as plaintext
- Validated by hashing user input and comparing hashes

### One-Time Use
- Each recovery code can only be used once
- After use, `is_used` flag set to `True`
- `used_at` timestamp recorded
- Prevents brute force and code reuse attacks

### Rate Limiting (Recommended Future Addition)
- Limit recovery code login attempts
- Lock account temporarily after N failed attempts
- Send security alert emails on account recovery

### Email & Phone Validation
- Email format validated on both frontend and backend
- Phone number format checked (10-15 digits)
- Cannot set recovery email to existing account email
- Can be verified with OTP codes (RecoveryContact model supports this)

### Password Requirements
- Minimum 8 characters
- Must be confirmed (match twice)
- User sets password during recovery (not auto-generated)

## Code Structure

### Backend Files Modified

**[core/models/user_profile.py](core/models/user_profile.py)**
- Added `recovery_email` field (EmailField)
- Added `recovery_mobile` field (CharField)

**[core/serializers.py](core/serializers.py)**
- Updated `UserProfileSerializer` to include recovery fields
- New serializers: `RecoveryContactSerializer`, `AccountRecoverySerializer`

**[core/views/personal_info.py](core/views/personal_info.py)**
- Added `update_recovery_info()` action to PersonalInfoViewSet
- Validates recovery email and mobile
- Updates and returns updated profile

**[core/views/auth.py](core/views/auth.py)**
- New `RecoveryCodeLoginSerializer` - validates recovery login request
- New `RecoveryCodeLoginView` - handles 12-digit code login
- Validates email, code, and passwords
- Issues JWT tokens on success

**[core/urls.py](core/urls.py)**
- Added import for `RecoveryCodeLoginView`
- Added route: `path("auth/recovery-login/", RecoveryCodeLoginView.as_view(), name="recovery_code_login")`

### Frontend Files Modified

**[teedhub_frontend/src/pages/UserProfilePage.jsx](teedhub_frontend/src/pages/UserProfilePage.jsx)**
- Replaced "Change Email" section with "Account Recovery Options"
- Added recovery email and phone inputs
- Added `handleUpdateRecoveryInfo()` function
- Shows recovery codes info box
- UI updates with Set buttons and forms

**[teedhub_frontend/src/pages/Login.jsx](teedhub_frontend/src/pages/Login.jsx)**
- Added "Recovery" tab to login options
- New `RecoveryCodeLogin` component
- Tab selector updated to include recovery
- 12-digit code input with validation
- Password reset during recovery

## Testing Guide

### Manual Testing Steps

#### 1. Setup Recovery Information
1. Login with test account
2. Go to Profile → Security
3. Set recovery email: `backup@example.com`
4. Confirm "Recovery information updated successfully"
5. Set recovery phone: `+1-555-0100`
6. Confirm success message

#### 2. View Generated Recovery Codes
1. Check email sent during signup for recovery codes
2. Verify 10 codes with format like: `123456789012`
3. Note down one code for testing

#### 3. Test Recovery Login
1. Logout
2. Go to Login page
3. Click "Recovery" tab
4. Enter:
   - Email: `test@example.com`
   - Recovery code: One of the 12-digit codes
   - New password: `RecoveredPassword123!`
   - Confirm: `RecoveredPassword123!`
5. Click "Recover & Sign In"
6. Should redirect to dashboard
7. Login with new password should work

#### 4. Test Recovery Code Reuse Protection
1. Try to use same recovery code again
2. Should get error: "Invalid or already used recovery code"

### API Testing with cURL

**Update Recovery Info:**
```bash
curl -X POST http://localhost:8000/api/personal-info/update_recovery_info/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recovery_email": "backup@example.com",
    "recovery_mobile": "+1-234-567-8900"
  }'
```

**Recovery Code Login:**
```bash
curl -X POST http://localhost:8000/api/auth/recovery-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "recovery_code": "123456789012",
    "new_password": "NewPassword123!",
    "confirm_password": "NewPassword123!"
  }'
```

## Deployment Checklist

- [ ] Database migration applied: `python manage.py migrate core`
- [ ] All backend files have no syntax errors
- [ ] Frontend components render without errors
- [ ] Test recovery information update via API
- [ ] Test recovery code login flow end-to-end
- [ ] Verify recovery codes are 12-digit only
- [ ] Verify one-time use restriction works
- [ ] Test with various email/phone formats
- [ ] User can set and update recovery options multiple times
- [ ] Recovery code login creates new JWT tokens
- [ ] Passwords are properly hashed after recovery
- [ ] Security tab no longer shows "Change Email" option

## Future Enhancements

1. **Recovery Code Management**
   - Allow users to view and regenerate codes
   - Display last 4 digits for each code
   - Show usage status

2. **Email Verification**
   - Verify recovery email with OTP before saving
   - Verify recovery phone with SMS before saving

3. **Recovery Contact Options**
   - Support multiple email/phone options
   - Primary recovery contact preference
   - Fallback contacts

4. **Security Alerts**
   - Send email when recovery code used
   - Send alert when recovery info changed
   - Suspicious activity detection

5. **Biometric Recovery**
   - Add face/fingerprint authentication as alternative
   - Browser-stored recovery tokens

6. **Two-Step Recovery**
   - Require recovery code + email verification
   - Recovery code + SMS verification
   - Time-limited recovery attempts
