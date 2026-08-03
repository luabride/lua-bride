// 고객정보 저장 안내 개선
async function saveCustomer(event) {
  event.preventDefault();

  const form = event.target;
  const data = new FormData(form);
  const phone = data.get('phone').trim();
  const box = document.getElementById('customerSaveResult');
  const button = form.querySelector('button[type="submit"]');

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
    customerType: data.get('customerType') || '',
    selectedDress: data.get('selectedDress') || '',
    tiara: data.get('tiara') || '',
    veil: data.get('veil') || '',
    updatedAt: new Date().toISOString()
  };

  box.style.display = 'none';
  box.className = 'result';
  box.textContent = '';

  button.disabled = true;
  button.textContent = '저장 중...';

  try {
    await LuaDataService.saveCustomer(customer);
    selectedCustomerId = customer.id;

    box.className = 'result save-success';
    box.innerHTML = '<b>고객정보가 저장되었습니다.</b><br><small>변경사항이 Firebase에 정상 반영되었습니다.</small>';
    box.style.display = 'block';

    // 저장 안내가 보이도록 이동
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // 고객 목록도 즉시 갱신
    renderCustomers();

    // 4초 뒤 자동으로 흐리게 표시
    setTimeout(() => {
      box.classList.add('fade-notice');
    }, 4000);
  } catch (error) {
    console.error('Customer save error:', error);

    box.className = 'result save-error';
    box.innerHTML = `<b>고객정보 저장에 실패했습니다.</b><br><small>${error?.code || error?.message || '알 수 없는 오류'}</small>`;
    box.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = '고객정보 저장';
  }
}
