# Business Profile Customization & Mobile Navigation - Implementation Guide

## Overview

This document outlines the implementation of two major features:
1. **Mobile Navigation Dropdown** - Improved UX for mobile users with dropdown menu navigation
2. **Business Profile Customization** - Full branding and profile customization system for business organizations

---

## Part 1: Mobile Navigation Dropdown

### Changes Made

#### Frontend: `teedhub_frontend/src/pages/BusinessWorkspace.jsx`

**What Changed:**
- Replaced the mobile sidebar collapse behavior with a dropdown menu
- Added responsive dropdown that appears below the hamburger menu button
- Desktop sidebar remains unchanged
- Mobile dropdown includes:
  - Business header with name and type
  - Navigation items (same as desktop)
  - "Switch Business" footer action

**Key Features:**
- Smooth Framer Motion animations on dropdown open/close
- Dropdown closes automatically when navigation item is selected
- Full business context displayed in dropdown header
- Help icons for unavailable features
- Role-based access control (unavailable items show as disabled)

**Technical Details:**
```jsx
// Mobile-only dropdown menu
<div className="md:hidden absolute left-0 top-16 z-40">
  {sidebarOpen && (
    <motion.div>
      {/* Business header */}
      {/* Navigation items */}
      {/* Switch business footer */}
    </motion.div>
  )}
</div>

// Desktop sidebar remains unchanged
<motion.aside className="hidden md:flex">
  {/* Original sidebar content */}
</motion.aside>
```

**Mobile UX Improvements:**
- Click hamburger to toggle dropdown
- Select navigation item automatically closes dropdown
- Dropdown positioned above content to prevent layout shift
- Touch-friendly button sizing and spacing

---

## Part 2: Business Profile Customization System

### Architecture Overview

The business profile customization system includes:
- **Django Backend**: Forms, Views, Templates, REST API
- **React Frontend**: BusinessSettings component
- **Database**: Existing BusinessProfile model with logo and color fields
- **File Uploads**: Secure image upload with validation

### Database Schema

**Model: BusinessProfile** (Already exists in `core/models/business_profile.py`)

```python
class BusinessProfile(models.Model):
    business = OneToOneField(Business)
    logo = ImageField(upload_to="business/logos/", null=True, blank=True)
    primary_color = CharField(max_length=7, blank=True)          # Hex format: #RRGGBB
    secondary_color = CharField(max_length=7, blank=True)        # Hex format: #RRGGBB
    about = TextField(blank=True)                                 # Business description
    contact_email = EmailField(blank=True)                        # Public contact
    contact_phone = CharField(max_length=20, blank=True)          # Public contact
    website = URLField(blank=True)                                # Business website
```

### Backend Implementation

#### 1. Django Form: `core/forms.py` - `BusinessProfileForm`

**Features:**
- Color picker widget with hex color validation
- Secure file upload with type and size validation
- Auto-strip and validate input fields
- Comprehensive error messages

**Validation Rules:**
- Logo: Max 5MB, formats: JPG, PNG, GIF, WebP
- Primary Color: Hex format #RRGGBB or #RGB
- Secondary Color: Hex format #RRGGBB or #RGB
- About: Max 500 characters
- Contact fields: Standard email/phone validation

**Code Example:**
```python
class BusinessProfileForm(forms.ModelForm):
    primary_color = forms.CharField(
        widget=forms.TextInput(attrs={'type': 'color'})
    )
    secondary_color = forms.CharField(
        widget=forms.TextInput(attrs={'type': 'color'})
    )
    logo = forms.ImageField(required=False)
    
    def clean_logo(self):
        logo = self.cleaned_data.get('logo')
        if logo and logo.size > 5 * 1024 * 1024:
            raise forms.ValidationError("Max 5MB")
        return logo
```

#### 2. Views: `core/views/business.py`

**Template-Based View: `BusinessSettingsView`**
- Handles GET requests: Display settings form with current profile
- Handles POST requests: Save updated profile data
- Permission: Login required + active membership in business
- Role restriction: Owner/Admin only

```python
@method_decorator(login_required, name='dispatch')
class BusinessSettingsView(View):
    def get(self, request, business_id):
        # Load profile form with current data
        # Display settings page template
        
    def post(self, request, business_id):
        # Validate form
        # Save to database
        # Show success/error message
```

**REST API View: `BusinessProfileAPIView`**
- GET: Fetch business profile data (JSON)
- POST: Update business profile via form data
- Supports file uploads using MultiPartParser
- Returns JSON response for React frontend

```python
class BusinessProfileAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def get(self, request, business_id):
        # Return profile data as JSON
        
    def post(self, request, business_id):
        # Update profile with form data
        # Support file uploads
```

#### 3. URL Configuration: `core/urls.py`

