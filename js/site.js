/* אלון שמש - site interactions */
(function () {
  'use strict';

  // sticky header shadow
  var header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      document.body.classList.toggle('nav-open');
    });
  }

  // mobile: tap parent to open submenu
  document.querySelectorAll('.has-sub > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth <= 1280) {
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var ans = item.querySelector('.faq-a');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  // reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // animated counters
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var plus = el.getAttribute('data-plus') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    function fmt(n) { return plus + n.toLocaleString('en-US') + suffix; }
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var dur = 1600, t0 = null;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var statIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        runCounter(en.target);
        statIo.unobserve(en.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat-num').forEach(function (el) { statIo.observe(el); });

  // accessibility widget
  var accWidget = document.getElementById('accWidget');
  if (accWidget) {
    var accBtn = document.getElementById('accBtn');
    var ACC_KEY = 'alon-acc';
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(ACC_KEY)) || []; } catch (e) {}
    function applyAcc() {
      ['bigtext', 'contrast', 'grayscale', 'links', 'motion'].forEach(function (k) {
        document.documentElement.classList.toggle('acc-' + k, saved.indexOf(k) > -1);
        var btn = accWidget.querySelector('[data-acc="' + k + '"]');
        if (btn) btn.classList.toggle('on', saved.indexOf(k) > -1);
      });
    }
    applyAcc();
    accBtn.addEventListener('click', function () {
      var open = accWidget.classList.toggle('open');
      accBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!accWidget.contains(e.target)) {
        accWidget.classList.remove('open');
        accBtn.setAttribute('aria-expanded', 'false');
      }
    });
    accWidget.querySelectorAll('[data-acc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-acc');
        var i = saved.indexOf(k);
        if (i > -1) saved.splice(i, 1); else saved.push(k);
        try { localStorage.setItem(ACC_KEY, JSON.stringify(saved)); } catch (e) {}
        applyAcc();
      });
    });
    document.getElementById('accReset').addEventListener('click', function () {
      saved = [];
      try { localStorage.removeItem(ACC_KEY); } catch (e) {}
      applyAcc();
    });
  }

  // certificate lightbox - full-size scan loads only on click
  var certBtns = document.querySelectorAll('.cert-shot');
  if (certBtns.length) {
    var lbx = document.createElement('div');
    lbx.className = 'lbx';
    lbx.setAttribute('role', 'dialog');
    lbx.setAttribute('aria-modal', 'true');
    lbx.setAttribute('aria-label', 'תעודה בתצוגה מוגדלת');
    lbx.innerHTML =
      '<button class="lbx-close" type="button" aria-label="סגירת התצוגה">✕</button>' +
      '<figure><img src="" alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lbx);

    var lbxImg = lbx.querySelector('img');
    var lbxCap = lbx.querySelector('figcaption');
    var lbxClose = lbx.querySelector('.lbx-close');
    var lastFocus = null;

    function openLbx(btn) {
      var thumb = btn.querySelector('img');
      lbxImg.src = btn.getAttribute('data-full');
      lbxImg.alt = thumb ? thumb.alt : '';
      lbxCap.textContent = btn.getAttribute('data-caption') || '';
      lastFocus = btn;
      lbx.classList.add('open');
      document.body.classList.add('lbx-open');
      lbxClose.focus();
    }
    function closeLbx() {
      lbx.classList.remove('open');
      document.body.classList.remove('lbx-open');
      if (lastFocus) lastFocus.focus();
    }

    certBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { openLbx(btn); });
    });
    lbx.addEventListener('click', function (e) {
      if (e.target === lbx || lbxClose.contains(e.target)) closeLbx();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lbx.classList.contains('open')) closeLbx();
    });
  }

  // demo form handler (prototype only)
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('תודה! הפרטים נשלחו. אלון יחזור אליכם בהקדם לשיחת היכרות.');
      form.reset();
    });
  }
})();
