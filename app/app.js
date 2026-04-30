/* ========================================================
   Dermaapp – App Logic
   ======================================================== */

const STORAGE_KEY = "dermaapp_v1";

const SECTION_LABELS = {
  3: { name: "Papulosquamös & Ekzem",       sec: "s3" },
  4: { name: "Urtikaria & Erytheme",        sec: "s4" },
  5: { name: "Blasenbildende Dermatosen",   sec: "s5" },
  6: { name: "Adnexorgane",                  sec: "s6" }
};

const MODES = [
  { id: "flash",    label: "Karteikarten",   num: "01", icon: iconCard },
  { id: "mc",       label: "Multiple Choice",num: "02", icon: iconMC },
  { id: "match",    label: "Zuordnung",       num: "03", icon: iconMatch },
  { id: "cloze",    label: "Lückentext",      num: "04", icon: iconCloze },
  { id: "tf",       label: "Wahr / Falsch",   num: "05", icon: iconTF },
  { id: "freetext", label: "Freitext",        num: "06", icon: iconFT },
  { id: "image",    label: "Bildquiz",        num: "07", icon: iconImg },
  { id: "mix",      label: "Mixquiz",         num: "08", icon: iconMix }
];

let state = {
  section: "all",
  mode: "flash",
  score: { right: 0, total: 0, streak: 0, best: 0, perMode: {}, perSection: { 3:{r:0,t:0}, 4:{r:0,t:0}, 5:{r:0,t:0}, 6:{r:0,t:0} } },
  index: 0,
  flipped: false,
  answered: false,
  selection: null,
  matchState: null,
  clozeAnswers: null,
  shuffled: null
};

/* ---------- Persistence ---------- */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.score) {
      state.score = { ...state.score, ...saved.score };
      state.score.perSection = { 3:{r:0,t:0}, 4:{r:0,t:0}, 5:{r:0,t:0}, 6:{r:0,t:0}, ...(saved.score.perSection||{}) };
    }
  } catch (e) {}
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ score: state.score })); } catch (e) {}
}

/* ---------- Helpers ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function filterBy(arr) { return state.section === "all" ? arr : arr.filter(x => x.s === parseInt(state.section)); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

function sectionChip(s) {
  const meta = SECTION_LABELS[s];
  return `<span class="section-tag ${meta.sec}"><span class="swatch"></span>SEC ${s} · ${meta.name}</span>`;
}

function recordAnswer(correct, sectionId) {
  state.score.total++;
  if (sectionId && state.score.perSection[sectionId]) {
    state.score.perSection[sectionId].t++;
    if (correct) state.score.perSection[sectionId].r++;
  }
  if (correct) {
    state.score.right++;
    state.score.streak++;
    if (state.score.streak > state.score.best) state.score.best = state.score.streak;
  } else {
    state.score.streak = 0;
  }
  saveState(); refreshSidebar();
}

/* ---------- Topbar / Hero / Stats ---------- */
function totalCount() {
  return FLASH.length + MC.length + TF.length + CLOZE.length + MATCH.length + FREETEXT.length + IMG.length;
}
function renderTopbar() {
  const day = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
  document.getElementById("topbar").innerHTML = `
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"></div>
      <div>
        <div class="brand-name">derma<em>app</em></div>
        <div class="brand-sub">Open Education · DACH</div>
      </div>
    </div>
    <div class="topbar-meta">
      <span><span class="dot"></span>Lernsession aktiv</span>
      <span class="swiss-badge"><span class="swiss-cross"></span>SGDV-orientiert</span>
      <span>${day.toUpperCase()}</span>
    </div>
  `;
}
function renderHero() {
  document.getElementById("hero").innerHTML = `
    <div>
      <div class="q-eyebrow" style="margin-bottom:18px;">Facharztprüfung Dermatologie · Vorbereitung</div>
      <h1 class="hero-title slide-up">Klare Vorbereitung<br>auf die <em>Facharzt­prüfung</em>.</h1>
      <p class="hero-sub slide-up">Strukturierte Lerneinheiten zu Sections 3–6: Papulosquamöse Erkrankungen, Urtikaria & Erytheme, blasenbildende Dermatosen und Adnexorgane. Acht Lernmodi, evidenzbasierte Inhalte, lokal gespeicherter Fortschritt.</p>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><div class="hero-stat-label">Lerninhalte</div><div class="hero-stat-value">${totalCount()}</div></div>
      <div class="hero-stat"><div class="hero-stat-label">Sections</div><div class="hero-stat-value">4</div></div>
      <div class="hero-stat"><div class="hero-stat-label">Lernmodi</div><div class="hero-stat-value accent">8</div></div>
      <div class="hero-stat"><div class="hero-stat-label">Kosten</div><div class="hero-stat-value">CHF 0</div></div>
    </div>
  `;
}

