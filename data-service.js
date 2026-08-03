const LuaDataService = (() => {
  const RES_KEY = 'luaBrideReservations';
  const CUS_KEY = 'luaBrideCustomers';
  const config = window.LUA_FIREBASE_CONFIG || null;
  const firebaseReady = Boolean(config && config.apiKey && window.firebase?.initializeApp);
  let db = null;

  if (firebaseReady) {
    if (!firebase.apps.length) firebase.initializeApp(config);
    db = firebase.firestore();
  }

  const readLocal = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  };

  const writeLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  const local = {
    async list() { return readLocal(RES_KEY); },
    async add(item) {
      const all = readLocal(RES_KEY);
      all.unshift(item);
      writeLocal(RES_KEY, all);
      return item;
    },
    async update(id, patch) {
      const all = readLocal(RES_KEY);
      const index = all.findIndex((x) => x.id === id);
      if (index < 0) return null;
      all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() };
      writeLocal(RES_KEY, all);
      return all[index];
    },
    async remove(id) {
      writeLocal(RES_KEY, readLocal(RES_KEY).filter((x) => x.id !== id));
    },
    subscribe(cb) {
      cb(readLocal(RES_KEY));
      const handler = (event) => event.key === RES_KEY && cb(readLocal(RES_KEY));
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    async listCustomers() { return readLocal(CUS_KEY); },
    async saveCustomer(customer) {
      const all = readLocal(CUS_KEY);
      const index = all.findIndex((x) => x.id === customer.id);
      if (index >= 0) all[index] = { ...all[index], ...customer };
      else all.unshift(customer);
      writeLocal(CUS_KEY, all);
      return customer;
    },
    subscribeCustomers(cb) {
      cb(readLocal(CUS_KEY));
      const handler = (event) => event.key === CUS_KEY && cb(readLocal(CUS_KEY));
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  };

  const cloud = {
    async list() {
      const snap = await db.collection('reservations').orderBy('createdAt', 'desc').get();
      return snap.docs.map((d) => d.data());
    },
    async add(item) {
      await db.collection('reservations').doc(item.id).set(item);
      return item;
    },
    async update(id, patch) {
      await db.collection('reservations').doc(id).update({
        ...patch,
        updatedAt: new Date().toISOString()
      });
    },
    async remove(id) {
      await db.collection('reservations').doc(id).delete();
    },
    subscribe(cb, onError) {
      return db.collection('reservations')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => cb(snapshot.docs.map((d) => d.data())),
          onError
        );
    },
    async listCustomers() {
      const snap = await db.collection('customers').orderBy('updatedAt', 'desc').get();
      return snap.docs.map((d) => d.data());
    },
    async saveCustomer(customer) {
      const payload = { ...customer, updatedAt: new Date().toISOString() };
      await db.collection('customers').doc(customer.id).set(payload, { merge: true });
      return payload;
    },
    subscribeCustomers(cb, onError) {
      return db.collection('customers')
        .orderBy('updatedAt', 'desc')
        .onSnapshot(
          (snapshot) => cb(snapshot.docs.map((d) => d.data())),
          onError
        );
    }
  };

  const genericLocal = {
    subscribeCollection(name, cb) { const key = `luaBride_${name}`; cb(readLocal(key)); const h=(e)=>e.key===key&&cb(readLocal(key)); window.addEventListener('storage',h); return ()=>window.removeEventListener('storage',h); },
    async saveCollectionDoc(name, item) { const key=`luaBride_${name}`; const all=readLocal(key); const i=all.findIndex(x=>x.id===item.id); if(i>=0) all[i]={...all[i],...item}; else all.unshift(item); writeLocal(key,all); window.dispatchEvent(new StorageEvent('storage',{key})); return item; },
    async removeCollectionDoc(name,id){ const key=`luaBride_${name}`; writeLocal(key,readLocal(key).filter(x=>x.id!==id)); window.dispatchEvent(new StorageEvent('storage',{key})); }
  };
  const genericCloud = {
    subscribeCollection(name, cb, onError) { return db.collection(name).orderBy('updatedAt','desc').onSnapshot(s=>cb(s.docs.map(d=>d.data())),onError); },
    async saveCollectionDoc(name,item){ const payload={...item,updatedAt:new Date().toISOString()}; await db.collection(name).doc(item.id).set(payload,{merge:true}); return payload; },
    async removeCollectionDoc(name,id){ await db.collection(name).doc(id).delete(); }
  };
  return {
    ...(firebaseReady ? cloud : local),
    ...(firebaseReady ? genericCloud : genericLocal),
    mode: firebaseReady ? 'firebase' : 'local'
  };
})();

window.LuaDataService = LuaDataService;
