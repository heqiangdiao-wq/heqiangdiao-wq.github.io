/* ============================================================
   导航高亮 + 阅读进度
   零依赖，只在支持 IntersectionObserver 的浏览器上启用，
   不支持时页面静态可见，不会白屏。
   ============================================================ */
(function () {
  'use strict';

  var navLinks = [].slice.call(document.querySelectorAll('.nav a'));
  if (!navLinks.length) return;

  var byId = {};
  navLinks.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    var el = id && document.getElementById(id);
    if (el) byId[id] = { link: a, el: el };
  });

  /* ---- 阅读进度条 ---- */
  var bar = document.querySelector('.progress i');
  var tick = false;
  function paint() {
    tick = false;
    if (!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    bar.style.width = Math.min(100, Math.max(0, pct * 100)) + '%';
  }
  window.addEventListener('scroll', function () {
    if (!tick) { tick = true; window.requestAnimationFrame(paint); }
  }, { passive: true });
  window.addEventListener('resize', paint, { passive: true });
  paint();

  /* ---- 当前区块高亮 ---- */
  if (!('IntersectionObserver' in window)) return;

  var ids = Object.keys(byId);
  var seen = {};

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      seen[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
    });

    var bestId = null, bestRatio = 0;
    Object.keys(seen).forEach(function (id) {
      if (seen[id] > bestRatio) { bestRatio = seen[id]; bestId = id; }
    });

    navLinks.forEach(function (a) { a.classList.remove('on'); });
    if (bestId && byId[bestId]) byId[bestId].link.classList.add('on');
  }, {
    rootMargin: '-15% 0px -60% 0px',
    threshold: [0, 0.2, 0.5, 1]
  });

  ids.forEach(function (id) { io.observe(byId[id].el); });
})();


