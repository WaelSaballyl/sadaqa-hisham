'use strict';
(() => {
  const banner = document.querySelector('#install-banner');
  const button = document.querySelector('#install-app');
  const standalone = window.matchMedia('(display-mode: standalone)');
  let installPrompt = null;
  let installedThisSession = false;
  let prompting = false;
  function update() {
    banner.hidden = installedThisSession || standalone.matches || navigator.standalone === true;
    button.disabled = prompting;
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
    if (prompting) return;
    if (!installPrompt) { instructions.showModal(); return; }
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
  const instructions = document.createElement('dialog');
  instructions.id = 'install-dialog';
  instructions.setAttribute('aria-labelledby','install-title');
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  const steps = apple ? ['افتح الرابط في Safari إذا كنت داخل واتساب.','اضغط زر المشاركة في المتصفح.','اختر «إضافة إلى الشاشة الرئيسية»، ثم «إضافة».'] : android ? ['افتح الرابط في Chrome إذا كنت داخل واتساب.','اضغط قائمة المتصفح ⋮.','اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق»، ثم أكّد الإضافة.'] : ['افتح رابط الموقع على جوالك في Safari أو Chrome.','على آيفون: المشاركة ← إضافة إلى الشاشة الرئيسية.','على أندرويد: قائمة ⋮ ← إضافة إلى الشاشة الرئيسية أو تثبيت التطبيق.'];
  instructions.innerHTML = '<div class="dialog-header"><h2 id="install-title">أضف الموقع لشاشة جوالك</h2><button class="close-dialog" aria-label="إغلاق تعليمات الإضافة">×</button></div><div class="install-instructions"><p>اختصار يفتح الموقع بسهولة، مثل التطبيق.</p><ol></ol><button class="button primary">تمام</button></div>';
  steps.forEach(text => {const item=document.createElement('li');item.textContent=text;instructions.querySelector('ol').append(item);});
  instructions.querySelectorAll('button').forEach(close=>close.addEventListener('click',()=>instructions.close()));
  document.body.append(instructions);
  if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
