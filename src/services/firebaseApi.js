// src/services/firebaseApi.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCw8Ng4OddMJDxBI7elLPfwQdrGTZagPgI",
  authDomain: "travel-planner-firebase-a7eef.firebaseapp.com",
  databaseURL: "https://travel-planner-firebase-a7eef-default-rtdb.firebaseio.com",
  projectId: "travel-planner-firebase-a7eef",
  storageBucket: "travel-planner-firebase-a7eef.firebasestorage.app",
  messagingSenderId: "572735933580",
  appId: "1:572735933580:web:768086185200796e603fa9",
  measurementId: "G-BFHGSYX60D"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === ПОЛЬЗОВАТЕЛИ ===
export const register = async (username, email, password) => {
  const userId = `user_${email.replace(/[@.]/g, '_')}`;
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) throw new Error('Email уже используется');

  await set(userRef, { id: userId, username, email, password });
  return { user: { id: userId, username, email } };
};

export const login = async (email, password) => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const users = snapshot.val() || {};
  const user = Object.values(users).find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Неверный email или пароль');
  return { user: { id: user.id, username: user.username, email } };
};

// === РЕАЛТАЙМ ПРИГЛАШЕНИЯ ===
let invitesListener = null;

export const subscribeToInvitations = (userId, callback) => {
  if (invitesListener) invitesListener();

  const tripsRef = ref(db, 'trips');
  const unsubscribe = onValue(tripsRef, (snapshot) => {
    const trips = snapshot.val() || {};
    const invitations = [];

    Object.entries(trips).forEach(([tripId, trip]) => {
      if (trip.invitations) {
        Object.values(trip.invitations).forEach(inv => {
          if (inv.userId === userId && inv.status === 'pending') {
            invitations.push({
              tripId,
              tripName: trip.name,
              inviter: Object.values(trip.members).find(m => m.role === 'admin')?.username || 'Админ'
            });
          }
        });
      }
    });

    callback(invitations);
  });

  invitesListener = unsubscribe;
  return unsubscribe;
};

export const unsubscribeFromInvitations = () => {
  if (invitesListener) {
    invitesListener();
    invitesListener = null;
  }
};

// === РЕАЛТАЙМ ПОЕЗДКИ ===
let tripsListener = null;

export const subscribeToTrips = (userId, callback) => {
  if (tripsListener) tripsListener();

  const tripsRef = ref(db, 'trips');
  const unsubscribe = onValue(tripsRef, (snapshot) => {
    const trips = snapshot.val() || {};
    const userTrips = Object.values(trips).filter(t =>
      t.createdBy === userId || (t.members && Object.values(t.members).some(m => m.userId === userId))
    );
    callback(userTrips);
  });

  tripsListener = unsubscribe;
  return unsubscribe;
};

export const unsubscribeFromTrips = () => {
  if (tripsListener) {
    tripsListener();
    tripsListener = null;
  }
};

// === СОЗДАНИЕ ПОЕЗДКИ ===
export const createTrip = async (tripData) => {
  const tripRef = push(ref(db, 'trips'));
  const newTrip = {
    id: tripRef.key,
    ...tripData,
    members: [{ userId: tripData.createdBy, username: tripData.username, role: 'admin' }],
    invitations: []
  };
  await set(tripRef, newTrip);
  return { message: 'Путешествие создано!', trip: newTrip };
};

// === УДАЛЕНИЕ ===
export const deleteTrip = async (tripId, userId) => {
  const tripRef = ref(db, `trips/${tripId}`);
  const snapshot = await get(tripRef);
  const trip = snapshot.val();
  if (!trip || !Object.values(trip.members).some(m => m.userId === userId && m.role === 'admin')) {
    throw new Error('Нет прав');
  }
  await remove(tripRef);
  return { message: 'Путешествие удалено' };
};

// === ПРИГЛАШЕНИЕ ===
export const sendInvitation = async (tripId, email, inviterId) => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const users = snapshot.val() || {};
  const targetUser = Object.values(users).find(u => u.email === email);
  if (!targetUser) throw new Error('Пользователь не найден');
  if (targetUser.id === inviterId) throw new Error('Нельзя пригласить себя');

  const tripRef = ref(db, `trips/${tripId}`);
  const tripSnap = await get(tripRef);
  const trip = tripSnap.val();
  if (trip.members && Object.values(trip.members).some(m => m.userId === targetUser.id)) {
    throw new Error('Уже в поездке');
  }

  const inviteRef = push(ref(db, `trips/${tripId}/invitations`));
  await set(inviteRef, {
    userId: targetUser.id,
    username: targetUser.username,
    email: targetUser.email,
    status: 'pending'
  });

  return { message: `Приглашение отправлено ${email}` };
};

// === ПРИНЯТИЕ ПРИГЛАШЕНИЯ ===
export const acceptInvitation = async (tripId, userId) => {
  const tripRef = ref(db, `trips/${tripId}`);
  const snapshot = await get(tripRef);
  const trip = snapshot.val();
  if (!trip || !trip.invitations) throw new Error('Приглашение не найдено');

  const invitation = Object.values(trip.invitations).find(i => i.userId === userId && i.status === 'pending');
  if (!invitation) throw new Error('Нет активного приглашения');

  const inviteKey = Object.keys(trip.invitations).find(key => trip.invitations[key].userId === userId);
  await remove(ref(db, `trips/${tripId}/invitations/${inviteKey}`));

  const memberRef = push(ref(db, `trips/${tripId}/members`));
  await set(memberRef, {
    userId: invitation.userId,
    username: invitation.username,
    role: 'member'
  });

  return { message: 'Вы присоединились к поездке!' };
};