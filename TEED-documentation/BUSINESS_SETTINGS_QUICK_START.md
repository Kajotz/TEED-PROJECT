# Business Settings & Mobile Navigation - Quick Start Guide

## What's New

### 1. Mobile Navigation Dropdown ✨
- **Better mobile UX**: Replaced collapsed sidebar with a clean dropdown menu
- **Location**: Hamburger menu button on mobile devices
- **Features**: Business header, navigation items with role restrictions, auto-close on selection

### 2. Business Profile Customization 🎨
- **Logo Upload**: Upload custom business logo (PNG, JPG, GIF, WebP - max 5MB)
- **Brand Colors**: Choose primary and secondary colors with live preview
- **Business Info**: Add description, contact details, and website
- **Live Preview**: See changes in real-time before saving

---

## Getting Started

### For Users: Adding Brand Customization

#### Step 1: Navigate to Business Settings
1. Go to your business workspace
2. Click the **Settings** menu item in the sidebar
3. URL: `/business/{businessId}/settings`

#### Step 2: Customize Your Profile

**Logo Upload:**
- Click "Upload Logo" button
- Select image file (JPG, PNG, GIF, WebP)
- Image previews immediately
- File must be under 5MB

**Brand Colors:**
- Click color picker for Primary Color
- Select desired color (or paste hex code like `#1F75FE`)
- Click color picker for Secondary Color  
- Watch live preview update on the right

**Business Information:**
- Add description in "About" field
- Enter contact email
- Add phone number
- Paste website URL

#### Step 3: Save & Deploy
- Click "Save Changes" button
- Green success notification appears
- Automatically redirects to Overview
- New branding is live!

---

## For Developers: Implementation Details

### Frontend Components

#### BusinessSettings Component (`teedhub_frontend/src/pages/Business/BusinessSettings.jsx`)
- Full-page settings form with live preview
- Responsive layout: 1 col mobile → 3 cols desktop
- Sticky preview panel on desktop
- Framer Motion animations
- Toast notifications for feedback

**File Structure:**
```
Form Section (Left, 2/3 width):
├── Logo Upload
├── Brand Colors
└── Business Information

Preview Section (Right, 1/3 width):
├── Workspace Header Mockup
├── Color Swatches
├── Button Examples
└── Gradient Preview
```

#### BusinessWorkspace Integration
- Settings now appears in navigation (available: true)
- Restricted to owner/admin roles
- Seamless navigation from overview/other pages

### Backend Components

#### Database
```python
# No migrations needed - already in BusinessProfile model
logo = ImageField(upload_to="business/logos/")
primary_color = CharField(max_length=7)      # e.g., #1F75FE
secondary_color = CharField(max_length=7)    # e.g., #f2a705
```

#### Django Form (`core/forms.py` - `BusinessProfileForm`)
- Color picker widget with validation
- File upload validation (size, type, mimetype)
- Hex color format validation (#RRGGBB or #RGB)

#### Views (`core/views/business.py`)

**Template-Based View** (`BusinessSettingsView`):
- For traditional Django page rendering
- GET: Display form
- POST: Save data + redirect

**REST API View** (`BusinessProfileAPIView`):
- For React frontend communication
- GET: Return JSON profile data
- POST: Accept FormData with file upload

#### Routes (`core/urls.py`)
```python
# Template view (alternative to React)
path('businesses/<uuid:business_id>/settings/', 
     BusinessSettingsView.as_view())

# REST API (used by React)
path('businesses/<uuid:business_id>/profile/', 
     BusinessProfileAPIView.as_view())
```

---

## API Usage Examples

### Get Current Profile (React)
```javascript
const response = await fetch(
  `/api/businesses/${businessId}/profile/`,
  {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  }
);
const profile = await response.json();
console.log(profile.primary_color); // "#1F75FE"
```

### Update Profile (React)
```javascript
const formData = new FormData();
formData.append('logo', logoFile);
formData.append('primary_color', '#1F75FE');
formData.append('secondary_color', '#f2a705');
formData.append('about', 'My business description');

const response = await fetch(
  `/api/businesses/${businessId}/profile/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: formData
  }
);
```

---

## File Uploads

### Security
- ✅ File type validation (whitelist: jpg, png, gif, webp)
- ✅ File size limit (5MB max)
- ✅ MIME type checking
- ✅ Permission checks (owner/admin only)
- ✅ CSRF protection

### Storage Location
- Development: `media/business/logos/`
- Production: Configure to use cloud storage (S3, etc.)

### Public URLs
```
/media/business/logos/my-company-logo.png
```

---

## Mobile Navigation

### Desktop View
- Full sidebar always visible (hidden < md breakpoint)
- Smooth width animations

### Mobile View (< md breakpoint)
- Hamburger menu button
- Click to toggle dropdown menu
- Dropdown appears below header
- Click menu item to navigate + auto-close dropdown
- Full business context in dropdown header

**Mobile Dropdown Features:**
- Business name and type in header
- Navigation items with icons
- Help icons for unavailable features
- "Switch Business" footer button
- Dark mode support
- Touch-friendly spacing

---

## Troubleshooting

### Logo Won't Upload
```
Error: "File size must be less than 5MB"
→ Compress image before uploading

