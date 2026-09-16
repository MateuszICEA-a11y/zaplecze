/*
 * Fan-out Explorer PL – bookmarklet widocznosc.ai dla chatgpt.com
 *
 * Czyta otwartą rozmowę (na żywo w trakcie odpowiedzi albo zapisaną) z API,
 * którym sama aplikacja ChatGPT pobiera czat, i wypisuje każde wyszukiwanie
 * wysłane do narzędzia web.run, strony, które wróciły, oraz te zacytowane
 * w odpowiedzi. Tylko odczyt: nic nie wysyła, niczego nie zmienia, wszystko
 * zostaje w przeglądarce (kopia rozmowy w localStorage chatgpt.com).
 *
 * Źródło i instrukcja: https://widocznosc.ai/narzedzia/fanout-explorer/
 */
(function () {
  'use strict';

  var VERSION = '1.1.0';
  var NS = 'wai-fanout';
  var CACHE_PREFIX = NS + ':conv:';
  var QUERIES_PREFIX = NS + ':q:';
  var SITE = 'https://widocznosc.ai/narzedzia/fanout-explorer/';

  /* ---------- słownik typów linii web.run ---------- */
  var TYPES = {
    fast: { search: true, pool: 'web', pl: 'zwykłe wyszukiwanie w sieci' },
    slow: { search: true, pool: 'web', pl: 'głębsze wyszukiwanie (więcej stron, dłuższy odczyt)' },
    news: { search: true, pool: 'web', pl: 'wyszukiwanie w wiadomościach' },
    product: { search: true, pool: 'web', pl: 'wyszukiwanie produktowe (zakupy)' },
    video: { search: true, pool: 'web', pl: 'wyszukiwanie wideo' },
    finance: { search: true, pool: 'web', pl: 'notowania i dane finansowe' },
    weather: { search: true, pool: 'web', pl: 'pogoda' },
    sports: { search: true, pool: 'web', pl: 'wyniki sportowe' },
    image: { search: true, pool: null, pl: 'wyszukiwanie obrazów (wyniki nieujawnione w danych)' },
    business: { search: true, pool: null, pl: 'wyszukiwanie miejsc (mapy; wyniki nieujawnione)' },
    open: { search: false, pl: 'otwarcie strony, która wróciła z wyszukiwania' },
    find: { search: false, pl: 'szukanie tekstu na otwartej stronie' },
    click: { search: false, pl: 'przejście po linku na otwartej stronie' },
    screenshot: { search: false, pl: 'zrzut otwartej strony' },
    scroll: { search: false, pl: 'przewinięcie otwartej strony' },
    length: { search: false, pl: 'wskazówka o długości odpowiedzi (nie jest wyszukiwaniem)' },
    genui_run: { search: false, pl: 'budowa wykresu lub tabeli (nie jest wyszukiwaniem)' },
  };
  var FORUM_HOSTS = ['reddit.com', 'wykop.pl', 'quora.com', 'gowork.pl', 'forum.pl'];

  /* ---------- pomocnicze ---------- */
  function hostOf(u) {
    try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function canon(u) {
    return String(u || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/^www\./, '')
      .replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
  function isSub(host, root) {
    return host === root || (host.length > root.length && host.slice(-root.length - 1) === '.' + root);
  }
  function isForum(host) {
    for (var i = 0; i < FORUM_HOSTS.length; i++) if (isSub(host, FORUM_HOSTS[i])) return true;
    return false;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function download(name, text, mime) {
    var blob = new Blob(['﻿' + text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function copyText(text, btn, label) {
    var done = function () { flash(btn, label); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done();
    }
  }
  function flash(btn, label) {
    if (!btn) return;
    var old = btn.textContent; btn.textContent = label || 'Skopiowano';
    setTimeout(function () { btn.textContent = old; }, 1400);
  }
  function stamp(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function conversationId() {
    var m = location.pathname.match(/\/c\/([0-9a-f-]{20,})/i);
    return m ? m[1] : '';
  }

  /* ---------- parser linii web.run ----------
   * Postać linii:  typ|zapytanie            typ|zapytanie|dni
   *                typ|zapytanie|dni|domena  business|lokalizacja|kategorie
   */
  function parseSearchLine(line) {
    var t = line.trim(); if (!t) return null;
    var parts = t.split('|');
    var type = parts[0].trim().toLowerCase();
    var def = TYPES[type];
    if (!def || !def.search) return null;
    var out = { type: type, query: '', days: '', domain: '', place: '' };
    if (type === 'business') {
      out.place = (parts[1] || '').trim();
      out.query = parts.slice(2).filter(Boolean).join(' / ').trim();
    } else {
      out.query = (parts[1] || '').trim();
      var third = (parts[2] || '').trim();
      if (parts.length >= 3 && /^\d+$/.test(third)) {
        out.days = third;
        out.domain = (parts[3] || '').trim();
      } else if (parts.length >= 3) {
        out.query = parts.slice(1).join('|').trim();
      }
    }
    if (!out.query) return null;
    var m = out.query.match(/site:([^\s"']+)/i);
    out.lockedHost = (out.domain || (m ? m[1] : '')).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    return out;
  }

  /* ---------- model rozmowy ----------
   * turns[]  : { prompt, rounds[], citedUrls:Set, citedRefs:Set, answered }
   * round    : { turn, index, searches[], pages[], seen:Set, roundId }
   * page     : { url, canon, host, title, refKey, cited }
   */
  function activeBranch(conv) {
    var nodes = [], id = conv.current_node, guard = {};
    while (id && conv.mapping && conv.mapping[id] && !guard[id]) {
      guard[id] = 1; nodes.push(conv.mapping[id]); id = conv.mapping[id].parent;
    }
    return nodes.reverse();
  }

  function build(conv, recorded) {
    var turns = [];
    var cur = null, turn = null;
    var idToIndex = {}; // długi identyfikator rundy (z wyników narzędzia) -> pozycja rundy w turze

    function newTurn(prompt) {
      turn = { prompt: prompt, rounds: [], citedUrls: {}, citedRefs: {}, answered: false };
      turns.push(turn); cur = null;
    }
    function addPage(round, entry, roundIndex) {
      if (!entry || !entry.url) return;
      var c = canon(entry.url);
      if (!c || round.seen[c]) return;
      round.seen[c] = 1;
      var ref = entry.ref_id || {};
      round.pages.push({
        url: String(entry.url), canon: c, host: hostOf(entry.url), title: entry.title || '',
        refKey: roundIndex + '|' + (ref.ref_type || '') + '|' + (ref.ref_index == null ? '' : ref.ref_index),
        cited: false,
      });
    }
    function addRef(t, r, roundIndex) {
      if (!r || r.ref_index == null) return;
      t.citedRefs[roundIndex + '|' + (r.ref_type || '') + '|' + r.ref_index] = 1;
    }
    function resolveIndex(t, ti) {
      if (ti == null) return null;
      if (idToIndex[ti] != null) return idToIndex[ti];
      if (t.rounds[ti]) return ti;
      return null;
    }
    function collectCitations(t, refs) {
      refs.forEach(function (c) {
        if (!c || !c.type) return;
        var list = (c.items || []).concat(c.sources || []);
        if (c.url) list.push({ url: c.url });
        list.forEach(function (it) {
          if (!it) return;
          if (it.url) t.citedUrls[canon(it.url)] = 1;
          (it.refs || []).forEach(function (r) { addRef(t, r, resolveIndex(t, r.turn_index)); });
        });
        var mt = String(c.matched_text || ''), re = /turn(\d+)([a-z]+)(\d+)/g, m;
        while ((m = re.exec(mt))) {
          var idx = resolveIndex(t, m[1]);
          if (idx != null) t.citedRefs[idx + '|' + m[2] + '|' + m[3]] = 1;
        }
      });
    }

    activeBranch(conv).forEach(function (node) {
      var msg = node.message; if (!msg || !msg.author) return;
      var role = msg.author.role, meta = msg.metadata || {}, content = msg.content || {};
      if (role === 'user' && content.parts) {
        newTurn(content.parts.filter(function (p) { return typeof p === 'string'; }).join(' ').replace(/\s+/g, ' ').trim());
        return;
      }
      if (!turn) newTurn('');
      if (msg.recipient === 'web.run') {
        var text = typeof content.text === 'string' ? content.text
          : (content.parts || []).filter(function (p) { return typeof p === 'string'; }).join('\n');
        cur = { turn: turn, index: turn.rounds.length, searches: [], pages: [], seen: {}, hidden: false };
        turn.rounds.push(cur);
        text.split(/\r?\n/).forEach(function (l) { var s = parseSearchLine(l); if (s) cur.searches.push(s); });
        // Format od 2026: zapisana rozmowa ma puste parts dla web.run. Zapytania bierzemy z nagrania
        // strumienia (jeśli panel był otwarty w trakcie odpowiedzi), inaczej runda zostaje bez treści.
        return;
      }
      if (role === 'tool' && cur && meta.search_result_groups) {
        meta.search_result_groups.forEach(function (g) {
          (g.entries || []).forEach(function (e) {
            if (e && e.ref_id && e.ref_id.turn_index != null) idToIndex[e.ref_id.turn_index] = cur.index;
            addPage(cur, e, cur.index);
          });
        });
        return;
      }
      if (role === 'assistant') {
        if (meta.search_result_groups) {
          meta.search_result_groups.forEach(function (g) {
            (g.entries || []).forEach(function (e) {
              var idx = e && e.ref_id ? resolveIndex(turn, e.ref_id.turn_index) : null;
              var round = idx != null ? turn.rounds[idx] : turn.rounds[turn.rounds.length - 1];
              if (round) addPage(round, e, round.index);
            });
          });
        }
        if (meta.content_references && meta.content_references.length) collectCitations(turn, meta.content_references);
        if (msg.end_turn === true || (meta.content_references || []).length) turn.answered = true;
      }
    });

    /* dopasuj nagrane partie zapytań do rund bez treści: po kolei, od końca (nagranie obejmuje ostatnie odpowiedzi) */
    var emptyRounds = [];
    turns.forEach(function (t) { t.rounds.forEach(function (r) { if (!r.searches.length) emptyRounds.push(r); }); });
    var batches = (recorded || []).slice();
    var offset = Math.max(0, emptyRounds.length - batches.length);
    emptyRounds.forEach(function (r, i) {
      var b = batches[i - offset];
      if (b && i >= offset) {
        b.queries.forEach(function (q, qi) {
          var type = (b.types && b.types[qi]) || 'search';
          var m = q.match(/site:([^\s"']+)/i);
          r.searches.push({ type: type, query: q, days: '', domain: '', place: '', lockedHost: m ? m[1].replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase() : '', recorded: true });
        });
        r.recorded = true;
      }
      if (!r.searches.length) {
        r.hidden = true;
        r.searches.push({ type: 'runda', query: '', days: '', domain: '', place: '', lockedHost: '', hidden: true });
      }
    });

    /* oznacz strony cytowane i zbuduj wiersze */
    var rows = [], n = 0, roundNo = 0;
    var stats = { prompts: turns.length, searches: 0, rounds: 0, hidden: 0, recordedRounds: 0, forumSearches: 0, pages: 0, cited: 0, forumPages: 0, forumCited: 0, pending: 0 };
    var seenPage = {}, seenCited = {};
    turns.forEach(function (t, ti) {
      if (!t.answered) stats.pending++;
      t.rounds.forEach(function (r) {
        roundNo++; stats.rounds++; if (r.recorded) stats.recordedRounds++;
        r.pages.forEach(function (p) {
          p.cited = !!(t.citedRefs[p.refKey] || t.citedUrls[p.canon]);
          if (!seenPage[p.canon]) { seenPage[p.canon] = 1; stats.pages++; if (isForum(p.host)) stats.forumPages++; }
          if (p.cited && !seenCited[p.canon]) { seenCited[p.canon] = 1; stats.cited++; if (isForum(p.host)) stats.forumCited++; }
        });
        r.searches.forEach(function (s) {
          n++;
          var pool = null;
          if (s.hidden) { stats.hidden++; pool = r.pages.slice(); }
          else { stats.searches++; var def = TYPES[s.type]; if (!def || def.pool === 'web') pool = s.lockedHost ? r.pages.filter(function (p) { return isSub(p.host, s.lockedHost); }) : r.pages.slice(); }
          var hosts = {}; r.pages.forEach(function (p) { hosts[p.host] = (hosts[p.host] || 0) + 1; });
          var hostList = Object.keys(hosts).sort(function (a, b) { return hosts[b] - hosts[a]; });
          var forum = s.hidden ? hostList.some(isForum) : (isForum(s.lockedHost) || /reddit|wykop|forum|quora|opinie/i.test(s.query));
          if (forum) stats.forumSearches++;
          rows.push({
            n: n, turn: ti + 1, prompt: t.prompt, round: roundNo, type: s.type, query: s.query, days: s.days,
            domain: s.domain, lockedHost: s.hidden ? hostList.slice(0, 3).join(', ') + (hostList.length > 3 ? ' +' + (hostList.length - 3) : '') : s.lockedHost, place: s.place, forum: forum, hidden: !!s.hidden,
            answered: t.answered,
            results: pool ? pool.length : null,
            cited: pool ? (t.answered ? pool.filter(function (p) { return p.cited; }).length : null) : null,
            pages: pool ? pool.sort(function (a, b) { return (b.cited - a.cited) || a.host.localeCompare(b.host) || a.canon.localeCompare(b.canon); }) : [],
          });
        });
      });
    });
    return { turns: turns, rows: rows, stats: stats };
  }

  /* ---------- pobieranie rozmowy ---------- */
  var tokenCache = null;
  function getToken() {
    if (tokenCache) return Promise.resolve(tokenCache);
    return fetch('/api/auth/session', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { tokenCache = j && j.accessToken ? j.accessToken : ''; return tokenCache; })
      .catch(function () { return ''; });
  }
  function fetchConversation(id) {
    return getToken().then(function (token) {
      var headers = { Accept: 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      return fetch('/backend-api/conversation/' + id, { credentials: 'include', headers: headers });
    }).then(function (r) {
      if (r.status === 429) { var e = new Error('429'); e.rateLimited = true; throw e; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function readCache(id) {
    try { var raw = localStorage.getItem(CACHE_PREFIX + id); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeCache(id, conv) {
    try { localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ at: Date.now(), conv: conv })); } catch (e) {
      // pełny localStorage – usuń najstarsze kopie i spróbuj raz jeszcze
      try {
        var keys = Object.keys(localStorage).filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0; });
        keys.sort(function (a, b) { return (readCache(a.slice(CACHE_PREFIX.length)) || {}).at - (readCache(b.slice(CACHE_PREFIX.length)) || {}).at; });
        keys.slice(0, Math.ceil(keys.length / 2)).forEach(function (k) { localStorage.removeItem(k); });
        localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ at: Date.now(), conv: conv }));
      } catch (e2) {}
    }
  }

  /* ---------- nagrywanie zapytań ze strumienia odpowiedzi ----------
   * ChatGPT (format od 2026) wysyła treść zapytań tylko w strumieniu SSE odpowiedzi, w wiadomości
   * narzędzia z metadata.search_model_queries.queries. Zapisana rozmowa tego pola nie ma, więc panel
   * podpina się pod fetch strony, przepisuje kopię strumienia i odkłada zapytania per czat w localStorage.
   */
  function readQueries(id) {
    try { var raw = localStorage.getItem(QUERIES_PREFIX + id); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function saveQueries(id, batches) {
    try { localStorage.setItem(QUERIES_PREFIX + id, JSON.stringify(batches)); } catch (e) {}
  }
  function recordBatch(convId, msgId, queries, types) {
    if (!convId || !queries || !queries.length) return;
    var list = readQueries(convId);
    for (var i = 0; i < list.length; i++) if (list[i].id === msgId) return;
    list.push({ id: msgId, queries: queries, types: types || null, at: Date.now() });
    saveQueries(convId, list);
    state.recorded++;
    if (convId !== state.id) { state.id = convId; }
    if (!state.busy) load(true);
  }
  function scanEvent(obj, convHint) {
    var convId = convHint, found = [];
    (function walk(v) {
      if (!v || typeof v !== 'object') return;
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (typeof v.conversation_id === 'string') convId = v.conversation_id;
      if (v.search_model_queries && Array.isArray(v.search_model_queries.queries)) {
        found.push({ msg: v, queries: v.search_model_queries.queries.filter(function (q) { return typeof q === 'string' && q.trim(); }), types: v.search_tool_query_types || null });
      }
      Object.keys(v).forEach(function (k) { walk(v[k]); });
    })(obj);
    found.forEach(function (f) {
      recordBatch(convId, f.msg.id || ('n' + Date.now() + Math.random()), f.queries, f.types);
    });
    return convId;
  }
  function tapStream(body) {
    var reader = body.getReader(), dec = new TextDecoder(), buf = '', convId = conversationId();
    (function pump() {
      reader.read().then(function (r) {
        if (r.done) return;
        buf += dec.decode(r.value, { stream: true });
        var parts = buf.split(/\n\n/); buf = parts.pop();
        parts.forEach(function (ev) {
          ev.split(/\n/).forEach(function (line) {
            if (line.indexOf('data: ') !== 0) return;
            var payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]' || payload.charAt(0) !== '{') return;
            try { convId = scanEvent(JSON.parse(payload), convId); } catch (e) {}
          });
        });
        pump();
      }).catch(function () {});
    })();
  }
  function installStreamHook() {
    if (window.__waiFanoutHooked) return;
    window.__waiFanoutHooked = true;
    var orig = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = (init && init.method) || (input && input.method) || 'GET';
      return orig.apply(this, arguments).then(function (res) {
        try {
          if (String(method).toUpperCase() === 'POST' && /\/backend-api\/(f\/)?conversation(\?|$)/.test(url) && res && res.body) {
            var pair = res.body.tee();
            tapStream(pair[1]);
            return new Response(pair[0], { status: res.status, statusText: res.statusText, headers: res.headers });
          }
        } catch (e) {}
        return res;
      });
    };
  }

  /* ---------- stan ---------- */
  var state = {
    id: '', model: null, source: '', capturedAt: null, sort: { col: 'n', dir: 1 }, tab: 'table',
    expanded: {}, live: true, timer: null, backoff: 60000, note: '', busy: false, recorded: 0,
  };

  /* ---------- panel ---------- */
  var CSS = ''
    + '#' + NS + '{position:fixed;top:0;right:0;width:min(960px,96vw);height:100vh;z-index:2147483000;background:#0f1117;color:#e7e9ee;font:13px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:-8px 0 32px rgba(0,0,0,.45);display:flex;flex-direction:column;border-left:1px solid #262a35}'
    + '#' + NS + ' *{box-sizing:border-box}'
    + '#' + NS + ' .wf-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #262a35;background:#141722}'
    + '#' + NS + ' .wf-title{font-weight:700;font-size:14px;letter-spacing:.01em}'
    + '#' + NS + ' .wf-title small{font-weight:400;color:#8b93a7;margin-left:6px}'
    + '#' + NS + ' .wf-title a{color:#7c86ff;text-decoration:none}'
    + '#' + NS + ' .wf-spacer{flex:1}'
    + '#' + NS + ' button{background:#1f2433;color:#e7e9ee;border:1px solid #2f3546;border-radius:6px;padding:5px 10px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}'
    + '#' + NS + ' button:hover{background:#2a3044}'
    + '#' + NS + ' button.wf-x{padding:4px 9px;font-size:15px;line-height:1}'
    + '#' + NS + ' .wf-bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;border-bottom:1px solid #262a35;align-items:center}'
    + '#' + NS + ' .wf-tabs{display:flex;gap:2px;margin-right:auto}'
    + '#' + NS + ' .wf-tabs button{border-radius:6px 6px 0 0;border-bottom:none;background:transparent}'
    + '#' + NS + ' .wf-tabs button.on{background:#1f2433;border-color:#3b4258}'
    + '#' + NS + ' .wf-body{flex:1;overflow:auto;padding:12px 14px 40px}'
    + '#' + NS + ' .wf-prompt{background:#1a1e2b;border-left:3px solid #7c86ff;padding:8px 10px;margin:0 0 8px;border-radius:0 6px 6px 0}'
    + '#' + NS + ' .wf-prompt b{color:#7c86ff;margin-right:6px}'
    + '#' + NS + ' .wf-sum{color:#b7bdcc;margin:0 0 12px;font-size:12.5px}'
    + '#' + NS + ' .wf-sum span{color:#e7e9ee;font-weight:600}'
    + '#' + NS + ' .wf-note{color:#ffb86b;margin:0 0 10px;font-size:12.5px}'
    + '#' + NS + ' table{width:100%;border-collapse:collapse;font-size:12.5px}'
    + '#' + NS + ' th{position:sticky;top:-12px;background:#141722;text-align:left;padding:6px 8px;border-bottom:1px solid #2f3546;cursor:pointer;user-select:none;white-space:nowrap;font-weight:600;color:#b7bdcc}'
    + '#' + NS + ' th.sorted{color:#fff}'
    + '#' + NS + ' td{padding:5px 8px;border-bottom:1px solid #1f2433;vertical-align:top}'
    + '#' + NS + ' tr.forum td{background:#20192a}'
    + '#' + NS + ' td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
    + '#' + NS + ' td.q{word-break:break-word;max-width:420px}'
    + '#' + NS + ' td.tp{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;color:#9fd6ff}'
    + '#' + NS + ' td.dm{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px}'
    + '#' + NS + ' button.wf-more{padding:0 6px;font-size:13px;line-height:18px}'
    + '#' + NS + ' tr.detail td{background:#12151f;padding:8px 12px 10px 34px}'
    + '#' + NS + ' .wf-host{margin:4px 0 2px;color:#8b93a7;font-weight:600}'
    + '#' + NS + ' .wf-pg{margin:0;padding:0;list-style:none}'
    + '#' + NS + ' .wf-pg li{padding:1px 0 1px 20px;position:relative;word-break:break-all}'
    + '#' + NS + ' .wf-pg li.c::before{content:"✓";position:absolute;left:0;color:#5be49b;font-weight:700}'
    + '#' + NS + ' .wf-pg li.c{color:#fff}'
    + '#' + NS + ' .wf-pg li a{color:inherit;text-decoration:none}'
    + '#' + NS + ' .wf-pg li a:hover{text-decoration:underline}'
    + '#' + NS + ' .wf-empty{color:#8b93a7;padding:30px 0;text-align:center}'
    + '#' + NS + ' .wf-ref{max-width:820px}'
    + '#' + NS + ' .wf-ref h3{margin:14px 0 6px;font-size:13px;color:#fff}'
    + '#' + NS + ' .wf-ref dl{margin:0}'
    + '#' + NS + ' .wf-ref dt{font-weight:600;margin-top:8px}'
    + '#' + NS + ' .wf-ref dd{margin:2px 0 0;color:#b7bdcc}'
    + '#' + NS + ' .wf-ref code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#1f2433;padding:1px 5px;border-radius:4px;font-size:11.5px}'
    + '#' + NS + ' .wf-pill{display:inline-block;padding:1px 7px;border-radius:99px;font-size:11px;background:#2a3044;color:#b7bdcc;margin-left:6px}'
    + '#' + NS + ' .wf-pill.live{background:#193626;color:#5be49b}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  function mount() {
    var old = document.getElementById(NS);
    if (old) old.remove();
    var st = document.getElementById(NS + '-css');
    if (!st) { st = document.createElement('style'); st.id = NS + '-css'; st.textContent = CSS; document.head.appendChild(st); }
    var root = el('<div id="' + NS + '" role="dialog" aria-label="Fan-out Explorer">'
      + '<div class="wf-head"><div class="wf-title">Fan-out Explorer <small>v' + VERSION + ' · <a href="' + SITE + '" target="_blank" rel="noopener">widocznosc.ai</a></small></div>'
      + '<span class="wf-pill" data-r="pill"></span><div class="wf-spacer"></div>'
      + '<button data-a="refresh" title="Odczytaj rozmowę ponownie">Odśwież</button>'
      + '<button data-a="live" title="Czytaj rozmowę na bieżąco, dopóki ChatGPT odpowiada"></button>'
      + '<button class="wf-x" data-a="close" title="Zamknij (Esc)">×</button></div>'
      + '<div class="wf-bar"><div class="wf-tabs"><button data-t="table">Tabela</button><button data-t="legend">Legenda</button><button data-t="types">Typy</button></div>'
      + '<button data-a="expand">Rozwiń wszystko</button>'
      + '<button data-a="copyq" title="Sama kolumna zapytań, jedno na wiersz">Kopiuj zapytania</button>'
      + '<button data-a="copyt" title="Cała tabela, do wklejenia w arkusz">Kopiuj tabelę</button>'
      + '<button data-a="csv" title="Jeden wiersz na wyszukiwanie, strony w dodatkowych kolumnach">Pobierz CSV</button>'
      + '<button data-a="csvs" title="Jeden wiersz na stronę, z flagą cytowania">Pobierz CSV źródeł</button></div>'
      + '<div class="wf-body" data-r="body"></div></div>');
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return root;
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function close() {
    stopLive();
    var r = document.getElementById(NS); if (r) r.remove();
    document.removeEventListener('keydown', onKey);
  }
  function q(sel) { var r = document.getElementById(NS); return r ? r.querySelector(sel) : null; }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = b.getAttribute('data-a'), t = b.getAttribute('data-t');
    if (t) { state.tab = t; render(); return; }
    if (a === 'close') close();
    else if (a === 'refresh') load(true);
    else if (a === 'live') { state.live = !state.live; if (state.live) startLive(); else stopLive(); render(); }
    else if (a === 'expand') {
      var all = state.model ? state.model.rows.every(function (r) { return state.expanded[r.n]; }) : false;
      state.expanded = {};
      if (!all && state.model) state.model.rows.forEach(function (r) { state.expanded[r.n] = true; });
      render();
    }
    else if (a === 'copyq') copyText(sortedRows().map(function (r) { return r.query; }).join('\n'), b);
    else if (a === 'copyt') copyText(tableText(), b);
    else if (a === 'csv') download(fileName('fan-out'), rowsCsv(), 'text/csv;charset=utf-8');
    else if (a === 'csvs') download(fileName('zrodla'), sourcesCsv(), 'text/csv;charset=utf-8');
    else if (a === 'sort') {
      var col = b.getAttribute('data-c');
      if (state.sort.col === col) state.sort.dir = -state.sort.dir; else state.sort = { col: col, dir: 1 };
      render();
    }
    else if (a === 'more') { var n = +b.getAttribute('data-n'); state.expanded[n] = !state.expanded[n]; render(); }
  }

  function sortedRows() {
    if (!state.model) return [];
    var rows = state.model.rows.slice(), c = state.sort.col, d = state.sort.dir;
    if (c === 'n') return d === 1 ? rows : rows.reverse();
    rows.sort(function (a, b) {
      var x = a[c], y = b[c];
      if (x == null) x = ''; if (y == null) y = '';
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * d;
      if (c === 'days') { x = +x || 0; y = +y || 0; return (x - y) * d; }
      x = String(x).toLowerCase(); y = String(y).toLowerCase();
      return (x < y ? -1 : x > y ? 1 : a.n - b.n) * d;
    });
    return rows;
  }
  function fileName(kind) {
    return 'chatgpt-' + kind + '-' + (state.id || 'czat').slice(0, 8) + '-' + stamp(state.capturedAt || new Date()).replace(/[: ]/g, '-') + '.csv';
  }
  var COLS = [
    ['n', 'nr'], ['round', 'runda'], ['type', 'typ'], ['query', 'zapytanie'], ['days', 'dni'], ['lockedHost', 'domena'], ['results', 'wyniki'], ['cited', 'cytowane'],
  ];
  function cellText(r, c) {
    var v = r[c]; if (v == null) return ''; return String(v);
  }
  function tableText() {
    var head = COLS.map(function (c) { return c[1]; }).concat(['prompt']).join('\t');
    return [head].concat(sortedRows().map(function (r) {
      return COLS.map(function (c) { return cellText(r, c[0]).replace(/\t/g, ' '); }).concat([r.prompt.replace(/\t/g, ' ')]).join('\t');
    })).join('\n');
  }
  function metaLines() {
    return ['# Fan-out Explorer widocznosc.ai v' + VERSION, '# rozmowa: ' + state.id, '# odczyt: ' + stamp(state.capturedAt || new Date()) + ' (' + state.source + ')'];
  }
  function rowsCsv() {
    var max = 0; state.model.rows.forEach(function (r) { max = Math.max(max, r.pages.length); });
    var head = COLS.map(function (c) { return c[1]; }).concat(['forum', 'prompt', 'lokalizacja']);
    for (var i = 1; i <= max; i++) head.push('strona ' + i);
    var lines = metaLines().concat([head.map(csvCell).join(',')]);
    sortedRows().forEach(function (r) {
      var cells = COLS.map(function (c) { return cellText(r, c[0]); }).concat([r.forum ? 'tak' : 'nie', r.prompt, r.place]);
      r.pages.forEach(function (p) { cells.push((p.cited ? '✓ ' : '') + p.url); });
      lines.push(cells.map(csvCell).join(','));
    });
    return lines.join('\n');
  }
  function sourcesCsv() {
    var lines = metaLines().concat([['nr', 'runda', 'typ', 'zapytanie', 'domena szukana', 'host', 'url', 'tytuł', 'cytowane', 'prompt'].join(',')]);
    sortedRows().forEach(function (r) {
      r.pages.forEach(function (p) {
        lines.push([r.n, r.round, r.type, r.query, r.lockedHost, p.host, p.url, p.title, p.cited ? 'tak' : 'nie', r.prompt].map(csvCell).join(','));
      });
    });
    return lines.join('\n');
  }

  /* ---------- render ---------- */
  function render() {
    var body = q('[data-r=body]'); if (!body) return;
    var pill = q('[data-r=pill]');
    var liveBtn = q('[data-a=live]');
    if (liveBtn) liveBtn.textContent = state.live ? 'Na żywo: wł.' : 'Na żywo: wył.';
    if (pill) {
      pill.className = 'wf-pill' + (state.live && state.timer ? ' live' : '');
      pill.textContent = state.busy ? 'czytam…' : state.live && state.timer ? 'na żywo' : state.source || '';
    }
    var tabs = document.getElementById(NS).querySelectorAll('[data-t]');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = tabs[i].getAttribute('data-t') === state.tab ? 'on' : '';
    if (state.tab === 'legend') { body.innerHTML = legendHtml(); return; }
    if (state.tab === 'types') { body.innerHTML = typesHtml(); return; }
    body.innerHTML = tableHtml();
  }

  function tableHtml() {
    var h = '';
    if (state.note) h += '<p class="wf-note">' + esc(state.note) + '</p>';
    if (!state.model) return h + '<div class="wf-empty">' + (state.busy ? 'Czytam rozmowę…' : 'Brak danych. Otwórz czat na chatgpt.com i kliknij zakładkę jeszcze raz.') + '</div>';
    var m = state.model, s = m.stats;
    m.turns.forEach(function (t, i) {
      h += '<p class="wf-prompt"><b>' + (i + 1) + '.</b>' + esc(t.prompt || '(prompt bez treści)') + '</p>';
    });
    h += '<p class="wf-sum">Odczyt: <span>' + esc(state.source) + '</span>, ' + esc(stamp(state.capturedAt || new Date()))
      + ' · wyszukiwań <span>' + s.searches + '</span> w <span>' + s.rounds + '</span> rundach, z tego na forach (Reddit, Wykop i podobne) <span>' + s.forumSearches + '</span>'
      + (s.hidden ? '<br><span style="color:#ffb86b">W ' + s.hidden + ' rundach brak treści zapytań: ChatGPT wysyła je tylko w trakcie odpowiedzi, a ten czat nie był wtedy nagrywany. Widać domeny, strony i cytowania każdej rundy. Otwórz panel przed wysłaniem promptu, a zapytania zostaną zapisane.</span>' : '')
      + (s.recordedRounds ? '<br>Zapytania z nagrania na żywo: <span>' + s.recordedRounds + '</span> rund.' : '')
      + '<br>stron pobranych <span>' + s.pages + '</span>, użytych jako źródło <span>' + s.cited + '</span>'
      + ' · z forów pobranych <span>' + s.forumPages + '</span>, użytych <span>' + s.forumCited + '</span>'
      + (s.pending ? '<br><span style="color:#ffb86b">Odpowiedź na ' + s.pending + ' prompt(ów) jeszcze nie jest zapisana, kolumna „cytowane” czeka.</span>' : '')
      + '</p>';
    if (!m.rows.length) return h + '<div class="wf-empty">W tej rozmowie ChatGPT nie wysłał żadnego wyszukiwania do sieci.</div>';
    h += '<table><thead><tr>';
    COLS.forEach(function (c) {
      var on = state.sort.col === c[0];
      h += '<th class="' + (on ? 'sorted' : '') + '"><button data-a="sort" data-c="' + c[0] + '" style="all:unset;cursor:pointer">' + c[1] + (on ? (state.sort.dir === 1 ? ' ▲' : ' ▼') : '') + '</button></th>';
    });
    h += '<th></th></tr></thead><tbody>';
    sortedRows().forEach(function (r) {
      var canOpen = r.pages.length > 0;
      h += '<tr class="' + (r.forum ? 'forum' : '') + '">'
        + '<td class="num">' + r.n + '</td><td class="num">' + r.round + '</td><td class="tp">' + esc(r.type) + '</td>'
        + '<td class="q">' + (r.hidden ? '<span style="color:#8b93a7">zapytanie nie nagrane – runda z ' + r.pages.length + ' stronami</span>' : esc(r.query)) + (r.place ? ' <span class="wf-pill">' + esc(r.place) + '</span>' : '') + '</td>'
        + '<td class="num">' + esc(r.days) + '</td><td class="dm">' + esc(r.lockedHost) + '</td>'
        + '<td class="num">' + (r.results == null ? '' : r.results) + '</td>'
        + '<td class="num">' + (r.cited == null ? (r.results == null ? '' : '…') : r.cited) + '</td>'
        + '<td>' + (canOpen ? '<button class="wf-more" data-a="more" data-n="' + r.n + '">' + (state.expanded[r.n] ? '−' : '+') + '</button>' : '') + '</td></tr>';
      if (state.expanded[r.n] && canOpen) {
        h += '<tr class="detail"><td colspan="9">';
        var byHost = {}, order = [];
        r.pages.forEach(function (p) { if (!byHost[p.host]) { byHost[p.host] = []; order.push(p.host); } byHost[p.host].push(p); });
        order.forEach(function (host) {
          h += '<div class="wf-host">' + esc(host) + ' (' + byHost[host].length + ')</div><ul class="wf-pg">';
          byHost[host].forEach(function (p) {
            h += '<li class="' + (p.cited ? 'c' : '') + '"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.canon) + '</a>' + (p.title ? ' <span style="color:#8b93a7">– ' + esc(p.title) + '</span>' : '') + '</li>';
          });
          h += '</ul>';
        });
        h += '</td></tr>';
      }
    });
    return h + '</tbody></table>';
  }

  function legendHtml() {
    return '<div class="wf-ref">'
      + '<h3>Co widzisz w panelu</h3><dl>'
      + '<dt>Prompt</dt><dd>Twoja wiadomość. Przy kilku promptach w jednym czacie każdy ma numer, a kolumna „prompt” w eksporcie mówi, do którego należy wiersz.</dd>'
      + '<dt>Linie podsumowania</dt><dd>Skąd pochodzi odczyt (na żywo, świeży odczyt albo kopia z przeglądarki), ile wyszukiwań poszło w ilu rundach, ile stron wróciło i ile z nich ChatGPT pokazał jako źródło. Osobno liczone są fora: Reddit, Wykop, Quora, GoWork.</dd>'
      + '<dt>nr</dt><dd>Kolejność, w jakiej ChatGPT wysyłał wyszukiwania. 1 to pierwsze.</dd>'
      + '<dt>runda</dt><dd>ChatGPT szuka partiami: wysyła kilka zapytań, czyta wyniki i często dosyła kolejną partię. To numer partii, liczony ciągiem przez cały czat.</dd>'
      + '<dt>typ</dt><dd>Rodzaj wyszukiwania, np. <code>fast</code> zwykłe, <code>slow</code> głębsze, <code>business</code> miejsca, <code>image</code> obrazy. Pełna lista w zakładce „Typy”.</dd>'
      + '<dt>zapytanie</dt><dd>Dokładne słowa wysłane do wyszukiwarki, razem z operatorem <code>site:</code> i cudzysłowami.</dd>'
      + '<dt>dni</dt><dd>Okno świeżości: jak nowe miały być strony. 30 to ostatni miesiąc, 365 rok, 3650 dziesięć lat. Puste pole oznacza brak ograniczenia.</dd>'
      + '<dt>domena</dt><dd>Jeśli wypełniona, ChatGPT ograniczył to wyszukiwanie do jednej witryny (parametr domeny albo <code>site:</code> w zapytaniu). Traktuj to jako listę witryn, którym model ufa w Twoim temacie.</dd>'
      + '<dt>wyniki</dt><dd>Ile stron wróciło. Uwaga: ChatGPT zapisuje wyniki raz na rundę, więc dwa wyszukiwania z tej samej rundy bez ograniczenia domeny dzielą jedną pulę stron i pokazują tę samą liczbę. Puste dla <code>business</code> i <code>image</code>, bo danych nie ma w rozmowie.</dd>'
      + '<dt>cytowane</dt><dd>Ile z tych stron ChatGPT pokazał jako źródło odpowiedzi (przypisy w tekście i lista źródeł). 0 zostaje w tabeli, bo mówi, co model przeczytał i pominął. Wielokropek oznacza, że odpowiedź jeszcze nie jest zapisana.</dd>'
      + '<dt>Wiersz „runda” bez zapytania</dt><dd>ChatGPT wysyła treść zapytań tylko w strumieniu odpowiedzi, a w zapisanej rozmowie zostają wyniki i cytowania rund. Panel nagrywa zapytania, gdy jest otwarty w trakcie odpowiedzi, i trzyma je w przeglądarce razem z czatem. Czat z historii, który nie był nagrywany, pokazuje wiersz per runda: domeny, liczbę stron i cytowania.</dd>'
      + '<dt>typ „search”</dt><dd>Dla zapytań z nagrania ChatGPT nie podaje typu ani okna świeżości, więc kolumna pokazuje „search”, a „dni” zostaje puste. Starszy format (linie fast/slow) jest nadal obsługiwany.</dd>'
      + '<dt>Wiersze podświetlone</dt><dd>Wyszukiwania kierowane na fora albo pytające o opinie.</dd>'
      + '<dt>+</dt><dd>Otwiera listę stron z tego wyszukiwania, pogrupowaną po witrynie. Ptaszek oznacza stronę użytą jako źródło.</dd>'
      + '</dl><h3>Przyciski</h3><dl>'
      + '<dt>Kopiuj zapytania</dt><dd>Sama kolumna zapytań, jedno na wiersz, do narzędzia od fraz.</dd>'
      + '<dt>Kopiuj tabelę</dt><dd>Cała tabela rozdzielona tabulatorami, do wklejenia w Arkusze lub Excel.</dd>'
      + '<dt>Pobierz CSV</dt><dd>Jeden wiersz na wyszukiwanie, strony w dodatkowych kolumnach, ptaszek przed adresem oznacza cytowanie. Na górze identyfikator czatu i data odczytu.</dd>'
      + '<dt>Pobierz CSV źródeł</dt><dd>Jeden wiersz na stronę, z hostem, tytułem i flagą cytowania.</dd>'
      + '<dt>Na żywo</dt><dd>Panel dopytuje o rozmowę tylko wtedy, gdy ChatGPT odpowiada, i przestaje, gdy odpowiedź jest zapisana. Przy limicie (HTTP 429) czeka minutę i próbuje ponownie.</dd>'
      + '<dt>Odśwież</dt><dd>Jednorazowy ponowny odczyt, z pominięciem kopii w przeglądarce.</dd>'
      + '</dl><h3>Prywatność</h3><dl><dd>Bookmarklet czyta rozmowę tym samym adresem, którym pobiera ją aplikacja ChatGPT, w Twojej sesji. Nic nie wysyła, promptów nie tworzy, a kopię czatu trzyma tylko w localStorage tej przeglądarki.</dd></dl></div>';
  }
  function typesHtml() {
    var h = '<div class="wf-ref"><h3>Linie, które ChatGPT wysyła do narzędzia web.run</h3><p style="color:#b7bdcc">Każde polecenie to jedna linia tekstu, a pierwsze słowo mówi, co to jest. Postać wyszukiwania: <code>typ|zapytanie|dni|domena</code>, gdzie dni i domena są opcjonalne. Lista pochodzi z obserwacji rozmów, nie z dokumentacji OpenAI, więc nowe typy mogą się pojawić.</p><dl>';
    Object.keys(TYPES).forEach(function (k) {
      var d = TYPES[k];
      h += '<dt><code>' + k + '</code>' + (d.search ? '' : ' <span class="wf-pill">poza tabelą</span>') + (d.search && !d.pool ? ' <span class="wf-pill">bez listy wyników</span>' : '') + '</dt><dd>' + esc(d.pl) + '</dd>';
    });
    h += '</dl><h3>Nieznany typ</h3><p style="color:#b7bdcc">Linia z pierwszym słowem spoza tej listy jest pomijana. Jeśli zauważysz taki przypadek, daj znać na <a href="' + SITE + '" target="_blank" rel="noopener" style="color:#7c86ff">widocznosc.ai</a>, dopiszemy go.</p></div>';
    return h;
  }

  /* ---------- ładowanie i tryb live ---------- */
  function apply(conv, source) {
    state.model = build(conv, readQueries(state.id));
    state.source = source;
    state.capturedAt = new Date();
    state.note = '';
  }
  function load(force) {
    var id = conversationId();
    if (!id) {
      state.model = null; state.note = 'Panel nagrywa. Wyślij prompt w tym czacie, a zapytania i wyniki pojawią się runda po rundzie.';
      render(); if (state.live) startLive(); return;
    }
    state.id = id;
    if (!force) {
      var cached = readCache(id);
      if (cached && cached.conv) {
        apply(cached.conv, 'kopia z przeglądarki');
        state.capturedAt = new Date(cached.at || Date.now());
        render();
        if (state.model.stats.pending && state.live) startLive();
        return;
      }
    }
    state.busy = true; render();
    fetchConversation(id).then(function (conv) {
      state.busy = false; state.backoff = 60000;
      apply(conv, 'świeży odczyt');
      writeCache(id, conv);
      render();
      if (state.live && state.model.stats.pending) startLive(); else stopLive();
    }).catch(function (err) {
      state.busy = false;
      if (err.rateLimited) {
        state.note = 'ChatGPT ogranicza odczyty (429). Zostawiam to, co mam, i spróbuję za ' + Math.round(state.backoff / 1000) + ' s.';
        render();
        stopLive();
        state.timer = setTimeout(function () { state.timer = null; state.backoff = Math.min(state.backoff * 2, 600000); load(true); }, state.backoff);
      } else {
        state.note = 'Nie udało się odczytać rozmowy (' + err.message + '). Upewnij się, że jesteś zalogowany, i kliknij Odśwież.';
        render();
      }
    });
  }
  function answering() {
    // przycisk „Zatrzymaj” w kompozytorze pojawia się tylko podczas generowania odpowiedzi
    return !!document.querySelector('button[data-testid="stop-button"],button[aria-label*="Stop"],button[aria-label*="Zatrzymaj"]');
  }
  function startLive() {
    stopLive();
    var lastId = conversationId(), idleTicks = 0;
    state.timer = setInterval(function () {
      var id = conversationId();
      if (id && id !== lastId) { lastId = id; idleTicks = 0; load(true); return; }
      if (!id) return;
      if (answering()) { idleTicks = 0; if (!state.busy) load(true); return; }
      if (state.model && state.model.stats.pending) { idleTicks++; if (idleTicks % 2 === 0 && !state.busy) load(true); if (idleTicks > 12) stopLive(); return; }
      if (state.model && !state.model.stats.pending && idleTicks++ > 1) stopLive();
    }, 4000);
    render();
  }
  function stopLive() {
    if (state.timer) { clearInterval(state.timer); clearTimeout(state.timer); state.timer = null; }
    var pill = q('[data-r=pill]'); if (pill) { pill.className = 'wf-pill'; pill.textContent = state.source || ''; }
  }

  /* ---------- start ---------- */
  if (!/(^|\.)chatgpt\.com$/.test(location.hostname)) {
    alert('Fan-out Explorer działa tylko na chatgpt.com. Otwórz czat i kliknij zakładkę jeszcze raz.');
    return;
  }
  installStreamHook();
  mount();
  render();
  load(false);
  // stały obserwator adresu: przejście do innego czatu (także z pustego na nowy) przeładowuje panel
  var lastUrlId = conversationId();
  var urlWatch = setInterval(function () {
    if (!document.getElementById(NS)) { clearInterval(urlWatch); return; }
    var id = conversationId();
    if (id !== lastUrlId) { lastUrlId = id; state.expanded = {}; load(true); }
  }, 1500);
  window[NS] = { version: VERSION, reload: function () { load(true); }, close: close };
})();
