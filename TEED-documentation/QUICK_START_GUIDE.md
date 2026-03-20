# TEED Hub - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

## Backend Setup

### 1. Navigate to Project
```bash
cd "c:\Users\jacktech\Desktop\TEED PROJECT"
```

### 2. Activate Virtual Environment
```bash
# Windows
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate
```

### 3. Run Database Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 5. Start Backend Server
```bash
python manage.py runserver
```
✅ Backend running at: `http://localhost:8000`

---

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd teedhub_frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create `.env` file in `teedhub_frontend/`:
```
VITE_API_URL=http://localhost:8000
```

### 4. Start Development Server
```bash
npm run dev
```
✅ Frontend running at: `http://localhost:5173`

---

## Testing the System

### 1. Create Account
- Go to `http://localhost:5173`
- Click "Sign Up"
- Enter email and password
- Submit

### 2. Auto-redirect to Profile
- You'll be redirected to `/profile`
- You're on the **Personal Info** tab

### 3. Complete Personal Information
- Fill in username, phone, country
- Add your bio and website
- Upload profile image (optional)
- Click "Save Changes"

### 4. Create Business
- Go to **Businesses** tab
- Click "Create Business"
- Fill in business details

### 5. Link Social Accounts
- Go to business profile
- Scroll down to "Social Media Accounts"
- Click "Add Account"
- Select platform
- Enter username and URL
- Linked!

---

## API Endpoints Quick Reference

### Personal Info
```
GET    /api/personal-info/get_personal_info/
PATCH  /api/personal-info/update_personal_info/
POST   /api/personal-info/change-password/
POST   /api/personal-info/upload-profile-image/
POST   /api/personal-info/update-email/
```

### Social Accounts
```
GET    /api/social-accounts/
POST   /api/social-accounts/
GET    /api/social-accounts/{id}/
PUT    /api/social-accounts/{id}/
DELETE /api/social-accounts/{id}/
POST   /api/social-accounts/{id}/sync/
POST   /api/social-accounts/{id}/disconnect/
GET    /api/social-accounts/by_business/?business_id={id}
GET    /api/social-accounts/by_platform/?platform={name}
```

---

## Common Commands

### Backend
```bash
# Check for errors
python manage.py check

# Create new migration
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access admin panel
# Visit: http://localhost:8000/admin

# Run tests
python manage.py test

# Shell access
python manage.py shell
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## File Structure

```
TEED PROJECT/
├── core/
│   ├── models/
│   │   ├── user_profile.py (NEW)
│   │   ├── social_account.py (NEW)
│   │   ├── business.py
│   │   └── ...
│   ├── views/
│   │   ├── personal_info.py (NEW)
│   │   ├── auth.py
│   │   └── ...
│   ├── serializers.py (UPDATED)
│   ├── urls.py (UPDATED)
│   └── migrations/
│       └── 0002_socialaccount_userprofile.py (NEW)
│
├── teedhub_frontend/
│   └── src/
│       ├── components/
│       │   ├── PersonalInfo.jsx (NEW)
│       │   ├── SocialAccountManager.jsx (NEW)
│       │   └── ...
│       ├── pages/
│       │   ├── Profile.jsx (UPDATED)
│       │   └── ...
│       └── ...
│
└── TEED-documentation/
    ├── SYSTEM_REDESIGN.md (NEW)
    ├── API_DOCUMENTATION.md (NEW)
    └── FRONTEND_INTEGRATION_GUIDE.md (NEW)
```

---

## Troubleshooting

### Backend Issues

**Error: "ModuleNotFoundError: No module named 'django'"**
```bash
pip install -r requirements.txt
```

**Error: "port 8000 already in use"**
```bash
python manage.py runserver 8001
```

**Error: "no such table"**
```bash
python manage.py migrate
```

### Frontend Issues

**Error: "Cannot find module"**
```bash
npm install
```

**Error: "VITE_API_URL is undefined"**
```bash
# Create .env file with:
VITE_API_URL=http://localhost:8000
```

**Port 5173 already in use**
```bash
npm run dev -- --port 5174
```

---

## Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=TEED Hub
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Supported Platforms (15)

1. Instagram
2. Facebook
3. TikTok
4. YouTube
5. Twitter/X
6. LinkedIn
7. Pinterest
8. Snapchat
9. WhatsApp
10. Telegram
11. Discord
12. Twitch
13. Reddit
14. Tumblr
15. Threads

---

## Countries Supported (27)

US, Canada, UK, Australia, India, Nigeria, South Africa, Kenya, Ghana, Uganda, Pakistan, Bangladesh, Brazil, Mexico, Germany, France, Italy, Spain, Japan, China, Singapore, Malaysia, Philippines, Thailand, Indonesia, Vietnam, Other

---

## Key Features

✅ **Authentication**
- Email/password signup & login
- JWT token-based auth
- Session management

✅ **Personal Profile**
- Display personal information
- Edit profile details
- Upload profile image
- Select country from 27 options
- Add contact information

✅ **Business Management**
- Create business profiles
- Multiple businesses per user
- Manage business details

✅ **Social Media Management**
- Link 15 different platforms
- Track followers count
- Store OAuth tokens
- Connection status monitoring
- Safe disconnect option
- Sync account data

✅ **Security**
- Password change functionality
- Account status display
- Permission-based access control
- Image upload validation

✅ **UI/UX**
- Brand colors (Navy #1F75FE, Orange #f2a705)
- Dark mode support
- Responsive mobile design
- Smooth animations
- Error/success messaging

---

## Documentation

1. **SYSTEM_REDESIGN.md** - Complete feature overview
2. **API_DOCUMENTATION.md** - Full API reference
3. **FRONTEND_INTEGRATION_GUIDE.md** - Component guide

---

## Next Steps

1. ✅ System setup complete
2. → Phase 2: OAuth Integration
3. → Phase 3: Social Media Management
4. → Phase 4: Analytics Dashboard

---

## Support

For issues or questions:
1. Check documentation files in `TEED-documentation/`
2. Review API_DOCUMENTATION.md for endpoint details
3. Check component usage in FRONTEND_INTEGRATION_GUIDE.md

---

**Last Updated**: January 15, 2024
**Status**: ✅ Ready for Development
