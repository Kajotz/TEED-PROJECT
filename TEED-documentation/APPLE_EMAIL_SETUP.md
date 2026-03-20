# Apple Email & Sign In with Apple Setup Guide

## Overview

TEED Hub now fully supports Apple email accounts:
- ✅ iCloud email (@icloud.com)
- ✅ Apple Mail with custom domains
- ✅ Apple Mail Privacy Relay
- ✅ Sign in with Apple authentication

## Part 1: Apple Email SMTP Configuration

### For Sending Emails from Apple Email Accounts

#### Prerequisites
- Apple email account (iCloud or custom domain with iCloud Mail)
- App-specific password (not your regular Apple password)

#### Step 1: Generate App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Click "Security" or "Sign-In and Security"
4. Scroll to "App-Specific Passwords"
5. Click "Generate an app-specific password"
6. Select "Other (specify name)" → Enter "TEED Hub" → Generate
7. Copy the generated 16-character password

#### Step 2: Configure Environment Variables

Create `.env` file in project root:

```bash
# Email Provider Selection
EMAIL_PROVIDER=apple

# Apple Email Configuration
APPLE_EMAIL=yourname@icloud.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Sender Email (can be different from APPLE_EMAIL)
DEFAULT_FROM_EMAIL=noreply@teedhub.app
```

#### Step 3: Test Email Sending

Run Django shell:
```bash
python manage.py shell
```

```python
from django.core.mail import send_mail

send_mail(
    subject='TEED Hub Test Email',
    message='If you see this, email is working!',
    from_email='yourname@icloud.com',
    recipient_list=['recipient@example.com'],
)
```

Check console output for success.

### Apple Email SMTP Settings Reference

| Setting | Value |
|---------|-------|
| **SMTP Server** | `smtp.mail.icloud.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **Encryption** | TLS (recommended) |
| **Username** | Your full iCloud email |
| **Password** | App-specific password (16 chars) |
| **Connection Limit** | Max 3 simultaneous |
| **Authentication** | PLAIN (after TLS) |

### Important Notes

⚠️ **App-Specific Passwords**
- NOT your regular Apple password
- 16 characters long
- Can be regenerated anytime
- One per app/device combo

⚠️ **Connection Limits**
- iCloud Mail allows max 3 simultaneous SMTP connections
- Implement connection pooling for high volume
- Use queue system for sending at scale

⚠️ **Rate Limits**
- Max ~100 emails per minute per account
- Implement exponential backoff for retries
- Use dedicated transactional email service for production

### Production Recommendation

For production, use **Sendgrid**, **Mailgun**, or **AWS SES** instead:

```bash
# SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx

# Mailgun
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.teedhub.app

# AWS SES
EMAIL_PROVIDER=aws_ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

## Part 2: Sign In with Apple

### Prerequisites for Sign in with Apple

1. Apple Developer account ($99/year)
2. Enrolled in Apple Developer Program
3. Created App ID for TEED Hub
4. Sign in with Apple capability enabled

### Step 1: Create App ID and Configure Sign in with Apple

#### On Apple Developer Console

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
4. Click "+" to create new App ID
5. Enter **Bundle ID**: `com.teedhub.app` (or your domain)
6. Select "App IDs"
7. Configure:
   - **App Name**: TEED Hub
   - **Prefix**: Select Team ID
   - **Capabilities**: Check "Sign in with Apple"

#### Step 2: Create Service ID

1. In Identifiers section, click "+"
2. Select **Service IDs**
3. Enter:
   - **Service ID**: `com.teedhub.app.web`
   - **Description**: TEED Hub Web Service
4. Check "Sign in with Apple"
5. Click Configure
6. Add **Return URLs**:
   ```
   https://localhost:8000/accounts/apple/login/callback/
   https://yourdomain.com/accounts/apple/login/callback/
   https://api.yourdomain.com/accounts/apple/login/callback/
   ```
7. Save

#### Step 3: Create Private Key

