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
  const [budgetCategoryName, setBudgetCategoryName] = useState('');
  const [budgetCategoryAmount, setBudgetCategoryAmount] = useState('');
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

  // === ДОБАВИТЬ КАТЕГОРИЮ БЮДЖЕТА ===
  const addBudgetCategory = () => {
    if (!budgetCategoryName.trim() || !budgetCategoryAmount) return;
    const key = budgetCategoryName.toLowerCase().replace(/\s+/g, '');
    updateBudgetCategory(user.email, selectedTrip.id, key, budgetCategoryAmount);
    setBudgetCategoryName('');
    setBudgetCategoryAmount('');
  };

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

  return (
    <div className="app container">
      <header>
        <h1>Мои поездки — {user.username}</h1>
        <button onClick={logout} className="logout">Выйти</button>
      </header>

      {message && <p className="success">{message}</p>}

      <button onClick={() => setShowForm(true)} className="add">
        + Новая поездка
      </button>

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
          trips.map(trip => {
            const checklistItems = Object.entries(trip.checklist || {}).map(([id, item]) => ({ id, ...item }));
            const doneCount = checklistItems.filter(i => i.done).length;
            const totalCount = checklistItems.length;
            const checklistProgress = totalCount ? (doneCount / totalCount) * 100 : 0;

            const spent = Object.values(trip.budgetCategories || {}).reduce((a, b) => a + b, 0);
            const budgetProgress = trip.budget ? (spent / trip.budget) * 100 : 0;

            const participants = Object.values(trip.participants || {});
            const totalOwed = participants.reduce((a, p) => a + p.amount, 0);
            const perPerson = participants.length > 0 ? Math.round(trip.budget / participants.length) : 0;

            return (
              <div key={trip.id} className="card trip">
                <button onClick={() => deleteTrip(user.email, trip.id)} className="delete">
                  X
                </button>
                
                <div 
                  className={`trip-header ${selectedTrip?.id === trip.id ? 'open' : ''}`}
                  onClick={() => {
                    setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
                    setActiveTab('');
                  }}
                >
                  <h3>{trip.name}</h3>
                  <p><strong>Куда:</strong> {trip.destination}</p>
                  <p><strong>Даты:</strong> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
                  <p><strong>Бюджет:</strong> {formatBudget(trip.budget)}</p>
                </div>

                {selectedTrip?.id === trip.id && (
                  <div className="trip-tabs">
                    <div className="tabs">
                      <button className={activeTab === 'plans' ? 'active' : ''} onClick={() => setActiveTab('plans')}>
                        Планы
                      </button>
                      <button className={activeTab === 'budget' ? 'active' : ''} onClick={() => setActiveTab('budget')}>
                        Бюджет
                      </button>
                      <button className={activeTab === 'participants' ? 'active' : ''} onClick={() => setActiveTab('participants')}>
                        Участники
                      </button>
                    </div>

                    <div className="tab-content">
                      {/* === ПЛАНЫ === */}
                      {activeTab === 'plans' && (
                        <div>
                          <h4>Планы на путешествие</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${checklistProgress}%` }}></div>
                          </div>
                          <p><small>{doneCount} из {totalCount} выполнено</small></p>

                          <div className="checklist">
                            {checklistItems.map(item => (
                              <div key={item.id} className="check-item">
                                <label className="checkbox-label">
                                  <input 
                                    type="checkbox" 
                                    checked={item.done} 
                                    onChange={() => toggleChecklist(user.email, trip.id, item.id)}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                                <span className={item.done ? 'done' : ''}>{item.text}</span>
                              </div>
                            ))}
                            <div className="check-input">
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
                        </div>
                      )}

                      {/* === БЮДЖЕТ === */}
                      {activeTab === 'budget' && (
                        <div>
                          <h4>Распределение бюджета</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${budgetProgress}%` }}></div>
                          </div>
                          <p><small>Потрачено: {formatBudget(spent)} из {formatBudget(trip.budget)}</small></p>

                          <div className="budget-list">
                            {Object.entries(trip.budgetCategories || {}).map(([cat, val]) => (
                              <div key={cat} className="budget-item">
                                <span>{cat}</span>
                                <input 
                                  type="number" 
                                  value={val} 
                                  onChange={e => updateBudgetCategory(user.email, trip.id, cat, e.target.value)}
                                /> ₽
                                <button 
                                  className="remove"
                                  onClick={() => updateBudgetCategory(user.email, trip.id, cat, 0)}
                                >X</button>
                              </div>
                            ))}
                            <div className="add-budget">
                              <input 
                                placeholder="Категория" 
                                value={budgetCategoryName}
                                onChange={e => setBudgetCategoryName(e.target.value)}
                              />
                              <input 
                                type="number" 
                                placeholder="Сумма" 
                                value={budgetCategoryAmount}
                                onChange={e => setBudgetCategoryAmount(e.target.value)}
                              />
                              <button onClick={addBudgetCategory}>Добавить</button>
                            </div>
                          </div>
                          <p><strong>Остаток:</strong> {formatBudget(trip.budget - spent)}</p>
                        </div>
                      )}

                      {/* === УЧАСТНИКИ === */}
                      {activeTab === 'participants' && (
                        <div>
                          <h4>Список участников</h4>
                          <p><small>Каждый должен: {formatBudget(perPerson)}</small></p>
                          <div className="participants">
                            {participants.map(p => (
                              <div key={p.id} className="participant">
                                <span>{p.name}</span>
                                <input 
                                  type="number" 
                                  value={p.amount} 
                                  onChange={e => updateParticipant(user.email, trip.id, p.id, e.target.value)}
                                  placeholder="0"
                                /> ₽
                                <button 
                                  className="remove"
                                  onClick={() => removeParticipant(user.email, trip.id, p.id)}
                                >X</button>
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
                                placeholder={`Должен: ${perPerson}`}
                                value={participantAmount || perPerson}
                                onChange={e => setParticipantAmount(e.target.value)}
                              />
                              <button 
                                onClick={() => {
                                  if (participantName.trim()) {
                                    addParticipant(user.email, trip.id, participantName, participantAmount || perPerson);
                                    setParticipantName('');
                                    setParticipantAmount('');
                                  }
                                }}
                              >Добавить</button>
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