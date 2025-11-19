// src/App.jsx — TRIPFLOW 2025 — ПРЕМИУМ ДИЗАЙН
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import {
  register, login, subscribeToTrips, createTrip, deleteTrip,
  addChecklistItem, toggleChecklist,
  addParticipant, removeParticipant,
  updateBudgetCategory, removeBudgetCategory
} from './firebaseApi.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('checklist');
  const [showConfetti, setShowConfetti] = useState(false);

  // Авторизация
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showAuth, setShowAuth] = useState(true);

  // Создание поездки
  const [newTripDest, setNewTripDest] = useState('');
  const [newTripStart, setNewTripStart] = useState('');
  const [newTripEnd, setNewTripEnd] = useState('');
  const [newTripBudget, setNewTripBudget] = useState('');

  // Остальное
  const [newItemText, setNewItemText] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantAmount, setNewParticipantAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const [unsubscribeTrips, setUnsubscribeTrips] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setShowAuth(false);
      startTripsListener(u.email);
    }
  }, []);

  const startTripsListener = (email) => {
    if (unsubscribeTrips) unsubscribeTrips();
    const unsub = subscribeToTrips(email, (data) => {
      setTrips(data);
      if (currentTrip) {
        const updated = data.find(t => t.id === currentTrip.id);
        if (updated) setCurrentTrip(updated);
      }
    });
    setUnsubscribeTrips(() => unsub);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const u = isRegister ? await register(username, email) : await login(email);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      setShowAuth(false);
      startTripsListener(u.email);
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    if (unsubscribeTrips) {
      unsubscribeTrips();
      setUnsubscribeTrips(null);
    }
    localStorage.removeItem('user');
    setUser(null);
    setTrips([]);
    setCurrentTrip(null);
    setShowAuth(true);
    setShowConfetti(false);
  };

  const createNewTrip = async () => {
    if (!newTripDest.trim() || !newTripBudget || !newTripStart || !newTripEnd) {
      alert('Заполните все поля');
      return;
    }
    
    if (new Date(newTripStart) > new Date(newTripEnd)) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }
    
    if (Number(newTripBudget) <= 0) {
      alert('Бюджет должен быть положительным числом');
      return;
    }

    const tripData = {
      destination: newTripDest.trim(),
      dates: `${newTripStart} → ${newTripEnd}`,
      budget: Number(newTripBudget),
      checklist: {},
      participants: {},
      budgetCategories: {},
      createdAt: new Date().toISOString()
    };
    
    await createTrip(user.email, tripData);
    setNewTripDest('');
    setNewTripStart('');
    setNewTripEnd('');
    setNewTripBudget('');
  };

  const addItem = async () => {
    if (!newItemText.trim() || !currentTrip) return;
    await addChecklistItem(user.email, currentTrip.id, newItemText.trim());
    setNewItemText('');
  };

  const toggleItem = async (id) => {
    await toggleChecklist(user.email, currentTrip.id, id);
  };

  const addParticipantHandler = async () => {
    if (!newParticipantName.trim() || !currentTrip) return;
    const amount = Number(newParticipantAmount) || 0;
    if (amount < 0) {
      alert('Сумма не может быть отрицательной');
      return;
    }
    await addParticipant(user.email, currentTrip.id, newParticipantName.trim(), amount);
    setNewParticipantName('');
    setNewParticipantAmount('');
  };

  const removeParticipantHandler = async (id) => {
    if (!confirm('Удалить участника?')) return;
    try {
      await removeParticipant(user.email, currentTrip.id, id);
    } catch (err) {
      alert('Ошибка при удалении участника');
    }
  };

  const addBudgetHandler = async () => {
    if (!newCategory.trim() || !currentTrip) return;
    const amount = Number(newAmount) || 0;
    if (amount < 0) {
      alert('Сумма не может быть отрицательной');
      return;
    }
    await updateBudgetCategory(user.email, currentTrip.id, newCategory.trim(), amount);
    setNewCategory('');
    setNewAmount('');
  };

  const removeBudgetCategoryHandler = async (category) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await removeBudgetCategory(user.email, currentTrip.id, category);
    } catch (err) {
      alert('Ошибка при удалении категории');
    }
  };

  const deleteTripHandler = async (tripId, e) => {
    e.stopPropagation();
    if (!confirm('Удалить поездку? Это действие нельзя отменить.')) return;
    try {
      await deleteTrip(user.email, tripId);
      if (currentTrip && currentTrip.id === tripId) {
        setCurrentTrip(null);
      }
    } catch (err) {
      alert('Ошибка при удалении поездки');
    }
  };

  // Подсчёты
  const totalBudget = currentTrip?.budget || 0;
  const totalSpent = currentTrip ? Object.values(currentTrip.budgetCategories || {}).reduce((a, b) => a + Number(b), 0) : 0;
  const totalCollected = currentTrip ? Object.values(currentTrip.participants || {}).reduce((a, p) => a + Number(p.amount || 0), 0) : 0;
  const checklistDone = currentTrip ? Object.values(currentTrip.checklist || {}).filter(i => i.done).length : 0;
  const checklistTotal = Object.keys(currentTrip?.checklist || {}).length;

  // КОНФЕТТИ ПРИ 100% ЧЕК-ЛИСТА
  useEffect(() => {
    if (checklistTotal > 0 && checklistDone === checklistTotal && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    }
  }, [checklistDone, checklistTotal, showConfetti]);

  // Генерация градиента на основе названия поездки
  const generateGradient = (text) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
    ];
    return colors[text?.length % colors.length] || colors[0];
  };

  // КОМПОНЕНТ АВАТАРКИ
  const ParticipantAvatar = ({ name, size = 42 }) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#A0D468'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div 
        className="participant-avatar" 
        style={{ 
          background: color,
          width: size,
          height: size
        }}
      >
        {initials || '?'}
      </div>
    );
  };

  // ИКОНКИ ДЛЯ КАТЕГОРИЙ
  const getCategoryIcon = (category) => {
    const icons = {
      'еда': '🍕',
      'транспорт': '🚗',
      'жилье': '🏨',
      'развлечения': '🎭',
      'шопинг': '🛍️',
      'сувениры': '🎁',
      'экскурсии': '🗺️',
      'прочее': '📦'
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerCategory.includes(key)) return icon;
    }
    return '💰';
  };

  // Пустые состояния
  const EmptyState = ({ icon, message, gradient }) => (
    <div className="empty-state" style={{ background: gradient }}>
      <div className="empty-icon">{icon}</div>
      <h3>{message}</h3>
    </div>
  );

  if (showAuth) {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="floating-icon">✈️</div>
          <div className="floating-icon">🏝️</div>
          <div className="floating-icon">🗺️</div>
          <div className="floating-icon">🎒</div>
        </div>
        
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <span className="logo-icon">✈️</span>
              <h1>TripFlow</h1>
            </div>
            <p className="auth-subtitle">Планируйте путешествия с легкостью</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {isRegister && (
              <div className="input-group">
                <div className="input-icon">👤</div>
                <input 
                  placeholder="Ваше имя" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
            )}
            
            <div className="input-group">
              <div className="input-icon">📧</div>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <button type="submit" className="auth-btn primary">
              <span>{isRegister ? 'Создать аккаунт' : 'Войти'}</span>
              <span className="btn-icon">→</span>
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isRegister ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}
              <button className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="dashboard">
        {/* Боковая панель */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">✈️</span>
              <h1>TripFlow</h1>
            </div>
          </div>
          
          <div className="user-section">
            <div className="user-avatar">
              <ParticipantAvatar name={user.username || user.email} size={48} />
            </div>
            <div className="user-info">
              <div className="user-name">{user.username || user.email.split('@')[0]}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Выйти">
              <span className="logout-icon">🚪</span>
            </button>
          </div>

          <div className="sidebar-stats">
            <div className="stat-card">
              <div className="stat-icon">🧳</div>
              <div className="stat-info">
                <div className="stat-number">{trips.length}</div>
                <div className="stat-label">поездок</div>
              </div>
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div className="main-content">
          <div className="content-header">
            <h2>Мои поездки</h2>
            <p>Планируйте и отслеживайте ваши путешествия</p>
          </div>

          {/* Карточка создания поездки */}
          <div className="create-trip-card">
            <div className="create-trip-header">
              <h3>Новая поездка</h3>
              <div className="create-steps">1/4</div>
            </div>
            
            <div className="create-trip-grid">
              <div className="input-group">
                <label>📍 Куда едем?</label>
                <input 
                  placeholder="Например, Париж, Франция" 
                  value={newTripDest} 
                  onChange={e => setNewTripDest(e.target.value)} 
                />
              </div>
              
              <div className="input-group">
                <label>📅 Дата начала</label>
                <input 
                  type="date" 
                  value={newTripStart} 
                  onChange={e => setNewTripStart(e.target.value)} 
                />
              </div>
              
              <div className="input-group">
                <label>📅 Дата окончания</label>
                <input 
                  type="date" 
                  value={newTripEnd} 
                  onChange={e => setNewTripEnd(e.target.value)} 
                />
              </div>
              
              <div className="input-group">
                <label>💰 Бюджет</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  value={newTripBudget} 
                  onChange={e => setNewTripBudget(e.target.value)} 
                  min="0"
                />
              </div>
            </div>
            
            <button className="create-trip-btn" onClick={createNewTrip}>
              <span>Создать поездку</span>
              <span className="btn-icon">✈️</span>
            </button>
          </div>

          {/* Сетка поездок */}
          {trips.length === 0 ? (
            <EmptyState 
              icon="🌍"
              message="Создайте свою первую поездку!"
              gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
            />
          ) : (
            <div className="trips-grid">
              {trips.map(trip => {
                const collected = Object.values(trip.participants || {}).reduce((a, p) => a + (p.amount || 0), 0);
                const spent = Object.values(trip.budgetCategories || {}).reduce((a, b) => a + Number(b), 0);
                const progress = trip.budget > 0 ? (collected / trip.budget) * 100 : 0;
                const gradient = generateGradient(trip.destination);
                
                return (
                  <div 
                    key={trip.id} 
                    className="trip-card" 
                    onClick={() => setCurrentTrip(trip)}
                    style={{ background: gradient }}
                  >
                    <div className="trip-card-overlay"></div>
                    
                    <div className="trip-card-content">
                      <div className="trip-card-header">
                        <h3>{trip.destination}</h3>
                        <p className="trip-dates">{trip.dates}</p>
                      </div>
                      
                      <div className="trip-stats">
                        <div className="trip-stat">
                          <span className="stat-label">Собрано</span>
                          <span className="stat-value">{collected.toLocaleString()} ₽</span>
                        </div>
                        <div className="trip-stat">
                          <span className="stat-label">Потрачено</span>
                          <span className="stat-value">{spent.toLocaleString()} ₽</span>
                        </div>
                      </div>
                      
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Бюджет: {trip.budget.toLocaleString()} ₽</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="trip-delete-btn" 
                      onClick={(e) => deleteTripHandler(trip.id, e)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="trip-detail">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.1} />}

      {/* Боковая панель */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => setCurrentTrip(null)}>
            <span className="back-icon">←</span>
            Назад
          </button>
        </div>
        
        <div className="trip-info-sidebar">
          <div 
            className="trip-cover"
            style={{ background: generateGradient(currentTrip.destination) }}
          >
            <h2>{currentTrip.destination}</h2>
            <p>{currentTrip.dates}</p>
          </div>
          
          <div className="trip-quick-stats">
            <div className="quick-stat">
              <div className="quick-stat-icon">💰</div>
              <div className="quick-stat-info">
                <div className="quick-stat-value">{totalCollected.toLocaleString()} ₽</div>
                <div className="quick-stat-label">собрано</div>
              </div>
            </div>
            
            <div className="quick-stat">
              <div className="quick-stat-icon">💸</div>
              <div className="quick-stat-info">
                <div className="quick-stat-value">{totalSpent.toLocaleString()} ₽</div>
                <div className="quick-stat-label">потрачено</div>
              </div>
            </div>
            
            <div className="quick-stat">
              <div className="quick-stat-icon">✅</div>
              <div className="quick-stat-info">
                <div className="quick-stat-value">{checklistDone}/{checklistTotal}</div>
                <div className="quick-stat-label">задач</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="trip-main-content">
        <div className="trip-header">
          <div className="trip-title-section">
            <h1>{currentTrip.destination}</h1>
            <p className="trip-dates">{currentTrip.dates}</p>
          </div>
          
          <div className="budget-overview">
            <div className="budget-progress">
              <div className="progress-header">
                <span>Общий бюджет: {totalBudget.toLocaleString()} ₽</span>
                <span>{Math.round((totalCollected / totalBudget) * 100)}%</span>
              </div>
              <div className="progress-bar large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${totalBudget > 0 ? (totalCollected / totalBudget) * 100 : 0}%` }} 
                />
              </div>
              <div className="budget-details">
                <div className="budget-item">
                  <span className="budget-label">Собрано:</span>
                  <span className="budget-value">{totalCollected.toLocaleString()} ₽</span>
                </div>
                <div className="budget-item">
                  <span className="budget-label">Потрачено:</span>
                  <span className="budget-value spent">{totalSpent.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="trip-tabs">
          <button 
            className={`trip-tab ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('checklist')}
          >
            <span className="tab-icon">✅</span>
            Чеклист
            {checklistTotal > 0 && (
              <span className="tab-badge">{checklistDone}/{checklistTotal}</span>
            )}
          </button>
          
          <button 
            className={`trip-tab ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            <span className="tab-icon">👥</span>
            Участники
            {Object.keys(currentTrip.participants || {}).length > 0 && (
              <span className="tab-badge">{Object.keys(currentTrip.participants || {}).length}</span>
            )}
          </button>
          
          <button 
            className={`trip-tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <span className="tab-icon">💰</span>
            Бюджет
          </button>
        </div>

        {/* Контент табов */}
        <div className="tab-content">
          {activeTab === 'checklist' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h3>Чеклист подготовки</h3>
                <div className="completion-status">
                  {checklistDone === checklistTotal && checklistTotal > 0 ? (
                    <div className="completed-badge">
                      🎉 Всё готово к поездке!
                    </div>
                  ) : (
                    <div className="progress-text">
                      Выполнено: {checklistDone} из {checklistTotal}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill success" 
                  style={{
                    width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%`
                  }} 
                />
              </div>

              <div className="add-item-card">
                <div className="input-group">
                  <input 
                    placeholder="Что нужно сделать? Например, купить билеты..." 
                    value={newItemText} 
                    onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()} 
                  />
                  <button className="add-btn" onClick={addItem}>
                    <span>Добавить</span>
                    <span className="btn-icon">+</span>
                  </button>
                </div>
              </div>

              <div className="checklist-items">
                {Object.keys(currentTrip.checklist || {}).length === 0 ? (
                  <EmptyState 
                    icon="📝"
                    message="Добавьте пункты в чек-лист для подготовки к поездке"
                    gradient="linear-gradient(135deg, #d299c2 0%, #2f0664ff 100%)"
                  />
                ) : (
                  Object.entries(currentTrip.checklist || {}).map(([id, item]) => (
                    <div 
                      key={id} 
                      className={`checklist-item ${item.done ? 'completed' : ''}`}
                      onClick={() => toggleItem(id)}
                    >
                      <div className="checklist-item-content">
                        <div className="checkbox">
                          {item.done && <div className="checkmark">✓</div>}
                        </div>
                        <span className="item-text">{item.text}</span>
                      </div>
                      <div className="item-actions">
                        <div className="item-status">
                          {item.done ? 'Выполнено' : 'Не выполнено'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h3>Участники поездки</h3>
                <div className="participants-summary">
                  Всего: {Object.keys(currentTrip.participants || {}).length} участников
                </div>
              </div>

              <div className="add-participant-card">
                <div className="input-grid">
                  <div className="input-group">
                    <input 
                      placeholder="Имя участника" 
                      value={newParticipantName} 
                      onChange={e => setNewParticipantName(e.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <input 
                      type="number" 
                      placeholder="Вклад (₽)" 
                      value={newParticipantAmount} 
                      onChange={e => setNewParticipantAmount(e.target.value)}
                      min="0"
                    />
                  </div>
                  <button className="add-btn" onClick={addParticipantHandler}>
                    <span>Добавить</span>
                    <span className="btn-icon">👤</span>
                  </button>
                </div>
              </div>

              <div className="participants-list">
                {Object.keys(currentTrip.participants || {}).length === 0 ? (
                  <EmptyState 
                    icon="👥"
                    message="Добавьте участников поездки"
                    gradient="linear-gradient(135deg, #a8edea 0%, #5126ecff 100%)"
                  />
                ) : (
                  Object.entries(currentTrip.participants || {}).map(([id, p]) => (
                    <div key={id} className="participant-card">
                      <div className="participant-info">
                        <ParticipantAvatar name={p.name} size={50} />
                        <div className="participant-details">
                          <h4>{p.name}</h4>
                          <p>Участник поездки</p>
                        </div>
                      </div>
                      
                      <div className="participant-contribution">
                        <div className="contribution-amount">
                          {(p.amount || 0).toLocaleString()} ₽
                        </div>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeParticipantHandler(id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h3>Управление бюджетом</h3>
                <div className="budget-summary">
                  Остаток: {(totalCollected - totalSpent).toLocaleString()} ₽
                </div>
              </div>

              <div className="add-budget-card">
                <div className="input-grid">
                  <div className="input-group">
                    <input 
                      placeholder="Категория (еда, транспорт...)" 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <input 
                      type="number" 
                      placeholder="Сумма (₽)" 
                      value={newAmount} 
                      onChange={e => setNewAmount(e.target.value)}
                      min="0"
                    />
                  </div>
                  <button className="add-btn" onClick={addBudgetHandler}>
                    <span>Добавить</span>
                    <span className="btn-icon">💰</span>
                  </button>
                </div>
              </div>

              <div className="budget-categories">
                {Object.keys(currentTrip.budgetCategories || {}).length === 0 ? (
                  <EmptyState 
                    icon="💸"
                    message="Добавьте категории расходов"
                    gradient="linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)"
                  />
                ) : (
                  Object.entries(currentTrip.budgetCategories || {}).map(([cat, amount]) => (
                    <div key={cat} className="budget-category-card">
                      <div className="category-info">
                        <div className="category-icon">
                          {getCategoryIcon(cat)}
                        </div>
                        <div className="category-details">
                          <h4>{cat}</h4>
                          <p>Расходы</p>
                        </div>
                      </div>
                      
                      <div className="category-amount">
                        <div className="amount">{Number(amount).toLocaleString()} ₽</div>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBudgetCategoryHandler(cat);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;