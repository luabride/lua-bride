
window.addEventListener('error', (event) => {
  console.error('Lua Bride admin runtime error:', event.error || event.message);
  const loginBox = document.getElementById('loginError');
  const app = document.getElementById('adminApp');
  if (loginBox && (!app || app.hidden)) {
    loginBox.textContent = `관리자 화면 오류: ${event.message || '알 수 없는 오류'}`;
    loginBox.style.display = 'block';
  }
});

let allData = [];
let savedCustomers = [];
let selectedCustomerId = null;
let unsubscribeReservations = null;
let unsubscribeCustomers = null;
let contractsData = [];
let paymentsData = [];
let dressesData = [];
const DRESS_CATEGORIES = ['아이테오 드레스', '루아 드레스'];
let unsubscribeContracts = null;
let unsubscribePayments = null;
let unsubscribeDresses = null;
  unsubscribeIroDresses = null;
  unsubscribeIroShoes = null;
  unsubscribeHanbok = null;
let iroDressesData = [];
let iroShoesData = [];
let hanbokData = [];
let unsubscribeIroDresses = null;
let unsubscribeIroShoes = null;
let unsubscribeHanbok = null;

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
  if (!unsubscribeIroDresses) unsubscribeIroDresses = LuaDataService.subscribeCollection('iroDresses', (data) => { iroDressesData = data; renderIroStyle(); }, showError);
  if (!unsubscribeIroShoes) unsubscribeIroShoes = LuaDataService.subscribeCollection('iroShoes', (data) => { iroShoesData = data; renderIroStyle(); }, showError);
  if (!unsubscribeHanbok) unsubscribeHanbok = LuaDataService.subscribeCollection('hanbok', (data) => { hanbokData = data; renderHanbok(); }, showError);
}

function showLogin() {
  setVisible($('loginGate'), true, 'grid');
  setVisible($('adminApp'), false);

  if (unsubscribeReservations) unsubscribeReservations();
  if (unsubscribeCustomers) unsubscribeCustomers();
  if (unsubscribeContracts) unsubscribeContracts();
  if (unsubscribePayments) unsubscribePayments();
  if (unsubscribeDresses) unsubscribeDresses();
  if (unsubscribeIroDresses) unsubscribeIroDresses();
  if (unsubscribeIroShoes) unsubscribeIroShoes();
  if (unsubscribeHanbok) unsubscribeHanbok();
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

// 인증 상태 리스너는 가장 먼저 등록해 이후 부가 UI 오류가 로그인에 영향을 주지 않게 합니다.
LuaAuthService.onChange((user) => user ? showApp(user) : showLogin());

document.querySelectorAll('.admin-tab').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('.admin-tab').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.admin-tab-panel').forEach((panel) => {
      setVisible(panel, panel.id === `${button.dataset.tab}Tab`);
    });

    if (button.dataset.tab === 'schedule' && typeof renderSchedule === 'function') renderSchedule();
    if (button.dataset.tab === 'irostyle' && typeof renderIroStyle === 'function') renderIroStyle();
    if (button.dataset.tab === 'hanbok' && typeof renderHanbok === 'function') renderHanbok();
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
      <td>
        <button type="button" class="reservation-name-link" data-id="${esc(reservation.id)}">${esc(reservation.name)}</button>
        <br><span class="phone-text">${esc(reservation.phone)}</span>
        ${reservation.memo ? `<small>${esc(reservation.memo)}</small>` : ''}
      </td>
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
  document.querySelectorAll('.reservation-name-link').forEach((element) => {
    element.onclick = () => showReservationDetail(element.dataset.id);
  });

  updateReservationStats();
}


