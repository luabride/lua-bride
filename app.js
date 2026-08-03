const WISH_KEY='luaBrideWishes';
const modal=document.getElementById('reservationModal');
const menuBtn=document.querySelector('.menu');
const nav=document.querySelector('nav');
function openReservation(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');setMinDates()}
function closeReservation(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}
function quickBook(day,time){openReservation();document.getElementById('time').value=time;const result=document.getElementById('reservationResult');result.style.display='block';result.textContent=`${day} ${time} 예약을 선택했습니다. 정확한 날짜를 지정해 주세요.`}
function setMinDates(){const today=new Date().toISOString().slice(0,10);document.getElementById('date').min=today;document.getElementById('weddingDate').min=today}
function formatPhone(input){const nums=input.value.replace(/\D/g,'').slice(0,11);input.value=nums.length<4?nums:nums.length<8?`${nums.slice(0,3)}-${nums.slice(3)}`:`${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`}
function makeId(){return 'LB-'+Date.now().toString(36).toUpperCase()}
function escapeICS(text=''){return text.replace(/[\\;,\n]/g,m=>({'\\':'\\\\',';':'\\;',',':'\\,','\n':'\\n'}[m]))}
function toICSDate(date,time){return `${date.replaceAll('-','')}T${time.replace(':','')}00`}
function downloadICS(res){const start=toICSDate(res.date,res.time);const endDate=new Date(`${res.date}T${res.time}:00`);endDate.setMinutes(endDate.getMinutes()+90);const pad=n=>String(n).padStart(2,'0');const end=`${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lua Bride//Reservation//KO','BEGIN:VEVENT',`UID:${res.id}@luabride`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${escapeICS('Lua Bride 피팅 예약 - '+res.name)}`,`DESCRIPTION:${escapeICS('방문 목적: '+res.purpose+' / 연락처: '+res.phone)}`,'LOCATION:Lua Bride','END:VEVENT','END:VCALENDAR'].join('\r\n');const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${res.id}-lua-bride.ics`;a.click();URL.revokeObjectURL(a.href)}
menuBtn.addEventListener('click',()=>{nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
modal.addEventListener('click',e=>{if(e.target===modal)closeReservation()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeReservation()});document.getElementById('phone').addEventListener('input',e=>formatPhone(e.target));
document.querySelectorAll('.wish').forEach((btn,index)=>{const wishes=JSON.parse(localStorage.getItem(WISH_KEY)||'[]');if(wishes.includes(index))btn.textContent='♥ 찜 완료';btn.addEventListener('click',()=>{let list=JSON.parse(localStorage.getItem(WISH_KEY)||'[]');if(list.includes(index)){list=list.filter(v=>v!==index);btn.textContent='♡ 찜하기'}else{list.push(index);btn.textContent='♥ 찜 완료'}localStorage.setItem(WISH_KEY,JSON.stringify(list))})});
document.getElementById('aiForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target);const body=d.get('body'),venue=d.get('venue'),style=d.get('style');let rec='A LINE',reason='균형 잡힌 실루엣과 자연스러운 체형 보완이 강점입니다.';if(style.includes('심플')){rec='SIMPLE & MODERN';reason='절제된 선과 깨끗한 소재가 모던한 분위기를 살립니다.'}else if(style.includes('화려')){rec=venue.includes('호텔')?'BALL GOWN':'PRINCESS';reason='볼륨감과 디테일이 사진과 공간에서 풍성하게 표현됩니다.'}else if(body.includes('상체 슬림')){rec='MERMAID';reason='상체와 허리선을 강조해 여성스러운 비율을 만듭니다.'}const result=document.getElementById('aiResult');result.innerHTML=`<b>${rec}</b> 추천<br>${reason}<br><button type="button" class="text-btn" onclick="openReservation()">이 스타일로 피팅 예약하기 →</button>`;result.style.display='block'});
document.getElementById('reservationForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.target,submit=form.querySelector('button[type=submit]'),data=new FormData(form);const reservation={id:makeId(),createdAt:new Date().toISOString(),date:data.get('date'),time:data.get('time'),purpose:data.get('purpose'),name:data.get('name').trim(),phone:data.get('phone').trim(),weddingDate:data.get('weddingDate')||'',memo:data.get('memo')||'',status:'신청'};const result=document.getElementById('reservationResult');submit.disabled=true;submit.textContent='예약 확인 중…';try{const items=await LuaDataService.list();const duplicate=items.some(r=>r.date===reservation.date&&r.time===reservation.time&&r.status!=='취소');if(duplicate){result.innerHTML='<b>선택한 시간은 이미 예약 신청이 있습니다.</b><br>다른 시간을 선택해 주세요.';result.style.display='block';return}await LuaDataService.add(reservation);notifyReservation(reservation);result.innerHTML=`<b>예약 신청이 저장되었습니다.</b><br>예약번호: ${reservation.id}<br>${reservation.date} ${reservation.time}<br><small>저장 방식: ${LuaDataService.mode==='firebase'?'온라인 공유 저장':'이 기기 데모 저장'}</small><div class="result-actions"><button type="button" class="secondary small" id="icsBtn">캘린더에 저장</button></div>`;result.style.display='block';document.getElementById('icsBtn').onclick=()=>downloadICS(reservation);form.reset();setMinDates()}catch(err){result.innerHTML='<b>예약 저장에 실패했습니다.</b><br>네트워크 또는 Firebase 설정을 확인해 주세요.';result.style.display='block';console.error(err)}finally{submit.disabled=false;submit.textContent='예약 신청'}});
setMinDates();

// Central shop settings
(()=>{const c=window.LUA_SITE_CONFIG||{};const address=document.getElementById('shopAddress'),hours=document.getElementById('shopHours'),phone=document.getElementById('phoneLink'),kakao=document.getElementById('kakaoLink');if(address)address.textContent=c.address||address.textContent;if(hours)hours.textContent=c.hours||hours.textContent;if(phone&&c.phoneLink){phone.href='tel:'+c.phoneLink;phone.textContent='전화 상담 '+(c.phone||'')}if(kakao&&c.kakaoUrl)kakao.href=c.kakaoUrl;const time=document.getElementById('time');if(time&&Array.isArray(c.availableTimes)){time.innerHTML='<option value="">선택</option>'+c.availableTimes.map(v=>`<option>${v}</option>`).join('')}})();

// Optional production integrations
(()=>{
  const cfg=window.LUA_INTEGRATIONS||{};
  const paymentBox=document.getElementById('paymentBox');
  const paymentBtn=document.getElementById('paymentBtn');
  const depositText=document.getElementById('depositText');
  if(cfg.payment?.enabled&&paymentBox){
    paymentBox.hidden=false;
    depositText.textContent=`예약 확정을 위해 ${Number(cfg.payment.depositAmount||0).toLocaleString()}원 결제가 필요합니다.`;
    paymentBtn.onclick=()=>{
      if(cfg.payment.checkoutUrl) location.href=cfg.payment.checkoutUrl;
      else alert('결제사 상점 키와 체크아웃 주소를 설정해 주세요.');
    };
  }
})();

async function notifyReservation(reservation){
  const cfg=window.LUA_INTEGRATIONS||{};
  if(!cfg.notificationEndpoint) return;
  try{await fetch(cfg.notificationEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reservation})})}catch(e){console.warn('Reservation notification skipped',e)}
}
