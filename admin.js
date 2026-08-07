
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
let unsubscribeIroDresses = null;
let unsubscribeIroShoes = null;
let unsubscribeHanbok = null;
let iroDressesData = [];
let iroShoesData = [];
let hanbokData = [];
let accessoriesData = [];
let unsubscribeAccessories = null;
let unsubscribeCustomers = null;
let contractsData = [];
let paymentsData = [];
let dressesData = [];
const DRESS_CATEGORIES = ['아이테오 드레스', '루아 드레스'];
let unsubscribeContracts = null;
let unsubscribePayments = null;
let unsubscribeDresses = null;
  unsubscribeAccessories = null;
  unsubscribeIroDresses = null;
  unsubscribeIroShoes = null;
  unsubscribeHanbok = null;
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
  if (!unsubscribeAccessories) unsubscribeAccessories = LuaDataService.subscribeCollection('accessories', (data) => { accessoriesData = data; renderAccessories(); }, showError);
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
  if (unsubscribeAccessories) unsubscribeAccessories();
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
    if (button.dataset.tab === 'accessories' && typeof renderAccessories === 'function') renderAccessories();
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


function dressById(id) {
  return dressesData.find((dress) => dress.id === id) || null;
}

function dressOptionLabel(dress) {
  return [dress.category, dress.name, dress.code].filter(Boolean).join(' · ');
}

function dressSelectOptions(selectedId = '', allowEmpty = true) {
  const groups = DRESS_CATEGORIES.map((category) => {
    const items = dressesData.filter((dress) => (dress.category || '루아 드레스') === category);
    if (!items.length) return '';
    return `<optgroup label="${esc(category)}">${
      items.map((dress) =>
        `<option value="${esc(dress.id)}" ${selectedId === dress.id ? 'selected' : ''}>${esc(dressOptionLabel(dress))}</option>`
      ).join('')
    }</optgroup>`;
  }).join('');

  return `${allowEmpty ? '<option value="">선택 안함</option>' : ''}${groups}`;
}

function accessoryById(id) {
  return accessoriesData.find((item) => item.id === id) || null;
}

function accessoryOptions(category, selectedId = '') {
  const items = accessoriesData.filter((item) => item.category === category);
  return '<option value="">선택 안함</option>' + items.map((item) =>
    `<option value="${esc(item.id)}" ${selectedId === item.id ? 'selected' : ''}>${esc(item.name || '-')}${item.code ? ` · ${esc(item.code)}` : ''}</option>`
  ).join('');
}

function accessoryPreviewHtml(id, category) {
  const item = accessoryById(id);
  if (!item) return `<div class="empty">${category}가 선택되지 않았습니다.</div>`;

  return `
    <div class="customer-accessory-preview">
      ${item.photoUrl ? `<img src="${esc(item.photoUrl)}" alt="${esc(item.name || category)}">` : '<div class="customer-accessory-no-image">NO IMAGE</div>'}
      <div>
        <span class="status-chip">${esc(category)}</span>
        <h4>${esc(item.name || '-')}</h4>
        <p>${esc(item.code || '')}${item.color ? ` · ${esc(item.color)}` : ''}</p>
      </div>
    </div>
  `;
}

function updateCustomerAccessoryPreview(type) {
  const form = $('customerForm');
  if (!form) return;
  const field = type === '티아라' ? 'tiaraAccessoryId' : 'veilAccessoryId';
  const previewId = type === '티아라' ? 'customerTiaraPreview' : 'customerVeilPreview';
  const id = form.querySelector(`[name="${field}"]`)?.value || '';
  const preview = $(previewId);
  if (preview) preview.innerHTML = accessoryPreviewHtml(id, type);
}

function fittingDressIdsForCustomer(customer) {
  const ids = Array.isArray(customer.fittingDressIds) ? customer.fittingDressIds.slice(0, 6) : [];
  while (ids.length < 6) ids.push('');
  return ids;
}

function renderCustomerDressPreview(customer) {
  const selected = dressById(customer.selectedDressId || '');
  if (!selected) {
    return `<div class="customer-selected-dress empty">선택한 드레스가 없습니다.</div>`;
  }

  return `
    <div class="customer-selected-dress">
      ${
        selected.photoUrl
          ? `<img src="${esc(selected.photoUrl)}" alt="${esc(selected.name || '선택 드레스')}">`
          : `<div class="customer-dress-no-image">NO IMAGE</div>`
      }
      <div>
        <span class="status-chip">${esc(selected.category || '드레스')}</span>
        <h4>${esc(selected.name || '-')}</h4>
        <p>${esc(selected.code || '')}${selected.color ? ` · ${esc(selected.color)}` : ''}</p>
      </div>
    </div>
  `;
}

function updateCustomerDressPicker() {
  const form = $('customerForm');
  if (!form) return;

  const selectedDressId = form.querySelector('[name="selectedDressId"]')?.value || '';
  const preview = $('customerSelectedDressPreview');
  const selected = dressById(selectedDressId);

  if (preview) {
    preview.innerHTML = selected
      ? `${selected.photoUrl ? `<img src="${esc(selected.photoUrl)}" alt="${esc(selected.name || '')}">` : '<div class="customer-dress-no-image">NO IMAGE</div>'}
         <div><span class="status-chip">${esc(selected.category || '')}</span><h4>${esc(selected.name || '')}</h4><p>${esc(selected.code || '')}</p></div>`
      : '<div class="empty">선택한 드레스가 없습니다.</div>';
  }
}

