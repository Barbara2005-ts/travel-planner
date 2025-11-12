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
  appId: "1:572735933580:web:768086185200796e603fa9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === ПОЛЬЗОВАТЕЛИ ===
export const register = async (username, email) => {
  const userId = `user_${email.replace(/[@.]/g, '_')}`;
  const userRef = ref(db, `users/${userId}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Email занят');
  await set(userRef, { id: userId, username, email });
  return { id: userId, username, email };
};

export const login = async (email) => {
  const usersRef = ref(db, 'users');
  const snap = await get(usersRef);
  const users = snap.val() || {};
  const user = Object.values(users).find(u => u.email === email);
  if (!user) throw new Error('Пользователь не найден');
  return { id: user.id, username: user.username, email };
};

// === ПОЕЗДКИ ===
export const createTrip = async (userId, username, data) => {
  const tripRef = push(ref(db, 'trips'));
  const trip = {
    id: tripRef.key,
    name: data.name,
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    budget: data.budget || 0,
    createdBy: userId,
    members: [{ userId, username, role: 'admin' }],
    invitations: []
  };
  await set(tripRef, trip);
  return trip;
};

export const deleteTrip = async (tripId, userId) => {
  const tripRef = ref(db, `trips/${tripId}`);
  const snap = await get(tripRef);
  const trip = snap.val();
  if (!trip || !trip.members?.some(m => m.userId === userId && m.role === 'admin')) {
    throw new Error('Нет прав');
  }
  await remove(tripRef);
};

// === ПРИГЛАШЕНИЯ ===
export const sendInvites = async (tripId, emails, inviterId) => {
  const usersRef = ref(db, 'users');
  const snap = await get(usersRef);
  const users = snap.val() || {};
  const validUsers = Object.values(users).filter(u => emails.includes(u.email));

  const tripRef = ref(db, `trips/${tripId}`);
  const tripSnap = await get(tripRef);
  const trip = tripSnap.val();

  const results = [];
  for (const user of validUsers) {
    if (user.id === inviterId) continue;
    if (trip.members?.some(m => m.userId === user.id)) continue;

    const inviteRef = push(ref(db, `trips/${tripId}/invitations`));
    await set(inviteRef, {
      userId: user.id,
      username: user.username,
      email: user.email,
      status: 'pending'
    });
    results.push(user.email);
  }
  return results;
};

export const acceptInvite = async (tripId, userId) => {
  const tripRef = ref(db, `trips/${tripId}`);
  const snap = await get(tripRef);
  const trip = snap.val();
  if (!trip) throw new Error('Поездка не найдена');

  const invite = Object.values(trip.invitations || {}).find(i => i.userId === userId && i.status === 'pending');
  if (!invite) throw new Error('Нет приглашения');

  const inviteKey = Object.keys(trip.invitations).find(k => trip.invitations[k].userId === userId);
  if (inviteKey) await remove(ref(db, `trips/${tripId}/invitations/${inviteKey}`));

  const memberRef = push(ref(db, `trips/${tripId}/members`));
  await set(memberRef, { userId, username: invite.username, role: 'member' });
};

// === РЕАЛТАЙМ ===
let listener = null;
export const subscribeToData = (userId, callback) => {
  if (listener) listener();

  const tripsRef = ref(db, 'trips');
  const unsubscribe = onValue(tripsRef, (snap) => {
    const trips = snap.val() || {};
    const myTrips = [];
    const invites = [];

    Object.entries(trips).forEach(([id, trip]) => {
      if (!trip) return;
      const withId = { id, ...trip };

      // Я — создатель
      if (trip.createdBy === userId) {
        myTrips.push(withId);
        return;
      }

      // Я — участник
      if (Array.isArray(trip.members) && trip.members.some(m => m.userId === userId)) {
        myTrips.push(withId);
        return;
      }

      // У меня есть приглашение
      if (Array.isArray(trip.invitations)) {
        const inv = trip.invitations.find(i => i.userId === userId && i.status === 'pending');
        if (inv) {
          const admin = trip.members?.find(m => m.role === 'admin');
          invites.push({
            tripId: id,
            tripName: trip.name,
            inviter: admin?.username || 'Админ'
          });
        }
      }
    });

    callback({ trips: myTrips, invites });
  });

  listener = unsubscribe;
  return unsubscribe;
};

export const unsubscribe = () => {
  if (listener) listener();
  listener = null;
};