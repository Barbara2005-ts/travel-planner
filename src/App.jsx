import React, { useState, useEffect } from 'react';
import { 
  register, login, createTrip, deleteTrip, 
  sendInvites, acceptInvite, subscribeToData 
} from './services/firebaseApi';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '' });
  const [tripForm, setTripForm] = useState({ name: '', destination: '', startDate: '', endDate: '', budget: '' });
  const [inviteEmails, setInviteEmails] = useState('');
  const [data, setData] = useState({ trips: [], invites: [] });
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // === АВТОВХОД ===
  useEffect(() => {
    const saved = localStorage.getItem('tripUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // === АВТОРИЗАЦИЯ ===
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = isLogin ? await login(form.email) : await register(form.username, form.email);
      setUser(res);
      localStorage.setItem('tripUser', JSON.stringify(res));
      setForm({ username: '', email: '' });
      setMessage(isLogin ? 'Вошли!' : 'Зарегистрированы!');
    } catch (err) {
      setMessage('Ошибка: ' + err.message);
    }
  };

  // === СОЗДАНИЕ ПОЕЗДКИ ===
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await createTrip(user.id, user.username, tripForm);
      setTripForm({ name: '', destination: '', startDate: '', endDate: '', budget: '' });
      setShowForm(false);
      setMessage('Поездка создана!');
    } catch (err) {
      setMessage('Ошибка: ' + err.message);
    }
  };

  // === ПРИГЛАШЕНИЕ ===
  const handleInvite = async (tripId) => {
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (!emails.length) {
      setMessage('Введите email');
      return;
    }
    try {
      const sent = await sendInvites(tripId, emails, user.id);
      setInviteEmails('');
      setMessage(`Приглашения отправлены: ${sent.join(', ')}`);
    } catch (err) {
      setMessage('Ошибка: ' + err.message);
    }
  };

  // === РЕАЛТАЙМ ===
  useEffect(() => {
    if (!user) {
      setData({ trips: [], invites: [] });
      return;
    }
    const unsub = subscribeToData(user.id, setData);
    return () => unsub();
  }, [user]);

  // === СООБЩЕНИЯ ===
  useEffect(() => {
    if (message) setTimeout(() => setMessage(''), 3000);
  }, [message]);

  // === ВЫХОД ===
  const logout = () => {
    setUser(null);
    localStorage.removeItem('tripUser');
  };

  const formatDate = d => new Date(d).toLocaleDateString('ru');
  const formatBudget = b => new Intl.NumberFormat('ru').format(b) + ' ₽';

  // === ЭКРАН АВТОРИЗАЦИИ ===
  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>TripTogether</h1>
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          {message && <div className={`msg ${message.includes('Ошибка') ? 'error' : 'success'}`}>{message}</div>}
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input placeholder="Имя" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            )}
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          <button className="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть? Вход'}
          </button>
        </div>
      </div>
    );
  }

  // === ОСНОВНОЙ ЭКРАН ===
  return (
    <div className="app">
      <header>
        <h1>Мои поездки</h1>
        <div className="user">
          <span>{user.username}</span>
          <button onClick={logout} className="logout">Выйти</button>
        </div>
      </header>

      {data.invites.length > 0 && (
        <div className="invites">
          <h3>Приглашения ({data.invites.length})</h3>
          {data.invites.map(inv => (
            <div key={inv.tripId} className="invite-item">
              <span><strong>{inv.inviter}</strong> → "{inv.tripName}"</span>
              <button 
                onClick={async () => {
                  try {
                    await acceptInvite(inv.tripId, user.id, user.username);
                    setMessage('Присоединились к поездке!');
                  } catch (err) {
                    setMessage('Ошибка: ' + err.message);
                  }
                }}
              >
                Принять
              </button>
            </div>
          ))}
        </div>
      )}

      {message && <div className={`msg ${message.includes('Ошибка') ? 'error' : 'success'}`}>{message}</div>}

      {showForm ? (
        <div className="card">
          <h3>Новая поездка</h3>
          <form onSubmit={handleCreateTrip}>
            <input placeholder="Название" value={tripForm.name} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} required />
            <input placeholder="Куда" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} required />
            <div className="dates">
              <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })} required />
              <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })} required />
            </div>
            <input type="number" placeholder="Бюджет (₽)" value={tripForm.budget} onChange={e => setTripForm({ ...tripForm, budget: e.target.value })} />
            <div className="btns">
              <button type="submit">Создать</button>
              <button type="button" onClick={() => setShowForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      ) : selectedTrip ? (
        <div className="card">
          <button onClick={() => setSelectedTrip(null)} className="back">Назад</button>
          <h2>{selectedTrip.name}</h2>
          <p><strong>Куда:</strong> {selectedTrip.destination}</p>
          <p><strong>Даты:</strong> {formatDate(selectedTrip.startDate)} — {formatDate(selectedTrip.endDate)}</p>
          <p><strong>Бюджет:</strong> {formatBudget(selectedTrip.budget)}</p>
          <p><strong>Участники:</strong> {selectedTrip.members?.map(m => m.username).join(', ') || '—'}</p>
        </div>
      ) : (
        <div>
          <button onClick={() => setShowForm(true)} className="add-trip">+ Новая поездка</button>
          {data.trips.length === 0 ? (
            <p className="empty">Нет поездок. Создайте первую!</p>
          ) : (
            <div className="trips">
              {data.trips.map(trip => {
                const members = Array.isArray(trip.members) ? trip.members : [];
                const isAdmin = members.some(m => m.userId === user.id && m.role === 'admin');
                return (
                  <div key={trip.id} className="trip-card">
                    {isAdmin && (
                      <button onClick={() => deleteTrip(trip.id, user.id)} className="delete">Удалить</button>
                    )}
                    <h3>{trip.name}</h3>
                    <p>{trip.destination}</p>
                    <div className="info">
                      <span>{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
                      <span>{formatBudget(trip.budget)}</span>
                    </div>
                    <div className="members">
                      Участники: {members.map(m => m.username).join(', ')}
                    </div>
                    {isAdmin && (
                      <div className="invite">
                        <input
                          placeholder="email1@example.com, email2@example.com"
                          value={inviteEmails}
                          onChange={e => setInviteEmails(e.target.value)}
                        />
                        <button onClick={() => handleInvite(trip.id)}>Пригласить</button>
                      </div>
                    )}
                    <button onClick={() => setSelectedTrip(trip)} className="open">Открыть</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;