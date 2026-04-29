import React from 'react';

const EmptyState = ({ icon, message }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{message}</h3>
    </div>
  );
};

export default EmptyState;