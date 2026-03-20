# Email Verification Testing Guide - Development Mode

## Quick Testing Methods

### Method 1: Debug Code Viewer (EASIEST - Frontend)
1. **Start the servers:**
   ```bash
   # Terminal 1: Backend
   python manage.py runserver

   # Terminal 2: Frontend  
   cd teedhub_frontend
   npm run dev
   ```

2. **In the signup page:**
   - Fill in email and password
   - Click "Create Account"
   - After getting the "code sent" message, you'll see the verification form
   - Click the **"Get Code"** button (yellow box at bottom, dev mode only)
   - The verification code will appear in a box - copy it
   - Paste it into the verification code input
   - Click "Verify Email"

**Why this works:**
- Frontend debug endpoint calls `/api/auth/email-verification/debug/?email=your@email.com`
- Returns the code from the database without sending emails
- Only works in development (removed in production)

---

### Method 2: Check Server Terminal (Console Backend)
1. **Start Django:**
   ```bash
   python manage.py runserver
   ```

2. **Signup normally:**
   - Fill email and password
   - Click "Create Account"

3. **Look at the Django terminal output:**
   - You'll see the full email printed, including:
   ```
   Content-Type: text/plain
   Subject: TEED Hub - Email Verification Code
   
   Your verification code is: 123456
   ```
   - Copy the 6-digit code
   - Paste it in the verification form

**Why this works:**
- `settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`
- Prints all emails to console instead of sending
- Perfect for development

---

### Method 3: Configure Real Email (Optional)
If you want to test with real emails, set up one of these providers:

#### Gmail:
```env
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # 16-char app password from Google
```

**Get Gmail app password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Use it in `GMAIL_APP_PASSWORD`

#### Apple Mail:
```env
EMAIL_PROVIDER=apple
APPLE_EMAIL=your@icloud.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
```

**Get Apple app password:**
1. Go to https://appleid.apple.com/account
2. Sign in
3. Security → App-Specific Passwords
4. Generate new password for "Mail"

#### SendGrid:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
```

---

## Testing Checklist

### Step 1: Signup Request
- [ ] Enter email and password
- [ ] Click "Create Account"
- [ ] See "Verification code sent to your@email.com" message
- [ ] Verification form appears

### Step 2: Get the Code
- [ ] Use **"Get Code"** button (recommended, easiest)
- [ ] OR check Django terminal for printed email
- [ ] Code is 6 digits

### Step 3: Verify Code
- [ ] Enter code in the verification input
- [ ] Click "Verify Email"
- [ ] See success message
- [ ] Redirected to dashboard/profile

### Step 4: Login
- [ ] Go to login page
- [ ] Use same email and password
- [ ] Should login successfully with verified email

### Step 5: Try Unverified Login (Optional)
To test that unverified accounts can't login:
1. Create a user manually in Django shell:
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth.models import User
   from core.models.user_profile import UserProfile
   
   user = User.objects.create_user(
       email='unverified@test.com',
       username='unverified',
       password='Password123!'
   )
   profile = UserProfile.objects.create(
       user=user,
       email_verified=False  # Not verified
   )
   ```

2. Try to login - should get error:
   ```json
   {
     "error": "Email not verified",
     "next_step": "verify_email"
   }
   ```

---

## Troubleshooting

### "No code found for this email"
- Make sure you entered the email before clicking "Create Account"
- Check that the signup response showed "Verification code sent"
- Try refreshing the page and trying again

### Verification code expired
- Codes expire after 24 hours
- Request a new code by clicking "Back to signup"
- Then go through the process again

### Can't see Django terminal output
- Make sure you're running: `python manage.py runserver`
- Not: `python manage.py runserver --nothreading` (this can hide output)
- Check if output is being buffered - try `python -u manage.py runserver`

### Still not receiving emails with real email provider?
1. Check you set `EMAIL_PROVIDER` correctly in `.env`
2. Verify credentials are correct
3. Check `.env` is in root project directory
4. Restart Django after changing `.env`
5. Look at Django terminal for email send errors

---

## Environment Setup (.env)

Create a `.env` file in project root:

```env
# Development settings
DEBUG=True

# Email backend (console for dev, smtp for prod)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_PROVIDER=console

# Or use one of these:
# EMAIL_PROVIDER=gmail
# EMAIL_PROVIDER=apple
# EMAIL_PROVIDER=sendgrid
# EMAIL_PROVIDER=mailgun
# EMAIL_PROVIDER=aws_ses

# Email sender
DEFAULT_FROM_EMAIL=noreply@teedhub.app

# Gmail credentials (if using gmail)
# GMAIL_EMAIL=your-email@gmail.com
# GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Apple credentials (if using apple)
# APPLE_EMAIL=your@icloud.com
# APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

---

## Quick Start (Recommended)

1. **Make sure `.env` has:**
   ```
   DEBUG=True
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   ```

2. **Start Django:**
   ```
   python manage.py runserver
   ```

3. **Go to signup, fill form, click create**

4. **When verification form appears, click "Get Code"** (DEV MODE)

5. **Enter code and verify**

That's it! You're now testing the complete 2-step email verification flow.
