'use strict';

/* ══════════════════════════════════════════════════════════
   INTRO
   FIX: class-based fade instead of keyframe with
        non-animatable pointer-events:none
   ══════════════════════════════════════════════════════════ */
setTimeout(function () {
  document.getElementById('intro').classList.add('fade-out');
}, 3600);

/* ══════════════════════════════════════════════════════════
   MUSIC TOGGLE
   ══════════════════════════════════════════════════════════ */
var musBtn = document.getElementById('mus');
musBtn.addEventListener('click', function () {
  musBtn.classList.toggle('paused');
  /* To add real audio:
     1. Add <audio id="bg-music" loop src="your-song.mp3"></audio>
     2. Uncomment below:
  var audio = document.getElementById('bg-music');
  if(musBtn.classList.contains('paused')) audio.pause();
  else audio.play().catch(function(){}); // .catch ignores autoplay policy
  */
});

/* ══════════════════════════════════════════════════════════
   CURSOR
   FIX: only activated on pointer-fine (mouse) devices —
        phones & tablets keep the default cursor
   ══════════════════════════════════════════════════════════ */
(function initCursor() {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  document.body.classList.add('has-cursor');
  var cur = document.getElementById('cur');
  var curR = document.getElementById('cur-r');
  var mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });
  (function loop() {
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    curR.style.left = rx + 'px';
    curR.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
})();

/* ══════════════════════════════════════════════════════════
   IMAGE LIST  (37 photos)
   URL-encode the space (%20) so every server/CDN handles it correctly.
   ══════════════════════════════════════════════════════════ */
var imgs = Array.from({ length: 37 }, function (_, i) {
  return 'img/img%20(' + (i + 1) + ').jpg';
});

/* ══════════════════════════════════════════════════════════
   IMAGE ERROR HANDLER
   FIX: when img/… files are missing (e.g. first deploy),
        replace the broken img with a gradient placeholder
   ══════════════════════════════════════════════════════════ */
var GRAD = [
  'linear-gradient(135deg,#1a0d2e,#c9876a)',
  'linear-gradient(135deg,#0d0619,#e8c278)',
  'linear-gradient(135deg,#110b1e,#f0b8cc)',
  'linear-gradient(135deg,#1e0a17,#c9876a)',
];
var EMOJ = ['✦', '♡', '🌸', '✨'];
function addFallback(img, idx, forPolaroid) {
  img.onerror = function () {
    this.style.display = 'none';
    var parent = this.parentElement;
    if (!parent || parent.querySelector('.img-ph')) return;
    if (forPolaroid) {
      // polaroid: placeholder fills the img's slot (square)
      var ph = document.createElement('div');
      ph.className = 'img-ph-pol';
      ph.style.background = GRAD[idx % GRAD.length];
      ph.textContent = EMOJ[idx % EMOJ.length];
      parent.insertBefore(ph, this);
    } else {
      // stretched (masonry / carousel / hero)
      var ph = document.createElement('div');
      ph.className = 'img-ph';
      ph.style.cssText = 'background:' + GRAD[idx % GRAD.length];
      ph.textContent = EMOJ[idx % EMOJ.length];
      parent.style.position = 'relative';
      parent.appendChild(ph);
    }
  };
}
// Hero image fallback
(function () {
  var heroImg = document.querySelector('.hero-ri img');
  if (heroImg) addFallback(heroImg, 0, false);
  var wishImg = document.querySelector('.wf img');
  if (wishImg) addFallback(wishImg, 11, false);
})();

/* ══════════════════════════════════════════════════════════
   PARTICLES
   Reduce count on mobile so the GPU budget goes to the 3D carousel.
   ══════════════════════════════════════════════════════════ */
var cv = document.getElementById('pc');
var ctx = cv.getContext('2d');
var W = cv.width = window.innerWidth;
var H = cv.height = window.innerHeight;

/* 45 on phone, 65 on tablet, 90 on desktop */
var ptCount = W < 480 ? 45 : W < 900 ? 65 : 90;

var pts = Array.from({ length: ptCount }, function () {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.3 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -(Math.random() * 0.35 + 0.08),
    a: 0.1 + Math.random() * 0.45,
    c: ['#e8c278', '#f0b8cc', '#c9876a', '#ffffff'][Math.floor(Math.random() * 4)]
  };
});
function drawPts() {
  ctx.clearRect(0, 0, W, H);
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.c; ctx.globalAlpha = p.a; ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawPts);
}
drawPts();

