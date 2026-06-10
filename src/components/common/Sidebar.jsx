import React from 'react';
import Avatar from './Avatar';

const Sidebar = ({ user, isAdmin, currentView, onViewChange, onLogout, onShowInvites, invitesCount }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span>✈️</span>
          <h1>TripFlow</h1>
        </div>
      </div>
      
      <div className="nav-menu">
        <button 
          className={`nav-link ${currentView === 'trips' ? 'active' : ''}`} 
          onClick={() => onViewChange('trips')}
        >
          Мои поездки
        </button>
        {isAdmin && (
          <button 
            className={`nav-link admin ${currentView === 'admin' ? 'active' : ''}`} 
            onClick={() => onViewChange('admin')}
          >
            Админ панель
          </button>
        )}
      </div>
      
      <div className="user-section">
        <Avatar name={user.username || user.email} size={48} />
        <div className="user-info">
          <div className="user-name">{user.username || user.email.split('@')[0]}</div>
          <div className="user-email">{user.email}</div>
          {isAdmin && <div className="admin-badge">Админ</div>}
        </div>
        <button className="notifications-btn" onClick={onShowInvites}>
          🔔 {invitesCount > 0 && <span className="notifications-badge">{invitesCount}</span>}
        </button>
        <button className="logout-btn" onClick={onLogout}>🚪</button>
      </div>
    </div>
  );
};

export default Sidebar;