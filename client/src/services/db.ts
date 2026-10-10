import { Discovery } from '../types';

const DB_NAME = 'jungledex_db';
const DB_VERSION = 1;
const STORE_NAME = 'discoveries';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredCards(): Promise<Discovery[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Return latest first
        const items = (request.result as Discovery[]) || [];
        resolve(items.reverse());
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Falling back to localStorage:', err);
    try {
      const local = localStorage.getItem('jungledex-cards');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function saveCardToDB(card: Discovery): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(card);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Save Error]:', err);
    // Best-effort localStorage backup
    try {
      const current = localStorage.getItem('jungledex-cards');
      const list: Discovery[] = current ? JSON.parse(current) : [];
      // avoid exceeding quota by truncating to recent 10 if using localStorage
      const updated = [card, ...list.filter(c => c.id !== card.id)].slice(0, 10);
      localStorage.setItem('jungledex-cards', JSON.stringify(updated));
    } catch {
      // quota or private browsing
    }
  }
}

export async function deleteCardFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // ignore
  }
}

// Convert a File or Blob into a persistent base64 data URL
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
