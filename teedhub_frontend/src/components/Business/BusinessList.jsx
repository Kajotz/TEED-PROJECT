import React from 'react';
import BusinessCard from './BusinessCard';
import { LOADING_STATES } from '../../utils/constants';
import '../../styles/BusinessList.css';

/**
 * BusinessList Component
 * Displays a grid of business cards
 * Props:
 *   - businesses: Array of business objects
 *   - onBusinessClick: Callback when a business card is clicked
 *   - loading: Loading state (idle, loading, success, error)
 *   - title: Optional title for the section
 *   - emptyMessage: Message to show when list is empty
 */
const BusinessList = ({
  businesses = [],
  onBusinessClick,
  loading = LOADING_STATES.IDLE,
  title,
  emptyMessage = 'No businesses found',
}) => {
  if (loading === LOADING_STATES.LOADING) {
    return (
      <div className="business-list__loading">
        <div className="spinner"></div>
        <p>Loading businesses...</p>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="business-list__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className="business-list">
      {title && <h2 className="business-list__title">{title}</h2>}
      <div className="business-list__grid">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onClick={() => onBusinessClick?.(business.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default BusinessList;