Error: "Invalid file format"
→ Use: JPG, PNG, GIF, or WebP

Error: "Permission denied"
→ Only owner/admin can upload
```

### Colors Not Saving
```
Error: "Invalid color format"
→ Use hex format: #1F75FE (# followed by 6 hex digits)
```

### Settings Page Not Found
```
404 Error
→ Check URL: /business/{businessId}/settings
→ Verify business exists and you're a member
```

### Mobile Menu Not Appearing
```
Mobile menu not showing
→ Make sure you're on < md screen size (< 768px)
→ Click hamburger (≡) icon in top left
```

---

## URL Reference

### Settings Access
| Context | URL | Access |
|---------|-----|--------|
| Business workspace | `/business/{businessId}/settings` | React component |
| Django admin | `/admin/core/businessprofile/` | Admin only |
| Direct API | `/api/businesses/{businessId}/profile/` | JSON REST |

---

## Color Hex Reference

### Default Colors
- **Primary**: `#1F75FE` (Blue) - Buttons, primary actions, links
- **Secondary**: `#f2a705` (Gold) - Highlights, secondary actions
- **Dark BG**: `#1E1E1E` - Dark mode backgrounds

### Popular Colors
- Professional Blue: `#1F75FE`
- Accent Gold: `#f2a705`
- Error Red: `#EF4444`
- Success Green: `#10B981`
- Warning Yellow: `#F59E0B`

---

## Testing Checklist

- [ ] Can upload logo on mobile and desktop
- [ ] Color picker works and syncs with hex input
- [ ] Live preview updates in real-time
- [ ] Form validation prevents invalid data
- [ ] Only owner/admin can access settings
- [ ] Mobile dropdown opens/closes
- [ ] Dropdown closes when selecting menu item
- [ ] Dark mode colors display correctly
- [ ] Success notification shows on save
- [ ] Profile data loads on mount
- [ ] Toast shows error if save fails
- [ ] Responsive layout works on all sizes

---

## Performance Tips

1. **Optimize Images**
   - Compress logo before uploading
   - Use PNG for logos with transparency
   - JPG for photos

2. **Browser Caching**
   - Images are cached by browser
   - Color changes are instant (no API call for preview)
   - Reload only when saving

3. **Load Times**
   - Profile loads with workspace on first visit
   - Settings page loads fast (no heavy components)
   - Preview is real-time (client-side calculation)

---

## Next Steps

### Features Coming Soon
- [ ] Theme templates (pre-designed schemes)
- [ ] Logo cropping tool
- [ ] Font customization
- [ ] Social media links display
- [ ] Business profile page (public view)

### For Developers
- Review the BUSINESS_PROFILE_IMPLEMENTATION.md for detailed documentation
- Check code comments for implementation details
- Test all validation rules before customization

---

## Support & Feedback

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Verify user permissions (owner/admin required)
4. Clear browser cache and reload
5. Check file size and format for uploads

---

**Last Updated**: February 26, 2026  
**Implementation Status**: ✅ Complete & Production-Ready  
**Mobile Support**: ✅ Full responsive design  
**Dark Mode**: ✅ Fully supported
