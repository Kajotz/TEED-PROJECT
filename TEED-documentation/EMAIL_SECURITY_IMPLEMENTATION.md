# Email Verification & Account Recovery Security Implementation

## Overview

TEED Hub now has enterprise-grade email verification and account recovery mechanisms to protect user accounts from unauthorized access.

## Features

### 1. Email Verification During Signup
- **6-digit verification codes** sent to user's email
- **24-hour expiration** - codes automatically expire
- **Rate limiting** - max 5 verification attempts before code becomes invalid
- **One-time use** - codes can only be verified once
- **Unique codes** - each verification gets a fresh code

### 2. Account Recovery Codes
- **12-digit recovery codes** generated during signup
- **10 codes per account** - users get 10 recovery codes
- **One-time use only** - each code can only be used once
- **Hashed storage** - codes stored as SHA256 hashes (never plaintext)
- **Regeneration** - users can regenerate codes anytime
- **Reference display** - users see last 4 digits for identification

### 3. Recovery Contacts
- **Alternate email** - users can set a backup email address
- **Phone number** - users can set a phone number for recovery
- **Verification required** - contacts must be verified before use
- **Primary contact** - users designate primary recovery method
- **One per type** - maximum one email and one phone per account

### 4. Security Features

#### Protection Against Brute Force
- **Attempt limiting** - maximum 5 failed attempts before lockout
- **Rate limiting** - implemented at API level
- **Code expiration** - automatic expiration after timeout
- **Hashed codes** - recovery codes never stored in plaintext

#### Email Security
- **HTML emails** - professional formatted emails
- **Code formatting** - large clear display of codes
- **Warnings** - security warnings about code protection
- **Notifications** - users notified of account recovery attempts

#### Password Security
- **Minimum 8 characters** - enforced for all passwords
- **Confirmation** - password must be entered twice
- **One-time recovery** - can only recover once per code
- **Notification** - users alerted when account recovered

## Database Schema

### EmailVerification Table
```
- id (UUID, PK)
- email (Email, indexed)
- verification_code (String, unique)
- is_verified (Boolean)
- attempts (Integer) - failed attempts counter
- created_at (DateTime)
- expires_at (DateTime)
- verified_at (DateTime, nullable)
```

### AccountRecoveryCode Table
```
- id (UUID, PK)
- user (FK to User)
- code_hash (String, unique, SHA256 hashed)
- code_display (String) - last 4 digits for reference
- is_used (Boolean)
- used_at (DateTime, nullable)
- created_at (DateTime)

Indexes:
- (user, is_used) - find unused codes for user
- code_hash - fast lookup during recovery
```

### RecoveryContact Table
```
- id (UUID, PK)
- user (FK to User)
- contact_type (Enum: 'email', 'phone')
- contact_value (String, indexed)
- is_verified (Boolean)
- is_primary (Boolean)
- verification_code (String, nullable)
- verification_attempts (Integer)
- created_at (DateTime)
- verified_at (DateTime, nullable)

Unique constraint: (user, contact_type)
Indexes:
- (user, is_verified)
- contact_value
```

## API Endpoints

### Email Verification

**Send verification code:**
```
POST /api/auth/email-verification/
Content-Type: application/json

{
  "action": "send",
  "email": "user@example.com"
}

Response:
{
  "message": "Verification code sent to user@example.com",
  "email": "user@example.com",
  "expires_in": 86400
}
```

**Verify email:**
```
POST /api/auth/email-verification/
Content-Type: application/json

{
  "action": "verify",
  "email": "user@example.com",
  "verification_code": "123456"
}

Response:
{
  "message": "Email verified successfully!",
  "email": "user@example.com",
  "verified_at": "2024-02-16T10:30:00Z"
}
```

### Account Recovery

**Recover account:**
```
POST /api/auth/account-recovery/
Content-Type: application/json

{
  "recovery_code": "123456789012",
  "new_password": "NewSecurePassword123",
  "confirm_password": "NewSecurePassword123"
}

Response:
{
  "message": "Account recovered successfully! Please log in with your new password.",
  "redirect_to": "/login"
}
```

