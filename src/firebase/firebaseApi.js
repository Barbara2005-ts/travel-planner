import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, remove, update } from 'firebase/database';

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

const getSafeEmail = (email) => email.replace(/[.@]/g, '_');

// ========== АВТОРИЗАЦИЯ ==========
export const register = async (username, email) => {
  const safeEmail = getSafeEmail(email);
  const userRef = ref(db, `users/${safeEmail}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Email уже занят');
  await set(userRef, { username, email, createdAt: Date.now(), isBlocked: false, role: 'user' });
  return { username, email };
};

export const login = async (email) => {
  const safeEmail = getSafeEmail(email);
  const userRef = ref(db, `users/${safeEmail}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error('Пользователь не найден');
  const userData = snap.val();
  if (userData.isBlocked) throw new Error('Ваш аккаунт заблокирован');
  return { ...userData, email };
};

export const isAdmin = async (email) => {
  const safeEmail = getSafeEmail(email);
  const snap = await get(ref(db, `users/${safeEmail}`));
  return snap.exists() && snap.val().role === 'admin';
};

// ========== ПОЕЗДКИ ==========
export const getUserTripsIds = (email, callback) => {
  const safeEmail = getSafeEmail(email);
  return onValue(ref(db, `userTrips/${safeEmail}`), (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.keys(data));
  });
};

// ЭТА ФУНКЦИЯ - ПОДПИСКА НА ОБНОВЛЕНИЯ ПОЕЗДКИ В РЕАЛЬНОМ ВРЕМЕНИ
export const subscribeToTrip = (tripId, callback) => {
  return onValue(ref(db, `trips/${tripId}`), (snapshot) => {
    const data = snapshot.val();
    console.log('📡 Получено обновление поездки:', tripId, data);
    callback(data ? { id: tripId, ...data } : null);
  });
};

export const createTrip = async (email, tripData) => {
  const safeEmail = getSafeEmail(email);
  const newTripRef = push(ref(db, 'trips'));
  const tripId = newTripRef.key;
  
  await set(newTripRef, {
    destination: tripData.destination,
    dates: tripData.dates,
    budget: tripData.budget,
    checklist: {},
    budgetCategories: {},
    participants: {},
    createdBy: email,
    createdAt: Date.now()
  });
  
  await addParticipant(tripId, email.split('@')[0], tripData.creatorAmount || 0, email);
  await set(ref(db, `userTrips/${safeEmail}/${tripId}`), { role: 'creator', joinedAt: Date.now() });
  
  return tripId;
};

export const deleteTrip = async (email, tripId) => {
  const safeEmail = getSafeEmail(email);
  const tripRef = ref(db, `trips/${tripId}`);
  const tripSnap = await get(tripRef);
  const tripData = tripSnap.val();
  
  if (tripData && tripData.createdBy === email) {
    if (tripData.participants) {
      for (const [_, participant] of Object.entries(tripData.participants)) {
        if (participant.email) {
          const participantSafeEmail = getSafeEmail(participant.email);
          await remove(ref(db, `userTrips/${participantSafeEmail}/${tripId}`));
        }
      }
    }
    await remove(ref(db, `trips/${tripId}`));
    await remove(ref(db, `userTrips/${safeEmail}/${tripId}`));
  }
};

// ========== УЧАСТНИКИ ==========
export const addParticipant = async (tripId, name, amount, email) => {
  const participantId = Date.now().toString();
  await set(ref(db, `trips/${tripId}/participants/${participantId}`), { 
    name, amount: Number(amount), email, joinedAt: Date.now() 
  });
};

// ========== ЧЕКЛИСТ ==========
export const addChecklistItem = async (tripId, text) => {
  const itemId = Date.now().toString();
  await set(ref(db, `trips/${tripId}/checklist/${itemId}`), { 
    text, done: false, createdAt: Date.now()
  });
  console.log('✅ Добавлен пункт чеклиста:', tripId, text);
  return itemId;
};

export const toggleChecklist = async (tripId, itemId) => {
  const itemRef = ref(db, `trips/${tripId}/checklist/${itemId}`);
  const snap = await get(itemRef);
  if (snap.exists()) {
    await update(itemRef, { done: !snap.val().done });
    console.log('🔄 Переключен статус чеклиста:', tripId, itemId);
  }
};

// ========== БЮДЖЕТ ==========
export const updateBudgetCategory = async (tripId, category, amount) => {
  const value = amount === '' ? 0 : Number(amount);
  if (value > 0) {
    await set(ref(db, `trips/${tripId}/budgetCategories/${category}`), value);
  } else {
    await remove(ref(db, `trips/${tripId}/budgetCategories/${category}`));
  }
  console.log('💰 Обновлена категория бюджета:', tripId, category, amount);
};

export const removeBudgetCategory = async (tripId, category) => {
  await remove(ref(db, `trips/${tripId}/budgetCategories/${category}`));
};

// ========== ПРИГЛАШЕНИЯ ==========
export const sendInvite = async (fromEmail, toEmail, tripId, tripName) => {
  const safeToEmail = getSafeEmail(toEmail);
  const inviteId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  await set(ref(db, `invites/${safeToEmail}/${inviteId}`), {
    from: fromEmail, to: toEmail, tripId, tripName, status: 'pending', createdAt: Date.now()
  });
};

export const subscribeToInvites = (email, callback) => {
  const safeEmail = getSafeEmail(email);
  return onValue(ref(db, `invites/${safeEmail}`), (snapshot) => {
    const data = snapshot.val() || {};
    const invites = Object.entries(data).map(([id, invite]) => ({ id, ...invite }));
    callback(invites.filter(i => i.status === 'pending'));
  });
};

export const acceptInvite = async (email, inviteId, tripId, fromEmail, amount) => {
  const safeEmail = getSafeEmail(email);
  await addParticipant(tripId, email.split('@')[0], amount, email);
  await set(ref(db, `userTrips/${safeEmail}/${tripId}`), { role: 'participant', joinedAt: Date.now() });
  await update(ref(db, `invites/${safeEmail}/${inviteId}`), { status: 'accepted' });
};

export const rejectInvite = async (email, inviteId) => {
  const safeEmail = getSafeEmail(email);
  await update(ref(db, `invites/${safeEmail}/${inviteId}`), { status: 'rejected' });
};

// ========== АДМИН ==========
export const getAllUsers = (callback) => {
  return onValue(ref(db, 'users'), (snapshot) => {
    const data = snapshot.val() || {};
    const users = Object.entries(data).map(([id, user]) => ({ 
      id, email: id.replace(/_/g, '.').replace(/_/g, '@'), ...user 
    }));
    callback(users);
  });
};

export const getAdminStats = async () => {
  const usersSnap = await get(ref(db, 'users'));
  const tripsSnap = await get(ref(db, 'trips'));
  return {
    totalUsers: usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0,
    totalTrips: tripsSnap.exists() ? Object.keys(tripsSnap.val()).length : 0
  };
};

export const updateUserRole = async (userId, role) => {
  await update(ref(db, `users/${userId}`), { role });
};

export const toggleUserBlock = async (userId, isBlocked) => {
  await update(ref(db, `users/${userId}`), { isBlocked });
};

export { db };