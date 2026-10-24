'use strict';
(() => {
  const dialog = document.querySelector('#reader-dialog');
  const content = document.querySelector('#reader-content');
  const title = document.querySelector('#reader-title');
  const format = n => new Intl.NumberFormat('ar-u-nu-arab').format(n);
  const quick = {fatiha:1, ikhlas:112, falaq:113, nas:114, baqarah:2};
  let bookPromise;
  let player;
  let request = 0;
  let current = 1;
  try { const saved = Number(localStorage.getItem('sadaqah-quran-surah-v1')); if (saved>=1 && saved<=114) current=saved; } catch {}
  function stopAudio() { if (player) { player.pause(); player.removeAttribute('src'); player.load(); player = null; } }
  function loadBook() {
    if (!bookPromise) bookPromise = fetch('assets/quran-uthmani.json').then(response => {
      if (!response.ok) throw new Error('Quran unavailable');
      return response.json();
    }).then(book => {
      if (book.surahs?.length !== 114) throw new Error('Invalid Quran data');
      return book;
    }).catch(error => { bookPromise = null; throw error; });
    return bookPromise;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  async function openSurah(number) {
    const token = ++request;
    stopAudio();
    if (!dialog.open) dialog.showModal();
    title.textContent = 'القرآن الكريم';
    const loading = element('p','quran-message','جارٍ فتح المصحف…');
    loading.setAttribute('role','status');
    content.replaceChildren(loading);
    try {
      const book = await loadBook();
      if (token !== request || !dialog.open) return;
      current = Math.min(114,Math.max(1,number));
      const surah = book.surahs[current-1];
      title.textContent = surah.name;
      try { localStorage.setItem('sadaqah-quran-surah-v1',String(current)); } catch {}
      const toolbar = element('div','quran-reader-toolbar');
      const label = element('label','','اختر السورة');
      label.htmlFor = 'quran-surah-select';
      const select = element('select');
      select.id = 'quran-surah-select';
      book.surahs.forEach(item => {
        const option = element('option','',format(item.number)+' · '+item.name);
        option.value = item.number;
        option.selected = item.number === current;
        select.append(option);
      });
      select.addEventListener('change',()=>openSurah(Number(select.value)));
      const navigation = element('div','quran-reader-navigation');
      const previous = element('button','','السورة السابقة');
      const next = element('button','','السورة التالية');
      previous.disabled = current === 1;
      next.disabled = current === 114;
      previous.addEventListener('click',()=>openSurah(current-1));
      next.addEventListener('click',()=>openSurah(current+1));
      navigation.append(previous,next);
      toolbar.append(label,select,navigation);
      const audioBox = element('div','quran-audio-player');
      const audioTitle = element('p','','استمع إلى '+surah.name+' · مشاري راشد العفاسي');
      const audio = element('audio');
      audio.controls = true;
      audio.preload = 'none';
      audio.setAttribute('aria-label','تلاوة '+surah.name+' بصوت مشاري راشد العفاسي');
      audio.src = 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/'+current+'.mp3';
      const errorMessage = element('p','quran-audio-error');
      errorMessage.setAttribute('role','status');
      audio.addEventListener('error',()=>{ errorMessage.textContent = 'تعذّر تحميل التلاوة. تأكد من اتصال الإنترنت، ثم أعد فتح السورة للمحاولة.'; });
      player = audio;
      audioBox.append(audioTitle,audio,errorMessage);
      const sizeControls = element('div','quran-size-controls');
      const sizeLabel = element('span','','حجم خط المصحف');
      const smaller = element('button','','تصغير الخط −');
      const larger = element('button','','تكبير الخط +');
      let size = 32;
      try { const saved=Number(localStorage.getItem('sadaqah-quran-size-v1')); if(saved>=24&&saved<=44)size=saved; } catch {}
      const verses = element('p','surah-text quran-full-text');
      function applySize() {
        verses.style.fontSize = size+'px';
        smaller.disabled = size === 24;
        larger.disabled = size === 44;
        try { localStorage.setItem('sadaqah-quran-size-v1',String(size)); } catch {}
      }
      smaller.addEventListener('click',()=>{ size=Math.max(24,size-2);applySize(); });
      larger.addEventListener('click',()=>{ size=Math.min(44,size+2);applySize(); });
      sizeControls.append(sizeLabel,smaller,larger);
      // The basmala opens every surah except at-Tawbah; in al-Fatiha it is verse 1 itself.
      const basmala = current !== 1 && current !== 9 ? element('p','bismillah','بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ') : null;
      surah.ayahs.forEach((verse,index)=>{
        verses.append(document.createTextNode(verse+' '));
        verses.append(element('span','verse-number','﴿'+format(index+1)+'﴾ '));
      });
      applySize();
      const n = surah.ayahs.length;
      const ayahWord = n === 1 ? 'آية واحدة' : n === 2 ? 'آيتان' : format(n)+(n <= 10 ? ' آيات' : ' آية');
      const note = element('p','quran-reader-note',ayahWord+' · التلاوة تعمل عند الضغط على التشغيل وتحتاج الإنترنت.');
      const source = element('a','reader-source','مصدر نص المصحف والتلاوة: Al Quran Cloud ↗');
      source.href = 'https://alquran.cloud/';
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      content.replaceChildren(toolbar,audioBox,sizeControls,note,...(basmala?[basmala]:[]),verses,source);
      content.scrollTop = 0;
      dialog.scrollTop = 0;
    } catch {
      if (token !== request || !dialog.open) return;
      const message = element('p','quran-message','تعذّر فتح المصحف. تأكد من اتصال الإنترنت ثم حاول مرة ثانية.');
      const retry = element('button','button primary','إعادة المحاولة');
      retry.addEventListener('click',()=>openSurah(number));
      content.replaceChildren(message,retry);
    }
  }
  document.querySelectorAll('[data-surah]').forEach(button => button.addEventListener('click',()=>openSurah(quick[button.dataset.surah])));
  document.querySelector('#open-quran').addEventListener('click',()=>openSurah(current));
  document.querySelector('#open-quran-audio').addEventListener('click',()=>openSurah(current));
  dialog.addEventListener('close',()=>{ request++; stopAudio(); });
})();