function syncSelectedDressFromFittingList(selectElement) {
  const form = $('customerForm');
  if (!form) return;
  const select = form.querySelector('[name="selectedDressId"]');
  if (select && selectElement?.value) {
    select.value = selectElement.value;
    updateCustomerDressPicker();
  }
}

function showCustomerDetail(customer) {
  if (!customer) {
    $('customerDetail').innerHTML = '<div class="empty">고객을 찾을 수 없습니다.</div>';
    return;
  }

  const reservations = [...customer.reservations].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );
  const fittingIds = fittingDressIdsForCustomer(customer);

  $('customerDetail').innerHTML = `
    <form id="customerForm" class="crm-form">
      <input type="hidden" name="id" value="${esc(customer.id)}">

      <div class="crm-head">
        <div>
          <p class="eyebrow">CUSTOMER PROFILE</p>
          <h2>${esc(customer.name || '고객')}</h2>
          <span class="phone-text">${esc(customer.phone || '-')}</span>
        </div>
        <span class="crm-stage">${esc(customer.stage || '신규')}</span>
      </div>

      <div class="crm-grid">
        <label>고객명<input name="name" value="${esc(customer.name || '')}" required></label>
        <label>연락처<input name="phone" value="${esc(customer.phone || '')}" required></label>

        <label>관리 단계
          <select name="stage">
            ${['신규','상담중','피팅중','계약완료','보류'].map((stage) =>
              `<option ${customer.stage === stage ? 'selected' : ''}>${stage}</option>`
            ).join('')}
          </select>
        </label>

        <label>예식일<input name="weddingDate" type="date" value="${esc(customer.weddingDate || '')}"></label>
        <label>피팅 날짜<input name="fittingDate" type="date" value="${esc(customer.fittingDate || '')}"></label>
        <label>피팅 시간<input name="fittingTime" type="time" value="${esc(customer.fittingTime || '')}"></label>

        <label>피팅 구분
          <select name="fittingPurpose">
            ${['1차 피팅','2차 피팅'].map((purpose) =>
              `<option ${customer.fittingPurpose === purpose ? 'selected' : ''}>${purpose}</option>`
            ).join('')}
          </select>
        </label>

        <label>예식장<input name="venue" value="${esc(customer.venue || '')}"></label>
        <label>예산<input name="budget" value="${esc(customer.budget || '')}"></label>

        <label>손님구분
          <select name="customerType">
            <option value="">선택</option>
            ${['다이렉트','자체','기타'].map((type) =>
              `<option ${customer.customerType === type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </label>

        <label class="crm-wide">관심 스타일<input name="style" value="${esc(customer.style || '')}"></label>
      </div>

      <section class="customer-dress-picker">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">FITTING DRESSES</p>
            <h3>피팅한 드레스</h3>
          </div>
          <small>각 항목은 드레스관리 등록 목록에서 선택합니다.</small>
        </div>

        <div class="fitting-dress-select-grid">
          ${fittingIds.map((id, index) => `
            <label>피팅 드레스 ${index + 1}
              <select name="fittingDress${index + 1}" onchange="syncSelectedDressFromFittingList(this)">
                ${dressSelectOptions(id)}
              </select>
              <div class="customer-fitting-dress-preview">
                ${
                  dressById(id)?.photoUrl
                    ? `<img src="${esc(dressById(id).photoUrl)}" alt="${esc(dressById(id).name || '')}">`
                    : '<span>사진 없음</span>'
                }
              </div>
            </label>
          `).join('')}
        </div>

        <label class="selected-dress-select">최종 선택 드레스
          <select name="selectedDressId" onchange="updateCustomerDressPicker()">
            ${dressSelectOptions(customer.selectedDressId || '')}
          </select>
        </label>

        <div id="customerSelectedDressPreview" class="customer-selected-dress-1200">
          ${renderCustomerDressPreview(customer)}
        </div>
      </section>

      <div class="crm-grid">
        <label class="crm-wide">티아라 종류 및 제품명
          <select name="tiaraAccessoryId" onchange="updateCustomerAccessoryPreview('티아라')">
            ${accessoryOptions('티아라', customer.tiaraAccessoryId || '')}
          </select>
        </label>
        <div id="customerTiaraPreview" class="crm-wide customer-accessory-preview-wrap">
          ${accessoryPreviewHtml(customer.tiaraAccessoryId || '', '티아라')}
        </div>
        <label class="crm-wide">선택한 베일
          <select name="veilAccessoryId" onchange="updateCustomerAccessoryPreview('베일')">
            ${accessoryOptions('베일', customer.veilAccessoryId || '')}
          </select>
        </label>
        <div id="customerVeilPreview" class="crm-wide customer-accessory-preview-wrap">
          ${accessoryPreviewHtml(customer.veilAccessoryId || '', '베일')}
        </div>
        <label class="crm-wide">상담 메모<textarea name="memo" rows="6">${esc(customer.memo || '')}</textarea></label>
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

  const fittingDressIds = [1,2,3,4,5,6]
    .map((number) => data.get(`fittingDress${number}`) || '')
    .filter((id, index, arr) => id && arr.indexOf(id) === index);

  const selectedDressId = data.get('selectedDressId') || '';
  const selectedDress = dressById(selectedDressId);

  const customer = {
    id: data.get('id') || customerIdFromPhone(phone),
    name: data.get('name').trim(),
    phone,
    weddingDate: data.get('weddingDate') || '',
    fittingDate: data.get('fittingDate') || '',
    fittingTime: data.get('fittingTime') || '',
    fittingPurpose: data.get('fittingPurpose') || '1차 피팅',
    stage: data.get('stage') || '신규',
    venue: data.get('venue').trim(),
    budget: data.get('budget').trim(),
    style: data.get('style').trim(),
    customerType: data.get('customerType') || '',
    fittingDressIds,
    selectedDressId,
    selectedDress: selectedDress?.name || '',
    selectedDressPhotoUrl: selectedDress?.photoUrl || '',
    tiaraAccessoryId: data.get('tiaraAccessoryId') || '',
    tiara: accessoryById(data.get('tiaraAccessoryId') || '')?.name || '',
    veilAccessoryId: data.get('veilAccessoryId') || '',
    veil: accessoryById(data.get('veilAccessoryId') || '')?.name || '',
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

    if (index >= 0) savedCustomers[index] = { ...savedCustomers[index], ...saved };
    else savedCustomers.unshift(saved);

    selectedCustomerId = customer.id;
    renderCustomers();
    showCustomerDetail(mergedCustomers().find((item) => item.id === customer.id));

    showToast(
      '<b>고객정보가 수정되었습니다.</b><small>드레스 피팅/선택 정보도 함께 저장되었습니다.</small>',
      'success'
    );
  } catch (error) {
    console.error('Customer save error:', error);

    const code = error?.code || 'unknown';
    let message = error?.message || '알 수 없는 오류';
    if (code === 'permission-denied') message = 'Firestore 보안 규칙에서 고객정보 수정 권한이 차단되었습니다.';
    if (code === 'auth/session-expired') message = '관리자 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.';

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
function openCustomerById(customerId, phone = '') {
  const id = customerId || customerIdFromPhone(phone);
  document.querySelector('[data-tab="customers"]')?.click();
  if (id) {
    selectedCustomerId = id;
    renderCustomers();
    showCustomerDetail(mergedCustomers().find((item) => item.id === id));
  }
  setTimeout(() => $('customerDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function bindOperationCustomerLinks() {
  document.querySelectorAll('.ops-customer-link').forEach((button) => {
    button.onclick = () => openCustomerById(button.dataset.customerId || '', button.dataset.phone || '');
  });
}

function renderContracts(){
  const q=($('contractSearch')?.value||'').toLowerCase();
  const st=$('contractStatusFilter')?.value||'';
  const list=contractsData.filter(x=>(!st||x.status===st)&&(!q||[x.customerName,x.phone,x.id,x.packageName].some(v=>String(v||'').toLowerCase().includes(q))));
  $('contractList').innerHTML=list.map(x=>`<article class="ops-card"><div><span class="status-chip">${esc(x.status)}</span><h3><button type="button" class="ops-customer-link" data-customer-id="${esc(x.customerId||'')}" data-phone="${esc(x.phone||'')}">${esc(x.customerName||'고객')}</button></h3><p>${esc(x.phone||'')} · ${esc(x.contractDate||'-')}</p><p>${esc(x.packageName||'상품 미입력')}</p></div><div class="ops-card-side"><b>${money(x.totalAmount)}</b><button class="secondary small edit-contract" data-id="${esc(x.id)}">수정</button><button class="danger-link remove-contract" data-id="${esc(x.id)}">삭제</button></div></article>`).join('')||'<div class="empty">계약이 없습니다.</div>';
  bindOperationCustomerLinks();
  document.querySelectorAll('.edit-contract').forEach(b=>b.onclick=()=>openOpsModal(contractForm(contractsData.find(x=>x.id===b.dataset.id)),saveContract));
  document.querySelectorAll('.remove-contract').forEach(b=>b.onclick=async()=>{if(confirm('계약을 삭제할까요?'))await LuaDataService.removeCollectionDoc('contracts',b.dataset.id)});
}

function paymentForm(item={}){return `<form class="ops-form"><p class="eyebrow">PAYMENT</p><h2>결제 기록</h2><input type="hidden" name="id" value="${esc(item.id||'')}"><div class="crm-grid"><label>고객<select name="customerId" required><option value="">선택</option>${customerOptions(item.customerId)}</select></label><label>결제 구분<select name="type">${['계약금','중도금','잔금','환불','기타'].map(x=>`<option ${item.type===x?'selected':''}>${x}</option>`).join('')}</select></label><label>결제일<input type="date" name="paidDate" value="${esc(item.paidDate||new Date().toISOString().slice(0,10))}"></label><label>금액<input type="number" name="amount" min="0" value="${esc(item.amount||'')}"></label><label>결제수단<select name="method">${['카드','계좌이체','현금','기타'].map(x=>`<option ${item.method===x?'selected':''}>${x}</option>`).join('')}</select></label><label>관련 계약<select name="contractId"><option value="">선택 안 함</option>${contractsData.map(c=>`<option value="${esc(c.id)}" ${item.contractId===c.id?'selected':''}>${esc(c.customerName)} · ${esc(c.id)}</option>`).join('')}</select></label><label class="crm-wide">메모<textarea name="memo" rows="4">${esc(item.memo||'')}</textarea></label></div><button class="primary" type="submit">저장</button></form>`;}
async function savePayment(e){e.preventDefault();const d=new FormData(e.target);const customer=customerById(d.get('customerId'));const item={id:d.get('id')||makeDocId('PM'),customerId:d.get('customerId'),customerName:customer.name||'',phone:customer.phone||'',type:d.get('type'),paidDate:d.get('paidDate'),amount:Number(d.get('amount')||0),method:d.get('method'),contractId:d.get('contractId'),memo:d.get('memo').trim(),updatedAt:new Date().toISOString()};await LuaDataService.saveCollectionDoc('payments',item);showToast('<b>결제정보가 저장되었습니다.</b>');closeOpsModal();}
function renderPayments(){
  const q=($('paymentSearch')?.value||'').toLowerCase();
  const method=$('paymentMethodFilter')?.value||'';
  const list=paymentsData.filter(x=>(!method||x.method===method)&&(!q||[x.customerName,x.phone,x.memo].some(v=>String(v||'').toLowerCase().includes(q))));
  const totalAmount=contractsData.filter(x=>x.status!=='해지').reduce((s,x)=>s+Number(x.totalAmount||0),0);
  const depositAmount=paymentsData.filter(x=>x.type==='계약금').reduce((s,x)=>s+Number(x.amount||0),0);
  const totalPaid=paymentsData.reduce((s,x)=>s+(x.type==='환불'?-Number(x.amount||0):Number(x.amount||0)),0);
  const remaining=Math.max(totalAmount-totalPaid,0);
  $('paymentTotal').textContent=money(totalAmount);
  $('paidTotal').textContent=money(depositAmount);
  $('balanceTotal').textContent=money(remaining);
  const paidByCustomer={};
  paymentsData.forEach(x=>paidByCustomer[x.customerId]=(paidByCustomer[x.customerId]||0)+(x.type==='환불'?-Number(x.amount||0):Number(x.amount||0)));
  $('unpaidCount').textContent=contractsData.filter(c=>c.status!=='해지'&&Number(c.totalAmount||0)>(paidByCustomer[c.customerId]||0)).length;
  $('paymentList').innerHTML=list.map(x=>`<article class="ops-card"><div><span class="status-chip">${esc(x.type)}</span><h3><button type="button" class="ops-customer-link" data-customer-id="${esc(x.customerId||'')}" data-phone="${esc(x.phone||'')}">${esc(x.customerName||'고객')}</button></h3><p>${esc(x.phone||'')} · ${esc(x.paidDate)} · ${esc(x.method)}</p><p>${esc(x.memo||'')}</p></div><div class="ops-card-side"><b>${money(x.amount)}</b><button class="secondary small edit-payment" data-id="${esc(x.id)}">수정</button><button class="danger-link remove-payment" data-id="${esc(x.id)}">삭제</button></div></article>`).join('')||'<div class="empty">결제 기록이 없습니다.</div>';
  bindOperationCustomerLinks();
  document.querySelectorAll('.edit-payment').forEach(b=>b.onclick=()=>openOpsModal(paymentForm(paymentsData.find(x=>x.id===b.dataset.id)),savePayment));
  document.querySelectorAll('.remove-payment').forEach(b=>b.onclick=async()=>{if(confirm('결제 기록을 삭제할까요?'))await LuaDataService.removeCollectionDoc('payments',b.dataset.id)});
}


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


async function uploadManagedImage(file, folder, itemId) {
  if (!file) return '';

  if (!file.type.startsWith('image/')) {
    const error = new Error('이미지 파일만 업로드할 수 있습니다.');
    error.code = 'invalid-image';
    throw error;
  }

  if (file.size > 8 * 1024 * 1024) {
    const error = new Error('사진은 8MB 이하로 선택해 주세요.');
    error.code = 'image-too-large';
    throw error;
  }

  const storage = await ensureFirebaseStorage();
  const safeFolder = String(folder || 'assets').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${safeFolder}/${itemId}/${Date.now()}-${safeName}`;
  const ref = storage.ref().child(path);

  const snapshot = await ref.put(file, {
    contentType: file.type,
    customMetadata: { itemId, folder: safeFolder }
  });

  return snapshot.ref.getDownloadURL();
}

function genericImagePreview(input, previewId, placeholderId) {
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const file = input.files?.[0];
  if (!preview || !file) return;

  if (!file.type.startsWith('image/')) {
    input.value = '';
    showToast('<b>이미지 파일만 선택할 수 있습니다.</b>', 'error');
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    input.value = '';
    showToast('<b>사진은 8MB 이하로 선택해 주세요.</b>', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.hidden = false;
    if (placeholder) placeholder.hidden = true;
  };
  reader.readAsDataURL(file);
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

function buildFittingScheduleItems(month) {
  const reservationItems = allData
    .filter((item) => item.status !== '취소' && String(item.date || '').startsWith(month))
    .map((item) => ({
      key: `reservation-${item.id}`,
      date: item.date || '',
      time: item.time || '',
      name: item.name || '',
      phone: item.phone || '',
      purpose: item.purpose || '예약',
      memo: item.memo || '',
      status: item.status || '신청',
      source: '예약',
      reservationId: item.id || '',
      customerId: customerIdFromPhone(item.phone)
    }));

  const existingKeys = new Set(
    reservationItems.map((item) => `${item.customerId}-${item.date}-${item.time}`)
  );

  const customerItems = mergedCustomers()
    .filter((customer) =>
      customer.fittingDate &&
      customer.fittingTime &&
      String(customer.fittingDate).startsWith(month)
    )
    .map((customer) => {
      const fittingDresses = fittingDressIdsForCustomer(customer)
        .map(dressById)
        .filter(Boolean);

      return {
        key: `customer-${customer.id}-${customer.fittingDate}-${customer.fittingTime}`,
        date: customer.fittingDate,
        time: customer.fittingTime,
        name: customer.name || '',
        phone: customer.phone || '',
        purpose: customer.fittingPurpose || '드레스 피팅',
        memo: fittingDresses.map((dress) => dress.name).join(', '),
        status: '고객관리',
        source: '고객관리',
        customerId: customer.id,
        fittingDressIds: fittingDresses.map((dress) => dress.id),
        selectedDressId: customer.selectedDressId || ''
      };
    })
    .filter((item) => !existingKeys.has(`${item.customerId}-${item.date}-${item.time}`));

  return [...reservationItems, ...customerItems].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
}

function showFittingScheduleDetail(key) {
  const month = $('scheduleMonth')?.value || new Date().toISOString().slice(0, 7);
  const item = buildFittingScheduleItems(month).find((row) => row.key === key);
  if (!item) return;

  const customer = mergedCustomers().find((row) => row.id === item.customerId);
  const dressIds = item.fittingDressIds?.length
    ? item.fittingDressIds
    : fittingDressIdsForCustomer(customer || {});
  const dresses = dressIds.map(dressById).filter(Boolean);

  const html = `
    <section class="schedule-detail-modal">
      <p class="eyebrow">FITTING DETAIL</p>
      <h2>${esc(item.name || '고객')} 피팅일정</h2>

      <div class="detail-grid">
        <div><span>날짜</span><b>${esc(item.date || '-')}</b></div>
        <div><span>시간</span><b>${esc(item.time || '-')}</b></div>
        <div><span>고객</span><b>${esc(item.name || '-')}</b></div>
        <div><span>연락처</span><b class="phone-text">${esc(item.phone || '-')}</b></div>
        <div><span>구분</span><b>${esc(item.purpose || '-')}</b></div>
        <div><span>등록 출처</span><b>${esc(item.source || '-')}</b></div>
      </div>

      <div class="schedule-detail-dresses">
        <h3>피팅 드레스</h3>
        <div class="schedule-dress-grid">
          ${
            dresses.length
              ? dresses.map((dress) => `
                  <button type="button" class="schedule-dress-card" data-dress-id="${esc(dress.id)}">
                    ${dress.photoUrl ? `<img src="${esc(dress.photoUrl)}" alt="${esc(dress.name || '')}">` : '<span class="no-image">NO IMAGE</span>'}
                    <b>${esc(dress.name || '-')}</b>
                    <small>${esc(dress.code || '')}</small>
                  </button>
                `).join('')
              : '<div class="empty">등록된 피팅 드레스가 없습니다.</div>'
          }
        </div>
      </div>

      <div class="detail-memo">
        <span>메모</span>
        <p>${esc(item.memo || '기록된 내용이 없습니다.')}</p>
      </div>

      <div class="detail-actions">
        <button type="button" class="primary" id="scheduleCustomerOpen">고객관리 열기</button>
        <button type="button" class="secondary" onclick="closeOpsModal()">닫기</button>
      </div>
    </section>
  `;

  openOpsModal(html);

  $('scheduleCustomerOpen')?.addEventListener('click', () => {
    closeOpsModal();
    openCustomerByPhone(item.phone || '');
  });

  document.querySelectorAll('.schedule-dress-card').forEach((card) => {
    card.onclick = () => showDressDetail(card.dataset.dressId);
  });
}

function renderSchedule() {
  const monthInput = $('scheduleMonth');
  if (!monthInput) return;

  const month = monthInput.value || new Date().toISOString().slice(0, 7);
  monthInput.value = month;

  const items = buildFittingScheduleItems(month);
  const groups = new Map();

  items.forEach((item) => {
    if (!groups.has(item.date)) groups.set(item.date, []);
    groups.get(item.date).push(item);
  });

  $('scheduleBoard').innerHTML = groups.size
    ? [...groups.entries()].map(([date, dayItems]) => `
        <section class="schedule-day-group">
          <div class="schedule-day-heading">
            <h3>${esc(date)}</h3>
            <span>${dayItems.length}건</span>
          </div>

          <div class="schedule-day-items">
            ${dayItems.map((item) => `
              <button type="button" class="schedule-month-item" data-key="${esc(item.key)}">
                <time>${esc(item.time)}</time>
                <div>
                  <b>${esc(item.name)}</b>
                  <span>${esc(item.purpose)}</span>
                  <small>${esc(item.memo || '')}</small>
                </div>
                <span class="status-chip">${esc(item.source)}</span>
              </button>
            `).join('')}
          </div>
        </section>
      `).join('')
    : '<div class="empty">선택한 월의 피팅 일정이 없습니다.</div>';

  document.querySelectorAll('.schedule-month-item').forEach((button) => {
    button.onclick = () => showFittingScheduleDetail(button.dataset.key);
  });
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
$('scheduleMonth')?.addEventListener('input', renderSchedule);



const IRO_STATUS = ['사용 가능','예약됨','대여 중','관리 중','보관 중'];
const HANBOK_TYPES = ['신부','신랑','혼주','기타'];
const ACCESSORY_TYPES = ['베일','티아라','기타'];

function managedAssetForm(title, item = {}, options = {}) {
  const {
    eyebrow = 'MANAGED ITEM',
    typeField = '',
    typeOptions = [],
    folder = 'managed',
    extraFields = ''
  } = options;

  const currentImage = item.photoUrl || '';
  const previewId = `assetPreview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const placeholderId = `${previewId}-placeholder`;

  return `<form class="ops-form managed-asset-form" data-folder="${esc(folder)}">
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h2>${title}</h2>

    <input type="hidden" name="id" value="${esc(item.id || '')}">
    <input type="hidden" name="photoUrl" value="${esc(currentImage)}">

    <div class="managed-image-editor">
      <div class="managed-image-preview-wrap">
        <img id="${previewId}" class="managed-image-preview" src="${esc(currentImage)}" alt="제품 사진" ${currentImage ? '' : 'hidden'}>
        <div id="${placeholderId}" class="managed-image-placeholder" ${currentImage ? 'hidden' : ''}>사진</div>
      </div>

      <label class="dress-file-label">사진 선택
        <input
          type="file"
          name="photoFile"
          accept="image/jpeg,image/png,image/webp"
          onchange="genericImagePreview(this,'${previewId}','${placeholderId}')">
        <small>JPG·PNG·WEBP, 최대 8MB</small>
      </label>
    </div>

    <div class="crm-grid">
      <label>제품명<input name="name" value="${esc(item.name || '')}" required></label>
      <label>제품번호<input name="code" value="${esc(item.code || '')}"></label>

      ${
        typeField
          ? `<label>구분
              <select name="${esc(typeField)}">
                ${typeOptions.map((type) => `<option ${item[typeField] === type ? 'selected' : ''}>${type}</option>`).join('')}
              </select>
            </label>`
          : ''
      }

      <label>상태
        <select name="status">
          ${IRO_STATUS.map((status) => `<option ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </label>

      ${extraFields}

      <label>연결 고객
        <select name="customerId">
          <option value="">없음</option>
          ${customerOptions(item.customerId)}
        </select>
      </label>

      <label class="crm-wide">세부내용<textarea name="memo" rows="5">${esc(item.memo || '')}</textarea></label>
    </div>

    <button class="primary" type="submit">저장</button>
  </form>`;
}

async function saveManagedAsset(event, collection, prefix, folder, extraBuilder = () => ({})) {
  event.preventDefault();

  const form = event.target;
  const data = new FormData(form);
  const id = data.get('id') || makeDocId(prefix);
  const customer = customerById(data.get('customerId'));
  const file = form.querySelector('[name="photoFile"]')?.files?.[0];
  const button = form.querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = file ? '사진 업로드 중...' : '저장 중...';

  try {
    let photoUrl = data.get('photoUrl') || '';
    if (file) photoUrl = await uploadManagedImage(file, folder, id);

    const item = {
      id,
      name: data.get('name').trim(),
      code: data.get('code').trim(),
      status: data.get('status'),
      customerId: data.get('customerId'),
      customerName: customer.name || '',
      phone: customer.phone || '',
      photoUrl,
      memo: data.get('memo').trim(),
      ...extraBuilder(data),
      updatedAt: new Date().toISOString()
    };

    await LuaDataService.saveCollectionDoc(collection, item);
    showToast('<b>정보가 저장되었습니다.</b>');
    closeOpsModal();
  } catch (error) {
    console.error('Managed asset save error:', error);
    showToast(`<b>저장에 실패했습니다.</b><small>${esc(error.code || error.message || '알 수 없는 오류')}</small>`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = '저장';
  }
}

function showManagedAssetDetail(item, title, editHandler) {
  if (!item) return;

  const html = `
    <section class="managed-detail-modal">
      <div class="managed-detail-photo-wrap">
        ${
          item.photoUrl
            ? `<img src="${esc(item.photoUrl)}" alt="${esc(item.name || '')}" class="managed-detail-photo">`
            : '<div class="managed-detail-no-image">NO IMAGE</div>'
        }
      </div>

      <div class="managed-detail-content">
        <p class="eyebrow">${esc(title)}</p>
        <h2>${esc(item.name || '-')}</h2>

        <div class="detail-grid">
          <div><span>제품번호</span><b>${esc(item.code || '-')}</b></div>
          <div><span>상태</span><b>${esc(item.status || '-')}</b></div>
          ${item.type ? `<div><span>구분</span><b>${esc(item.type)}</b></div>` : ''}
          ${item.category ? `<div><span>분류</span><b>${esc(item.category)}</b></div>` : ''}
          ${item.color ? `<div><span>색상</span><b>${esc(item.color)}</b></div>` : ''}
          ${item.size ? `<div><span>사이즈</span><b>${esc(item.size)}</b></div>` : ''}
          ${item.heelHeight ? `<div><span>굽높이</span><b>${esc(item.heelHeight)}</b></div>` : ''}
          ${Number(item.rentalFee || 0) ? `<div><span>대여료</span><b>${Number(item.rentalFee || 0).toLocaleString()}원</b></div>` : ''}
          ${Number(item.deposit || 0) ? `<div><span>보증금</span><b>${Number(item.deposit || 0).toLocaleString()}원</b></div>` : ''}
          ${item.rentalDate ? `<div><span>대여일</span><b>${esc(item.rentalDate)}</b></div>` : ''}
          ${item.returnDate ? `<div><span>반납일</span><b>${esc(item.returnDate)}</b></div>` : ''}
          ${item.material ? `<div><span>소재/특징</span><b>${esc(item.material)}</b></div>` : ''}
          <div><span>연결 고객</span><b>${esc(item.customerName || '-')}</b></div>
        </div>

        <div class="detail-memo">
          <span>세부내용</span>
          <p>${esc(item.memo || '기록된 내용이 없습니다.')}</p>
        </div>

        <div class="detail-actions">
          <button type="button" class="primary" id="managedEditButton">수정</button>
          <button type="button" class="secondary" onclick="closeOpsModal()">닫기</button>
        </div>
      </div>
    </section>
  `;

  openOpsModal(html);
  $('managedEditButton')?.addEventListener('click', editHandler);
}

function renderManagedAssetList(containerId, data, options) {
  const container = $(containerId);
  if (!container) return;

  const { title, collection, prefix, folder, formFactory, extraBuilder } = options;

  container.innerHTML = data.map((item) => `
    <article class="managed-large-card" data-id="${esc(item.id)}">
      <div class="managed-large-thumb">
        ${item.photoUrl ? `<img src="${esc(item.photoUrl)}" alt="${esc(item.name || '')}">` : '<div class="managed-thumb-empty">NO IMAGE</div>'}
      </div>

      <div class="managed-large-body">
        <span class="status-chip">${esc(item.status || '-')}</span>
        <h3>${esc(item.name || '-')}</h3>
        <p>${esc(item.code || '')}</p>
        <small>${esc(item.customerName || '연결 고객 없음')}</small>

        <div class="managed-large-actions">
          <button class="secondary small managed-edit" data-id="${esc(item.id)}">수정</button>
          <button class="danger-link managed-remove" data-id="${esc(item.id)}">삭제</button>
        </div>
      </div>
    </article>
  `).join('') || '<div class="empty">등록된 항목이 없습니다.</div>';

  container.querySelectorAll('.managed-large-card').forEach((card) => {
    card.onclick = (event) => {
      if (event.target.closest('.managed-edit') || event.target.closest('.managed-remove')) return;
      const item = data.find((row) => row.id === card.dataset.id);
      showManagedAssetDetail(item, title, () => openOpsModal(
        formFactory(item),
        (e) => saveManagedAsset(e, collection, prefix, folder, extraBuilder)
      ));
    };
  });

  container.querySelectorAll('.managed-edit').forEach((button) => {
    button.onclick = () => {
      const item = data.find((row) => row.id === button.dataset.id);
      openOpsModal(
        formFactory(item),
        (e) => saveManagedAsset(e, collection, prefix, folder, extraBuilder)
      );
    };
  });

  container.querySelectorAll('.managed-remove').forEach((button) => {
    button.onclick = async () => {
      if (confirm('이 항목을 삭제할까요?')) {
        await LuaDataService.removeCollectionDoc(collection, button.dataset.id);
      }
    };
  });
}

function iroDressForm(item = {}) {
  return managedAssetForm('이로스타일 드레스', item, {
    eyebrow: 'IRO STYLE · DRESS',
    folder: 'iro-dresses',
    extraFields: `<label>색상<input name="color" value="${esc(item.color || '')}"></label>`
  });
}

function iroShoesForm(item = {}) {
  return managedAssetForm('이로스타일 슈즈', item, {
    eyebrow: 'IRO STYLE · SHOES',
    folder: 'iro-shoes',
    extraFields: `
      <label>사이즈<input name="size" value="${esc(item.size || '')}"></label>
      <label>색상<input name="color" value="${esc(item.color || '')}"></label>
      <label>굽높이<input name="heelHeight" value="${esc(item.heelHeight || '')}" placeholder="예: 7cm"></label>
      <label>대여료<input type="number" name="rentalFee" min="0" value="${esc(item.rentalFee || 0)}"></label>
      <label>보증금<input type="number" name="deposit" min="0" value="${esc(item.deposit || 0)}"></label>
      <label>대여일<input type="date" name="rentalDate" value="${esc(item.rentalDate || '')}"></label>
      <label>반납일<input type="date" name="returnDate" value="${esc(item.returnDate || '')}"></label>`
  });
}

function hanbokForm(item = {}) {
  return managedAssetForm('봄날한복', item, {
    eyebrow: 'BOMNAL HANBOK',
    typeField: 'type',
    typeOptions: HANBOK_TYPES,
    folder: 'hanbok',
    extraFields: `
      <label>색상<input name="color" value="${esc(item.color || '')}"></label>
      <label>대여일<input type="date" name="rentalDate" value="${esc(item.rentalDate || '')}"></label>
      <label>반납일<input type="date" name="returnDate" value="${esc(item.returnDate || '')}"></label>
      <label>대여료<input type="number" name="rentalFee" min="0" value="${esc(item.rentalFee || 0)}"></label>`
  });
}

function accessoryForm(item = {}, category = '베일') {
  return managedAssetForm(`${category} 악세사리`, { ...item, category: item.category || category }, {
    eyebrow: 'ACCESSORY',
    typeField: 'category',
    typeOptions: ACCESSORY_TYPES,
    folder: 'accessories',
    extraFields: `
      <label>색상<input name="color" value="${esc(item.color || '')}"></label>
      <label>소재/특징<input name="material" value="${esc(item.material || '')}"></label>
    `
  });
}

function renderIroStyle() {
  renderManagedAssetList('iroDressList', iroDressesData, {
    title: '이로스타일 드레스',
    collection: 'iroDresses',
    prefix: 'IRD',
    folder: 'iro-dresses',
    formFactory: iroDressForm,
    extraBuilder: (data) => ({ color: data.get('color')?.trim() || '' })
  });

  renderManagedAssetList('iroShoesList', iroShoesData, {
    title: '이로스타일 슈즈',
    collection: 'iroShoes',
    prefix: 'IRS',
    folder: 'iro-shoes',
    formFactory: iroShoesForm,
    extraBuilder: (data) => ({
      size: data.get('size')?.trim() || '',
      color: data.get('color')?.trim() || '',
      heelHeight: data.get('heelHeight')?.trim() || '',
      rentalFee: Number(data.get('rentalFee') || 0),
      deposit: Number(data.get('deposit') || 0),
      rentalDate: data.get('rentalDate') || '',
      returnDate: data.get('returnDate') || ''
    })
  });
}

function renderHanbok() {
  renderManagedAssetList('hanbokList', hanbokData, {
    title: '봄날한복',
    collection: 'hanbok',
    prefix: 'HB',
    folder: 'hanbok',
    formFactory: hanbokForm,
    extraBuilder: (data) => ({
      type: data.get('type') || '기타',
      color: data.get('color')?.trim() || '',
      rentalDate: data.get('rentalDate') || '',
      returnDate: data.get('returnDate') || '',
      rentalFee: Number(data.get('rentalFee') || 0)
    })
  });
}

function renderAccessories() {
  ACCESSORY_TYPES.forEach((category) => {
    const idMap = {
      '베일': 'veilAccessoryList',
      '티아라': 'tiaraAccessoryList',
      '기타': 'otherAccessoryList'
    };

    renderManagedAssetList(
      idMap[category],
      accessoriesData.filter((item) => item.category === category),
      {
        title: category,
        collection: 'accessories',
        prefix: category === '베일' ? 'VL' : category === '티아라' ? 'TR' : 'AC',
        folder: 'accessories',
        formFactory: (item) => accessoryForm(item, category),
        extraBuilder: (data) => ({
          category: data.get('category') || category,
          color: data.get('color')?.trim() || '',
          material: data.get('material')?.trim() || ''
        })
      }
    );
  });
}


$('newContractBtn')?.addEventListener('click',()=>openOpsModal(contractForm(),saveContract));
$('newPaymentBtn')?.addEventListener('click',()=>openOpsModal(paymentForm(),savePayment));
$('newDressBtn')?.addEventListener('click',()=>openOpsModal(dressForm(),saveDress));

$('newIroDressBtn')?.addEventListener('click',()=>openOpsModal(iroDressForm(),(event)=>saveManagedAsset(event,'iroDresses','IRD','iro-dresses',(data)=>({color:data.get('color')?.trim()||''}))));
$('newIroShoesBtn')?.addEventListener('click',()=>openOpsModal(iroShoesForm(),(event)=>saveManagedAsset(event,'iroShoes','IRS','iro-shoes',(data)=>({size:data.get('size')?.trim()||'',color:data.get('color')?.trim()||'',heelHeight:data.get('heelHeight')?.trim()||'',rentalFee:Number(data.get('rentalFee')||0),deposit:Number(data.get('deposit')||0),rentalDate:data.get('rentalDate')||'',returnDate:data.get('returnDate')||''}))));
$('newHanbokBtn')?.addEventListener('click',()=>openOpsModal(hanbokForm(),(event)=>saveManagedAsset(event,'hanbok','HB','hanbok',(data)=>({type:data.get('type')||'기타',color:data.get('color')?.trim()||'',rentalDate:data.get('rentalDate')||'',returnDate:data.get('returnDate')||'',rentalFee:Number(data.get('rentalFee')||0)}))));

$('newVeilAccessoryBtn')?.addEventListener('click',()=>openOpsModal(accessoryForm({},'베일'),(event)=>saveManagedAsset(event,'accessories','VL','accessories',(data)=>({category:data.get('category')||'베일',color:data.get('color')?.trim()||'',material:data.get('material')?.trim()||''}))));
$('newTiaraAccessoryBtn')?.addEventListener('click',()=>openOpsModal(accessoryForm({},'티아라'),(event)=>saveManagedAsset(event,'accessories','TR','accessories',(data)=>({category:data.get('category')||'티아라',color:data.get('color')?.trim()||'',material:data.get('material')?.trim()||''}))));
$('newOtherAccessoryBtn')?.addEventListener('click',()=>openOpsModal(accessoryForm({},'기타'),(event)=>saveManagedAsset(event,'accessories','AC','accessories',(data)=>({category:data.get('category')||'기타',color:data.get('color')?.trim()||'',material:data.get('material')?.trim()||''}))));

['contractSearch','contractStatusFilter'].forEach((id)=>$(id)?.addEventListener('input',renderContracts));
['paymentSearch','paymentMethodFilter'].forEach((id)=>$(id)?.addEventListener('input',renderPayments));
['dressSearch','dressStatusFilter'].forEach((id)=>$(id)?.addEventListener('input',renderDresses));
$('scheduleMonth')?.addEventListener('input',renderSchedule);