1. Go to **Keys** section
2. Click "+"
3. Enter **Key Name**: TEED Hub Sign in with Apple
4. Check "Sign in with Apple" capability
5. Click Register
6. Download the private key (`.p8` file) - **save securely!**
7. Note the **Key ID** (shown on screen)

#### Step 4: Get Team ID

1. In top-right corner, click your profile
2. See your **Team ID** (e.g., `ABC123DEFG`)

### Step 2: Configure Django Settings

Update `.env` file:

```bash
# Sign in with Apple
APPLE_CLIENT_ID=com.teedhub.app.web
APPLE_TEAM_ID=ABC123DEFG
APPLE_KEY_ID=ABCD1EFGH
APPLE_SECRET=<contents of .p8 file>
APPLE_APP_ID=com.teedhub.app
```

### Step 3: Update Django Settings

Already configured in [teedhub_backend/settings.py](../teedhub_backend/settings.py), but verify:

```python
SOCIALACCOUNT_PROVIDERS = {
    'apple': {
        'APP': {
            'client_id': os.getenv('APPLE_CLIENT_ID'),
            'secret': os.getenv('APPLE_SECRET'),
            'key': os.getenv('APPLE_KEY_ID'),
        },
        'SETTINGS': {
            'TEAM_ID': os.getenv('APPLE_TEAM_ID'),
            'KEY_ID': os.getenv('APPLE_KEY_ID'),
        }
    }
}
```

### Step 4: Frontend Integration

In React, add Sign in with Apple button:

```jsx
import { AppleAuthButton } from './components/SocialAuth';

export function LoginPage() {
  return (
    <div>
      <AppleAuthButton 
        onSuccess={(data) => handleAppleSignIn(data)}
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
```

### Step 5: Handle Apple Sign In Callback

Add endpoint to handle Apple's callback:

```python
# In core/views/auth.py
from allauth.socialaccount.views import SocialLoginView

class AppleSignInView(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
```

---

## Part 3: Apple Mail Privacy Relay

### What is Mail Privacy Relay?

Users can hide their real email address using Apple's Mail Privacy Relay feature. Your app receives:
- Relay email: `user123@privaterelay.icloud.com`
- Real email: Hidden (user controls sharing)

### Handling Privacy Relay Emails

#### In Your Signup Flow

1. **Accept relay email** - Can verify and use immediately
2. **Request real email** - User can choose to share
3. **Store mapping** - Link relay to real email if shared

#### Database Handling

The existing `EmailVerification` model handles this:

```python
# User signs up with Privacy Relay
EmailVerification.create_for_email('user123@privaterelay.icloud.com')

# Later, if user shares real email via Apple's auth
UserProfile.objects.update(
    email_verified=True,
    real_email='realuser@icloud.com'
)
```

### Frontend Considerations

In your Sign in with Apple handler:

```javascript
async function handleAppleSignIn(response) {
  const { user, code } = response;
  
  // Apple provides:
  // - id_token (contains user info)
  // - user object (name, email - only on first auth)
  
  // Email might be relay: user123@privaterelay.icloud.com
  const email = user.email;
  const isPrivacyRelay = email.includes('@privaterelay.icloud.com');
  
  if (isPrivacyRelay) {
    // Flag for user: "We received a privacy relay email..."
    setRelayWarning(true);
  }
  
  // Continue with normal signup
  await signupUser(email);
}
```

---

## Part 4: Environment Variables Reference

### Complete `.env` Example

