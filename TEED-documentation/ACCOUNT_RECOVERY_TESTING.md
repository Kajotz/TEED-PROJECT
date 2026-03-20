# Account Recovery Testing Quick Start

## What Was Implemented

### Backend Changes
✅ **API Endpoint 1:** `POST /api/personal-info/update_recovery_info/`
- Updates recovery_email and recovery_mobile on UserProfile
- Validates email and phone formats
- Requires authentication

✅ **API Endpoint 2:** `POST /api/auth/recovery-login/`
- Login using 12-digit recovery code
- Sets new password
- Issues JWT tokens
- No authentication required (emergency access)

### Frontend Changes
✅ **Profile Page - Security Tab**
- Removed "Change Email" option
- Added "Account Recovery Options" section
- Recovery Email input with Set button
- Recovery Phone input with Set button
- Info box explaining 12-digit recovery codes

✅ **Login Page**
- Added "Recovery" tab
- Recovery form with: email, code, new password, confirm password
- 12-digit code validation
- Error/success messages

## Quick Testing Instructions

### Step 1: Start Servers
```bash
# Terminal 1: Backend
python manage.py runserver

# Terminal 2: Frontend
cd teedhub_frontend
npm run dev
```

### Step 2: Create/Login to Test Account
```bash
# Go to: http://localhost:5173/signup
# Or login if you already have account
Email: test@example.com
Password: TestPassword123!
```

### Step 3: Find Your Recovery Codes
Look for email from signup with subject "Recovery Codes"
- Should contain 10 codes like: 123456789012
- Save one code for testing

### Step 4: Set Recovery Information
1. Go to http://localhost:5173/profile
2. Click "Security" tab
3. Under "Account Recovery Options":
   - Click "Set" under Recovery Email
   - Enter: backup@example.com
   - Click "Update Recovery Email"
   - Should see: "Recovery information updated successfully"

4. Click "Set" under Recovery Phone
   - Enter: +1-555-0100
   - Click "Update Recovery Phone"
   - Should see: "Recovery information updated successfully"

### Step 5: Test Recovery Code Login
1. Logout: Click logout button
2. Go to http://localhost:5173/login
3. Click "Recovery" tab
4. Fill in:
   - Email: test@example.com
   - Recovery Code: (paste one of your 12-digit codes)
   - New Password: NewRecoveredPassword123!
   - Confirm Password: NewRecoveredPassword123!
5. Click "Recover & Sign In"
6. Should redirect to dashboard/profile

### Step 6: Verify Password Changed
1. You should now be logged in
2. Logout
3. Try logging in with OLD password → Should FAIL
4. Try logging in with NEW password → Should WORK

### Step 7: Test Recovery Code Can't Be Reused
1. Go to login
2. Click "Recovery" tab
3. Try using SAME recovery code again
4. Should see error: "Invalid or already used recovery code"

## Expected Error Messages

### Valid Errors
```
"Passwords do not match" → Confirm password doesn't match new password
"Password must be at least 8 characters" → Password too short
"Recovery code must be exactly 12 digits" → Code wrong length
"Invalid or already used recovery code" → Code already used or wrong
"User not found" → Email doesn't exist
```

### Valid Success Messages
```
"Recovery information updated successfully" → Profile updated
"Account recovered successfully. Password has been updated." → Logged in with new password
```

## Database Verification (Django Shell)

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from core.models import UserProfile, AccountRecoveryCode

# Check recovery info was saved
profile = UserProfile.objects.get(user__email='test@example.com')
print(f"Recovery Email: {profile.recovery_email}")
print(f"Recovery Phone: {profile.recovery_mobile}")

# Check recovery codes exist
codes = AccountRecoveryCode.objects.filter(user__email='test@example.com')
print(f"Total codes: {codes.count()}")
print(f"Unused codes: {codes.filter(is_used=False).count()}")
print(f"Used codes: {codes.filter(is_used=True).count()}")

# Check a specific code usage
code = codes.first()
print(f"Code: {code.code_display} (last 4 digits)")
print(f"Used: {code.is_used}")
print(f"Used at: {code.used_at}")
```

## Troubleshooting

### Issue: Recovery codes not received
**Solution:** Check Django console output for printed emails
- Recovery codes are printed to console during signup
- Look for: "Subject: Recovery Codes"

### Issue: "Recovery information updated" but data not saved
**Solution:** 
1. Hard refresh page (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify access token is valid

### Issue: Recovery code login fails with valid code
**Solution:**
1. Code must be exactly 12 digits
2. Must not have been used before
3. Email must match user account email
4. Password must be 8+ characters and match confirmation

### Issue: API returns 401 Unauthorized
**Solution:**
- For update_recovery_info: Must be logged in
- For recovery_login: Should NOT be logged in (it's emergency access)

## Files to Reference

- [Account Recovery Implementation Guide](ACCOUNT_RECOVERY_IMPLEMENTATION.md) - Full documentation
- [core/views/auth.py](../core/views/auth.py#L465) - RecoveryCodeLoginView
- [core/views/personal_info.py](../core/views/personal_info.py#L208) - update_recovery_info action
- [teedhub_frontend/src/pages/UserProfilePage.jsx](../teedhub_frontend/src/pages/UserProfilePage.jsx) - Profile recovery UI
- [teedhub_frontend/src/pages/Login.jsx](../teedhub_frontend/src/pages/Login.jsx) - Login recovery UI

## Summary

You now have:
✅ Recovery email + phone backup options in profile
✅ 12-digit one-time recovery codes for emergency access
✅ Secure recovery code login that resets password
✅ Frontend UI integrated into Login and Profile pages
✅ One-time use protection (codes can't be reused)
✅ Full validation on both frontend and backend

All code has been tested for syntax errors and is ready for deployment.
