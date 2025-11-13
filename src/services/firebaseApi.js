import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, deleteField 
} from 'firebase/firestore';

const firebaseConfig = {
  // ← ТВОИ ДАННЫЕ ИЗ FIREBASE CONSOLE
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const register = async (username, email) => {
  const userRef = doc(db, 'users', email);
  await setDoc(userRef, { username, email }, { merge: true });
  return { username, email };
};

export const login = async (email) => {
  const userRef = doc(db, 'users', email);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) throw new Error('Пользователь не найден');
  return snapshot.data();
};

export const createTrip = async (userEmail, tripData) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', Date.now().toString());
  await setDoc(tripRef, {
    ...tripData,
    budget: Number(tripData.budget),
    checklist: {},
    budgetCategories: {},
    participants: {}
  });
};

export const deleteTrip = async (userEmail, tripId) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  await deleteDoc(tripRef);
};

export const subscribeToTrips = (userEmail, callback) => {
  const tripsRef = collection(db, 'users', userEmail, 'trips');
  return onSnapshot(tripsRef, snapshot => {
    const trips = [];
    snapshot.forEach(doc => {
      trips.push({ id: doc.id, ...doc.data() });
    });
    callback(trips);
  });
};

export const addChecklistItem = async (userEmail, tripId, text) => {
  const itemRef = doc(collection(db, 'users', userEmail, 'trips', tripId, 'checklist'));
  await setDoc(itemRef, { text, done: false });
};

export const toggleChecklist = async (userEmail, tripId, itemId) => {
  const itemRef = doc(db, 'users', userEmail, 'trips', tripId, 'checklist', itemId);
  const snapshot = await getDoc(itemRef);
  await updateDoc(itemRef, { done: !snapshot.data().done });
};

export const updateBudgetCategory = async (userEmail, tripId, category, amount) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  const value = amount === '' ? 0 : Number(amount);
  await updateDoc(tripRef, {
    [`budgetCategories.${category}`]: value > 0 ? value : 0
  });
};

export const removeBudgetCategory = async (userEmail, tripId, categoryKey) => {
  const tripRef = doc(db, 'users', userEmail, 'trips', tripId);
  await updateDoc(tripRef, {
    [`budgetCategories.${categoryKey}`]: deleteField()
  });
};

export const addParticipant = async (userEmail, tripId, name, amount) => {
  const participantRef = doc(collection(db, 'users', userEmail, 'trips', tripId, 'participants'));
  await setDoc(participantRef, { name, amount: Number(amount) || 0 });
};

export const updateParticipant = async (userEmail, tripId, participantId, amount) => {
  const participantRef = doc(db, 'users', userEmail, 'trips', tripId, 'participants', participantId);
  await updateDoc(participantRef, { amount: Number(amount) || 0 });
};

export const removeParticipant = async (userEmail, tripId, participantId) => {
  const participantRef = doc(db, 'users', userEmail, 'trips', tripId, 'participants', participantId);
  await deleteDoc(participantRef);
};