import React, { useState } from 'react';

const CreateTripForm = ({ onCreate }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [creatorAmount, setCreatorAmount] = useState('');

  const handleSubmit = async () => {
    if (!destination || !budget || !startDate || !endDate) {
      alert('Заполните все поля');
      return;
    }
    await onCreate({ 
      destination, 
      dates: `${startDate} → ${endDate}`, 
      budget: Number(budget), 
      creatorAmount: Number(creatorAmount) || 0 
    });
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
        <input 
          placeholder="Куда едем?" 
          value={destination} 
          onChange={e => setDestination(e.target.value)} 
        />
        <input 
          type="date" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)} 
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Бюджет" 
          value={budget} 
          onChange={e => setBudget(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Ваш вклад (₽)" 
          value={creatorAmount} 
          onChange={e => setCreatorAmount(e.target.value)} 
        />
      </div>
      <button className="create-trip-btn" onClick={handleSubmit}>
        Создать поездку
      </button>
    </div>
  );
};

export default CreateTripForm;