function renderControls() {
  const counts = { all: totalCount() };
  [3,4,5,6].forEach(s => {
    counts[s] = [FLASH, MC, TF, CLOZE, MATCH, FREETEXT, IMG].reduce((acc, arr) => acc + arr.filter(x => x.s === s).length, 0);
  });
  const chips = [
    { id: "all", label: "Alle Bereiche" },
    { id: "3", label: "Sec 3 · Papulosquamös" },
    { id: "4", label: "Sec 4 · Urtikaria" },
    { id: "5", label: "Sec 5 · Blasenbildend" },
    { id: "6", label: "Sec 6 · Adnexe" }
  ];
  document.getElementById("controls").innerHTML = `
    <span class="controls-label">Bereich</span>
    <div class="chips" id="chipRow">
      ${chips.map(c => `<span class="chip ${state.section===c.id?'active':''}" data-sec="${c.id}">${c.label}<span class="num">${counts[c.id]}</span></span>`).join("")}
    </div>
  `;
  document.getElementById("chipRow").addEventListener("click", e => {
    const t = e.target.closest(".chip");
    if (!t) return;
    state.section = t.dataset.sec;
    state.index = 0; state.shuffled = null; resetItem();
    renderControls(); renderTabs(); render();
  });
}

function renderTabs() {
  const counts = {};
  MODES.forEach(m => {
    if (m.id === "flash") counts[m.id] = filterBy(FLASH).length;
    else if (m.id === "mc") counts[m.id] = filterBy(MC).length;
    else if (m.id === "match") counts[m.id] = filterBy(MATCH).length;
    else if (m.id === "cloze") counts[m.id] = filterBy(CLOZE).length;
    else if (m.id === "tf") counts[m.id] = filterBy(TF).length;
    else if (m.id === "freetext") counts[m.id] = filterBy(FREETEXT).length;
    else if (m.id === "image") counts[m.id] = filterBy(IMG).length;
    else counts[m.id] = filterBy(MC).length + filterBy(TF).length + filterBy(CLOZE).length + filterBy(IMG).length;
  });
  document.getElementById("tabs").innerHTML = `
    <div class="tabs-pill" id="tabsPill"></div>
    ${MODES.map(m => `
      <div class="tab ${state.mode===m.id?'active':''}" data-mode="${m.id}">
        <div class="tab-icon">${m.icon()}</div>
        <div>${m.label}</div>
        <div class="tab-num">${m.num} · ${counts[m.id]}</div>
      </div>
    `).join("")}
  `;
  positionPill();
  document.getElementById("tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab");
    if (!t) return;
    state.mode = t.dataset.mode;
    state.index = 0; state.shuffled = null; resetItem();
    renderTabs(); render();
  });
}
function positionPill() {
  requestAnimationFrame(() => {
    const tabs = document.getElementById("tabs");
    const pill = document.getElementById("tabsPill");
    const active = tabs.querySelector(".tab.active");
    if (!active || !pill) return;
    pill.style.transform = `translateX(${active.offsetLeft - 6}px)`;
    pill.style.width = active.offsetWidth + "px";
  });
}

