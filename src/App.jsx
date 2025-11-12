// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  register, 
  login, 
  createTrip, 
  deleteTrip, 
  sendInvitation, 
  acceptInvitation,
  subscribeToInvitations,
  unsubscribeFromInvitations,
  subscribeToTrips,
  unsubscribeFromTrips,
  migrateOldUserData
} from './services/firebaseApi';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [tripFormData, setTripFormData] = useState({
    name: '', description: '', destination: '', startDate: '', endDate: '', budget: ''
  });
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // === АВТОРИЗАЦИЯ + МИГРАЦИЯ ===
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.username, formData.email, formData.password);

      const userData = res.user;
      setUser(userData);
      setMessage(isLogin ? 'Вход успешен!' : 'Регистрация успешна!');
      setFormData({ username: '', email: '', password: '' });

      if (isLogin) {
        try {
          await migrateOldUserData(userData);
        } catch (err) {
          console.warn('Миграция не удалась:', err);
        }
      }
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // === ПРИГЛАШЕНИЕ ===
  const handleInvite = async (tripId) => {
    if (!user || !inviteEmail) return;
    try {
      await sendInvitation(tripId, inviteEmail, user.id);
      setMessage('Приглашение отправлено!');
      setInviteEmail('');
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    }
  };

  // === ПРИНЯТИЕ ===
  const handleAcceptInvite = async (tripId) => {
    if (!user) return;
    try {
      await acceptInvitation(tripId, user.id);
      setMessage('Вы присоединились!');
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    }
  };

  // === СОЗДАНИЕ ===
  const handleTripSubmit = async (e) => {
    if (!user) return;
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!isValidDate(tripFormData.startDate) || !isValidDate(tripFormData.endDate)) {
      setMessage('Некорректные даты');
      setLoading(false);
      return;
    }
    if (!isFutureDate(tripFormData.startDate)) {
      setMessage('Дата начала в прошлом');
      setLoading(false);
      return;
    }
    if (new Date(tripFormData.startDate) >= new Date(tripFormData.endDate)) {
      setMessage('Дата окончания раньше начала');
      setLoading(false);
      return;
    }

    try {
      const tripData = {
        ...tripFormData,
        createdBy: user.id,
        username: user.username,
        budget: parseInt(tripFormData.budget) || 0
      };
      await createTrip(tripData);
      setMessage('Путешествие создано!');
      setShowTripForm(false);
      setTripFormData({ name: '', description: '', destination: '', startDate: '', endDate: '', budget: '' });
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // === УДАЛЕНИЕ ===
  const handleDeleteTrip = async (tripId, tripName) => {
    if (!user) return;
    if (!window.confirm(`Удалить "${tripName}"?`)) return;
    try {
      await deleteTrip(tripId, user.id);
      setMessage('Путешествие удалено');
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    }
  };

  // === ВЫХОД ===
  const handleLogout = () => {
    setUser(null);
    setTrips([]);
    setPendingInvites([]);
    setSelectedTrip(null);
    setMessage('Вы вышли из системы');
  };

  // === ВАЛИДАЦИЯ ===
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isFutureDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    return date >= today;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU');
  const formatBudget = (b) => new Intl.NumberFormat('ru-RU').format(b) + ' ₽';

  // === РЕАЛТАЙМ + ЗАЩИТА ===
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    const unsubscribeTrips = subscribeToTrips(user.id, (tripData) => {
      setTrips(tripData || []);
      setLoadingData(false);
    });

    const unsubscribeInvites = subscribeToInvitations(user.id, (inviteData) => {
      setPendingInvites(inviteData || []);
    });

    return () => {
      unsubscribeFromTrips();
      unsubscribeFromInvitations();
    };
  }, [user]);

  // === АВТО-ОЧИСТКА СООБЩЕНИЙ ===
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // === ЭКРАН АВТОРИЗАЦИИ ===
  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Планировщик Путешествий</h1>
          <div style={{ width: 380, background: 'rgba(255,255,255,0.1)', padding: 30, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
            {message && (
              <div style={{ padding: 12, marginBottom: 15, background: message.includes('Ошибка') ? 'rgba(220,53,69,0.3)' : 'rgba(40,167,69,0.3)', borderRadius: 8, textAlign: 'center' }}>
                {message}
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              {!isLogin && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Имя пользователя</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    placeholder="Ваше имя"
                  />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="example@mail.ru"
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: 14, background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
              </button>
            </form>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ marginTop: 20, background: 'none', border: 'none', color: '#4da6ff', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </header>
      </div>
    );
  }

  // === ОСНОВНОЙ ЭКРАН ===
  return (
    <div className="App">
      <header className="App-header" style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Путешествия</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>Привет, <strong>{user.username}</strong>!</span>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6 }}>Выйти</button>
          </div>
        </div>

        {pendingInvites.length > 0 && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <strong>Новые приглашения ({pendingInvites.length})</strong>
            {pendingInvites.map(inv => (
              <div key={inv.tripId} style={{ margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{inv.inviter}</strong> приглашает в "<em>{inv.tripName}</em>"</span>
                <button
                  onClick={() => handleAcceptInvite(inv.tripId)}
                  style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 14 }}
                >
                  Принять
                </button>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div style={{ padding: 12, marginBottom: 20, background: message.includes('Ошибка') ? 'rgba(220,53,69,0.3)' : 'rgba(40,167,69,0.3)', borderRadius: 8, textAlign: 'center' }}>
            {message}
          </div>
        )}

        {showTripForm ? (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: 28, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <h3>Новое путешествие</h3>
            <form onSubmit={handleTripSubmit}>
              <input name="name" placeholder="Название" value={tripFormData.name} onChange={e => setTripFormData({ ...tripFormData, name: e.target.value })} required style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              <textarea name="description" placeholder="Описание" value={tripFormData.description} onChange={e => setTripFormData({ ...tripFormData, description: e.target.value })} style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, minHeight: 70, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              <input name="destination" placeholder="Куда едете?" value={tripFormData.destination} onChange={e => setTripFormData({ ...tripFormData, destination: e.target.value })} required style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <input type="date" name="startDate" value={tripFormData.startDate} onChange={e => setTripFormData({ ...tripFormData, startDate: e.target.value })} required style={{ padding: 12, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                <input type="date" name="endDate" value={tripFormData.endDate} onChange={e => setTripFormData({ ...tripFormData, endDate: e.target.value })} required style={{ padding: 12, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              </div>
              <input type="number" name="budget" placeholder="Бюджет (₽)" value={tripFormData.budget} onChange={e => setTripFormData({ ...tripFormData, budget: e.target.value })} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: 14, background: '#28a745', color: '#fff', border: 'none', borderRadius: 8 }}>{loading ? 'Создаём...' : 'Создать'}</button>
                <button type="button" onClick={() => setShowTripForm(false)} style={{ flex: 1, padding: 14, background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8 }}>Отмена</button>
              </div>
            </form>
          </div>
        ) : selectedTrip ? (
          <div>
            <button onClick={() => setSelectedTrip(null)} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, marginBottom: 20 }}>Назад</button>
            <h2>{selectedTrip.name}</h2>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 24, borderRadius: 12 }}>
              <p><strong>Описание:</strong> {selectedTrip.description || '—'}</p>
              <p><strong>Куда:</strong> {selectedTrip.destination}</p>
              <p><strong>Даты:</strong> {formatDate(selectedTrip.startDate)} — {formatDate(selectedTrip.endDate)}</p>
              <p><strong>Бюджет:</strong> {formatBudget(selectedTrip.budget)}</p>
              <p><strong>Участники:</strong> {Array.isArray(selectedTrip.members) 
                ? selectedTrip.members.map(m => `${m.username} (${m.role === 'admin' ? 'Админ' : 'Участник'})`).join(', ')
                : '—'
              }</p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2>Мои путешествия</h2>
              <button onClick={() => setShowTripForm(true)} style={{ padding: '12px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16 }}>+ Создать</button>
            </div>

            {loadingData ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
                <p>Загрузка путешествий...</p>
              </div>
            ) : trips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
                <h3>Пока нет путешествий</h3>
                <p>Нажмите «Создать», чтобы начать планировать!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20 }}>
                {trips.map(trip => {
                  const members = Array.isArray(trip.members) ? trip.members : [];
                  const isAdmin = members.some(m => m?.userId === user.id && m?.role === 'admin');
                  return (
                    <div key={trip.id} style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 12, position: 'relative', backdropFilter: 'blur(5px)' }}>
                      {isAdmin && (
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                          <button onClick={() => handleDeleteTrip(trip.id, trip.name)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>Удалить</button>
                        </div>
                      )}
                      <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{trip.name}</h3>
                      <p style={{ margin: '4px 0', color: '#ddd' }}>{trip.description || 'Без описания'}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, fontSize: 14 }}>
                        <div><strong>Куда:</strong> {trip.destination}</div>
                        <div><strong>Даты:</strong> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</div>
                        <div><strong>Бюджет:</strong> {formatBudget(trip.budget)}</div>
                        <div><strong>Участники:</strong> {members.length}</div>
                      </div>

                      {isAdmin && (
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                          <input
                            type="email"
                            placeholder="Email участника"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                          />
                          <button
                            onClick={() => handleInvite(trip.id)}
                            style={{ padding: '10px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 6 }}
                          >
                            Пригласить
                          </button>
                        </div>
                      )}

                      <button onClick={() => setSelectedTrip(trip)} style={{ marginTop: 16, padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 8 }}>Открыть</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;