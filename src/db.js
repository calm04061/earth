// 简单的 IndexedDB 封装
const DB_NAME = 'earth-db';
const DB_VER = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('notes')) {
        d.createObjectStore('notes', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll(store) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store, data) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store, id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbClear(store) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
