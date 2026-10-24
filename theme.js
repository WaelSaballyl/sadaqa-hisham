'use strict';
(() => {
  const key = 'sadaqah-theme-v1';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'dark' || value === 'light';
  let preference = null;
  try { const stored = localStorage.getItem(key); if (valid(stored)) preference = stored; } catch {}
  function apply() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = theme === 'dark' ? '#101c18' : '#f8f7f1';
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }
  apply();
  document.addEventListener('DOMContentLoaded', apply);
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-theme-choice]');
    if (!button || !valid(button.dataset.themeChoice)) return;
    preference = button.dataset.themeChoice;
    try { localStorage.setItem(key, preference); } catch {}
    apply();
  });
  system.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    apply();
  });
})();