/* ---------- Sidebar ---------- */
function refreshSidebar() {
  const sb = document.getElementById("sidebar");
  if (!sb) return;
  const rate = state.score.total > 0 ? Math.round(100 * state.score.right / state.score.total) : 0;
  const cells = Array.from({length: 10}, (_, i) => {
    const isOn = i < Math.min(10, state.score.streak);
    const isNow = isOn && i === state.score.streak - 1;
    return `<div class="streak-cell ${isOn?'on':''} ${isNow?'now':''}"></div>`;
  }).join("");
  const ringHtml = (s) => {
    const meta = SECTION_LABELS[s];
    const ps = state.score.perSection[s] || {r:0,t:0};
    const pct = ps.t > 0 ? Math.round(100 * ps.r / ps.t) : 0;
    const C = 2 * Math.PI * 14;
    const off = C - (C * pct / 100);
    return `
      <div class="ring-item">
        <svg class="ring" viewBox="0 0 36 36">
          <circle class="bg" cx="18" cy="18" r="14"></circle>
          <circle class="fg" cx="18" cy="18" r="14" stroke-dasharray="${C}" stroke-dashoffset="${off}" stroke="${`var(--${meta.sec.replace('s','sec')})`}"></circle>
        </svg>
        <div class="ring-meta">
          <div class="ring-title">Sec ${s} · ${meta.name}</div>
          <div class="ring-sub">${ps.r} / ${ps.t} richtig</div>
        </div>
        <div class="ring-pct">${pct}%</div>
      </div>
    `;
  };
  sb.innerHTML = `
    <div class="side-card">
      <div class="side-head">Fortschritt heute <span class="num-tag">SESSION</span></div>
      <div class="metric"><span class="metric-label">Richtig</span><span class="metric-val accent">${state.score.right}<span class="pct"> / ${state.score.total}</span></span></div>
      <div class="metric"><span class="metric-label">Trefferquote</span><span class="metric-val">${rate}<span class="pct">%</span></span></div>
      <div class="metric"><span class="metric-label">Beste Streak</span><span class="metric-val">${state.score.best}</span></div>
      <div style="margin-top:14px;">
        <div class="side-head" style="margin:0 0 10px;">Aktuelle Streak <span class="num-tag">${state.score.streak}</span></div>
        <div class="streak-bar">${cells}</div>
      </div>
    </div>
    <div class="side-card">
      <div class="side-head">Kompetenz nach Bereich</div>
      <div class="ring-list">
        ${[3,4,5,6].map(ringHtml).join("")}
      </div>
    </div>
    <div class="side-card">
      <div class="side-head">Tastatur</div>
      <div class="about" style="font-family:var(--mono); font-size:11px; line-height:2;">
        <div><span class="kbd">←</span><span class="kbd">→</span> · Navigation</div>
        <div><span class="kbd">Space</span> · Karte umdrehen</div>
        <div><span class="kbd">1</span>–<span class="kbd">4</span> · Antwort wählen</div>
        <div><span class="kbd">R</span> · Zufällige Frage</div>
      </div>
    </div>
    <div class="side-card">
      <div class="about">
        <strong>Non-Profit & Open Education.</strong> Diese Plattform ist kostenlos für Ärztinnen und Ärzte in Vorbereitung auf die Facharztprüfung Dermatologie der SGDV (Schweiz, mit Inhalten relevant für DACH).
        <span class="divider-dot">·</span>
        Fortschritt wird ausschliesslich lokal in deinem Browser gespeichert.
      </div>
    </div>
  `;
}

/* ---------- Render router ---------- */
function render() {
  const c = document.getElementById("content");
  c.classList.remove("fade-in"); void c.offsetWidth; c.classList.add("fade-in");
  if (state.mode === "flash") renderFlash();
  else if (state.mode === "mc") renderMC();
  else if (state.mode === "match") renderMatch();
  else if (state.mode === "cloze") renderCloze();
  else if (state.mode === "tf") renderTF();
  else if (state.mode === "freetext") renderFreetext();
  else if (state.mode === "image") renderImage();
  else if (state.mode === "mix") { state.shuffled = null; renderMix(); }
}
function resetItem() {
  state.flipped = false; state.answered = false; state.selection = null;
  state.matchState = null; state.clozeAnswers = null;
}
function renderEmpty() {
  document.getElementById("content").innerHTML = `<div class="empty">Keine Inhalte für diese Auswahl.<br><span style="font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-mute);">Wähle einen anderen Bereich.</span></div>`;
}

function header(item, posLabel, idx, total) {
  return `
    <div class="card-head">
      ${sectionChip(item.s)}
      <div class="card-pos">${posLabel} <b>${idx}</b> / ${total}</div>
    </div>
    <div class="prog"><div class="prog-bar" style="width:${(idx/total)*100}%"></div></div>
  `;
}

function navBar(extra = "", showHint = true) {
  return `
    <div class="actions">
      <button class="btn secondary" data-act="prev"><span class="btn-arrow">←</span> Zurück</button>
      <button class="btn" data-act="next">Weiter <span class="btn-arrow">→</span></button>
      <button class="btn ghost" data-act="rand">Zufall</button>
      ${extra}
      <span class="actions-spacer"></span>
      ${showHint ? `<span class="kbd-hint"><span class="kbd">←</span><span class="kbd">→</span> navigieren</span>` : ""}
    </div>
  `;
}
function bindActions() {
  document.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener("click", () => {
      const a = b.dataset.act;
      if (a === "next") { state.index++; resetItem(); render(); }
      else if (a === "prev") { if (state.index > 0) state.index--; resetItem(); render(); }
      else if (a === "rand") {
        const counts = { flash:FLASH.length, mc:MC.length, match:MATCH.length, cloze:CLOZE.length, tf:TF.length, freetext:FREETEXT.length, image:IMG.length };
        state.index = Math.floor(Math.random() * Math.max(1, counts[state.mode] || 1));
        resetItem(); render();
      }
    });
  });
}

