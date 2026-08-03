let allData = [];

const rows = document.getElementById('reservationRows');
const empty = document.getElementById('emptyState');
const search = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');

const esc = (s = '') =>
  String(s).replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));

let unsubscribeData = null;

function showApp(user) {
  document.getElementById('loginGate').hidden = true;
  document.getElementById('adminApp').hidden = false;

  const badge = document.getElementById('storageBadge');
  badge.textContent =
    `${LuaDataService.mode === 'firebase' ? 'FIREBASE ONLINE' : 'LOCAL DEMO'} · ` +
    `${LuaAuthService.mode === 'firebase' ? 'AUTH' : 'DEMO LOGIN'}`;

  document.getElementById('modeNote').textContent =
    LuaDataService.mode === 'firebase'
      ? `온라인 저장 활성화. 로그인 계정: ${user?.email || '-'}`
      : '현재 이 브라우저에만 저장되는 데모 모드입니다.\n실제 배포 전 Firebase Auth와 Firestore를 설정하세요.';

  if (!unsubscribeData) {
    unsubscribeData = LuaDataService.subscribe((data) => {
      allData = data;
      render();
    });
  }
}

function showLogin() {
  document.getElementById('loginGate').hidden = false;
  document.getElementById('adminApp').hidden = true;

  if (unsubscribeData) {
    unsubscribeData();
    unsubscribeData = null;
  }
}

function translateAuthError(err) {
  const code = err?.code || '';
  const messages = {
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/user-not-found': '등록되지 않은 관리자 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
    'auth/operation-not-allowed': 'Firebase에서 이메일/비밀번호 로그인이 활성화되지 않았습니다.',
    'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
    'auth/network-request-failed': '네트워크 연결을 확인하세요.',
    'auth/unauthorized-domain': 'Firebase 승인 도메인에 lua-bride.vercel.app을 추가해야 합니다.'
  };

  return messages[code] || `로그인 실패: ${code || err?.message || '알 수 없는 오류'}`;
}

document.getElementById('loginForm').onsubmit = async (event) => {
  event.preventDefault();

  const error = document.getElementById('loginError');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  error.style.display = 'none';
  error.textContent = '';
  button.disabled = true;
  button.textContent = '로그인 중...';

  try {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    await LuaAuthService.login(email, password);
  } catch (err) {
    console.error('Lua Bride admin login error:', err);
    error.textContent =
      LuaAuthService.mode === 'firebase'
        ? translateAuthError(err)
        : '데모 비밀번호가 올바르지 않습니다.';
    error.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = '로그인';
  }
};

document.getElementById('logoutBtn').onclick = () => LuaAuthService.logout();

function render() {
  let data = [...allData];
  const q = search.value.trim().toLowerCase();

  if (q) {
    data = data.filter((r) =>
      [r.id, r.name, r.phone].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }

  if (statusFilter.value) {
    data = data.filter((r) => r.status === statusFilter.value);
  }

  if (dateFilter.value) {
    data = data.filter((r) => r.date === dateFilter.value);
  }

  rows.innerHTML = data.map((r) => `
    <tr>
      <td><b>${esc(r.date)}</b><br>${esc(r.time)}<small>${esc(r.id)}</small></td>
      <td>${esc(r.name)}<br><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>${r.memo ? `<small>${esc(r.memo)}</small>` : ''}</td>
      <td>${esc(r.purpose)}</td>
      <td>${esc(r.weddingDate || '-')}</td>
      <td>
        <select class="status-select" data-id="${esc(r.id)}">
          <option ${r.status === '신청' ? 'selected' : ''}>신청</option>
          <option ${r.status === '확정' ? 'selected' : ''}>확정</option>
          <option ${r.status === '완료' ? 'selected' : ''}>완료</option>
          <option ${r.status === '취소' ? 'selected' : ''}>취소</option>
        </select>
      </td>
      <td><button class="delete-btn" data-id="${esc(r.id)}">삭제</button></td>
    </tr>
  `).join('');

  empty.style.display = data.length ? 'none' : 'block';

  document.querySelectorAll('.status-select').forEach((el) => {
    el.onchange = () => LuaDataService.update(el.dataset.id, { status: el.value });
  });

  document.querySelectorAll('.delete-btn').forEach((el) => {
    el.onclick = async () => {
      if (confirm('이 예약을 삭제할까요?')) {
        await LuaDataService.remove(el.dataset.id);
      }
    };
  });

  updateStats();
}

function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('totalCount').textContent = allData.length;
  document.getElementById('pendingCount').textContent =
    allData.filter((r) => r.status === '신청').length;
  document.getElementById('confirmedCount').textContent =
    allData.filter((r) => r.status === '확정').length;
  document.getElementById('todayCount').textContent =
    allData.filter((r) => r.date === today && r.status !== '취소').length;
}

function csv() {
  const head = [
    '예약번호', '신청일', '예약일', '시간', '상태',
    '이름', '연락처', '방문목적', '예식일', '요청사항'
  ];

  const lines = [
    head,
    ...allData.map((r) => [
      r.id, r.createdAt, r.date, r.time, r.status,
      r.name, r.phone, r.purpose, r.weddingDate, r.memo
    ])
  ].map((row) =>
    row.map((v) => `"${String(v || '').replaceAll('"', '""')}"`).join(',')
  );

  const blob = new Blob(['\ufeff' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8'
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lua-bride-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function seed() {
  const now = new Date();
  const day = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const samples = [
    {
      id: 'LB-SAMPLE01',
      createdAt: new Date().toISOString(),
      date: day(1),
      time: '11:00',
      purpose: '첫 상담',
      name: '김하늘',
      phone: '010-1234-5678',
      weddingDate: day(120),
      memo: 'A라인 선호',
      status: '신청'
    },
    {
      id: 'LB-SAMPLE02',
      createdAt: new Date().toISOString(),
      date: day(2),
      time: '15:00',
      purpose: '드레스 피팅',
      name: '박서윤',
      phone: '010-9876-5432',
      weddingDate: day(160),
      memo: '호텔 웨딩',
      status: '확정'
    }
  ];

  for (const sample of samples) {
    if (!allData.some((x) => x.id === sample.id)) {
      await LuaDataService.add(sample);
    }
  }
}

[search, statusFilter, dateFilter].forEach((el) =>
  el.addEventListener('input', render)
);

document.getElementById('clearFilter').onclick = () => {
  search.value = '';
  statusFilter.value = '';
  dateFilter.value = '';
  render();
};

document.getElementById('exportBtn').onclick = csv;
document.getElementById('seedBtn').onclick = seed;

LuaAuthService.onChange((user) => {
  if (user) {
    showApp(user);
  } else {
    showLogin();
  }
});
