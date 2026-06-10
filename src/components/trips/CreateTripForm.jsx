import React, { useState } from 'react';

const CreateTripForm = ({ onCreate }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [creatorAmount, setCreatorAmount] = useState('');
  const [errors, setErrors] = useState({});

  const validateDates = (start, end) => {
    if (!start || !end) return true;
    return new Date(start) <= new Date(end);
  };

  const validateBudget = (value) => {
    return value > 0;
  };

  const validateCreatorAmount = (amount, totalBudget) => {
    if (!amount) return true; // Необязательное поле
    return amount > 0 && amount <= totalBudget;
  };

  const handleSubmit = async () => {
    const newErrors = {};
    
    // Проверка обязательных полей
    if (!destination.trim()) {
      newErrors.destination = 'Введите направление';
    }
    
    if (!startDate) {
      newErrors.startDate = 'Выберите дату начала';
    }
    
    if (!endDate) {
      newErrors.endDate = 'Выберите дату окончания';
    }
    
    // Проверка дат
    if (startDate && endDate && !validateDates(startDate, endDate)) {
      newErrors.dates = 'Дата окончания не может быть раньше даты начала';
    }
    
    // Проверка бюджета
    if (!budget) {
      newErrors.budget = 'Укажите бюджет';
    } else if (Number(budget) <= 0) {
      newErrors.budget = 'Бюджет должен быть больше 0';
    } else if (isNaN(Number(budget))) {
      newErrors.budget = 'Введите корректное число';
    }
    
    // Проверка вклада
    if (creatorAmount) {
      if (Number(creatorAmount) < 0) {
        newErrors.creatorAmount = 'Вклад не может быть отрицательным';
      } else if (Number(creatorAmount) > Number(budget)) {
        newErrors.creatorAmount = `Вклад не может превышать бюджет (${budget} ₽)`;
      } else if (isNaN(Number(creatorAmount))) {
        newErrors.creatorAmount = 'Введите корректное число';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
    await onCreate({ 
      destination: destination.trim(), 
      dates: `${startDate} → ${endDate}`, 
      budget: Number(budget), 
      creatorAmount: Number(creatorAmount) || 0 
    });
    
    // Сброс формы
    setDestination('');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setCreatorAmount('');
  };

  return (
    <div className="create-trip-card">
      <h3>Создать новую поездку</h3>
      <div className="create-trip-grid">
        <div className="input-group">
          <input 
            placeholder="Куда едем?" 
            value={destination} 
            onChange={e => setDestination(e.target.value)} 
            className={errors.destination ? 'error' : ''}
          />
          {errors.destination && <span className="error-text">{errors.destination}</span>}
        </div>
        
        <div className="input-group">
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && <span className="error-text">{errors.startDate}</span>}
        </div>
        
        <div className="input-group">
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && <span className="error-text">{errors.endDate}</span>}
        </div>
        
        <div className="input-group">
          <input 
            type="number" 
            placeholder="Бюджет (₽)" 
            value={budget} 
            onChange={e => setBudget(e.target.value)}
            min="1"
            step="1"
            className={errors.budget ? 'error' : ''}
          />
          {errors.budget && <span className="error-text">{errors.budget}</span>}
        </div>
        
        <div className="input-group">
          <input 
            type="number" 
            placeholder="Ваш вклад (₽)" 
            value={creatorAmount} 
            onChange={e => setCreatorAmount(e.target.value)}
            min="0"
            step="1"
            className={errors.creatorAmount ? 'error' : ''}
          />
          {errors.creatorAmount && <span className="error-text">{errors.creatorAmount}</span>}
        </div>
      </div>
      
      {errors.dates && <div className="error-text error-global">{errors.dates}</div>}
      
      <button className="create-trip-btn" onClick={handleSubmit}>
        Создать поездку
      </button>
    </div>
  );
};

export default CreateTripForm;