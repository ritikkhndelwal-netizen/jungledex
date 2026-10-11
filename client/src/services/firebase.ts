import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { Discovery, UserProfile } from '../types';
import { compressImageForCloud } from './imageCompression';

function getFirebaseConfigFromEnv() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`).trim(),
      projectId,
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`).trim(),
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    };
  }
  return null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const config = getFirebaseConfigFromEnv();
if (config) {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase Developer Config Warning]:', err);
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(auth && db);
}

export function subscribeToAuth(callback: (profile: UserProfile | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onFirebaseAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Field Explorer',
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        explorerLevel: 1,
        explorerXp: 0,
        stepsWalked: 0,
        distanceMeters: 0,
      });
    } else {
      callback(null);
    }
  });
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!auth) throw new Error('Cloud sync service is currently unavailable.');
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;
  return {
    uid: user.uid,
    displayName: user.displayName || 'Field Explorer',
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: false,
    explorerLevel: 1,
    explorerXp: 0,
    stepsWalked: 0,
    distanceMeters: 0,
  };
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth) throw new Error('Cloud sync service is currently unavailable.');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  return {
    uid: user.uid,
    displayName: user.displayName || email.split('@')[0],
    email: user.email,
    photoURL: null,
    isAnonymous: false,
    explorerLevel: 1,
    explorerXp: 0,
    stepsWalked: 0,
    distanceMeters: 0,
  };
}

export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  if (!auth) throw new Error('Cloud sync service is currently unavailable.');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  const user = cred.user;
  return {
    uid: user.uid,
    displayName: name || email.split('@')[0],
    email: user.email,
    photoURL: null,
    isAnonymous: false,
    explorerLevel: 1,
    explorerXp: 0,
    stepsWalked: 0,
    distanceMeters: 0,
  };
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

// Strip undefined values which Firestore rejects
function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

// Sync card to Firestore collection with automatic size optimization
export async function syncCardToCloud(userId: string, card: Discovery): Promise<boolean> {
  if (!db) return false;
  try {
    // Compress base64 camera image to fit comfortably under Firestore's 1MB limit
    let optimizedImage = card.image;
    if (optimizedImage && optimizedImage.length > 300000) {
      optimizedImage = await compressImageForCloud(optimizedImage, 1080, 0.72);
    }

    const payload = sanitizeForFirestore({
      ...card,
      image: optimizedImage,
      syncedToCloud: true,
      updatedAt: new Date().toISOString(),
    });

    const cardRef = doc(db, 'users', userId, 'discoveries', card.id);
    await setDoc(cardRef, payload);
    return true;
  } catch (err) {
    console.warn('[Firestore Sync Warning]:', err);
    return false;
  }
}

// Subscribe to real-time updates for a user's discoveries across devices
export function subscribeToUserCards(
  userId: string,
  onUpdate: (cards: Discovery[]) => void
): Unsubscribe {
  if (!db) return () => {};
  try {
    const cardsCol = collection(db, 'users', userId, 'discoveries');
    return onSnapshot(
      cardsCol,
      (snap) => {
        const results: Discovery[] = [];
        snap.forEach((d) => {
          results.push(d.data() as Discovery);
        });
        onUpdate(results);
      },
      (err) => {
        console.warn('[Firestore Real-Time Sync Warning]:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore Subscription Error]:', err);
    return () => {};
  }
}

// Fetch user's discoveries from Firestore (one-time fetch)
export async function fetchCardsFromCloud(userId: string): Promise<Discovery[]> {
  if (!db) return [];
  try {
    const cardsCol = collection(db, 'users', userId, 'discoveries');
    const snap = await getDocs(cardsCol);
    const results: Discovery[] = [];
    snap.forEach((d) => {
      results.push(d.data() as Discovery);
    });
    return results;
  } catch (err) {
    console.warn('[Firestore Fetch Warning]:', err);
    return [];
  }
}

// Publish card to public_cards collection for link viewers
export async function shareCardToFirestore(card: Discovery): Promise<void> {
  if (!db) return;
  try {
    let optimizedImage = card.image;
    if (optimizedImage && optimizedImage.length > 300000) {
      optimizedImage = await compressImageForCloud(optimizedImage, 1080, 0.72);
    }
    const cardRef = doc(db, 'public_cards', card.id);
    const payload = sanitizeForFirestore({
      ...card,
      image: optimizedImage,
      sharedAt: new Date().toISOString(),
    });
    await setDoc(cardRef, payload);
  } catch (err) {
    console.warn('[Firestore Public Share Warning]:', err);
  }
}

// Fetch public shared card for link viewers
export async function fetchSharedCardFromFirestore(cardId: string): Promise<Discovery | null> {
  if (!db) return null;
  try {
    const cardRef = doc(db, 'public_cards', cardId);
    const snap = await getDoc(cardRef);
    if (snap.exists()) {
      return snap.data() as Discovery;
    }
  } catch (err) {
    console.warn('[Firestore Public Fetch Warning]:', err);
  }
  return null;
}
