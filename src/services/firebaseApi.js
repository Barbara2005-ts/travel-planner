import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  deleteField,
  getDoc,           // ← ДОБАВИЛ
  collection,       // ← ДОБАВИЛ
  serverTimestamp   // ← ДЛЯ БЕЗОПАСНЫХ ID
} from 'firebase/firestore';

// ← ВСТАВЬ СВОИ ДАННЫЕ ИЗ FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === РЕГИСТРАЦИЯ ===
export const register = async (username, email) => {
  const userRef = doc(db, 'users', email);
  await setDoc(userRef, { username, email }, { merge: true });
  return { username, email };
};

// === ВХОД ===
export const login = async (email) => {
  const userRef = doc(db, 'users', email);
  const snapshot = await getDoc(userRef);  // ← getDoc теперь есть
  if (!snapshot.exists()) throw new Error('Пользователь не найден');
  return snapshot.data();
};

// === СОЗДАТЬ ПОЕЗДКУ ===
export const createTrip = async (userEmail, tripData) => {
  const tripRef = doc(collection(db, 'users', userEmail, 'trips')); // ← Авто-ID
  await setDoc(tripRef, {
    ...tripData,
    budget: Number(tripData.budget) || 0,
    checklist: {},
    budgetCategories: {},
    participants: {},
    createdAt: serverTimestamp()
  });
  return tripRef.id;
};

// === УДАЛИТЬ ПОЕЗДКУ ===
export const deleteTrip = async (userEmail, tripId) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  await deleteDoc(tripRef);
};

// === ПОДПИСКА НА ПОЕЗДКИ ===
export const subscribeToTrips = (userEmail, callback) => {
  const tripsRef = collection(db, 'users', userEmail, 'trips'); // ← collection
  return onSnapshot(tripsRef, snapshot => {
    const trips = [];
    snapshot.forEach(doc => {
      trips.push({ id: doc.id, ...doc.data() });
    });
    callback(trips);
  });
};

// === ЧЕКЛИСТ ===
export const addChecklistItem = async (userEmail, tripId, text) => {
  const itemId = Date.now().toString();
  const itemRef = doc(db, 'users', userEmail, 'trips', tripId, 'checklist', itemId);
  await setDoc(itemRef, { text, done: false });
};

export const toggleChecklist = async (userEmail, tripId, itemId) => {
  const itemRef = doc(db, 'users', userEmail, 'trips', tripId, 'checklist', itemId);
  const snapshot = await getDoc(itemRef);
  if (!snapshot.exists()) return;
  await updateDoc(itemRef, { done: !snapshot.data().done });
};

// === БЮДЖЕТ ===
export const updateBudgetCategory = async (userEmail, tripId, category, amount) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  const value = amount === '' ? 0 : Number(amount);
  if (value > 0) {
    await updateDoc(tripRef, { [`budgetCategories.${category}`]: value });
  } else {
    await updateDoc(tripRef, { [`budgetCategories.${category}`]: deleteField() });
  }
};
   
export const removeBudgetCategory = async (userEmail, tripId, categoryKey) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  await updateDoc(tripRef, { [`budgetCategories.${categoryKey}`]: deleteField() });
};

// === УЧАСТНИКИ ===
export const addParticipant = async (userEmail, tripId, name, amount = 0) => {
  const participantId = Date.now().toString();
  const participantRef = doc(db, 'users', userEmail, 'trips', tripId, 'participants', participantId);
  await setDoc(participantRef, { name, amount: Number(amount) });
};

export const updateParticipant = async (userEmail, tripId, participantId, amount) => {
  const participantRef = doc(db, 'users', userEmail, 'trips', tripId, 'participants', participantId);
  await updateDoc(participantRef, { amount: Number(amount) || 0 });
};

export const removeParticipant = async (userEmail, tripId, participantId) => {
  const participantRef = doc(db, 'users', userEmail, 'trips', tripId, 'participants', participantId);
  await deleteDoc(participantRef);
};