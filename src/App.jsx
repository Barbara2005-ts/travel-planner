// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  register, 
  login, 
  addTask, 
  toggleTask, 
  deleteTask,
  subscribeToTasks,
  unsubscribeFromTasks
} from './services/firebaseApi';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [taskText, setTaskText] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // === АВТОВХОД ===
  useEffect(() => {
    const saved = localStorage.getItem('todoUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // === АВТОРИЗАЦИЯ ===
  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.username, formData.email, formData.password);

      const userData = res.user;
      setUser(userData);
      localStorage.setItem('todoUser', JSON.stringify(userData));
      setMessage(isLogin ? 'Вошли!' : 'Зарегистрированы!');
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      setMessage('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === ДОБАВИТЬ ЗАДАЧУ ===
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    try {
      await addTask(user.id, taskText);
      setTaskText('');
      setMessage('Задача добавлена!');
    } catch (err) {
      setMessage('Ошибка');
    }
  };

  // === РЕАЛТАЙМ ЗАДАЧИ ===
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const unsubscribe = subscribeToTasks(user.id, setTasks);
    return () => unsubscribeFromTasks();
  }, [user]);

  // === СООБЩЕНИЯ ===
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // === ВЫХОД ===
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('todoUser');
    setMessage('Вышли');
  };

  // === ЭКРАН АВТОРИЗАЦИИ ===
  if (!user) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: 'rgba(255,255,255,0.1)', padding: 32, borderRadius: 16, backdropFilter: 'blur(10px)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: 24 }}>To-Do List</h1>
          <h2 style={{ textAlign: 'center', marginBottom: 20 }}>{isLogin ? 'Вход' : 'Регистрация'}</h2>

          {message && (
            <div style={{ padding: 12, marginBottom: 16, background: message.includes('Ошибка') ? '#dc3545' : '#28a745', color: '#fff', borderRadius: 8, textAlign: 'center' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Имя"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
                style={{ width: '100%', padding: 14, marginBottom: 16, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ width: '100%', padding: 14, marginBottom: 16, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ width: '100%', padding: 14, marginBottom: 20, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 14, background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}
            >
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ marginTop: 16, background: 'none', border: 'none', color: '#4da6ff', textDecoration: 'underline', cursor: 'pointer', width: '100%' }}
          >
            {isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Вход'}
          </button>
        </div>
      </div>
    );
  }

  // === ОСНОВНОЙ ЭКРАН ===
  return (
    <div className="App" style={{ minHeight: '100vh', background: '#16213e', color: '#fff', padding: 32 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1>Мои задачи</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Привет, <strong>{user.username}</strong>!</span>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6 }}>Выйти</button>
          </div>
        </div>

        {message && (
          <div style={{ padding: 12, marginBottom: 20, background: '#28a745', color: '#fff', borderRadius: 8, textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <input
            type="text"
            placeholder="Новая задача..."
            value={taskText}
            onChange={e => setTaskText(e.target.value)}
            style={{ flex: 1, padding: 14, borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          />
          <button type="submit" style={{ padding: '14px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
            Добавить
          </button>
        </form>

        <div>
          {tasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 18 }}>Пока нет задач. Добавьте первую!</p>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  marginBottom: 12,
                  textDecoration: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.6 : 1
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(user.id, task.id, task.completed)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <span style={{ flex: 1 }}>{task.text}</span>
                <button
                  onClick={() => deleteTask(user.id, task.id)}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}
                >
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;