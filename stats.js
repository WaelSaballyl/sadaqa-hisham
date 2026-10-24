'use strict';
// Anonymous tallies for the owner's private dashboard (dashboard.html).
// Only numbers are sent: no names, accounts, IPs or device ids are stored.
// While apiKey is empty nothing is sent and the site works exactly the same.
const STATS_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

(() => {
  if (!STATS_FIREBASE.apiKey) return;

  // Every counter the dashboard knows. firestore.rules allows exactly these fields.
  const DUA_IDS = ['forgiveness','purification','paradise','quran','grave-light','living-dead','merciful','reward-guidance','general'];
  const DHIKR_IDS = ['sayyid','protection','ikhlas','falaq','nas','praise','istighfar','salam','tahlil','tasbih','tahmid','takbir','hundred','kursi','bismika','side'];
  const QUICK_SURAHS = {1:'fatiha',2:'baqarah',112:'ikhlas',113:'falaq',114:'nas'};
  const key = s => s.replace(/-/g, '_');

  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
  const seenKey = 'sadaqah-stats-seen-' + day;
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(seenKey)) || {}; } catch {}
  const pending = {};
  let timer = null;

  function add(field, n = 1) { pending[field] = (pending[field] || 0) + n; schedule(); }
  // A "person" is counted once per day per device for each kind of action.
  function once(field) {
    if (seen[field]) return;
    seen[field] = 1;
    try { localStorage.setItem(seenKey, JSON.stringify(seen)); } catch {}
    add(field);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(flush, 2500); }

  once('visits');
  document.addEventListener('sadaqa:count', ({ detail: d }) => {
    if (d.type === 'amen' && DUA_IDS.includes(d.id)) { add('amen_total'); add('amen_' + key(d.id)); once('people_amen'); }
    if (d.type === 'dhikr' && DHIKR_IDS.includes(d.id)) {
      add('taps_total'); once('people_dhikr'); once('cat_' + d.category);
      if (d.done) add('done_' + d.id);
    }
    if (d.type === 'surah') { add('surah_' + (QUICK_SURAHS[d.surah] || 'other')); once('people_quran'); }
    if (d.type === 'audio') add('audio_total');
    if (d.type === 'install') add('installs');
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-share],#copy-link')) add('shares'); });

  let db = null;
  async function flush() {
    const fields = Object.keys(pending);
    if (!fields.length) return;
    const batch = {};
    fields.forEach(f => { batch[f] = pending[f]; delete pending[f]; });
    try {
      const { fs, store } = await (db ||= connect());
      const inc = {};
      for (const f in batch) inc[f] = fs.increment(batch[f]);
      const b = fs.writeBatch(store);
      b.set(fs.doc(store, 'stats', 'all'), inc, { merge: true });
      b.set(fs.doc(store, 'days', day), inc, { merge: true });
      await b.commit();
    } catch {
      db = null;
      for (const f in batch) pending[f] = (pending[f] || 0) + batch[f];
    }
  }
  async function connect() {
    const [{ initializeApp, getApps }, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
    ]);
    return { fs, store: fs.getFirestore(getApps()[0] || initializeApp(STATS_FIREBASE)) };
  }
  // Send what's left when the person leaves or switches app.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
})();