/* FIX: debounced resize — avoids layout thrash on every resize event */
var resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    setCarHeight(); // re-apply carousel height
  }, 150);
}, { passive: true });

/* ══════════════════════════════════════════════════════════
   ANIMATION RESTART — iOS / Android Safari pause animations
   when the tab is hidden or the app goes to background.
   Force-restart them when the page becomes visible again.
   ══════════════════════════════════════════════════════════ */
function restartAnimations() {
  var els = document.querySelectorAll('.car-ring, .band-t, .ftrack, .b, #mus .bar, .ch');
  els.forEach(function (el) {
    /* Toggling animation-name forces the browser to restart the animation */
    var anim = el.style.animationName;
    el.style.animationName = 'none';
    /* offsetHeight triggers a reflow/repaint so the change takes effect */
    void el.offsetHeight;
    el.style.animationName = anim || '';
  });
}
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) restartAnimations();
});
/* Also cover window focus (e.g. returning from another app on Android) */
window.addEventListener('focus', restartAnimations, { passive: true });

/* ══════════════════════════════════════════════════════════
   BALLOONS
   ══════════════════════════════════════════════════════════ */
var blEl = document.getElementById('bl');
['🎈', '🎀', '🎊', '🎉', '✨', '💖', '🌸', '🎂'].forEach(function (em, i) {
  var d = document.createElement('div');
  d.className = 'b'; d.textContent = em;
  d.style.cssText =
    'left:' + (8 + i * 12) + '%;' +
    'animation-duration:' + (9 + i * 1.7) + 's;' +
    'animation-delay:' + (i * 0.9 + 1) + 's;' +
    'font-size:' + (1.4 + Math.random()) + 'rem';
  blEl.appendChild(d);
});

/* ══════════════════════════════════════════════════════════
   3D CAROUSEL
   FIX: responsive radius so items don't overflow on phones.
        Also sets --car-h CSS custom property so scene height
        matches the perspective depth.
   ══════════════════════════════════════════════════════════ */
var carRing = document.getElementById('carRing');
var carIdx = [0, 4, 8, 12, 16, 20, 24, 28];
var carN = carIdx.length;

function getCarRadius() {
  var w = window.innerWidth;
  if (w < 480) return 165;
  if (w < 768) return 230;
  return 320;
}
function setCarHeight() {
  var scene = document.querySelector('.car-scene');
  if (!scene) return;
  var h = window.innerWidth < 480 ? 280 : 360;
  scene.style.setProperty('--car-h', h + 'px');
}
setCarHeight();

var carRadius = getCarRadius();
carIdx.forEach(function (imgIdx, i) {
  var div = document.createElement('div');
  div.className = 'car-item';
  div.setAttribute('role', 'button');
  div.setAttribute('aria-label', 'Open photo ' + (imgIdx + 1));
  var angle = (360 / carN) * i;
  div.style.transform = 'rotateY(' + angle + 'deg) translateZ(' + carRadius + 'px)';
  var img = document.createElement('img');
  img.src = imgs[imgIdx]; img.alt = 'Anuskha'; img.loading = 'lazy';
  addFallback(img, imgIdx, false);
  div.appendChild(img);
  div.addEventListener('click', function () { openLB(imgIdx); });
  carRing.appendChild(div);
});

/* ══════════════════════════════════════════════════════════
   POLAROID WALL
   FIX: added touch tilt (touchmove) alongside mouse tilt
   ══════════════════════════════════════════════════════════ */
var polWall = document.getElementById('polWall');
var polIdx = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
var polRots = [-8, 5, -12, 7, -3, 10, -6, 4, -14, 8, -2, 11];
var polCaps = ['Always smiling', 'Pure joy', 'Golden moments', 'Radiant', 'Sun-kissed', 'Living fully', 'Pure magic', 'Effortlessly her', 'Sunshine girl', 'Glowing', 'Beautiful soul', 'Simply her'];