```python
# Django template-based view
path('businesses/<uuid:business_id>/settings/', 
     BusinessSettingsView.as_view(), 
     name='business-settings')

# REST API endpoint (for React frontend)
path('businesses/<uuid:business_id>/profile/', 
     BusinessProfileAPIView.as_view(), 
     name='business-profile')
```

#### 4. Django Template: `core/templates/business/business_settings.html`

**Features:**
- Responsive Tailwind CSS design
- Logo upload with preview
- Color picker inputs with hex text input sync
- Live preview section (sticky on desktop, below on mobile)
- Business information form fields
- Submit and cancel buttons
- Dark mode support

**Preview Components:**
- Header mockup with logo and action button
- Color swatches showing primary and secondary colors
- Button examples showing both colors
- Gradient preview combining both colors

**Form Sections:**
1. Logo Upload
   - File picker
   - Image preview
   - Size/format validation feedback

2. Brand Colors
   - Color picker (HTML5 color input)
   - Hex color text input
   - Validation messages

3. Business Information
   - About textarea
   - Contact email
   - Contact phone
   - Website URL

### Frontend Implementation

#### React Component: `teedhub_frontend/src/pages/Business/BusinessSettings.jsx`

**Features:**
- Full-page settings form with live preview
- Color picker with real-time preview
- Logo upload with file validation
- Form state management with React hooks
- Toast notifications for user feedback
- Permission validation (owner/admin only)
- Responsive layout (1 col mobile, 3 cols desktop with sticky preview)
- Smooth animations with Framer Motion

**Component Structure:**
```javascript
export default function BusinessSettings() {
  const [formData, setFormData] = useState({
    logo: null,
    primary_color: '#1F75FE',
    secondary_color: '#f2a705',
    about: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  })
  
  // Load existing profile on mount
  useEffect(() => {
    // Fetch from /api/businesses/{id}/profile/
  }, [business?.id])
  
  // Handle form submission
  const handleSubmit = async (e) => {
    // POST FormData to /api/businesses/{id}/profile/
  }
}
```

**Key Features:**
- Logo preview updates as file is selected
- Color changes update preview in real-time
- Hex color text input syncs with color picker
- Live gradient preview
- Button style examples
- All validation happens in form before submission

**Validation:**
- Hex color format validation: `#[0-9A-F]{6}`
- Logo file type: image/*(jpeg, png, gif, webp)
- Logo size: < 5MB

#### Integration with BusinessWorkspace

**Route Configuration** (`teedhub_frontend/src/App.jsx`):
```jsx
<Route path="/business/:businessId" element={<BusinessWorkspace />}>
  <Route path="overview" element={<BusinessOverview />} />
  <Route path="settings" element={<BusinessSettings />} />
</Route>
```

**Navigation Item** (`BusinessWorkspace.jsx`):
```javascript
{
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  path: 'settings',
  available: true,           // Now implemented
  restricted: ['owner', 'admin'],
}
```

---

## Usage Flow

### Adding Custom Branding to Your Business

#### Via React Frontend (Recommended)

1. **Open Business Workspace**
   - Navigate to `/business/{businessId}/overview`

2. **Access Settings**
   - Click "Settings" in left sidebar
   - Page navigates to `/business/{businessId}/settings`

3. **Customize Profile**
   - Upload logo image (PNG, JPG, GIF, WebP)
   - Select primary color using color picker
   - Select secondary color using color picker
   - Add business description in "About" field
   - Enter contact information
   - Watch live preview update in real-time

4. **Save Changes**
   - Click "Save Changes" button
   - Success toast notification appears
   - Redirects to Overview after 1.5 seconds

#### Via Django Admin (Alternative)

1. Access `/admin/`
2. Navigate to Business Profile section
3. Edit BusinessProfile for desired business
4. Update fields and save

---

## File Uploads & Security

### Upload Configuration

**Location**: `media/business/logos/` relative to Django project root

**Security Measures:**
- File size validation (5MB max)
- File type validation (whitelist: jpg, jpeg, png, gif, webp)
- MIME type checking in form
- Django's built-in ImageField validation
- User permission checks (owner/admin only)
- CSRF protection on all forms

### File Access

**Public URL Format**:
```
/media/business/logos/{filename}
```

**Dynamic URL in API Response**:
```json
{
  "logo": "/media/business/logos/my-logo.png"
}
```

---

## API Reference

### Get Business Profile

**Endpoint**: `GET /api/businesses/{business_id}/profile/`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "id": "profile-id",
  "logo": "/media/business/logos/logo.png",
  "primary_color": "#1F75FE",
  "secondary_color": "#f2a705",
  "about": "Business description",
  "contact_email": "contact@business.com",
  "contact_phone": "+1-555-0000",
  "website": "https://business.com"
}
```

### Update Business Profile

**Endpoint**: `POST /api/businesses/{business_id}/profile/`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body** (FormData):
```
logo: (file)
primary_color: #1F75FE
secondary_color: #f2a705
about: Business description
contact_email: contact@business.com
contact_phone: +1-555-0000
website: https://business.com
```

**Response** (200 OK):
```json
{
  "message": "Business profile updated successfully"
}
```

**Error Responses**:
- 403 Forbidden: User not member or doesn't have permission
- 400 Bad Request: Invalid form data or file validation failed
- 404 Not Found: Business not found

---

## Styling & Branding

### Color System

The colors saved in the profile can be used throughout the workspace:

**Frontend CSS Variables** (Future Implementation):
```css
:root {
  --color-primary: #1F75FE;      /* Loaded from profile */
  --color-secondary: #f2a705;    /* Loaded from profile */
}
```

**Usage**:
```jsx
<button style={{ backgroundColor: profile.primary_color }}>
  Action
