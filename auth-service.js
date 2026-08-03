const LuaAuthService=(()=>{
  const config=window.LUA_FIREBASE_CONFIG||null;
  const ready=Boolean(config&&config.apiKey&&window.firebase?.initializeApp&&window.firebase?.auth);
  if(ready){if(!firebase.apps.length)firebase.initializeApp(config);const auth=firebase.auth();return{
    mode:'firebase',
    onChange:cb=>auth.onAuthStateChanged(cb),
    login:(email,password)=>auth.signInWithEmailAndPassword(email,password),
    logout:()=>auth.signOut(),
    current:()=>auth.currentUser
  }}
  return{
    mode:'demo',
    onChange:cb=>{cb(sessionStorage.getItem('luaAdmin')==='1'?{email:'demo@luabride.local'}:null);return()=>{}},
    async login(email,password){if(password!=='luabride')throw new Error('INVALID_PASSWORD');sessionStorage.setItem('luaAdmin','1');return{user:{email:email||'demo@luabride.local'}}},
    async logout(){sessionStorage.removeItem('luaAdmin')},
    current:()=>sessionStorage.getItem('luaAdmin')==='1'?{email:'demo@luabride.local'}:null
  }
})();
window.LuaAuthService=LuaAuthService;
