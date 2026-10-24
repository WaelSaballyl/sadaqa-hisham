'use strict';
(() => {
  const banner = document.querySelector('#install-banner');
  const button = document.querySelector('#install-app');
  const standalone = window.matchMedia('(display-mode: standalone)');
  let installPrompt = null;
  let installedThisSession = false;
  let prompting = false;
  function update() {
    banner.hidden = !installPrompt || prompting || installedThisSession || standalone.matches || navigator.standalone === true;
    button.disabled = !installPrompt || prompting;
  }
  update();
  standalone.addEventListener('change', update);
  window.addEventListener('beforeinstallprompt', event => {
    if (typeof event.prompt !== 'function') return;
    event.preventDefault();
    installPrompt = event;
    update();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installedThisSession = true;
    update();
  });
  button.addEventListener('click', async () => {
    if (!installPrompt || prompting) return;
    const prompt = installPrompt;
    installPrompt = null;
    prompting = true;
    update();
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      const toast = document.querySelector('#toast');
      toast.textContent = 'تعذّر فتح نافذة التثبيت الآن.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    } finally {
      prompting = false;
      update();
    }
  });
})();
