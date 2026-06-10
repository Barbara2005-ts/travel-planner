import React from 'react';

const TripFilters = ({ filters, onFilterChange, onReset, count }) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h3>Фильтры</h3>
        <button className="reset-filters-btn" onClick={onReset}>
          Сбросить все
        </button>
      </div>
      <div className="filters-grid">
        <input 
          type="text" 
          placeholder="Поиск по направлению" 
          value={filters.search || ''}
          onChange={e => handleChange('search', e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Бюджет от" 
          value={filters.minBudget || ''}
          onChange={e => handleChange('minBudget', e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Бюджет до" 
          value={filters.maxBudget || ''}
          onChange={e => handleChange('maxBudget', e.target.value)} 
        />
      </div>
      <div className="filters-results">
        Найдено: <strong>{count}</strong> поездок
      </div>
    </div>
  );
};

export default TripFilters;