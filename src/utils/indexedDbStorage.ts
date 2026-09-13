import { DocumentItem, CustomFontItem, StorageUsageInfo } from '../types';
import { formatFileSize } from './fileHelpers';

const DB_NAME = 'UniversalDocStudioDB';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_FONTS = 'fonts';
const STORE_SETTINGS = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

export function getIndexedDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Documents Store
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
      }

      // 2. Custom Fonts Store
      if (!db.objectStoreNames.contains(STORE_FONTS)) {
        db.createObjectStore(STORE_FONTS, { keyPath: 'id' });
      }

      // 3. Key-Value Settings Store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// -------------------------------------------------------------
// DOCUMENTS PERSISTENCE
// -------------------------------------------------------------

export async function saveDocumentsToDb(docs: DocumentItem[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORE_DOCUMENTS);

      // Clear existing records to mirror current set exactly
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        docs.forEach((doc) => {
          // Remove non-serializable elements if any
          const cleanDoc = { ...doc };
          if (cleanDoc.type === 'pdf') {
            cleanDoc.data = {
              ...cleanDoc.data,
              pdfDataBuffer: undefined,
            };
          }
          store.put(cleanDoc);
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage on IndexedDB save failure:', err);
    try {
      localStorage.setItem('universal_document_studio_docs', JSON.stringify(docs));
    } catch {
      // ignore
    }
  }
}

export async function loadDocumentsFromDb(): Promise<DocumentItem[] | null> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result) && result.length > 0) {
          resolve(result as DocumentItem[]);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed reading from IndexedDB, falling back to localStorage:', err);
    try {
      const saved = localStorage.getItem('universal_document_studio_docs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }
}

// -------------------------------------------------------------
// CUSTOM FONTS PERSISTENCE
// -------------------------------------------------------------

export async function saveCustomFontToDb(font: CustomFontItem): Promise<void> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readwrite');
    const store = tx.objectStore(STORE_FONTS);
    store.put(font);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadCustomFontsFromDb(): Promise<CustomFontItem[]> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FONTS, 'readonly');
      const store = tx.objectStore(STORE_FONTS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as CustomFontItem[]) || []);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not load fonts from IndexedDB:', err);
    return [];
  }
}

export async function deleteCustomFontFromDb(fontId: string): Promise<void> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readwrite');
    const store = tx.objectStore(STORE_FONTS);
    store.delete(fontId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// SETTINGS PERSISTENCE
// -------------------------------------------------------------

export async function saveSettingToDb(key: string, value: any): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key, value });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    try {
      localStorage.setItem(`universal_setting_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}

export async function loadSettingFromDb<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };

      request.onerror = () => resolve(defaultValue);
    });
  } catch {
    try {
      const saved = localStorage.getItem(`universal_setting_${key}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultValue;
  }
}

// -------------------------------------------------------------
// STORAGE QUOTA ESTIMATE TELEMETRY
// -------------------------------------------------------------

export async function getStorageUsageEstimate(): Promise<StorageUsageInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? ((used / quota) * 100).toFixed(1) : '0';

      return {
        usedBytes: used,
        quotaBytes: quota,
        usedFormatted: formatFileSize(used),
        quotaFormatted: formatFileSize(quota),
        percentUsed: `${percent}%`,
        isIndexedDB: true,
      };
    } catch (err) {
      console.warn('Failed to estimate storage:', err);
    }
  }

  return {
    usedBytes: 0,
    quotaBytes: 0,
    usedFormatted: 'Calculating...',
    quotaFormatted: 'Unlimited Local Storage',
    percentUsed: '<1%',
    isIndexedDB: true,
  };
}