/* ---------- FLASH ---------- */
function renderFlash() {
  const items = filterBy(FLASH);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Karteikarte", i+1, total)}
      <div style="height:8px"></div>
      <div class="flashcard">
        <div class="flip ${state.flipped?'flipped':''}" id="flipBox">
          <div class="flip-side flip-front">
            <div class="flip-corner">${state.flipped?'Antwort':'Frage'} · ${i+1}</div>
            <div class="q-eyebrow">Frage</div>
            <div class="flip-q">${it.q}</div>
            <div class="flip-prompt"><span class="arrow">↻</span> Karte umdrehen</div>
          </div>
          <div class="flip-side flip-back">
            <div class="flip-corner">Antwort · ${i+1}</div>
            <div class="q-eyebrow">Antwort</div>
            <div class="flip-a">${it.a}</div>
            <div class="flip-prompt"><span class="arrow">↻</span> Zurück zur Frage</div>
          </div>
        </div>
      </div>
      ${navBar(`<button class="btn accent" data-rate="1">Wusste ich</button><button class="btn secondary" data-rate="0">Nochmals üben</button>`)}
    </div>
  `;
  document.getElementById("flipBox").addEventListener("click", () => {
    state.flipped = !state.flipped;
    document.getElementById("flipBox").classList.toggle("flipped");
  });
  document.querySelectorAll('[data-rate]').forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    recordAnswer(b.dataset.rate === "1", it.s);
    state.flipped = false; state.index++; render();
  }));
  bindActions();
}

/* ---------- MULTIPLE CHOICE ---------- */
function renderMC() {
  const items = filterBy(MC);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  const opts = it.o.map((opt, idx) => {
    let cls = "option";
    if (state.answered && idx === it.c) cls += " correct";
    else if (state.answered && idx === state.selection && idx !== it.c) cls += " wrong";
    else if (state.selection === idx) cls += " selected";
    if (state.answered) cls += " disabled";
    return `<div class="${cls}" data-mc="${idx}">
      <span class="opt-letter">${String.fromCharCode(65+idx)}</span>
      <span>${opt}</span>
    </div>`;
  }).join("");
  let fb = "";
  if (state.answered) {
    const correct = state.selection === it.c;
    fb = `<div class="feedback ${correct?'good':'bad'}">
      <div class="feedback-title ${correct?'good':'bad'}">${correct?'Richtige Antwort':'Falsch'}</div>
      <div>${it.e}</div>
    </div>`;
  }
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Multiple Choice", i+1, total)}
      <div class="q-eyebrow" style="margin-top:24px;">Frage</div>
      <h2 class="q-text">${it.q}</h2>
      <div class="options">${opts}</div>
      ${fb}
      ${navBar()}
    </div>
  `;
  document.querySelectorAll('[data-mc]').forEach(o => o.addEventListener("click", () => {
    if (state.answered) return;
    state.selection = parseInt(o.dataset.mc);
    state.answered = true;
    recordAnswer(state.selection === it.c, it.s);
    render();
  }));
  bindActions();
}

