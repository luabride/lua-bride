let allData = [];
let savedCustomers = [];
let selectedCustomerId = null;
let unsubscribeReservations = null;
let unsubscribeCustomers = null;

const $ = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const customerIdFromPhone = (phone = '') => phone.replace(/\D/g, '') || 'unknown';

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
}

function showLogin() {
  setVisible($('loginGate'), true, 'grid');
  setVisible($('adminApp'), false);

  if (unsubscribeReservations) unsubscribeReservations();
  if (unsubscribeCustomers) unsubscribeCustomers();
  unsubscribeReservations = null;
  unsubscribeCustomers = null;
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
    document.querySelectorAll('.admin-tab').forEach((item) => {
      item.classList.toggle('active', item === button);
    });

    const showReservations = button.dataset.tab === 'reservations';
    setVisible($('reservationsTab'), showReservations);
    setVisible($('customersTab'), !showReservations);
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
      stage: '신규',
      venue: '',
      budget: '',
      style: '',
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
      customer.style
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
        <label>예식장<input name="venue" value="${esc(customer.venue || '')}" placeholder="예: 부산 ○○호텔"></label>
        <label>예산<input name="budget" value="${esc(customer.budget || '')}" placeholder="예: 200~300만원"></label>
        <label class="crm-wide">관심 스타일<input name="style" value="${esc(customer.style || '')}" placeholder="예: A라인, 심플, 비즈"></label>
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
  const data = new FormData(event.target);
  const phone = data.get('phone').trim();

  const customer = {
    id: data.get('id') || customerIdFromPhone(phone),
    name: data.get('name').trim(),
    phone,
    weddingDate: data.get('weddingDate'),
    stage: data.get('stage'),
    venue: data.get('venue').trim(),
    budget: data.get('budget').trim(),
    style: data.get('style').trim(),
    memo: data.get('memo').trim(),
    updatedAt: new Date().toISOString()
  };

  const box = $('customerSaveResult');

  try {
    await LuaDataService.saveCustomer(customer);
    selectedCustomerId = customer.id;
    box.textContent = '고객정보가 저장되었습니다.';
    box.style.display = 'block';
  } catch (error) {
    box.textContent = `저장 실패: ${error?.code || error?.message}`;
    box.style.display = 'block';
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
    ['고객명', '연락처', '단계', '예식일', '예식장', '예산', '관심스타일', '상담메모', '예약횟수'],
    mergedCustomers().map((customer) => [
      customer.name,
      customer.phone,
      customer.stage,
      customer.weddingDate,
      customer.venue,
      customer.budget,
      customer.style,
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

LuaAuthService.onChange((user) => user ? showApp(user) : showLogin());
