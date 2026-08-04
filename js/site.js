/* אלון שמש - site interactions */
(function () {
  'use strict';

  // sticky header shadow
  var header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // mobile menu - the drawer covers 75% of the screen, the rest dims and closes on tap
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    var scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    document.body.appendChild(scrim);
    toggle.setAttribute('aria-expanded', 'false');
    var setNav = function (open) {
      nav.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      scrim.classList.toggle('on', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    scrim.addEventListener('click', function () { setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setNav(false);
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

  // shared lightbox - built on first use (certificates, and clinic photos on mobile)
  var lbx = null, lbxImg, lbxCap, lbxClose, lbxLast = null;
  function buildLbx() {
    if (lbx) return;
    lbx = document.createElement('div');
    lbx.className = 'lbx';
    lbx.setAttribute('role', 'dialog');
    lbx.setAttribute('aria-modal', 'true');
    lbx.setAttribute('aria-label', 'תמונה בתצוגה מוגדלת');
    lbx.innerHTML =
      '<button class="lbx-close" type="button" aria-label="סגירת התצוגה">✕</button>' +
      '<figure><img src="" alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lbx);
    lbxImg = lbx.querySelector('img');
    lbxCap = lbx.querySelector('figcaption');
    lbxClose = lbx.querySelector('.lbx-close');
    lbx.addEventListener('click', function (e) {
      if (e.target === lbx || lbxClose.contains(e.target)) closeLbx();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lbx.classList.contains('open')) closeLbx();
    });
  }
  function openLbx(src, alt, caption, origin) {
    buildLbx();
    lbxImg.src = src;
    lbxImg.alt = alt || '';
    lbxCap.textContent = caption || '';
    lbxLast = origin || null;
    lbx.classList.add('open');
    document.body.classList.add('lbx-open');
    lbxClose.focus();
  }
  function closeLbx() {
    lbx.classList.remove('open');
    document.body.classList.remove('lbx-open');
    if (lbxLast) lbxLast.focus();
  }

  // certificates - the full-size scan loads only on click
  document.querySelectorAll('.cert-shot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var thumb = btn.querySelector('img');
      openLbx(btn.getAttribute('data-full'), thumb ? thumb.alt : '',
              btn.getAttribute('data-caption'), btn);
    });
  });

  // clinic photos - on mobile the pair is tiny, so a tap opens the photo full screen
  var clinicShots = document.querySelectorAll('.clinic-frame img');
  if (clinicShots.length && window.matchMedia) {
    var mqZoom = window.matchMedia('(max-width:860px)');
    clinicShots.forEach(function (img) {
      var frame = img.parentElement;
      var cap = frame.querySelector('figcaption');
      var hint = document.createElement('span');
      hint.className = 'fr-zoom';
      hint.setAttribute('aria-hidden', 'true');
      hint.textContent = '⤢';
      function open() {
        if (!mqZoom.matches) return;
        openLbx(img.currentSrc || img.src, img.alt, cap ? cap.textContent : '', img);
      }
      function sync() {
        if (mqZoom.matches) {
          if (!hint.parentElement) frame.appendChild(hint);
          img.setAttribute('role', 'button');
          img.setAttribute('tabindex', '0');
          img.setAttribute('aria-label', 'הגדלת התמונה: ' + (cap ? cap.textContent : img.alt));
        } else {
          if (hint.parentElement) frame.removeChild(hint);
          img.removeAttribute('role');
          img.removeAttribute('tabindex');
          img.removeAttribute('aria-label');
        }
      }
      img.addEventListener('click', open);
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
      sync();
      if (mqZoom.addEventListener) mqZoom.addEventListener('change', sync);
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

  // mobile card slider - a card grid becomes one auto-rotating card on phones
  var msMq = window.matchMedia('(max-width:640px)');
  document.querySelectorAll('[data-mslider]').forEach(function (box) {
    var track = box.querySelector('.ms-track');
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    if (cards.length < 2) return;
    var delay = parseInt(box.getAttribute('data-interval'), 10) || 3000;
    var rtl = getComputedStyle(document.documentElement).direction === 'rtl';
    var idx = 0, timer = null, live = false;

    var dots = document.createElement('div');
    dots.className = 'ms-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', box.getAttribute('data-label') || 'מעבר בין כרטיסים');
    cards.forEach(function (c, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'כרטיס ' + (k + 1) + ' מתוך ' + cards.length);
      b.addEventListener('click', function () { show(k); play(); });
      dots.appendChild(b);
    });
    box.appendChild(dots);
    var btns = dots.querySelectorAll('button');

    function show(n) {
      idx = (n + cards.length) % cards.length;
      // RTL flows right-to-left, so advancing moves the track the other way.
      // each step is one card (100%) plus the gap that separates it from the next.
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var dir = rtl ? 1 : -1;
      track.style.transform = 'translateX(calc(' + (dir * idx * 100) + '% + ' + (dir * idx * gap) + 'px))';
      btns.forEach(function (b, k) {
        b.classList.toggle('on', k === idx);
        b.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function play() {
      stop();
      if (!live || reduceMotion) return;
      timer = setInterval(function () { show(idx + 1); }, delay);
    }
    function sync() {
      if (msMq.matches === live) return;
      live = msMq.matches;
      box.classList.toggle('ms-on', live);
      if (live) {
        // off-screen cards never trip the reveal observer - show them upfront
        cards.forEach(function (c) { c.classList.add('in'); });
        show(0);
        play();
      } else {
        stop();
        track.style.transform = '';
      }
    }

    box.addEventListener('touchstart', stop, { passive: true });
    box.addEventListener('touchend', play, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { play(); }
    });
    sync();
    if (msMq.addEventListener) msMq.addEventListener('change', sync);
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

  // ---------- podcast players ----------
  // נגן מותאם לכל פרק: preload="none" כדי שקובץ של 20MB לא ירד בטעינת העמוד,
  // רק פרק אחד מתנגן בכל רגע, ומיקום ההאזנה נשמר ב-localStorage כדי לחזור לאותו מקום.
  var RATES = [1, 1.25, 1.5, 1.75, 2];

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function initEpisode(ep, all) {
    var audio = ep.querySelector('[data-audio]');
    if (!audio) return;
    var bar = ep.querySelector('[data-bar]');
    var prog = ep.querySelector('[data-prog]');
    var buf = ep.querySelector('[data-buf]');
    var cur = ep.querySelector('[data-cur]');
    var durEl = ep.querySelector('[data-dur]');
    var rateBtn = ep.querySelector('[data-rate]');
    var storeKey = 'alon-pod-' + audio.getAttribute('data-key');
    var rateIdx = 0, seeking = false, restored = false;

    function duration() {
      return isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : parseFloat(bar.getAttribute('aria-valuemax')) || 0;
    }

    function paint() {
      var d = duration();
      var pct = d ? Math.min(100, (audio.currentTime / d) * 100) : 0;
      prog.style.width = pct + '%';
      cur.textContent = fmt(audio.currentTime);
      bar.setAttribute('aria-valuenow', Math.round(audio.currentTime));
      bar.setAttribute('aria-valuetext', fmt(audio.currentTime) + ' מתוך ' + fmt(d));
    }

    function paintBuffered() {
      var d = duration();
      if (!d || !audio.buffered.length) return;
      buf.style.width = Math.min(100, (audio.buffered.end(audio.buffered.length - 1) / d) * 100) + '%';
    }

    // חזרה למקום שבו הפסקנו - רק אם באמת נעצרנו באמצע הפרק
    function restore() {
      if (restored) return;
      restored = true;
      var saved = parseFloat(localStorage.getItem(storeKey) || '0');
      var d = duration();
      if (saved > 30 && d && saved < d - 30) audio.currentTime = saved;
    }

    ep.querySelectorAll('[data-pp]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (audio.paused) {
          all.forEach(function (o) { if (o !== audio) o.pause(); });
          restore();
          audio.play();
        } else {
          audio.pause();
        }
      });
    });

    ep.querySelectorAll('[data-skip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        restore();
        audio.currentTime = Math.max(0, Math.min(duration(), audio.currentTime + (+btn.getAttribute('data-skip'))));
        paint();
      });
    });

    if (rateBtn) {
      rateBtn.addEventListener('click', function () {
        rateIdx = (rateIdx + 1) % RATES.length;
        audio.playbackRate = RATES[rateIdx];
        rateBtn.textContent = RATES[rateIdx] + '×';
      });
    }

    // גרירה / לחיצה על ציר הזמן (הציר תמיד LTR, גם באתר RTL)
    function seekTo(clientX) {
      var r = bar.getBoundingClientRect();
      var ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      restored = true;                       // בחירה ידנית גוברת על המיקום השמור
      audio.currentTime = ratio * duration();
      paint();
    }
    bar.addEventListener('pointerdown', function (e) {
      seeking = true;
      bar.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
    });
    bar.addEventListener('pointermove', function (e) { if (seeking) seekTo(e.clientX); });
    bar.addEventListener('pointerup', function () { seeking = false; });
    bar.addEventListener('pointercancel', function () { seeking = false; });
    bar.addEventListener('keydown', function (e) {
      var step = e.key === 'PageUp' || e.key === 'PageDown' ? 60 : 10;
      var dir = (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') ? 1
              : (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') ? -1 : 0;
      if (!dir && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      restored = true;
      if (e.key === 'Home') audio.currentTime = 0;
      else if (e.key === 'End') audio.currentTime = duration();
      else audio.currentTime = Math.max(0, Math.min(duration(), audio.currentTime + dir * step));
      paint();
    });

    audio.addEventListener('loadedmetadata', function () {
      if (durEl && isFinite(audio.duration)) durEl.textContent = fmt(audio.duration);
      bar.setAttribute('aria-valuemax', Math.round(duration()));
      restore();
      paint();
    });
    audio.addEventListener('timeupdate', function () {
      paint();
      if (!seeking && audio.currentTime > 5) localStorage.setItem(storeKey, audio.currentTime);
    });
    audio.addEventListener('progress', paintBuffered);
    // התווית של כפתור הנגינה מתחלפת בין "השמעת..." ל"עצירת...", כדי שקורא מסך
    // ידע מה המצב הנוכחי ולא רק מה הפעולה
    var ppBtns = ep.querySelectorAll('[data-pp]');
    ppBtns.forEach(function (b) {
      b.setAttribute('data-label', (b.getAttribute('aria-label') || '').replace(/^השמעת /, ''));
    });
    function label(playing) {
      ppBtns.forEach(function (b) {
        b.setAttribute('aria-label', (playing ? 'עצירת ' : 'השמעת ') + b.getAttribute('data-label'));
      });
    }
    audio.addEventListener('play', function () { ep.classList.add('playing'); label(true); });
    audio.addEventListener('pause', function () { ep.classList.remove('playing'); label(false); });
    audio.addEventListener('ended', function () {
      ep.classList.remove('playing');
      label(false);
      localStorage.removeItem(storeKey);
      audio.currentTime = 0;
      restored = true;
      paint();
    });
  }

  var eps = document.querySelectorAll('[data-ep]');
  if (eps.length) {
    var players = [];
    eps.forEach(function (ep) {
      var a = ep.querySelector('[data-audio]');
      if (a) players.push(a);
    });
    eps.forEach(function (ep) { initEpisode(ep, players); });
  }

  // ---------- הרשמה לעדכון על פרק פודקאסט חדש (MailerLite) ----------
  // ===== להשלמה כשחשבון ה-MailerLite מוכן =====
  // ב-MailerLite: Forms > Embedded forms > צרו טופס > "Code" - בקוד ההטמעה מופיעה כתובת
  // בצורה  https://assets.mailerlite.com/jsonp/<ACCOUNT>/forms/<FORM>/subscribe
  // מעתיקים משם את שני המספרים לכאן. אלה מזהים ציבוריים, לא מפתח API סודי -
  // מפתח API אסור להכניס לקוד צד-לקוח.
  var ML_ACCOUNT = '';
  var ML_FORM = '';

  var subModal = document.getElementById('subModal');
  if (subModal) {
    var subCard = subModal.querySelector('.sub-card');
    var subForm = subModal.querySelector('.sub-form');
    var subDone = subModal.querySelector('.sub-done');
    var subErr = subModal.querySelector('.sub-err');
    var subEmail = subModal.querySelector('#sub-email');
    var subName = subModal.querySelector('#sub-name');
    var subConsent = subModal.querySelector('#sub-consent');
    var subHp = subModal.querySelector('.sub-hp input');
    var subOpener = null;

    function subOpen(origin) {
      subOpener = origin || null;
      subModal.hidden = false;
      document.body.classList.add('sub-open');
      requestAnimationFrame(function () { subModal.classList.add('open'); });
      setTimeout(function () { subEmail.focus(); }, 60);
    }
    function subClose() {
      subModal.classList.remove('open');
      document.body.classList.remove('sub-open');
      setTimeout(function () {
        subModal.hidden = true;
        // איפוס, כדי שפתיחה חוזרת תתחיל מטופס נקי ולא ממסך התודה
        subForm.hidden = false;
        subDone.hidden = true;
        subForm.classList.remove('busy');
        subErr.hidden = true;
        subForm.reset();
        [subEmail, subConsent].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      }, 250);
      if (subOpener) subOpener.focus();
    }

    document.querySelectorAll('[data-sub-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { subOpen(btn); });
    });
    subModal.querySelectorAll('[data-sub-close]').forEach(function (btn) {
      btn.addEventListener('click', subClose);
    });
    subModal.addEventListener('click', function (e) {
      if (e.target === subModal) subClose();
    });
    document.addEventListener('keydown', function (e) {
      if (subModal.hidden) return;
      if (e.key === 'Escape') { subClose(); return; }
      if (e.key !== 'Tab') return;
      // מלכודת פוקוס - החלון מודאלי, הטאב לא אמור לברוח לעמוד שמאחור
      var f = subCard.querySelectorAll('button,input,a[href],[tabindex]:not([tabindex="-1"])');
      f = [].filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    function subFail(msg, field) {
      subErr.textContent = msg;
      subErr.hidden = false;
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    }

    subForm.addEventListener('submit', function (e) {
      e.preventDefault();
      subErr.hidden = true;
      [subEmail, subConsent].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      if (subHp && subHp.value) return;                       // בוט מילא את ה-honeypot
      var email = subEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return subFail('נראה שכתובת המייל לא תקינה. אפשר לבדוק אותה שוב?', subEmail);
      }
      if (!subConsent.checked) {
        return subFail('צריך לאשר קבלת עדכונים כדי שנוכל לשלוח לכם הודעה על פרק חדש.', subConsent);
      }

      function subSucceed() {
        subForm.hidden = true;
        subDone.hidden = false;
        subDone.querySelector('.btn').focus();
      }

      if (!ML_ACCOUNT || !ML_FORM) {
        // הטופס עוד לא חובר ל-MailerLite - בפריוויו מציגים את חוויית המשתמש המלאה,
        // בדיוק כמו טופס יצירת הקשר שעדיין דמו
        console.warn('[subscribe] MailerLite not configured - set ML_ACCOUNT / ML_FORM in js/site.js');
        subSucceed();
        return;
      }

      var fd = new FormData();
      fd.append('fields[email]', email);
      fd.append('fields[name]', subName.value.trim());
      fd.append('ml-submit', '1');
      fd.append('anticsrf', 'true');
      subForm.classList.add('busy');
      fetch('https://assets.mailerlite.com/jsonp/' + ML_ACCOUNT + '/forms/' + ML_FORM + '/subscribe',
            { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          subForm.classList.remove('busy');
          if (data && data.success) subSucceed();
          else subFail('משהו השתבש בהרשמה. אפשר לנסות שוב, או לשלוח מייל ל-alonsms73@gmail.com');
        })
        .catch(function () {
          subForm.classList.remove('busy');
          subFail('לא הצלחנו להתחבר כרגע. אפשר לנסות שוב, או לשלוח מייל ל-alonsms73@gmail.com');
        });
    });
  }

  // lead form -> contact.php -> mail to Alon
  var form = document.getElementById('leadForm');
  if (form) {
    var statusEl = document.getElementById('formStatus');
    var btn = form.querySelector('button[type=submit]');
    var btnText = btn ? btn.textContent : '';
    var renderedAt = Date.now();

    // GitHub Pages / file:// have no PHP - keep the preview demo-friendly
    var DEMO = location.protocol === 'file:' || /github\.io$/i.test(location.hostname);

    function say(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
    }

    function done() {
      form.reset();
      say('תודה! הפרטים התקבלו. אלון יחזור אליכם בהקדם לשיחת היכרות.', 'ok');
      renderedAt = Date.now();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      if (btn) { btn.disabled = true; btn.textContent = 'שולח...'; }
      say('');

      function release() {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
      }

      if (DEMO) {
        setTimeout(function () { release(); done(); }, 400);
        return;
      }

      var data = new FormData(form);
      data.append('t', String(renderedAt));
      data.append('page', location.pathname);

      fetch('contact.php', { method: 'POST', body: data })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          release();
          if (res && res.ok) done();
          else say((res && res.error) || 'השליחה נכשלה. אפשר להתקשר ל-054-3333265.', 'err');
        })
        .catch(function () {
          release();
          say('לא הצלחנו לשלוח כרגע. אפשר להתקשר ל-054-3333265 או לשלוח מייל ל-alonsms73@gmail.com', 'err');
        });
    });
  }
})();
