const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const required=['index.html','admin.html','reservation.html','privacy.html','booking-policy.html','app.js','admin.js','reservation.js','data-service.js','auth-service.js','styles.css','manifest.webmanifest','service-worker.js'];
let failed=false;
for(const f of required){if(!fs.existsSync(path.join(root,f))){console.error('MISSING',f);failed=true}}
for(const f of ['app.js','admin.js','reservation.js','data-service.js','auth-service.js']){try{new Function(fs.readFileSync(path.join(root,f),'utf8'));console.log('OK',f)}catch(e){console.error('SYNTAX',f,e.message);failed=true}}
if(failed)process.exit(1);console.log('Lua Bride smoke test passed.');
