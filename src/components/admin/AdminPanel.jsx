import React, { useState, useEffect } from 'react';
import { getAllUsers, getAdminStats, updateUserRole, toggleUserBlock } from '../../firebase/firebaseApi';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await getAdminStats();
      setStats(statsData);
      getAllUsers(setUsers);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Изменить роль пользователя на "${newRole === 'admin' ? 'Администратора' : 'Обычного пользователя'}"?`)) {
      await updateUserRole(userId, newRole);
      loadData();
      alert(`Роль успешно изменена на ${newRole === 'admin' ? 'Администратора' : 'Пользователя'}`);
    }
  };

  const handleBlockToggle = async (userId, isBlocked, userName) => {
    const action = isBlocked ? 'разблокировать' : 'заблокировать';
    if (window.confirm(`Вы уверены, что хотите ${action} пользователя "${userName || 'Без имени'}"?`)) {
      await toggleUserBlock(userId, !isBlocked);
      loadData();
      alert(`Пользователь ${action}н`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel-view">
      <div className="admin-header">
        <h2>Панель администратора</h2>
        <p>Управление пользователями и статистика системы</p>
      </div>
      
      <div className="admin-stats-cards">
        <div className="stat-card-primary">
          <div className="stat-info">
            <div className="stat-number">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Всего пользователей</div>
          </div>
        </div>
        <div className="stat-card-primary success">
          <div className="stat-info">
            <div className="stat-number">{stats?.totalTrips || 0}</div>
            <div className="stat-label">Всего поездок</div>
          </div>
        </div>
        <div className="stat-card-primary info">
          <div className="stat-info">
            <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Администраторов</div>
          </div>
        </div>
        <div className="stat-card-primary warning">
          <div className="stat-info">
            <div className="stat-number">{users.filter(u => u.isBlocked).length}</div>
            <div className="stat-label">Заблокированных</div>
          </div>
        </div>
      </div>
      
      <div className="admin-tabs">
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
          Статистика
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          Управление пользователями
        </button>
      </div>
      
      {activeTab === 'stats' && stats && (
        <div className="admin-stats-detailed">
          <h3>Детальная статистика</h3>
          <div className="stats-grid">
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{stats.totalUsers}</div>
                <div className="stat-detail-label">Зарегистрированных пользователей</div>
              </div>
            </div>
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{stats.totalTrips}</div>
                <div className="stat-detail-label">Созданных поездок</div>
              </div>
            </div>
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{users.filter(u => u.role === 'admin').length}</div>
                <div className="stat-detail-label">Администраторов</div>
              </div>
            </div>
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{users.filter(u => u.isBlocked).length}</div>
                <div className="stat-detail-label">Заблокированных пользователей</div>
              </div>
            </div>
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{users.filter(u => !u.isBlocked).length}</div>
                <div className="stat-detail-label">Активных пользователей</div>
              </div>
            </div>
            <div className="stat-detail-card">
              <div className="stat-detail-info">
                <div className="stat-detail-value">{new Date().toLocaleDateString()}</div>
                <div className="stat-detail-label">Текущая дата</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="admin-users-section">
          <div className="users-search">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Поиск по имени или email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>✖</button>
              )}
            </div>
            <div className="users-count">
              Найдено: <strong>{filteredUsers.length}</strong> из <strong>{users.length}</strong> пользователей
            </div>
          </div>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-results">
                      <div className="no-results-content">
                        <span>🔍</span>
                        <p>Пользователи не найдены</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className={u.isBlocked ? 'blocked-row' : ''}>
                      <td className="user-cell">
                        <div className="user-avatar-small">
                          {u.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="user-name-cell">{u.username || 'Без имени'}</span>
                      </td>
                      <td className="user-email-cell">{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.isBlocked ? 'blocked' : 'active'}`}>
                          {u.isBlocked ? '🔒 Заблокирован' : '✅ Активен'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {u.role !== 'admin' && (
                          <button 
                            className="action-btn make-admin"
                            onClick={() => handleRoleChange(u.id, u.role)}
                            title="Сделать администратором"
                          >
                            👑
                          </button>
                        )}
                        {u.role === 'admin' && users.filter(uu => uu.role === 'admin').length > 1 && (
                          <button 
                            className="action-btn remove-admin"
                            onClick={() => handleRoleChange(u.id, u.role)}
                            title="Снять права администратора"
                          >
                            🔽
                          </button>
                        )}
                        <button 
                          className={`action-btn ${u.isBlocked ? 'unblock' : 'block'}`}
                          onClick={() => handleBlockToggle(u.id, u.isBlocked, u.username)}
                          title={u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {u.isBlocked ? '🔓' : '🔒'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;