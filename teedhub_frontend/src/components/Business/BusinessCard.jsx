import React from 'react';
import { USER_ROLES, BUSINESS_TYPES } from '../../utils/constants';
import '../../styles/BusinessCard.css';

/**
 * BusinessCard Component
 * Displays a business in card format
 * Props:
 *   - business: Business object with profile info
 *   - onClick: Callback when card is clicked
 *   - showRole: Whether to show user's role
 */
const BusinessCard = ({ business, onClick, showRole = true }) => {
  if (!business) return null;

  const { profile = {} } = business;
  const primaryColor = profile.primary_color || '#3498db';
  const backgroundColor = `${primaryColor}15`;

  const roleInfo = USER_ROLES[business.role] || {};
  const businessTypeLabel = BUSINESS_TYPES[business.business_type] || business.business_type;

  return (
    <div
      className="business-card"
      onClick={onClick}
      style={{
        borderLeftColor: primaryColor,
        backgroundColor,
      }}
    >
      {/* Card Header with Logo */}
      <div className="business-card__header">
        {profile.logo ? (
          <img src={profile.logo} alt={business.name} className="business-card__logo" />
        ) : (
          <div className="business-card__logo-placeholder">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="business-card__body">
        <h3 className="business-card__name">{business.name}</h3>

        {/* Business Type Badge */}
        <span className="business-card__type-badge">{businessTypeLabel}</span>

        {/* Role Badge */}
        {showRole && (
          <span
            className="business-card__role-badge"
            style={{ backgroundColor: roleInfo.color }}
          >
            {roleInfo.label}
          </span>
        )}

        {/* Business Description */}
        {profile.about && (
          <p className="business-card__description">{profile.about.substring(0, 100)}...</p>
        )}

        {/* Joined Date */}
        <p className="business-card__date">
          Joined: {new Date(business.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Card Footer */}
      <div className="business-card__footer">
        <span className={`business-card__status ${business.is_active ? 'active' : 'inactive'}`}>
          {business.is_active ? '● Active' : '● Inactive'}
        </span>
      </div>
    </div>
  );
};

export default BusinessCard;
