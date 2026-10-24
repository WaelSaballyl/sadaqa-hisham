'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const number = (n) => new Intl.NumberFormat('ar').format(n);
  const storageKey = 'sadaqah-dhikr-v1';
  const today = () => { const d = new Date(); return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-'); };
  let progress = {date:today(),counts:{}};
  let category = 'morning';
  let toastTimer;
  let query = '';
  let favoritesOnly = false;
  let favorites = new Set();
  let focusItems = [];
  let focusIndex = 0;
  const categoryNames = {morning:'أذكار الصباح',evening:'أذكار المساء',prayer:'أذكار بعد الصلاة',sleep:'أذكار النوم'};
  const normalize = text => text.normalize('NFKD').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').toLowerCase().trim();
  try { const stored = JSON.parse(localStorage.getItem('sadaqah-favorites-v1')); if (Array.isArray(stored)) favorites = new Set(stored.filter(x=>typeof x==='string')); } catch {}
  try { const stored = JSON.parse(localStorage.getItem(storageKey)); if (stored?.date === today() && stored.counts && typeof stored.counts === 'object' && !Array.isArray(stored.counts)) progress = stored; } catch {}
  const countFor = (item) => { const v = progress.counts[category + ':' + item.id]; return Number.isInteger(v) && v > 0 ? Math.min(v,item.count) : 0; };
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch {} };
  function checkDate() { if (progress.date !== today()) { progress = {date:today(),counts:{}}; save(); render(); renderDuas(); return true; } return false; }
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'),3500); }
  function icon(name) { const el = document.createElementNS('http://www.w3.org/2000/svg','svg'); el.setAttribute('aria-hidden','true'); const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','#i-'+name); el.append(use); return el; }
  function updateProgress() {
    const items = DHIKR[category].items;
    const completed = items.filter(i => countFor(i) === i.count).length;
    $('#dhikr-count').textContent = number(completed) + ' / ' + number(items.length);
    const total = items.reduce((sum,i) => sum+i.count,0);
    const done = items.reduce((sum,i) => sum+countFor(i),0);
    $('#category-progress > span').style.width = (done/total*100)+'%';
    $('#category-progress').setAttribute('aria-label',number(completed)+' من '+number(items.length)+' أذكار مكتملة');
    $('#dhikr-complete').hidden = completed !== items.length;
    updateResume();
  }
  function updateResume() {
    const selected = DHIKR[progress.category] ? progress.category : 'morning';
    const items = DHIKR[selected].items;
    const complete = items.filter(item => progress.counts[selected+':'+item.id] >= item.count).length;
    $('#resume-title').textContent = (Object.keys(progress.counts).length || Object.keys(progress.positions || {}).length ? 'تابع ' : 'ابدأ ') + categoryNames[selected];
    $('#resume-detail').textContent = complete ? number(complete)+' من '+number(items.length)+' أذكار مكتملة اليوم' : 'قراءة هادئة، ذكرًا بعد ذكر';
  }
  function visibleItems() {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return DHIKR[category].items.filter(item => (!favoritesOnly || favorites.has(category+':'+item.id)) && terms.every(term=>normalize(item.title+' '+item.text).includes(term)));
  }
  function updateFavoritesCount() {
    const n = DHIKR[category].items.filter(item=>favorites.has(category+':'+item.id)).length;
    $('#favorites-count').textContent = number(n);
    $('#favorites-toggle').setAttribute('aria-pressed',String(favoritesOnly));
  }
  function increment(item,button,card) {
    if(checkDate()) { if($('#focus-dialog').open) $('#focus-dialog').close(); return; }
    progress.counts[category+':'+item.id] = Math.min(item.count,countFor(item)+1);
    progress.category=category;
    progress.positions = {...progress.positions,[category]:item.id};
    save(); updateCounter(button,card,item); updateProgress(); tapFeedback(button);
    if(countFor(item)===item.count) toast('اكتمل عدّ '+item.title+'، تقبّل الله.');
  }
  function updateCounter(button,card,item) {
    const n = countFor(item);
    const complete = n === item.count;
    const previous = Number(button.dataset.count);
    const sameItem = button.dataset.counterKey === category+':'+item.id;
    button.replaceChildren();
    const label = document.createElement('span'); label.className='counter-number'; label.textContent=number(n)+' / '+number(item.count);
    const ring = document.createElementNS('http://www.w3.org/2000/svg','svg'); ring.setAttribute('viewBox','0 0 64 64'); ring.setAttribute('class','counter-ring'); ring.setAttribute('aria-hidden','true');
    let fill;
    ['ring-track','ring-fill'].forEach(className => { const circle=document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx','32');circle.setAttribute('cy','32');circle.setAttribute('r','27');circle.setAttribute('pathLength','100');circle.setAttribute('class',className);if(className==='ring-fill'){fill=circle;circle.style.strokeDasharray='100';circle.style.strokeDashoffset=String(100*(1-n/item.count));}ring.append(circle); });
    const value = document.createElement('span'); value.className='counter-value'; value.append(ring,label);
    const action = document.createElement('span'); action.className='counter-action'; action.textContent=complete?'اكتمل العدّ':'اضغط بعد كل قراءة';
    button.append(value,action);
    if(sameItem && n===previous+1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && fill.animate)fill.animate([{strokeDashoffset:String(100*(1-previous/item.count))},{strokeDashoffset:String(100*(1-n/item.count))}],{duration:180,easing:'ease-out'});
    button.dataset.count=String(n);button.dataset.counterKey=category+':'+item.id;
    button.disabled = complete;
    button.setAttribute('aria-label',item.title + ': '+ number(n)+' من '+number(item.count)+(complete?'، مكتمل':'، اضغط بعد القراءة'));
    card.classList.toggle('is-complete',complete);
  }
  function tapFeedback(button) {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const plus=document.createElement('span');plus.className='counter-plus';plus.textContent='+١';plus.setAttribute('aria-hidden','true');button.append(plus);setTimeout(()=>plus.remove(),700);
  }
  function render() {
    const list = $('#dhikr-list'); list.replaceChildren();
    $('#category-description').textContent = DHIKR[category].description;
    const instructions = $('#category-instructions');
    instructions.hidden = !['sleep','prayer'].includes(category);
    instructions.textContent = category==='sleep' ? 'عند قراءة الإخلاص والفلق والناس: اجمع كفّيك، وانفث فيهما، واقرأ، ثم امسح ما استطعت من جسدك؛ وافعل ذلك ثلاث مرات. المصدر: صحيح البخاري (٥٠١٧).' : category==='prayer' ? 'هذه الأذكار بعد كل صلاة مفروضة. استخدم «إعادة العدّ» قبل البدء بعد الصلاة التالية.' : '';
    $('#dhikr-panel').setAttribute('aria-labelledby','tab-'+category);
    const items = visibleItems();
    $('#dhikr-empty').hidden = items.length > 0;
    $('#empty-message').textContent = favoritesOnly ? 'أضف أذكارًا إلى المفضلة من علامة الحفظ، أو غيّر كلمة البحث.' : 'جرّب كلمة أخرى، مثل «الاستغفار» أو «الصمد».';
    $('#search-result-status').textContent = query || favoritesOnly ? number(items.length)+' أذكار مطابقة في هذا القسم' : '';
    updateFavoritesCount();
    items.forEach(item => {
      const card = document.createElement('article'); card.className='dhikr-card';
      const top = document.createElement('div'); top.className='dhikr-card-top';
      const title = document.createElement('h3'); title.textContent=item.title;
      const tag = document.createElement('span'); tag.className='dhikr-tag'; tag.textContent=item.count===1?'مرة واحدة':number(item.count)+(item.count<=10?' مرات':' مرة');
      const tools = document.createElement('div'); tools.className='dhikr-card-tools';
      const bookmark = document.createElement('button'); bookmark.className='bookmark-button';
      const key = category+':'+item.id;
      function bookmarkState() { const active=favorites.has(key); bookmark.setAttribute('aria-pressed',String(active)); bookmark.setAttribute('aria-label',(active?'إزالة من المفضلة: ':'حفظ في المفضلة: ')+item.title); }
      bookmark.append(icon('bookmark')); bookmarkState();
      bookmark.addEventListener('click',()=> { const active=favorites.has(key); active?favorites.delete(key):favorites.add(key); try{localStorage.setItem('sadaqah-favorites-v1',JSON.stringify([...favorites]));}catch{} bookmarkState(); updateFavoritesCount(); if(favoritesOnly)render(); toast(active?'أُزيل الذكر من المفضلة.':'حُفظ الذكر في المفضلة على هذا الجهاز.'); });
      tools.append(tag,bookmark); top.append(title,tools);
      const text = document.createElement('p'); text.className='dhikr-text'; text.textContent=item.text;
      const foot = document.createElement('div'); foot.className='dhikr-foot';
      const source = document.createElement('a'); source.className='source-link'; source.href=item.url; source.target='_blank'; source.rel='noopener noreferrer'; source.textContent=item.source+' ↗'; source.setAttribute('aria-label','مصدر '+item.title+': '+item.source+'، في نافذة جديدة');
      const button = document.createElement('button'); button.className='counter';
      button.addEventListener('click',() => increment(item,button,card));
      updateCounter(button,card,item); foot.append(source,button); card.append(top,text,foot); list.append(card);
    });
    updateProgress();
  }
  const tabs = [...document.querySelectorAll('[data-category]')];
  function selectCategory(button) {
    checkDate(); category=button.dataset.category;
    query=''; $('#dhikr-search').value=''; $('#clear-search').hidden=true;
    progress.category=category; save();
    tabs.forEach(t=> { const active=t===button; t.setAttribute('aria-selected',String(active)); t.tabIndex=active?0:-1; });
    render();
  }
  tabs.forEach((button,index)=> {
    button.addEventListener('click',()=>selectCategory(button));
    button.addEventListener('keydown',event=> {
      let next;
      if(event.key==='ArrowLeft') next=(index+1)%tabs.length;
      else if(event.key==='ArrowRight') next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=tabs.length-1;
      if(next!==undefined){event.preventDefault();selectCategory(tabs[next]);tabs[next].focus();}
    });
  });
  $('#dhikr-search').addEventListener('input',event=> {query=event.target.value;$('#clear-search').hidden=!query;render();});
  $('#clear-search').addEventListener('click',()=> {query='';$('#dhikr-search').value='';$('#clear-search').hidden=true;render();$('#dhikr-search').focus();});
  $('#favorites-toggle').addEventListener('click',()=> {favoritesOnly=!favoritesOnly;render();});
  function clearFilters() {query='';favoritesOnly=false;$('#dhikr-search').value='';$('#clear-search').hidden=true;render();}
  $('#clear-filters').addEventListener('click',clearFilters);
  function renderFocus() {
    const item=focusItems[focusIndex]; if(!item) return;
    $('#focus-category').textContent=categoryNames[category];
    $('#focus-step').textContent=number(focusIndex+1)+' من '+number(focusItems.length);
    $('#focus-dhikr-title').textContent=item.title;
    $('#focus-text').textContent=item.text;
    $('#focus-source').href=item.url; $('#focus-source').textContent=item.source+' ↗';
    updateCounter($('#focus-counter'),$('#focus-card'),item);
    $('#focus-previous').disabled=focusIndex===0;
    $('#focus-next').replaceChildren(document.createTextNode(focusIndex===focusItems.length-1?'إنهاء القراءة':'التالي'),icon('arrow'));
    progress.category=category;progress.positions={...progress.positions,[category]:item.id};save();
  }
  function openFocus() {
    checkDate(); focusItems=visibleItems();
    if(!focusItems.length){toast('اختر أذكارًا للقراءة أو ألغِ عوامل البحث.');return;}
    const savedId=progress.positions?.[category];
    const savedIndex=focusItems.findIndex(item=>item.id===savedId && countFor(item)<item.count);
    focusIndex=savedIndex>=0?savedIndex:Math.max(0,focusItems.findIndex(item=>countFor(item)<item.count));
    renderFocus();showDialog($('#focus-dialog'));
  }
  $('#focus-open').addEventListener('click',openFocus);
  $('#focus-counter').addEventListener('click',()=> {
    const item=focusItems[focusIndex]; if(!item)return;
    increment(item,$('#focus-counter'),$('#focus-card'));render();
    if(countFor(item)===item.count) $('#focus-next').focus();
  });
  $('#focus-previous').addEventListener('click',()=> {if(focusIndex>0){focusIndex--;renderFocus();}});
  $('#focus-next').addEventListener('click',()=> {if(focusIndex<focusItems.length-1){focusIndex++;renderFocus();}else{$('#focus-dialog').close();toast('تقبّل الله ذكرك ودعاءك.');}});
  $('#resume-reading').addEventListener('click',()=> {
    checkDate();const savedCategory=DHIKR[progress.category]?progress.category:'morning';
    favoritesOnly=false;selectCategory($('#tab-'+savedCategory));openFocus();
  });
  $('#reset-progress').addEventListener('click',()=> {
    if (!DHIKR[category].items.some(i=>countFor(i)>0)) { toast('العدّادات في هذا القسم على الصفر بالفعل.'); return; }
    DHIKR[category].items.forEach(i=> delete progress.counts[category+':'+i.id]); if(progress.positions)delete progress.positions[category]; save(); render(); toast('تمت إعادة العدّ في هذا القسم.');
  });
  const readingSizes=[22,25,28,31,34];
  let readingSize=25;
  try { const saved=Number(localStorage.getItem('sadaqah-reading-size-v1'));if(readingSizes.includes(saved))readingSize=saved;else if(localStorage.getItem('sadaqah-large-text')==='true')readingSize=31; }catch{}
  function applyReadingSize() {document.documentElement.style.setProperty('--dhikr-size',readingSize+'px');$('#font-size-value').textContent=number(Math.round(readingSize/25*100))+'٪';$('#font-decrease').disabled=readingSize===readingSizes[0];$('#font-increase').disabled=readingSize===readingSizes[readingSizes.length-1];try{localStorage.setItem('sadaqah-reading-size-v1',String(readingSize));}catch{}}
  $('#font-decrease').addEventListener('click',()=>{readingSize=readingSizes[Math.max(0,readingSizes.indexOf(readingSize)-1)];applyReadingSize();});
  $('#font-increase').addEventListener('click',()=>{readingSize=readingSizes[Math.min(readingSizes.length-1,readingSizes.indexOf(readingSize)+1)];applyReadingSize();});
  applyReadingSize();
  function showDialog(dialog) { if(!dialog.open) dialog.showModal(); }
  document.querySelectorAll('dialog').forEach(dialog=> {
    dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=> { const rect=dialog.getBoundingClientRect(); if(event.target===dialog && (event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close(); });
  });
  document.querySelectorAll('[data-surah]').forEach(button=>button.addEventListener('click',()=> {
    const surah=SURAHS[button.dataset.surah]; $('#reader-title').textContent='سورة '+surah.name;
    const content=$('#reader-content'); content.replaceChildren();
    if(surah.number!==1){const basmala=document.createElement('p');basmala.className='bismillah';basmala.textContent='بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';content.append(basmala);}
    const verses=document.createElement('p'); verses.className='surah-text';
    surah.verses.forEach((text,i)=> { verses.append(document.createTextNode(text+' '));const n=document.createElement('span');n.className='verse-number';n.textContent='﴿'+number(i+1)+'﴾ ';verses.append(n); });
    const link=document.createElement('a');link.className='reader-source';link.href='https://quran.com/ar/'+surah.number;link.target='_blank';link.rel='noopener noreferrer';link.textContent='اقرأ السورة مع التفسير على Quran.com ↗';
    content.append(verses,link); showDialog($('#reader-dialog'));
  }));
  function renderDuas() {
    const list=$('#dua-list');list.replaceChildren();
    DUAS.forEach(dua=>{
      const card=document.createElement('article');card.className='prayer-card'+(dua.id==='general'?' prayer-personal':'');card.dataset.duaId=dua.id;
      const title=document.createElement('h3');title.textContent=dua.title;
      const text=document.createElement('p');text.className='prayer-text';text.textContent=dua.text;
      const source=document.createElement(dua.url?'a':'span');source.className='source-link';if(dua.url){source.href=dua.url;source.target='_blank';source.rel='noopener noreferrer';}source.textContent=dua.source+(dua.url?' ↗':'');
      const actions=document.createElement('div');actions.className='prayer-actions';
      const amen=document.createElement('button');amen.className='amen-button';
      const updateAmen=()=>{const done=progress.amen?.[dua.id]===true;amen.replaceChildren(document.createTextNode('آمين'));if(done)amen.append(icon('check'));amen.setAttribute('aria-pressed',String(done));amen.setAttribute('aria-label',(done?'إزالة علامة القراءة: ':'حفظ علامة القراءة بعد الدعاء: ')+dua.title);card.classList.toggle('is-read',done);};updateAmen();
      amen.addEventListener('click',()=>{if(checkDate())return;const done=progress.amen?.[dua.id]===true;progress.amen={...progress.amen,[dua.id]:!done};save();updateAmen();if(!done)toast('تقبّل الله دعاءك. حُفظت علامة القراءة لهذا اليوم.');});
      const copy=document.createElement('button');copy.className='prayer-copy';copy.append(icon('copy'),document.createTextNode('نسخ الدعاء'));copy.addEventListener('click',async()=>{const ok=await copyText(dua.text+'\n'+dua.source+(dua.url?'\n'+dua.url:''));toast(ok?'تم نسخ الدعاء مع مصدره.':'يمكنك تحديد نص الدعاء ونسخه.');});
      actions.append(amen,copy);card.append(title,text,source,actions);list.append(card);
    });
  }
  async function copyText(text) {try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;} }catch{} const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;top:0;left:-9999px';document.body.append(field);field.select();let ok=false;try{ok=document.execCommand('copy');}catch{}field.remove();return ok;}
  const shareUrl=()=>['http:','https:'].includes(location.protocol)?location.origin+location.pathname:null;
  $('#whatsapp-share').hidden=!shareUrl();
  $('#whatsapp-share').href='https://wa.me/?text='+encodeURIComponent('أذكار وأدعية، نسأل الله أن يجعلها صدقة جارية عن هشام سبع الليل، رحمه الله.\n'+shareUrl());
  document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=> { if(!shareUrl()){toast('انشر الموقع أولاً ليصبح له رابط يمكنك مشاركته.');return;} const data={title:document.title,text:'أذكار وأدعية، نسأل الله أن يجعلها صدقة جارية عن هشام سبع الليل، رحمه الله.',url:shareUrl()};if(navigator.share){try{await navigator.share(data);return;}catch(error){if(error.name==='AbortError')return;}}$('#share-url').value=data.url;showDialog($('#share-dialog')); }));
  $('#copy-link').addEventListener('click',async()=> { const ok=await copyText($('#share-url').value);if(ok){$('#share-dialog').close();toast('تم نسخ رابط الموقع.');}else{$('#share-url').select();toast('حدّد الرابط لنسخه يدويًا.');} });
  $('#sources-open').addEventListener('click',()=>showDialog($('#sources-dialog')));
  document.addEventListener('visibilitychange',()=> {if(!document.hidden)checkDate();});
  if('IntersectionObserver' in window) {
    const links=[...document.querySelectorAll('.mobile-nav a')];
    const observer=new IntersectionObserver(entries=> {const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!active)return;const target=active.target.classList.contains('hero')?'#main':'#'+active.target.id;links.forEach(link=> {const current=link.getAttribute('href')===target;link.classList.toggle('is-active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-12% 0px -45% 0px',threshold:[0,.1,.3]});
    ['.hero','#adhkar','#quran','#dua'].forEach(selector=> {const target=$(selector);if(target)observer.observe(target);});
  }
  render(); renderDuas();
})();