/* ---------- TRUE / FALSE ---------- */
function renderTF() {
  const items = filterBy(TF);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  let fb = "";
  if (state.answered) {
    const correct = state.selection === it.c;
    fb = `<div class="feedback ${correct?'good':'bad'}">
      <div class="feedback-title ${correct?'good':'bad'}">${correct?'Richtig':'Falsch'} · Korrekt: ${it.c?'Wahr':'Falsch'}</div>
      <div>${it.e}</div>
    </div>`;
  }
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Wahr / Falsch", i+1, total)}
      <div class="q-eyebrow" style="margin-top:24px;">Aussage</div>
      <h2 class="q-text">${it.st}</h2>
      <div class="tf-grid">
        <div class="tf-card true ${state.answered && state.selection===true?'selected':''}" data-tf="true">
          <span class="tf-key">1</span>
          <div class="tf-mark">✓</div>
          <div class="tf-label">Wahr</div>
        </div>
        <div class="tf-card false ${state.answered && state.selection===false?'selected':''}" data-tf="false">
          <span class="tf-key">2</span>
          <div class="tf-mark">✕</div>
          <div class="tf-label">Falsch</div>
        </div>
      </div>
      ${fb}
      ${navBar()}
    </div>
  `;
  document.querySelectorAll('[data-tf]').forEach(b => b.addEventListener("click", () => {
    if (state.answered) return;
    const v = b.dataset.tf === "true";
    state.selection = v; state.answered = true;
    recordAnswer(v === it.c, it.s);
    render();
  }));
  bindActions();
}

/* ---------- MATCH ---------- */
function renderMatch() {
  const items = filterBy(MATCH);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  if (!state.matchState || state.matchState.qIndex !== state.index) {
    state.matchState = {
      qIndex: state.index,
      lefts:  it.p.map((p, idx) => ({ text: p[0], idx, matched:false })),
      rights: shuffle(it.p.map((p, idx) => ({ text: p[1], idx, matched:false }))),
      selectedLeft: null, selectedRight: null,
      mistakes: 0, completed: false, recorded: false
    };
  }
  const ms = state.matchState;
  const renderItem = (item, side) => {
    let cls = "match-item";
    if (item.matched) cls += " matched";
    else if (side === "L" && ms.selectedLeft === item.idx) cls += " selected";
    else if (side === "R" && ms.selectedRight === item.idx) cls += " selected";
    return `<div class="${cls}" data-match="${side}-${item.idx}">${item.text}</div>`;
  };
  let fb = "";
  if (ms.completed) {
    fb = `<div class="feedback good">
      <div class="feedback-title good">Vollständig zugeordnet</div>
      <div>Mit ${ms.mistakes} Fehler${ms.mistakes!==1?'n':''} abgeschlossen.</div>
    </div>`;
  }
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Zuordnung", i+1, total)}
      <div class="q-eyebrow" style="margin-top:24px;">Thema</div>
      <h2 class="q-text">${it.t}</h2>
      <div class="match-wrap">
        <div>
          <div class="match-col-head">Begriff</div>
          <div style="display:flex;flex-direction:column;gap:10px;">${ms.lefts.map(x => renderItem(x, "L")).join("")}</div>
        </div>
        <div>
          <div class="match-col-head">Beschreibung</div>
          <div style="display:flex;flex-direction:column;gap:10px;">${ms.rights.map(x => renderItem(x, "R")).join("")}</div>
        </div>
      </div>
      ${fb}
      ${navBar(`<span class="kbd-hint">Fehler: ${ms.mistakes}</span>`, false)}
    </div>
  `;
  document.querySelectorAll('[data-match]').forEach(el => el.addEventListener("click", () => {
    const [side, idxStr] = el.dataset.match.split("-");
    const idx = parseInt(idxStr);
    const list = side === "L" ? ms.lefts : ms.rights;
    const item = list.find(x => x.idx === idx);
    if (!item || item.matched || ms.completed) return;
    if (side === "L") ms.selectedLeft = idx;
    else ms.selectedRight = idx;
    if (ms.selectedLeft !== null && ms.selectedRight !== null) {
      if (ms.selectedLeft === ms.selectedRight) {
        ms.lefts.find(x => x.idx === ms.selectedLeft).matched = true;
        ms.rights.find(x => x.idx === ms.selectedRight).matched = true;
        ms.selectedLeft = null; ms.selectedRight = null;
        if (ms.lefts.every(x => x.matched)) {
          ms.completed = true;
          if (!ms.recorded) { recordAnswer(ms.mistakes === 0, it.s); ms.recorded = true; }
        }
      } else {
        ms.mistakes++;
        setTimeout(() => { ms.selectedLeft = null; ms.selectedRight = null; renderMatch(); }, 500);
      }
    }
    renderMatch();
  }));
  bindActions();
}

