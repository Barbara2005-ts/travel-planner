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
  const userId = `user_${email}`;
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
    invitations: [],
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

// === ПРИГЛАШЕНИЯ ===
// Пример: отправка приглашения
export const sendInvitation = async (tripId, email) => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const users = snapshot.val();
  const targetUser = Object.values(users).find(u => u.email === email);
  
  if (!targetUser) throw new Error('Пользователь не найден');

  const inviteRef = ref(db, `trips/${tripId}/invitations`);
  await push(inviteRef, {
    userId: targetUser.id,
    email: targetUser.email,
    status: 'pending'
  });
};

export const acceptInvitation = (tripId, userId) => {
  const db = getDB();
  const trip = db.trips.find(t => t.id === tripId);
  if (!trip || !trip.invitations) throw new Error('Приглашение не найдено');

  const invitation = trip.invitations.find(i => i.userId === userId && i.status === 'pending');
  if (!invitation) throw new Error('Нет активного приглашения');

  trip.invitations = trip.invitations.filter(i => i !== invitation);
  trip.members.push({
    userId: invitation.userId,
    username: invitation.username,
    role: 'member'
  });

  saveDB(db);
  return { message: 'Вы присоединились к поездке!' };
};

export const getPendingInvitations = (userId) => {
  const db = getDB();
  const invitations = [];
  db.trips.forEach(trip => {
    if (trip.invitations) {
      trip.invitations.forEach(inv => {
        if (inv.userId === userId && inv.status === 'pending') {
          invitations.push({
            tripId: trip.id,
            tripName: trip.name,
            inviter: trip.members.find(m => m.role === 'admin')?.username || 'Админ'
          });
        }
      });
    }
  });
  return invitations;
};