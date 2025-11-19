import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, remove, update } from 'firebase/database';

// ТВОИ РЕАЛЬНЫЕ КЛЮЧИ (вставь свои из Firebase Console!)
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

// === РЕГИСТРАЦИЯ ===
export const register = async (username, email) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const userRef = ref(db, `users/${safeEmail}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Email уже занят');
  await set(userRef, { username, email });
  return { username, email };
};

// === ВХОД ===
export const login = async (email) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const userRef = ref(db, `users/${safeEmail}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error('Пользователь не найден');
  return snap.val();
};

// === ПОДПИСКА НА ПОЕЗДКИ ===
export const subscribeToTrips = (email, callback) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const tripsRef = ref(db, `trips/${safeEmail}`);
  return onValue(tripsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const trips = Object.entries(data).map(([id, trip]) => ({ id, ...trip }));
    callback(trips);
  });
};

// === СОЗДАТЬ ПОЕЗДКУ ===
export const createTrip = async (email, tripData) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const newTripRef = push(ref(db, `trips/${safeEmail}`));
  const tripId = newTripRef.key;
  await set(newTripRef, {
    ...tripData,
    budget: Number(tripData.budget) || 0,
    checklist: {},
    budgetCategories: {},
    participants: {},
    createdAt: Date.now()
  });
};

// === УДАЛИТЬ ПОЕЗДКУ ===
export const deleteTrip = async (email, tripId) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  await remove(ref(db, `trips/${safeEmail}/${tripId}`));
};

// === ЧЕКЛИСТ ===
export const addChecklistItem = async (email, tripId, text) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const itemId = Date.now().toString();
  await set(ref(db, `trips/${safeEmail}/${tripId}/checklist/${itemId}`), {
    text,
    done: false
  });
};

export const toggleChecklist = async (email, tripId, itemId) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const itemRef = ref(db, `trips/${safeEmail}/${tripId}/checklist/${itemId}`);
  const snap = await get(itemRef);
  if (snap.exists()) {
    await update(itemRef, { done: !snap.val().done });
  }
};

// === БЮДЖЕТ ===
export const updateBudgetCategory = async (email, tripId, category, amount) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const value = amount === '' ? 0 : Number(amount);
  if (value > 0) {
    await set(ref(db, `trips/${safeEmail}/${tripId}/budgetCategories/${category}`), value);
  } else {
    await remove(ref(db, `trips/${safeEmail}/${tripId}/budgetCategories/${category}`));
  }
};

export const removeBudgetCategory = async (email, tripId, category) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  await remove(ref(db, `trips/${safeEmail}/${tripId}/budgetCategories/${category}`));
};

// ====== УЧАСТНИКИ ===
export const addParticipant = async (email, tripId, name, amount = 0) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  const id = Date.now().toString();
  await set(ref(db, `trips/${safeEmail}/${tripId}/participants/${id}`), {
    name,
    amount: Number(amount)
  });
};

export const updateParticipant = async (email, tripId, participantId, amount) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  await update(ref(db, `trips/${safeEmail}/${tripId}/participants/${participantId}`), {
    amount: Number(amount) || 0
  });
};

export const removeParticipant = async (email, tripId, participantId) => {
  const safeEmail = email.replace(/[.@]/g, '_');
  await remove(ref(db, `trips/${safeEmail}/${tripId}/participants/${participantId}`));
};