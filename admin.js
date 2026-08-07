let allData = [];
let savedCustomers = [];
let selectedCustomerId = null;
let unsubscribeReservations = null;
let unsubscribeCustomers = null;
let contractsData = [];
let paymentsData = [];
let dressesData = [];
let unsubscribeContracts = null;
let unsubscribePayments = null;
let unsubscribeDresses = null;

const $ = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const customerIdFromPhone = (phone = '') => phone.replace(/\D/g, '') || 'unknown';
let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = $('adminToast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.className = `admin-toast ${type} show`;
  toast.innerHTML = message;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}

function setVisible(element, visible, displayValue = 'block') {
  element.hidden = !visible;
  element.style.display = visible ? displayValue : 'none';
}

function showError(error) {
  console.error(error);
  $('modeNote').textContent = `데이터 연결 오류: ${error?.code || error?.message || 'unknown'}`;
}

function showApp(user) {
  setVisible($('loginGate'), false);
  setVisible($('adminApp'), true);

  $('storageBadge').textContent =
    `${LuaDataService.mode === 'firebase' ? 'FIREBASE ONLINE' : 'LOCAL DEMO'} · ` +
    `${LuaAuthService.mode === 'firebase' ? 'AUTH' : 'DEMO LOGIN'}`;

  $('modeNote').textContent =
    LuaDataService.mode === 'firebase'
      ? `온라인 저장 활성화. 로그인 계정: ${user?.email || '-'}`
      : '현재 이 브라우저에만 저장되는 데모 모드입니다.';

  if (!unsubscribeReservations) {
    unsubscribeReservations = LuaDataService.subscribe((data) => {
      allData = data;
      renderReservations();
      renderCustomers();
    }, showError);
  }

  if (!unsubscribeCustomers) {
    unsubscribeCustomers = LuaDataService.subscribeCustomers((data) => {
      savedCustomers = data;
      renderCustomers();
    }, showError);
  }

  if (!unsubscribeContracts) unsubscribeContracts = LuaDataService.subscribeCollection('contracts', (data) => { contractsData = data; renderContracts(); }, showError);
  if (!unsubscribePayments) unsubscribePayments = LuaDataService.subscribeCollection('payments', (data) => { paymentsData = data; renderPayments(); }, showError);
  if (!unsubscribeDresses) unsubscribeDresses = LuaDataService.subscribeCollection('dresses', (data) => { dressesData = data; renderDresses(); }, showError);
}

function showLogin() {
  setVisible($('loginGate'), true, 'grid');
  setVisible($('adminApp'), false);

  if (unsubscribeReservations) unsubscribeReservations();
  if (unsubscribeCustomers) unsubscribeCustomers();
  if (unsubscribeContracts) unsubscribeContracts();
  if (unsubscribePayments) unsubscribePayments();
  if (unsubscribeDresses) unsubscribeDresses();
  unsubscribeReservations = null;
  unsubscribeCustomers = null;
  unsubscribeContracts = null;
  unsubscribePayments = null;
  unsubscribeDresses = null;
}

$('loginForm').onsubmit = async (event) => {
  event.preventDefault();
  const box = $('loginError');
  const button = event.currentTarget.querySelector('button[type="submit"]');

  box.style.display = 'none';
  button.disabled = true;
  button.textContent = '로그인 중...';

  try {
    const result = await LuaAuthService.login(
      $('adminEmail').value.trim(),
      $('adminPassword').value
    );
    if (result?.user) showApp(result.user);
  } catch (error) {
    box.textContent = `로그인 실패: ${error?.code || error?.message}`;
    box.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = '로그인';
  }
};

$('logoutBtn').onclick = async () => {
  await LuaAuthService.logout();
  showLogin();
};

document.querySelectorAll('.admin-tab').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('.admin-tab').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.admin-tab-panel').forEach((panel) => setVisible(panel, panel.id === `${button.dataset.tab}Tab`));
    if (button.dataset.tab === 'schedule') renderSchedule();
  };
});

