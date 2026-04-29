import React from 'react';

const Avatar = ({ name, size = 42 }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#667eea';
  const initials = name?.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  
  return (
    <div className="avatar" style={{ background: color, width: size, height: size }}>
      {initials}
    </div>
  );
};

export default Avatar;