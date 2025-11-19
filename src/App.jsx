import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { 
  register, login, createTrip, deleteTrip, subscribeToTrips,
  addChecklistItem, toggleChecklist,
  updateBudgetCategory, removeBudgetCategory,
  addParticipant, updateParticipant, removeParticipant
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
    return () => unsub && unsub();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = isLogin ? await login(form.email) : await register(form.username, form.email);
      setUser(res);
      localStorage.setItem('tripUser', JSON.stringify(res));
      setForm({ username: '', email: '' });
      setMessage(isLogin ? 'Добро пожаловать!' : 'Аккаунт создан!');
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

  const formatDate = d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const formatBudget = b => new Intl.NumberFormat('ru-RU').format(b) + ' ₽';

  const addBudgetCategory = () => {
    if (!budgetCategoryName.trim() || !budgetCategoryAmount) return;
    const key = budgetCategoryName.toLowerCase().replace(/\s+/g, '_');
    updateBudgetCategory(user.email, selectedTrip.id, key, budgetCategoryAmount);
    setBudgetCategoryName('');
    setBudgetCategoryAmount('');
  };

  if (!user) {
    return (
      <div className="auth">
        <div className="card">
          <h1>Планировщик Путешествий</h1>
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          {message && <p className={message.includes('Ошибка') ? 'error' : 'success'}>{message}</p>}
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input placeholder="Ваше имя" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            )}
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          <button className="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войти'}
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
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            <h3>Новая поездка</h3>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Название</label>
                <input value={tripForm.name} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Куда</label>
                <input value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} />
              </div>
              <div className="input-group dates">
                <div>
                  <label>С</label>
                  <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })} required />
                </div>
                <div>
                  <label>По</label>
                  <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="input-group">
                <label>Бюджет</label>
                <input type="number" placeholder="0" value={tripForm.budget} onChange={e => setTripForm({ ...tripForm, budget: e.target.value })} required />
              </div>
              <div className="btns">
                <button type="submit" className="primary">Создать</button>
                <button type="button" onClick={() => setShowForm(false)} className="secondary">Отмена</button>
              </div>
            </form>
          </div>
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
            const checklistProgress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

            const participants = Object.entries(trip.participants || {}).map(([id, p]) => ({ id, ...p }));
            const totalOwed = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const moneyProgress = trip.budget ? Math.round((totalOwed / trip.budget) * 100) : 0;
            const spent = Object.values(trip.budgetCategories || {}).reduce((a, b) => a + b, 0);

            return (
              <div key={trip.id} className="card trip">
                <button onClick={() => deleteTrip(user.email, trip.id)} className="delete">×</button>

                <div 
                  className={`trip-header ${selectedTrip?.id === trip.id ? 'open' : ''}`}
                  onClick={() => {
                    setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
                    setActiveTab('');
                  }}
                >
                  <h3>{trip.name}</h3>
                  <p><strong>Куда:</strong> {trip.destination}</p>
                  <p><strong>Даты:</strong> {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>

                  {/* ПРОГРЕСС-БАР "СОБРАНО ДЕНЕГ" */}
                  <div className="money-progress">
                    <div className="progress-label">
                      <span>Собрано</span>
                      <strong>{formatBudget(totalOwed)} / {formatBudget(trip.budget)}</strong>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${moneyProgress}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* КОНФЕТТИ ПРИ 100% ПЛАНОВ */}
                {selectedTrip?.id === trip.id && checklistProgress === 100 && totalCount > 0 && (
                  <Confetti
                    width={window.innerWidth}
                    height={500}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.1}
                  />
                )}

                {selectedTrip?.id === trip.id && (
                  <div className="trip-tabs">
                    <div className="tabs">
                      <button className={activeTab === 'plans' ? 'active' : ''} onClick={() => setActiveTab('plans')}>Планы</button>
                      <button className={activeTab === 'budget' ? 'active' : ''} onClick={() => setActiveTab('budget')}>Бюджет</button>
                      <button className={activeTab === 'participants' ? 'active' : ''} onClick={() => setActiveTab('participants')}>Участники</button>
                    </div>

                    <div className="tab-content">
                      {/* ПЛАНЫ */}
                      {activeTab === 'plans' && (
                        <div>
                          <h4>Планы</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${checklistProgress}%` }}></div>
                          </div>
                          <p><small>{doneCount} из {totalCount} выполнено</small></p>

                          <div className="checklist">
                            {checklistItems.map(item => (
                              <div key={item.id} className="check-item">
                                <label className="checkbox-label">
                                  <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(user.email, trip.id, item.id)} />
                                  <span className="checkmark"></span>
                                </label>
                                <span className={item.done ? 'done' : ''}>{item.text}</span>
                              </div>
                            ))}
                            <div className="check-input">
                              <input
                                placeholder="Новый план..."
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

                      {/* БЮДЖЕТ */}
                      {activeTab === 'budget' && (
                        <div>
                          <h4>Бюджет</h4>
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${(spent / trip.budget) * 100}%` }}></div>
                          </div>
                          <p><small>Потрачено: {formatBudget(spent)} из {formatBudget(trip.budget)}</small></p>

                          <div className="budget-list">
                            {Object.entries(trip.budgetCategories || {})
                              .filter(([_, val]) => val > 0)
                              .map(([cat, val]) => (
                                <div key={cat} className="budget-item">
                                  <span>{cat.replace(/_/g, ' ')}</span>
                                  <input type="number" value={val} onChange={e => updateBudgetCategory(user.email, trip.id, cat, e.target.value)} /> ₽
                                  <button className="remove" onClick={() => removeBudgetCategory(user.email, trip.id, cat)}>×</button>
                                </div>
                              ))}
                            <div className="add-budget">
                              <input placeholder="Категория" value={budgetCategoryName} onChange={e => setBudgetCategoryName(e.target.value)} />
                              <input type="number" placeholder="Сумма" value={budgetCategoryAmount} onChange={e => setBudgetCategoryAmount(e.target.value)} />
                              <button onClick={addBudgetCategory}>Добавить</button>
                            </div>
                          </div>
                          <p><strong>Остаток:</strong> {formatBudget(trip.budget - spent)}</p>
                        </div>
                      )}

                      {/* УЧАСТНИКИ */}
                      {activeTab === 'participants' && (
                        <div>
                          <h4>Участники</h4>
                          <p><strong>Осталось собрать:</strong> {formatBudget(trip.budget - totalOwed)}</p>

                          <div className="participants">
                            {participants.map(p => (
                              <div key={p.id} className="participant">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0ea5e9&color=fff&bold=true&size=128`}
                                  alt={p.name}
                                  className="avatar"
                                />
                                <div className="participant-info">
                                  <strong>{p.name}</strong>
                                  <input
                                    type="number"
                                    value={p.amount || ''}
                                    placeholder="0"
                                    onChange={e => updateParticipant(user.email, trip.id, p.id, e.target.value)}
                                  /> ₽
                                </div>
                                <button className="remove" onClick={() => removeParticipant(user.email, trip.id, p.id)}>×</button>
                              </div>
                            ))}

                            <div className="add-participant">
                              <input placeholder="Имя" value={participantName} onChange={e => setParticipantName(e.target.value)} />
                              <input type="number" placeholder="Сумма" value={participantAmount} onChange={e => setParticipantAmount(e.target.value)} />
                              <button onClick={() => {
                                if (participantName.trim()) {
                                  addParticipant(user.email, trip.id, participantName, participantAmount || 0);
                                  setParticipantName('');
                                  setParticipantAmount('');
                                }
                              }}>Добавить</button>
                            </div>
                          </div>

                          <p><small>Собрано: {formatBudget(totalOwed)} из {formatBudget(trip.budget)}</small></p>
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