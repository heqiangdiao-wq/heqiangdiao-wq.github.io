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
  /* ---- 滚动方向：下滚收起导航、上滚显示；顶部加投影 ---- */
  var topbar = document.querySelector('.topbar');
  var toTop = document.querySelector('.to-top');
  if (toTop) toTop.hidden = false;

  var lastY = window.pageYOffset || 0;
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var goingDown = y > lastY + 4;
    var goingUp = y < lastY - 4;

    if (topbar) {
      if (goingDown && y > 320) topbar.classList.add('hide');
      else if (goingUp || y <= 320) topbar.classList.remove('hide');
      topbar.classList.toggle('stuck', y > 8);
    }
    if (toTop) toTop.classList.toggle('on', y > 720);

    if (goingDown || goingUp) lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var brand = document.querySelector('.brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

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

/* ============================================================
   滚动进场动画
   规则：JS 就绪后才给根元素加 .reveal-ready，
   因此禁用 JS / 老浏览器下内容始终可见。
   ============================================================ */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = [].slice.call(document.querySelectorAll('.sec, .case, .card'));
  if (!targets.length) return;

  targets.forEach(function (el) { el.classList.add('reveal'); });
  document.documentElement.classList.add('reveal-ready');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

  targets.forEach(function (el) { io.observe(el); });
})();
