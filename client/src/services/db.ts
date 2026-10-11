import { Discovery } from '../types';

export interface QueuedScan {
  id: string;
  photoDataUrl: string;
  coordinates?: { latitude: number; longitude: number };
  placeLabel?: string;
  weather?: string;
  timestamp: number;
  theme?: string;
}

const DB_NAME = 'jungledex_db';
const DB_VERSION = 2;
const STORE_NAME = 'discoveries';
const QUEUE_STORE = 'offline_queue';

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
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
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

export async function getQueuedScans(): Promise<QueuedScan[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as QueuedScan[]) || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Queue] Falling back to localStorage:', err);
    try {
      const local = localStorage.getItem('jungledex-offline-queue');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function queueOfflineScan(scan: QueuedScan): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.put(scan);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Queue Save Error]:', err);
    try {
      const current = localStorage.getItem('jungledex-offline-queue');
      const list: QueuedScan[] = current ? JSON.parse(current) : [];
      const updated = [...list.filter(q => q.id !== scan.id), scan];
      localStorage.setItem('jungledex-offline-queue', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

export async function removeQueuedScan(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      const current = localStorage.getItem('jungledex-offline-queue');
      if (current) {
        const list: QueuedScan[] = JSON.parse(current);
        localStorage.setItem('jungledex-offline-queue', JSON.stringify(list.filter(q => q.id !== id)));
      }
    } catch {
      // ignore
    }
  }
}

// Convert a base64 data URL back to a File object for multipart uploading
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
