import React, { useState, useEffect } from 'react';
import Avatar from '../common/Avatar';
import { 
  addChecklistItem, toggleChecklist, 
  updateBudgetCategory, removeBudgetCategory 
} from '../../firebase/firebaseApi';

const TripDetail = ({ trip, user, onBack, onInvite }) => {
  const [activeTab, setActiveTab] = useState('checklist');
  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  
  // Локальное состояние для мгновенного UI
  const [displayChecklist, setDisplayChecklist] = useState({});
  const [displayBudget, setDisplayBudget] = useState({});
  
  // Синхронизация с Firebase (когда приходят обновления от других)
  useEffect(() => {
    setDisplayChecklist(trip.checklist || {});
  }, [trip.checklist]);
  
  useEffect(() => {
    setDisplayBudget(trip.budgetCategories || {});
  }, [trip.budgetCategories]);
  
  const totalCollected = Object.values(trip.participants || {}).reduce((a, p) => a + (p.amount || 0), 0);
  const totalSpent = Object.values(displayBudget).reduce((a, b) => a + Number(b), 0);
  const checklistDone = Object.values(displayChecklist).filter(i => i.done).length;
  const checklistTotal = Object.keys(displayChecklist).length;

  // МГНОВЕННОЕ добавление чеклиста + сохранение в Firebase
  const addItem = async () => {
    if (!newItemText.trim()) return;
    const itemText = newItemText.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Мгновенно добавляем в UI
    setDisplayChecklist(prev => ({
      ...prev,
      [tempId]: { text: itemText, done: false, temp: true }
    }));
    setNewItemText('');
    
    try {
      // Сохраняем в Firebase
      await addChecklistItem(trip.id, itemText);
    } catch (error) {
      // Если ошибка - удаляем временный элемент
      setDisplayChecklist(prev => {
        const newState = { ...prev };
        delete newState[tempId];
        return newState;
      });
      alert('Ошибка при добавлении');
    }
  };

  // МГНОВЕННОЕ переключение статуса
  const toggleItem = async (id) => {
    // Мгновенно меняем статус в UI
    setDisplayChecklist(prev => ({
      ...prev,
      [id]: { ...prev[id], done: !prev[id].done }
    }));
    
    try {
      await toggleChecklist(trip.id, id);
    } catch (error) {
      // Откат при ошибке
      setDisplayChecklist(prev => ({
        ...prev,
        [id]: { ...prev[id], done: !prev[id].done }
      }));
      alert('Ошибка при изменении статуса');
    }
  };

  // МГНОВЕННОЕ добавление бюджета
  const addBudget = async () => {
    if (!newCategory.trim()) return;
    const amount = Number(newAmount) || 0;
    const categoryName = newCategory.trim();
    
    // Мгновенно добавляем в UI
    setDisplayBudget(prev => ({
      ...prev,
      [categoryName]: amount
    }));
    setNewCategory('');
    setNewAmount('');
    
    try {
      await updateBudgetCategory(trip.id, categoryName, amount);
    } catch (error) {
      // Откат при ошибке
      setDisplayBudget(prev => {
        const newState = { ...prev };
        delete newState[categoryName];
        return newState;
      });
      alert('Ошибка при добавлении');
    }
  };

  const removeBudget = async (category) => {
    // Мгновенно удаляем из UI
    setDisplayBudget(prev => {
      const newState = { ...prev };
      delete newState[category];
      return newState;
    });
    
    try {
      await removeBudgetCategory(trip.id, category);
    } catch (error) {
      // Восстанавливаем при ошибке
      setDisplayBudget(prev => ({
        ...prev,
        [category]: trip.budgetCategories?.[category] || 0
      }));
      alert('Ошибка при удалении');
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = { 
      'еда': '🍕', 'транспорт': '🚗', 'жилье': '🏨', 
      'развлечения': '🎭', 'шопинг': '🛍️', 'сувениры': '🎁', 
      'экскурсии': '🗺️', 'прочее': '📦' 
    };
    return icons[cat.toLowerCase()] || '💰';
  };

  return (
    <div className="trip-detail-view">
      <div className="trip-detail-header">
        <button className="back-btn" onClick={onBack}>← Назад</button>
        {trip.createdBy === user.email && (
          <button className="invite-btn" onClick={onInvite}>👥 Пригласить</button>
        )}
      </div>
      
      <div className="trip-header-detail">
        <h1>{trip.destination}</h1>
        <p>{trip.dates}</p>
        <div className="budget-summary">
          <div className="budget-item">Бюджет: <strong>{trip.budget?.toLocaleString()} ₽</strong></div>
          <div className="budget-item">Собрано: <strong className="text-success">{totalCollected.toLocaleString()} ₽</strong></div>
          <div className="budget-item">Потрачено: <strong className="text-danger">{totalSpent.toLocaleString()} ₽</strong></div>
          <div className="budget-item">Задач: <strong>{checklistDone}/{checklistTotal}</strong></div>
          <div className="budget-item">Участников: <strong>{Object.keys(trip.participants || {}).length}</strong></div>
        </div>
      </div>
      
      <div className="trip-tabs">
        <button className={activeTab === 'checklist' ? 'active' : ''} onClick={() => setActiveTab('checklist')}>
          Чеклист
        </button>
        <button className={activeTab === 'participants' ? 'active' : ''} onClick={() => setActiveTab('participants')}>
          Участники
        </button>
        <button className={activeTab === 'budget' ? 'active' : ''} onClick={() => setActiveTab('budget')}>
          Бюджет
        </button>
      </div>
      
      {activeTab === 'checklist' && (
        <div className="tab-content-card">
          <div className="add-item-card">
            <input 
              type="text"
              placeholder="Что нужно сделать? (например: купить билеты)" 
              value={newItemText} 
              onChange={e => setNewItemText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="btn-primary" onClick={addItem}>➕ Добавить</button>
          </div>
          <div className="checklist-items">
            {checklistTotal === 0 ? (
              <div className="empty-checklist">Чеклист пуст. Добавьте первый пункт!</div>
            ) : (
              Object.entries(displayChecklist)
                .sort((a, b) => {
                  if (a[1].done === b[1].done) return 0;
                  return a[1].done ? 1 : -1;
                })
                .map(([id, item]) => (
                  <div 
                    key={id} 
                    className={`checklist-item ${item.done ? 'completed' : ''} ${item.temp ? 'temp-item' : ''}`} 
                    onClick={() => toggleItem(id)}
                  >
                    <div className="checklist-item-content">
                      <span className="checkbox-icon">{item.done ? '✅' : '⬜'}</span>
                      <span className="checklist-text">{item.text}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'participants' && (
        <div className="tab-content-card">
          <div className="participants-header">
            <h3>Участники поездки</h3>
          </div>
          <div className="participants-list">
            {Object.entries(trip.participants || {}).length === 0 ? (
              <div className="empty-participants">Пока нет участников. Пригласите друзей!</div>
            ) : (
              Object.entries(trip.participants || {}).map(([id, p]) => (
                <div key={id} className="participant-card">
                  <div className="participant-info">
                    <Avatar name={p.name} size={45} />
                    <div className="participant-details">
                      <div className="participant-name">{p.name}</div>
                      <div className="participant-amount">{(p.amount || 0).toLocaleString()} ₽</div>
                    </div>
                  </div>
                  <div className="participant-badges">
                    {p.email === user.email && <span className="badge-you">Вы</span>}
                    {p.email === trip.createdBy && <span className="badge-creator">Создатель</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'budget' && (
        <div className="tab-content-card">
          <div className="add-budget-card">
            <input 
              type="text"
              placeholder="Категория (еда, транспорт, жилье...)" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="Сумма (₽)" 
              value={newAmount} 
              onChange={e => setNewAmount(e.target.value)} 
            />
            <button className="btn-primary" onClick={addBudget}>➕ Добавить расход</button>
          </div>
          <div className="budget-categories">
            {Object.keys(displayBudget).length === 0 ? (
              <div className="empty-budget">Бюджет пуст. Добавьте категории расходов!</div>
            ) : (
              Object.entries(displayBudget).map(([cat, amount]) => (
                <div key={cat} className="budget-category-card">
                  <div className="category-info">
                    <span className="category-icon">{getCategoryIcon(cat)}</span>
                    <span className="category-name">{cat}</span>
                    <span className="category-amount">{Number(amount).toLocaleString()} ₽</span>
                  </div>
                  <button className="delete-btn" onClick={() => removeBudget(cat)}>🗑️</button>
                </div>
              ))
            )}
          </div>
          <div className="budget-total">
            <div className="total-row">
              <span>Общий бюджет:</span>
              <strong>{trip.budget?.toLocaleString()} ₽</strong>
            </div>
            <div className="total-row">
              <span>Всего потрачено:</span>
              <strong className="text-danger">{totalSpent.toLocaleString()} ₽</strong>
            </div>
            <div className="total-row">
              <span>Остаток:</span>
              <strong className={(trip.budget - totalSpent) < 0 ? 'text-danger' : 'text-success'}>
                {(trip.budget - totalSpent).toLocaleString()} ₽
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;