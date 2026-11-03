import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot, runTransaction, setDoc } from "firebase/firestore";

let db;
let auth;

export function configureCloudSync(config) {
  const app = getApps().some(candidate => candidate.name === "daynova-sync")
    ? getApp("daynova-sync")
    : initializeApp(config, "daynova-sync");
  auth = getAuth(app);
  db = getFirestore(app);
}

export async function signIntoCloudSync() {
  if (!auth || !db) throw new Error("Firebase is not configured yet.");
  if (!auth.currentUser) await signInAnonymously(auth);
}

function syncDocument(code) {
  if (!db || !auth?.currentUser) throw new Error("Connect to Firebase before using a sync code.");
  return doc(db, "daynovaSync", code);
}

function dataFor(state) {
  return { state, updatedAt: Date.now() };
}

export async function createCloudSync(code, state) {
  const reference = syncDocument(code);
  await runTransaction(db, async transaction => {
    const existing = await transaction.get(reference);
    if (existing.exists()) throw new Error("A rare sync-code collision occurred. Create a new code and try again.");
    transaction.set(reference, dataFor(state));
  });
}

export async function readCloudSync(code) {
  const snapshot = await getDoc(syncDocument(code));
  return snapshot.exists() ? snapshot.data().state : null;
}

export async function writeCloudSync(code, state) {
  await setDoc(syncDocument(code), dataFor(state));
}

export function subscribeCloudSync(code, onState, onError) {
  return onSnapshot(syncDocument(code), snapshot => {
    if (snapshot.exists()) onState(snapshot.data().state);
  }, onError);
}