polIdx.forEach(function (imgIdx, i) {
  var div = document.createElement('div');
  var rot = polRots[i];
  div.className = 'polaroid';
  div.setAttribute('role', 'listitem');
  div.setAttribute('aria-label', polCaps[i]);
  div.style.setProperty('--rot', rot + 'deg');
  div.style.setProperty('--delay', (0.08 * i) + 's');

  var pin = document.createElement('div'); pin.className = 'pin'; pin.setAttribute('aria-hidden', 'true');
  var img = document.createElement('img');
  img.src = imgs[imgIdx]; img.alt = polCaps[i]; img.loading = 'lazy';
  addFallback(img, imgIdx, true);
  var cap = document.createElement('div'); cap.className = 'pcap'; cap.textContent = polCaps[i];
  var glare = document.createElement('div'); glare.className = 'p-glare'; glare.setAttribute('aria-hidden', 'true');
  div.append(pin, img, cap, glare);

  function applyTilt(nx, ny, scale) {
    div.style.transform = 'rotate(' + rot + 'deg) rotateX(' + (-nx * 18) + 'deg) rotateY(' + (ny * 18) + 'deg) scale(' + scale + ') translateZ(30px)';
    div.style.boxShadow = '0 30px 90px rgba(0,0,0,.8), 0 4px 20px rgba(232,194,120,.3)';
    div.style.zIndex = '50';
    glare.style.setProperty('--gx', (50 + ny * 100) + '%');
    glare.style.setProperty('--gy', (50 + nx * 100) + '%');
    glare.style.opacity = '1';
  }
  function resetTilt() {
    div.style.transform = 'rotate(' + rot + 'deg) translateZ(0)';
    div.style.boxShadow = '';
    div.style.zIndex = '';
    glare.style.opacity = '0';
  }

  /* mouse tilt */
  div.addEventListener('mousemove', function (e) {
    var rect = div.getBoundingClientRect();
    applyTilt((e.clientY - rect.top) / rect.height - 0.5, (e.clientX - rect.left) / rect.width - 0.5, 1.12);
  });
  div.addEventListener('mouseleave', resetTilt);

  /* FIX: touch tilt — works the same way with touch coordinates */
  div.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    var rect = div.getBoundingClientRect();
    applyTilt((touch.clientY - rect.top) / rect.height - 0.5, (touch.clientX - rect.left) / rect.width - 0.5, 1.06);
  }, { passive: true });
  div.addEventListener('touchend', resetTilt, { passive: true });

  div.addEventListener('click', function () { openLB(imgIdx); });
  polWall.appendChild(div);
});

/* ══════════════════════════════════════════════════════════
   MASONRY GRID
   ══════════════════════════════════════════════════════════ */
var mgrid = document.getElementById('mgrid');
var canHover = window.matchMedia('(hover:hover)').matches;

imgs.forEach(function (src, i) {
  var d = document.createElement('div');
  d.className = 'mi';
  d.setAttribute('role', 'listitem');
  d.setAttribute('aria-label', 'Photo ' + (i + 1));
  d.style.setProperty('--delay', ((i % 8) * 0.075) + 's');

  var img = document.createElement('img');
  img.src = src; img.alt = 'Anuskha'; img.loading = 'lazy';
  if ('decoding' in img) img.decoding = 'async';
  addFallback(img, i, false);

  var glare = document.createElement('div'); glare.className = 'mi-glare'; glare.setAttribute('aria-hidden', 'true');
  var ov = document.createElement('div'); ov.className = 'mi-ov'; ov.setAttribute('aria-hidden', 'true');
  var num = document.createElement('div'); num.className = 'mi-num'; num.setAttribute('aria-hidden', 'true');
  num.textContent = String(i + 1).padStart(2, '0');
  var heart = document.createElement('div'); heart.className = 'mi-heart'; heart.setAttribute('aria-hidden', 'true');
  heart.textContent = '♡';

  d.append(img, glare, ov, num, heart);

  if (canHover) {
    d.addEventListener('mousemove', function (e) {
      if (!d.classList.contains('mi-in')) return;
      var r = d.getBoundingClientRect();
      glare.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
      glare.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
      var tx = ((e.clientX - r.left) / r.width - 0.5) * 7;
      var ty = ((e.clientY - r.top) / r.height - 0.5) * 7;
      d.style.transition = 'transform .12s ease,box-shadow .12s ease';
      d.style.transform = 'perspective(700px) rotateY(' + tx + 'deg) rotateX(' + (-ty) + 'deg) scale(1.04)';
      d.style.boxShadow = '0 24px 70px rgba(0,0,0,.75),0 0 0 1px rgba(232,194,120,.25)';
      d.style.zIndex = '10';
    });
    d.addEventListener('mouseleave', function () {
      d.style.transition = '';
      d.style.transform = '';
      d.style.boxShadow = '';
      d.style.zIndex = '';
    });
  }
  d.addEventListener('click', function () { openLB(i); });
  mgrid.appendChild(d);
});

