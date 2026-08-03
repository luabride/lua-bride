const LuaDataService=(()=>{
  const KEY='luaBrideReservations';
  const config=window.LUA_FIREBASE_CONFIG||null;
  const firebaseReady=Boolean(config&&config.apiKey&&window.firebase?.initializeApp);
  let db=null;
  if(firebaseReady){
    if(!firebase.apps.length) firebase.initializeApp(config);
    db=firebase.firestore();
  }
  const local={
    async list(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}},
    async add(item){const all=await this.list();all.unshift(item);localStorage.setItem(KEY,JSON.stringify(all));return item},
    async update(id,patch){const all=await this.list();const i=all.findIndex(x=>x.id===id);if(i>=0){all[i]={...all[i],...patch,updatedAt:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(all));return all[i]}return null},
    async remove(id){const all=(await this.list()).filter(x=>x.id!==id);localStorage.setItem(KEY,JSON.stringify(all))},
    subscribe(cb){this.list().then(cb);const fn=e=>{if(e.key===KEY)this.list().then(cb)};window.addEventListener('storage',fn);return()=>window.removeEventListener('storage',fn)}
  };
  const cloud={
    async list(){const snap=await db.collection('reservations').orderBy('createdAt','desc').get();return snap.docs.map(d=>d.data())},
    async add(item){await db.collection('reservations').doc(item.id).set(item);return item},
    async update(id,patch){await db.collection('reservations').doc(id).update({...patch,updatedAt:new Date().toISOString()})},
    async remove(id){await db.collection('reservations').doc(id).delete()},
    subscribe(cb){return db.collection('reservations').orderBy('createdAt','desc').onSnapshot(s=>cb(s.docs.map(d=>d.data()))) }
  };
  return {...(firebaseReady?cloud:local),mode:firebaseReady?'firebase':'local'};
})();
window.LuaDataService=LuaDataService;
