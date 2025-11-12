// src/services/mockApi.js
const DB_KEY = 'travel_app_db';

const initDB = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify({ users: [], trips: [] }));
  }
};

const getDB = () => {
  initDB();
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : { users: [], trips: [] };
};

const saveDB = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// === АВТОРИЗАЦИЯ ===
export const register = (username, email, password) => {
  const db = getDB();
  if (db.users.find(u => u.email === email)) {
    throw new Error('Email уже используется');
  }
  const userId = `user_${email}`; // ПОСТОЯННЫЙ ID ПО EMAIL
  const user = { id: userId, username, email, password };
  db.users.push(user);
  saveDB(db);
  return { user: { id: userId, username, email } };
};

export const login = (email, password) => {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Неверный email или пароль');
  return { user: { id: user.id, username: user.username, email } };
};

// === ПОЕЗДКИ ===
export const getTrips = (userId) => {
  const db = getDB();
  return db.trips
    .filter(t => t.createdBy === userId || (t.members && t.members.some(m => m.userId === userId)))
    .map(trip => ({
      ...trip,
      members: trip.members || [{ userId: trip.createdBy, username: trip.username, role: 'admin' }]
    }));
};

export const createTrip = (tripData) => {
  const db = getDB();
  const newTrip = {
    id: Date.now().toString(),
    ...tripData,
    members: [{ userId: tripData.createdBy, username: tripData.username, role: 'admin' }],
    status: 'planning'
  };
  db.trips.push(newTrip);
  saveDB(db);
  return { message: 'Путешествие создано!', trip: newTrip };
};

export const deleteTrip = (tripId, userId) => {
  const db = getDB();
  const trip = db.trips.find(t => t.id === tripId);
  if (!trip || !trip.members.some(m => m.userId === userId && m.role === 'admin')) {
    throw new Error('Нет прав');
  }
  db.trips = db.trips.filter(t => t.id !== tripId);
  saveDB(db);
  return { message: 'Путешествие удалено' };
};