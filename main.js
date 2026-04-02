/* ================================================
   FLOWAI — main.js
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── PAGE NAVIGATION ──────────────────────────────
  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === id);
    });
  }

  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showPage(el.dataset.page);
    });
  });

  // ── BILLING TOGGLE ───────────────────────────────
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isAnnual = btn.dataset.billing === 'annual';
      document.querySelectorAll('.plan-price[data-monthly][data-annual]').forEach(el => {
        el.innerHTML = isAnnual ? el.dataset.annual : el.dataset.monthly;
      });
    });
  });

  // ── FAQ ACCORDION ─────────────────────────────────
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => item.classList.toggle('open'));
  });

  // ── FILTER TABS ──────────────────────────────────
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ── EMAIL FORM ───────────────────────────────────
  document.querySelectorAll('.cta-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const orig = btn.textContent;
      btn.textContent = '✓ You\'re on the list!';
      btn.style.background = '#00E096';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; form.reset(); }, 3000);
    });
  });

  // ── INIT ─────────────────────────────────────────
  showPage('home');
});