### Recovery Contacts

**Get recovery contacts:**
```
GET /api/auth/recovery-contacts/
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "contact_type": "email",
    "contact_value": "al***@example.com",
    "is_verified": true,
    "is_primary": true,
    "created_at": "2024-02-16T10:30:00Z"
  }
]
```

**Add recovery contact:**
```
POST /api/auth/recovery-contacts/
Authorization: Bearer {token}
Content-Type: application/json

{
  "contact_type": "email",
  "contact_value": "backup@example.com"
}

Response:
{
  "message": "Verification code sent to email.",
  "id": "uuid",
  "contact_type": "email",
  "requires_verification": true
}
```

**Verify recovery contact:**
```
PATCH /api/auth/recovery-contacts/{contact_id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "verify",
  "code": "123456"
}

Response:
{
  "message": "Recovery contact verified successfully."
}
```

**Set primary recovery contact:**
```
PATCH /api/auth/recovery-contacts/{contact_id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "set_primary"
}

Response:
{
  "message": "Primary recovery contact updated."
}
```

**Delete recovery contact:**
```
DELETE /api/auth/recovery-contacts/{contact_id}/
Authorization: Bearer {token}

Response:
{
  "message": "Recovery contact removed."
}
```

## Email Configuration

### Development (Console Backend)
Email codes are printed to console instead of being sent:
```
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### Production (SMTP)
Configure via environment variables:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@teedhub.app
```

Or use Sendgrid, Mailgun, AWS SES, etc.

## Security Best Practices

### For Users
1. **Save recovery codes** - keep them in a safe place (password manager, printed)
2. **Never share codes** - don't give recovery codes to anyone
3. **Use strong passwords** - minimum 8 characters, mix of types
4. **Verify contacts** - add and verify recovery email/phone
5. **Check alerts** - review login notifications

### For Developers
1. **Never log codes** - never print full recovery codes to logs
2. **Hash before storage** - always hash recovery codes
3. **Rate limit** - implement attempt limits
4. **Expire tokens** - verification codes must expire
5. **HTTPS only** - never transmit codes over HTTP
6. **Audit logs** - log all recovery attempts

## Failure Scenarios

### What happens if user loses email?
1. User navigates to account recovery page
2. User enters any valid recovery code
3. User sets new password
4. Account is unlocked with new password
5. User updates email address to new email
6. User receives recovery code list again (new codes generated)

### What happens if recovery codes are lost?
1. User adds alternate email or phone
2. Uses that to verify identity
3. Gets new set of recovery codes
4. Should download/print them immediately

### What happens if all security methods are lost?
1. User contacts support
2. Support verifies user identity (questions, docs, etc.)
3. Support can manually unlock account
4. User receives new recovery codes

## Monitoring & Alerts

The system logs:
- ✅ Verification code sends
- ✅ Email verification completions
- ✅ Failed verification attempts
- ⚠️ Too many failed attempts (rate limit)
- ⚠️ Account recovery used (potential compromise alert)
- ⚠️ Invalid recovery code attempts

Monitor logs for suspicious patterns:
- Multiple failed verifications from same email
- Multiple recovery attempts in short time
- Recovery codes used from unusual locations

## Future Enhancements

1. **Two-factor authentication (2FA)** - TOTP codes
2. **SMS notifications** - send codes via SMS
3. **Device fingerprinting** - track recovery from different devices
4. **Passwordless login** - magic link authentication
5. **Biometric recovery** - fingerprint/face ID backup
6. **Geographic alerts** - alert if recovery from new location
7. **IP whitelisting** - lock account to known IP addresses

## Compliance

This implementation helps with:
- ✅ GDPR - user data protection
- ✅ CCPA - user privacy rights
- ✅ SOC 2 - access controls
- ✅ PCI DSS - secure authentication
- ✅ ISO 27001 - information security
