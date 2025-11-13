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
  const key = email.replace(/[@.]/g, '_');
  const userRef = ref(db, `users/${key}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Email уже занят');
  await set(userRef, { username, email });
  return { username, email };
};

// === ВХОД ===
export const login = async (email) => {
  const key = email.replace(/[@.]/g, '_');
  const userRef = ref(db, `users/${key}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error('Пользователь не найден');
  return snap.val();
};

// === РЕАЛТАЙМ ПОЕЗДКИ ===
export const subscribeToTrips = (email, callback) => {
  const key = email.replace(/[@.]/g, '_');
  const tripsRef = ref(db, `trips/${key}`);
  const unsubscribe = onValue(tripsRef, (snap) => {
    const data = snap.val() || {};
    const trips = Object.entries(data).map(([id, trip]) => ({ id, ...trip }));
    callback(trips);
  });
  return unsubscribe;
};

// === СОЗДАТЬ ПОЕЗДКУ ===
export const createTrip = async (email, data) => {
  const key = email.replace(/[@.]/g, '_');
  const tripRef = push(ref(db, `trips/${key}`));
  const trip = {
    name: data.name,
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    budget: data.budget || 0,
    budgetCategories: {
      transport: 0,
      accommodation: 0,
      food: 0,
      activities: 0,
      other: 0
    },
    checklist: {}
  };
  await set(tripRef, trip);
  return { id: tripRef.key, ...trip };
};

// === УДАЛИТЬ ПОЕЗДКУ ===
export const deleteTrip = async (email, tripId) => {
  const key = email.replace(/[@.]/g, '_');
  await remove(ref(db, `trips/${key}/${tripId}`));
};

// === ДОБАВИТЬ В ЧЕК-ЛИСТ ===
export const addChecklistItem = async (email, tripId, text) => {
  const key = email.replace(/[@.]/g, '_');
  const itemRef = push(ref(db, `trips/${key}/${tripId}/checklist`));
  await set(itemRef, { text, done: false });
};

// === ПЕРЕКЛЮЧИТЬ ЧЕК-ЛИСТ ===
export const toggleChecklist = async (email, tripId, itemId) => {
  const key = email.replace(/[@.]/g, '_');
  const itemRef = ref(db, `trips/${key}/${tripId}/checklist/${itemId}`);
  const snap = await get(itemRef);
  const item = snap.val();
  await set(itemRef, { ...item, done: !item.done });
};

// === ОБНОВИТЬ БЮДЖЕТ ПО КАТЕГОРИЯМ ===
export const updateBudgetCategory = async (email, tripId, category, value) => {
  const key = email.replace(/[@.]/g, '_');
  await set(ref(db, `trips/${key}/${tripId}/budgetCategories/${category}`), Number(value));
};

// ... (остальное как было)

// === ДОБАВИТЬ УЧАСТНИКА ===
export const addParticipant = async (email, tripId, name, amount) => {
  const key = email.replace(/[@.]/g, '_');
  const participantRef = push(ref(db, `trips/${key}/${tripId}/participants`));
  await set(participantRef, { name, amount: Number(amount) || 0 });
};

// === ОБНОВИТЬ СУММУ УЧАСТНИКА ===
export const updateParticipant = async (email, tripId, participantId, amount) => {
  const key = email.replace(/[@.]/g, '_');
  await set(ref(db, `trips/${key}/${tripId}/participants/${participantId}/amount`), Number(amount));
};

// === УДАЛИТЬ УЧАСТНИКА ===
export const removeParticipant = async (email, tripId, participantId) => {
  const key = email.replace(/[@.]/g, '_');
  await remove(ref(db, `trips/${key}/${tripId}/participants/${participantId}`));
};