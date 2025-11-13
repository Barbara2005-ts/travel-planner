import React, { useState, useEffect } from 'react';
import { 
  register, login, createTrip, deleteTrip, 
  subscribeToTrips, addChecklistItem, toggleChecklist, 
  updateBudgetCategory, addParticipant, updateParticipant, removeParticipant 
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
  const [activeTab, setActiveTab] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantAmount, setParticipantAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('tripUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

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
    setSelectedTrip(null);
    setActiveTab('');
  };

  const formatDate = d => new Date(d).toLocaleDateString('ru');
  const formatBudget = b => new Intl.NumberFormat('ru').format(b) + ' ₽';

  if (!user) {
    return (
      <div className="auth">
        <div className="card">
          <h1><i className="fas fa-plane"></i> Планировщик</h1>
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

  return (
    <div className="app container">
      <header>
        <h1><i className="fas fa-suitcase-rolling"></i> Мои поездки — {user.username}</h1>
        <button onClick={logout} className="logout"><i className="fas fa-sign-out-alt"></i> Выйти</button>
      </header>

      {message && <p className="success">{message}</p>}

      <button onClick={() => setShowForm(true)} className="add">
        <i className="fas fa-plus"></i> Новая поездка
      </button>

      {showForm && (
        <div className="card form">
          <h3><i className="fas fa-map-marked-alt"></i> Новая поездка</h3>
          <form onSubmit={handleCreate}>
            <input placeholder="Название" value={tripForm.name} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} required />
            <input placeholder="Куда" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} required />
            <div className="dates">
              <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })} required />
              <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })} required />
            </div>
            <input type="number" placeholder="Общий бюджет ₽" value={tripForm.budget} onChange={e => setTripForm({ ...tripForm, budget: e.target.value })} required />
            <div className="btns">
              <button type="submit"><i className="fas fa-check"></i> Создать</button>
              <button type="button" onClick={() => setShowForm(false)}><i className="fas fa-times"></i> Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div className="trips">
        {trips.length === 0 ? (
          <p className="empty"><i className="fas fa-globe"></i> Нет поездок. Создайте первую!</p>
        ) : (
          trips.map(trip => {
            const checklistItems = Object.values(trip.checklist || {});
            const doneCount = checklistItems.filter(i => i.done).length;
            const totalCount = checklistItems.length;
            const checklistProgress = totalCount ? (doneCount / totalCount) * 100 : 0;

            const spent = Object.values(trip.budgetCategories || {}).reduce((a, b) => a + b, 0);
            const budgetProgress = trip.budget ? (spent / trip.budget) * 100 : 0;

            const totalOwed = Object.values(trip.participants || {}).reduce((a, p) => a + p.amount, 0);

            return (
              <div key={trip.id} className="card trip">
                <button onClick={() => deleteTrip(user.email, trip.id)} className="delete">
                  <i className="fas fa-trash"></i>
                </button>
                
                <div 
                  className={`trip-header ${selectedTrip?.id === trip.id ? 'open' : ''}`}
                  onClick={() => {
                    setSelectedTrip(trip);
                    setActiveTab('');
                  }}
                >
                  <h3>{trip.name}</h3>
                  <p><i className="fas fa-map-marker-alt"></i> <strong>Куда:</strong> {trip.destination}</p>
                  <p><i className="fas fa-calendar"></i> <strong>Даты:</strong> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
                  <p><i className="fas fa-ruble-sign"></i> <strong>Бюджет:</strong> {formatBudget(trip.budget)}</p>
                </div>

                {selectedTrip?.id === trip.id && (
                  <div className="trip-tabs">
                    <div className="tabs">
                      <button 
                        className={activeTab === 'plans' ? 'active' : ''}
                        onClick={() => setActiveTab('plans')}
                      >
                        <i className="fas fa-tasks"></i> Планы
                      </button>
                      <button 
                        className={activeTab === 'budget' ? 'active' : ''}
                        onClick={() => setActiveTab('budget')}
                      >
                        <i className="fas fa-wallet"></i> Бюджет
                      </button>
                      <button 
                        className={activeTab === 'participants' ? 'active' : ''}
                        onClick={() => setActiveTab('participants')}
                      >
                        <i className="fas fa-users"></i> Участники
                      </button>
                    </div>

                    <div className="tab-content">
                      {activeTab === 'plans' && (
                        <div>
                          <h4><i className="fas fa-clipboard-list"></i> Планы на путешествие</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${checklistProgress}%` }}></div>
                          </div>
                          <p><small>{doneCount} из {totalCount} выполнено</small></p>

                          <div className="checklist">
                            {checklistItems.map(item => (
                              <label key={item.id} className="check-item">
                                <input 
                                  type="checkbox" 
                                  checked={item.done} 
                                  onChange={() => toggleChecklist(user.email, trip.id, item.id)}
                                />
                                <span className={item.done ? 'done' : ''}>{item.text}</span>
                              </label>
                            ))}
                            <input 
                              placeholder="Добавить план..." 
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

                      {activeTab === 'budget' && (
                        <div>
                          <h4><i className="fas fa-chart-pie"></i> Распределение бюджета</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${budgetProgress}%` }}></div>
                          </div>
                          <p><small>Потрачено: {formatBudget(spent)} из {formatBudget(trip.budget)}</small></p>

                          {Object.entries(trip.budgetCategories || {}).map(([cat, val]) => (
                            <div key={cat} className="budget-row">
                              <span>
                                {cat === 'transport' ? <i className="fas fa-car"></i> : 
                                 cat === 'accommodation' ? <i className="fas fa-home"></i> : 
                                 cat === 'food' ? <i className="fas fa-utensils"></i> : 
                                 cat === 'activities' ? <i className="fas fa-theater-masks"></i> : <i className="fas fa-ellipsis-h"></i>} 
                                {cat === 'transport' ? 'Транспорт' : 
                                 cat === 'accommodation' ? 'Жильё' : 
                                 cat === 'food' ? 'Еда' : 
                                 cat === 'activities' ? 'Развлечения' : 'Другое'}:
                              </span>
                              <input 
                                type="number" 
                                value={val} 
                                onChange={e => updateBudgetCategory(user.email, trip.id, cat, e.target.value)}
                                placeholder="0"
                              /> ₽
                            </div>
                          ))}
                          <p><strong>Остаток:</strong> {formatBudget(trip.budget - spent)}</p>
                        </div>
                      )}

                      {activeTab === 'participants' && (
                        <div>
                          <h4><i className="fas fa-user-friends"></i> Список участников</h4>
                          <div className="participants">
                            {Object.entries(trip.participants || {}).map(([id, p]) => (
                              <div key={id} className="participant">
                                <span><i className="fas fa-user"></i> {p.name}</span>
                                <input 
                                  type="number" 
                                  value={p.amount} 
                                  onChange={e => updateParticipant(user.email, trip.id, id, e.target.value)}
                                  placeholder="0"
                                /> ₽
                                <button 
                                  className="remove"
                                  onClick={() => removeParticipant(user.email, trip.id, id)}
                                ><i className="fas fa-times"></i></button>
                              </div>
                            ))}
                            <div className="add-participant">
                              <input 
                                placeholder="Имя" 
                                value={participantName} 
                                onChange={e => setParticipantName(e.target.value)}
                              />
                              <input 
                                type="number" 
                                placeholder="Сколько должен" 
                                value={participantAmount} 
                                onChange={e => setParticipantAmount(e.target.value)}
                              />
                              <button 
                                onClick={() => {
                                  if (participantName.trim()) {
                                    addParticipant(user.email, trip.id, participantName, participantAmount);
                                    setParticipantName('');
                                    setParticipantAmount('');
                                  }
                                }}
                              ><i className="fas fa-plus"></i></button>
                            </div>
                          </div>
                          <p><strong>Всего нужно:</strong> {formatBudget(totalOwed)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;