function showReservationDetail(id) {
  const reservation = allData.find((item) => item.id === id);
  if (!reservation) return;

  const html = `
    <section class="reservation-detail-modal">
      <p class="eyebrow">RESERVATION DETAIL</p>
      <h2>${esc(reservation.name || '예약자')} 예약정보</h2>

      <div class="detail-grid">
        <div><span>예약번호</span><b>${esc(reservation.id || '-')}</b></div>
        <div><span>상태</span><b>${esc(reservation.status || '-')}</b></div>
        <div><span>예약일</span><b>${esc(reservation.date || '-')}</b></div>
        <div><span>시간</span><b>${esc(reservation.time || '-')}</b></div>
        <div><span>예약자</span><b>${esc(reservation.name || '-')}</b></div>
        <div><span>연락처</span><b class="phone-text">${esc(reservation.phone || '-')}</b></div>
        <div><span>방문 목적</span><b>${esc(reservation.purpose || '-')}</b></div>
        <div><span>예식일</span><b>${esc(reservation.weddingDate || '-')}</b></div>
      </div>

      <div class="detail-memo">
        <span>요청사항 / 메모</span>
        <p>${esc(reservation.memo || '기록된 내용이 없습니다.')}</p>
      </div>

      <div class="detail-actions">
        <button type="button" class="primary" id="reservationCustomerOpen">고객관리 열기</button>
        <button type="button" class="secondary" onclick="closeOpsModal()">닫기</button>
      </div>
    </section>
  `;

  openOpsModal(html);
  const openButton = $('reservationCustomerOpen');
  if (openButton) {
    openButton.onclick = () => {
      closeOpsModal();
      openCustomerByPhone(reservation.phone || '');
    };
  }
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
          <span class="phone-text">${esc(customer.phone)}</span>
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
    weddingDate: data.get('weddingDate') || '',
    fittingDate: data.get('fittingDate') || '',
    fittingTime: data.get('fittingTime') || '',
    fittingPurpose: data.get('fittingPurpose') || '드레스 피팅',
    stage: data.get('stage') || '신규',
    venue: data.get('venue').trim(),
    budget: data.get('budget').trim(),
    style: data.get('style').trim(),
    customerType: data.get('customerType') || '',
    selectedDress: data.get('selectedDress').trim(),
    tiara: data.get('tiara').trim(),
    veil: data.get('veil').trim(),
    memo: data.get('memo').trim(),
    updatedAt: new Date().toISOString()
  };

  button.disabled = true;
  button.textContent = '저장 중...';

  try {
    if (LuaDataService.mode === 'firebase') {
      const user = firebase.auth().currentUser;

      if (!user) {
        throw Object.assign(
          new Error('관리자 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'),
          { code: 'auth/session-expired' }
        );
      }

      await user.getIdToken(true);
    }

    const saved = await LuaDataService.saveCustomer(customer);

    const index = savedCustomers.findIndex((item) => item.id === customer.id);
    if (index >= 0) {
      savedCustomers[index] = { ...savedCustomers[index], ...saved };
    } else {
      savedCustomers.unshift(saved);
    }

    selectedCustomerId = customer.id;
    renderCustomers();
    showCustomerDetail(
      mergedCustomers().find((item) => item.id === customer.id)
    );

    showToast(
      '<b>고객정보가 수정되었습니다.</b><small>변경사항이 Firebase에 저장되었습니다.</small>',
      'success'
    );
  } catch (error) {
    console.error('Customer save error:', error);

    const code = error?.code || 'unknown';
    let message = error?.message || '알 수 없는 오류';

    if (code === 'permission-denied') {
      message = 'Firestore 보안 규칙에서 고객정보 수정 권한이 차단되었습니다.';
    } else if (code === 'auth/session-expired') {
      message = '관리자 로그인 세션이 만료되었습니다. 로그아웃 후 다시 로그인해 주세요.';
    } else if (code === 'unavailable') {
      message = 'Firebase 연결이 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.';
    }

    showToast(
      `<b>고객정보 수정에 실패했습니다.</b><small>${esc(message)}<br>오류 코드: ${esc(code)}</small>`,
      'error'
    );
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


let luaStorageReadyPromise = null;

function ensureFirebaseStorage() {
  if (window.firebase?.storage) return Promise.resolve(firebase.storage());

  if (!luaStorageReadyPromise) {
    luaStorageReadyPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
      script.onload = () => {
        try {
          resolve(firebase.storage());
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Firebase Storage SDK를 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
  }

  return luaStorageReadyPromise;
}

function previewDressImage(input) {
  const preview = document.getElementById('dressImagePreview');
  const file = input.files?.[0];

  if (!preview || !file) return;

  if (!file.type.startsWith('image/')) {
    input.value = '';
    showToast('<b>이미지 파일만 선택할 수 있습니다.</b>', 'error');
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    input.value = '';
    showToast('<b>드레스 사진은 8MB 이하로 선택해 주세요.</b>', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
}

async function uploadDressImage(file, dressId) {
  if (!file) return '';

  const storage = await ensureFirebaseStorage();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `dresses/${dressId}/${Date.now()}-${safeName}`;
  const ref = storage.ref().child(path);

  const snapshot = await ref.put(file, {
    contentType: file.type,
    customMetadata: { dressId }
  });

  return snapshot.ref.getDownloadURL();
}

function dressForm(item={}) {
  const currentImage = item.photoUrl || '';

  return `<form class="ops-form" id="dressForm">
    <p class="eyebrow">DRESS</p>
    <h2>${item.id ? '드레스 수정' : '새 드레스 등록'}</h2>

    <input type="hidden" name="id" value="${esc(item.id || '')}">
    <input type="hidden" name="photoUrl" value="${esc(currentImage)}">

    <div class="dress-image-editor">
      <div class="dress-image-preview-wrap">
        <img
          id="dressImagePreview"
          class="dress-image-preview"
          src="${esc(currentImage)}"
          alt="드레스 사진 미리보기"
          ${currentImage ? '' : 'hidden'}>
        <div class="dress-image-placeholder" ${currentImage ? 'hidden' : ''}>
          드레스 사진
        </div>
      </div>

      <label class="dress-file-label">
        사진 선택
        <input
          type="file"
          name="photoFile"
          accept="image/jpeg,image/png,image/webp"
          onchange="previewDressImage(this)">
        <small>JPG·PNG·WEBP, 최대 8MB</small>
      </label>
    </div>

    <div class="crm-grid">
      <label>드레스 목록
        <select name="category" required>
          <option value="">선택</option>
          ${DRESS_CATEGORIES.map((category) =>
            `<option ${item.category === category ? 'selected' : ''}>${category}</option>`
          ).join('')}
        </select>
      </label>

      <label>품번
        <input name="code" value="${esc(item.code || '')}" required>
      </label>

      <label>드레스명
        <input name="name" value="${esc(item.name || '')}" required>
      </label>

      <label>브랜드
        <input name="brand" value="${esc(item.brand || '')}">
      </label>

      <label>사이즈
        <input name="size" value="${esc(item.size || '')}">
      </label>

      <label>색상
        <input name="color" value="${esc(item.color || 'Ivory')}" placeholder="Ivory, Pink, Blue 등">
      </label>

      <label>상태
        <select name="status">
          ${['피팅 가능','예약됨','대여 중','세탁 중','수선 중','보관 중'].map((status) =>
            `<option ${item.status === status ? 'selected' : ''}>${status}</option>`
          ).join('')}
        </select>
      </label>

      <label>착용횟수
        <input type="number" name="wearCount" min="0" value="${esc(item.wearCount || 0)}">
      </label>

      <label>연결 고객
        <select name="customerId">
          <option value="">없음</option>
          ${customerOptions(item.customerId)}
        </select>
      </label>

      <label class="crm-wide">메모
        <textarea name="memo" rows="4">${esc(item.memo || '')}</textarea>
      </label>
    </div>

    <button class="primary" type="submit">저장</button>
  </form>`;
}
async function saveDress(e) {
  e.preventDefault();

  const form = e.target;
  const submit = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const customer = customerById(data.get('customerId'));
  const id = data.get('id') || makeDocId('DR');
  const photoFile = form.querySelector('input[name="photoFile"]')?.files?.[0];

  submit.disabled = true;
  submit.textContent = photoFile ? '사진 업로드 중...' : '저장 중...';

  try {
    let photoUrl = data.get('photoUrl') || '';

    if (photoFile) {
      photoUrl = await uploadDressImage(photoFile, id);
    }

    const item = {
      id,
      category: data.get('category'),
      code: data.get('code').trim(),
      name: data.get('name').trim(),
      brand: data.get('brand').trim(),
      size: data.get('size').trim(),
      color: data.get('color').trim(),
      status: data.get('status'),
      wearCount: Number(data.get('wearCount') || 0),
      customerId: data.get('customerId'),
      customerName: customer.name || '',
      phone: customer.phone || '',
      photoUrl,
      memo: data.get('memo').trim(),
      updatedAt: new Date().toISOString()
    };

    await LuaDataService.saveCollectionDoc('dresses', item);
    showToast('<b>드레스 정보와 사진이 저장되었습니다.</b>');
    closeOpsModal();
  } catch (error) {
    console.error('Dress save error:', error);
    showToast(`<b>드레스 저장 실패</b><br>${esc(error.code || error.message || '알 수 없는 오류')}`, 'error');
  } finally {
    submit.disabled = false;
    submit.textContent = '저장';
  }
}

function showDressDetail(id) {
  const dress = dressesData.find((item) => item.id === id);
  if (!dress) return;

  const html = `
    <section class="dress-detail-modal">
      <div class="dress-detail-photo-wrap">
        ${
          dress.photoUrl
            ? `<img class="dress-detail-photo" src="${esc(dress.photoUrl)}" alt="${esc(dress.name || '드레스')}">`
            : `<div class="dress-detail-no-image">NO IMAGE</div>`
        }
      </div>

      <div class="dress-detail-content">
        <p class="eyebrow">${esc(dress.category || 'DRESS')}</p>
        <h2>${esc(dress.name || '드레스')}</h2>

        <div class="detail-grid dress-detail-grid">
          <div><span>품번</span><b>${esc(dress.code || '-')}</b></div>
          <div><span>브랜드</span><b>${esc(dress.brand || '-')}</b></div>
          <div><span>목록</span><b>${esc(dress.category || '-')}</b></div>
          <div><span>상태</span><b>${esc(dress.status || '-')}</b></div>
          <div><span>사이즈</span><b>${esc(dress.size || '-')}</b></div>
          <div><span>색상</span><b>${esc(dress.color || '-')}</b></div>
          <div><span>착용횟수</span><b>${Number(dress.wearCount || 0)}회</b></div>
          <div><span>연결 고객</span><b>${esc(dress.customerName || '-')}</b></div>
        </div>

        <div class="detail-memo">
          <span>메모</span>
          <p>${esc(dress.memo || '기록된 내용이 없습니다.')}</p>
        </div>

        <div class="detail-actions">
          <button type="button" class="primary" id="dressDetailEdit">드레스 수정</button>
          <button type="button" class="secondary" onclick="closeOpsModal()">닫기</button>
        </div>
      </div>
    </section>
  `;

  openOpsModal(html);

  const edit = $('dressDetailEdit');
  if (edit) {
    edit.onclick = () => openOpsModal(dressForm(dress), saveDress);
  }
}

function renderDresses() {
  const query = ($('dressSearch')?.value || '').toLowerCase();
  const status = $('dressStatusFilter')?.value || '';

  const normalized = dressesData.map((dress) => ({
    ...dress,
    category: DRESS_CATEGORIES.includes(dress.category)
      ? dress.category
      : '루아 드레스'
  }));

  const filtered = normalized.filter((dress) =>
    (!status || dress.status === status) &&
    (!query || [
      dress.code,
      dress.name,
      dress.brand,
      dress.category,
      dress.color,
      dress.customerName
    ].some((value) => String(value || '').toLowerCase().includes(query)))
  );

  $('dressCount').textContent = normalized.length;
  $('dressAvailableCount').textContent =
    normalized.filter((dress) => dress.status === '피팅 가능').length;
  $('dressBookedCount').textContent =
    normalized.filter((dress) => ['예약됨', '대여 중'].includes(dress.status)).length;
  $('dressCareCount').textContent =
    normalized.filter((dress) => ['세탁 중', '수선 중'].includes(dress.status)).length;

  $('dressList').innerHTML = DRESS_CATEGORIES.map((category) => {
    const categoryItems = filtered.filter((dress) => dress.category === category);

    return `
      <section class="dress-admin-group">
        <div class="dress-admin-group-head">
          <div>
            <p class="eyebrow">DRESS LIST</p>
            <h3>${esc(category)}</h3>
          </div>
          <span>${categoryItems.length}벌</span>
        </div>

        <div class="dress-admin-grid">
          ${
            categoryItems.length
              ? categoryItems.map((dress) => `
              <article class="dress-card dress-card-with-image dress-detail-trigger" data-id="${esc(dress.id)}">
                <div class="dress-thumb-wrap dress-thumb-large">
                  ${
                    dress.photoUrl
                      ? `<img class="dress-thumb" src="${esc(dress.photoUrl)}" alt="${esc(dress.name)}" loading="lazy">`
                      : `<div class="dress-thumb-empty">NO IMAGE</div>`
                  }
                </div>

                <div class="dress-card-body">
                  <div class="dress-card-topline">
                    <span class="status-chip">${esc(dress.status)}</span>
                    <span class="dress-category-chip">${esc(dress.category)}</span>
                  </div>

                  <h3>${esc(dress.name)}</h3>
                  <p>${esc(dress.code)} · ${esc(dress.brand || '-')}</p>

                  <dl>
                    <dt>사이즈</dt><dd>${esc(dress.size || '-')}</dd>
                    <dt>색상</dt><dd>${esc(dress.color || '-')}</dd>
                    <dt>착용횟수</dt><dd>${dress.wearCount || 0}회</dd>
                    <dt>고객</dt><dd>${esc(dress.customerName || '-')}</dd>
                  </dl>

                  <div class="dress-card-actions">
                    <button class="secondary small edit-dress" data-id="${esc(dress.id)}" onclick="event.stopPropagation()">수정</button>
                    <button class="danger-link remove-dress" data-id="${esc(dress.id)}" onclick="event.stopPropagation()">삭제</button>
                  </div>
                </div>
              </article>
            `).join('')
            : '<div class="empty dress-list-empty">등록된 드레스가 없습니다.</div>'
          }
        </div>
      </section>
    `;
  }).join('');

  document.querySelectorAll('.dress-detail-trigger').forEach((card) => {
    card.onclick = (event) => {
      if (event.target.closest('.edit-dress') || event.target.closest('.remove-dress')) return;
      showDressDetail(card.dataset.id);
    };
  });

  document.querySelectorAll('.edit-dress').forEach((button) => {
    button.onclick = () => openOpsModal(
      dressForm(dressesData.find((dress) => dress.id === button.dataset.id)),
      saveDress
    );
  });

  document.querySelectorAll('.remove-dress').forEach((button) => {
    button.onclick = async () => {
      if (confirm('드레스를 삭제할까요?')) {
        await LuaDataService.removeCollectionDoc('dresses', button.dataset.id);
      }
    };
  });
}

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
  $('scheduleBoard').innerHTML=list.map(x=>`<article class="schedule-item"><time>${esc(x.time)}</time><div><h3><button type="button" class="fitting-customer-link" data-customer-id="${esc(x.customerId||'')}" data-phone="${esc(x.phone||'')}">${esc(x.name)}</button></h3><p>${esc(x.phone)} · ${esc(x.purpose)}</p><small>${esc(x.memo||'')}</small></div><span class="status-chip">${esc(x.source)}</span></article>`).join('')||'<div class="empty">선택한 날짜의 피팅 일정이 없습니다.</div>';
}

$('newContractBtn').onclick=()=>openOpsModal(contractForm(),saveContract);
$('newPaymentBtn').onclick=()=>openOpsModal(paymentForm(),savePayment);
$('newDressBtn').onclick=()=>openOpsModal(dressForm(),saveDress);
$('newIroDressBtn')?.addEventListener('click',()=>openOpsModal(simpleAssetForm('이로스타일 드레스 추가'),(event)=>saveIroAsset(event,'iroDresses','IRD')));
$('newIroShoesBtn')?.addEventListener('click',()=>openOpsModal(simpleAssetForm('이로스타일 슈즈 추가'),(event)=>saveIroAsset(event,'iroShoes','IRS')));
$('newHanbokBtn')?.addEventListener('click',()=>openOpsModal(hanbokForm(),saveHanbok));
['contractSearch','contractStatusFilter'].forEach(id=>$(id).addEventListener('input',renderContracts));
['paymentSearch','paymentMethodFilter'].forEach(id=>$(id).addEventListener('input',renderPayments));
['dressSearch','dressStatusFilter'].forEach(id=>$(id).addEventListener('input',renderDresses));
$('scheduleDate').addEventListener('input',renderSchedule);


const IRO_STATUS = ['사용 가능','예약됨','대여 중','관리 중','보관 중'];
const HANBOK_TYPES = ['신부','신랑','혼주','기타'];

function simpleAssetForm(title, item = {}, kind = 'dress') {
  const statusOptions = IRO_STATUS.map((status) =>
    `<option ${item.status === status ? 'selected' : ''}>${status}</option>`
  ).join('');

  return `<form class="ops-form">
    <p class="eyebrow">IRO STYLE</p>
    <h2>${title}</h2>
    <input type="hidden" name="id" value="${esc(item.id || '')}">
    <div class="crm-grid">
      <label>제품명<input name="name" value="${esc(item.name || '')}" required></label>
      <label>제품번호<input name="code" value="${esc(item.code || '')}"></label>
      <label>상태<select name="status">${statusOptions}</select></label>
      <label>연결 고객
        <select name="customerId">
          <option value="">없음</option>
          ${customerOptions(item.customerId)}
        </select>
      </label>
      <label class="crm-wide">메모<textarea name="memo" rows="5">${esc(item.memo || '')}</textarea></label>
    </div>
    <button class="primary" type="submit">저장</button>
  </form>`;
}

async function saveIroAsset(event, collection, prefix) {
  event.preventDefault();
  const data = new FormData(event.target);
  const customer = customerById(data.get('customerId'));

  const item = {
    id: data.get('id') || makeDocId(prefix),
    name: data.get('name').trim(),
    code: data.get('code').trim(),
    status: data.get('status'),
    customerId: data.get('customerId'),
    customerName: customer.name || '',
    phone: customer.phone || '',
    memo: data.get('memo').trim(),
    updatedAt: new Date().toISOString()
  };

  await LuaDataService.saveCollectionDoc(collection, item);
  showToast('<b>이로스타일 정보가 저장되었습니다.</b>');
  closeOpsModal();
}

function renderIroList(containerId, data, collection, prefix, label) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = data.map((item) => `
    <article class="mini-asset-card">
      <div>
        <span class="status-chip">${esc(item.status || '-')}</span>
        <h3>${esc(item.name || '-')}</h3>
        <p>${esc(item.code || '')}</p>
        <small>${esc(item.customerName || '연결 고객 없음')}</small>
      </div>
      <div class="mini-asset-actions">
        <button class="secondary small iro-edit" data-id="${esc(item.id)}">수정</button>
        <button class="danger-link iro-remove" data-id="${esc(item.id)}">삭제</button>
      </div>
    </article>
  `).join('') || '<div class="empty">등록된 항목이 없습니다.</div>';

  container.querySelectorAll('.iro-edit').forEach((button) => {
    button.onclick = () => {
      const item = data.find((row) => row.id === button.dataset.id);
      openOpsModal(
        simpleAssetForm(`${label} 정보`, item),
        (event) => saveIroAsset(event, collection, prefix)
      );
    };
  });

  container.querySelectorAll('.iro-remove').forEach((button) => {
    button.onclick = async () => {
      if (confirm('이 항목을 삭제할까요?')) {
        await LuaDataService.removeCollectionDoc(collection, button.dataset.id);
      }
    };
  });
}

function renderIroStyle() {
  renderIroList('iroDressList', iroDressesData, 'iroDresses', 'IRD', '이로스타일 드레스');
  renderIroList('iroShoesList', iroShoesData, 'iroShoes', 'IRS', '이로스타일 슈즈');
}

function hanbokForm(item = {}) {
  return `<form class="ops-form">
    <p class="eyebrow">BOMNAL HANBOK</p>
    <h2>봄날한복 정보</h2>
    <input type="hidden" name="id" value="${esc(item.id || '')}">
    <div class="crm-grid">
      <label>제품명<input name="name" value="${esc(item.name || '')}" required></label>
      <label>제품번호<input name="code" value="${esc(item.code || '')}"></label>
      <label>구분
        <select name="type">
          ${HANBOK_TYPES.map((type) => `<option ${item.type === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
      </label>
      <label>상태
        <select name="status">
          ${IRO_STATUS.map((status) => `<option ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </label>
      <label>연결 고객
        <select name="customerId">
          <option value="">없음</option>
          ${customerOptions(item.customerId)}
        </select>
      </label>
      <label class="crm-wide">메모<textarea name="memo" rows="5">${esc(item.memo || '')}</textarea></label>
    </div>
    <button class="primary" type="submit">저장</button>
  </form>`;
}

async function saveHanbok(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const customer = customerById(data.get('customerId'));

  const item = {
    id: data.get('id') || makeDocId('HB'),
    name: data.get('name').trim(),
    code: data.get('code').trim(),
    type: data.get('type'),
    status: data.get('status'),
    customerId: data.get('customerId'),
    customerName: customer.name || '',
    phone: customer.phone || '',
    memo: data.get('memo').trim(),
    updatedAt: new Date().toISOString()
  };

  await LuaDataService.saveCollectionDoc('hanbok', item);
  showToast('<b>봄날한복 정보가 저장되었습니다.</b>');
  closeOpsModal();
}

function renderHanbok() {
  const container = $('hanbokList');
  if (!container) return;

  container.innerHTML = hanbokData.map((item) => `
    <article class="mini-asset-card">
      <div>
        <span class="status-chip">${esc(item.status || '-')}</span>
        <h3>${esc(item.name || '-')}</h3>
        <p>${esc(item.type || '-')} · ${esc(item.code || '')}</p>
        <small>${esc(item.customerName || '연결 고객 없음')}</small>
      </div>
      <div class="mini-asset-actions">
        <button class="secondary small hanbok-edit" data-id="${esc(item.id)}">수정</button>
        <button class="danger-link hanbok-remove" data-id="${esc(item.id)}">삭제</button>
      </div>
    </article>
  `).join('') || '<div class="empty">등록된 한복이 없습니다.</div>';

  container.querySelectorAll('.hanbok-edit').forEach((button) => {
    button.onclick = () => openOpsModal(
      hanbokForm(hanbokData.find((item) => item.id === button.dataset.id)),
      saveHanbok
    );
  });

  container.querySelectorAll('.hanbok-remove').forEach((button) => {
    button.onclick = async () => {
      if (confirm('이 한복 정보를 삭제할까요?')) {
        await LuaDataService.removeCollectionDoc('hanbok', button.dataset.id);
      }
    };
  });
}



function openCustomerFromFitting(customerId, phone) {
  const resolvedId = customerId || customerIdFromPhone(phone || '');
  const customersTab = document.querySelector('[data-tab="customers"]');

  if (customersTab) customersTab.click();

  // 고객 목록이 즉시 렌더링되도록 보장한 뒤 해당 고객을 선택한다.
  renderCustomers();
  selectCustomer(resolvedId);

  requestAnimationFrame(() => {
    const selectedCard = document.querySelector(`.customer-card[data-id="${CSS.escape(resolvedId)}"]`);
    if (selectedCard) selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const detail = $('customerDetail');
    if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function bindFittingCustomerLinks() {
  document.querySelectorAll('.fitting-customer-link').forEach((button) => {
    button.addEventListener('click', () => {
      openCustomerFromFitting(button.dataset.customerId || '', button.dataset.phone || '');
    });
  });
}
