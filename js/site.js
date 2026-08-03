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

  // photo slider - crossfade on a timer, dots for manual control, pauses on hover
  document.querySelectorAll('[data-slider]').forEach(function (box) {
    var slides = box.querySelectorAll('.sl-slide');
    if (slides.length < 2) return;
    var dots = box.querySelectorAll('.sl-dots button');
    var delay = parseInt(box.getAttribute('data-interval'), 10) || 4500;
    var idx = 0;
    var timer = null;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
      dots.forEach(function (d, k) {
        d.classList.toggle('on', k === idx);
        d.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function play() {
      stop();
      if (reduceMotion) return;
      timer = setInterval(function () { show(idx + 1); }, delay);
    }

    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { show(k); play(); });
    });
    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', play);
    box.addEventListener('focusin', stop);
    box.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { play(); }
    });

    show(0);
    play();
  });

  // ---------- fancy dropdown: upgrades a native <select> ----------
  var NS_CARET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var NS_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var nsSeq = 0;

  function niceSelect(sel) {
    if (sel.dataset.nsReady) return;
    sel.dataset.nsReady = '1';
    nsSeq++;
    var uid = 'ns' + nsSeq;

    var wrap = document.createElement('div');
    wrap.className = 'nselect';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('ns-native');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ns-btn';
    btn.id = uid + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="ns-ico"></span><span class="ns-val" id="' + uid + '-val"></span>' +
                    '<span class="ns-caret">' + NS_CARET + '</span>';

    var panel = document.createElement('div');
    panel.className = 'ns-panel';
    if (sel.dataset.head) {
      var head = document.createElement('div');
      head.className = 'ns-head';
      head.textContent = sel.dataset.head;
      panel.appendChild(head);
    }
    var list = document.createElement('ul');
    list.className = 'ns-list';
    list.id = uid + '-list';
    list.setAttribute('role', 'listbox');
    panel.appendChild(list);

    var opts = Array.prototype.slice.call(sel.options);
    var items = opts.map(function (o, i) {
      var li = document.createElement('li');
      li.className = 'ns-opt' + (o.value === '' ? ' ns-ph' : '');
      li.id = uid + '-o' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.innerHTML = '<span class="oi">' + (o.dataset.ico || '•') + '</span>' +
                     '<span class="ot"></span><span class="ns-check">' + NS_CHECK + '</span>';
      li.querySelector('.ot').textContent = o.textContent.trim();
      list.appendChild(li);
      return li;
    });

    wrap.appendChild(btn);
    wrap.appendChild(panel);

    // label points at the hidden select - route it to the button instead
    var label = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
    if (label) {
      if (!label.id) label.id = uid + '-lbl';
      btn.setAttribute('aria-labelledby', label.id + ' ' + uid + '-val');
      label.addEventListener('click', function (e) { e.preventDefault(); btn.focus(); });
    }

    var open = false, hl = sel.selectedIndex < 0 ? 0 : sel.selectedIndex;

    function paint() {
      var i = sel.selectedIndex < 0 ? 0 : sel.selectedIndex;
      var o = sel.options[i];
      var ico = btn.querySelector('.ns-ico');
      ico.textContent = (o && o.dataset.ico) || '✨';
      ico.className = 'ns-ico t' + (i % 4);
      var val = btn.querySelector('.ns-val');
      val.textContent = o ? o.textContent.trim() : '';
      val.classList.toggle('ph', !o || o.value === '');
      items.forEach(function (li, k) {
        li.classList.toggle('on', k === i);
        li.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
    }

    function highlight(k) {
      hl = Math.max(0, Math.min(items.length - 1, k));
      items.forEach(function (li, n) { li.classList.toggle('hl', n === hl); });
      list.setAttribute('aria-activedescendant', items[hl].id);
      var li = items[hl];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
      }
    }

    function openPanel() {
      if (open) return;
      closeAll();
      open = true;
      var space = window.innerHeight - btn.getBoundingClientRect().bottom;
      wrap.classList.toggle('up', space < 320 && btn.getBoundingClientRect().top > space);
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      highlight(sel.selectedIndex < 0 ? 0 : sel.selectedIndex);
    }

    function closePanel(focusBtn) {
      if (!open) return;
      open = false;
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      items.forEach(function (li) { li.classList.remove('hl'); });
      list.removeAttribute('aria-activedescendant');
      if (focusBtn) btn.focus();
    }
    wrap._nsClose = closePanel;

    function pick(k) {
      sel.selectedIndex = k;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      paint();
      closePanel(true);
    }

    btn.addEventListener('click', function () { open ? closePanel(false) : openPanel(); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!open) { openPanel(); return; }
        if (e.key === 'Enter' || e.key === ' ') { pick(hl); return; }
        highlight(hl + (e.key === 'ArrowDown' ? 1 : -1));
      } else if (e.key === 'Home' && open) { e.preventDefault(); highlight(0); }
      else if (e.key === 'End' && open) { e.preventDefault(); highlight(items.length - 1); }
      else if (e.key === 'Escape') { closePanel(true); }
      else if (e.key === 'Tab') { closePanel(false); }
      else if (e.key.length === 1) {
        var q = e.key.toLowerCase(), from = open ? hl + 1 : 0;
        for (var n = 0; n < items.length; n++) {
          var k = (from + n) % items.length;
          if (sel.options[k].textContent.trim().toLowerCase().indexOf(q) === 0) {
            if (!open) openPanel();
            highlight(k);
            break;
          }
        }
      }
    });

    items.forEach(function (li, k) {
      li.addEventListener('click', function () { pick(k); });
      li.addEventListener('mouseenter', function () { highlight(k); });
    });

    sel.addEventListener('change', paint);
    if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(paint, 0); });
    paint();
  }

  function closeAll(except) {
    document.querySelectorAll('.nselect.open').forEach(function (w) {
      if (w !== except && w._nsClose) w._nsClose(false);
    });
  }
  document.addEventListener('click', function (e) {
    var inside = e.target.closest ? e.target.closest('.nselect') : null;
    closeAll(inside);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
  document.querySelectorAll('select[data-nice], .contact-form select').forEach(niceSelect);

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
