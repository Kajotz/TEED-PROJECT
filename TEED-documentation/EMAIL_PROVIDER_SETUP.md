# Email Provider Setup Quick Start

## Choose Your Email Provider

### 🚀 Development (Testing)

**Console Backend** (Recommended for testing)
- Emails print to terminal
- No configuration needed
- Perfect for development

**Setup:**
```bash
EMAIL_PROVIDER=console
```

---

### 🍎 Apple Email (iCloud)

Best for: Apple ecosystem, TEED Hub founders

**Setup:** [Detailed Guide](./APPLE_EMAIL_SETUP.md)

Quick steps:
1. Generate app-specific password: https://appleid.apple.com
2. Set environment variables:
```bash
EMAIL_PROVIDER=apple
APPLE_EMAIL=yourname@icloud.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Pros:**
- ✅ Works with any iCloud email
- ✅ Privacy Relay support
- ✅ Sign in with Apple authentication
- ✅ No additional service needed

**Cons:**
- ❌ Max 3 simultaneous connections
- ❌ ~100 emails/minute limit
- ❌ Requires app-specific password

---

### 🔵 Gmail

Best for: Google Workspace teams, easy setup

**Setup:**
1. Enable 2-Step Verification: https://myaccount.google.com
2. Create app password: https://myaccount.google.com/apppasswords
3. Set environment variables:
```bash
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=yourname@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Pros:**
- ✅ Easy setup
- ✅ Reliable
- ✅ Google Sign In support
- ✅ No limits for personal use

**Cons:**
- ❌ Gmail filters emails heavily
- ❌ May land in spam initially
- ❌ Subject to Gmail rules

---

### 📧 SendGrid (Production Recommended)

Best for: High volume, production, deliverability

**Setup:**
1. Create account: https://sendgrid.com
2. Generate API key
3. Set environment variables:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key
```

**Install package:**
```bash
pip install sendgrid
```

**Pros:**
- ✅ High deliverability
- ✅ 100+ emails/second
- ✅ Advanced analytics
- ✅ Whitelabel domain support
- ✅ Webhook tracking
- ✅ Free tier: 100 emails/day

**Cons:**
- ❌ Paid service ($10-150+/month)
- ❌ Additional configuration

---

### 📬 Mailgun

Best for: Developers, good features, flexible pricing

**Setup:**
1. Create account: https://mailgun.com
2. Verify domain
3. Get API key
4. Set environment variables:
```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxx
MAILGUN_DOMAIN=mg.yourdomain.com
```

**Install package:**
```bash
pip install django-anymail[mailgun]
```

**Pros:**
- ✅ 10,000 emails/month free
- ✅ Good documentation
- ✅ Flexible pricing
- ✅ Event tracking
- ✅ SMTP & API both available

**Cons:**
- ❌ Requires domain setup
- ❌ Slightly more complex config

---

### 🚀 AWS SES

Best for: Large scale, AWS infrastructure

**Setup:**
1. Create AWS account
2. Request SES production access
3. Verify domain/email
4. Get access keys

**Install package:**
```bash
pip install django-anymail[amazon_ses]
```

**Pros:**
- ✅ Very low cost ($0.10/1000 emails)
- ✅ Integrated with AWS
- ✅ High volume capacity
- ✅ Bounces/complaints handling

**Cons:**
- ❌ Requires AWS account
- ❌ Domain verification needed
- ❌ Production request needed

---

## Comparison Table

| Feature | Console | Apple | Gmail | SendGrid | Mailgun | AWS SES |
|---------|---------|-------|-------|----------|---------|---------|
| **Cost** | Free | Free | Free | $10+/mo | Free | Very low |
| **Setup** | None | 5 min | 10 min | 15 min | 20 min | 30 min |
| **Volume** | N/A | 100/min | Unlimited | 100+/sec | 10k/mo free | Unlimited |
| **Dev** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Production** | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| **Deliverability** | N/A | Good | Fair | Excellent | Excellent | Excellent |
| **Tracking** | None | None | None | ✅ | ✅ | ✅ |
| **Apple Sign In** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Recommendation by Stage

### Stage 1: Development
```
Use: Console Backend
Why: No setup, emails visible in terminal
```

### Stage 2: Testing with Real Emails
```
Use: Gmail or Apple
Why: Free, easy setup, works reliably
```

### Stage 3: Small Production
```
Use: Apple (if Apple users) or Gmail
Why: Free, adequate for < 1000 users
```

### Stage 4: Growth (1000+ users)
```
Use: SendGrid or Mailgun
Why: Better deliverability, volume capacity, analytics
```

### Stage 5: Enterprise (10000+ users)
```
Use: SendGrid Enterprise or AWS SES
Why: Dedicated support, advanced features, scale
```

---

## Implementation Steps

1. **Choose your provider** (see comparison above)
2. **Setup account** (see provider links)
3. **Copy `.env.example` to `.env`**
   ```bash
   cp .env.example .env
   ```
4. **Fill in your credentials**
   ```bash
   EMAIL_PROVIDER=your_choice
   # ... provider-specific variables
   ```
5. **Test email sending**
   ```bash
   python manage.py shell
   
   from django.core.mail import send_mail
   send_mail('Test', 'Hello', 'from@email.com', ['to@email.com'])
   ```
6. **Check console** (development) or service logs (production)

---

## Troubleshooting

### "Module not found" error
```bash
# Install missing package
pip install sendgrid  # for SendGrid
pip install django-anymail  # for Mailgun/AWS
```

### "Authentication failed"
- ✅ Check credentials in `.env`
- ✅ Verify app-specific password (not regular password)
- ✅ Confirm email address matches

### Emails going to spam
- ✅ Add SPF/DKIM records (with SendGrid/Mailgun)
- ✅ Use custom domain (not @gmail.com)
- ✅ Check email content (no suspicious links)

### Emails not sending
- ✅ Check Django logs for errors
- ✅ Verify `DEBUG=False` in production
- ✅ Ensure `EMAIL_PROVIDER` is set correctly

---

## Production Email Best Practices

1. **Use dedicated service** - SendGrid, Mailgun, or AWS SES
2. **Set up SPF/DKIM/DMARC** - Prevents spoofing
3. **Use custom domain** - Not @gmail.com
4. **Monitor deliverability** - Track bounces/complaints
5. **Queue emails** - Use Celery for async sending
6. **Template emails** - Use professional templates
7. **Unsubscribe links** - Include in all emails
8. **Rate limiting** - Don't spam users

---

## Next Steps

- [Apple Email Setup](./APPLE_EMAIL_SETUP.md) - For detailed Apple configuration
- [Email Security](./EMAIL_SECURITY_IMPLEMENTATION.md) - For verification codes
- Email configuration is **complete** - Users can now verify emails and recover accounts!
