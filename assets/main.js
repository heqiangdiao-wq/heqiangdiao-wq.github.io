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

/* ============================================================
   Hero：粒子网络
   纯装饰。三重保护，任何一条不满足就不启动：
   1) 系统开启「减少动态」→ 不跑
   2) 设备内存 / CPU 过弱 → 不跑
   3) 没有 canvas 2d 上下文 → 不跑
   页面本身不依赖它，关掉也完全正常。
   ============================================================ */
(function () {
  'use strict';

  var cv = document.querySelector('.hero-canvas');
  if (!cv || !cv.getContext) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var nav = window.navigator || {};
  if (nav.deviceMemory && nav.deviceMemory < 4) return;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return;

  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var host = cv.parentNode;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var pts = [];
  var w = 0, h = 0, raf = 0, running = false;
  var mouse = { x: -999, y: -999 };
  var LINK = 132;

  function resize() {
    var r = host.getBoundingClientRect();
    w = Math.round(r.width);
    h = Math.round(r.height);
    if (!w || !h) return false;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.round(Math.min(70, Math.max(24, (w * h) / 17000)));
    pts = [];
    for (var i = 0; i < target; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.3 + 0.7
      });
    }
    return true;
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    var i, j, p, q, dx, dy, d2, d;

    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      /* 鼠标轻微排斥，制造交互感 */
      dx = p.x - mouse.x;
      dy = p.y - mouse.y;
      d2 = dx * dx + dy * dy;
      if (d2 < 6400 && d2 > 1) {
        d = Math.sqrt(d2);
        p.x += (dx / d) * 0.5;
        p.y += (dy / d) * 0.5;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.284);
      ctx.fillStyle = 'rgba(47,93,71,.42)';
      ctx.fill();
    }

    for (i = 0; i < pts.length; i++) {
      for (j = i + 1; j < pts.length; j++) {
        p = pts[i]; q = pts[j];
        dx = p.x - q.x; dy = p.y - q.y;
        d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        d = Math.sqrt(d2);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = 'rgba(47,93,71,' + (0.13 * (1 - d / LINK)).toFixed(3) + ')';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    if (!resize()) return;
    running = true;
    cv.classList.add('on');
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
  }

  if (!resize()) return;
  cv.classList.add('on');

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) start(); else stop(); });
    }, { threshold: 0.02 }).observe(host);
  } else {
    start();
  }

  var rz = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(rz);
    rz = window.setTimeout(function () {
      var was = running;
      stop();
      if (was) start(); else resize();
    }, 220);
  }, { passive: true });

  host.addEventListener('mousemove', function (e) {
    var r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });
  host.addEventListener('mouseleave', function () {
    mouse.x = -999;
    mouse.y = -999;
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
  });
})();
