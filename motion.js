'use strict';
// Gentle entrance motion. Content stays fully visible if this file never runs.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion');

  // Name appears word by word, softly coming into focus.
  const title = document.querySelector('#hero-title');
  if (title) {
    let i = 0;
    const wrap = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3 && child.textContent.trim()) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part.trim()) return frag.append(part);
            const w = document.createElement('span');
            w.className = 'word'; w.textContent = part; w.style.setProperty('--d', (0.25 + i++ * 0.28) + 's');
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') wrap(child);
      });
    };
    wrap(title);
  }

  // Sections and cards rise in as they scroll into view, staggered within each group.
  const selector = '.section-heading,.dua-heading,.dua-card,.dhikr-card,.surah-row,.quran-copy,.share-inner,.quick-start-inner>*,.category-tabs,.reading-toolbar';
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('shown');
    io.unobserve(el);
    // Hand the element back to its own styles once it has arrived, so button presses and hovers aren't delayed.
    setTimeout(() => el.classList.remove('reveal', 'shown'), 1100);
  }), { rootMargin: '0px 0px -8% 0px' });
  const prepare = root => {
    const groups = new Map();
    root.querySelectorAll(selector).forEach(el => {
      if (el.classList.contains('reveal')) return;
      const n = groups.get(el.parentElement) || 0;
      groups.set(el.parentElement, n + 1);
      el.style.setProperty('--d', Math.min(n, 4) * 0.08 + 's');
      el.classList.add('reveal');
      io.observe(el);
    });
  };
  const start = () => {
    prepare(document);
    // Lists re-rendered later (switching adhkar tabs) show right away, no waiting on scroll.
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      [node, ...node.querySelectorAll(selector)].forEach(el => { if (el.matches?.(selector)) el.classList.remove('reveal', 'shown'); });
    }))).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
