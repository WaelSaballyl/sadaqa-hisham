'use strict';
(() => {
  const banner = document.querySelector('#install-banner');
  const button = document.querySelector('#install-app');
  const dialog = document.querySelector('#install-dialog');
  const standalone = window.matchMedia('(display-mode: standalone)');
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // WhatsApp, Instagram and Snapchat open links in their own browser, which can't add to the home screen.
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line\/|; wv\)/.test(ua) || (isIOS && !/Safari\//.test(ua));
  let installPrompt = null;
  let installedThisSession = false;
  let prompting = false;

  // The banner always shows (except inside the installed app): Chrome on Android gets its own
  // install window, every other browser gets step-by-step instructions instead.
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
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installedThisSession = true;
    update();
    const toast = document.querySelector('#toast');
    toast.textContent = 'تمت الإضافة، تلقاه في شاشة جوالك الرئيسية.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  });

  const icon = name => `<span class="install-key"><svg aria-hidden="true"><use href="#${name}"/></svg></span>`;
  function showSteps() {
    let steps;
    if (inApp) {
      steps = isIOS
        ? ['اضغط على النقاط الثلاث أو زر المشاركة في أعلى الصفحة أو أسفلها.', 'اختر «فتح في Safari».', 'بعد ما تفتح الصفحة في Safari، اضغط زر «أضف إلى الشاشة الرئيسية» مرة ثانية.']
        : ['اضغط على النقاط الثلاث ⋮ في أعلى الصفحة.', 'اختر «فتح في Chrome» أو «فتح في المتصفح».', 'بعد ما تفتح الصفحة، اضغط زر «أضف إلى الشاشة الرئيسية» مرة ثانية.'];
    } else if (isIOS) {
      steps = [`اضغط زر المشاركة ${icon('i-ios-share')} أسفل الشاشة (أو أعلاها في الآيباد).`, `انزل في القائمة واختر «إضافة إلى الشاشة الرئيسية» ${icon('i-ios-add')}`, 'اضغط «إضافة» في أعلى الشاشة.'];
    } else {
      steps = ['اضغط على النقاط الثلاث ⋮ في أعلى المتصفح.', 'اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».', 'اضغط «إضافة» أو «تثبيت».'];
    }
    dialog.querySelector('#install-lead').textContent = inApp
      ? 'أنت فاتح الصفحة من داخل تطبيق آخر، افتحها في المتصفح أولًا:'
      : 'خطوات بسيطة، وبعدها يصير الموقع أيقونة في جوالك:';
    dialog.querySelector('#install-steps').innerHTML = steps.map(step => `<li>${step}</li>`).join('');
    if (!dialog.open) dialog.showModal();
  }
  dialog.querySelector('#install-done').addEventListener('click', () => dialog.close());

  button.addEventListener('click', async () => {
    if (prompting) return;
    if (!installPrompt) return showSteps();
    const prompt = installPrompt;
    installPrompt = null;
    prompting = true;
    update();
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      showSteps();
    } finally {
      prompting = false;
      update();
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