/* ══════════════════════════════════════════════════════════
   FILMSTRIP
   FIX: on touch devices — single set only (no duplicate for
        infinite scroll), because CSS turns it into a scroll
        container instead. Less DOM, less memory.
   ══════════════════════════════════════════════════════════ */
var ftEl = document.getElementById('ft');
var isTouch = !window.matchMedia('(hover:hover)').matches;
var filmSet = isTouch ? imgs : imgs.concat(imgs); // duplicate only for desktop auto-scroll

filmSet.forEach(function (src, i) {
  var img = document.createElement('img');
  img.src = src; img.className = 'fi'; img.loading = 'lazy'; img.alt = 'Anuskha';
  img.onerror = function () { this.style.opacity = '0'; this.style.pointerEvents = 'none'; };
  img.addEventListener('click', function () { openLB(i % imgs.length); });
  ftEl.appendChild(img);
});

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
   FIX: no more display:none → display:flex toggle.
        opacity + visibility allow CSS transition to work.
   ══════════════════════════════════════════════════════════ */
var curLB = 0;
var lb = document.getElementById('lb');
var lbImg = document.getElementById('lb-img');
var lbCt = document.getElementById('lb-ct');

function openLB(i) {
  curLB = i;
  lbImg.src = imgs[i];
  lbCt.textContent = (i + 1) + ' of ' + imgs.length;
  lb.classList.add('on');
  document.body.style.overflow = 'hidden';
  document.getElementById('lbX').focus();
}
function closeLB() {
  lb.classList.remove('on');
  document.body.style.overflow = '';
}
function nextLB() {
  curLB = (curLB + 1) % imgs.length;
  lbImg.src = imgs[curLB];
  lbCt.textContent = (curLB + 1) + ' of ' + imgs.length;
}
function prevLB() {
  curLB = (curLB - 1 + imgs.length) % imgs.length;
  lbImg.src = imgs[curLB];
  lbCt.textContent = (curLB + 1) + ' of ' + imgs.length;
}

document.getElementById('lbX').addEventListener('click', closeLB);
document.getElementById('lb-n').addEventListener('click', nextLB);
document.getElementById('lb-p').addEventListener('click', prevLB);
lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });

/* keyboard nav */
document.addEventListener('keydown', function (e) {
  if (!lb.classList.contains('on')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextLB();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevLB();
  if (e.key === 'Escape') closeLB();
});

/* touch swipe in lightbox */
var lbTouchX = null;
lb.addEventListener('touchstart', function (e) {
  if (e.touches.length === 1) lbTouchX = e.touches[0].clientX;
}, { passive: true });
lb.addEventListener('touchend', function (e) {
  if (lbTouchX === null) return;
  var dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 50) {
    if (dx < 0) nextLB(); else prevLB();
  }
  lbTouchX = null;
}, { passive: true });

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ══════════════════════════════════════════════════════════ */
function animateCounter(el, target, dur) {
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var prog = Math.min((ts - start) / dur, 1);
    el.textContent = Math.floor(prog * target);
    if (prog < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════════════════
   INTERSECTION OBSERVERS
   ══════════════════════════════════════════════════════════ */

/* scroll reveal */
document.querySelectorAll('.rv').forEach(function (el) {
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 }).observe(el);
});

/* masonry entrance */
document.querySelectorAll('.mi').forEach(function (el) {
  new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('mi-in'); obs.disconnect(); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -20px 0px' }).observe(el);
});

/* polaroid entrance */
document.querySelectorAll('.polaroid').forEach(function (p, idx) {
  new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        p.style.setProperty('--delay', (idx * 0.07) + 's');
        p.classList.add('pol-in');
        obs.disconnect();
      }
    });
  }, { threshold: 0.15 }).observe(p);
});

/* counter */
var counterEl = document.getElementById('counter');
var cObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) { animateCounter(counterEl, 37, 1400); cObs.disconnect(); }
  });
}, { threshold: 0.5 });
if (counterEl) cObs.observe(counterEl);

