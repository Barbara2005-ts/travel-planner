import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, remove } from 'firebase/database';

const app = initializeApp({
  apiKey: "AIzaSyCw8Ng4OddMJDxBI7elLPfwQdrGTZagPgI",
  authDomain: "travel-planner-firebase-a7eef.firebaseapp.com",
  databaseURL: "https://travel-planner-firebase-a7eef-default-rtdb.firebaseio.com",
  projectId: "travel-planner-firebase-a7eef",
  storageBucket: "travel-planner-firebase-a7eef.firebasestorage.app",
  messagingSenderId: "572735933580",
  appId: "1:572735933580:web:768086185200796e603fa9"
});
const db = getDatabase(app);

// === РЕГИСТРАЦИЯ ===
export const register = async (username, email) => {
  const userKey = email.replace(/[@.]/g, '_');
  const userRef = ref(db, `users/${userKey}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Email уже занят');
  await set(userRef, { username, email });
  return { username, email };
};

// === ВХОД ===
export const login = async (email) => {
  const userKey = email.replace(/[@.]/g, '_');
  const userRef = ref(db, `users/${userKey}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error('Пользователь не найден');
  return snap.val();
};

// === РЕАЛТАЙМ ПОЕЗДКИ (по email) ===
export const subscribeToTrips = (email, callback) => {
  const userKey = email.replace(/[@.]/g, '_');
  const tripsRef = ref(db, `trips/${userKey}`);
  
  const unsubscribe = onValue(tripsRef, (snap) => {
    const data = snap.val() || {};
    const trips = Object.entries(data).map(([id, trip]) => ({ id, ...trip }));
    callback(trips);
  });

  return unsubscribe;
};

// === СОЗДАТЬ ПОЕЗДКУ ===
export const createTrip = async (email, data) => {
  const userKey = email.replace(/[@.]/g, '_');
  const tripRef = push(ref(db, `trips/${userKey}`));
  const trip = {
    name: data.name,
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    budget: data.budget || 0
  };
  await set(tripRef, trip);
  return { id: tripRef.key, ...trip };
};

// === УДАЛИТЬ ПОЕЗДКУ ===
export const deleteTrip = async (email, tripId) => {
  const userKey = email.replace(/[@.]/g, '_');
  const tripRef = ref(db, `trips/${userKey}/${tripId}`);
  await remove(tripRef);
};