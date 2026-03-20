import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusiness, useUpdateBusinessProfile } from '@/hooks/useBusiness';
import { LOADING_STATES, BUSINESS_TYPES } from '@/utils/constants';
import '../styles/EditBusinessPage.css';

/**
 * EditBusinessPage
 * Form page for editing business profile information
 * Includes: name, description, type, colors, contact info, and social media
 */
const EditBusinessPage = () => {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { business, loading: loadingBusiness, error: businessError } = useBusiness(businessId);
  const { updateBusinessProfile, loading: updating, error: updateError } = useUpdateBusinessProfile();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    about: '',
    business_type: 'retail',
    primary_color: '#3498db',
    secondary_color: '#2c3e50',
    theme: 'light',
    email: '',
    phone: '',
    website: '',
    address: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate form with business data
  useEffect(() => {
    if (business) {
      const profile = business.business_profile || {};
      setFormData({
        name: business.name || '',
        slug: business.slug || '',
        about: profile.about || '',
        business_type: business.business_type || 'retail',
        primary_color: profile.primary_color || '#3498db',
        secondary_color: profile.secondary_color || '#2c3e50',
        theme: profile.theme || 'light',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        address: profile.address || '',
        instagram: profile.social_media?.instagram || '',
        facebook: profile.social_media?.facebook || '',
        tiktok: profile.social_media?.tiktok || '',
        whatsapp: profile.social_media?.whatsapp || '',
      });
    }
  }, [business]);

  // Check if user has edit permission
  const canEdit = business && ['owner', 'admin'].includes(business.user_role);

  if (loadingBusiness === LOADING_STATES.LOADING) {
    return (
      <div className="edit-business-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading business information...</p>
        </div>
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="edit-business-page">
        <div className="error-container">
          <h1>Error Loading Business</h1>
          <p>{businessError}</p>
          <button onClick={() => navigate('/profile')} className="btn btn-secondary">
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="edit-business-page">
        <div className="error-container">
          <h1>Access Denied</h1>
          <p>You do not have permission to edit this business.</p>
          <button onClick={() => navigate('/profile')} className="btn btn-secondary">
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Business slug is required';
    }
    if (formData.about.length > 500) {
      newErrors.about = 'About section must be less than 500 characters';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updateData = {
      name: formData.name,
      slug: formData.slug,
      business_type: formData.business_type,
      business_profile: {
        about: formData.about,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        theme: formData.theme,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        social_media: {
          instagram: formData.instagram,
          facebook: formData.facebook,
          tiktok: formData.tiktok,
          whatsapp: formData.whatsapp,
        },
      },
    };

    const success = await updateBusinessProfile(businessId, updateData);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/business/${businessId}`);
      }, 2000);
    }
  };

  const handleCancel = () => {
    navigate(`/business/${businessId}`);
  };

  return (
    <div className="edit-business-page">
      <div className="edit-container">
        {/* Header */}
        <div className="edit-header">
          <h1>Edit Business Profile</h1>
          <p>Update your business information and branding</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-message">
            <span>✓</span> Business updated successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {updateError && (
          <div className="error-message">
            <span>✕</span> {updateError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-form">
          {/* Section 1: Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Business Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter business name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="slug">Business Slug *</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="business-slug"
                className={errors.slug ? 'error' : ''}
              />
              {errors.slug && <span className="error-text">{errors.slug}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="business_type">Business Type</label>
              <select
                id="business_type"
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
              >
                {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="about">About (Max 500 characters)</label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about your business"
                maxLength="500"
                rows="4"
                className={errors.about ? 'error' : ''}
              />
              <div className="char-count">
                {formData.about.length}/500
              </div>
              {errors.about && <span className="error-text">{errors.about}</span>}
            </div>
          </div>

          {/* Section 2: Branding */}
          <div className="form-section">
            <h2>Branding</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="primary_color">Primary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    id="primary_color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={handleChange}
                    placeholder="#3498db"
                    readOnly
                    className="color-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="secondary_color">Secondary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    id="secondary_color"
                    name="secondary_color"
                    value={formData.secondary_color}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={handleChange}
                    placeholder="#2c3e50"
                    readOnly
                    className="color-text"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div className="form-section">
            <h2>Contact Information</h2>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@business.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.example.com"
                className={errors.website ? 'error' : ''}
              />
              {errors.website && <span className="error-text">{errors.website}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>

          {/* Section 4: Social Media */}
          <div className="form-section">
            <h2>Social Media</h2>

            <div className="form-group">
              <label htmlFor="instagram">Instagram</label>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="facebook">Facebook</label>
              <input
                type="text"
                id="facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="facebook.com/page"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tiktok">TikTok</label>
              <input
                type="text"
                id="tiktok"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBusinessPage;
