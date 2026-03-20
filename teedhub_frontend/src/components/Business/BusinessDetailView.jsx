import React from 'react';
import { LOADING_STATES, BUSINESS_TYPES, USER_ROLES, ERROR_MESSAGES } from '../../utils/constants';
import '../../styles/BusinessDetailView.css';

/**
 * BusinessDetailView Component
 * Displays detailed information about a business
 * Props:
 *   - business: Business object with all details
 *   - loading: Loading state
 *   - error: Error message
 *   - onEdit: Callback to edit business
 *   - onBack: Callback to go back
 *   - canEdit: Whether user can edit the business
 */
const BusinessDetailView = ({ business, loading, error, onEdit, onBack, canEdit = false }) => {
  if (loading === LOADING_STATES.LOADING) {
    return (
      <div className="business-detail__loading">
        <div className="spinner"></div>
        <p>Loading business details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-detail__error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={onBack} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="business-detail__empty">
        <p>{ERROR_MESSAGES.NOT_FOUND}</p>
        <button onClick={onBack} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const { profile = {} } = business;
  const primaryColor = business.profile?.primary_color || '#3498db';
  const roleInfo = USER_ROLES[business.user_role] || {};
  const businessTypeLabel = BUSINESS_TYPES[business.business_type] || business.business_type;

  return (
    <div className="business-detail">
      {/* Header */}
      <header
        className="business-detail__header"
        style={{ backgroundColor: primaryColor }}
      >
        <button onClick={onBack} className="business-detail__back-btn">
          ← Back
        </button>

        <div className="business-detail__header-content">
          {profile.logo && (
            <img src={profile.logo} alt={business.name} className="business-detail__logo" />
          )}

          <div className="business-detail__header-text">
            <h1>{business.name}</h1>
            <p className="business-detail__slug">{business.slug}</p>
            <div className="business-detail__badges">
              <span className="badge badge-primary">{businessTypeLabel}</span>
              <span
                className="badge badge-role"
                style={{ backgroundColor: roleInfo.color }}
              >
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="business-detail__main">
        {/* About Section */}
        {profile.about && (
          <section className="business-detail__section">
            <h2>About</h2>
            <p className="business-detail__description">{profile.about}</p>
          </section>
        )}

        {/* Branding Section */}
        <section className="business-detail__section">
          <h2>Branding</h2>
          <div className="business-detail__branding">
            {profile.primary_color && (
              <div className="branding-item">
                <label>Primary Color</label>
                <div className="color-preview" style={{ backgroundColor: profile.primary_color }}>
                  {profile.primary_color}
                </div>
              </div>
            )}
            {profile.secondary_color && (
              <div className="branding-item">
                <label>Secondary Color</label>
                <div className="color-preview" style={{ backgroundColor: profile.secondary_color }}>
                  {profile.secondary_color}
                </div>
              </div>
            )}
            {profile.theme && (
              <div className="branding-item">
                <label>Theme</label>
                <p>{profile.theme}</p>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        {(profile.contact_email || profile.contact_phone || profile.website) && (
          <section className="business-detail__section">
            <h2>Contact Information</h2>
            <div className="business-detail__contact">
              {profile.contact_email && (
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <a href={`mailto:${profile.contact_email}`}>{profile.contact_email}</a>
                </div>
              )}
              {profile.contact_phone && (
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <a href={`tel:${profile.contact_phone}`}>{profile.contact_phone}</a>
                </div>
              )}
              {profile.website && (
                <div className="contact-item">
                  <span className="contact-icon">🌐</span>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Social Media Section */}
        {(profile.instagram || profile.facebook || profile.tiktok || profile.whatsapp) && (
          <section className="business-detail__section">
            <h2>Follow Us</h2>
            <div className="business-detail__social">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link instagram"
                >
                  📷 @{profile.instagram}
                </a>
              )}
              {profile.facebook && (
                <a
                  href={`https://facebook.com/${profile.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link facebook"
                >
                  👍 {profile.facebook}
                </a>
              )}
              {profile.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link tiktok"
                >
                  🎵 @{profile.tiktok}
                </a>
              )}
              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link whatsapp"
                >
                  💬 {profile.whatsapp}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Info Section */}
        <section className="business-detail__section">
          <h2>Information</h2>
          <div className="business-detail__info">
            <div className="info-item">
              <label>Status</label>
              <span className={`status ${business.is_active ? 'active' : 'inactive'}`}>
                {business.is_active ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="info-item">
              <label>Joined</label>
              <p>{new Date(business.user_joined_at).toLocaleDateString()}</p>
            </div>
            <div className="info-item">
              <label>Created</label>
              <p>{new Date(business.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Actions Footer */}
      <footer className="business-detail__footer">
        {canEdit && (
          <button onClick={onEdit} className="btn btn-primary">
            Edit Profile
          </button>
        )}
        <button onClick={onBack} className="btn btn-secondary">
          Back to Profile
        </button>
      </footer>
    </div>
  );
};

export default BusinessDetailView;
