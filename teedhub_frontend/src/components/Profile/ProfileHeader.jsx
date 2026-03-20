import React from 'react';
import '../../styles/ProfileHeader.css';

/**
 * ProfileHeader Component
 * Displays user profile information header
 * Props:
 *   - user: User object with email, first_name, last_name, etc.
 *   - businessCount: Total number of businesses
 *   - onEdit: Callback to edit profile
 */
const ProfileHeader = ({ user, businessCount = 0, onEdit }) => {
  if (!user) return null;

  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.username;

  const joinedDate = new Date(user.date_joined).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="profile-header">
      <div className="profile-header__content">
        {/* User Avatar/Initial */}
        <div className="profile-header__avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div className="profile-header__info">
          <h1 className="profile-header__name">{displayName}</h1>
          <p className="profile-header__email">{user.email}</p>
          <p className="profile-header__joined">Member since {joinedDate}</p>
        </div>

        {/* Stats */}
        <div className="profile-header__stats">
          <div className="stat">
            <span className="stat__number">{businessCount}</span>
            <span className="stat__label">Business{businessCount !== 1 ? 'es' : ''}</span>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button onClick={onEdit} className="profile-header__edit-btn">
            Edit Profile
          </button>
        )}
      </div>
    </header>
  );
};

export default ProfileHeader;
