(() => {
  'use strict';

  const STORAGE_KEY = 'duit_expenses_v1';
  let expenses = [];
  let filterQuery = '';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const pad2 = (n) => String(n).padStart(2, '0');

  const formatNumber = (angka) =>
    new Intl.NumberFormat('id-ID').format(angka);

  const formatRupiah = (angka) => 'Rp ' + formatNumber(angka);

  const formatTanggal = (isoString) => {
    const d = new Date(isoString);
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const form         = $('#expenseForm');
  const inputName    = $('#name');
  const inputCat     = $('#category');
  const inputAmount  = $('#amount');
  const errName      = $('#errName');
  const errAmount    = $('#errAmount');

  const listEl       = $('#list');
  const emptyState   = $('#emptyState');
  const totalAmountEl= $('#totalAmount');
  const totalCountEl = $('#totalCount');
  const searchInput  = $('#searchInput');
  const clearAllBtn  = $('#clearAllBtn');

  const confirmDialog = $('#confirmDialog');
  const toastStack    = $('#toastStack');
  const todayLabel    = $('#todayLabel');
  const quickChips    = $('#quickChips');
  const receiptNoEl   = $('#receiptNo');
  const receiptDateEl = $('#receiptDate');
  const receiptCodeEl = $('#receiptCode');

  const init = () => {
    const now = new Date();

    // Header date
    todayLabel.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Receipt meta
    receiptNoEl.textContent = '#' + String(Math.floor(Math.random() * 9000) + 1000);
    receiptDateEl.textContent = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    // Receipt barcode code
    const part1 = String(Math.floor(Math.random() * 9000) + 1000);
    const part2 = String(Math.floor(Math.random() * 9000) + 1000);
    receiptCodeEl.textContent = `${part1}-${part2}`;

    loadFromStorage();
    render();
    bindEvents();
  };

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) expenses = parsed;
      }
    } catch (e) {
      console.warn('Gagal memuat data:', e);
      expenses = [];
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Gagal menyimpan data:', e);
    }
  };

  const getFiltered = () => {
    if (!filterQuery) return expenses;
    const q = filterQuery.toLowerCase();
    return expenses.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
    );
  };

  const render = () => {
    const filtered = getFiltered();

    // Totals (always from all data)
    const total = expenses.reduce((s, it) => s + it.amount, 0);
    totalAmountEl.textContent = formatRupiah(total);
    totalCountEl.textContent = expenses.length;

    // Items
    listEl.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.add('show');
      const titleEls = emptyState.querySelectorAll('.empty__title');
      const hintEl = emptyState.querySelector('.empty__hint');
      if (filterQuery) {
        titleEls[0].textContent = 'TIDAK';
        titleEls[1].textContent = 'DITEMUKAN';
        hintEl.innerHTML = `Tidak ada transaksi yang cocok dengan "<strong>${escapeHtml(filterQuery)}</strong>".`;
      } else {
        titleEls[0].textContent = 'BELUM ADA';
        titleEls[1].textContent = 'TRANSAKSI';
        hintEl.innerHTML = 'Mulai catat pengeluaran<br />lewat form di samping.';
      }
      return;
    }

    emptyState.classList.remove('show');

    const template = $('#itemTemplate');
    const fragment = document.createDocumentFragment();

    filtered.forEach((item, idx) => {
      const clone = template.content.cloneNode(true);
      const li = clone.querySelector('.r-item');

      li.dataset.id = item.id;
      li.querySelector('.r-item__qty').textContent = String(idx + 1).padStart(2, '0') + '×';
      li.querySelector('.r-item__name').textContent = item.name;
      li.querySelector('.r-item__cat').textContent = item.category;
      li.querySelector('.r-item__time').textContent = formatTanggal(item.date);
      li.querySelector('.r-item__price').textContent = formatNumber(item.amount);

      fragment.appendChild(clone);
    });

    listEl.appendChild(fragment);
  };

  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

  const clearErrors = () => {
    errName.textContent = '';
    errAmount.textContent = '';
    inputName.classList.remove('invalid');
    inputAmount.classList.remove('invalid');
  };

  const validateForm = () => {
    clearErrors();
    let valid = true;

    const name = inputName.value.trim();
    const raw = inputAmount.value.replace(/[^0-9]/g, '');
    const amount = parseInt(raw, 10);

    if (!name) {
      errName.textContent = 'Keterangan wajib diisi.';
      inputName.classList.add('invalid');
      valid = false;
    }
    if (!raw || isNaN(amount) || amount <= 0) {
      errAmount.textContent = 'Nominal harus lebih dari 0.';
      inputAmount.classList.add('invalid');
      valid = false;
    }

    return valid ? { name, amount, category: inputCat.value } : null;
  };

  const addExpense = (e) => {
    e.preventDefault();
    const data = validateForm();
    if (!data) return;

    expenses.unshift({
      id: uid(),
      name: data.name,
      amount: data.amount,
      category: data.category,
      date: new Date().toISOString()
    });

    saveToStorage();
    render();

    form.reset();
    inputCat.value = 'Lainnya';
    clearErrors();
    inputName.focus();

    showToast(`"${data.name}" berhasil dicetak.`, 'success');
  };

  const deleteExpense = (id) => {
    const idx = expenses.findIndex((it) => it.id === id);
    if (idx === -1) return;

    const removed = expenses[idx];
    expenses.splice(idx, 1);
    saveToStorage();
    render();

    showToast(`"${removed.name}" dihapus dari struk.`, 'danger');
  };

  const clearAllExpenses = () => {
    if (expenses.length === 0) {
      showToast('Tidak ada data untuk dihapus.', 'info');
      return;
    }
    confirmDialog.showModal();
  };

  const confirmClearAll = () => {
    expenses = [];
    saveToStorage();
    render();
    confirmDialog.close();
    showToast('Semua riwayat telah dihapus.', 'danger');
  };

  const showToast = (msg, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✓', danger: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
    toastStack.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3200);
  };

  const bindEvents = () => {
    form.addEventListener('submit', addExpense);

    // Quick chips
    quickChips.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-add]');
      if (!btn) return;
      const add = parseInt(btn.dataset.add, 10);
      const cur = parseInt(inputAmount.value.replace(/[^0-9]/g, ''), 10) || 0;
      inputAmount.value = formatNumber(cur + add);
      inputAmount.classList.remove('invalid');
      errAmount.textContent = '';
    });

    inputAmount.addEventListener('input', (e) => {
      let raw = e.target.value.replace(/[^0-9]/g, '');
      if (raw === '') { e.target.value = ''; return; }
      if (raw.length > 12) raw = raw.slice(0, 12);
      e.target.value = formatNumber(parseInt(raw, 10));
      if (raw) {
        inputAmount.classList.remove('invalid');
        errAmount.textContent = '';
      }
    });

    inputName.addEventListener('input', () => {
      if (inputName.value.trim()) {
        inputName.classList.remove('invalid');
        errName.textContent = '';
      }
    });

    // Search
    searchInput.addEventListener('input', (e) => {
      filterQuery = e.target.value.trim();
      render();
    });

    clearAllBtn.addEventListener('click', clearAllExpenses);

    confirmDialog.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) confirmDialog.close();
      if (e.target.hasAttribute('data-confirm')) confirmClearAll();
      if (e.target === confirmDialog) confirmDialog.close();
    });

    listEl.addEventListener('click', (e) => {
      const del = e.target.closest('.r-item__del');
      if (!del) return;
      const li = del.closest('.r-item');
      if (!li) return;
      deleteExpense(li.dataset.id);
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();