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

// === РЕГИСТРАЦИЯ ===
export const register = async (username, email, password) => {
  const userId = `user_${email.replace(/[@.]/g, '_')}`;
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) throw new Error('Email уже используется');

  await set(userRef, { id: userId, username, email });
  return { user: { id: userId, username, email } };
};

// === ВХОД ===
export const login = async (email, password) => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const users = snapshot.val() || {};
  const user = Object.values(users).find(u => u.email === email);
  if (!user) throw new Error('Неверный email');
  return { user: { id: user.id, username: user.username, email } };
};

// === ДОБАВИТЬ ЗАДАЧУ ===
export const addTask = async (userId, text) => {
  const taskRef = push(ref(db, `tasks/${userId}`));
  const task = {
    id: taskRef.key,
    text,
    completed: false,
    createdAt: Date.now()
  };
  await set(taskRef, task);
  return task;
};

// === ПЕРЕКЛЮЧИТЬ ВЫПОЛНЕНО ===
export const toggleTask = async (userId, taskId, completed) => {
  await set(ref(db, `tasks/${userId}/${taskId}/completed`), !completed);
};

// === УДАЛИТЬ ЗАДАЧУ ===
export const deleteTask = async (userId, taskId) => {
  await remove(ref(db, `tasks/${userId}/${taskId}`));
};

// === РЕАЛТАЙМ ЗАДАЧИ ===
let tasksListener = null;
export const subscribeToTasks = (userId, callback) => {
  if (tasksListener) tasksListener();

  const tasksRef = ref(db, `tasks/${userId}`);
  const unsubscribe = onValue(tasksRef, (snapshot) => {
    const data = snapshot.val() || {};
    const tasks = Object.values(data).sort((a, b) => b.createdAt - a.createdAt);
    callback(tasks);
  });

  tasksListener = unsubscribe;
  return unsubscribe;
};

export const unsubscribeFromTasks = () => {
  if (tasksListener) {
    tasksListener();
    tasksListener = null;
  }
};