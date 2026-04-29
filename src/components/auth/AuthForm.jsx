import React, { useState } from 'react';
import { register, login } from '../../firebase/firebaseApi';

const AuthForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = isRegister ? await register(username, email) : await login(email);
      onLogin(user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>✈️ TripFlow</h1>
        <p>Совместное планирование путешествий</p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input 
              type="text" 
              placeholder="Ваше имя" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <button type="submit">
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        <button className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;