/* ══════════════════════════════════════════════════════════
   CLICK CONFETTI
   FIX: requestAnimationFrame before setting transform ensures
        the browser has committed the initial position,
        making the CSS transition fire correctly every time.
   ══════════════════════════════════════════════════════════ */
var confCols = ['#e8c278', '#f0b8cc', '#c9876a', '#fff5f0', '#ffffff', '#ffd700'];
document.addEventListener('click', function (e) {
  if (e.target.closest('#lb')) return;
  for (var i = 0; i < 14; i++) {
    var d = document.createElement('div');
    var angle = Math.random() * Math.PI * 2;
    var dist = 55 + Math.random() * 90;
    var sz = 3 + Math.random() * 6;
    var col = confCols[Math.floor(Math.random() * confCols.length)];
    var dur = 0.45 + Math.random() * 0.4;
    d.style.cssText =
      'position:fixed;pointer-events:none;z-index:9997;' +
      'width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;' +
      'background:' + col + ';' +
      'left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
      'transition:transform ' + dur + 's ease,opacity ' + dur + 's ease';
    document.body.appendChild(d);
    (function (el, a, r) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { // double-rAF guarantees paint before transition
          el.style.transform = 'translate(' + (Math.cos(a) * r) + 'px,' + (Math.sin(a) * r) + 'px)';
          el.style.opacity = '0';
        });
      });
      setTimeout(function () { el.remove(); }, 700);
    })(d, angle, dist);
  }
});
/* ══════════════════════════════════════════════════════════
   GALLERY CATEGORY TABS
   ══════════════════════════════════════════════════════════ */
var tabsEl = document.getElementById('galTabs');
var tabLabels = ['All', 'Outdoors', 'Café Vibes', 'Festive', 'Candid'];
tabLabels.forEach(function (label, idx) {
  var btn = document.createElement('button');
  btn.className = 'gtab' + (idx === 0 ? ' active' : '');
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
  btn.innerHTML = '<span>' + label + '</span>';
  btn.addEventListener('click', function () {
    tabsEl.querySelectorAll('.gtab').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    /* animate reshuffle on masonry */
    var cards = document.querySelectorAll('.mi');
    cards.forEach(function (c, ci) {
      c.style.transition = 'opacity .2s ease, transform .2s ease';
      c.style.opacity = '0';
      c.style.transform = 'scale(.92) translateY(12px)';
      setTimeout(function () {
        c.style.opacity = '';
        c.style.transform = '';
        c.style.transition = '';
      }, 160 + ci * 18);
    });
  });
  tabsEl.appendChild(btn);
});

/* ══════════════════════════════════════════════════════════
   SPOTLIGHT MOSAIC
   ══════════════════════════════════════════════════════════ */
var spotGrid = document.getElementById('spotGrid');
var spotIdxs = [2, 6, 10, 14, 18, 22]; // pick 6 varied images
var spotBadge = ['Garden girl ✦', 'Café soul', 'Festive glow', 'Pure joy', 'Her vibe', 'Always radiant'];
spotIdxs.forEach(function (imgIdx, i) {
  var d = document.createElement('div');
  d.className = 'sg';
  d.style.setProperty('--sd', (i * 0.1) + 's');
  var img = document.createElement('img');
  img.src = imgs[imgIdx]; img.alt = 'Anuskha'; img.loading = 'lazy';
  addFallback(img, imgIdx, false);
  var shine = document.createElement('div'); shine.className = 'sg-shine'; shine.setAttribute('aria-hidden', 'true');
  var badge = document.createElement('div'); badge.className = 'sg-badge'; badge.textContent = spotBadge[i];
  d.append(img, shine, badge);
  if (canHover) {
    d.addEventListener('mousemove', function (e) {
      var r = d.getBoundingClientRect();
      shine.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
      shine.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }
  d.addEventListener('click', function () { openLB(imgIdx); });
  spotGrid.appendChild(d);
});
/* entrance */
document.querySelectorAll('.sg').forEach(function (el) {
  new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('sg-in'); obs.disconnect(); }
    });
  }, { threshold: 0.05 }).observe(el);
});

/* ══════════════════════════════════════════════════════════
   HORIZONTAL DRAG-SCROLL ROWS
   ══════════════════════════════════════════════════════════ */