/* ---------- CLOZE ---------- */
function renderCloze() {
  const items = filterBy(CLOZE);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  if (!state.clozeAnswers || state.clozeAnswers.qIndex !== state.index) {
    state.clozeAnswers = { qIndex: state.index, values: new Array(it.a.length).fill(""), checked: false };
  }
  const ca = state.clozeAnswers;
  let bi = 0;
  const html = it.parts.map(p => {
    if (p === "BLANK") {
      const idx = bi++;
      const cls = !ca.checked ? "" :
        (ca.values[idx].trim().toLowerCase() === it.a[idx].trim().toLowerCase() ? "correct" : "wrong");
      return `<input class="cloze-input ${cls}" type="text" data-i="${idx}" value="${escapeHtml(ca.values[idx])}" ${ca.checked?'disabled':''} placeholder="…">`;
    }
    return p;
  }).join("");
  let fb = "";
  if (ca.checked) {
    const all = ca.values.every((v, idx) => v.trim().toLowerCase() === it.a[idx].trim().toLowerCase());
    fb = `<div class="feedback ${all?'good':'bad'}">
      <div class="feedback-title ${all?'good':'bad'}">${all?'Alle korrekt':'Korrekte Antworten'}</div>
      <div>${it.a.map((a, idx) => `<strong>Lücke ${idx+1}:</strong> ${a}`).join("  ·  ")}</div>
    </div>`;
  }
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Lückentext", i+1, total)}
      <div class="q-eyebrow" style="margin-top:24px;">Ergänze die Lücken</div>
      <div class="q-text cloze">${html}</div>
      ${fb}
      ${navBar(ca.checked ? "" : `<button class="btn accent" id="checkCloze">Prüfen</button>`)}
    </div>
  `;
  document.querySelectorAll(".cloze-input").forEach(el => el.addEventListener("input", () => {
    state.clozeAnswers.values[parseInt(el.dataset.i)] = el.value;
  }));
  const cb = document.getElementById("checkCloze");
  if (cb) cb.addEventListener("click", () => {
    state.clozeAnswers.checked = true;
    const all = ca.values.every((v, idx) => v.trim().toLowerCase() === it.a[idx].trim().toLowerCase());
    recordAnswer(all, it.s);
    renderCloze();
  });
  bindActions();
}

/* ---------- FREETEXT ---------- */
function renderFreetext() {
  const items = filterBy(FREETEXT);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Freitext", i+1, total)}
      <div class="q-eyebrow" style="margin-top:24px;">Schreibe deine Antwort</div>
      <h2 class="q-text">${it.q}</h2>
      <textarea class="freetext" id="ftInput" placeholder="Strukturierte Antwort hier eingeben…"></textarea>
      ${state.answered ? `<div class="reveal">
        <div class="reveal-label">Musterantwort</div>
        ${it.a}
      </div>` : ""}
      ${navBar(state.answered ? "" : `<button class="btn accent" id="reveal">Musterantwort anzeigen</button>`)}
    </div>
  `;
  const r = document.getElementById("reveal");
  if (r) r.addEventListener("click", () => {
    state.answered = true;
    recordAnswer(true, it.s);
    renderFreetext();
  });
  bindActions();
}

/* ---------- IMAGE ---------- */
function renderImage() {
  const items = filterBy(IMG);
  if (!items.length) return renderEmpty();
  const total = items.length;
  const i = state.index % total;
  const it = items[i];
  const opts = it.o.map((opt, idx) => {
    let cls = "option";
    if (state.answered && idx === it.c) cls += " correct";
    else if (state.answered && idx === state.selection && idx !== it.c) cls += " wrong";
    else if (state.selection === idx) cls += " selected";
    if (state.answered) cls += " disabled";
    return `<div class="${cls}" data-img="${idx}"><span class="opt-letter">${String.fromCharCode(65+idx)}</span><span>${opt}</span></div>`;
  }).join("");
  let fb = "";
  if (state.answered) {
    const correct = state.selection === it.c;
    fb = `<div class="feedback ${correct?'good':'bad'}">
      <div class="feedback-title ${correct?'good':'bad'}">${correct?'Richtig':'Falsch'}</div>
      <div>${it.e}</div>
    </div>`;
  }
  document.getElementById("content").innerHTML = `
    <div class="stagger">
      ${header(it, "Bildquiz", i+1, total)}
      <div style="height:18px"></div>
      <div class="image-frame">${it.svg}</div>
      <div class="image-caption">${it.cap}</div>
      <h2 class="q-text">${it.q}</h2>
      <div class="options">${opts}</div>
      ${fb}
      ${navBar()}
    </div>
  `;
  document.querySelectorAll('[data-img]').forEach(o => o.addEventListener("click", () => {
    if (state.answered) return;
    state.selection = parseInt(o.dataset.img);
    state.answered = true;
    recordAnswer(state.selection === it.c, it.s);
    renderImage();
  }));
  bindActions();
}

