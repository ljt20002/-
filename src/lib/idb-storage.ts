import { StateStorage } from 'zustand/middleware';

// 简单的 IndexedDB 封装，用于 Zustand 持久化
const dbName = 'ai-chat-db';
const storeName = 'sessions-store';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(name);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, name);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  removeItem: async (name: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(name);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
