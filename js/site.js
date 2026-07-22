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
