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

  var VERSION = '1.3.3';
  var NS = 'wai-fanout';
  var CACHE_PREFIX = NS + ':conv:';
  var QUERIES_PREFIX = NS + ':q:';
  var SITE = 'https://widocznosc.ai/narzedzia/fanout-explorer/';
  var PREF_LIVE = NS + ':live', PREF_WIDTH = NS + ':w';
  function pref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setPref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

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
    open: { search: false, pl: 'otwarcie strony, która została zwrócona w wynikach wyszukiwania' },
    find: { search: false, pl: 'szukanie tekstu na otwartej stronie' },
    click: { search: false, pl: 'przejście po linku na otwartej stronie' },
    screenshot: { search: false, pl: 'zrzut ekranu otwartej strony' },
    scroll: { search: false, pl: 'przewinięcie otwartej strony' },
    length: { search: false, pl: 'wskazówka o długości odpowiedzi (nie jest wyszukiwaniem)' },
    genui_run: { search: false, pl: 'generowanie wykresu lub tabeli (nie jest wyszukiwaniem)' },
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
    try { localStorage.setItem(QUERIES_PREFIX + id, JSON.stringify(batches)); return true; }
    catch (e) { state.capture.storageError = true; return false; }
  }
  function recordBatch(convId, msgId, queries, types) {
    if (!convId || !queries || !queries.length) return;
    var list = readQueries(convId);
    var batch = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === msgId) { batch = list[i]; break; }
    if (batch) {
      var changed = false;
      queries.forEach(function (q, qi) {
        if (batch.queries.indexOf(q) !== -1) return;
        batch.queries.push(q);
        if (types) { if (!batch.types) batch.types = []; batch.types[batch.queries.length - 1] = types[qi]; }
        changed = true;
      });
      if (!changed) return;
    } else list.push({ id: msgId, queries: queries.slice(), types: types || null, at: Date.now() });
    if (!saveQueries(convId, list)) return;
    state.recorded++;
    state.capture.batches++;
    // Nie przełączaj panelu na czat, którego odpowiedź kończy się już po zmianie karty rozmowy.
    if (convId === conversationId() && !state.busy) load(true);
  }
  function scanEvent(obj, capture) {
    var found = [];
    function foundQueries(value, msgId, types) {
      state.capture.queryFields++;
      var queries = Array.isArray(value) ? value : value && value.queries;
      if (!Array.isArray(queries)) { state.capture.unsupported++; return; }
      queries = queries.map(function (q) {
        return typeof q === 'string' ? q : q && typeof q.query === 'string' ? q.query : '';
      }).filter(function (q) { return q.trim(); });
      if (!queries.length) return;
      var id = msgId || capture.messageId;
      // Gdy brak ID wiadomości, rozpoznaj powtórzoną migawkę w obrębie tego strumienia.
      if (!id) {
        var key = JSON.stringify(queries);
        if (!capture.anonymous[key]) capture.anonymous[key] = capture.id + ':' + (++capture.sequence);
        id = capture.anonymous[key];
      }
      found.push({ id: id, queries: queries, types: types || null });
    }
    (function walk(v, msgId) {
      if (!v || typeof v !== 'object') return;
      if (Array.isArray(v)) { v.forEach(function (item) { walk(item, msgId); }); return; }
      if (typeof v.conversation_id === 'string' && v.conversation_id) capture.convId = v.conversation_id;
      if (typeof v.id === 'string' && (v.author || v.metadata || v.content)) {
        msgId = v.id; capture.messageId = v.id;
      }
      if (v.search_model_queries) foundQueries(v.search_model_queries, msgId || v.id, v.search_tool_query_types);
      // Pełne wartości metadanych mogą przyjść jako aktualizacja ścieżki, zamiast całej wiadomości.
      var path = typeof v.p === 'string' ? v.p : v.path;
      var value = Object.prototype.hasOwnProperty.call(v, 'v') ? v.v : v.value;
      if (typeof path === 'string') {
        if (/(^|\/)conversation_id$/.test(path) && typeof value === 'string' && value) capture.convId = value;
        if (/(^|\/)message\/id$/.test(path) && typeof value === 'string') capture.messageId = value;
        if (/(^|\/)search_model_queries(?:\/queries)?$/.test(path)) foundQueries(value, msgId, null);
        else if (/search_model_queries/.test(path)) state.capture.unsupported++;
      }
      Object.keys(v).forEach(function (k) { walk(v[k], msgId); });
    })(obj, '');
    capture.pending = capture.pending.concat(found);
    if (!capture.convId) return;
    capture.pending.forEach(function (f) {
      recordBatch(capture.convId, f.id, f.queries, f.types);
    });
    capture.pending = [];
  }
  function tapStream(body, hint) {
    var reader = body.getReader(), dec = new TextDecoder(), buf = '', data = [];
    var capture = { convId: hint || '', messageId: '', pending: [], anonymous: Object.create(null), sequence: 0, id: 'stream:' + Date.now() + ':' + Math.random() };
    state.capture.streams++;
    function line(text) {
      if (text === '') {
        if (!data.length) return;
        var payload = data.join('\n').trim(); data = [];
        if (!payload || payload === '[DONE]') return;
        try {
          var obj = JSON.parse(payload);
          state.capture.events++;
          scanEvent(obj, capture);
        } catch (e) { state.capture.parseErrors++; }
      } else if (text.slice(0, 5) === 'data:') {
        var value = text.slice(5);
        data.push(value.charAt(0) === ' ' ? value.slice(1) : value);
      }
    }
    function consume(final) {
      var match;
      while ((match = /[\r\n]/.exec(buf))) {
        var i = match.index;
        // CR i LF mogą znajdować się w dwóch różnych fragmentach sieciowych.
        if (buf.charAt(i) === '\r' && i === buf.length - 1 && !final) break;
        var skip = buf.slice(i, i + 2) === '\r\n' ? 2 : 1;
        line(buf.slice(0, i)); buf = buf.slice(i + skip);
      }
    }
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) { buf += dec.decode(); consume(true); return; }
        buf += dec.decode(r.value, { stream: true }); consume(false);
        return pump();
      });
    }
    return pump().catch(function () { state.capture.streamErrors++; }).then(function () {
      state.capture.unassigned += capture.pending.length;
      reader.releaseLock(); render();
    });
  }
  function installStreamHook() {
    var previous = window.__waiFanoutRecorder;
    if (previous && window.fetch === previous.fetch) {
      previous.enabled = function () { return !state.closed && state.live; };
      previous.tap = tapStream;
      return;
    }
    // Hook 1.3.2 nie przechowuje oryginalnego fetch — bez przeładowania nie da się go bezpiecznie zastąpić.
    if (window.__waiFanoutHooked && !previous) { state.capture.legacyHook = true; return; }
    var orig = window.fetch;
    var hook = { enabled: function () { return !state.closed && state.live; }, tap: tapStream, fetch: null };
    hook.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input && input.url) || '';
      var method = (init && init.method) || (input && input.method) || 'GET';
      var eligible = false, hint = conversationId(), tap = hook.tap;
      try {
        var target = new URL(url, location.href);
        eligible = hook.enabled() && target.origin === location.origin && String(method).toUpperCase() === 'POST'
          && /^\/backend-api\/(f\/)?conversation\/?$/.test(target.pathname);
        if (eligible && init && typeof init.body === 'string') {
          var requestBody = JSON.parse(init.body);
          if (typeof requestBody.conversation_id === 'string') hint = requestBody.conversation_id;
        }
      } catch (e) {}
      return orig.apply(this, arguments).then(function (res) {
        // Kopia zachowuje oryginalny Response (url, redirected, body) dla aplikacji ChatGPT.
        if (eligible && res && res.ok && res.body && /text\/event-stream/i.test(res.headers.get('content-type') || '')) {
          try { tap(res.clone().body, hint); } catch (e) { state.capture.streamErrors++; }
        }
        return res;
      });
    };
    window.fetch = hook.fetch;
    window.__waiFanoutRecorder = hook;
    window.__waiFanoutHooked = true;
  }

  /* ---------- stan ---------- */
  var state = {
    id: '', model: null, source: '', capturedAt: null, sort: { col: 'n', dir: 1 }, tab: 'table',
    expanded: {}, live: pref(PREF_LIVE) !== '0', timer: null, retry: null, backoff: 60000, min: false, minAt: 0, note: '', busy: false, recorded: 0, onlyCited: false, domOpen: {}, closed: false,
    capture: { streams: 0, events: 0, queryFields: 0, batches: 0, parseErrors: 0, streamErrors: 0, unassigned: 0, unsupported: 0, storageError: false, legacyHook: false },
  };

  /* ---------- panel ---------- */
  var CSS = ''
    + '#' + NS + '{--bg:#08090c;--s1:#11141a;--s2:#171b23;--line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.12);--ink:#fff;--muted:#a6abb5;--faint:#6b7280;--blue:#0a9cff;--blue-soft:rgba(10,156,255,.16);--green:#34d399;--green-soft:rgba(52,211,153,.14);--amber:#fbbf24;--violet:#a78bfa;--rose:#fb7185;--r:10px;'
    + 'position:fixed;top:0;right:0;width:min(1000px,96vw);min-width:340px;max-width:96vw;height:100vh;z-index:2147483000;background:var(--bg);color:var(--ink);font:13px/1.5 "Inter Variable",Inter,-apple-system,system-ui,"Segoe UI",Roboto,sans-serif;box-shadow:-24px 0 64px rgba(0,0,0,.55);display:flex;flex-direction:column;border-left:1px solid var(--line);letter-spacing:-.005em}'
    + '#' + NS + ' *{box-sizing:border-box}'
    + '#' + NS + ' .wf-grip{position:absolute;left:-5px;top:0;bottom:0;width:12px;cursor:col-resize;z-index:2}'
    + '#' + NS + ' .wf-grip:hover,#' + NS + '.resizing .wf-grip{background:var(--blue-soft);box-shadow:inset 2px 0 0 var(--blue)}'
    + '#' + NS + '.resizing{user-select:none}'
    + '#' + NS + '.min{top:auto;bottom:16px;right:16px;width:auto!important;min-width:0;height:auto;border-radius:12px;border:1px solid var(--line2);box-shadow:0 12px 40px rgba(0,0,0,.5)}'
    + '#' + NS + '.min .wf-bar,#' + NS + '.min .wf-body,#' + NS + '.min .wf-grip,#' + NS + '.min [data-a=refresh],#' + NS + '.min [data-a=live],#' + NS + '.min .wf-brand .ver{display:none}'
    + '#' + NS + '.min .wf-head{padding:8px 12px;border-bottom:none;background:var(--s1);border-radius:12px;cursor:pointer}'
    + '#' + NS + ' button[data-a=live].on{background:var(--green-soft);border-color:rgba(52,211,153,.45);color:var(--green)}'
    + '#' + NS + ' button[data-a=live].off{background:rgba(251,113,133,.14);border-color:rgba(251,113,133,.45);color:var(--rose)}'
    + '#' + NS + ' a{color:inherit}'
    + '#' + NS + ' .wf-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 18px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,var(--s1),var(--bg))}'
    + '#' + NS + ' .wf-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;letter-spacing:-.02em}'
    + '#' + NS + ' .wf-brand .wm{color:var(--ink)}#' + NS + ' .wf-brand .wm b{color:var(--blue);font-weight:700}'
    + '#' + NS + ' .wf-brand .sep{width:1px;height:16px;background:var(--line2)}'
    + '#' + NS + ' .wf-brand .nm{color:var(--muted);font-weight:500;white-space:nowrap}#' + NS + ' .wf-brand .ver{color:var(--faint);font-weight:400;font-size:11px;margin-left:4px}'
    + '#' + NS + ' .wf-spacer{flex:1}'
    + '#' + NS + ' button{background:var(--s1);color:var(--ink);border:1px solid var(--line2);border-radius:8px;padding:6px 11px;font:inherit;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}'
    + '#' + NS + ' button:hover{background:var(--s2);border-color:rgba(255,255,255,.2)}'
    + '#' + NS + ' button.wf-x{padding:4px 10px;font-size:16px;line-height:1;color:var(--muted)}'
    + '#' + NS + ' button.primary{background:var(--blue);border-color:var(--blue);color:#fff}#' + NS + ' button.primary:hover{background:#2aa8ff}'
    + '#' + NS + ' .wf-bar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 18px;border-bottom:1px solid var(--line);align-items:center}'
    + '#' + NS + ' .wf-tabs{display:flex;gap:4px;margin-right:auto;background:var(--s1);padding:3px;border-radius:999px;border:1px solid var(--line)}'
    + '#' + NS + ' .wf-tabs button{border:none;background:transparent;border-radius:999px;padding:5px 12px;color:var(--muted)}'
    + '#' + NS + ' .wf-tabs button.on{background:var(--blue);color:#fff}'
    + '#' + NS + ' .wf-body{flex:1;overflow:auto;padding:16px 18px 48px}'
    + '#' + NS + ' .wf-prompt{position:relative;background:var(--s1);border:1px solid var(--line);border-left:3px solid var(--blue);padding:10px 14px;margin:0 0 10px;border-radius:0 var(--r) var(--r) 0;font-size:13.5px;line-height:1.5}'
    + '#' + NS + ' .wf-prompt b{color:var(--blue);margin-right:8px;font-weight:600}'
    + '#' + NS + ' .wf-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}'
    + '#' + NS + ' .wf-stat{background:var(--s1);border:1px solid var(--line);border-radius:var(--r);padding:10px 12px}'
    + '#' + NS + ' .wf-stat dt{margin:0;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}'
    + '#' + NS + ' .wf-stat dd{margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums}'
    + '#' + NS + ' .wf-stat dd small{font-size:12px;font-weight:500;color:var(--muted);margin-left:6px;letter-spacing:0}'
    + '#' + NS + ' .wf-meta{color:var(--faint);font-size:12px;margin:0 0 12px}'
    + '#' + NS + ' .wf-meta span{color:var(--muted)}'
    + '#' + NS + ' .wf-note{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);color:#fcd77a;border-radius:var(--r);padding:9px 12px;margin:0 0 12px;font-size:12.5px}'
    + '#' + NS + ' .wf-note.info{background:var(--blue-soft);border-color:rgba(10,156,255,.3);color:#9fd3ff}'
    + '#' + NS + ' table{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}'
    + '#' + NS + ' th{position:sticky;top:-16px;z-index:1;background:var(--s1);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line2);cursor:pointer;user-select:none;white-space:nowrap;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}'
    + '#' + NS + ' th.sorted{color:var(--blue)}'
    + '#' + NS + ' td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}'
    + '#' + NS + ' tbody tr:last-child td{border-bottom:none}'
    + '#' + NS + ' tbody tr:not(.detail):hover td{background:rgba(255,255,255,.025)}'
    + '#' + NS + ' tr.forum td{background:rgba(167,139,250,.07)}'
    + '#' + NS + ' td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
    + '#' + NS + ' td.q{word-break:break-word;max-width:460px}'
    + '#' + NS + ' td.tp,#' + NS + ' td.dm{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px}'
    + '#' + NS + ' td.tp{color:var(--blue)}'
    + '#' + NS + ' .chip{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--s2);border:1px solid var(--line2);color:var(--muted);white-space:nowrap}'
    + '#' + NS + ' .chip.ok{background:var(--green-soft);border-color:rgba(52,211,153,.35);color:var(--green)}'
    + '#' + NS + ' .chip.zero{color:var(--faint)}'
    + '#' + NS + ' .chip.dom{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--ink)}'
    + '#' + NS + ' .chip.live{background:var(--green-soft);color:var(--green);border-color:rgba(52,211,153,.35)}'
    + '#' + NS + ' button.wf-more{padding:0 7px;font-size:13px;line-height:20px;border-radius:6px}'
    + '#' + NS + ' tr.detail td{background:var(--bg);padding:10px 14px 12px 40px}'
    + '#' + NS + ' .wf-host{margin:6px 0 2px;color:var(--muted);font-weight:600;font-size:12px}'
    + '#' + NS + ' .wf-pg{margin:0;padding:0;list-style:none}'
    + '#' + NS + ' .wf-pg li{padding:2px 0 2px 22px;position:relative;word-break:break-all;color:var(--muted)}'
    + '#' + NS + ' .wf-pg li.c{color:var(--ink)}'
    + '#' + NS + ' .wf-pg li.c::before{content:"✓";position:absolute;left:2px;color:var(--green);font-weight:700}'
    + '#' + NS + ' .wf-pg li a{text-decoration:none}#' + NS + ' .wf-pg li a:hover{text-decoration:underline}'
    + '#' + NS + ' .wf-pg li .t{color:var(--faint)}'
    + '#' + NS + ' .wf-empty{color:var(--muted);padding:48px 0;text-align:center}'
    + '#' + NS + ' .wf-ref{max-width:820px}'
    + '#' + NS + ' .wf-ref h3{margin:18px 0 8px;font-size:13px;color:var(--ink);text-transform:uppercase;letter-spacing:.06em}'
    + '#' + NS + ' .wf-ref dl{margin:0}#' + NS + ' .wf-ref dt{font-weight:600;margin-top:10px}#' + NS + ' .wf-ref dd{margin:2px 0 0;color:var(--muted)}'
    + '#' + NS + ' .wf-ref code,#' + NS + ' code{font-family:ui-monospace,Menlo,Consolas,monospace;background:var(--s1);border:1px solid var(--line);padding:1px 6px;border-radius:5px;font-size:11.5px}'
    + '#' + NS + ' .wf-ref p{color:var(--muted)}'
    /* Domeny */
    + '#' + NS + ' .wf-cat{margin:18px 0 8px;display:flex;align-items:center;gap:10px}'
    + '#' + NS + ' .wf-cat h3{margin:0;font-size:13px;font-weight:700;letter-spacing:-.01em}'
    + '#' + NS + ' .wf-cat .dot{width:8px;height:8px;border-radius:999px}'
    + '#' + NS + ' .wf-cat .cnt{color:var(--faint);font-size:12px}'
    + '#' + NS + ' .wf-dom{display:grid;grid-template-columns:minmax(200px,1.2fr) 80px 80px minmax(120px,1fr) 32px;gap:10px;align-items:center;padding:7px 10px;border:1px solid var(--line);border-top:none;background:var(--s1)}'
    + '#' + NS + ' .wf-dom:first-of-type,#' + NS + ' .wf-dom.first{border-top:1px solid var(--line);border-radius:var(--r) var(--r) 0 0}'
    + '#' + NS + ' .wf-dom.last{border-radius:0 0 var(--r) var(--r)}'
    + '#' + NS + ' .wf-dom.only{border-radius:var(--r)}'
    + '#' + NS + ' .wf-dom .h{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;word-break:break-all}'
    + '#' + NS + ' .wf-dom .n{text-align:right;font-variant-numeric:tabular-nums}'
    + '#' + NS + ' .wf-dom .n small{color:var(--faint);margin-left:4px;font-size:11px}'
    + '#' + NS + ' .wf-bar2{height:6px;border-radius:999px;background:var(--s2);overflow:hidden;border:1px solid var(--line)}'
    + '#' + NS + ' .wf-bar2 i{display:block;height:100%;background:var(--blue)}'
    + '#' + NS + ' .wf-bar2 i.c{background:var(--green)}'
    + '#' + NS + ' .wf-domd{padding:8px 14px 12px 24px;border:1px solid var(--line);border-top:none;background:var(--bg)}'
    + '#' + NS + ' .wf-domhead{display:grid;grid-template-columns:minmax(200px,1.2fr) 80px 80px minmax(120px,1fr) 32px;gap:10px;padding:0 10px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}'
    + '#' + NS + ' .wf-domhead .n{text-align:right}'
    + '#' + NS + ' label.wf-chk{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;padding:5px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--s1)}'
    + '#' + NS + ' label.wf-chk input{accent-color:var(--blue);margin:0}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  function mount() {
    var old = document.getElementById(NS);
    if (old) old.remove();
    var st = document.getElementById(NS + '-css');
    if (st) st.remove();
    st = document.createElement('style'); st.id = NS + '-css'; st.textContent = CSS; document.head.appendChild(st);
    var root = el('<div id="' + NS + '" role="dialog" aria-label="Fan-out Explorer">'
      + '<div class="wf-grip" title="Przeciągnij, aby zmienić szerokość"></div>'
      + '<div class="wf-head"><div class="wf-brand"><a class="wm" href="' + SITE + '" target="_blank" rel="noopener" style="text-decoration:none">widocznosc<b>.ai</b></a><span class="sep"></span><span class="nm">Fan-out Explorer</span><span class="ver">v' + VERSION + '</span></div>'
      + '<span class="chip" data-r="pill"></span><div class="wf-spacer"></div>'
      + '<button data-a="refresh" title="Odczytaj rozmowę ponownie">Odśwież</button>'
      + '<button data-a="live" title="Czytaj rozmowę na bieżąco, dopóki ChatGPT odpowiada"></button>'
      + '<button class="wf-x" data-a="min" title="Zwiń do paska">–</button>'
      + '<button class="wf-x" data-a="close" title="Zamknij (Esc)">×</button></div>'
      + '<div class="wf-bar"><div class="wf-tabs"><button data-t="table">Wyszukiwania</button><button data-t="domains">Domeny</button><button data-t="legend">Legenda</button><button data-t="types">Typy</button></div>'
      + '<span data-r="tools"></span></div>'
      + '<div class="wf-body" data-r="body"></div></div>');
    var w = parseInt(pref(PREF_WIDTH), 10);
    if (w > 0) root.style.width = Math.min(w, Math.round(window.innerWidth * 0.96)) + 'px';
    document.body.appendChild(root);
    root.querySelector('.wf-grip').addEventListener('mousedown', startResize);
    var head = root.querySelector('.wf-head');
    head.addEventListener('click', function (e) { if (state.min && !e.target.closest('button,a')) toggleMin(); });
    head.addEventListener('dblclick', function (e) { if (!state.min && Date.now() - state.minAt > 600 && !e.target.closest('button,a')) toggleMin(); });
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    return root;
  }
  function onChange(e) {
    var t = e.target;
    if (t && t.getAttribute('data-a') === 'onlycited') { state.onlyCited = !!t.checked; render(); }
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function toggleMin() {
    var r = document.getElementById(NS); if (!r) return;
    state.min = !state.min; state.minAt = Date.now();
    r.classList.toggle('min', state.min);
    var b = q('[data-a=min]'); if (b) { b.textContent = state.min ? '▢' : '–'; b.title = state.min ? 'Rozwiń panel' : 'Zwiń do paska'; }
  }
  function startResize(e) {
    var r = document.getElementById(NS); if (!r || state.min) return;
    e.preventDefault();
    r.classList.add('resizing');
    function move(ev) {
      var w = Math.max(340, Math.min(Math.round(window.innerWidth * 0.96), window.innerWidth - ev.clientX));
      r.style.width = w + 'px';
    }
    function up() {
      r.classList.remove('resizing');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      setPref(PREF_WIDTH, String(parseInt(r.style.width, 10) || ''));
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }
  function close() {
    state.closed = true;
    stopLive();
    if (urlWatch) clearInterval(urlWatch);
    if (state.retry) { clearTimeout(state.retry); state.retry = null; }
    var r = document.getElementById(NS); if (r) r.remove();
    document.removeEventListener('keydown', onKey);
  }
  function q(sel) { var r = document.getElementById(NS); return r ? r.querySelector(sel) : null; }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = b.getAttribute('data-a'), t = b.getAttribute('data-t');
    if (t) { state.tab = t; render(); return; }
    if (a === 'close') close();
    else if (a === 'min') { toggleMin(); if (state.min) return; }
    else if (a === 'refresh') load(true);
    else if (a === 'live') { state.live = !state.live; setPref(PREF_LIVE, state.live ? '1' : '0'); if (state.live) startLive(); else stopLive(); render(); }
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
    else if (a === 'dom') { var hkey = b.getAttribute('data-h'); state.domOpen[hkey] = !state.domOpen[hkey]; render(); }
    else if (a === 'csvd') download(fileName('domeny'), domainsCsv(), 'text/csv;charset=utf-8');
    else if (a === 'copyd') copyText(domainsText(), b);
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
    if (state.closed) return;
    var body = q('[data-r=body]'); if (!body) return;
    var pill = q('[data-r=pill]');
    var liveBtn = q('[data-a=live]');
    if (liveBtn) { liveBtn.textContent = state.live ? '● Na żywo: wł.' : '○ Na żywo: wył.'; liveBtn.className = state.live ? 'on' : 'off'; }
    if (pill) {
      pill.className = 'chip' + (state.live && state.timer && !state.busy ? ' live' : '');
      pill.textContent = state.busy ? 'czytam…' : state.live && state.timer ? '● na żywo' : state.source || '';
    }
    var tabs = document.getElementById(NS).querySelectorAll('[data-t]');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = tabs[i].getAttribute('data-t') === state.tab ? 'on' : '';
    var tools = q('[data-r=tools]');
    if (tools) {
      if (state.tab === 'table') tools.innerHTML = '<button data-a="expand">Rozwiń wszystko</button> '
        + '<button data-a="copyq" title="Sama kolumna zapytań, jedno na wiersz">Kopiuj zapytania</button> '
        + '<button data-a="copyt" title="Cała tabela, do wklejenia w arkusz">Kopiuj tabelę</button> '
        + '<button data-a="csv" title="Jeden wiersz na wyszukiwanie, strony w dodatkowych kolumnach">Pobierz CSV</button> '
        + '<button data-a="csvs" title="Jeden wiersz na stronę, z oznaczeniem cytowania">Pobierz CSV źródeł</button>';
      else if (state.tab === 'domains') tools.innerHTML = '<label class="wf-chk"><input type="checkbox" data-a="onlycited"' + (state.onlyCited ? ' checked' : '') + '> tylko cytowane</label> '
        + '<button data-a="copyd" title="Domena, kategoria, pobrane, cytowane – rozdzielone tabulatorami">Kopiuj domeny</button> '
        + '<button data-a="csvd" title="Jeden wiersz na domenę">Pobierz CSV domen</button>';
      else tools.innerHTML = '';
    }
    if (state.tab === 'legend') { body.innerHTML = legendHtml(); return; }
    if (state.tab === 'types') { body.innerHTML = typesHtml(); return; }
    if (state.tab === 'domains') { body.innerHTML = headerHtml() + domainsHtml(); return; }
    body.innerHTML = headerHtml() + tableHtml();
  }

  function headerHtml() {
    var h = '';
    if (state.note) h += '<p class="wf-note">' + esc(state.note) + '</p>';
    if (state.capture.legacyHook) h += '<p class="wf-note">W tej karcie działa jeszcze nagrywanie ze starszej wersji. Przeładuj chatgpt.com i uruchom nową zakładkę przed kolejnym promptem.</p>';
    if (state.capture.storageError) h += '<p class="wf-note">Nie udało się zapisać zapytań w pamięci przeglądarki. Sprawdź dostępność i wolne miejsce w pamięci witryny chatgpt.com.</p>';
    if (!state.model) return h;
    var m = state.model, s = m.stats;
    m.turns.forEach(function (t, i) {
      h += '<p class="wf-prompt"><b>' + (i + 1) + '.</b>' + esc(t.prompt || '(prompt bez treści)') + '</p>';
    });
    h += '<dl class="wf-stats">'
      + '<div class="wf-stat"><dt>wyszukiwania</dt><dd>' + (s.hidden ? (s.searches ? s.searches + '+' : '—') : s.searches) + '<small>w ' + s.rounds + ' ' + plural(s.rounds, 'rundzie', 'rundach', 'rundach') + '</small></dd></div>'
      + '<div class="wf-stat"><dt>strony pobrane</dt><dd>' + s.pages + '</dd></div>'
      + '<div class="wf-stat"><dt>cytowane</dt><dd style="color:var(--green)">' + s.cited + '<small>' + (s.pages ? Math.round(100 * s.cited / s.pages) + '%' : '') + '</small></dd></div>'
      + '<div class="wf-stat"><dt>fora i społeczności</dt><dd>' + s.forumPages + '<small>cytowane ' + s.forumCited + '</small></dd></div>'
      + '</dl>';
    h += '<p class="wf-meta">Odczyt: <span>' + esc(state.source) + '</span> · ' + esc(stamp(state.capturedAt || new Date()))
      + (s.recordedRounds ? ' · zapytania z nagrania: <span>' + s.recordedRounds + '</span> ' + plural(s.recordedRounds, 'runda', 'rundy', 'rund') : '')
      + '</p>';
    if (s.hidden) {
      h += '<p class="wf-note">Dla ' + s.hidden + ' ' + plural(s.hidden, 'rundy', 'rund', 'rund') + ' nie udało się odczytać treści zapytań. Widać dostępne domeny, strony i cytowania. Przyczyną może być brak nagrania, nierozpoznany format odpowiedzi albo brak zapytań w danych udostępnionych przez ChatGPT. Samo otwarcie panelu przed promptem nie gwarantuje ich odczytu.</p>';
      h += '<p class="wf-meta">Nagrywanie od uruchomienia panelu: strumienie <span>' + state.capture.streams
        + '</span> · zdarzenia <span>' + state.capture.events + '</span> · pola zapytań <span>' + state.capture.queryFields
        + '</span> · zapisane partie <span>' + state.capture.batches + '</span>'
        + (state.capture.parseErrors ? ' · błędy odczytu: ' + state.capture.parseErrors : '')
        + (state.capture.streamErrors ? ' · błędy strumienia: ' + state.capture.streamErrors : '')
        + (state.capture.unsupported ? ' · nierozpoznane pola: ' + state.capture.unsupported : '')
        + (state.capture.unassigned ? ' · partie bez identyfikatora czatu: ' + state.capture.unassigned : '') + '</p>';
    }
    if (s.pending) h += '<p class="wf-note info">Odpowiedź na ' + s.pending + ' ' + plural(s.pending, 'prompt', 'prompty', 'promptów') + ' nie jest jeszcze zapisana, kolumna „cytowane” oczekuje na dane.</p>';
    return h;
  }
  function plural(n, one, few, many) {
    n = Math.abs(n); if (n === 1) return one;
    var t = n % 10, h = n % 100;
    return (t >= 2 && t <= 4 && (h < 12 || h > 14)) ? few : many;
  }

  /* ---------- Domeny: agregacja i kategorie ---------- */
  var CATS = [
    ['forum', 'Fora i społeczności', '#a78bfa'],
    ['opinie', 'Opinie, rankingi, porównania', '#fbbf24'],
    ['sklep', 'Sklepy i platformy handlowe', '#fb7185'],
    ['media', 'Media i portale', '#38bdf8'],
    ['docs', 'Dokumentacja i pomoc producentów', '#34d399'],
    ['inst', 'Instytucje, nauka, encyklopedie', '#f472b6'],
    ['marka', 'Strony firm i marek', '#0a9cff'],
  ];
  function categorize(host, paths) {
    var h = host, p = ' ' + paths.join(' ').toLowerCase() + ' ';
    if (isSub(h, 'reddit.com') || isSub(h, 'wykop.pl') || isSub(h, 'quora.com') || /(^|\.)forum\./.test(h) || /forum\./.test(h) || /^(spolecznosc|community|forum|forums|discuss)\./.test(h) || /\/forum(\/|s\/| )/.test(p) || isSub(h, 'stackoverflow.com') || isSub(h, 'stackexchange.com') || /facebook\.com\/groups/.test(p)) return 'forum';
    if (/\.gov(\.pl)?$/.test(h) || /\.edu(\.pl)?$/.test(h) || isSub(h, 'wikipedia.org') || isSub(h, 'europa.eu') || isSub(h, 'arxiv.org') || isSub(h, 'nbp.pl') || isSub(h, 'knf.gov.pl') || isSub(h, 'uokik.gov.pl') || isSub(h, 'gus.gov.pl')) return 'inst';
    if (/^(help|support|docs|developers|developer|learn|community|status|api|dev)\./.test(h) || isSub(h, 'blogs.bing.com') || isSub(h, 'bing.com') && /webmaster/.test(p) || isSub(h, 'openai.com') || isSub(h, 'developers.google.com') || isSub(h, 'support.google.com')) return 'docs';
    if (isSub(h, 'gowork.pl') || isSub(h, 'opiniak.com') || isSub(h, 'aleo.com') || isSub(h, 'trustpilot.com') || isSub(h, 'g2.com') || isSub(h, 'capterra.com') || isSub(h, 'capterra.co.uk') || isSub(h, 'clutch.co') || isSub(h, 'getapp.com') || isSub(h, 'softwareadvice.com') || isSub(h, 'opineo.pl') || isSub(h, 'ceneo.pl') || isSub(h, 'comperia.pl') || isSub(h, 'totalmoney.pl') || isSub(h, 'najlepszecrm.pl') || isSub(h, 'crmexpert.pl') || /(ranking|rankingi|porownanie|porownywarka|opinie|recenzja|recenzje|review|reviews|test)/.test(h) || /\/(ranking|rankingi|porownanie|opinie|recenzja|recenzje|reviews?|test)(-|\/|s|$)/.test(p)) return 'opinie';
    if (isSub(h, 'allegro.pl') || isSub(h, 'x-kom.pl') || isSub(h, 'morele.net') || isSub(h, 'mediaexpert.pl') || isSub(h, 'euro.com.pl') || isSub(h, 'komputronik.pl') || isSub(h, 'amazon.com') || isSub(h, 'amazon.pl') || isSub(h, 'empik.com') || isSub(h, 'olx.pl') || /(sklep|shop|store)\./.test(h) || /\/(produkt|product|products|p|sklep|shop|kategoria|category)\//.test(p)) return 'sklep';
    if (isSub(h, 'bankier.pl') || isSub(h, 'money.pl') || isSub(h, 'businessinsider.com.pl') || isSub(h, 'forbes.pl') || isSub(h, 'rp.pl') || isSub(h, 'pb.pl') || isSub(h, 'wyborcza.pl') || isSub(h, 'onet.pl') || isSub(h, 'wp.pl') || isSub(h, 'interia.pl') || isSub(h, 'spidersweb.pl') || isSub(h, 'antyweb.pl') || isSub(h, 'benchmark.pl') || isSub(h, 'pcformat.pl') || isSub(h, 'chip.pl') || isSub(h, 'komputerswiat.pl') || isSub(h, 'techcrunch.com') || isSub(h, 'theverge.com') || isSub(h, 'searchengineland.com') || isSub(h, 'searchenginejournal.com') || /\/(wiadomosc|wiadomosci|news|artykul|aktualnosci)\//.test(p)) return 'media';
    return 'marka';
  }
  function domainRows() {
    if (!state.model) return [];
    var byHost = {};
    state.model.turns.forEach(function (t) {
      t.rounds.forEach(function (r) {
        r.pages.forEach(function (p) {
          var d = byHost[p.host]; if (!d) { d = byHost[p.host] = { host: p.host, pages: [], seen: {}, fetched: 0, cited: 0, locked: 0 }; }
          if (d.seen[p.canon]) { if (p.cited) { var ex = d.seen[p.canon]; if (!ex.cited) { ex.cited = true; d.cited++; } } return; }
          d.seen[p.canon] = p; d.pages.push(p); d.fetched++; if (p.cited) d.cited++;
        });
        r.searches.forEach(function (sq) { if (sq.lockedHost) { var k = Object.keys(byHost).filter(function (x) { return isSub(x, sq.lockedHost); }); k.forEach(function (x) { byHost[x].locked++; }); } });
      });
    });
    return Object.keys(byHost).map(function (k) {
      var d = byHost[k]; d.cat = categorize(d.host, d.pages.map(function (p) { return p.canon; })); return d;
    }).sort(function (a, b) { return (b.cited - a.cited) || (b.fetched - a.fetched) || a.host.localeCompare(b.host); });
  }
  function domainsHtml() {
    if (!state.model) return '<div class="wf-empty">' + (state.busy ? 'Czytam rozmowę…' : 'Brak danych. Otwórz czat na chatgpt.com i kliknij zakładkę jeszcze raz.') + '</div>';
    var rows = domainRows();
    if (state.onlyCited) rows = rows.filter(function (d) { return d.cited > 0; });
    if (!rows.length) return '<div class="wf-empty">Brak domen do pokazania.</div>';
    var maxF = 1; rows.forEach(function (d) { maxF = Math.max(maxF, d.fetched); });
    var h = '<p class="wf-meta">Wszystkie strony z tego czatu pogrupowane według witryn. Kategorie są przydzielane heurystycznie na podstawie adresu. Plakietka „site: ×N” przy domenie wskazuje, ile wyszukiwań ChatGPT ograniczył do tej witryny operatorem site:. Kliknij „+”, aby zobaczyć strony.</p>';
    CATS.forEach(function (c) {
      var list = rows.filter(function (d) { return d.cat === c[0]; });
      if (!list.length) return;
      var fetched = 0, cited = 0; list.forEach(function (d) { fetched += d.fetched; cited += d.cited; });
      h += '<div class="wf-cat"><span class="dot" style="background:' + c[2] + '"></span><h3>' + esc(c[1]) + '</h3><span class="cnt">' + list.length + ' ' + plural(list.length, 'domena', 'domeny', 'domen') + ' · ' + fetched + ' ' + plural(fetched, 'strona', 'strony', 'stron') + ' · ' + cited + ' cyt.</span></div>';
      h += '<div class="wf-domhead"><span>domena</span><span class="n">pobrane</span><span class="n">cytowane</span><span>skala</span><span></span></div>';
      list.forEach(function (d, i) {
        var open = !!state.domOpen[d.host];
        var cls = 'wf-dom' + (i === 0 ? ' first' : '') + (i === list.length - 1 && !open ? ' last' : '') + (list.length === 1 && !open ? ' only' : '');
        h += '<div class="' + cls + '"><span class="h">' + esc(d.host) + (d.locked ? ' <span class="chip dom" title="wyszukiwania ograniczone do tej witryny">site: ×' + d.locked + '</span>' : '') + '</span>'
          + '<span class="n">' + d.fetched + '</span>'
          + '<span class="n">' + (d.cited ? '<span class="chip ok">' + d.cited + '</span>' : '<span class="chip zero">0</span>') + '</span>'
          + '<span class="wf-bar2" title="pobrane ' + d.fetched + ' (pełny pasek = ' + maxF + ')"><i style="width:' + Math.round(100 * d.fetched / maxF) + '%"></i></span>'
          + '<span><button class="wf-more" data-a="dom" data-h="' + esc(d.host) + '">' + (open ? '−' : '+') + '</button></span></div>';
        if (open) {
          h += '<div class="wf-domd' + (i === list.length - 1 ? ' last' : '') + '"><ul class="wf-pg">';
          d.pages.slice().sort(function (a, b) { return (b.cited - a.cited) || a.canon.localeCompare(b.canon); }).forEach(function (p) {
            h += '<li class="' + (p.cited ? 'c' : '') + '"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.canon) + '</a>' + (p.title ? ' <span class="t">– ' + esc(p.title) + '</span>' : '') + '</li>';
          });
          h += '</ul></div>';
        }
      });
    });
    return h;
  }
  function catLabel(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === k) return CATS[i][1]; return k; }
  function domainsText() {
    return ['domena\tkategoria\tpobrane\tcytowane\tsite:'].concat(domainRows().map(function (d) { return [d.host, catLabel(d.cat), d.fetched, d.cited, d.locked].join('\t'); })).join('\n');
  }
  function domainsCsv() {
    return metaLines().concat([['domena', 'kategoria', 'pobrane', 'cytowane', 'wyszukiwań site:', 'strony cytowane'].map(csvCell).join(',')]).concat(domainRows().map(function (d) {
      return [d.host, catLabel(d.cat), d.fetched, d.cited, d.locked, d.pages.filter(function (p) { return p.cited; }).map(function (p) { return p.url; }).join(' | ')].map(csvCell).join(',');
    })).join('\n');
  }

  function visibleCols() {
    var rows = state.model ? state.model.rows : [];
    var hasDays = rows.some(function (r) { return r.days; });
    var hasType = rows.some(function (r) { return r.type && r.type !== 'search' && r.type !== 'runda'; });
    return COLS.filter(function (c) { return !(c[0] === 'days' && !hasDays) && !(c[0] === 'type' && !hasType); });
  }
  function tableHtml() {
    if (!state.model) return '<div class="wf-empty">' + (state.busy ? 'Czytam rozmowę…' : 'Brak danych. Otwórz czat na chatgpt.com i kliknij zakładkę jeszcze raz.') + '</div>';
    var m = state.model;
    if (!m.rows.length) return '<div class="wf-empty">W tej rozmowie ChatGPT nie wysłał żadnego wyszukiwania do sieci.</div>';
    var cols = visibleCols(), h = '<table><thead><tr>';
    cols.forEach(function (c) {
      var on = state.sort.col === c[0];
      h += '<th class="' + (on ? 'sorted' : '') + '"><button data-a="sort" data-c="' + c[0] + '" style="all:unset;cursor:pointer">' + c[1] + (on ? (state.sort.dir === 1 ? ' ▲' : ' ▼') : '') + '</button></th>';
    });
    h += '<th></th></tr></thead><tbody>';
    sortedRows().forEach(function (r) {
      var canOpen = r.pages.length > 0;
      h += '<tr class="' + (r.forum ? 'forum' : '') + '">';
      cols.forEach(function (c) {
        var k = c[0];
        if (k === 'n' || k === 'round') h += '<td class="num">' + r[k] + '</td>';
        else if (k === 'type') h += '<td class="tp">' + esc(r.type) + '</td>';
        else if (k === 'query') h += '<td class="q">' + (r.hidden ? '<span style="color:var(--faint)">treść zapytań niedostępna – runda z ' + r.pages.length + ' ' + plural(r.pages.length, 'stroną', 'stronami', 'stronami') + '</span>' : esc(r.query)) + (r.place ? ' <span class="chip">' + esc(r.place) + '</span>' : '') + '</td>';
        else if (k === 'days') h += '<td class="num">' + esc(r.days) + '</td>';
        else if (k === 'lockedHost') h += '<td class="dm">' + (r.lockedHost ? (r.hidden ? '<span style="color:var(--muted)">' + esc(r.lockedHost) + '</span>' : '<span class="chip dom">' + esc(r.lockedHost) + '</span>') : '') + '</td>';
        else if (k === 'results') h += '<td class="num">' + (r.results == null ? '' : r.results) + '</td>';
        else if (k === 'cited') h += '<td class="num">' + (r.cited == null ? (r.results == null ? '' : '<span class="chip">…</span>') : (r.cited ? '<span class="chip ok">' + r.cited + '</span>' : '<span class="chip zero">0</span>')) + '</td>';
      });
      h += '<td>' + (canOpen ? '<button class="wf-more" data-a="more" data-n="' + r.n + '">' + (state.expanded[r.n] ? '−' : '+') + '</button>' : '') + '</td></tr>';
      if (state.expanded[r.n] && canOpen) {
        h += '<tr class="detail"><td colspan="' + (cols.length + 1) + '">';
        var byHost = {}, order = [];
        r.pages.forEach(function (p) { if (!byHost[p.host]) { byHost[p.host] = []; order.push(p.host); } byHost[p.host].push(p); });
        order.forEach(function (host) {
          var cnt = byHost[host].filter(function (p) { return p.cited; }).length;
          h += '<div class="wf-host">' + esc(host) + ' <span class="chip' + (cnt ? ' ok' : ' zero') + '">' + cnt + '/' + byHost[host].length + '</span></div><ul class="wf-pg">';
          byHost[host].forEach(function (p) {
            h += '<li class="' + (p.cited ? 'c' : '') + '"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.canon) + '</a>' + (p.title ? ' <span class="t">– ' + esc(p.title) + '</span>' : '') + '</li>';
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
      + '<dt>Prompt</dt><dd>Twoja wiadomość. Przy kilku promptach w jednym czacie każdy ma numer, a kolumna „prompt” w eksporcie wskazuje, do którego z nich przypisany jest dany wiersz.</dd>'
      + '<dt>Kafelki podsumowania</dt><dd>Ile wyszukiwań wykonano w ilu rundach, ile stron pobrano i ile z nich ChatGPT pokazał jako źródło. Osobno liczone są fora: Reddit, Wykop, Quora, GoWork. Linia pod kafelkami informuje, skąd pochodzi odczyt: świeży odczyt albo kopia z przeglądarki.</dd><dt>Plakietka w nagłówku</dt><dd>„● na żywo” oznacza, że panel czuwa i zaktualizuje dane o rozmowie, gdy ChatGPT zacznie odpowiadać. „czytam…” to trwający odczyt. Przy wyłączonym trybie na żywo plakietka pokazuje źródło ostatniego odczytu.</dd>'
      + '<dt>Kolumny</dt><dd>Kliknięcie nagłówka sortuje tabelę, drugie kliknięcie odwraca kolejność. Kolumny „typ” i „dni” pojawiają się tylko wtedy, gdy czat zawiera te dane.</dd><dt>nr</dt><dd>Kolejność, w jakiej ChatGPT wysyłał wyszukiwania. 1 to pierwsze.</dd>'
      + '<dt>runda</dt><dd>ChatGPT szuka partiami: wysyła kilka zapytań, czyta wyniki i często dosyła kolejną partię. To numer partii, liczony ciągiem przez cały czat.</dd>'
      + '<dt>typ</dt><dd>Rodzaj wyszukiwania, np. <code>fast</code> zwykłe, <code>slow</code> głębsze, <code>business</code> miejsca, <code>image</code> obrazy. Pełna lista w zakładce „Typy”.</dd>'
      + '<dt>zapytanie</dt><dd>Dokładne słowa wysłane do wyszukiwarki, razem z operatorem <code>site:</code> i cudzysłowami.</dd>'
      + '<dt>dni</dt><dd>Okno świeżości: z jakiego okresu miały pochodzić strony. 30 to ostatni miesiąc, 365 rok, 3650 dziesięć lat. Puste pole oznacza brak ograniczenia.</dd>'
      + '<dt>domena</dt><dd>Jeśli pole jest wypełnione, ChatGPT ograniczył to wyszukiwanie do jednej witryny (parametr domeny albo <code>site:</code> w zapytaniu). Traktuj to jako listę witryn, którym model ufa w Twoim temacie.</dd>'
      + '<dt>wyniki</dt><dd>Liczba zwróconych stron. Uwaga: ChatGPT zapisuje wyniki raz na rundę, więc dwa wyszukiwania z tej samej rundy bez ograniczenia domeny współdzielą pulę stron i pokazują tę samą liczbę. Puste dla <code>business</code> i <code>image</code>, bo danych nie ma w rozmowie.</dd>'
      + '<dt>cytowane</dt><dd>Ile z tych stron ChatGPT pokazał jako źródło odpowiedzi (przypisy w tekście i lista źródeł). Wartość 0 pozostaje w tabeli, ponieważ wskazuje, co model przeczytał i pominął. Wielokropek oznacza, że odpowiedź jeszcze nie jest zapisana.</dd>'
      + '<dt>Wiersz „runda” bez zapytania</dt><dd>Panel nie znalazł treści zapytań w dostępnych danych. Przyczyną może być brak nagrania, nierozpoznany format albo brak tych danych w odpowiedzi ChatGPT. Otwórz panel i włącz tryb „na żywo” przed promptem. Pod komunikatem o brakach zobaczysz liczniki odebranych strumieni, zdarzeń, pól zapytań i zapisanych partii. Nie zawierają treści rozmowy. Kafelek wyszukiwań pokazuje „—”, gdy liczba zapytań jest nieznana, lub „+”, gdy znana jest tylko część.</dd>'
      + '<dt>Brak kolumn „typ” i „dni”</dt><dd>Dla zapytań z nagrania ChatGPT zwykle nie podaje typu ani okna świeżości, więc panel ukrywa obie kolumny. W eksporcie typ takiego zapytania to „search”. Starszy format (linie fast/slow) jest nadal obsługiwany i wtedy kolumny są ponownie widoczne.</dd>'
      + '<dt>Wiersze podświetlone</dt><dd>Wyszukiwania kierowane na fora albo pytające o opinie.</dd>'
      + '<dt>+</dt><dd>Otwiera listę stron z tego wyszukiwania, pogrupowaną według witryn. Znacznik (ptaszek) oznacza stronę użytą jako źródło. Plakietka przy witrynie, np. 1/3, informuje, ile z pobranych stron zostało zacytowanych.</dd>'
      + '</dl><h3>Zakładka Domeny</h3><dl>'
      + '<dt>Co to jest</dt><dd>Wszystkie strony z czatu pogrupowane według witryn: ile pobrano, ile zacytowano i w ilu wyszukiwaniach ChatGPT ograniczył się do tej witryny operatorem site:. Witryny są pogrupowane w kategorie: fora i społeczności, opinie i rankingi, sklepy, media, dokumentacja producentów, instytucje oraz strony firm i marek.</dd>'
      + '<dt>Kategoria</dt><dd>Kategoryzacja oparta na heurystyce nazwy hosta i ścieżkach, nie po treści. Reddit, Wykop, subdomeny forum/spolecznosc to fora; GoWork, Clutch, G2, Capterra, Trustpilot i adresy z „ranking”/„opinie” to opinie; x-kom, Allegro, Morele i ścieżki /produkt/ to sklepy; Bankier, money.pl i ścieżki /wiadomosci/ to media; help., docs., developers. to dokumentacja; .gov, Wikipedia, arXiv to instytucje. Reszta to strony firm. Pomyłki są możliwe, kategorię traktuj jako wstępne grupowanie.</dd>'
      + '<dt>site: ×N</dt><dd>Plakietka przy domenie: w tylu wyszukiwaniach ChatGPT ograniczył się do tej witryny operatorem site:. Domeny bez plakietki trafiły do wyników zwykłych wyszukiwań.</dd><dt>skala</dt><dd>Pasek pokazuje liczbę pobranych stron domeny na tle domeny z największą liczbą w tym czacie. To nie jest udział procentowy.</dd><dt>Tylko cytowane</dt><dd>Ukrywa domeny, z których nic nie trafiło do odpowiedzi. Bez filtra widać też te przeczytane i pominięte, a to często ciekawsza lista.</dd>'
      + '</dl><h3>Przyciski</h3><dl><dt>Rozwiń wszystko</dt><dd>Otwiera listy stron we wszystkich wierszach. Drugie kliknięcie zwija je z powrotem.</dd>'
      + '<dt>Kopiuj zapytania</dt><dd>Sama kolumna zapytań, jedno na wiersz, do narzędzia analizy słów kluczowych.</dd>'
      + '<dt>Kopiuj tabelę</dt><dd>Cała tabela rozdzielona tabulatorami, do wklejenia w arkusz kalkulacyjny.</dd>'
      + '<dt>Pobierz CSV</dt><dd>Jeden wiersz na wyszukiwanie, strony w dodatkowych kolumnach, znacznik przed adresem oznacza cytowanie. Na górze identyfikator czatu i data odczytu.</dd>'
      + '<dt>Pobierz CSV źródeł</dt><dd>Jeden wiersz na stronę, z hostem, tytułem i oznaczeniem cytowania.</dd><dt>Kopiuj domeny</dt><dd>Zakładka Domeny: domena, kategoria, liczba pobranych i cytowanych stron oraz liczba wyszukiwań site:, rozdzielone tabulatorami.</dd><dt>Pobierz CSV domen</dt><dd>Jeden wiersz na domenę, z adresami zacytowanych stron w ostatniej kolumnie. Filtr „tylko cytowane” nie wpływa na eksport.</dd>'
      + '<dt>Na żywo</dt><dd>Domyślnie włączone (zielony przycisk). Panel przechwytuje odpowiedzi rozpoczęte w tym trybie i odświeża dane rozmowy podczas generowania. Wyłączenie trybu lub zamknięcie panelu zatrzymuje przechwytywanie kolejnych odpowiedzi; odczyt już rozpoczętego strumienia może się dokończyć. Ustawienie jest zapamiętywane. Przycisk Odśwież pobiera zapisane dane, ale nie odzyskuje minionego strumienia. Przy HTTP 429 pierwsza ponowna próba następuje po minucie, kolejne odstępy rosną do 10 minut.</dd><dt>Rozmiar panelu</dt><dd>Przeciągnij lewą krawędź, aby zmienić szerokość (zapamiętywana). Przycisk „–” albo dwukrotne kliknięcie nagłówka zwija panel do małego paska w prawym dolnym rogu, nie przerywając nagrywania. Kliknięcie paska albo przycisku „▢” rozwija go z powrotem.</dd>'
      + '<dt>Odśwież</dt><dd>Jednorazowy ponowny odczyt, z pominięciem kopii w przeglądarce.</dd>'
      + '</dl><h3>Prywatność</h3><dl><dd>Skrypt (bookmarklet) czyta rozmowę z tego samego adresu, z którego pobiera ją aplikacja ChatGPT, w Twojej sesji. Nic nie wysyła, promptów nie tworzy, a kopię czatu przechowuje tylko w localStorage tej przeglądarki.</dd></dl></div>';
  }
  function typesHtml() {
    var h = '<div class="wf-ref"><h3>Linie, które ChatGPT wysyła do narzędzia web.run</h3><p style="color:#b7bdcc">Każde polecenie to jedna linia tekstu, a pierwsze słowo określa jego rodzaj. Postać wyszukiwania: <code>typ|zapytanie|dni|domena</code>, gdzie dni i domena są opcjonalne. Lista pochodzi z obserwacji rozmów, nie z dokumentacji OpenAI, więc nowe typy mogą się pojawić. W obecnym formacie (wrzesień 2026) ChatGPT zwykle nie zostawia tych linii w rozmowie, więc typy zobaczysz głównie w starszych czatach.</p><dl>';
    Object.keys(TYPES).forEach(function (k) {
      var d = TYPES[k];
      h += '<dt><code>' + k + '</code>' + (d.search ? '' : ' <span class="chip">poza tabelą</span>') + (d.search && !d.pool ? ' <span class="chip">bez listy wyników</span>' : '') + '</dt><dd>' + esc(d.pl) + '</dd>';
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
    if (state.closed) return;
    var id = conversationId();
    if (!id) {
      state.model = null; state.note = state.live
        ? 'Panel czeka na odpowiedź. Wyślij prompt w tym czacie; pokażemy zapytania i wyniki, które uda się odczytać.'
        : 'Tryb „na żywo” jest wyłączony. Włącz go przed wysłaniem promptu, aby rozpocząć przechwytywanie odpowiedzi.';
      render(); ensureLive(); return;
    }
    state.id = id;
    if (!force) {
      var cached = readCache(id);
      if (cached && cached.conv) {
        apply(cached.conv, 'kopia z przeglądarki');
        state.capturedAt = new Date(cached.at || Date.now());
        render();
        ensureLive();
        return;
      }
    }
    state.busy = true; render();
    fetchConversation(id).then(function (conv) {
      if (state.closed) return;
      state.busy = false; state.backoff = 60000;
      apply(conv, 'świeży odczyt');
      writeCache(id, conv);
      render();
      ensureLive();
    }).catch(function (err) {
      if (state.closed) return;
      state.busy = false;
      if (err.rateLimited) {
        state.note = 'ChatGPT ogranicza odczyty (429). Zachowuję dotychczasowe dane i ponowię próbę za ' + Math.round(state.backoff / 1000) + ' s.';
        render();
        if (state.retry) clearTimeout(state.retry);
        state.retry = setTimeout(function () { state.retry = null; state.backoff = Math.min(state.backoff * 2, 600000); load(true); }, state.backoff);
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
  function ensureLive() { if (state.live && !state.timer) startLive(); }
  function startLive() {
    stopLive();
    // Obserwator działa, dopóki tryb jest włączony: co 4 s sprawdza DOM (tanie), a rozmowę
    // pobiera tylko, gdy ChatGPT właśnie odpowiada, zmienił się czat albo odpowiedź czeka na zapis.
    var lastId = conversationId(), idleTicks = 0;
    state.timer = setInterval(function () {
      if (!document.getElementById(NS)) { stopLive(); return; }
      var id = conversationId();
      if (id && id !== lastId) { lastId = id; idleTicks = 0; load(true); return; }
      if (!id) return;
      if (answering()) { idleTicks = 0; if (!state.busy) load(true); return; }
      if (state.model && state.model.stats.pending) { idleTicks++; if (idleTicks % 2 === 0 && idleTicks <= 12 && !state.busy) load(true); }
    }, 4000);
    render();
  }
  function stopLive() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    var pill = q('[data-r=pill]'); if (pill) { pill.className = 'chip'; pill.textContent = state.source || ''; }
  }

  /* ---------- start ---------- */
  if (!/(^|\.)chatgpt\.com$/.test(location.hostname)) {
    alert('Fan-out Explorer działa tylko na chatgpt.com. Otwórz czat i kliknij zakładkę jeszcze raz.');
    return;
  }
  if (window[NS] && typeof window[NS].close === 'function') window[NS].close();
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
  window[NS] = {
    version: VERSION, reload: function () { load(true); }, close: close,
    // Wyłącznie liczniki i stan: bez promptów, zapytań, adresów URL, tokenów i identyfikatorów czatów.
    diagnostics: function () {
      var out = { version: VERSION, live: state.live, hookActive: !!(window.__waiFanoutRecorder && window.fetch === window.__waiFanoutRecorder.fetch) };
      Object.keys(state.capture).forEach(function (k) { out[k] = state.capture[k]; });
      return out;
    },
  };
})();
