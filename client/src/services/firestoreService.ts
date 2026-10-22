import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// Lazy db accessor
const getDb = () => getFirebaseDb();

import type {
  Event,
  BudgetCategory,
  Expense,
  Task,
  Vendor,
  Guest,
  AIConversation,
} from '../../../shared/types/index';

// ─── Type helpers ─────────────────────────────────────────────────────────────

type WithoutMeta<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;


function toData(snap: { id: string; data: () => Record<string, unknown> }) {
  const data = snap.data();
  const asTimestamp = (v: unknown): string => {
    if (v != null && typeof (v as { toDate?: unknown }).toDate === 'function') {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    return new Date().toISOString();
  };
  return {
    ...data,
    id: snap.id,
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove undefined values — Firestore throws invalid-argument for undefined fields */
function cleanData(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// ─── Events ────────────────────────────────────────────────────────────────────

export async function createEvent(userId: string, data: Omit<WithoutMeta<Event>, 'userId'>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'events'), cleanData({
    ...data,
    userId,
    colors: data.colors ?? [],
    dietaryPreferences: (data as Record<string, unknown>).dietaryPreferences ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return ref.id;
}


export async function updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = data as Partial<Event> & { id?: string; createdAt?: string };
  await updateDoc(doc(getDb(), 'events', eventId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'events', eventId));
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snap = await getDoc(doc(getDb(), 'events', eventId));
  if (!snap.exists()) return null;
  return toData(snap) as Event;
}

export async function getUserEvents(userId: string): Promise<Event[]> {
  const q = query(
    collection(getDb(), 'events'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as Event);
}

export function subscribeToUserEvents(userId: string, cb: (events: Event[]) => void): Unsubscribe {
  const q = query(
    collection(getDb(), 'events'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => toData(d) as Event));
  });
}

// ─── Budget Categories ─────────────────────────────────────────────────────────

export async function getBudgetCategories(eventId: string): Promise<BudgetCategory[]> {
  const q = query(collection(getDb(), 'budgetCategories'), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as BudgetCategory);
}

export async function addBudgetCategory(data: WithoutMeta<BudgetCategory>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'budgetCategories'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBudgetCategory(id: string, data: Partial<BudgetCategory>): Promise<void> {
  await updateDoc(doc(getDb(), 'budgetCategories', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'budgetCategories', id));
}

// ─── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(eventId: string): Promise<Expense[]> {
  const q = query(collection(getDb(), 'expenses'), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as Expense);
}

export async function addExpense(data: WithoutMeta<Expense>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'expenses'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  await updateDoc(doc(getDb(), 'expenses', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'expenses', id));
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(eventId: string): Promise<Task[]> {
  const q = query(collection(getDb(), 'tasks'), where('eventId', '==', eventId), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as Task);
}

export async function addTask(data: WithoutMeta<Task>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(getDb(), 'tasks', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'tasks', id));
}

export function subscribeToTasks(eventId: string, cb: (tasks: Task[]) => void): Unsubscribe {
  const q = query(collection(getDb(), 'tasks'), where('eventId', '==', eventId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => toData(d) as Task));
  });
}

// ─── Vendors ───────────────────────────────────────────────────────────────────

export async function getVendors(eventId: string): Promise<Vendor[]> {
  const q = query(collection(getDb(), 'vendors'), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as Vendor);
}

export async function addVendor(data: WithoutMeta<Vendor>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'vendors'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<void> {
  await updateDoc(doc(getDb(), 'vendors', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteVendor(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'vendors', id));
}

// ─── Guests ────────────────────────────────────────────────────────────────────

export async function getGuests(eventId: string): Promise<Guest[]> {
  const q = query(collection(getDb(), 'guests'), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => toData(d) as Guest);
}

export async function addGuest(data: WithoutMeta<Guest>): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'guests'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGuest(id: string, data: Partial<Guest>): Promise<void> {
  await updateDoc(doc(getDb(), 'guests', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGuest(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'guests', id));
}

// ─── AI Conversations ──────────────────────────────────────────────────────────

export async function getAIConversation(eventId: string, userId: string): Promise<AIConversation | null> {
  const q = query(
    collection(getDb(), 'aiConversations'),
    where('eventId', '==', eventId),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toData(snap.docs[0]) as AIConversation;
}

export async function saveAIConversation(
  eventId: string,
  userId: string,
  messages: AIConversation['messages']
): Promise<void> {
  const existing = await getAIConversation(eventId, userId);
  if (existing) {
    await updateDoc(doc(getDb(), 'aiConversations', existing.id), {
      messages,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(getDb(), 'aiConversations'), {
      eventId,
      userId,
      messages,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
