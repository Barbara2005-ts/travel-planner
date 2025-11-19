// src/App.jsx — TRIPFLOW 2025 — ТЫ СДЕЛАЛ ЭТО. ТЫ — БОГ.
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
      budgetCategories: {}
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

  // КОМПОНЕНТ АВАТАРКИ
  const ParticipantAvatar = ({ name }) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#A0D468'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div className="participant-avatar" style={{ background: color }}>
        {initials || '?'}
      </div>
    );
  };

  // Пустые состояния
  const EmptyState = ({ icon, message }) => (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );

  if (showAuth) {
    return (
      <div className="auth">
        <div className="card">
          <h1>TripFlow</h1>
          <form onSubmit={handleAuth}>
            {isRegister && (
              <input 
                placeholder="Имя" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            )}
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <button type="submit" className="primary">
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
          <p>
            <button className="link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Войти' : 'Регистрация'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="container">
        <header>
          <h1>TripFlow</h1>
          <div className="greeting">
            Привет, <strong>{user.username || user.email.split('@')[0]}</strong>!
            <button className="logout" onClick={logout}>Выйти</button>
          </div>
        </header>

        <div className="new-trip-card">
          <h2>Новая поездка</h2>
          <div className="new-trip-grid">
            <input 
              placeholder="Куда едем?" 
              value={newTripDest} 
              onChange={e => setNewTripDest(e.target.value)} 
            />
            <input 
              type="date" 
              value={newTripStart} 
              onChange={e => setNewTripStart(e.target.value)} 
            />
            <input 
              type="date" 
              value={newTripEnd} 
              onChange={e => setNewTripEnd(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="Бюджет ₽" 
              value={newTripBudget} 
              onChange={e => setNewTripBudget(e.target.value)} 
              min="0"
            />
            <button className="primary" onClick={createNewTrip}>Создать</button>
          </div>
        </div>

        {trips.length === 0 ? (
          <EmptyState 
            icon="✈️" 
            message="У вас пока нет поездок. Создайте первую!" 
          />
        ) : (
          <div className="trips-grid">
            {trips.map(trip => {
              const collected = Object.values(trip.participants || {}).reduce((a, p) => a + (p.amount || 0), 0);
              const spent = Object.values(trip.budgetCategories || {}).reduce((a, b) => a + Number(b), 0);
              const progress = trip.budget > 0 ? (collected / trip.budget) * 100 : 0;
              
              return (
                <div key={trip.id} className="trip-card" onClick={() => setCurrentTrip(trip)}>
                  <div className="trip-card-header">
                    <h3>{trip.destination}</h3>
                    <p>{trip.dates}</p>
                  </div>
                  <div className="trip-card-body">
                    <div className="progress-label">
                      <span>Собрано: {collected.toLocaleString()} ₽</span>
                      <span>из {trip.budget.toLocaleString()} ₽</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <div className="spent-amount">
                      Потрачено: {spent.toLocaleString()} ₽
                    </div>
                  </div>
                  <button 
                    className="delete-btn trip-delete" 
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
    );
  }

  return (
    <div className="container">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.1} />}

      <button className="back-btn" onClick={() => setCurrentTrip(null)}>
        ← Назад к поездкам
      </button>

      <h1 className="trip-title">{currentTrip.destination}</h1>
      <p className="trip-dates">{currentTrip.dates}</p>

      <div className="money-overview">
        <div className="progress-label big">
          <span>Собрано: {totalCollected.toLocaleString()} ₽</span>
          <span>из {totalBudget.toLocaleString()} ₽</span>
        </div>
        <div className="progress-bar big">
          <div 
            className="progress-fill" 
            style={{ width: `${totalBudget > 0 ? (totalCollected / totalBudget) * 100 : 0}%` }} 
          />
        </div>
        <div className="spent-amount">
          Потрачено: {totalSpent.toLocaleString()} ₽
        </div>
      </div>

      <div className="modal-tabs">
        <button 
          className={activeTab === 'checklist' ? 'active' : ''} 
          onClick={() => setActiveTab('checklist')}
        >
          Чеклист
        </button>
        <button 
          className={activeTab === 'participants' ? 'active' : ''} 
          onClick={() => setActiveTab('participants')}
        >
          Участники
        </button>
        <button 
          className={activeTab === 'budget' ? 'active' : ''} 
          onClick={() => setActiveTab('budget')}
        >
          Бюджет
        </button>
      </div>

      {activeTab === 'checklist' && (
        <div className="section-card">
          <div 
            className="progress-label" 
            style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              color: checklistDone === checklistTotal && checklistTotal > 0 ? '#4ade80' : 'inherit' 
            }}
          >
            {checklistDone === checklistTotal && checklistTotal > 0 ? (
              <>ВСЁ ГОТОВО К ПОЕЗДКЕ! 🎉</>
            ) : (
              <>Выполнено: {checklistDone} из {checklistTotal}</>
            )}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{
                width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%`,
                background: checklistDone === checklistTotal ? '#4ade80' : undefined 
              }} 
            />
          </div>

          <div className="add-item">
            <input 
              placeholder="Что нужно сделать?" 
              value={newItemText} 
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()} 
            />
            <button className="primary" onClick={addItem}>+ Добавить</button>
          </div>

          <div className="items-list">
            {Object.keys(currentTrip.checklist || {}).length === 0 ? (
              <EmptyState 
                icon="📝" 
                message="Добавьте пункты в чек-лист для подготовки к поездке" 
              />
            ) : (
              Object.entries(currentTrip.checklist || {}).map(([id, item]) => (
                <div 
                  key={id} 
                  className={`item-card ${item.done ? 'done' : ''}`} 
                  onClick={() => toggleItem(id)}
                >
                  <div className="checkbox">{item.done && '✔'}</div>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="section-card">
          <div className="add-item">
            <input 
              placeholder="Имя участника" 
              value={newParticipantName} 
              onChange={e => setNewParticipantName(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="₽" 
              value={newParticipantAmount} 
              onChange={e => setNewParticipantAmount(e.target.value)}
              min="0"
            />
            <button className="primary" onClick={addParticipantHandler}>Добавить</button>
          </div>
          <div className="items-list">
            {Object.keys(currentTrip.participants || {}).length === 0 ? (
              <EmptyState 
                icon="👥" 
                message="Добавьте участников поездки" 
              />
            ) : (
              Object.entries(currentTrip.participants || {}).map(([id, p]) => (
                <div key={id} className="budget-item participant-item">
                  <ParticipantAvatar name={p.name} />
                  <div className="participant-info">
                    <strong>{p.name}</strong>
                  </div>
                  <div className="participant-actions">
                    <strong>{(p.amount || 0).toLocaleString()} ₽</strong>
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
        <div className="section-card">
          <div className="add-item">
            <input 
              placeholder="Категория (еда, транспорт...)" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="₽" 
              value={newAmount} 
              onChange={e => setNewAmount(e.target.value)}
              min="0"
            />
            <button className="primary" onClick={addBudgetHandler}>Добавить</button>
          </div>
          <div className="items-list">
            {Object.keys(currentTrip.budgetCategories || {}).length === 0 ? (
              <EmptyState 
                icon="💰" 
                message="Добавьте категории расходов для отслеживания бюджета" 
              />
            ) : (
              Object.entries(currentTrip.budgetCategories || {}).map(([cat, amount]) => (
                <div key={cat} className="budget-item">
                  <div className="budget-item-content">
                    <span className="category-name">{cat}</span>
                    <div className="budget-actions">
                      <strong>{Number(amount).toLocaleString()} ₽</strong>
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
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;