function renderReservations() {
  let data = [...allData];
  const query = $('searchInput').value.trim().toLowerCase();

  if (query) {
    data = data.filter((reservation) =>
      [reservation.id, reservation.name, reservation.phone]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }

  if ($('statusFilter').value) {
    data = data.filter((reservation) => reservation.status === $('statusFilter').value);
  }

  if ($('dateFilter').value) {
    data = data.filter((reservation) => reservation.date === $('dateFilter').value);
  }

  $('reservationRows').innerHTML = data.map((reservation) => `
    <tr>
      <td><b>${esc(reservation.date)}</b><br>${esc(reservation.time)}<small>${esc(reservation.id)}</small></td>
      <td>${esc(reservation.name)}<br><a href="tel:${esc(reservation.phone)}">${esc(reservation.phone)}</a>${reservation.memo ? `<small>${esc(reservation.memo)}</small>` : ''}</td>
      <td>${esc(reservation.purpose)}</td>
      <td>${esc(reservation.weddingDate || '-')}</td>
      <td>
        <select class="status-select" data-id="${esc(reservation.id)}">
          ${['신청', '확정', '완료', '취소'].map((status) =>
            `<option ${reservation.status === status ? 'selected' : ''}>${status}</option>`
          ).join('')}
        </select>
      </td>
      <td>
        <button class="open-customer text-btn" data-phone="${esc(reservation.phone)}">고객보기</button>
        <button class="delete-btn" data-id="${esc(reservation.id)}">삭제</button>
      </td>
    </tr>
  `).join('');

  $('emptyState').style.display = data.length ? 'none' : 'block';

  document.querySelectorAll('.status-select').forEach((element) => {
    element.onchange = () => LuaDataService.update(element.dataset.id, {
      status: element.value
    });
  });

  document.querySelectorAll('.delete-btn').forEach((element) => {
    element.onclick = async () => {
      if (confirm('이 예약을 삭제할까요?')) {
        await LuaDataService.remove(element.dataset.id);
      }
    };
  });

  document.querySelectorAll('.open-customer').forEach((element) => {
    element.onclick = () => openCustomerByPhone(element.dataset.phone);
  });

  updateReservationStats();
}

function updateReservationStats() {
  const today = new Date().toISOString().slice(0, 10);
  $('totalCount').textContent = allData.length;
  $('pendingCount').textContent = allData.filter((item) => item.status === '신청').length;
  $('confirmedCount').textContent = allData.filter((item) => item.status === '확정').length;
  $('todayCount').textContent = allData.filter((item) =>
    item.date === today && item.status !== '취소'
  ).length;
}

function mergedCustomers() {
  const customerMap = new Map();

  allData.forEach((reservation) => {
    const id = customerIdFromPhone(reservation.phone);
    const current = customerMap.get(id) || {
      id,
      name: reservation.name,
      phone: reservation.phone,
      weddingDate: reservation.weddingDate || '',
      fittingDate: '',
      fittingTime: '',
      fittingPurpose: '드레스 피팅',
      stage: '신규',
      venue: '',
      budget: '',
      style: '',
      customerType: '',
      selectedDress: '',
      tiara: '',
      veil: '',
      memo: '',
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt || reservation.createdAt,
      reservations: []
    };

    current.name = reservation.name || current.name;
    current.phone = reservation.phone || current.phone;
    current.weddingDate = reservation.weddingDate || current.weddingDate;
    current.reservations.push(reservation);
    customerMap.set(id, current);
  });

  savedCustomers.forEach((customer) => {
    const existing = customerMap.get(customer.id) || { reservations: [] };
    customerMap.set(customer.id, {
      ...existing,
      ...customer,
      reservations: existing.reservations || []
    });
  });

  return [...customerMap.values()].sort((a, b) =>
    String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  );
}

function renderCustomers() {
  const customers = mergedCustomers();
  const query = $('customerSearch').value.trim().toLowerCase();
  const stage = $('customerStageFilter').value;

  const filtered = customers.filter((customer) => {
    const stageMatch = !stage || customer.stage === stage;
    const queryMatch = !query || [
      customer.name,
      customer.phone,
      customer.venue,
      customer.memo,
      customer.style,
      customer.customerType,
      customer.selectedDress,
      customer.tiara,
      customer.veil
    ].some((value) => String(value || '').toLowerCase().includes(query));

    return stageMatch && queryMatch;
  });

  $('customerList').innerHTML = filtered.map((customer) => `
    <button class="customer-card ${selectedCustomerId === customer.id ? 'active' : ''}" data-id="${esc(customer.id)}">
      <b>${esc(customer.name || '이름 없음')}</b>
      <span>${esc(customer.phone || '-')}</span>
      <small>${esc(customer.stage || '신규')} · 예약 ${customer.reservations.length}건</small>
    </button>
  `).join('') || '<div class="empty">고객이 없습니다.</div>';

  document.querySelectorAll('.customer-card').forEach((button) => {
    button.onclick = () => selectCustomer(button.dataset.id);
  });

  const ninetyDaysLater = Date.now() + 90 * 86400000;
  $('customerCount').textContent = customers.length;
  $('consultingCount').textContent = customers.filter((customer) =>
    ['상담중', '피팅중'].includes(customer.stage)
  ).length;
  $('contractCount').textContent = customers.filter((customer) =>
    customer.stage === '계약완료'
  ).length;
  $('weddingSoonCount').textContent = customers.filter((customer) => {
    if (!customer.weddingDate) return false;
    const weddingTime = new Date(customer.weddingDate).getTime();
    return weddingTime >= Date.now() && weddingTime <= ninetyDaysLater;
  }).length;

  if (selectedCustomerId) {
    showCustomerDetail(customers.find((customer) => customer.id === selectedCustomerId));
  }
}

function selectCustomer(id) {
  selectedCustomerId = id;
  renderCustomers();
  showCustomerDetail(mergedCustomers().find((customer) => customer.id === id));
}

function openCustomerByPhone(phone) {
  document.querySelector('[data-tab="customers"]').click();
  selectCustomer(customerIdFromPhone(phone));
}

function showCustomerDetail(customer) {
  if (!customer) {
    $('customerDetail').innerHTML = '<div class="empty">고객을 찾을 수 없습니다.</div>';
    return;
  }

  const reservations = [...customer.reservations].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );

  $('customerDetail').innerHTML = `
    <form id="customerForm" class="crm-form">
      <input type="hidden" name="id" value="${esc(customer.id)}">
      <div class="crm-head">
        <div>
          <p class="eyebrow">CUSTOMER PROFILE</p>
          <h2>${esc(customer.name || '고객')}</h2>
          <a href="tel:${esc(customer.phone)}">${esc(customer.phone)}</a>
        </div>
        <span class="crm-stage">${esc(customer.stage || '신규')}</span>
      </div>

      <div class="crm-grid">
        <label>고객명<input name="name" value="${esc(customer.name || '')}" required></label>
        <label>연락처<input name="phone" value="${esc(customer.phone || '')}" required></label>
        <label>관리 단계
          <select name="stage">
            ${['신규', '상담중', '피팅중', '계약완료', '보류'].map((stage) =>
              `<option ${customer.stage === stage ? 'selected' : ''}>${stage}</option>`
            ).join('')}
          </select>
        </label>
        <label>예식일<input name="weddingDate" type="date" value="${esc(customer.weddingDate || '')}"></label>
        <label>피팅 날짜<input name="fittingDate" type="date" value="${esc(customer.fittingDate || '')}"></label>
        <label>피팅 시간<input name="fittingTime" type="time" value="${esc(customer.fittingTime || '')}"></label>
        <label>피팅 구분
          <select name="fittingPurpose">
            ${['드레스 피팅', '1차 피팅', '2차 피팅', '최종 피팅', '가봉', '기타'].map((purpose) =>
              `<option ${customer.fittingPurpose === purpose ? 'selected' : ''}>${purpose}</option>`
            ).join('')}
          </select>
        </label>
        <label>예식장<input name="venue" value="${esc(customer.venue || '')}" placeholder="예: 부산 ○○호텔"></label>
        <label>예산<input name="budget" value="${esc(customer.budget || '')}" placeholder="예: 200~300만원"></label>
        <label>손님구분
          <select name="customerType">
            <option value="">선택</option>
            ${['다이렉트', '자체', '기타'].map((type) =>
              `<option ${customer.customerType === type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </label>
        <label class="crm-wide">관심 스타일<input name="style" value="${esc(customer.style || '')}" placeholder="예: A라인, 심플, 비즈"></label>
        <label class="crm-wide">선택한 드레스명<input name="selectedDress" value="${esc(customer.selectedDress || '')}" placeholder="예: Signature No.12"></label>
        <label class="crm-wide">티아라 종류 및 제품명<input name="tiara" value="${esc(customer.tiara || '')}" placeholder="예: 크라운형 / T-07 로즈골드"></label>
        <label class="crm-wide">선택한 베일<input name="veil" value="${esc(customer.veil || '')}" placeholder="예: 3m 레이스 롱베일 V-03"></label>
        <label class="crm-wide">상담 메모<textarea name="memo" rows="6" placeholder="상담 내용, 동행자, 주의사항 등을 기록하세요.">${esc(customer.memo || '')}</textarea></label>
      </div>

      <button class="primary" type="submit">고객정보 저장</button>
      <div id="customerSaveResult" class="result"></div>
    </form>

    <section class="customer-history">
      <h3>예약 이력</h3>
      ${reservations.map((reservation) => `
        <article>
          <b>${esc(reservation.date)} ${esc(reservation.time)}</b>
          <span>${esc(reservation.status)} · ${esc(reservation.purpose)}</span>
          <small>${esc(reservation.memo || '')}</small>
        </article>
      `).join('') || '<p>예약 이력이 없습니다.</p>'}
    </section>
  `;

  $('customerForm').onsubmit = saveCustomer;
}

async function saveCustomer(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const phone = data.get('phone').trim();
  const button = form.querySelector('button[type="submit"]');

  const customer = {
    id: data.get('id') || customerIdFromPhone(phone),
    name: data.get('name').trim(),
    phone,
    weddingDate: data.get('weddingDate'),
    fittingDate: data.get('fittingDate'),
    fittingTime: data.get('fittingTime'),
    fittingPurpose: data.get('fittingPurpose') || '드레스 피팅',
    stage: data.get('stage'),
    venue: data.get('venue').trim(),
    budget: data.get('budget').trim(),
    style: data.get('style').trim(),
    customerType: data.get('customerType'),
    selectedDress: data.get('selectedDress').trim(),
    tiara: data.get('tiara').trim(),
    veil: data.get('veil').trim(),
    memo: data.get('memo').trim(),
    updatedAt: new Date().toISOString()
  };

  button.disabled = true;
  button.textContent = '저장 중...';

  try {
    await LuaDataService.saveCustomer(customer);
    selectedCustomerId = customer.id;
    showToast('<b>고객정보가 저장되었습니다.</b><small>피팅 일정도 자동으로 연동되었습니다.</small>', 'success');
    renderSchedule();
  } catch (error) {
    console.error('Customer save error:', error);
    showToast(`<b>고객정보 저장에 실패했습니다.</b><small>${esc(error?.code || error?.message || '알 수 없는 오류')}</small>`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = '고객정보 저장';
  }
}

function downloadCsv(filename, header, dataRows) {
  const lines = [header, ...dataRows].map((row) =>
    row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')
  );

  const blob = new Blob(['\ufeff' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8'
  });

  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function exportReservations() {
  downloadCsv(
    `lua-bride-reservations-${new Date().toISOString().slice(0, 10)}.csv`,
    ['예약번호', '신청일', '예약일', '시간', '상태', '이름', '연락처', '방문목적', '예식일', '요청사항'],
    allData.map((item) => [
      item.id, item.createdAt, item.date, item.time, item.status,
      item.name, item.phone, item.purpose, item.weddingDate, item.memo
    ])
  );
}

function exportCustomers() {
  downloadCsv(
    `lua-bride-customers-${new Date().toISOString().slice(0, 10)}.csv`,
    ['고객명', '연락처', '단계', '손님구분', '예식일', '예식장', '예산', '관심스타일', '선택드레스', '티아라', '베일', '상담메모', '예약횟수'],
    mergedCustomers().map((customer) => [
      customer.name,
      customer.phone,
      customer.stage,
      customer.customerType,
      customer.weddingDate,
      customer.fittingDate,
      customer.fittingTime,
      customer.fittingPurpose,
      customer.venue,
      customer.budget,
      customer.style,
      customer.selectedDress,
      customer.tiara,
      customer.veil,
      customer.memo,
      customer.reservations.length
    ])
  );
}

[$('searchInput'), $('statusFilter'), $('dateFilter')].forEach((element) =>
  element.addEventListener('input', renderReservations)
);

$('clearFilter').onclick = () => {
  $('searchInput').value = '';
  $('statusFilter').value = '';
  $('dateFilter').value = '';
  renderReservations();
};

$('customerSearch').addEventListener('input', renderCustomers);
$('customerStageFilter').addEventListener('input', renderCustomers);
$('exportBtn').onclick = exportReservations;
$('customerExportBtn').onclick = exportCustomers;


const money = (value) => `${Number(value || 0).toLocaleString()}원`;
const makeDocId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
function customerOptions(selected='') { return mergedCustomers().map(c => `<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)} · ${esc(c.phone)}</option>`).join(''); }
function customerById(id){ return mergedCustomers().find(c=>c.id===id) || {}; }
function openOpsModal(html,onSubmit){ $('opsModalBody').innerHTML=html; setVisible($('opsModal'),true,'grid'); const form=$('opsModalBody').querySelector('form'); if(form) form.onsubmit=onSubmit; }
function closeOpsModal(){ setVisible($('opsModal'),false); $('opsModalBody').innerHTML=''; }
$('opsModalClose').onclick=closeOpsModal;
$('opsModal').onclick=(e)=>{if(e.target===$('opsModal'))closeOpsModal();};

function contractForm(item={}){
  return `<form class="ops-form"><p class="eyebrow">CONTRACT</p><h2>${item.id?'계약 수정':'새 계약'}</h2><input type="hidden" name="id" value="${esc(item.id||'')}"><div class="crm-grid"><label>고객<select name="customerId" required><option value="">선택</option>${customerOptions(item.customerId)}</select></label><label>계약 상태<select name="status">${['상담','계약진행','계약완료','해지'].map(x=>`<option ${item.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>계약일<input type="date" name="contractDate" value="${esc(item.contractDate||'')}"></label><label>총 계약금액<input type="number" name="totalAmount" min="0" value="${esc(item.totalAmount||'')}"></label><label>상품 구성<input name="packageName" value="${esc(item.packageName||'')}" placeholder="본식 드레스 + 촬영 드레스"></label><label>본식일<input type="date" name="weddingDate" value="${esc(item.weddingDate||'')}"></label><label class="crm-wide">계약 메모<textarea name="memo" rows="5">${esc(item.memo||'')}</textarea></label></div><button class="primary" type="submit">저장</button></form>`;
}
async function saveContract(e){e.preventDefault();const d=new FormData(e.target);const customer=customerById(d.get('customerId'));const item={id:d.get('id')||makeDocId('CT'),customerId:d.get('customerId'),customerName:customer.name||'',phone:customer.phone||'',status:d.get('status'),contractDate:d.get('contractDate'),totalAmount:Number(d.get('totalAmount')||0),packageName:d.get('packageName').trim(),weddingDate:d.get('weddingDate'),memo:d.get('memo').trim(),updatedAt:new Date().toISOString()};await LuaDataService.saveCollectionDoc('contracts',item);showToast('<b>계약정보가 저장되었습니다.</b>');closeOpsModal();}
function renderContracts(){const q=($('contractSearch')?.value||'').toLowerCase();const st=$('contractStatusFilter')?.value||'';const list=contractsData.filter(x=>(!st||x.status===st)&&(!q||[x.customerName,x.phone,x.id,x.packageName].some(v=>String(v||'').toLowerCase().includes(q))));$('contractList').innerHTML=list.map(x=>`<article class="ops-card"><div><span class="status-chip">${esc(x.status)}</span><h3>${esc(x.customerName||'고객')}</h3><p>${esc(x.phone||'')} · ${esc(x.contractDate||'-')}</p><p>${esc(x.packageName||'상품 미입력')}</p></div><div class="ops-card-side"><b>${money(x.totalAmount)}</b><button class="secondary small edit-contract" data-id="${esc(x.id)}">수정</button><button class="danger-link remove-contract" data-id="${esc(x.id)}">삭제</button></div></article>`).join('')||'<div class="empty">계약이 없습니다.</div>';document.querySelectorAll('.edit-contract').forEach(b=>b.onclick=()=>openOpsModal(contractForm(contractsData.find(x=>x.id===b.dataset.id)),saveContract));document.querySelectorAll('.remove-contract').forEach(b=>b.onclick=async()=>{if(confirm('계약을 삭제할까요?'))await LuaDataService.removeCollectionDoc('contracts',b.dataset.id)});}

function paymentForm(item={}){return `<form class="ops-form"><p class="eyebrow">PAYMENT</p><h2>결제 기록</h2><input type="hidden" name="id" value="${esc(item.id||'')}"><div class="crm-grid"><label>고객<select name="customerId" required><option value="">선택</option>${customerOptions(item.customerId)}</select></label><label>결제 구분<select name="type">${['계약금','중도금','잔금','환불','기타'].map(x=>`<option ${item.type===x?'selected':''}>${x}</option>`).join('')}</select></label><label>결제일<input type="date" name="paidDate" value="${esc(item.paidDate||new Date().toISOString().slice(0,10))}"></label><label>금액<input type="number" name="amount" min="0" value="${esc(item.amount||'')}"></label><label>결제수단<select name="method">${['카드','계좌이체','현금','기타'].map(x=>`<option ${item.method===x?'selected':''}>${x}</option>`).join('')}</select></label><label>관련 계약<select name="contractId"><option value="">선택 안 함</option>${contractsData.map(c=>`<option value="${esc(c.id)}" ${item.contractId===c.id?'selected':''}>${esc(c.customerName)} · ${esc(c.id)}</option>`).join('')}</select></label><label class="crm-wide">메모<textarea name="memo" rows="4">${esc(item.memo||'')}</textarea></label></div><button class="primary" type="submit">저장</button></form>`;}
async function savePayment(e){e.preventDefault();const d=new FormData(e.target);const customer=customerById(d.get('customerId'));const item={id:d.get('id')||makeDocId('PM'),customerId:d.get('customerId'),customerName:customer.name||'',phone:customer.phone||'',type:d.get('type'),paidDate:d.get('paidDate'),amount:Number(d.get('amount')||0),method:d.get('method'),contractId:d.get('contractId'),memo:d.get('memo').trim(),updatedAt:new Date().toISOString()};await LuaDataService.saveCollectionDoc('payments',item);showToast('<b>결제정보가 저장되었습니다.</b>');closeOpsModal();}
function renderPayments(){const q=($('paymentSearch')?.value||'').toLowerCase();const method=$('paymentMethodFilter')?.value||'';const list=paymentsData.filter(x=>(!method||x.method===method)&&(!q||[x.customerName,x.phone,x.memo].some(v=>String(v||'').toLowerCase().includes(q))));const totalContract=contractsData.filter(x=>x.status!=='해지').reduce((s,x)=>s+Number(x.totalAmount||0),0);const paid=paymentsData.reduce((s,x)=>s+(x.type==='환불'?-Number(x.amount||0):Number(x.amount||0)),0);$('paymentTotal').textContent=money(totalContract);$('paidTotal').textContent=money(paid);$('balanceTotal').textContent=money(Math.max(totalContract-paid,0));const paidByCustomer={};paymentsData.forEach(x=>paidByCustomer[x.customerId]=(paidByCustomer[x.customerId]||0)+(x.type==='환불'?-x.amount:x.amount));$('unpaidCount').textContent=contractsData.filter(c=>c.status!=='해지'&&Number(c.totalAmount||0)>(paidByCustomer[c.customerId]||0)).length;$('paymentList').innerHTML=list.map(x=>`<article class="ops-card"><div><span class="status-chip">${esc(x.type)}</span><h3>${esc(x.customerName)}</h3><p>${esc(x.paidDate)} · ${esc(x.method)}</p><p>${esc(x.memo||'')}</p></div><div class="ops-card-side"><b>${money(x.amount)}</b><button class="secondary small edit-payment" data-id="${esc(x.id)}">수정</button><button class="danger-link remove-payment" data-id="${esc(x.id)}">삭제</button></div></article>`).join('')||'<div class="empty">결제 기록이 없습니다.</div>';document.querySelectorAll('.edit-payment').forEach(b=>b.onclick=()=>openOpsModal(paymentForm(paymentsData.find(x=>x.id===b.dataset.id)),savePayment));document.querySelectorAll('.remove-payment').forEach(b=>b.onclick=async()=>{if(confirm('결제 기록을 삭제할까요?'))await LuaDataService.removeCollectionDoc('payments',b.dataset.id)});}

function dressForm(item={}){return `<form class="ops-form"><p class="eyebrow">DRESS</p><h2>드레스 정보</h2><input type="hidden" name="id" value="${esc(item.id||'')}"><div class="crm-grid"><label>품번<input name="code" value="${esc(item.code||'')}" required></label><label>드레스명<input name="name" value="${esc(item.name||'')}" required></label><label>브랜드<input name="brand" value="${esc(item.brand||'')}"></label><label>사이즈<input name="size" value="${esc(item.size||'')}"></label><label>색상<input name="color" value="${esc(item.color||'Ivory')}"></label><label>상태<select name="status">${['피팅 가능','예약됨','대여 중','세탁 중','수선 중','보관 중'].map(x=>`<option ${item.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>착용횟수<input type="number" name="wearCount" min="0" value="${esc(item.wearCount||0)}"></label><label>연결 고객<select name="customerId"><option value="">없음</option>${customerOptions(item.customerId)}</select></label><label class="crm-wide">메모<textarea name="memo" rows="4">${esc(item.memo||'')}</textarea></label></div><button class="primary" type="submit">저장</button></form>`;}
async function saveDress(e){e.preventDefault();const d=new FormData(e.target);const customer=customerById(d.get('customerId'));const item={id:d.get('id')||makeDocId('DR'),code:d.get('code').trim(),name:d.get('name').trim(),brand:d.get('brand').trim(),size:d.get('size').trim(),color:d.get('color').trim(),status:d.get('status'),wearCount:Number(d.get('wearCount')||0),customerId:d.get('customerId'),customerName:customer.name||'',memo:d.get('memo').trim(),updatedAt:new Date().toISOString()};await LuaDataService.saveCollectionDoc('dresses',item);showToast('<b>드레스 정보가 저장되었습니다.</b>');closeOpsModal();}
function renderDresses(){const q=($('dressSearch')?.value||'').toLowerCase();const st=$('dressStatusFilter')?.value||'';const list=dressesData.filter(x=>(!st||x.status===st)&&(!q||[x.code,x.name,x.brand].some(v=>String(v||'').toLowerCase().includes(q))));$('dressCount').textContent=dressesData.length;$('dressAvailableCount').textContent=dressesData.filter(x=>x.status==='피팅 가능').length;$('dressBookedCount').textContent=dressesData.filter(x=>['예약됨','대여 중'].includes(x.status)).length;$('dressCareCount').textContent=dressesData.filter(x=>['세탁 중','수선 중'].includes(x.status)).length;$('dressList').innerHTML=list.map(x=>`<article class="dress-card"><span class="status-chip">${esc(x.status)}</span><h3>${esc(x.name)}</h3><p>${esc(x.code)} · ${esc(x.brand||'-')}</p><dl><dt>사이즈</dt><dd>${esc(x.size||'-')}</dd><dt>착용횟수</dt><dd>${x.wearCount||0}회</dd><dt>고객</dt><dd>${esc(x.customerName||'-')}</dd></dl><div><button class="secondary small edit-dress" data-id="${esc(x.id)}">수정</button><button class="danger-link remove-dress" data-id="${esc(x.id)}">삭제</button></div></article>`).join('')||'<div class="empty">등록된 드레스가 없습니다.</div>';document.querySelectorAll('.edit-dress').forEach(b=>b.onclick=()=>openOpsModal(dressForm(dressesData.find(x=>x.id===b.dataset.id)),saveDress));document.querySelectorAll('.remove-dress').forEach(b=>b.onclick=async()=>{if(confirm('드레스를 삭제할까요?'))await LuaDataService.removeCollectionDoc('dresses',b.dataset.id)});}

function renderSchedule(){
  const date=$('scheduleDate').value||new Date().toISOString().slice(0,10);
  $('scheduleDate').value=date;

  const reservationItems=allData
    .filter(x=>x.date===date&&x.status!=='취소')
    .map(x=>({
      key:`${customerIdFromPhone(x.phone)}-${x.date}-${x.time}`,
      time:x.time||'',
      name:x.name||'',
      phone:x.phone||'',
      purpose:x.purpose||'예약',
      memo:x.memo||'',
      status:x.status||'신청',
      source:'예약'
    }));

  const existingKeys=new Set(reservationItems.map(x=>x.key));
  const customerItems=mergedCustomers()
    .filter(c=>c.fittingDate===date&&c.fittingTime)
    .map(c=>({
      key:`${c.id}-${c.fittingDate}-${c.fittingTime}`,
      time:c.fittingTime||'',
      name:c.name||'',
      phone:c.phone||'',
      purpose:c.fittingPurpose||'드레스 피팅',
      memo:[c.selectedDress?`드레스: ${c.selectedDress}`:'',c.tiara?`티아라: ${c.tiara}`:'',c.veil?`베일: ${c.veil}`:''].filter(Boolean).join(' · '),
      status:'고객관리',
      source:'고객관리'
    }))
    .filter(x=>!existingKeys.has(x.key));

  const list=[...reservationItems,...customerItems].sort((a,b)=>String(a.time).localeCompare(String(b.time)));
  $('scheduleBoard').innerHTML=list.map(x=>`<article class="schedule-item"><time>${esc(x.time)}</time><div><h3>${esc(x.name)}</h3><p>${esc(x.phone)} · ${esc(x.purpose)}</p><small>${esc(x.memo||'')}</small></div><span class="status-chip">${esc(x.source)}</span></article>`).join('')||'<div class="empty">선택한 날짜의 피팅 일정이 없습니다.</div>';
}

$('newContractBtn').onclick=()=>openOpsModal(contractForm(),saveContract);
$('newPaymentBtn').onclick=()=>openOpsModal(paymentForm(),savePayment);
$('newDressBtn').onclick=()=>openOpsModal(dressForm(),saveDress);
['contractSearch','contractStatusFilter'].forEach(id=>$(id).addEventListener('input',renderContracts));
['paymentSearch','paymentMethodFilter'].forEach(id=>$(id).addEventListener('input',renderPayments));
['dressSearch','dressStatusFilter'].forEach(id=>$(id).addEventListener('input',renderDresses));
$('scheduleDate').addEventListener('input',renderSchedule);

LuaAuthService.onChange((user) => user ? showApp(user) : showLogin());
function openCustomerFromFitting(customerId, phone) {
  const tab = document.querySelector('[data-tab="customers"]');
  if (tab) tab.click();

  const resolvedId =
    customerId ||
    (typeof customerIdFromPhone === 'function'
      ? customerIdFromPhone(phone || '')
      : String(phone || '').replace(/\D/g, ''));

  if (resolvedId && typeof selectCustomer === 'function') {
    selectCustomer(resolvedId);
  }

  setTimeout(() => {
    document.getElementById('customerDetail')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}

function bindFittingCustomerLinks() {
  document.querySelectorAll('.fitting-customer-link').forEach((button) => {
    button.onclick = () => openCustomerFromFitting(
      button.dataset.customerId || '',
      button.dataset.phone || ''
    );
  });
}
