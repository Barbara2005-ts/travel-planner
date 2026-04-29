import React, { useState } from 'react';

export const InviteSendModal = ({ onSend, onClose }) => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    if (email) {
      onSend(email);
      setEmail('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>📧 Пригласить участника</h3>
        <input 
          type="email" 
          placeholder="Email пользователя" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <div className="modal-actions">
          <button onClick={handleSend}>Отправить</button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export const InviteListModal = ({ invites, onAccept, onReject, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invites-modal" onClick={e => e.stopPropagation()}>
        <h3>📨 Приглашения</h3>
        {invites.length === 0 ? (
          <p>Нет новых приглашений</p>
        ) : (
          <div className="invites-list">
            {invites.map(invite => (
              <div key={invite.id} className="invite-card">
                <div>
                  <strong>✈️ {invite.tripName}</strong>
                  <br />
                  <span>от {invite.from}</span>
                </div>
                <div className="invite-actions">
                  <button className="accept-btn" onClick={() => onAccept(invite)}>
                    ✅ Принять
                  </button>
                  <button className="reject-btn" onClick={() => onReject(invite.id)}>
                    ❌ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="close-modal" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};

export const ContributionModal = ({ tripName, onConfirm, onClose }) => {
  const [amount, setAmount] = useState('');

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Введите корректную сумму');
      return;
    }
    onConfirm(numAmount);
    setAmount('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>💰 Введите сумму взноса</h3>
        <p>Присоединяйтесь к поездке <strong>"{tripName}"</strong></p>
        <div className="contribution-input">
          <input 
            type="number" 
            placeholder="Сумма в рублях" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            autoFocus 
          />
        </div>
        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleConfirm}>
            Подтвердить и присоединиться
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};