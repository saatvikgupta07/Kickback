/* Kickback_.cal: reads data/*.json and draws the pages. No build step needed. */
(function () {
  var CFG = window.KICKBACK_CONFIG || {};
  var IG = CFG.instagramUrl || 'https://www.instagram.com/kickback_.cal/';
  var VIEWS = ['home', 'about', 'events', 'gallery'];
  var state = { upcoming: [], past: [], photos: [], team: [], loaded: false, failed: false, filter: 'all', selected: '' };

  /* ---------- helpers ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(function (kid) {
        if (kid == null || kid === false) return;
        e.append(kid.nodeType ? kid : document.createTextNode(kid));
      });
    }
    return e;
  }
  function $(s) { return document.querySelector(s); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function court() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 640 360'); s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#court'); s.appendChild(u); return s;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function mon(s) { return parseDate(s).toLocaleDateString('en-IN', { month: 'short' }); }
  function longDate(s) { return parseDate(s).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function upcomingList() {
    var t = todayStr();
    return state.upcoming.filter(function (e) { return e.date && e.date >= t; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  /* ---------- routing ---------- */
  function route() {
    var v = (location.hash || '#home').slice(1);
    if (VIEWS.indexOf(v) < 0) v = 'home';
    document.querySelectorAll('[data-view]').forEach(function (s) { s.hidden = s.getAttribute('data-view') !== v; });
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- upcoming events ---------- */
  function eventCard(e) {
    var dl = h('dl', {});
    [['When', e.time], ['Where', e.venue], ['Entry', e.fee], ['Prize', e.prize]].forEach(function (p) {
      if (p[1]) dl.append(h('div', {}, h('dt', {}, p[0]), h('dd', {}, p[1])));
    });
    return h('article', { class: 'ev' },
      h('div', { class: 'date' }, h('b', {}, String(parseDate(e.date).getDate())), h('span', {}, mon(e.date))),
      h('div', {},
        h('div', { class: 'row' }, h('span', { class: 'chip chip-gold' }, e.sport || 'Event'), h('span', { class: 'chip' }, longDate(e.date))),
        h('h3', {}, e.title),
        e.desc ? h('p', { class: 'muted' }, e.desc) : null,
        dl),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: function () { goRegister(eid(e)); } }, 'Register')));
  }
  function eid(e) { return slug(e.title + '-' + e.date); }
  function emptyEvents() {
    return h('div', { class: 'empty' }, court(),
      h('p', {}, h('strong', {}, 'No event is announced right now.'),
        ' New tournaments are posted here first and on Instagram at @kickback_.cal.'));
  }
  function goRegister(id) {
    state.selected = id || '';
    if (location.hash !== '#events') location.hash = 'events';
    setTimeout(function () { renderReg(); var s = $('#register-sec'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
  function renderEvents() {
    var list = upcomingList(), box = $('#upcoming'), nu = $('#next-up');
    clear(box); clear(nu);
    if (!state.loaded) {
      box.append(h('p', { class: 'muted' }, 'Loading events…'));
      nu.append(h('p', { class: 'muted' }, 'Loading events…'));
    } else if (!list.length) {
      box.append(emptyEvents()); nu.append(emptyEvents());
    } else {
      list.forEach(function (e) { box.append(eventCard(e)); });
      nu.append(eventCard(list[0]));
    }
    renderReg();
  }

  /* ---------- registration ---------- */
  function buildMsg(r) {
    return 'Hi Kickback_.cal! I would like to register for ' + r.eventTitle + '.\nName: ' + r.name + '\nPhone: ' + r.phone +
      '\nCategory: ' + r.category + (r.partner ? '\nPartner: ' + r.partner : '') + (r.notes ? '\nNote: ' + r.notes : '');
  }
  function send(r) {
    if (!CFG.registrationEndpoint) return Promise.resolve(false);
    return fetch(CFG.registrationEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        event: r.eventTitle, name: r.name, phone: r.phone, category: r.category,
        partner: r.partner || '-', notes: r.notes || '-', _subject: 'Kickback_.cal registration: ' + r.eventTitle
      })
    }).then(function (res) { return res.ok; }, function () { return false; });
  }
  function copyText(text, btn, box) {
    function fallback() {
      var rg = document.createRange(); rg.selectNodeContents(box);
      var s = getSelection(); s.removeAllRanges(); s.addRange(rg); btn.textContent = 'Selected, press copy';
    }
    try { navigator.clipboard.writeText(text).then(function () { btn.textContent = 'Copied'; }, fallback); } catch (e) { fallback(); }
  }
  function renderReg() {
    var p = $('#reg-panel'); if (!p) return;
    if (p.getAttribute('data-done') === '1') return;
    clear(p);
    var list = upcomingList();
    if (!list.length) {
      p.append(h('p', {}, 'Registration opens as soon as an event is announced. Follow ',
        h('a', { href: IG, target: '_blank', rel: 'noopener' }, '@kickback_.cal'), ' to hear first.'));
      return;
    }
    var sel = h('select', { id: 'r-event', required: true });
    list.forEach(function (e) { sel.append(h('option', { value: eid(e) }, e.title + ' · ' + mon(e.date) + ' ' + parseDate(e.date).getDate())); });
    if (state.selected && list.some(function (e) { return eid(e) === state.selected; })) sel.value = state.selected;
    var partnerWrap = h('label', { hidden: true }, 'Partner name', h('input', { id: 'r-partner', maxlength: '60', autocomplete: 'off' }));
    var cat = h('select', { id: 'r-cat' }, h('option', {}, 'Singles'), h('option', {}, 'Doubles'), h('option', {}, 'Mixed doubles'));
    cat.addEventListener('change', function () { partnerWrap.hidden = cat.value === 'Singles'; });
    var err = h('span', { class: 'err', role: 'alert' });
    var form = h('form', { class: 'form', novalidate: true },
      h('label', { class: 'full' }, 'Event', sel),
      h('label', {}, 'Your name', h('input', { id: 'r-name', required: true, maxlength: '60', autocomplete: 'name' })),
      h('label', {}, 'Phone or WhatsApp', h('input', { id: 'r-phone', required: true, maxlength: '20', inputmode: 'tel', autocomplete: 'tel' })),
      h('label', {}, 'Category', cat),
      partnerWrap,
      h('label', { class: 'full' }, 'Anything we should know? (optional)', h('textarea', { id: 'r-notes', maxlength: '300' })),
      h('div', { class: 'full row' }, h('button', { class: 'btn btn-gold', type: 'submit' }, 'Register'), err),
      h('p', { class: 'hint full' }, 'Only the organisers see your details.'));
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); err.textContent = '';
      var ev0 = list.filter(function (e) { return eid(e) === sel.value; })[0];
      var name = $('#r-name').value.trim(), phone = $('#r-phone').value.trim();
      if (!ev0 || !name || phone.replace(/\D/g, '').length < 7) { err.textContent = 'Add your name and a phone number we can reach.'; return; }
      var r = { eventTitle: ev0.title, name: name, phone: phone, category: cat.value,
        partner: cat.value === 'Singles' ? '' : $('#r-partner').value.trim(), notes: $('#r-notes').value.trim() };
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
      send(r).then(function (ok) { showDone(r, ok); });
    });
    p.append(form);
  }
  function showDone(r, saved) {
    var p = $('#reg-panel'); p.setAttribute('data-done', '1'); clear(p);
    var text = buildMsg(r), box = h('div', { class: 'msgbox' }, text);
    var copy = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, 'Copy message');
    copy.addEventListener('click', function () { copyText(text, copy, box); });
    var again = h('button', { class: 'btn-quiet', type: 'button', onclick: function () { p.removeAttribute('data-done'); renderReg(); } }, 'Register someone else');
    var first = r.name.split(' ')[0];
    p.append(h('div', { class: 'done' },
      h('h3', {}, saved ? 'You are registered, ' + first : 'One last step, ' + first),
      h('p', {}, saved
        ? 'We have your details for ' + r.eventTitle + ' and will confirm with you directly. If you want to be sure, you can also send us this message.'
        : 'Send this message to @kickback_.cal on Instagram to lock in your spot for ' + r.eventTitle + '.'),
      box,
      h('div', { class: 'row' }, copy, h('a', { class: 'btn btn-gold btn-sm', href: IG, target: '_blank', rel: 'noopener' }, 'Open Instagram')),
      again));
  }

  /* ---------- team ---------- */
  function initials(n) {
    var w = String(n).trim().split(/\s+/);
    return ((w[0] || '')[0] || '').toUpperCase() + ((w.length > 1 ? w[w.length - 1][0] : '') || '').toUpperCase();
  }
  function renderTeam() {
    var sec = $('#team-sec'), box = $('#team'); clear(box);
    sec.hidden = !state.team.length;
    state.team.forEach(function (m) {
      box.append(h('article', { class: 'member' },
        h('div', { class: 'ini', 'aria-hidden': 'true' }, initials(m.name)), h('h3', {}, m.name), h('p', { class: 'role' }, m.role)));
    });
  }

  /* ---------- past events and gallery ---------- */
  function renderPast() {
    var g = $('#past-grid'); clear(g);
    state.past.forEach(function (ev) {
      var first = state.photos.filter(function (p) { return p.event === ev.key; })[0];
      var cover = h('div', { class: 'cover' });
      if (first) cover.append(h('img', { src: first.file, alt: ev.title, loading: 'lazy' })); else cover.append(court());
      g.append(h('article', { class: 'card' }, cover, h('div', { class: 'body' },
        h('span', { class: 'chip chip-gold', style: 'align-self:flex-start' }, ev.sport),
        h('h3', {}, ev.title),
        h('ul', {}, (ev.lines || []).map(function (t) { return h('li', {}, t); })),
        h('a', { href: '#gallery', onclick: function () { state.filter = ev.key; renderGallery(); } }, 'See photos'))));
    });
  }
  function renderGallery() {
    var chips = $('#chips'); clear(chips);
    [{ key: 'all', title: 'All' }].concat(state.past).forEach(function (c) {
      chips.append(h('button', { type: 'button', 'aria-pressed': String(state.filter === c.key), onclick: function () { state.filter = c.key; renderGallery(); } }, c.title));
    });
    var box = $('#photos'); clear(box);
    var list = state.photos.filter(function (p) { return state.filter === 'all' || p.event === state.filter; });
    if (!list.length) {
      box.style.display = 'block';
      box.append(h('div', { class: 'empty' }, court(), h('p', {}, h('strong', {}, state.loaded ? 'No photos here yet.' : 'Loading photos…'),
        state.loaded ? ' Pictures from our tournaments will appear in this gallery.' : '')));
      return;
    }
    box.style.display = '';
    list.forEach(function (p) {
      var ev = state.past.filter(function (e) { return e.key === p.event; })[0];
      var cap = p.caption || (ev ? ev.title : '');
      box.append(h('button', { class: 'ph', type: 'button', 'aria-label': 'Open photo' + (cap ? ': ' + cap : ''), onclick: function () { openLb(p.file, cap); } },
        h('img', { src: p.file, alt: cap || 'Event photo', loading: 'lazy' }), cap ? h('span', { class: 'cap' }, cap) : null));
    });
  }
  function openLb(src, cap) {
    var lb = $('#lb'); lb.querySelector('img').src = src; lb.querySelector('img').alt = cap || '';
    lb.querySelector('p').textContent = cap || ''; lb.hidden = false;
  }
  $('#lb').addEventListener('click', function () { this.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#lb').hidden = true; });

  /* ---------- start ---------- */
  function renderAll() { renderEvents(); renderPast(); renderGallery(); renderTeam(); }
  route(); renderAll();
  Promise.all([getJSON('data/events.json'), getJSON('data/team.json'), getJSON('data/photos.json')]).then(function (r) {
    state.upcoming = r[0].upcoming || []; state.past = r[0].past || [];
    state.team = r[1] || []; state.photos = r[2] || [];
    state.loaded = true; renderAll();
  }).catch(function (err) {
    state.loaded = true; state.failed = true; renderAll();
    if (location.protocol === 'file:') {
      var n = $('#next-up');
      n.append(h('p', { class: 'err' }, 'This site must be opened through a web server, not by double-clicking the file. See README.md.'));
    }
    if (window.console) console.error(err);
  });
})();