```bash
# ============================================================
# EMAIL CONFIGURATION
# ============================================================

# Email Provider: console, gmail, apple, sendgrid, mailgun
EMAIL_PROVIDER=apple

# Apple Email (Sender)
APPLE_EMAIL=sender@icloud.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Default From Email
DEFAULT_FROM_EMAIL=noreply@teedhub.app

# Email Verification Timeout (hours)
EMAIL_VERIFICATION_TIMEOUT=24
MAX_VERIFICATION_ATTEMPTS=5

# ============================================================
# SIGN IN WITH APPLE
# ============================================================

APPLE_CLIENT_ID=com.teedhub.app.web
APPLE_TEAM_ID=ABC123DEFG
APPLE_KEY_ID=ABCD1EFGH
APPLE_SECRET=-----BEGIN PRIVATE KEY-----\nMIEv...base64 content...\n-----END PRIVATE KEY-----
APPLE_APP_ID=com.teedhub.app

# ============================================================
# ALTERNATIVE PROVIDERS
# ============================================================

# Gmail
# GMAIL_EMAIL=sender@gmail.com
# GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# SendGrid
# SENDGRID_API_KEY=SG.xxxxx

# Mailgun
# MAILGUN_API_KEY=key-xxx
# MAILGUN_DOMAIN=mg.teedhub.app
```

---

## Testing Email Configuration

### Test 1: Apple SMTP Directly

```bash
# Using telnet or Python
python -c "
import smtplib

server = smtplib.SMTP('smtp.mail.icloud.com', 587)
server.starttls()
server.login('your@icloud.com', 'app-specific-password')
print('✅ SMTP Connection Successful')
server.quit()
"
```

### Test 2: Django Email

```bash
python manage.py shell
```

```python
from django.core.mail import send_mail

result = send_mail(
    'Test Subject',
    'Test message body',
    'your@icloud.com',
    ['recipient@example.com'],
)

print(f'Emails sent: {result}')
```

### Test 3: Apple Sign In Flow

1. Open your frontend
2. Click "Sign in with Apple" button
3. You should be redirected to Apple's login
4. After approval, redirected back with auth token
5. User should be created/logged in

---

## Troubleshooting

### "Invalid app-specific password"

❌ Using regular Apple password instead of app-specific password
✅ Generate new app-specific password from appleid.apple.com

### "Authentication failed"

❌ App-specific password expired or revoked
✅ Generate a new one and update `.env`

❌ Using Apple ID email instead of iCloud email
✅ Use full email address: `yourname@icloud.com`

### "Too many connections"

❌ Opening more than 3 simultaneous SMTP connections
✅ Use connection pooling or email queue (Celery)

### Sign in with Apple not working

❌ Return URL not registered in Apple Developer Console
✅ Add your domain's callback URL: `https://yourdomain.com/accounts/apple/login/callback/`

❌ Private key expired
✅ Generate new key in Apple Developer Console

### "Invalid client_id"

❌ Using Bundle ID instead of Service ID
✅ Use Service ID: `com.teedhub.app.web`

---

## Production Checklist

- [ ] Apple Developer account created
- [ ] App ID and Service ID created
- [ ] Private key generated and stored securely
- [ ] Return URLs registered
- [ ] Environment variables configured
- [ ] Email tested from Apple account
- [ ] Sign in with Apple button added to frontend
- [ ] Callback URL configured in backend
- [ ] User privacy relay handling implemented
- [ ] Rate limiting implemented
- [ ] Error logging for email failures
- [ ] Security audit completed

---

## Security Best Practices

✅ **Never commit credentials**
- Keep `.env` file in `.gitignore`
- Use environment variables only
- Rotate secrets regularly

✅ **Secure private key**
- Store `.p8` file securely
- Use secrets management (AWS Secrets, Vault)
- Rotate annually

✅ **HTTPS required**
- Apple Sign in requires HTTPS
- Credentials transmitted over TLS
- No development on HTTP

✅ **Privacy respect**
- Honor Mail Privacy Relay preference
- Don't force email sharing
- Transparent data usage

---

## References

- [Apple Developer - Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Apple iCloud Mail SMTP](https://support.apple.com/en-us/HT202011)
- [Django-allauth Apple Provider](https://django-allauth.readthedocs.io/en/latest/providers.html#apple)
- [Mail Privacy Relay](https://support.apple.com/en-us/HT210318)
