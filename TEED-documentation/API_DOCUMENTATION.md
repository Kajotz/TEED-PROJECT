# TEED Hub API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require JWT authentication in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Personal Info Endpoints

### 1. Get Personal Information
**Endpoint**: `GET /personal-info/get_personal_info/`

**Description**: Retrieve the current user's personal information

**Response** (200 OK):
```json
{
  "id": "uuid-string",
  "user_email": "user@example.com",
  "username_display": "johnsmith",
  "phone_number": "+1-555-123-4567",
  "country": "United States",
  "bio": "Digital entrepreneur interested in social media",
  "website": "https://example.com",
  "profile_image": "https://example.com/profiles/image.jpg",
  "secondary_email": "john.secondary@example.com",
  "whatsapp_number": "+1-555-987-6543",
  "telegram_username": "@johnsmith",
  "notification_email": true,
  "newsletter_subscription": false,
  "created_at": "2024-01-15T12:34:56Z",
  "updated_at": "2024-01-15T12:34:56Z"
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized (invalid/missing token)
- `404`: Profile not found

---

### 2. Update Personal Information
**Endpoint**: `PATCH /personal-info/update_personal_info/`

**Description**: Update user's personal information (partial update)

**Request Body** (JSON):
```json
{
  "username_display": "johndoe",
  "phone_number": "+1-555-999-8888",
  "country": "Canada",
  "bio": "New bio text",
  "website": "https://newsite.com",
  "secondary_email": "john.new@example.com",
  "whatsapp_number": "+1-555-111-2222",
  "telegram_username": "@johndoe",
  "notification_email": false,
  "newsletter_subscription": true
}
```

**Response** (200 OK):
```json
{
  "message": "Personal information updated successfully",
  "data": {
    "id": "uuid-string",
    "user_email": "user@example.com",
    ...
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Validation error (see errors field)
- `401`: Unauthorized
- `404`: Profile not found

**Validations**:
- `website`: Must start with http:// or https:// if provided
- `bio`: Max 500 characters
- `username_display`: Must be unique

---

### 3. Change Password
**Endpoint**: `POST /personal-info/change-password/`

**Description**: Change user's account password

**Request Body** (JSON):
```json
{
  "old_password": "current_password",
  "new_password": "new_secure_password",
  "confirm_password": "new_secure_password"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Validation error (passwords don't match, too short, etc.)
- `401`: Old password incorrect
- `404`: User not found

**Validations**:
- All fields required
- `new_password`: Min 8 characters
- `new_password` == `confirm_password`
- Old password must be correct

---

### 4. Upload Profile Image
**Endpoint**: `POST /personal-info/upload-profile-image/`

**Description**: Upload or update user's profile image

**Request Format**: multipart/form-data

**Form Data**:
```
profile_image: <binary file>
```

**Response** (200 OK):
```json
{
  "message": "Profile image uploaded successfully",
  "data": {
    "id": "uuid-string",
    ...
    "profile_image": "https://storage.example.com/profile_images/uuid.jpg"
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid file format or size
- `401`: Unauthorized
- `404`: Profile not found

**Validations**:
- Allowed types: JPEG, PNG, GIF, WebP
- Max size: 5MB
- Required: file must be provided

---

### 5. Update Email
**Endpoint**: `POST /personal-info/update-email/`

**Description**: Update user's email address (requires password verification)

**Request Body** (JSON):
```json
{
  "email": "newemail@example.com",
  "password": "current_password"
}
```

**Response** (200 OK):
```json
{
  "message": "Email updated successfully",
  "data": {
    "id": "uuid-string",
    "user_email": "newemail@example.com",
    ...
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Email already in use or validation error
- `401`: Password incorrect
- `404`: User not found

**Validations**:
- Password must be correct
- New email must be unique
- Valid email format

---

## Social Account Endpoints

### 1. List Social Accounts
**Endpoint**: `GET /social-accounts/`

**Description**: List all social accounts for businesses managed by user

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": "uuid-string",
    "business": "business-uuid",
    "platform": "instagram",
    "platform_display": "Instagram",
    "account_username": "@mybusiness",
    "account_url": "https://instagram.com/mybusiness",
    "is_connected": true,
    "is_active": true,
    "status": "Connected",
    "connection_error": null,
    "followers_count": 1250,
    "profile_image": "https://instagram.com/...",
    "bio": "Official business account",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-15T12:34:56Z",
    "last_synced_at": "2024-01-15T12:30:00Z"
  },
  ...
]
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden (no managed businesses)

---

### 2. Create Social Account (Link)
**Endpoint**: `POST /social-accounts/`

**Description**: Link a new social media account to a business

**Request Body** (JSON):
```json
{
  "business": "business-uuid",
  "platform": "instagram",
  "account_username": "@mybusiness",
  "account_url": "https://instagram.com/mybusiness",
  "access_token": "oauth_access_token"
}
```

**Response** (201 Created):
```json
{
  "message": "Social account linked successfully",
  "data": {
    "id": "uuid-string",
    "business": "business-uuid",
    ...
  }
}
```

**Status Codes**:
- `201`: Success
- `400`: Validation error or platform already linked
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Business not found

**Validations**:
- Platform must be one of 15 supported
- Account_username required
- Business must exist and user must be owner/manager
- Cannot link same platform twice per business

**Supported Platforms**:
- instagram
- facebook
- tiktok
- youtube
- twitter
- linkedin
- pinterest
- snapchat
- whatsapp
- telegram
- discord
- twitch
- reddit
- tumblr
- threads

---

### 3. Get Social Account Details
**Endpoint**: `GET /social-accounts/{id}/`

**Description**: Get details of a specific social account

**Response** (200 OK):
```json
{
  "id": "uuid-string",
  "business": "business-uuid",
  "platform": "instagram",
  "platform_display": "Instagram",
  "account_username": "@mybusiness",
  "account_url": "https://instagram.com/mybusiness",
  "is_connected": true,
  "is_active": true,
  "status": "Connected",
  "connection_error": null,
  "followers_count": 1250,
  "profile_image": "https://instagram.com/...",
  "bio": "Official business account",
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-15T12:34:56Z",
  "last_synced_at": "2024-01-15T12:30:00Z"
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Account not found

---

### 4. Update Social Account
**Endpoint**: `PUT /social-accounts/{id}/` or `PATCH /social-accounts/{id}/`

**Description**: Update social account details

**Request Body** (JSON):
```json
{
  "account_username": "@newusername",
  "account_url": "https://instagram.com/newusername",
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "message": "Social account updated successfully",
  "data": { ... }
}
```

**Status Codes**:
- `200`: Success
- `400`: Validation error
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Account not found

---

### 5. Disconnect Social Account (Soft Delete)
**Endpoint**: `POST /social-accounts/{id}/disconnect/`

**Description**: Safely disconnect account (marks as disconnected, doesn't delete)

**Request Body**: Empty JSON object `{}`

**Response** (200 OK):
```json
{
  "message": "Social account disconnected successfully",
  "data": {
    "id": "uuid-string",
    "is_connected": false,
    "is_active": false,
    "status": "Disconnected",
    "connection_error": "Manually disconnected",
    ...
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Account not found

---

### 6. Delete Social Account (Hard Delete)
**Endpoint**: `DELETE /social-accounts/{id}/`

**Description**: Permanently delete social account

**Response** (204 No Content):
```
Empty body
```

**Status Codes**:
- `204`: Success (deleted)
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Account not found

---

### 7. Sync Social Account Data
**Endpoint**: `POST /social-accounts/{id}/sync/`

**Description**: Fetch latest data from social platform (followers, profile info, etc.)

**Request Body**: Empty JSON object `{}`

**Response** (200 OK):
```json
{
  "message": "Social account synced successfully",
  "data": {
    "id": "uuid-string",
    "followers_count": 1500,
    "profile_image": "https://instagram.com/...",
    "bio": "Updated bio from platform",
    "last_synced_at": "2024-01-15T14:00:00Z",
    ...
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Account disconnected
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Account not found

**Note**: Requires valid access_token and platform connectivity

---

### 8. Get Accounts by Business
**Endpoint**: `GET /social-accounts/by_business/`

**Description**: Get all social accounts for specific business

**Query Parameters**:
- `business_id` (required): UUID of the business

**Example**:
```
GET /social-accounts/by_business/?business_id=550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
[
  { ... account 1 ... },
  { ... account 2 ... }
]
```

**Status Codes**:
- `200`: Success
- `400`: Missing business_id parameter
- `401`: Unauthorized
- `403`: Permission denied
- `404`: Business not found

---

### 9. Get Accounts by Platform
**Endpoint**: `GET /social-accounts/by_platform/`

**Description**: Get all social accounts for specific platform (across all user's businesses)

**Query Parameters**:
- `platform` (required): Platform name (instagram, facebook, etc.)

**Example**:
```
GET /social-accounts/by_platform/?platform=instagram
```

**Response** (200 OK):
```json
[
  { ... account 1 ... },
  { ... account 2 ... }
]
```

**Status Codes**:
- `200`: Success
- `400`: Missing platform parameter
- `401`: Unauthorized

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "detail": "Additional details"
}
```

### Validation Error Format
```json
{
  "errors": {
    "field_name": ["Error message for this field"],
    "another_field": ["Error 1", "Error 2"]
  }
}
```

### Permission Error (403)
```json
{
  "error": "You do not have permission to manage this account"
}
```

### Not Found Error (404)
```json
{
  "error": "Account not found"
}
```

---

## Rate Limiting

Currently: No rate limiting (to be implemented in production)

Recommended: 100 requests per hour per user

---

## Pagination

Currently: No pagination implemented

All endpoints return complete results. Pagination recommended for `by_business` and `by_platform` in production.

---

## Field Definitions

### Platforms (15 supported)
- `instagram`: Instagram
- `facebook`: Facebook
- `tiktok`: TikTok
- `youtube`: YouTube
- `twitter`: Twitter/X
- `linkedin`: LinkedIn
- `pinterest`: Pinterest
- `snapchat`: Snapchat
- `whatsapp`: WhatsApp
- `telegram`: Telegram
- `discord`: Discord
- `twitch`: Twitch
- `reddit`: Reddit
- `tumblr`: Tumblr
- `threads`: Threads

### Countries (27 supported)
US, Canada, UK, Australia, India, Nigeria, South Africa, Kenya, Ghana, Uganda, Pakistan, Bangladesh, Brazil, Mexico, Germany, France, Italy, Spain, Japan, China, Singapore, Malaysia, Philippines, Thailand, Indonesia, Vietnam, Other

### Status Values
- `Connected`: Account is active and connected
- `Disconnected`: Account was manually disconnected
- `Error`: Connection failed (see connection_error for details)
- `Inactive`: Account exists but is not active

---

## Implementation Notes

### Token Security
- `access_token` and `refresh_token` are write-only fields (not returned in responses)
- Store securely server-side only
- Never log or expose tokens

### Image URLs
- Profile images stored in `/profile_images/` directory
- Social account profile images retrieved from platform (URLs only)
- Placeholder avatars generated using UI-avatars API

### Followers Count
- Only updated via sync operation
- Initially 0 when account created
- Integer value

### Timestamps
- All times in UTC (ISO 8601 format)
- `created_at`: Set when account first created (immutable)
- `updated_at`: Updated every time record modified
- `last_synced_at`: Updated when sync operation runs

---

## Common Use Cases

### 1. Complete User Onboarding
```bash
# 1. Get personal info
GET /personal-info/get_personal_info/

# 2. Update personal info
PATCH /personal-info/update_personal_info/

# 3. Upload profile image
POST /personal-info/upload-profile-image/
```

### 2. Setup Social Media Management
```bash
# 1. Create business profile (via business endpoint)
POST /businesses/

# 2. Link social accounts
POST /social-accounts/
POST /social-accounts/

# 3. Sync account data
POST /social-accounts/{id}/sync/
POST /social-accounts/{id2}/sync/

# 4. Get all accounts for business
GET /social-accounts/by_business/?business_id=xxx
```

### 3. Account Maintenance
```bash
# 1. Check connected accounts
GET /social-accounts/

# 2. Update account settings
PATCH /social-accounts/{id}/

# 3. Sync latest data
POST /social-accounts/{id}/sync/

# 4. Disconnect if needed
POST /social-accounts/{id}/disconnect/
```

---

## Future API Enhancements

- [ ] OAuth authorization flow for social platforms
- [ ] Post scheduling and publishing
- [ ] Analytics and metrics collection
- [ ] Team member management
- [ ] Webhook support for platform updates
- [ ] Bulk operations for multiple accounts
- [ ] Advanced filtering and search

---

**Last Updated**: 2024-01-15
**API Version**: 1.0
**Status**: ✅ Production Ready