/* ---------- MIX ---------- */
function renderMix() {
  if (!state.shuffled || state.shuffled.section !== state.section) {
    const all = [
      ...filterBy(MC).map(x => ({type:"mc", data:x})),
      ...filterBy(TF).map(x => ({type:"tf", data:x})),
      ...filterBy(CLOZE).map(x => ({type:"cloze", data:x})),
      ...filterBy(IMG).map(x => ({type:"image", data:x}))
    ];
    state.shuffled = { section: state.section, items: shuffle(all), pos: 0 };
  }
  const sh = state.shuffled;
  if (!sh.items.length) return renderEmpty();
  const cur = sh.items[sh.pos % sh.items.length];
  const total = sh.items.length;
  const idx = (sh.pos % total) + 1;
  const data = cur.data;

  let body = "";
  let extraAct = "";
  const head = `${header(data, `Mix · ${cur.type.toUpperCase()}`, idx, total)}`;

  if (cur.type === "mc" || cur.type === "image") {
    const opts = data.o.map((opt, i) => {
      let cls = "option";
      if (state.answered && i === data.c) cls += " correct";
      else if (state.answered && i === state.selection && i !== data.c) cls += " wrong";
      else if (state.selection === i) cls += " selected";
      if (state.answered) cls += " disabled";
      return `<div class="${cls}" data-mix-mc="${i}"><span class="opt-letter">${String.fromCharCode(65+i)}</span><span>${opt}</span></div>`;
    }).join("");
    let fb = "";
    if (state.answered) {
      const correct = state.selection === data.c;
      fb = `<div class="feedback ${correct?'good':'bad'}"><div class="feedback-title ${correct?'good':'bad'}">${correct?'Richtig':'Falsch'}</div><div>${data.e}</div></div>`;
    }
    body = `
      ${cur.type === "image" ? `<div style="height:18px"></div><div class="image-frame">${data.svg}</div><div class="image-caption">${data.cap}</div>` : '<div class="q-eyebrow" style="margin-top:24px;">Frage</div>'}
      <h2 class="q-text">${data.q}</h2>
      <div class="options">${opts}</div>
      ${fb}
    `;
  } else if (cur.type === "tf") {
    let fb = "";
    if (state.answered) {
      const correct = state.selection === data.c;
      fb = `<div class="feedback ${correct?'good':'bad'}"><div class="feedback-title ${correct?'good':'bad'}">${correct?'Richtig':'Falsch'} · Korrekt: ${data.c?'Wahr':'Falsch'}</div><div>${data.e}</div></div>`;
    }
    body = `
      <div class="q-eyebrow" style="margin-top:24px;">Aussage</div>
      <h2 class="q-text">${data.st}</h2>
      <div class="tf-grid">
        <div class="tf-card true ${state.answered && state.selection===true?'selected':''}" data-mix-tf="true"><span class="tf-key">1</span><div class="tf-mark">✓</div><div class="tf-label">Wahr</div></div>
        <div class="tf-card false ${state.answered && state.selection===false?'selected':''}" data-mix-tf="false"><span class="tf-key">2</span><div class="tf-mark">✕</div><div class="tf-label">Falsch</div></div>
      </div>
      ${fb}
    `;
  } else if (cur.type === "cloze") {
    if (!state.clozeAnswers) state.clozeAnswers = { values: new Array(data.a.length).fill(""), checked: false };
    const ca = state.clozeAnswers;
    let bi = 0;
    const html = data.parts.map(p => {
      if (p === "BLANK") {
        const i = bi++;
        const cls = !ca.checked ? "" :
          (ca.values[i].trim().toLowerCase() === data.a[i].trim().toLowerCase() ? "correct" : "wrong");
        return `<input class="cloze-input ${cls}" type="text" data-mi="${i}" value="${escapeHtml(ca.values[i])}" ${ca.checked?'disabled':''} placeholder="…">`;
      }
      return p;
    }).join("");
    let fb = "";
    if (ca.checked) {
      const all = ca.values.every((v, i) => v.trim().toLowerCase() === data.a[i].trim().toLowerCase());
      fb = `<div class="feedback ${all?'good':'bad'}"><div class="feedback-title ${all?'good':'bad'}">${all?'Alle korrekt':'Korrekte Antworten'}</div><div>${data.a.map((a,i) => `<strong>Lücke ${i+1}:</strong> ${a}`).join("  ·  ")}</div></div>`;
    }
    body = `
      <div class="q-eyebrow" style="margin-top:24px;">Ergänze die Lücken</div>
      <div class="q-text cloze">${html}</div>
      ${fb}
    `;
    extraAct = ca.checked ? "" : `<button class="btn accent" id="checkMixCloze">Prüfen</button>`;
  }

  document.getElementById("content").innerHTML = `
    <div class="stagger">${head}${body}
      <div class="actions">
        <button class="btn secondary" id="mixPrev"><span class="btn-arrow">←</span> Zurück</button>
        <button class="btn" id="mixNext">Weiter <span class="btn-arrow">→</span></button>
        ${extraAct}
        <span class="actions-spacer"></span>
        <span class="kbd-hint">Mix-Modus · zufällige Mischung</span>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-mix-mc]').forEach(o => o.addEventListener("click", () => {
    if (state.answered) return;
    state.selection = parseInt(o.dataset.mixMc);
    state.answered = true;
    recordAnswer(state.selection === data.c, data.s);
    renderMix();
  }));
  document.querySelectorAll('[data-mix-tf]').forEach(o => o.addEventListener("click", () => {
    if (state.answered) return;
    const v = o.dataset.mixTf === "true";
    state.selection = v; state.answered = true;
    recordAnswer(v === data.c, data.s);
    renderMix();
  }));
  document.querySelectorAll('[data-mi]').forEach(el => el.addEventListener("input", () => {
    state.clozeAnswers.values[parseInt(el.dataset.mi)] = el.value;
  }));
  const cmc = document.getElementById("checkMixCloze");
  if (cmc) cmc.addEventListener("click", () => {
    state.clozeAnswers.checked = true;
    const all = state.clozeAnswers.values.every((v, i) => v.trim().toLowerCase() === data.a[i].trim().toLowerCase());
    recordAnswer(all, data.s);
    renderMix();
  });
  document.getElementById("mixNext").addEventListener("click", () => {
    state.shuffled.pos++; state.answered = false; state.selection = null; state.clozeAnswers = null;
    renderMix();
  });
  document.getElementById("mixPrev").addEventListener("click", () => {
    state.shuffled.pos = Math.max(0, state.shuffled.pos - 1);
    state.answered = false; state.selection = null; state.clozeAnswers = null;
    renderMix();
  });
}

/* ---------- ICONS ---------- */
function iconCard()  { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M5.5 6.5h7M5.5 9h5"/></svg>`; }
function iconMC()    { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="5" cy="5" r="1.4"/><circle cx="5" cy="9" r="1.4"/><circle cx="5" cy="13" r="1.4"/><path d="M9 5h5M9 9h5M9 13h5"/></svg>`; }
function iconMatch() { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="5" r="1.4"/><circle cx="14" cy="9" r="1.4"/><circle cx="4" cy="13" r="1.4"/><path d="M5.4 5h7M5.4 13h7M5.4 9c2 0 5 0 7.2 0"/></svg>`; }
function iconCloze() { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 9h2M11.5 9h4"/><path d="M5 6.5h5v5H5z"/></svg>`; }
function iconTF()    { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 9.5l2.5 2.5L9 7"/><path d="M11 6l4 6M15 6l-4 6"/></svg>`; }
function iconFT()    { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4h12M3 8h12M3 12h7"/></svg>`; }
function iconImg()   { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="3.5" width="13" height="11" rx="1.5"/><circle cx="6.5" cy="7.5" r="1.2"/><path d="M3 13l3.5-3 3 2 3-3 3 3"/></svg>`; }
function iconMix()   { return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="6" r="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 8.5v3M12 6.5v3"/></svg>`; }

/* ---------- Keyboard ---------- */
document.addEventListener("keydown", e => {
  if (["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (e.key === "ArrowRight") { state.index++; resetItem(); render(); }
  else if (e.key === "ArrowLeft") { if (state.index > 0) state.index--; resetItem(); render(); }
  else if (e.key === " " && state.mode === "flash") { e.preventDefault(); state.flipped = !state.flipped; render(); }
  else if (e.key.toLowerCase() === "r") {
    const counts = { flash:FLASH.length, mc:MC.length, match:MATCH.length, cloze:CLOZE.length, tf:TF.length, freetext:FREETEXT.length, image:IMG.length };
    state.index = Math.floor(Math.random() * Math.max(1, counts[state.mode] || 1));
    resetItem(); render();
  } else if (state.mode === "tf" && (e.key === "1" || e.key === "2") && !state.answered) {
    const items = filterBy(TF); if (!items.length) return;
    const it = items[state.index % items.length];
    const v = e.key === "1";
    state.selection = v; state.answered = true;
    recordAnswer(v === it.c, it.s);
    render();
  } else if ((state.mode === "mc" || state.mode === "image") && /^[1-9]$/.test(e.key) && !state.answered) {
    const arr = state.mode === "mc" ? filterBy(MC) : filterBy(IMG);
    if (!arr.length) return;
    const it = arr[state.index % arr.length];
    const idx = parseInt(e.key) - 1;
    if (idx < it.o.length) {
      state.selection = idx; state.answered = true;
      recordAnswer(idx === it.c, it.s);
      render();
    }
  }
});
window.addEventListener("resize", positionPill);

/* ---------- Init ---------- */
function init() {
  loadState();
  renderTopbar();
  renderHero();
  renderControls();
  renderTabs();
  refreshSidebar();
  render();
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Score wirklich zurücksetzen?")) {
      state.score = { right:0, total:0, streak:0, best:0, perMode:{}, perSection:{ 3:{r:0,t:0}, 4:{r:0,t:0}, 5:{r:0,t:0}, 6:{r:0,t:0} } };
      saveState(); refreshSidebar();
    }
  });
}
document.addEventListener("DOMContentLoaded", init);
