import React from 'react';

const TripCard = ({ trip, onClick, onDelete, isOwner }) => {
  const collected = Object.values(trip.participants || {}).reduce((a, p) => a + (p.amount || 0), 0);
  const progress = trip.budget > 0 ? (collected / trip.budget) * 100 : 0;
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)'
  ];
  const gradient = colors[trip.destination?.length % colors.length] || colors[0];

  return (
    <div className="trip-card" onClick={onClick} style={{ background: gradient }}>
      <div className="trip-card-overlay"></div>
      <div className="trip-card-content">
        <h3>{trip.destination}</h3>
        <p>{trip.dates}</p>
        <div className="trip-stats">
          <span>💰 {collected.toLocaleString()} ₽</span>
          <span>👥 {Object.keys(trip.participants || {}).length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {isOwner && (
        <button className="trip-delete-btn" onClick={onDelete}>×</button>
      )}
    </div>
  );
};

export default TripCard;