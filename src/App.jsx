import React, { useState, useEffect } from 'react';
import { 
  register, login, createTrip, deleteTrip, 
  subscribeToTrips, addChecklistItem, toggleChecklist, 
  updateBudgetCategory 
} from './services/firebaseApi';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '' });
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [tripForm, setTripForm] = useState({ name: '', destination: '', startDate: '', endDate: '', budget: '' });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [checklistInput, setChecklistInput] = useState('');
  const [message, setMessage] = useState('');

  // Автовход
  useEffect(() => {
    const saved = localStorage.getItem('tripUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Реалтайм
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTrips(user.email, setTrips);
    return () => unsub();
  }, [user]);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    await createTrip(user.email, tripForm);
    setTripForm({ name: '', destination: '', startDate: '', endDate: '', budget: '' });
    setShowForm(false);
    setMessage('Поездка создана!');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tripUser');
    setTrips([]);
  };

  const formatDate = d => new Date(d).toLocaleDateString('ru');
  const formatBudget = b => new Intl.NumberFormat('ru').format(b) + ' ₽';

  // === АВТОРИЗАЦИЯ ===
  if (!user) {
    return (
      <div className="auth">
        <div className="card">
          <h1>Планировщик</h1>
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          {message && <p className={message.includes('Ошибка') ? 'error' : 'success'}>{message}</p>}
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input placeholder="Имя" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            )}
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          <button className="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть?'}
          </button>
        </div>
      </div>
    );
  }

  // === ОСНОВНОЙ ЭКРАН ===
  return (
    <div className="app">
      <header>
        <h1>Мои поездки — {user.username}</h1>
        <button onClick={logout} className="logout">Выйти</button>
      </header>

      {message && <p className="success">{message}</p>}

      <button onClick={() => setShowForm(true)} className="add">+ Новая поездка</button>

      {showForm && (
        <div className="card form">
          <h3>Новая поездка</h3>
          <form onSubmit={handleCreate}>
            <input placeholder="Название" value={tripForm.name} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} required />
            <input placeholder="Куда" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} required />
            <div className="dates">
              <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })} required />
              <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })} required />
            </div>
            <input type="number" placeholder="Общий бюджет ₽" value={tripForm.budget} onChange={e => setTripForm({ ...tripForm, budget: e.target.value })} required />
            <div className="btns">
              <button type="submit">Создать</button>
              <button type="button" onClick={() => setShowForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div className="trips">
        {trips.length === 0 ? (
          <p className="empty">Нет поездок. Создайте первую!</p>
        ) : (
          trips.map(trip => (
            <div key={trip.id} className="card trip">
              <button onClick={() => deleteTrip(user.email, trip.id)} className="delete">X</button>
              <h3 onClick={() => setSelectedTrip(trip)}>{trip.name}</h3>
              <p><strong>Куда:</strong> {trip.destination}</p>
              <p><strong>Даты:</strong> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
              <p><strong>Бюджет:</strong> {formatBudget(trip.budget)}</p>

              {selectedTrip?.id === trip.id && (
                <div className="details">
                  <h4>Распределение бюджета</h4>
                  {Object.entries(trip.budgetCategories || {}).map(([cat, val]) => (
                    <div key={cat} className="budget-row">
                      <span>{cat === 'transport' ? 'Транспорт' : cat === 'accommodation' ? 'Жильё' : cat === 'food' ? 'Еда' : cat === 'activities' ? 'Развлечения' : 'Другое'}:</span>
                      <input 
                        type="number" 
                        value={val} 
                        onChange={e => updateBudgetCategory(user.email, trip.id, cat, e.target.value)}
                        placeholder="0"
                      /> ₽
                    </div>
                  ))}
                  <p><strong>Остаток:</strong> {formatBudget(trip.budget - Object.values(trip.budgetCategories || {}).reduce((a, b) => a + b, 0))}</p>

                  <h4>Чек-лист</h4>
                  <div className="checklist">
                    {Object.entries(trip.checklist || {}).map(([id, item]) => (
                      <label key={id}>
                        <input 
                          type="checkbox" 
                          checked={item.done} 
                          onChange={() => toggleChecklist(user.email, trip.id, id)}
                        />
                        {item.text}
                      </label>
                    ))}
                    <input 
                      placeholder="Добавить..." 
                      value={checklistInput} 
                      onChange={e => setChecklistInput(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && checklistInput.trim()) {
                          addChecklistItem(user.email, trip.id, checklistInput);
                          setChecklistInput('');
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;