function buildScrollRow(containerId, idxList) {
  var el = document.getElementById(containerId);
  if (!el) return;
  idxList.forEach(function (imgIdx, pos) {
    var wrap = document.createElement('div');
    wrap.className = 'srow-item';
    var img = document.createElement('img');
    img.src = imgs[imgIdx]; img.alt = 'Anuskha ' + (pos + 1); img.loading = 'lazy';
    addFallback(img, imgIdx, false);
    var num = document.createElement('div');
    num.className = 'snum';
    num.textContent = String(imgIdx + 1).padStart(2, '0');
    num.setAttribute('aria-hidden', 'true');
    wrap.append(img, num);
    wrap.addEventListener('click', function () { openLB(imgIdx); });
    el.appendChild(wrap);
  });
  /* drag to scroll */
  var dragging = false, startX, scrollLeft;
  el.addEventListener('mousedown', function (e) {
    dragging = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft;
    el.style.userSelect = 'none';
  });
  el.addEventListener('mouseleave', function () { dragging = false; el.style.userSelect = ''; });
  el.addEventListener('mouseup', function () { dragging = false; el.style.userSelect = ''; });
  el.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    e.preventDefault();
    var x = e.pageX - el.offsetLeft;
    var walk = (x - startX) * 1.6;
    el.scrollLeft = scrollLeft - walk;
  });
}
/* row 1: photos 25–37 */
buildScrollRow('srow1', [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
/* row 2: photos 1–13 (different set) */
buildScrollRow('srow2', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

/* ══════════════════════════════════════════════════════════
   SPARKLE MOUSE TRAIL
   ══════════════════════════════════════════════════════════ */
if (window.matchMedia('(pointer:fine)').matches) {
  var sparkChars = ['✦', '✧', '·', '⋆', '★', '♡', '✿', '⁕'];
  var sparkCols = ['#e8c278', '#f0b8cc', '#c9876a', '#fff5f0', '#ffd700'];
  var lastSpark = 0;
  document.addEventListener('mousemove', function (e) {
    if (e.target.closest && e.target.closest('#lb')) return;
    var now = Date.now();
    if (now - lastSpark < 60) return;
    lastSpark = now;
    var s = document.createElement('div');
    var sz = 9 + Math.random() * 13;
    s.className = 'sparkle';
    s.textContent = sparkChars[Math.floor(Math.random() * sparkChars.length)];
    s.style.setProperty('--sz', sz + 'px');
    s.style.setProperty('--sc', sparkCols[Math.floor(Math.random() * sparkCols.length)]);
    s.style.left = e.clientX + 'px';
    s.style.top = e.clientY + 'px';
    document.body.appendChild(s);
    requestAnimationFrame(function () {
      var drift = (Math.random() - 0.5) * 65;
      s.style.transform = 'translate(calc(-50% + ' + drift + 'px), -110%) scale(.15) rotate(' + (Math.random() * 180 - 90) + 'deg)';
      s.style.opacity = '0';
    });
    setTimeout(function () { s.remove(); }, 700);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   BLOW CANDLES
   ══════════════════════════════════════════════════════════ */
const button = document.querySelector('.btn-blow');
const flames = document.querySelectorAll('.candle-flame');
const smokes = document.querySelectorAll('.candle-smoke');
const wish = document.querySelector('.wish-made');

if (button) {
  button.addEventListener('click', () => {
    flames.forEach(flame => {
      flame.style.opacity = '0';
    });

    smokes.forEach(smoke => {
      smoke.style.opacity = '1';

      smoke.animate([
        {
          transform: 'translateY(0px) scale(1)',
          opacity: 1
        },
        {
          transform: 'translateY(-40px) scale(2)',
          opacity: 0
        }
      ], {
        duration: 2000,
        easing: 'ease-out'
      });
    });

    if (wish) wish.classList.add('show');

    createConfetti();

    button.innerText = 'Wished ✨';
    button.disabled = true;

  });
}

/* ===============================
   CONFETTI
================================ */
function createConfetti() {
  const emojis = ['✨', '💖', '🎉', '🎊', '💫'];

  for (let i = 0; i < 80; i++) {
    const spark = document.createElement('div');
    spark.className = 'sparkle';
    spark.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
    spark.style.left = window.innerWidth / 2 + 'px';
    spark.style.top = window.innerHeight / 2 + 'px';
    spark.style.setProperty('--x', (Math.random() * 800 - 400) + 'px');
    spark.style.setProperty('--y', (Math.random() * 600 - 300) + 'px');
    document.body.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 800);
  }
}