</button>
```

### Default Colors

If no colors are selected:
- Primary: `#1F75FE` (Blue)
- Secondary: `#f2a705` (Gold)

---

## Future Enhancements

1. **Dynamic Theme Application**
   - Load colors from database on workspace load
   - Apply CSS variables globally to workspace
   - Update UI components in real-time

2. **Social Media Links**
   - Add Instagram, Facebook, TikTok, WhatsApp fields to form
   - Display on public business profile

3. **Logo Optimization**
   - Image cropping tool
   - Automatic resizing for different contexts
   - WebP conversion for performance

4. **Theme Templates**
   - Pre-designed color schemes
   - One-click theme application
   - Custom theme builder

5. **Brand Guidelines**
   - Logo usage rules
   - Color palette documentation
   - Font recommendations

---

## Testing Checklist

- [ ] Mobile navigation dropdown opens/closes correctly
- [ ] Dropdown closes when selecting menu item
- [ ] Logo upload file validation works
- [ ] Color picker syncs with hex input
- [ ] Live preview updates in real-time
- [ ] Form validation prevents invalid hex colors
- [ ] Permission check restricts non-owner/admin users
- [ ] Toast notifications appear on save
- [ ] Profile data loads on component mount
- [ ] Image preview shows uploaded file
- [ ] Responsive layout works on all screen sizes
- [ ] Dark mode styling applies correctly

---

## Troubleshooting

### Logo Not Uploading
- Check file size (< 5MB)
- Verify file type (jpg, png, gif, webp)
- Ensure user has owner/admin role
- Check browser console for errors

### Colors Not Saving
- Verify hex format is valid (#RRGGBB)
- Check API response for validation errors
- Clear browser cache and reload

### Settings Page Not Loading
- Verify user is logged in
- Check if user is member of business
- Verify businessId in URL is valid

### Mobile Dropdown Not Working
- Check if sidebar button appears on mobile
- Verify Tailwind responsive classes work
- Check browser console for JavaScript errors

---

## Performance Considerations

1. **Image Optimization**
   - Consider server-side image compression
   - Implement CDN for logo delivery
   - Cache headers for static assets

2. **Database Queries**
   - Membership validation is already optimized
   - Profile loaded with get_or_create pattern
   - No N+1 queries

3. **Frontend**
   - Color preview updates are instant (no API call)
   - Images are cached by browser
   - Framer Motion animations are GPU-accelerated

---

## Deployment Notes

### Environment Setup

1. **Static Files**
   - Ensure `MEDIA_ROOT` is configured in settings
   - MEDIA_URL should point to `/media/`

2. **Permissions**
   - Web server must have write permissions to `media/` directory
   - For production, use cloud storage (S3, GCS, etc.)

3. **File Storage Backend** (Optional)
   - For production, replace Django's default with S3
   - Update settings.py with storage backend

### Database Migrations

No new migrations needed - BusinessProfile model already includes all fields.

---

## Code Organization

```
core/
├── forms.py                          # New: BusinessProfileForm
├── models/
│   └── business_profile.py          # Existing: BusinessProfile model
├── templates/
│   └── business/
│       └── business_settings.html   # New: Django template
├── urls.py                          # Updated: New URL patterns
└── views/
    └── business.py                  # Updated: New view classes

teedhub_frontend/
├── src/
│   ├── App.jsx                      # Updated: New route
│   └── pages/
│       └── Business/
│           ├── BusinessSettings.jsx # New: React component
│           └── BusinessWorkspace.jsx # Updated: Navigation
```

---

## Summary

This implementation provides:
✅ Improved mobile navigation with dropdown menu
✅ Complete business profile customization system
✅ Logo upload with preview and validation
✅ Brand color selection with live preview
✅ Secure file handling and validation
✅ Both Django template and React implementations
✅ Responsive design for all screen sizes
✅ Role-based access control
✅ Toast notifications for user feedback
✅ Dark mode support
✅ Professional UI with Framer Motion animations
