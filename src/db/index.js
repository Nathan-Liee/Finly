export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KasTokoDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('transaksi')) {
        db.createObjectStore('transaksi', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('uang_awal')) {
        db.createObjectStore('uang_awal', { keyPath: 'tanggal' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Simpan transaksi ke IndexedDB
export const saveTransaksiLocal = async (tanggal, transaksi) => {
  const db = await openDB();
  const tx = db.transaction('transaksi', 'readwrite');
  const store = tx.objectStore('transaksi');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result || [];
      // Hapus yang tanggalnya sama
      all.filter(t => t.tanggal === tanggal).forEach(t => {
        store.delete(t.id);
      });
      // Tambah yang baru
      transaksi.forEach(t => {
        store.add({ ...t, tanggal, synced: false });
      });
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveAllToLocal = async (kasHarian, transaksi) => {
  const db = await openDB();
  const txUang = db.transaction('uang_awal', 'readwrite');
  const storeUang = txUang.objectStore('uang_awal');
  
  kasHarian?.forEach(k => {
    storeUang.put({ tanggal: k.tanggal, uang_awal: k.uang_awal, synced: true });
  });

  const txTrans = db.transaction('transaksi', 'readwrite');
  const storeTrans = txTrans.objectStore('transaksi');
  
  return new Promise((resolve, reject) => {
    storeTrans.clear().onsuccess = () => {
      transaksi?.forEach(t => {
        storeTrans.add({ ...t, synced: true });
      });
      resolve();
    };
    txTrans.onerror = () => reject(txTrans.error);
  });
};

// Ambil transaksi dari IndexedDB
export const getTransaksiLocal = async () => {
  const db = await openDB();
  const tx = db.transaction('transaksi', 'readonly');
  const store = tx.objectStore('transaksi');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Simpan uang awal
export const saveUangAwalLocal = async (tanggal, uang_awal) => {
  const db = await openDB();
  const tx = db.transaction('uang_awal', 'readwrite');
  const store = tx.objectStore('uang_awal');
  store.put({ tanggal, uang_awal, synced: false });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Ambil uang awal
export const getUangAwalLocal = async () => {
  const db = await openDB();
  const tx = db.transaction('uang_awal', 'readonly');
  const store = tx.objectStore('uang_awal');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Tambah ke sync queue
export const addToSyncQueue = async (action, data) => {
  const db = await openDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  store.add({ action, data, timestamp: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Ambil sync queue
export const getSyncQueue = async () => {
  const db = await openDB();
  const tx = db.transaction('sync_queue', 'readonly');
  const store = tx.objectStore('sync_queue');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Hapus dari sync queue
export const clearSyncQueue = async () => {
  const db = await openDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};