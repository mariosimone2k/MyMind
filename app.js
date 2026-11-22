/* MyMind — quaderno clinico per psicologhe dell'età evolutiva.
   Tutti i dati restano sul dispositivo, cifrati con AES-256-GCM.
   La chiave dei dati (DEK) è casuale e viene "avvolta" due volte: con la password e con la chiave di recupero.
   L'app non effettua alcuna connessione di rete (vedi Content-Security-Policy in index.html). */
'use strict';
(() => {
const VERSION = '1.2.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.getRandomValues(new Uint32Array(2)).reduce((a, n) => a + n.toString(36), '');
const enc = new TextEncoder(), dec = new TextDecoder();

/* ============ dates ============ */
const DS = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const DL = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const MN = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => addDays(d, -((d.getDay() + 6) % 7));
const today = () => iso(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const tmin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fShort = s => { const d = parseIso(s); return `${d.getDate()} ${MN[d.getMonth()].slice(0, 3)}`; };
const fLong = s => { const d = parseIso(s); return `${DL[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()]}`; };
const fFull = s => { const d = parseIso(s); return `${d.getDate()} ${MN[d.getMonth()]} ${d.getFullYear()}`; };
const fMonth = m => { const [y, mo] = m.split('-').map(Number); return `${cap(MN[mo - 1])} ${y}`; };
const ageOf = b => { if(!b) return null; const d = parseIso(b), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if(n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; };
const eur = v => (Math.round(v * 100) / 100).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
const ago = ts => { if(!ts) return 'mai'; const d = Math.floor((Date.now() - ts) / 86400000); return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : `${d} giorni fa`; };
const stamp = () => { const d = new Date(); return `${DS[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()].slice(0, 3)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ============ icons ============ */
const P = {
 today:'<circle cx="12" cy="12" r="4"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
 kids:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.7-3.3 3.1-5 6-5s5.3 1.7 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.6 14.6c2.6-.4 4.8.9 5.4 3.9"/>',
 euro:'<path d="M17.5 6.5A7 7 0 1 0 17.5 17.5"/><path d="M4 10h9M4 14h9"/>',
 set:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
 lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
 shield:'<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 up:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3"/>',
 down:'<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3"/>',
 cloud:'<path d="M7 18.5a4.5 4.5 0 0 1-.7-8.95A6 6 0 0 1 17.8 8.6 4 4 0 0 1 17 18.5z"/>',
 left:'<path d="M15 5l-7 7 7 7"/>', right:'<path d="M9 5l7 7-7 7"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
 note:'<path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12.5A.5.5 0 0 1 5.5 20V4a.5.5 0 0 1 .5-.5z"/><path d="M9 11h6M9 15h6M14.5 3.5V8H19"/>',
 doc:'<path d="M7 3.5h7l4.5 4.5v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V8.5h5"/>',
 print:'<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
 file:'<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
 warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.01"/>',
 edit:'<path d="M15.5 4.5l4 4L9 19H5v-4z"/>',
 trash:'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
 sign:'<path d="M4 18c3-6 5-11 7-11s-1 9 1 9 3-4 4-4 1 3 4 3"/><path d="M4 21h16"/>',
 folder:'<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16.5 6.5l2.5 2.5M14 9l2 2"/>',
 import:'<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><rect x="3.5" y="16" width="17" height="4.5" rx="1.5"/>'
};
const ic = (k, s = 20, w = 1.7) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="120" fill="#432c50"/><g transform="translate(6 -14) scale(1.06) translate(-14 -2)"><path d="M256 392C196 346 150 262 186 140C262 178 300 282 256 392Z" fill="#f7e9ec"/><path d="M256 392C304 360 360 300 352 214C292 228 260 292 256 392Z" fill="#e8909d"/></g></svg>`;

/* ============ crypto ============ */
const ITER = 600000;
const b64 = u8 => { let s = ''; const a = new Uint8Array(u8); for(let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rand = n => crypto.getRandomValues(new Uint8Array(n));
async function kek(secret, salt, iter){
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
}
async function seal(key, bytes){ const iv = rand(12); const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, bytes); return {iv: b64(iv), ct: b64(ct)}; }
async function open_(key, box){ return new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv: unb64(box.iv)}, key, unb64(box.ct))); }
const importDek = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRecovery = () => { const r = rand(25); let s = ''; r.forEach(b => s += B32[b & 31]); return s.match(/.{5}/g).join('-'); };
const normRec = s => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

let DEK = null, ENV = null, D = null, dirty = null, lastSaved = 0;

async function createVault(password, data){
  const raw = rand(32), rec = newRecovery();
  const sp = rand(16), sr = rand(16);
  const wrapPw = await seal(await kek(password, sp, ITER), raw);
  const wrapRec = await seal(await kek(normRec(rec), sr, 200000), raw);
  DEK = await importDek(raw);
  ENV = {app: 'MyMind', v: 1, iter: ITER, saltPw: b64(sp), wrapPw, saltRec: b64(sr), iterRec: 200000, wrapRec, data: null, savedAt: 0};
  D = data; await persist();
  return rec;
}
async function unlockWith(env, secret, useRecovery){
  const key = useRecovery ? await kek(normRec(secret), unb64(env.saltRec), env.iterRec) : await kek(secret, unb64(env.saltPw), env.iter);
  const raw = await open_(key, useRecovery ? env.wrapRec : env.wrapPw);
  const dk = await importDek(raw);
  const data = JSON.parse(dec.decode(await open_(dk, env.data)));
  return {raw, dk, data};
}
async function rewrapPassword(raw, password){
  const sp = rand(16);
  ENV.saltPw = b64(sp); ENV.iter = ITER;
  ENV.wrapPw = await seal(await kek(password, sp, ITER), raw);
}
async function rewrapRecovery(raw){
  const rec = newRecovery(), sr = rand(16);
  ENV.saltRec = b64(sr); ENV.iterRec = 200000;
  ENV.wrapRec = await seal(await kek(normRec(rec), sr, 200000), raw);
  return rec;
}
async function persist(){
  ENV.data = await seal(DEK, enc.encode(JSON.stringify(D)));
  ENV.savedAt = Date.now();
  await idb.set('vault', ENV);
  lastSaved = Date.now();
  paintSaved();
  autoFolderBackup();
}
function save(){ if(!DEK) return; clearTimeout(dirty); dirty = setTimeout(() => persist().catch(e => toast('Errore di salvataggio: ' + e.message)), 250); }

/* ============ IndexedDB ============ */
const idb = (() => {
  let p;
  const db = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open('mymind', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('kv', mode); const q = fn(t.objectStore('kv')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  return {get: k => tx('readonly', s => s.get(k)), set: (k, v) => tx('readwrite', s => s.put(v, k)), del: k => tx('readwrite', s => s.delete(k))};
})();

/* ============ data model ============ */
const TYPES = ['Seduta', 'Psicoterapia', 'Primo incontro', 'Colloquio clinico', 'Valutazione', 'Somministrazione test', 'Colloquio genitori', 'Restituzione', 'Sostituzione'];
const blank = () => ({
  schema: 1,
  settings: {name: '', title: 'Psicologa e psicoterapeuta', place: '', fee: 30, contrib: 2, bollo: true, duration: 50, autolock: 10, masked: false, remind: 7, lastBackup: 0, snooze: 0, calDay: 5, calTime: '18:00', rooms: 'Stanza 1, Stanza 2, Stanza 3, Stanza 4'},
  kids: [], sessions: [], notes: [], invoices: {}, log: []
});
const kidById = id => D.kids.find(k => k.id === id);
const kname = k => D.settings.masked ? `${k.name.charAt(0)}. ${k.surname.charAt(0)}.` : `${k.name} ${k.surname}`.trim();
const kshort = k => `${k.name} ${k.surname ? k.surname.charAt(0) + '.' : ''}`.trim();
const initials = k => ((k.name[0] || '') + (k.surname[0] || '')).toUpperCase();
const av = (k, cls = '') => `<span class="av ${cls}" style="background:var(--t${k.tint % 8});color:var(--k${k.tint % 8})">${esc(initials(k))}</span>`;
const isDone = s => s.status === 'svolta';
const sessOf = id => D.sessions.filter(s => s.kid === id);
const notesOf = id => D.notes.filter(n => n.kid === id).sort((a, b) => a.date.localeCompare(b.date));
const nextOf = id => sessOf(id).filter(s => s.status === 'programmata' && (s.date > today() || (s.date === today() && tmin(s.start) >= nowMin()))).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
const log = x => { D.log.unshift({t: stamp(), x}); D.log = D.log.slice(0, 60); };
const goalColor = i => ['var(--k0)', 'var(--k1)', 'var(--k3)', 'var(--k4)', 'var(--k6)', 'var(--k5)'][i % 6];
const fmtScore = v => v == null ? '—' : String(v).replace('.', ',');

/* ============ lazy libraries (bundled locally, loaded only when needed) ============ */
const libs = {};
const lib = src => libs[src] || (libs[src] = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = () => { delete libs[src]; rej(new Error('lib')); }; document.head.appendChild(sc); }));
const needXLSX = () => lib('vendor/xlsx.mini.min.js');
const needDocx = () => lib('vendor/mammoth.browser.min.js');

/* ============ UI helpers ============ */
function toast(t){ const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 2800); }
function modal({title, sub = '', body, foot = '', width = 560, onOpen}){
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'ov'; ov.id = 'ov';
  ov.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgT" style="--w:${width}px"><div class="dlg-h"><div><h2 id="dlgT">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="iconbtn" data-close aria-label="Chiudi">${ic('x', 18)}</button></div><div class="dlg-b">${body}</div>${foot ? `<div class="dlg-f">${foot}</div>` : ''}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('mousedown', e => { if(e.target === ov) closeModal(); });
  $$('[data-close]', ov).forEach(b => b.onclick = closeModal);
  const f = ov.querySelector('input:not([type=hidden]):not([type=checkbox]),select,textarea'); if(f && innerWidth > 760) setTimeout(() => f.focus(), 30);
  onOpen && onOpen(ov);
  setTimeout(() => $$('.stat .v.num', ov).forEach(countUp), 60);
  return ov;
}
function closeModal(){ const o = $('#ov'); if(o) o.remove(); }
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
function confirmBox(title, text, okLabel, danger, fn){
  modal({title, body: `<p style="margin:0;color:var(--ink2)">${text}</p>`, foot: `<button class="btn" data-close>Annulla</button><button class="btn ${danger ? 'acc' : 'pri'}" id="cfOk">${okLabel}</button>`, width: 440,
    onOpen: ov => { $('#cfOk', ov).onclick = () => { closeModal(); fn(); }; $$('[data-close]', ov).forEach(b => b.onclick = closeModal); }});
}
const fval = (ov, id) => $('#' + id, ov).value.trim();
function download(name, blob){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }

/* ============ gate: setup / unlock / restore ============ */
const ART = `<div class="art"><svg class="rings" viewBox="0 0 400 400" fill="none" stroke="#f7e9ec" stroke-width="1.5"><circle cx="200" cy="200" r="60"/><circle cx="200" cy="200" r="110"/><circle cx="200" cy="200" r="160"/><circle cx="200" cy="200" r="199"/></svg>
 <div class="logo" style="color:#f7e9ec">${LOGO}MyMind</div>
 <div><h2>Il quaderno di lavoro per chi si prende cura dei bambini.</h2><p>Agenda, diario degli incontri, progressi e report per le famiglie in un unico posto ordinato.</p></div>
 <ul><li>${ic('lock', 20)}<span>I dati restano solo su questo dispositivo, cifrati con AES-256.</span></li><li>${ic('shield', 20)}<span>L'app non comunica con nessun server: la connessione è bloccata dal browser.</span></li><li>${ic('cloud', 20)}<span>Il backup cifrato va dove vuoi tu: iCloud Drive o Google Drive.</span></li></ul></div>`;
function gate(html){ document.body.classList.add('gated'); $('#root').innerHTML = `<div class="gate">${ART}<div class="form"><div class="box">${html}</div></div></div>`; }
const strength = pw => { let s = 0; if(pw.length >= 10) s++; if(pw.length >= 14) s++; if(/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++; if(/\d/.test(pw)) s++; if(/[^A-Za-z0-9]/.test(pw)) s++; return Math.min(4, s); };
function meter(input, bar, label){
  input.addEventListener('input', () => { const s = strength(input.value); const c = ['#d9534f', '#e5603e', '#d9a21b', '#5a9a6e', '#2d6a4f'][s]; bar.style.width = (input.value ? (s + 1) * 20 : 0) + '%'; bar.style.background = c; label.textContent = input.value ? ['Molto debole', 'Debole', 'Discreta', 'Buona', 'Ottima'][s] : 'Almeno 10 caratteri: lettere, numeri e un simbolo'; });
}
function viewSetup(){
  gate(`<div class="logo">${LOGO}MyMind</div><h1>Crea il tuo quaderno</h1><p class="sub">Scegli una password: servirà ogni volta per aprire MyMind e per leggere i backup.</p>
  <div id="err"></div>
  <label class="fld"><span>Il tuo nome</span><input class="in" id="nm" autocomplete="name" placeholder="Es. Dott.ssa Elena Rossi"></label>
  <label class="fld"><span>Password</span><input class="in" id="p1" type="password" autocomplete="new-password"><div class="meter"><i id="mb"></i></div><small id="ml">Almeno 10 caratteri: lettere, numeri e un simbolo</small></label>
  <label class="fld"><span>Ripeti la password</span><input class="in" id="p2" type="password" autocomplete="new-password"></label>
  <label class="check"><input type="checkbox" id="ack"><span>Ho capito che <b>nessuno può recuperare la password</b>: in caso di dimenticanza servirà la chiave di recupero che mi verrà mostrata.</span></label>
  <label class="check" style="margin-top:-6px"><input type="checkbox" id="smp"><span>Inizia con alcuni dati di esempio per provare l'app (si possono eliminare in ogni momento)</span></label>
  <button class="btn pri block" id="go">Crea il quaderno</button>
  <div class="alt"><button class="linkbtn" id="rst">Ho già un backup: ripristina</button></div>`);
  meter($('#p1'), $('#mb'), $('#ml'));
  $('#rst').onclick = viewRestore;
  $('#go').onclick = async () => {
    const p1 = $('#p1').value, p2 = $('#p2').value, err = $('#err');
    if(p1.length < 10){ err.innerHTML = '<div class="err">La password deve avere almeno 10 caratteri.</div>'; return; }
    if(strength(p1) < 2){ err.innerHTML = '<div class="err">Password troppo semplice: aggiungi maiuscole, numeri o simboli.</div>'; return; }
    if(p1 !== p2){ err.innerHTML = '<div class="err">Le due password non coincidono.</div>'; return; }
    if(!$('#ack').checked){ err.innerHTML = '<div class="err">Conferma di aver capito come funziona il recupero.</div>'; return; }
    $('#go').disabled = true; $('#go').textContent = 'Cifratura in corso…';
    const data = $('#smp').checked ? sampleData() : blank();
    data.settings.name = $('#nm').value.trim() || data.settings.name;
    data.log.unshift({t: stamp(), x: 'Quaderno creato su questo dispositivo.'});
    const rec = await createVault(p1, data);
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch(e){}
    viewRecovery(rec, true);
  };
}
function viewRecovery(rec, first){
  gate(`<div class="logo">${LOGO}MyMind</div><h1>La tua chiave di recupero</h1><p class="sub">Se dimentichi la password, solo questa chiave permette di riaprire i dati. Scrivila su carta o salvala nel gestore password, e tienila lontana dal telefono.</p>
  <div class="reckey" id="rk">${rec}</div>
  <div class="row2" style="margin-bottom:16px"><button class="btn" id="cp">${ic('file', 18)}Copia</button><button class="btn" id="pr">${ic('print', 18)}Stampa</button></div>
  <label class="check"><input type="checkbox" id="ok"><span>Ho conservato la chiave di recupero in un posto sicuro.</span></label>
  <button class="btn pri block" id="go" disabled>${first ? 'Apri MyMind' : 'Fatto'}</button>`);
  $('#ok').onchange = e => $('#go').disabled = !e.target.checked;
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(rec); toast('Chiave copiata'); } catch(e){ toast('Seleziona la chiave e copiala a mano'); } };
  $('#pr').onclick = () => { $('#print').innerHTML = `<div class="paper"><div class="hd"><div><b>MyMind</b>Chiave di recupero</div><div>${fFull(today())}</div></div><h3>Chiave di recupero</h3><p class="m">Conserva questo foglio in un luogo sicuro. Serve solo se dimentichi la password.</p><p style="font:600 22px ui-monospace,Menlo,monospace;letter-spacing:.05em;margin:24px 0">${rec}</p></div>`; print(); };
  $('#go').onclick = () => { startApp(); if(first) setTimeout(() => toast('Benvenuta in MyMind'), 300); };
}
function viewUnlock(env){
  gate(`<div class="logo">${LOGO}MyMind</div><h1>Bentornata</h1><p class="sub">Inserisci la password per aprire il quaderno.</p><div id="err"></div>
  <form id="f"><label class="fld"><span>Password</span><input class="in" id="pw" type="password" autocomplete="current-password" autofocus></label><button class="btn pri block" id="go">Apri</button></form>
  <div class="alt"><button class="linkbtn" id="rc">Ho dimenticato la password</button><button class="linkbtn" id="rs">Ripristina da un backup</button></div>`);
  setTimeout(() => $('#pw') && $('#pw').focus(), 50);
  $('#f').onsubmit = async e => { e.preventDefault(); const b = $('#go'); b.disabled = true; b.textContent = 'Apertura…';
    try { const r = await unlockWith(env, $('#pw').value, false); ENV = env; DEK = r.dk; D = migrate(r.data); startApp(); }
    catch(x){ b.disabled = false; b.textContent = 'Apri'; $('#err').innerHTML = '<div class="err">Password non corretta.</div>'; $('#pw').select(); } };
  $('#rc').onclick = () => viewForgot(env);
  $('#rs').onclick = viewRestore;
}
function viewForgot(env){
  gate(`<div class="logo">${LOGO}MyMind</div><h1>Usa la chiave di recupero</h1><p class="sub">Inserisci la chiave che hai conservato alla creazione del quaderno, poi scegli una nuova password.</p><div id="err"></div>
  <label class="fld"><span>Chiave di recupero</span><input class="in" id="rk" autocomplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" style="font-family:ui-monospace,Menlo,monospace;text-transform:uppercase"></label>
  <label class="fld"><span>Nuova password</span><input class="in" id="p1" type="password" autocomplete="new-password"><div class="meter"><i id="mb"></i></div><small id="ml"></small></label>
  <button class="btn pri block" id="go">Recupera e imposta la nuova password</button><div class="alt"><button class="linkbtn" id="bk">Torna indietro</button></div>`);
  meter($('#p1'), $('#mb'), $('#ml'));
  $('#bk').onclick = () => boot();
  $('#go').onclick = async () => {
    const p1 = $('#p1').value; if(p1.length < 10 || strength(p1) < 2){ $('#err').innerHTML = '<div class="err">Scegli una password più robusta (almeno 10 caratteri).</div>'; return; }
    try { const r = await unlockWith(env, $('#rk').value, true); ENV = env; DEK = r.dk; D = migrate(r.data); await rewrapPassword(r.raw, p1); const rec = await rewrapRecovery(r.raw); log('Password reimpostata con la chiave di recupero.'); await persist(); viewRecovery(rec, true); }
    catch(x){ $('#err').innerHTML = '<div class="err">Chiave di recupero non valida.</div>'; }
  };
}
function viewRestore(){
  gate(`<div class="logo">${LOGO}MyMind</div><h1>Ripristina da backup</h1><p class="sub">Scegli il file di backup <b>.mymind</b> da iCloud Drive, Google Drive o dal computer.</p><div id="err"></div>
  <label class="drop" id="dz"><input type="file" id="fi" accept=".mymind,application/json" class="sr"><b>Scegli il file di backup</b>oppure trascinalo qui</label>
  <div id="step2" class="hide" style="margin-top:16px"><p id="finfo" style="font-size:14px;color:var(--ink2)"></p>
   <label class="fld"><span>Password del backup</span><input class="in" id="pw" type="password" autocomplete="current-password"></label>
   <button class="btn pri block" id="go">Ripristina</button><div class="alt"><button class="linkbtn" id="userec">Uso la chiave di recupero</button></div></div>
  <div class="alt"><button class="linkbtn" id="bk">Torna indietro</button></div>`);
  let env = null, useRec = false;
  const load = async f => { try { const j = JSON.parse(await f.text()); if(j.app !== 'MyMind' || !j.wrapPw) throw 0; env = j; $('#step2').classList.remove('hide'); $('#finfo').innerHTML = `File <b>${esc(f.name)}</b> · salvato il ${j.savedAt ? new Date(j.savedAt).toLocaleString('it-IT') : 'data sconosciuta'}`; $('#pw').focus(); } catch(e){ $('#err').innerHTML = '<div class="err">Questo file non è un backup di MyMind.</div>'; } };
  $('#fi').onchange = e => e.target.files[0] && load(e.target.files[0]);
  const dz = $('#dz'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
  $('#userec').onclick = () => { useRec = !useRec; $('#pw').previousElementSibling.textContent = useRec ? 'Chiave di recupero' : 'Password del backup'; $('#pw').type = useRec ? 'text' : 'password'; $('#userec').textContent = useRec ? 'Uso la password' : 'Uso la chiave di recupero'; };
  $('#bk').onclick = () => boot();
  $('#go').onclick = async () => {
    try { const r = await unlockWith(env, $('#pw').value, useRec); ENV = env; DEK = r.dk; D = migrate(r.data);
      if(useRec){ modal({title: 'Imposta una nuova password', body: `<label class="fld"><span>Nuova password</span><input class="in" id="np" type="password"></label>`, foot: `<button class="btn pri" id="ok">Salva</button>`, onOpen: ov => $('#ok', ov).onclick = async () => { const v = $('#np', ov).value; if(v.length < 10){ toast('Almeno 10 caratteri'); return; } await rewrapPassword(r.raw, v); closeModal(); log('Quaderno ripristinato da backup.'); await persist(); startApp(); }}); return; }
      log('Quaderno ripristinato da backup.'); await persist(); startApp(); toast('Ripristino completato');
    } catch(x){ $('#err').innerHTML = `<div class="err">${useRec ? 'Chiave di recupero' : 'Password'} non corretta per questo backup.</div>`; }
  };
}
function migrate(d){ const b = blank(); d.settings = Object.assign(b.settings, d.settings || {}); ['kids', 'sessions', 'notes', 'log'].forEach(k => d[k] = d[k] || []); d.invoices = d.invoices || {}; return d; }

/* ============ auto-lock ============ */
let lastAct = Date.now();
['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev => addEventListener(ev, () => lastAct = Date.now(), {passive: true}));
setInterval(() => { if(DEK && D && D.settings.autolock > 0 && Date.now() - lastAct > D.settings.autolock * 60000) lockNow(); }, 15000);
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && DEK && D && D.settings.autolock > 0 && Date.now() - lastAct > D.settings.autolock * 60000) lockNow(); });
async function lockNow(){ if(dirty){ clearTimeout(dirty); await persist(); } DEK = null; D = null; closeModal(); $('#print').innerHTML = ''; boot(); }

/* ============ shell ============ */
const NAV = [['oggi', 'Oggi', 'today'], ['agenda', 'Agenda', 'cal'], ['bambini', 'Bambini', 'kids'], ['prestazioni', 'Prestazioni', 'euro'], ['impostazioni', 'Impostazioni', 'set']];
function startApp(){
  document.body.classList.remove('gated');
  $('#root').innerHTML = `<div class="app"><aside class="side"><div class="logo">${LOGO}MyMind</div><nav class="nav" id="nav" aria-label="Sezioni"></nav><div class="saved" id="saved"></div>
    <div class="sidefoot"><div id="bkbox"></div><div class="me"><div id="meName"></div><button class="iconbtn" id="lockBtn" title="Blocca" aria-label="Blocca MyMind">${ic('lock', 18)}</button></div></div></aside>
    <div><header class="mtop"><div class="logo">${LOGO}MyMind</div><button class="iconbtn" id="lockBtn2" aria-label="Blocca MyMind">${ic('lock', 18)}</button></header><main id="main"></main></div></div>`;
  $('#lockBtn').onclick = lockNow; $('#lockBtn2').onclick = lockNow;
  lastAct = Date.now();
  route();
  if(backupLate()) setTimeout(() => { if(D && !$('#ov')) backupReminder(); }, 1100);
}
function paintShell(cur){
  const toConfirm = D.sessions.filter(s => s.status === 'programmata' && (s.date < today() || (s.date === today() && tmin(s.start) + (s.duration || 50) < nowMin()))).length;
  $('#nav').innerHTML = NAV.map(([k, l, i]) => `<a href="#${k}" class="${cur === k ? 'on' : ''}" ${cur === k ? 'aria-current="page"' : ''}>${ic(i, 20)}<span>${l}</span>${k === 'oggi' && toConfirm ? `<span class="badge">${toConfirm}</span>` : ''}</a>`).join('');
  const st = D.settings;
  $('#meName').innerHTML = `<b>${esc(st.name || 'Il mio quaderno')}</b>${esc([st.title, st.place].filter(Boolean).join(' · '))}`;
  paintBackupBox(); paintSaved();
}
function paintSaved(){ const el = $('#saved'); if(el) el.innerHTML = `${ic('lock', 14, 2)}Cifrato e salvato sul dispositivo`; }
function backupLate(){ const st = D.settings; if(st.snooze && st.snooze > Date.now()) return false; return !st.lastBackup || Date.now() - st.lastBackup > st.remind * 86400000; }
function paintBackupBox(){
  const el = $('#bkbox'); if(!el) return; const late = backupLate();
  const st2 = D.settings, old = !st2.lastBackup || Date.now() - st2.lastBackup > st2.remind * 86400000;
  el.innerHTML = `<div class="bk ${late ? 'late' : ''}"><b>${ic('cloud', 16, 2)}${late ? 'Backup da fare' : old ? 'Backup rimandato a domani' : 'Backup aggiornato'}</b><span>Ultimo: ${ago(D.settings.lastBackup)}${folderHandle ? ' · automatico attivo' : ''}</span><button class="btn sm" id="bkNow">${ic('up', 16)}Salva backup</button></div>`;
  $('#bkNow').onclick = backupNow;
}
function route(){
  if(!D) return;
  closeModal();
  const h = decodeURIComponent((location.hash || '#oggi').slice(1));
  const [page, arg] = h.split('/');
  const map = {oggi: vToday, agenda: vAgenda, bambini: vKids, bambino: vKid, prestazioni: vMoney, impostazioni: vSettings};
  const fn = map[page] || vToday;
  const run = () => { paintShell(page === 'bambino' ? 'bambini' : (map[page] ? page : 'oggi')); fn(arg); animateIn(); window.scrollTo(0, 0); };
  if(document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches && route.ready){ const vt = document.startViewTransition(run); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {})); } else run();
  route.ready = true;
}
/* entrance choreography: staggered rise for blocks, count-up for numbers */
function animateIn(root = main()){
  if(!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = $$(':scope > *, .grid > .card, .grid > .grid > .card, .kids > .kid, .tline > .tl-it, .todo > *, .entry, .dlist > li', root);
  els.forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 14)); el.classList.remove('rise'); void el.offsetWidth; el.classList.add('rise'); });
  $$('.stat .v.num, .diffs b.num', root).forEach(countUp);
}
function countUp(el){
  if(!/^\d+$/.test(el.textContent.trim())) return; const to = parseInt(el.textContent, 10); if(!(to > 0) || to > 5000) return;
  const t0 = performance.now(), dur = 700;
  const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if(p < 1) requestAnimationFrame(step); };
  el.textContent = '0'; requestAnimationFrame(step);
}
addEventListener('hashchange', route);
const main = () => $('#main');
const head = (title, sub, acts = '', eyebrow = '') => `<div class="ph"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acts">${acts}</div></div>`;

/* ============ OGGI ============ */
function vToday(){
  const t = today(), st = D.settings;
  const hr = new Date().getHours();
  const greet = hr < 13 ? 'Buongiorno' : hr < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const first = (st.name || '').replace(/^(dott\.?ssa|dott\.?|dr\.?ssa|dr\.?)\s+/i, '').split(' ')[0];
  const todays = D.sessions.filter(s => s.date === t).sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = D.sessions.filter(s => s.status === 'programmata' && (s.date > t || (s.date === t && tmin(s.start) >= nowMin()))).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  const m = t.slice(0, 7), pm = iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).slice(0, 7);
  const mDone = D.sessions.filter(s => s.date.slice(0, 7) === m && isDone(s)).length, pDone = D.sessions.filter(s => s.date.slice(0, 7) === pm && isDone(s)).length;
  const wk0 = iso(monday(new Date())), wk1 = iso(addDays(monday(new Date()), 6));
  const wk = D.sessions.filter(s => s.date >= wk0 && s.date <= wk1 && s.status !== 'annullata');
  const toConfirm = D.sessions.filter(s => s.status === 'programmata' && (s.date < t || (s.date === t && tmin(s.start) + (s.duration || 50) < nowMin())));
  const noNote = D.sessions.filter(s => isDone(s) && s.type !== 'Colloquio genitori' && s.date >= iso(addDays(new Date(), -14)) && !D.notes.some(n => n.kid === s.kid && n.date === s.date));
  const consents = D.kids.filter(k => !k.archived && !k.temp && k.parents.some(p => p.name && !p.consent));
  const todos = [];
  if(toConfirm.length) todos.push(`<button data-go="confirm"><span class="ti warn">${ic('check', 18)}</span><span><b>${toConfirm.length} ${toConfirm.length === 1 ? 'incontro da confermare' : 'incontri da confermare'}</b><small>Segna se si sono svolti: le prestazioni si contano da qui</small></span>${ic('right', 16)}</button>`);
  if(backupLate()) todos.push(`<button data-go="backup"><span class="ti warn">${ic('cloud', 18)}</span><span><b>Fai il backup</b><small>Ultimo: ${ago(st.lastBackup)}. Salvalo su iCloud Drive o Google Drive</small></span>${ic('right', 16)}</button>`);
  if(noNote.length) todos.push(`<a href="#bambino/${noNote[0].kid}/diario"><span class="ti">${ic('note', 18)}</span><span><b>${noNote.length} ${noNote.length === 1 ? 'incontro senza nota' : 'incontri senza nota'}</b><small>Ultime due settimane · inizia da ${esc(kname(kidById(noNote[0].kid)))}</small></span>${ic('right', 16)}</a>`);
  consents.slice(0, 3).forEach(k => todos.push(`<a href="#bambino/${k.id}/anagrafica"><span class="ti">${ic('sign', 18)}</span><span><b>Consenso incompleto</b><small>${esc(kname(k))}: manca la firma di ${esc(k.parents.find(p => p.name && !p.consent).name)}</small></span>${ic('right', 16)}</a>`));
  main().innerHTML = `<section class="hero"><div><h1>${greet}${first ? `, <em>${esc(first)}</em>` : ''}</h1><p>${cap(fLong(t))} · ${todays.length ? `${todays.length} ${todays.length === 1 ? 'incontro' : 'incontri'} in programma oggi` : 'nessun incontro oggi'}</p></div>
   ${upcoming ? (k => `<a class="next" href="#bambino/${k.id}"><small>Prossimo incontro</small><b>${esc(kname(k))}</b><span>${upcoming.date === t ? 'Oggi' : cap(fLong(upcoming.date))} alle ${upcoming.start} · ${esc(upcoming.room || upcoming.type)}</span></a>`)(kidById(upcoming.kid)) : ''}</section>
  <div class="grid c4" style="margin-bottom:18px">
   <div class="card stat"><div class="v num">${todays.filter(s => s.status !== 'annullata').length}</div><div class="l">Incontri oggi</div></div>
   <div class="card stat"><div class="v num">${wk.length}</div><div class="l">Incontri questa settimana</div></div>
   <div class="card stat"><div class="v num">${mDone}</div><div class="l">Prestazioni a ${MN[new Date().getMonth()]}</div><div class="d">${cap(MN[(new Date().getMonth() + 11) % 12])}: <b>${pDone}</b></div></div>
   <div class="card stat"><div class="v num">${D.kids.filter(k => !k.archived && !k.temp).length}</div><div class="l">Bambini seguiti</div></div></div>
  <div class="grid c2"><div class="card"><div class="ch"><h2>Oggi</h2><small>Segna com'è andato ogni incontro</small></div>
   ${todays.length ? `<div class="tline">${todays.map(s => tlItem(s)).join('')}</div>` : `<div class="empty">${ic('today', 30, 1.4)}<b>Giornata libera</b>Nessun incontro in agenda per oggi.</div>`}</div>
   <div class="grid" style="align-content:start"><div class="card"><div class="ch"><h2>Da fare</h2></div>${todos.length ? `<div class="todo">${todos.join('')}</div>` : `<div class="empty" style="padding:14px">${ic('check', 26, 1.4)}<b>Tutto in ordine</b>Non ci sono attività in sospeso.</div>`}</div>
   <div class="card"><div class="ch"><h2>Attività recenti</h2></div>${D.log.length ? `<div class="feed">${D.log.slice(0, 5).map(l => `<div><i></i><span>${esc(l.x)}<small>${esc(l.t)}</small></span></div>`).join('')}</div>` : '<div class="empty" style="padding:10px">Ancora nessuna attività.</div>'}</div></div></div>`;
  bindStatus(main(), vToday);
  $$('[data-go]').forEach(b => b.onclick = () => b.dataset.go === 'backup' ? backupNow() : confirmPast(toConfirm));
}
function tlItem(s){
  const k = kidById(s.kid); const done = s.status === 'svolta';
  const hasNote = D.notes.some(n => n.kid === s.kid && n.date === s.date);
  return `<div class="tl-it ${done ? 'done' : ''}" style="color:var(--k${k.tint % 8})"><div class="tl-t num" style="color:var(--ink)">${s.start}<small>${esc(s.room || '')}</small></div><span class="tl-dot"></span>
   <div class="tl-p" style="color:var(--ink)"><a href="#bambino/${k.id}">${esc(kname(k))}</a>${k.temp ? ' <span class="chip warn" style="margin-left:4px">Sostituzione</span>' : ''}<small>${esc(s.type)}${k.temp && k.colleague ? ' · per ' + esc(k.colleague) : ''}${k.birth ? ` · ${ageOf(k.birth)} anni` : ''}</small>${done && s.type !== 'Colloquio genitori' ? `<div class="nn">${hasNote ? '<span class="chip ok">Nota scritta</span>' : `<button class="btn sm" data-note="${s.id}">${ic('note', 15)}Scrivi la nota</button>`}</div>` : ''}</div>
   ${statusSeg(s)}</div>`;
}
const statusSeg = s => `<div class="seg" role="group" aria-label="Esito dell'incontro">${[['svolta', 'Svolta', 'ok'], ['assente', 'Assente', 'no'], ['programmata', 'Da fare', '']].map(([v, l, c]) => `<button data-st="${v}" data-id="${s.id}" class="${s.status === v ? 'on ' + c : ''}">${l}</button>`).join('')}</div>`;
function bindStatus(root, rerender){
  $$('[data-st]', root).forEach(b => b.onclick = () => { const s = D.sessions.find(x => x.id === b.dataset.id); if(s.status === b.dataset.st) return; s.status = b.dataset.st; if(s.status === 'svolta') log(`Prestazione registrata: ${kname(kidById(s.kid))}, ${fShort(s.date)}.`); save(); rerender(); toast(s.status === 'svolta' ? 'Prestazione registrata' : s.status === 'assente' ? 'Assenza registrata' : 'Riportato a "da fare"'); });
  $$('[data-note]', root).forEach(b => b.onclick = () => { const s = D.sessions.find(x => x.id === b.dataset.note); noteForm(kidById(s.kid), null, s.date, rerender); });
}
function confirmPast(list){
  list = list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  modal({title: 'Incontri da confermare', sub: 'Segna come sono andati: solo quelli svolti diventano prestazioni.', width: 640,
    body: `<div class="tline" id="cl">${list.map(s => { const k = kidById(s.kid); return `<div class="tl-it" style="grid-template-columns:110px minmax(0,1fr) auto"><div class="tl-t num">${fShort(s.date)}<small>${s.start}</small></div><div class="tl-p"><b>${esc(kname(k))}</b><small>${esc(s.type)}</small></div>${statusSeg(s)}</div>`; }).join('')}</div>`,
    foot: `<button class="btn" id="allDone">Segna tutti come svolti</button><button class="btn pri" data-close>Fatto</button>`,
    onOpen: ov => { const rer = () => { $$('#cl [data-st]', ov).forEach(b => { const s = D.sessions.find(x => x.id === b.dataset.id); const c = b.dataset.st === 'svolta' ? 'ok' : b.dataset.st === 'assente' ? 'no' : ''; b.className = s.status === b.dataset.st ? 'on ' + c : ''; }); };
      $$('#cl [data-st]', ov).forEach(b => b.onclick = () => { const s = D.sessions.find(x => x.id === b.dataset.id); s.status = b.dataset.st; save(); rer(); });
      $('#allDone', ov).onclick = () => { list.forEach(s => { if(s.status === 'programmata') s.status = 'svolta'; }); log(`${list.length} incontri confermati come svolti.`); save(); closeModal(); route(); toast('Incontri confermati'); };
      $$('[data-close]', ov).forEach(b => b.onclick = () => { closeModal(); route(); }); }});
}

/* ============ AGENDA ============ */
let wkStart = null, mobileDay = null;
const HH = 58, H0 = 8, H1 = 20;
function vAgenda(arg){
  if(arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) wkStart = iso(monday(parseIso(arg)));
  if(!wkStart) wkStart = iso(monday(new Date()));
  const ws = parseIso(wkStart);
  const hasSat = D.sessions.some(s => s.date >= wkStart && s.date <= iso(addDays(ws, 6)) && parseIso(s.date).getDay() === 6);
  const n = hasSat ? 6 : 5;
  const days = Array.from({length: n}, (_, i) => iso(addDays(ws, i)));
  const evs = D.sessions.filter(s => s.date >= days[0] && s.date <= days[n - 1]);
  const t = today();
  if(!mobileDay || !days.includes(mobileDay)) mobileDay = days.includes(t) ? t : days[0];
  const minT = Math.min(H0 * 60, ...evs.map(e => tmin(e.start))), maxT = Math.max(H1 * 60, ...evs.map(e => tmin(e.start) + (e.duration || 50)));
  const h0 = Math.floor(minT / 60), h1 = Math.ceil(maxT / 60);
  const top = m => (m - h0 * 60) / 60 * HH;
  const ev = e => { const k = kidById(e.kid); const hgt = Math.max(30, (e.duration || 50) / 60 * HH - 4);
    return `<button class="evb st-${e.status}" data-ev="${e.id}" style="top:${top(tmin(e.start)) + 2}px;height:${hgt}px;background:var(--t${k.tint % 8});color:var(--k${k.tint % 8});border-color:var(--k${k.tint % 8})">${e.status === 'svolta' ? `<span class="ck">${ic('check', 13, 2.5)}</span>` : ''}<b>${esc(kname(k))}</b><span>${e.start} · ${esc(e.type === 'Seduta' ? (e.room || 'Seduta') : e.type)}</span>${e.flag ? `<span style="font-weight:700">${esc(e.flag)}</span>` : ''}</button>`; };
  const nowTop = days.includes(t) && nowMin() >= h0 * 60 && nowMin() <= h1 * 60 ? top(nowMin()) : null;
  main().innerHTML = head('Agenda', `Settimana dal ${fShort(days[0])} al ${fShort(iso(addDays(ws, 6)))}`,
   `<div class="wkbar"><button class="iconbtn" id="wp" aria-label="Settimana precedente">${ic('left', 18)}</button><button class="btn sm" id="wn">Oggi</button><button class="iconbtn" id="wf" aria-label="Settimana successiva">${ic('right', 18)}</button></div><button class="btn" id="imp">${ic('import', 18)}Importa palinsesto</button><button class="btn pri" id="add">${ic('plus', 18)}Nuovo incontro</button>`) + `
  <div class="cal" style="--days:${n};--hh:${HH}px"><div class="cal-h"><div></div>${days.map(d => { const dd = parseIso(d); return `<div class="${d === t ? 'tod' : ''}">${DS[dd.getDay()]}<b class="num">${dd.getDate()}</b></div>`; }).join('')}</div>
   <div class="cal-b" id="calb"><div class="cal-hours">${Array.from({length: h1 - h0}, (_, i) => `<div class="num">${pad(h0 + i)}:00</div>`).join('')}</div>
   ${days.map(d => `<div class="cal-col ${d === t ? 'tod' : ''}" style="height:${(h1 - h0) * HH}px">${d === t && nowTop != null ? `<div class="nowline" style="top:${nowTop}px"></div>` : ''}${evs.filter(e => e.date === d).map(ev).join('')}</div>`).join('')}</div></div>
  <div class="daylist"><div class="daychips">${days.map(d => { const dd = parseIso(d); return `<button data-day="${d}" class="${d === mobileDay ? 'on' : ''}">${DS[dd.getDay()]}<b class="num">${dd.getDate()}</b></button>`; }).join('')}</div>
   ${(l => l.length ? l.map(e => { const k = kidById(e.kid); return `<button class="dl-ev st-${e.status}" data-ev="${e.id}" style="border-left-color:var(--k${k.tint % 8})"><b class="num">${e.start}</b><span><b>${esc(kname(k))}</b><small>${[e.type, e.room, e.status !== 'programmata' ? e.status : ''].filter(Boolean).map(esc).join(' · ')}</small></span></button>`; }).join('') : `<div class="empty">${ic('cal', 28, 1.4)}<b>Nessun incontro</b>${cap(fLong(mobileDay))}</div>`)(evs.filter(e => e.date === mobileDay).sort((a, b) => a.start.localeCompare(b.start)))}</div>`;
  const cb = $('#calb'); if(cb){ const first = evs.length ? Math.min(...evs.map(e => tmin(e.start))) : 14 * 60; cb.scrollTop = Math.max(0, top(first) - 40); }
  $('#wp').onclick = () => { wkStart = iso(addDays(ws, -7)); vAgenda(); };
  $('#wf').onclick = () => { wkStart = iso(addDays(ws, 7)); vAgenda(); };
  $('#wn').onclick = () => { wkStart = iso(monday(new Date())); mobileDay = null; vAgenda(); };
  $('#add').onclick = () => sessionForm(null, days.includes(t) ? t : days[0]);
  $('#imp').onclick = importDialog;
  $$('[data-day]').forEach(b => b.onclick = () => { mobileDay = b.dataset.day; vAgenda(); });
  $$('[data-ev]').forEach(b => b.onclick = () => sessionCard(D.sessions.find(s => s.id === b.dataset.ev)));
}
function sessionCard(s){
  const k = kidById(s.kid);
  modal({title: esc(kname(k)), sub: `${cap(fLong(s.date))}, ${s.start} · ${s.duration || 50} minuti`, width: 480,
    body: `<dl class="kv" style="grid-template-columns:110px minmax(0,1fr)"><dt>Tipo</dt><dd>${esc(s.type)}</dd><dt>Stanza</dt><dd>${esc(s.room || '—')}</dd><dt>Origine</dt><dd>${s.source === 'palinsesto' ? 'Palinsesto del centro' : 'Inserito a mano'}</dd></dl><div style="margin-top:16px">${statusSeg(s)}</div>`,
    foot: `<button class="btn quiet danger sp" id="del">${ic('trash', 17)}Elimina</button><button class="btn" id="ed">${ic('edit', 17)}Modifica</button><a class="btn pri" href="#bambino/${k.id}">Apri la scheda</a>`,
    onOpen: ov => {
      $$('[data-st]', ov).forEach(b => b.onclick = () => { s.status = b.dataset.st; save(); closeModal(); route(); toast(s.status === 'svolta' ? 'Prestazione registrata' : s.status === 'assente' ? 'Assenza registrata' : 'Riportato a "da fare"'); });
      $('#ed', ov).onclick = () => sessionForm(s);
      $('#del', ov).onclick = () => confirmBox('Eliminare l\'incontro?', `${esc(kname(k))}, ${fLong(s.date)} alle ${s.start}.`, 'Elimina', true, () => { D.sessions = D.sessions.filter(x => x.id !== s.id); save(); route(); toast('Incontro eliminato'); });
    }});
}
function sessionForm(s, date, kidId){
  const isNew = !s; s = s || {date, start: '15:00', duration: D.settings.duration, room: '', type: 'Seduta', status: 'programmata', kid: kidId || ''};
  const kids = D.kids.filter(k => !k.archived || k.id === s.kid).sort((a, b) => a.name.localeCompare(b.name));
  if(!kids.length){ toast('Aggiungi prima un bambino'); location.hash = 'bambini'; return; }
  const rooms = D.settings.rooms.split(',').map(r => r.trim()).filter(Boolean);
  modal({title: isNew ? 'Nuovo incontro' : 'Modifica incontro', width: 560,
    body: `<label class="fld"><span>Bambino</span><select class="in" id="k">${isNew ? '<option value="__sub">Sostituzione: bambino di una collega…</option>' : ''}${kids.filter(k => !k.temp || k.id === s.kid).map(k => `<option value="${k.id}" ${k.id === s.kid ? 'selected' : ''}>${esc(kname(k))}</option>`).join('')}${kids.some(k => k.temp && k.id !== s.kid) ? `<optgroup label="Già visti in sostituzione">${kids.filter(k => k.temp && k.id !== s.kid).map(k => `<option value="${k.id}">${esc(kname(k))}${k.colleague ? ' · ' + esc(k.colleague) : ''}</option>`).join('')}</optgroup>` : ''}</select></label>
     <div id="subf" class="hide" style="background:var(--soft);border-radius:12px;padding:14px 14px 2px;margin-bottom:14px"><div class="row2"><label class="fld"><span>Nome del bambino</span><input class="in" id="sn" autocomplete="off"></label><label class="fld"><span>Iniziale del cognome</span><input class="in" id="ss" maxlength="20" autocomplete="off"></label></div><label class="fld"><span>Collega che sostituisci</span><input class="in" id="sc" placeholder="Es. Dott.ssa Rossi"></label><small style="display:block;color:var(--mute);margin:-6px 0 12px">Il bambino non entra tra quelli in carico: lo trovi in Bambini → Sostituzioni.</small></div>
     <div class="row3"><label class="fld"><span>Data</span><input class="in" type="date" id="d" value="${s.date}"></label><label class="fld"><span>Ora</span><input class="in" type="time" id="t" value="${s.start}" step="300"></label><label class="fld"><span>Durata (min)</span><input class="in" type="number" id="du" min="10" max="240" step="5" value="${s.duration || 50}"></label></div>
     <div class="row2"><label class="fld"><span>Tipo</span><select class="in" id="ty">${TYPES.map(x => `<option ${x === s.type ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="fld"><span>Stanza</span><input class="in" id="ro" list="rooms" value="${esc(s.room)}"><datalist id="rooms">${rooms.map(r => `<option value="${esc(r)}">`).join('')}</datalist></label></div>
     ${isNew ? `<label class="check"><input type="checkbox" id="rep"><span>Ripeti ogni settimana per <input class="in" type="number" id="repn" value="8" min="2" max="52" style="width:76px;display:inline-block;padding:4px 8px;margin:0 4px"> settimane</span></label>` : ''}`,
    foot: `<button class="btn" data-close>Annulla</button><button class="btn pri" id="ok">${isNew ? 'Aggiungi' : 'Salva'}</button>`,
    onOpen: ov => { const ks = $('#k', ov); if(isNew && ks.value === '__sub' && kids.some(k => !k.temp)) ks.value = (kids.find(k => k.id === s.kid) || kids.find(k => !k.temp)).id;
      const syncSub = () => { const on = ks.value === '__sub'; $('#subf', ov).classList.toggle('hide', !on); if(on) $('#ty', ov).value = 'Sostituzione'; else if($('#ty', ov).value === 'Sostituzione' && !(kidById(ks.value) || {}).temp) $('#ty', ov).value = 'Seduta'; if(!on && (kidById(ks.value) || {}).temp) $('#ty', ov).value = 'Sostituzione'; };
      ks.onchange = syncSub; syncSub();
      $('#ok', ov).onclick = () => {
      if(ks.value === '__sub'){ const n = fval(ov, 'sn'); if(!n){ toast('Scrivi il nome del bambino'); return; } const t = newKid({name: cap(n), surname: fval(ov, 'ss'), reason: ''}); t.temp = true; t.colleague = fval(ov, 'sc'); ks.insertAdjacentHTML('beforeend', `<option value="${t.id}"></option>`); ks.value = t.id; log(`Sostituzione: ${kname(t)}${t.colleague ? ' (per ' + t.colleague + ')' : ''}.`); }
      const v = {kid: fval(ov, 'k'), date: fval(ov, 'd'), start: fval(ov, 't'), duration: +fval(ov, 'du') || 50, type: fval(ov, 'ty'), room: fval(ov, 'ro')};
      if(!v.date || !/^\d{2}:\d{2}$/.test(v.start)){ toast('Controlla data e ora'); return; }
      if(isNew){ const reps = $('#rep', ov).checked ? Math.min(52, Math.max(2, +$('#repn', ov).value || 8)) : 1;
        for(let i = 0; i < reps; i++) D.sessions.push({id: uid(), ...v, date: iso(addDays(parseIso(v.date), 7 * i)), status: 'programmata', source: 'manuale'});
        log(`Aggiunt${reps > 1 ? 'i ' + reps + ' incontri' : 'o un incontro'} per ${kname(kidById(v.kid))}.`);
      } else Object.assign(s, v);
      save(); closeModal(); wkStart = iso(monday(parseIso(v.date))); if(location.hash.startsWith('#agenda')) vAgenda(); else route(); toast(isNew ? 'Incontro aggiunto' : 'Incontro aggiornato');
    }; }});
}

/* ============ import palinsesto ============ */
const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const WD = {lun: 1, mar: 2, mer: 3, gio: 4, ven: 5, sab: 6, dom: 0};
function parseRows(rows, refMonday){
  const out = [];
  for(const raw of rows){
    const cells = raw.map(c => String(c ?? '').trim()).filter(Boolean);
    if(!cells.length) continue;
    const line = cells.join(' | ');
    const tm = line.match(/\b(\d{1,2})[:.](\d{2})(?:\s*[-–]\s*(\d{1,2})[:.](\d{2}))?/);
    if(!tm) continue;
    const start = `${pad(+tm[1])}:${tm[2]}`;
    if(+tm[1] > 23) continue;
    const duration = tm[3] ? Math.max(10, (+tm[3] * 60 + +tm[4]) - (+tm[1] * 60 + +tm[2])) : null;
    let date = null;
    const dm = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) || null;
    const dd = line.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b(?![:.]\d)/);
    if(dm) date = `${dm[1]}-${dm[2]}-${dm[3]}`;
    else if(dd && !(dd[0].includes('.') && dd[0] === tm[0].slice(0, dd[0].length))){
      const ref = parseIso(refMonday); let y = dd[3] ? (+dd[3] < 100 ? 2000 + +dd[3] : +dd[3]) : ref.getFullYear();
      if(!dd[3] && +dd[2] < ref.getMonth() + 1 - 6) y++;
      if(+dd[2] >= 1 && +dd[2] <= 12 && +dd[1] >= 1 && +dd[1] <= 31) date = iso(new Date(y, +dd[2] - 1, +dd[1]));
    }
    if(!date){ const w = norm(line).match(/\b(lun|mar|mer|gio|ven|sab|dom)/); if(w) date = iso(addDays(parseIso(refMonday), (WD[w[1]] + 6) % 7)); }
    if(!date) continue;
    const roomM = line.match(/\b(stanza|studio|aula|sala|stanzetta)\s*[\w]*/i);
    const typeM = line.match(/(primo incontro|primo colloquio|colloquio (?:con i )?genitori|genitori|valutazione|restituzione|seduta|terapia|test)/i);
    let type = 'Seduta';
    if(typeM){ const x = typeM[1].toLowerCase(); type = x.includes('genitori') ? 'Colloquio genitori' : x.startsWith('primo') ? 'Primo incontro' : x === 'valutazione' || x === 'test' ? 'Valutazione' : x === 'restituzione' ? 'Restituzione' : 'Seduta'; }
    let nameCell = cells.find(c => /[a-zà-ü]{2,}/i.test(c) && !/^(lun|mar|mer|gio|ven|sab|dom)[a-zì]*\.?(\s+\d|$)/i.test(c) && !/\b(stanza|studio|aula|sala)\b/i.test(c) && !/^(seduta|primo|valutazione|restituzione|colloquio|terapia|test)\b/i.test(c) && !/^\d/.test(c));
    if(!nameCell) continue;
    const ageM = nameCell.match(/(\d{1,2})\s*anni/i);
    let name = nameCell.replace(/\(?\d{1,2}\s*anni\)?/i, '').replace(/\b(genitori di|colloquio genitori|genitori)\b/ig, '').replace(/[,;()]/g, ' ').replace(/\s+/g, ' ').trim();
    if(/genitori/i.test(nameCell)) type = 'Colloquio genitori';
    const subM = line.match(/sostitu\w*|\bsost\.?\b/i);
    let colleague = '';
    if(subM){ type = 'Sostituzione'; const cm = line.slice(subM.index).match(/(?:sostitu\w*|sost\.?)\s*(?:di|per|:)?\s*((?:dott\.?(?:ssa)?|dr\.?(?:ssa)?)\s*[A-ZÀ-Ü][\wà-ü']+(?:\s+[A-ZÀ-Ü][\wà-ü']+)?)/i); if(cm) colleague = cm[1].replace(/\s+/g, ' ').trim(); }
    name = name.replace(/\b(sostitu\w*|sost\.?)\b.*$/i, '').trim();
    const parts = name.split(' ').filter(Boolean);
    out.push({date, start, duration, room: roomM ? cap(roomM[0].trim()) : '', type, colleague, first: parts[0] || '', last: parts.slice(1).join(' '), age: ageM ? +ageM[1] : null});
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}
function matchKid(r){
  const f = norm(r.first), l = norm(r.last).replace(/ /g, '');
  return D.kids.find(k => norm(k.name) === f && (!l || norm(k.surname).replace(/ /g, '') === l || norm(k.surname).charAt(0) === l.charAt(0)));
}
function importDialog(){
  const nextMon = iso(addDays(monday(new Date()), 7));
  modal({title: 'Importa il palinsesto', sub: 'Carica il file ricevuto dal centro (Excel o CSV) oppure incolla il testo dell\'email. Il file viene letto solo su questo dispositivo.', width: 860,
    body: `<div class="grid c2e"><div><label class="drop" id="dz"><input type="file" id="fi" accept=".xlsx,.xls,.csv,.txt" class="sr"><b>Scegli il file del palinsesto</b>Excel, CSV o testo · oppure trascinalo qui</label>
      <label class="fld" style="margin-top:14px"><span>Oppure incolla il testo</span><textarea class="in" id="tx" rows="9" placeholder="Lun 30/11 | 14:30 | Matteo B. 7 anni | Stanza 2 | Seduta" style="font:13px/1.55 ui-monospace,Menlo,monospace"></textarea></label>
      <label class="fld"><span>Settimana di riferimento</span><input class="in" type="date" id="wk" value="${nextMon}"><small>Usata quando nel palinsesto ci sono solo i giorni della settimana, senza data.</small></label>
      <button class="btn pri" id="an">Analizza</button></div><div id="res"><div class="empty">${ic('import', 30, 1.4)}<b>Anteprima delle modifiche</b>Dopo l'analisi vedrai cosa cambia rispetto all'agenda, prima di confermare.</div></div></div>`,
    onOpen: ov => {
      const fi = $('#fi', ov), dz = $('#dz', ov);
      const readFile = async f => {
        try {
          if(/\.(xlsx|xls)$/i.test(f.name)){ await needXLSX(); const wb = XLSX.read(await f.arrayBuffer(), {type: 'array', cellDates: false}); const sh = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(sh, {header: 1, raw: false, blankrows: false}); $('#tx', ov).value = rows.map(r => r.join(' | ')).join('\n'); }
          else $('#tx', ov).value = (await f.text()).replace(/[;\t]/g, ' | ');
          dz.querySelector('b').textContent = f.name; analyze();
        } catch(e){ toast('Non riesco a leggere questo file'); }
      };
      fi.onchange = e => e.target.files[0] && readFile(e.target.files[0]);
      dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && readFile(e.dataTransfer.files[0]); };
      $('#an', ov).onclick = analyze;
      function analyze(){
        const ref = iso(monday(parseIso($('#wk', ov).value || nextMon)));
        const rows = parseRows($('#tx', ov).value.split(/\r?\n/).map(l => l.split(/\s*\|\s*|\t|;/)), ref);
        const res = $('#res', ov);
        if(!rows.length){ res.innerHTML = `<div class="err">Non ho trovato appuntamenti. Ogni riga deve contenere almeno giorno o data, ora e nome del bambino.</div>`; return; }
        const w0 = iso(monday(parseIso(rows[0].date))), w1 = iso(addDays(parseIso(w0), 6));
        const cur = D.sessions.filter(s => s.date >= w0 && s.date <= w1 && s.status === 'programmata');
        const used = new Set(), plan = [];
        rows.forEach(r => {
          const k = matchKid(r);
          const ex = k && cur.find(s => s.kid === k.id && !used.has(s.id) && (s.type === 'Colloquio genitori') === (r.type === 'Colloquio genitori'));
          if(ex){ used.add(ex.id); plan.push({r, k, ex, kind: ex.date === r.date && ex.start === r.start ? 'same' : 'moved'}); }
          else plan.push({r, k, kind: 'new', create: !k});
        });
        const gone = cur.filter(s => !used.has(s.id));
        const cnt = x => plan.filter(p => p.kind === x).length;
        res.innerHTML = `<div class="diffs"><div><b class="num">${rows.length}</b>incontri</div><div><b class="num" style="color:var(--ok)">${cnt('new')}</b>nuovi</div><div><b class="num" style="color:var(--accink)">${cnt('moved')}</b>spostati</div><div><b class="num">${gone.length}</b>non più presenti</div></div>
         <p style="margin:0 0 10px;color:var(--mute);font-size:13.5px">Settimana dal ${fShort(w0)} al ${fShort(w1)}</p>
         ${cnt('new') ? `<h4 style="margin:0 0 6px">Nuovi</h4><ul class="dlist">${plan.filter(p => p.kind === 'new').map((p, i) => `<li><span class="chip ${p.r.type === 'Sostituzione' ? 'warn' : 'ok'}">${p.r.type === 'Sostituzione' ? 'Sostituzione' : 'Nuovo'}</span><span>${esc(p.r.first)} ${esc(p.r.last)}${p.r.colleague ? ' · per ' + esc(p.r.colleague) : ''} · ${fLong(p.r.date)}, ${p.r.start}<br><small style="color:var(--mute)">${esc(p.r.type)}${p.r.room ? ' · ' + esc(p.r.room) : ''}</small></span>${p.create ? `<label style="font-size:12.5px;display:flex;gap:6px;align-items:center"><input type="checkbox" checked data-create="${plan.indexOf(p)}">${p.r.type === 'Sostituzione' ? 'aggiungi' : 'crea scheda'}</label>` : ''}</li>`).join('')}</ul>` : ''}
         ${cnt('moved') ? `<h4 style="margin:0 0 6px">Spostati</h4><ul class="dlist">${plan.filter(p => p.kind === 'moved').map(p => `<li><span class="chip warn">Spostato</span><span>${esc(kname(p.k))} · ora ${fLong(p.r.date)}, ${p.r.start}<br><small style="color:var(--mute)">prima ${fLong(p.ex.date)}, ${p.ex.start}</small></span><span></span></li>`).join('')}</ul>` : ''}
         ${gone.length ? `<h4 style="margin:0 0 6px">Non più nel palinsesto</h4><ul class="dlist">${gone.map(s => `<li><span class="chip">Rimosso</span><span>${esc(kname(kidById(s.kid)))} · ${fLong(s.date)}, ${s.start}</span><label style="font-size:12.5px;display:flex;gap:6px;align-items:center"><input type="checkbox" checked data-gone="${s.id}">elimina</label></li>`).join('')}</ul>` : ''}
         ${cnt('same') ? `<p style="color:var(--mute);font-size:13.5px">${cnt('same')} incontri invariati.</p>` : ''}
         <button class="btn pri block" id="ok">Conferma e aggiorna l'agenda</button>`;
        $('#ok', res).onclick = () => {
          let created = 0;
          plan.forEach((p, i) => {
            if(p.kind === 'same'){ p.ex.source = 'palinsesto'; p.ex.flag = ''; return; }
            if(p.kind === 'moved'){ p.ex.flag = `Spostato da ${DS[parseIso(p.ex.date).getDay()]} ${p.ex.start}`; Object.assign(p.ex, {date: p.r.date, start: p.r.start, room: p.r.room || p.ex.room, duration: p.r.duration || p.ex.duration, source: 'palinsesto'}); return; }
            let k = p.k;
            if(!k){ const cb = $(`[data-create="${i}"]`, res); if(cb && !cb.checked) return;
              k = newKid({name: cap(p.r.first), surname: p.r.last, reason: p.r.type === 'Sostituzione' ? '' : 'Nuovo ingresso dal palinsesto: da completare', school: '', birth: ''}); if(p.r.age) k.ageHint = p.r.age; if(p.r.type === 'Sostituzione'){ k.temp = true; k.colleague = p.r.colleague; } else created++; }
            D.sessions.push({id: uid(), kid: k.id, date: p.r.date, start: p.r.start, duration: p.r.duration || D.settings.duration, room: p.r.room, type: p.r.type, status: 'programmata', source: 'palinsesto', flag: 'Nuovo'});
          });
          const del = $$('[data-gone]', res).filter(c => c.checked).map(c => c.dataset.gone);
          D.sessions = D.sessions.filter(s => !del.includes(s.id));
          log(`Palinsesto ${fShort(w0)}–${fShort(w1)} importato: ${rows.length} incontri${cnt('moved') ? ', ' + cnt('moved') + ' spostati' : ''}${created ? ', ' + created + ' nuove schede' : ''}.`);
          save(); closeModal(); wkStart = w0; location.hash = 'agenda'; route(); toast('Agenda aggiornata');
        };
      }
    }});
}

/* ============ BAMBINI ============ */
let kq = '', kshow = 'attivi';
function newKid(v){ const k = {id: uid(), name: v.name, surname: v.surname || '', birth: v.birth || '', school: v.school || '', reason: v.reason || '', dx: v.dx || '', notes: '', since: v.since || today(), tint: D.kids.length % 8, archived: false,
  parents: [{name: '', role: 'madre', phone: '', email: '', consent: false, cdate: ''}, {name: '', role: 'padre', phone: '', email: '', consent: false, cdate: ''}], goals: []}; D.kids.push(k); return k; }
function vKids(){
  const m = today().slice(0, 7);
  const list = D.kids.filter(k => kshow === 'sost' ? k.temp : !k.temp && (kshow === 'archivio') === !!k.archived).filter(k => norm(`${k.name} ${k.surname} ${k.reason} ${k.school}`).includes(norm(kq))).sort((a, b) => a.name.localeCompare(b.name));
  main().innerHTML = head('Bambini', `${D.kids.filter(k => !k.archived && !k.temp).length} bambini seguiti`, `<button class="btn" id="impA">${ic('import', 18)}Importa archivio</button><button class="btn pri" id="add">${ic('plus', 18)}Nuovo bambino</button>`) + `
  <div class="toolbar"><label class="search">${ic('search', 18)}<input id="q" placeholder="Cerca per nome, scuola o motivo" value="${esc(kq)}" aria-label="Cerca"></label><div class="seg"><button data-show="attivi" class="${kshow === 'attivi' ? 'on' : ''}">In carico</button><button data-show="sost" class="${kshow === 'sost' ? 'on' : ''}">Sostituzioni</button><button data-show="archivio" class="${kshow === 'archivio' ? 'on' : ''}">Archivio</button></div></div>
  ${list.length ? `<div class="kids">${list.map(k => { const ss = sessOf(k.id).filter(isDone); const nx = nextOf(k.id); const okc = k.parents.filter(p => p.name).every(p => p.consent) && k.parents.some(p => p.name);
    return `<a class="kid" href="#bambino/${k.id}"><div class="top">${av(k)}<div><b>${esc(kname(k))}</b><small>${k.temp ? 'In sostituzione' + (k.colleague ? ' di ' + esc(k.colleague) : '') : [k.birth ? ageOf(k.birth) + ' anni' : (k.ageHint ? k.ageHint + ' anni' : ''), k.school].filter(Boolean).map(esc).join(' · ') || 'Scheda da completare'}</small></div></div><p>${esc(k.temp ? (k.reason || 'Bambino seguito da un\'altra collega: qui trovi solo gli incontri fatti in sostituzione.') : (k.reason || 'Motivo dell\'invio non ancora indicato.'))}</p>
    <div class="ft"><span><b class="num">${ss.filter(s => s.date.slice(0, 7) === m).length}</b>questo mese</span><span><b class="num">${ss.length}</b>totali</span><span><b>${nx ? fShort(nx.date) : '—'}</b>prossimo</span><span>${okc ? '<span class="chip ok">Consenso</span>' : '<span class="chip warn">Consenso</span>'}</span></div></a>`; }).join('')}</div>`
   : `<div class="card"><div class="empty">${ic('kids', 34, 1.3)}<b>${kq ? 'Nessun risultato' : kshow === 'archivio' ? 'Archivio vuoto' : kshow === 'sost' ? 'Nessuna sostituzione' : 'Nessun bambino ancora'}</b>${kq ? 'Prova con un altro nome.' : kshow === 'archivio' ? 'Qui finiscono i percorsi conclusi.' : kshow === 'sost' ? 'Quando sostituisci una collega, aggiungi l\'incontro dall\'Agenda scegliendo "Sostituzione".' : 'Aggiungi il primo bambino o importa il palinsesto del centro.'}</div></div>`}`;
  const q = $('#q'); q.oninput = () => { kq = q.value; const p = q.selectionStart; vKids(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
  $$('[data-show]').forEach(b => b.onclick = () => { kshow = b.dataset.show; vKids(); });
  $('#add').onclick = () => kidForm();
  $('#impA').onclick = () => archiveImport();
}
function kidForm(k){
  const isNew = !k;
  const v = k || {name: '', surname: '', birth: '', school: '', since: today(), reason: '', dx: '', parents: [{name: '', role: 'madre', phone: '', email: ''}, {name: '', role: 'padre', phone: '', email: ''}]};
  const pr = (p, i) => `<div class="row2" style="margin-bottom:4px"><label class="fld"><span>Genitore ${i + 1}</span><input class="in" id="pn${i}" value="${esc(p.name)}" placeholder="Nome e cognome"></label><label class="fld"><span>Ruolo</span><select class="in" id="pr${i}">${['madre', 'padre', 'tutore', 'altro'].map(r => `<option ${r === p.role ? 'selected' : ''}>${r}</option>`).join('')}</select></label></div><div class="row2"><label class="fld"><span>Telefono</span><input class="in" id="pt${i}" type="tel" value="${esc(p.phone)}"></label><label class="fld"><span>Email</span><input class="in" id="pe${i}" type="email" value="${esc(p.email)}"></label></div>`;
  modal({title: isNew ? 'Nuovo bambino' : 'Modifica anagrafica', width: 640,
    body: `<div class="row2"><label class="fld"><span>Nome</span><input class="in" id="n" value="${esc(v.name)}" autocomplete="off"></label><label class="fld"><span>Cognome</span><input class="in" id="s" value="${esc(v.surname)}" autocomplete="off"></label></div>
     <div class="row3"><label class="fld"><span>Data di nascita</span><input class="in" type="date" id="b" value="${v.birth}"></label><label class="fld"><span>Scuola e classe</span><input class="in" id="sc" value="${esc(v.school)}" placeholder="Es. 2ª primaria"></label><label class="fld"><span>In carico dal</span><input class="in" type="date" id="si" value="${v.since}"></label></div>
     <label class="fld"><span>Motivo dell'invio</span><textarea class="in" id="r" rows="2">${esc(v.reason)}</textarea></label>
     <label class="fld"><span>Diagnosi o ipotesi di lavoro</span><textarea class="in" id="dx" rows="2">${esc(v.dx)}</textarea></label>
     <h3 style="font-size:14.5px;margin:18px 0 10px">Genitori</h3>${v.parents.map(pr).join('<div style="height:10px"></div>')}`,
    foot: `${isNew ? '' : `<button class="btn quiet sp" id="arc">${k.archived ? 'Riporta in carico' : 'Archivia percorso'}</button>`}<button class="btn" data-close>Annulla</button><button class="btn pri" id="ok">${isNew ? 'Crea scheda' : 'Salva'}</button>`,
    onOpen: ov => {
      $('#ok', ov).onclick = () => {
        const name = fval(ov, 'n'); if(!name){ toast('Inserisci almeno il nome'); return; }
        const t = isNew ? newKid({name}) : k;
        Object.assign(t, {name, surname: fval(ov, 's'), birth: fval(ov, 'b'), school: fval(ov, 'sc'), since: fval(ov, 'si') || today(), reason: fval(ov, 'r'), dx: fval(ov, 'dx')});
        [0, 1].forEach(i => Object.assign(t.parents[i], {name: fval(ov, 'pn' + i), role: fval(ov, 'pr' + i), phone: fval(ov, 'pt' + i), email: fval(ov, 'pe' + i)}));
        if(t.birth) delete t.ageHint;
        if(isNew) log(`Nuova scheda: ${kname(t)}.`);
        save(); closeModal(); if(isNew) location.hash = `bambino/${t.id}`; else route(); toast(isNew ? 'Scheda creata' : 'Anagrafica aggiornata');
      };
      const a = $('#arc', ov); if(a) a.onclick = () => { k.archived = !k.archived; log(`${kname(k)}: percorso ${k.archived ? 'archiviato' : 'riaperto'}.`); save(); closeModal(); route(); toast(k.archived ? 'Percorso archiviato' : 'Bambino di nuovo in carico'); };
    }});
}

/* ============ SCHEDA BAMBINO ============ */
let chartRO = null;
function vKid(arg){
  const [id, tabArg] = (arg || '').split('/').length > 1 ? arg.split('/') : [arg, null];
  const hashTab = (location.hash.split('/')[2] || '');
  const k = kidById(id);
  if(!k){ location.hash = 'bambini'; return; }
  const tab = k.temp ? (hashTab === 'prestazioni' ? 'prestazioni' : 'diario') : ['panoramica', 'diario', 'progressi', 'anagrafica', 'prestazioni'].includes(hashTab) ? hashTab : 'panoramica';
  const ss = sessOf(id), done = ss.filter(isDone), m = today().slice(0, 7), ns = notesOf(id), nx = nextOf(id);
  const age = k.birth ? ageOf(k.birth) : k.ageHint;
  main().innerHTML = `<div class="eyebrow"><a href="#bambini">${ic('left', 14, 2)} Bambini</a></div>
  <div class="kh" style="background:var(--t${k.tint % 8})">${av(k, 'xl')}<div><h1>${esc(kname(k))}</h1><p>${k.temp ? `<span class="chip warn">In sostituzione${k.colleague ? ' di ' + esc(k.colleague) : ''}</span>` : [age ? age + ' anni' : '', k.school, k.since ? 'in carico dal ' + fFull(k.since) : ''].filter(Boolean).map(esc).join(' · ')}${k.archived ? ' · <b>archiviato</b>' : ''}</p></div>
   <div class="acts"><button class="btn" id="nn">${ic('note', 18)}Nuova nota</button>${k.temp ? `<button class="btn" id="take">${ic('kids', 18)}Prendi in carico</button><button class="btn pri" id="ho">${ic('doc', 18)}Nota per la collega</button>` : `<button class="btn pri" id="rp">${ic('doc', 18)}Report per i genitori</button>`}</div></div>
  <div class="tabs" role="tablist">${(k.temp ? [['diario', `Diario · ${ns.length}`], ['prestazioni', 'Incontri']] : [['panoramica', 'Panoramica'], ['diario', `Diario · ${ns.length}`], ['progressi', 'Obiettivi e progressi'], ['anagrafica', 'Anagrafica e consensi'], ['prestazioni', 'Prestazioni']]).map(([t, l]) => `<button role="tab" aria-selected="${t === tab}" data-tab="${t}" class="${t === tab ? 'on' : ''}">${l}</button>`).join('')}</div><div id="tab"></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { history.replaceState(null, '', `#bambino/${id}/${b.dataset.tab}`); vKid(id); animateIn($('#tab')); });
  const onT = $('.tabs button.on'); if(onT && onT.scrollIntoView) onT.scrollIntoView({block: 'nearest', inline: 'center'});
  $('#nn').onclick = () => noteForm(k, null, null, () => vKid(id));
  if(k.temp){ $('#ho').onclick = () => handover(k); $('#take').onclick = () => confirmBox('Prendere in carico?', `${esc(kname(k))} diventerà un bambino seguito da te, con scheda completa e obiettivi.`, 'Prendi in carico', false, () => { k.temp = false; k.since = today(); log(`${kname(k)} preso in carico (prima in sostituzione).`); save(); kidForm(k); }); }
  else $('#rp').onclick = () => reportView(k);
  const T = $('#tab');
  const last = ns[ns.length - 1], first = ns[0];
  if(tab === 'panoramica'){
    T.innerHTML = `<div class="grid c4" style="margin-bottom:18px"><div class="card stat"><div class="v num">${done.filter(s => s.date.slice(0, 7) === m).length}</div><div class="l">Prestazioni questo mese</div></div><div class="card stat"><div class="v num">${done.length}</div><div class="l">Prestazioni totali</div></div><div class="card stat"><div class="v num">${ss.filter(s => s.status === 'assente').length}</div><div class="l">Assenze</div></div><div class="card stat"><div class="v" style="font-size:22px;line-height:1.25">${nx ? `${cap(fLong(nx.date))}<br><span class="num">${nx.start}</span>` : 'Da programmare'}</div><div class="l">Prossimo incontro</div></div></div>
    <div class="grid c2"><div class="card"><div class="ch"><h2>Quadro clinico</h2><div class="acts"><button class="btn sm" id="ed">${ic('edit', 15)}Modifica</button></div></div><dl class="kv"><dt>Motivo dell'invio</dt><dd>${esc(k.reason) || '<span style="color:var(--mute)">Non indicato</span>'}</dd><dt>Diagnosi o ipotesi</dt><dd>${esc(k.dx) || '<span style="color:var(--mute)">Non indicata</span>'}</dd></dl>
      <div class="ch" style="margin-top:22px"><h2>Ultima nota</h2>${last ? `<small>${fLong(last.date)}</small>` : ''}</div>${last ? `<p style="margin:0 0 4px"><b>${esc(last.activity)}</b></p><p style="margin:0;color:var(--ink2);white-space:pre-line">${esc(last.obs)}</p>` : '<p style="color:var(--mute);margin:0">Nessuna nota ancora.</p>'}</div>
     <div class="card"><div class="ch"><h2>Obiettivi</h2><a href="#bambino/${id}/progressi" style="font-size:13px;color:var(--brand);font-weight:600">Vedi andamento</a></div>${k.goals.length ? k.goals.map((g, i) => { const b = last ? last.scores[g.id] : null; return `<div class="goal"><div>${esc(g.label)}</div><div class="bar"><i style="width:${(b || 0) / 5 * 100}%;background:${goalColor(i)}"></i></div><div class="sc num">${fmtScore(b)}</div></div>`; }).join('') : `<div class="empty" style="padding:14px">Nessun obiettivo definito.<br><button class="btn sm" style="margin-top:10px" id="ag">${ic('plus', 15)}Definisci gli obiettivi</button></div>`}</div></div>`;
    $('#ed').onclick = () => kidForm(k); const ag = $('#ag'); if(ag) ag.onclick = () => goalsForm(k);
  }
  if(tab === 'diario'){
    T.innerHTML = `<div style="display:flex;justify-content:flex-end;margin:-6px 0 12px"><button class="btn sm" id="ia">${ic('import', 15)}Importa appunti esistenti</button></div><div class="card">${ns.length ? ns.slice().reverse().map(n => `<div class="entry"><div class="d">${fShort(n.date)}<small>${DL[parseIso(n.date).getDay()]}</small></div><div><h3>${esc(n.activity)}</h3><p>${esc(n.obs)}</p>${k.goals.length ? `<div class="scs">${k.goals.filter(g => n.scores[g.id] != null).map(g => `<span class="chip">${esc(g.label)} · ${fmtScore(n.scores[g.id])}</span>`).join('')}</div>` : ''}</div><div><button class="iconbtn" data-edn="${n.id}" aria-label="Modifica nota">${ic('edit', 16)}</button></div></div>`).join('')
      : `<div class="empty">${ic('note', 32, 1.3)}<b>Il diario è vuoto</b>Dopo ogni incontro annota attività, osservazioni e valutazione degli obiettivi.<br><button class="btn pri" style="margin-top:14px" id="fn">${ic('plus', 16)}Scrivi la prima nota</button></div>`}</div>`;
    $$('[data-edn]').forEach(b => b.onclick = () => noteForm(k, D.notes.find(n => n.id === b.dataset.edn), null, () => vKid(id)));
    const fn = $('#fn'); if(fn) fn.onclick = () => noteForm(k, null, null, () => vKid(id));
    $('#ia').onclick = () => archiveImport(k.id);
  }
  if(tab === 'progressi'){
    T.innerHTML = `<div class="grid c2"><div class="card"><div class="ch"><h2>Andamento</h2><small>Scala da 1 a 5, una valutazione per nota</small></div>${k.goals.length && ns.length >= 2 ? `<div class="fig"><svg id="chart" role="img" aria-label="Grafico dell'andamento degli obiettivi"></svg></div><div class="legend">${k.goals.map((g, i) => `<span><i style="background:${goalColor(i)}"></i>${esc(g.label)}</span>`).join('')}</div>` : `<div class="empty">${ic('today', 30, 1.3)}<b>Ancora pochi dati</b>Il grafico compare dopo almeno due note con la valutazione degli obiettivi.</div>`}</div>
     <div class="card"><div class="ch"><h2>Obiettivi</h2><div class="acts"><button class="btn sm" id="eg">${ic('edit', 15)}Gestisci</button></div></div>${k.goals.length ? k.goals.map((g, i) => { const a = first ? first.scores[g.id] : null, b = last ? last.scores[g.id] : null; return `<div class="goal"><div>${esc(g.label)}<small>${a != null && b != null ? `da ${fmtScore(a)} a ${fmtScore(b)}` : 'non ancora valutato'}</small></div><div class="bar"><i style="width:${(b || 0) / 5 * 100}%;background:${goalColor(i)}"></i></div><div class="sc num">${fmtScore(b)}</div></div>`; }).join('') : '<div class="empty" style="padding:12px">Nessun obiettivo definito.</div>'}</div></div>`;
    if(k.goals.length && ns.length >= 2) T.insertAdjacentHTML('beforeend', `<div class="grid c2e" style="margin-top:18px"><div class="card"><div class="ch"><h2>All'inizio e oggi</h2><small>Il grafico che vedranno i genitori</small></div>${dumbbell(k, ns)}</div><div class="card"><div class="ch"><h2>Andamento complessivo</h2><small>Media degli obiettivi</small></div>${areaChart(k, ns)}</div></div>`);
    $('#eg').onclick = () => goalsForm(k);
    if(k.goals.length && ns.length >= 2) drawChart(k, ns);
  }
  if(tab === 'anagrafica'){
    T.innerHTML = `<div class="grid c2e"><div class="card"><div class="ch"><h2>Anagrafica</h2><div class="acts"><button class="btn sm" id="ed">${ic('edit', 15)}Modifica</button></div></div><dl class="kv"><dt>Nome</dt><dd>${esc(k.name)} ${esc(k.surname)}</dd><dt>Data di nascita</dt><dd>${k.birth ? fFull(k.birth) + ` (${ageOf(k.birth)} anni)` : '—'}</dd><dt>Scuola</dt><dd>${esc(k.school) || '—'}</dd><dt>In carico dal</dt><dd>${k.since ? fFull(k.since) : '—'}</dd></dl></div>
     <div class="card"><div class="ch"><h2>Genitori e consenso informato</h2></div>${k.parents.map((p, i) => `<div class="parent"><div><b>${esc(p.name) || `<span style="color:var(--mute)">Genitore ${i + 1} non indicato</span>`}</b> <span style="color:var(--mute)">· ${esc(p.role)}</span><small class="num">${[p.phone, p.email].filter(Boolean).map(esc).join(' · ') || '—'}</small></div>${p.consent ? `<span class="chip ok">${ic('check', 13, 2.5)}Firmato${p.cdate ? ' il ' + fShort(p.cdate) : ''}</span>` : `<button class="btn sm" data-sign="${i}" ${p.name ? '' : 'disabled'}>${ic('sign', 15)}Registra firma</button>`}</div>`).join('')}
      <p style="color:var(--mute);font-size:13px;margin:14px 0 0">Per i minori serve il consenso informato di chi esercita la responsabilità genitoriale, di norma entrambi i genitori.</p></div></div>`;
    $('#ed').onclick = () => kidForm(k);
    $$('[data-sign]').forEach(b => b.onclick = () => { const p = k.parents[+b.dataset.sign]; p.consent = true; p.cdate = today(); log(`Consenso di ${p.name} registrato (${kname(k)}).`); save(); vKid(id); toast('Consenso registrato'); });
  }
  if(tab === 'prestazioni'){
    const months = [...new Set(ss.map(s => s.date.slice(0, 7)))].sort().reverse();
    T.innerHTML = `<div class="grid c2"><div class="card pad0"><div class="scroll"><table class="tbl"><thead><tr><th>Data</th><th>Tipo</th><th>Stanza</th><th>Esito</th></tr></thead><tbody>${ss.slice().sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).map(s => `<tr class="lk" data-ev="${s.id}"><td class="num" style="white-space:nowrap">${cap(fLong(s.date))}, ${s.start}</td><td>${esc(s.type)}</td><td>${esc(s.room || '—')}</td><td>${s.status === 'svolta' ? '<span class="chip ok">Svolta</span>' : s.status === 'assente' ? '<span class="chip warn">Assente</span>' : s.status === 'annullata' ? '<span class="chip">Annullata</span>' : '<span class="chip brand">Programmata</span>'}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Nessun incontro.</td></tr>'}</tbody></table></div></div>
     <div class="card" style="align-self:start"><div class="ch"><h2>Per mese</h2></div>${months.map(mo => `<div class="goal"><div>${fMonth(mo)}</div><div></div><div class="sc num">${done.filter(s => s.date.slice(0, 7) === mo).length}</div></div>`).join('') || '<div class="empty" style="padding:10px">—</div>'}<button class="btn block" style="margin-top:14px" id="as">${ic('plus', 17)}Aggiungi incontro</button></div></div>`;
    $$('[data-ev]').forEach(r => r.onclick = () => sessionCard(D.sessions.find(s => s.id === r.dataset.ev)));
    $('#as').onclick = () => sessionForm(null, today(), id);
  }
}
function drawChart(k, ns){
  const s = $('#chart'); if(!s) return;
  const draw = () => {
    if(!s.isConnected){ chartRO && chartRO.disconnect(); return; }
    const W = s.clientWidth || 600, H = s.clientHeight || 280, L = 30, R = 16, Tp = 12, B = 28;
    const x = i => L + (W - L - R) * (ns.length === 1 ? .5 : i / (ns.length - 1)), y = v => Tp + (H - Tp - B) * (5 - v) / 4;
    let g = '';
    for(let v = 1; v <= 5; v++) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line2)"/><text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" font-size="11.5" fill="var(--mute)">${v}</text>`;
    const step = Math.max(1, Math.ceil(ns.length / (W < 520 ? 3 : 7)));
    ns.forEach((n, i) => { if(i % step === 0 || i === ns.length - 1){ if(i !== ns.length - 1 && ns.length - 1 - i < step) return; g += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === ns.length - 1 ? 'end' : 'middle'}" font-size="11.5" fill="var(--mute)">${fShort(n.date)}</text>`; } });
    k.goals.forEach((gl, j) => {
      const pts = ns.map((n, i) => n.scores[gl.id] != null ? [x(i), y(n.scores[gl.id])] : null).filter(Boolean);
      if(!pts.length) return;
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for(let i = 1; i < pts.length; i++){ const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
      g += `<path class="draw" style="--d:${j * 160}ms" pathLength="1" d="${d}" fill="none" stroke="${goalColor(j)}" stroke-width="2.6" stroke-linecap="round"/>`;
      pts.forEach((pt, i) => { if(i === pts.length - 1) g += `<circle class="pop" style="--d:${900 + j * 160}ms" cx="${pt[0]}" cy="${pt[1]}" r="5" fill="var(--paper)" stroke="${goalColor(j)}" stroke-width="2.6"><title>${esc(gl.label)}: ${fmtScore(ns.filter(n => n.scores[gl.id] != null)[i].scores[gl.id])}</title></circle>`; });
    });
    s.innerHTML = g;
    if(s.dataset.once) s.classList.add('drawn'); s.dataset.once = 1;
  };
  let lastW = 0;
  chartRO && chartRO.disconnect(); chartRO = new ResizeObserver(() => { if(Math.abs((s.clientWidth || 0) - lastW) > 4){ lastW = s.clientWidth; draw(); } }); chartRO.observe(s);
}
function goalsForm(k){
  const rows = () => k.goals.map((g, i) => `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="in" data-gl="${g.id}" value="${esc(g.label)}"><button class="iconbtn" data-rm="${g.id}" aria-label="Rimuovi obiettivo">${ic('trash', 16)}</button></div>`).join('');
  modal({title: 'Obiettivi del percorso', sub: 'Tre o quattro obiettivi chiari e osservabili. Le valutazioni già date restano nel diario.', width: 560,
    body: `<div id="gl">${rows()}</div><div style="display:flex;gap:8px;margin-top:6px"><input class="in" id="ng" placeholder="Nuovo obiettivo, es. Gestione dell'attesa"><button class="btn" id="ag">${ic('plus', 16)}Aggiungi</button></div>`,
    foot: `<button class="btn pri" id="ok">Salva</button>`,
    onOpen: ov => {
      const bind = () => $$('[data-rm]', ov).forEach(b => b.onclick = () => { k.goals = k.goals.filter(g => g.id !== b.dataset.rm); $('#gl', ov).innerHTML = rows(); bind(); });
      bind();
      const addG = () => { const v = $('#ng', ov).value.trim(); if(!v) return; $$('[data-gl]', ov).forEach(i => { const g = k.goals.find(x => x.id === i.dataset.gl); if(g) g.label = i.value.trim() || g.label; }); k.goals.push({id: uid(), label: v}); $('#ng', ov).value = ''; $('#gl', ov).innerHTML = rows(); bind(); $('#ng', ov).focus(); };
      $('#ag', ov).onclick = addG; $('#ng', ov).onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); addG(); } };
      $('#ok', ov).onclick = () => { $$('[data-gl]', ov).forEach(i => { const g = k.goals.find(x => x.id === i.dataset.gl); if(g) g.label = i.value.trim() || g.label; }); const v = $('#ng', ov).value.trim(); if(v) k.goals.push({id: uid(), label: v}); save(); closeModal(); route(); toast('Obiettivi salvati'); };
    }});
}
function noteForm(k, n, date, after){
  const isNew = !n; const last = notesOf(k.id).slice(-1)[0];
  n = n || {date: date || today(), activity: '', obs: '', scores: {}};
  modal({title: isNew ? 'Nuova nota' : 'Modifica nota', sub: `${esc(kname(k))} · resta cifrata solo su questo dispositivo`, width: 640,
    body: `<div class="row2"><label class="fld"><span>Data</span><input class="in" type="date" id="d" value="${n.date}"></label><label class="fld"><span>Attività svolta</span><input class="in" id="a" value="${esc(n.activity)}" placeholder="Es. gioco di ruolo su una situazione scolastica"></label></div>
     <label class="fld"><span>Osservazioni</span><textarea class="in" id="o" rows="5" placeholder="Come è andata, cosa hai notato, cosa riprendere la prossima volta">${esc(n.obs === '—' ? '' : n.obs)}</textarea></label>
     ${k.goals.length ? `<div class="fld"><span>Valutazione degli obiettivi (1–5)</span>${k.goals.map(g => { const v = n.scores[g.id] ?? (last ? last.scores[g.id] : 3) ?? 3; return `<div class="sl"><span>${esc(g.label)}</span><input type="range" min="1" max="5" step="0.5" value="${v}" data-g="${g.id}" aria-label="${esc(g.label)}"><b class="num" id="v-${g.id}">${fmtScore(v)}</b></div>`; }).join('')}</div>` : `<p style="color:var(--mute);font-size:13.5px">Definisci gli obiettivi del percorso per valutarli in ogni nota.</p>`}`,
    foot: `${isNew ? '' : `<button class="btn quiet danger sp" id="del">${ic('trash', 16)}Elimina</button>`}<button class="btn" data-close>Annulla</button><button class="btn pri" id="ok">Salva nota</button>`,
    onOpen: ov => {
      $$('input[type=range]', ov).forEach(r => r.oninput = () => $('#v-' + r.dataset.g, ov).textContent = fmtScore(+r.value));
      $('#ok', ov).onclick = () => { const a = fval(ov, 'a'); if(!a && !fval(ov, 'o')){ toast('Scrivi almeno l\'attività o un\'osservazione'); return; }
        const scores = {}; $$('input[type=range]', ov).forEach(r => scores[r.dataset.g] = +r.value);
        Object.assign(n, {date: fval(ov, 'd') || today(), activity: a || 'Incontro', obs: fval(ov, 'o') || '—', scores});
        if(isNew){ n.id = uid(); n.kid = k.id; D.notes.push(n); log(`Nota aggiunta per ${kname(k)}.`); }
        save(); closeModal(); after ? after() : route(); toast('Nota salvata'); };
      const del = $('#del', ov); if(del) del.onclick = () => confirmBox('Eliminare la nota?', 'L\'operazione non si può annullare.', 'Elimina', true, () => { D.notes = D.notes.filter(x => x !== n); save(); after ? after() : route(); toast('Nota eliminata'); });
    }});
}

/* ============ REPORT PER I GENITORI ============ */
function reportView(k){
  const ns = notesOf(k.id), first = ns[0], last = ns[ns.length - 1];
  const done = sessOf(k.id).filter(isDone).length, st = D.settings;
  const trend = g => { const a = first && first.scores[g.id], b = last && last.scores[g.id]; if(a == null || b == null) return 'in osservazione'; return b - a >= .5 ? 'in crescita' : b - a <= -.5 ? 'da consolidare' : 'stabile'; };
  const auto = k.goals.map(g => `${g.label}: ${{'in crescita': 'abbiamo osservato un miglioramento', 'stabile': 'la situazione è stabile', 'da consolidare': 'serve ancora del lavoro', 'in osservazione': 'lo stiamo osservando'}[trend(g)]}.`).join('\n');
  modal({title: `Report per i genitori`, sub: `${esc(kname(k))} · scegli cosa condividere: i genitori ricevono un documento, non il diario`, width: 1080,
    body: `<div class="rep"><div>
      <label class="fld"><span>Titolo</span><input class="in" id="r0" value="Il percorso di ${esc(k.name)}"></label>
      <label class="check" style="margin:0 0 10px"><input type="checkbox" id="rc" checked><span>Includi il grafico dell'andamento nel tempo</span></label>
      <div class="fld"><span>Obiettivi da includere</span>${k.goals.map(g => `<label class="check" style="margin:2px 0"><input type="checkbox" checked data-rg="${g.id}"><span>${esc(g.label)} <small style="color:var(--mute)">· ${trend(g)}</small></span></label>`).join('') || '<small>Nessun obiettivo definito.</small>'}</div>
      <label class="fld"><span>Cosa abbiamo fatto insieme</span><textarea class="in" id="r1" rows="4">Dal ${k.since ? fFull(k.since) : 'inizio del percorso'} abbiamo svolto ${done} incontri. Abbiamo lavorato attraverso il gioco, il disegno e alcune attività strutturate, con l'obiettivo di dare a ${k.name} strumenti concreti da usare a scuola e a casa.</textarea></label>
      <label class="fld"><span>Progressi osservati</span><textarea class="in" id="r2" rows="4">${esc(auto)}</textarea></label>
      <label class="fld"><span>Suggerimenti per casa</span><textarea class="in" id="r3" rows="3">Mantenere routine prevedibili e dedicare ogni giorno qualche minuto a parlare di com'è andata la giornata, valorizzando gli sforzi più che i risultati.</textarea></label>
      <label class="fld"><span>Prossimi passi</span><textarea class="in" id="r4" rows="2">Proseguiamo con gli incontri settimanali e ci rivediamo per un colloquio tra circa due mesi.</textarea></label>
     </div><div><div class="paper" id="pp"></div></div></div>`,
    foot: `<button class="btn" data-close>Chiudi</button><button class="btn pri" id="pr">${ic('print', 18)}Stampa o salva PDF</button>`,
    onOpen: ov => {
      const render = () => {
        const sel = k.goals.filter(g => { const c = $(`[data-rg="${g.id}"]`, ov); return c && c.checked; });
        $('#pp', ov).innerHTML = `<div class="hd"><div><b>${esc(st.name || 'MyMind')}</b>${esc([st.title, st.place].filter(Boolean).join(' · '))}</div><div style="text-align:right">Documento riservato<br>${fFull(today())}</div></div>
         <h3>${esc($('#r0', ov).value)}</h3><div class="m">Restituzione ai genitori · ${done} incontri svolti</div>
         <h4>Cosa abbiamo fatto insieme</h4><p>${esc($('#r1', ov).value)}</p>
         ${sel.length && ns.length >= 2 ? `<h4>Come sta andando: all'inizio e oggi</h4>${dumbbell({...k, goals: sel}, ns, true)}${$('#rc', ov).checked ? `<h4>Il cammino nel tempo</h4>${areaChart({...k, goals: sel}, ns, true)}` : ''}` : sel.length ? `<h4>Obiettivi del percorso</h4>${sel.map(g => `<div class="pg"><span>${esc(g.label)}</span><em>${trend(g)}</em></div>`).join('')}` : ''}
         <h4>Progressi osservati</h4><p>${esc($('#r2', ov).value)}</p><h4>Suggerimenti per casa</h4><p>${esc($('#r3', ov).value)}</p><h4>Prossimi passi</h4><p>${esc($('#r4', ov).value)}</p>
         <div class="sig"><span>Documento destinato esclusivamente ai genitori di ${esc(k.name)}.</span><span>${esc(st.name || '')}</span></div>`;
      };
      $$('textarea, input', ov).forEach(el => { el.addEventListener('input', render); el.addEventListener('change', render); });
      render();
      $('#pr', ov).onclick = () => { $('#print').innerHTML = $('#pp', ov).outerHTML; log(`Report per i genitori preparato (${kname(k)}).`); save(); print(); };
    }});
}

/* ============ GRAFICI PER LE FAMIGLIE ============ */
const LEVEL = v => v >= 4.5 ? 'Raggiunto' : v >= 3.5 ? 'Quasi raggiunto' : v >= 2.5 ? 'In parte' : v >= 1.5 ? 'Con fatica' : 'Molto difficile';
const PRINTC = ['#3b5a8f', '#8f5a32', '#7a4884', '#2a6a6e', '#a13f52', '#7a6417'];
function dumbbell(k, ns, forPrint){
  const first = ns.find(n => k.goals.some(g => n.scores[g.id] != null)) || ns[0], last = ns[ns.length - 1];
  const pc = v => ((v - 1) / 4 * 100).toFixed(1);
  return `<div class="db ${forPrint ? 'print' : ''}"><div class="db-scale"><span></span><div>${[1, 2, 3, 4, 5].map(v => `<i style="left:${pc(v)}%">${v === 1 ? 'Molto difficile' : v === 3 ? 'In parte' : v === 5 ? 'Raggiunto' : ''}</i>`).join('')}</div><span></span></div>
   ${k.goals.map((g, j) => { const a = first.scores[g.id], b = last.scores[g.id]; if(a == null || b == null) return ''; const c = forPrint ? PRINTC[j % 6] : goalColor(j); const lo = Math.min(a, b), d = b - a;
    return `<div class="db-row" style="--c:${c};--i:${j}"><span class="db-l">${esc(g.label)}<small>${LEVEL(b)}</small></span><div class="db-t">${[1, 2, 3, 4, 5].map(v => `<u style="left:${pc(v)}%"></u>`).join('')}<i class="db-ln" style="left:${pc(lo)}%;width:${(Math.abs(d) / 4 * 100).toFixed(1)}%;${d < 0 ? 'transform-origin:right' : ''}"></i><b class="db-a" style="left:${pc(a)}%" title="All'inizio: ${fmtScore(a)}"></b><b class="db-b" style="left:${pc(b)}%" title="Oggi: ${fmtScore(b)}"></b></div><em class="db-d ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' : ''}${fmtScore(Math.round(d * 2) / 2)}</em></div>`; }).join('')}
   <div class="db-key"><span><b class="db-a"></b>All'inizio · ${fShort(first.date)}</span><span><b class="db-b" style="--c:${forPrint ? '#4b3158' : 'var(--brand)'}"></b>Oggi · ${fShort(last.date)}</span></div></div>`;
}
function areaChart(k, ns, forPrint){
  const pts = ns.map(n => { const v = k.goals.map(g => n.scores[g.id]).filter(x => x != null); return v.length ? {date: n.date, v: v.reduce((a, b) => a + b, 0) / v.length} : null; }).filter(Boolean);
  if(pts.length < 2) return '<div class="empty" style="padding:12px">Servono almeno due valutazioni.</div>';
  const W = 600, H = 230, L = 34, R = 18, T = 16, B = 30, c = forPrint ? '#4b3158' : 'var(--brand)', gid = 'ag' + uid();
  const x = i => L + (W - L - R) * i / (pts.length - 1), y = v => T + (H - T - B) * (5 - v) / 4;
  const P2 = pts.map((p, i) => [x(i), y(p.v)]);
  let d = `M${P2[0][0]},${P2[0][1]}`; for(let i = 1; i < P2.length; i++){ const [x0, y0] = P2[i - 1], [x1, y1] = P2[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  const area = `${d} L${P2[P2.length - 1][0]},${H - B} L${P2[0][0]},${H - B} Z`;
  let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${forPrint ? '#4b3158' : 'currentColor'}" stop-opacity=".28"/><stop offset="1" stop-color="${forPrint ? '#4b3158' : 'currentColor'}" stop-opacity="0"/></linearGradient></defs>`;
  [1, 2, 3, 4, 5].forEach(v => g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${forPrint ? '#eceae4' : 'var(--line2)'}"/><text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#8a9491">${v}</text>`);
  const months = []; pts.forEach((p, i) => { const mk = p.date.slice(0, 7); if(!months.find(m => m.mk === mk)) months.push({mk, i}); });
  months.forEach(m => g += `<text x="${x(m.i)}" y="${H - 8}" text-anchor="${m.i === 0 ? 'start' : 'middle'}" font-size="11" fill="#8a9491">${cap(MN[+m.mk.slice(5) - 1].slice(0, 3))}</text>`);
  g += `<path class="fadein" d="${area}" fill="url(#${gid})"/><path class="draw" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  const lp = P2[P2.length - 1], fp = P2[0];
  g += `<circle cx="${fp[0]}" cy="${fp[1]}" r="4.5" fill="#fff" stroke="#9aa39f" stroke-width="2"/><circle class="pop" style="--d:1s" cx="${lp[0]}" cy="${lp[1]}" r="6" fill="${c}" stroke="#fff" stroke-width="2.5"/>`;
  g += `<text class="fadein" x="${Math.min(lp[0], W - R)}" y="${lp[1] - 14}" text-anchor="end" font-size="13" font-weight="700" fill="${c}">${fmtScore(Math.round(pts[pts.length - 1].v * 10) / 10)}</text>`;
  return `<svg class="area" viewBox="0 0 ${W} ${H}" style="color:${c};width:100%;height:auto;display:block" role="img" aria-label="Andamento medio degli obiettivi">${g}</svg>`;
}

/* ============ IMPORTA ARCHIVIO ============ */
const MONTHS_RE = MN.join('|');
const DATE_RE = new RegExp(`^\\s*[\\-•*#]*\\s*(?:(?:seduta|incontro|colloquio|sessione)\\s*(?:n\\.?\\s*\\d+)?\\s*[-–:,]?\\s*)?(?:del\\s+|il\\s+)?(?:(?:lun|mar|mer|gio|ven|sab|dom)[a-zì]*\\.?,?\\s+)?(?:(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{2,4})|(\\d{1,2})\\s+(${MONTHS_RE})\\s+(\\d{4})|(\\d{4})-(\\d{2})-(\\d{2}))`, 'i');
function dateFromMatch(m){
  if(!m) return null;
  if(m[1]){ let y = +m[3]; if(y < 100) y += 2000; const d = new Date(y, +m[2] - 1, +m[1]); return +m[2] >= 1 && +m[2] <= 12 ? iso(d) : null; }
  if(m[4]) return iso(new Date(+m[6], MN.indexOf(m[5].toLowerCase()), +m[4]));
  if(m[7]) return `${m[7]}-${m[8]}-${m[9]}`;
  return null;
}
function cellDate(v){
  if(v instanceof Date && !isNaN(v)) return iso(v);
  if(typeof v === 'number' && v > 20000 && v < 80000){ const d = new Date(Math.round((v - 25569) * 86400000)); return iso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  const m = String(v ?? '').match(DATE_RE); return dateFromMatch(m);
}
function splitNotes(text){
  const lines = text.replace(/\r/g, '').split('\n');
  const out = []; let cur = null; const pre = [];
  for(const line of lines){
    const m = line.match(DATE_RE);
    const date = m && m.index === 0 ? dateFromMatch(m) : null;
    if(date){ cur && out.push(cur); const rest = line.slice(m[0].length).replace(/^[\s:–\-,.)]+/, '').trim(); cur = {date, title: rest, body: []}; }
    else if(cur) cur.body.push(line); else pre.push(line);
  }
  cur && out.push(cur);
  return {entries: out.map(e => { let body = e.body.join('\n').replace(/\n{3,}/g, '\n\n').trim(); let title = e.title;
    if(!title){ const fl = body.split('\n')[0] || ''; const m1 = fl.match(/^(.{3,80}?[.!?:])\s+(.+)$/); if(m1){ title = m1[1].replace(/[.:]$/, ''); body = [m1[2]].concat(body.split('\n').slice(1)).join('\n').trim(); } else if(fl.length <= 90){ title = fl.replace(/[.:]$/, ''); body = body.split('\n').slice(1).join('\n').trim(); } }
    if(!title){ const sent = body.split(/(?<=[.!?])\s/)[0] || ''; title = sent.length <= 90 ? sent.replace(/[.]$/, '') : 'Incontro'; }
    return {date: e.date, activity: title || 'Incontro', obs: body || '—', scores: {}}; }), preamble: pre.join('\n').trim()};
}
async function fileToText(f){
  if(/\.docx$/i.test(f.name)){ await needDocx(); const r = await mammoth.extractRawText({arrayBuffer: await f.arrayBuffer()}); return {text: r.value}; }
  if(/\.(xlsx|xls|ods)$/i.test(f.name)){ await needXLSX(); const wb = XLSX.read(await f.arrayBuffer(), {type: 'array', cellDates: true}); const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, raw: true, blankrows: false}); return {rows}; }
  const t = await f.text();
  if(/\.csv$/i.test(f.name)){ const sep = (t.split('\n')[0].match(/;/g) || []).length >= (t.split('\n')[0].match(/,/g) || []).length ? ';' : ','; return {rows: t.split(/\r?\n/).filter(Boolean).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim()))}; }
  return {text: t};
}
function tableToNotes(rows, makeGoals, k){
  const hdr = (rows[0] || []).map(h => norm(String(h ?? '')));
  const ci = re => hdr.findIndex(h => re.test(h));
  const cD = ci(/^data|giorno|^date/), cN = ci(/note|osservaz|appunt|descriz|resocont|diario|testo/), cT = ci(/attivit|titolo|tipo|argoment|tema/);
  if(cD < 0) return null;
  const goalCols = hdr.map((h, i) => ({h: String(rows[0][i] ?? '').trim(), i})).filter(c => c.i !== cD && c.i !== cN && c.i !== cT && c.h && rows.slice(1).some(r => r[c.i] !== '' && r[c.i] != null) && rows.slice(1).every(r => r[c.i] === '' || r[c.i] == null || (!isNaN(parseFloat(String(r[c.i]).replace(',', '.'))) && parseFloat(String(r[c.i]).replace(',', '.')) <= 10)));
  const gmap = {};
  goalCols.forEach(c => { const ex = k && k.goals.find(g => norm(g.label) === norm(c.h)); gmap[c.i] = ex ? ex.id : (makeGoals ? 'new:' + c.h : null); });
  const entries = rows.slice(1).map(r => { const date = cellDate(r[cD]); if(!date) return null; const scores = {};
    goalCols.forEach(c => { const v = parseFloat(String(r[c.i] ?? '').replace(',', '.')); if(gmap[c.i] && !isNaN(v)) scores[gmap[c.i]] = Math.max(1, Math.min(5, v > 5 ? Math.round(v / 2 * 2) / 2 : Math.round(v * 2) / 2)); });
    return {date, activity: cT >= 0 && r[cT] ? String(r[cT]).trim() : 'Incontro', obs: cN >= 0 && r[cN] ? String(r[cN]).trim() : '—', scores}; }).filter(Boolean);
  return {entries, goalCols: goalCols.map(c => c.h)};
}
function archiveImport(kidId){
  const kids = D.kids.slice().sort((a, b) => a.name.localeCompare(b.name));
  let mode = 'notes', parsed = null, kidRows = null;
  modal({title: 'Importa l\'archivio', sub: 'Trasforma appunti e schede che hai già in note del diario. Tutto viene letto solo su questo dispositivo: nessun file viene inviato.', width: 980,
    body: `<div class="seg" style="margin-bottom:16px"><button data-m="notes" class="on">Appunti di un bambino</button><button data-m="kids">Elenco bambini</button></div>
     <div class="grid c2e"><div>
      <div id="who"><label class="fld"><span>Bambino</span><select class="in" id="ik"><option value="__new">Nuovo bambino…</option>${kids.map(k => `<option value="${k.id}" ${k.id === kidId ? 'selected' : ''}>${esc(kname(k))}</option>`).join('')}</select></label>
       <div class="row2 ${kidId || kids.length ? 'hide' : ''}" id="nk"><label class="fld"><span>Nome</span><input class="in" id="nkn"></label><label class="fld"><span>Cognome</span><input class="in" id="nks"></label></div></div>
      <label class="drop" id="dz"><input type="file" id="fi" accept=".docx,.txt,.md,.csv,.xlsx,.xls,.ods" class="sr"><b id="dzt">Scegli un file</b><span id="dzs">Word, Excel, CSV o testo · oppure trascinalo qui</span></label>
      <label class="fld" style="margin-top:14px" id="pasteF"><span>Oppure incolla gli appunti</span><textarea class="in" id="tx" rows="8" placeholder="12/03/2025 – Primo colloquio con la mamma\nRiferisce difficoltà al mattino…\n\n19/03/2025\nGioco con le carte delle emozioni…"></textarea><small>Ogni nuova data a inizio riga diventa una nota del diario.</small></label>
      <div id="opts"><label class="check"><input type="checkbox" id="os" checked><span>Registra anche gli incontri come prestazioni svolte</span></label><label class="check" style="margin-top:-8px"><input type="checkbox" id="og" checked><span>Dalle colonne numeriche di Excel crea gli obiettivi con le valutazioni</span></label></div>
      <button class="btn pri" id="an">Analizza</button></div>
      <div id="pv"><div class="empty">${ic('import', 32, 1.3)}<b>Anteprima</b>Qui vedrai le note riconosciute, con data e titolo, prima di importarle.</div></div></div>`,
    onOpen: ov => {
      const sel = $('#ik', ov);
      const syncNew = () => $('#nk', ov).classList.toggle('hide', sel.value !== '__new');
      if(!kidId && !kids.length) sel.value = '__new'; syncNew(); sel.onchange = syncNew;
      $$('[data-m]', ov).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('[data-m]', ov).forEach(x => x.classList.toggle('on', x === b)); $('#who', ov).classList.toggle('hide', mode === 'kids'); $('#opts', ov).classList.toggle('hide', mode === 'kids'); $('#pasteF', ov).classList.toggle('hide', mode === 'kids'); $('#dzs', ov).textContent = mode === 'kids' ? 'Excel o CSV con una riga per bambino (nome, cognome, nascita, scuola, motivo…)' : 'Word, Excel, CSV o testo · oppure trascinalo qui'; $('#pv', ov).innerHTML = `<div class="empty">${ic('import', 32, 1.3)}<b>Anteprima</b>${mode === 'kids' ? 'Qui vedrai i bambini riconosciuti dal file.' : 'Qui vedrai le note riconosciute.'}</div>`; parsed = null; kidRows = null; });
      let loaded = null;
      const take = async f => { try { loaded = await fileToText(f); $('#dzt', ov).textContent = f.name; if(loaded.text != null) $('#tx', ov).value = loaded.text; analyze(); } catch(e){ toast('Non riesco a leggere questo file'); } };
      $('#fi', ov).onchange = e => e.target.files[0] && take(e.target.files[0]);
      const dz = $('#dz', ov); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && take(e.dataTransfer.files[0]); };
      $('#tx', ov).oninput = () => { loaded = null; };
      $('#an', ov).onclick = analyze;
      function analyze(){
        const pv = $('#pv', ov);
        if(mode === 'kids') return analyzeKids(pv);
        const k = sel.value === '__new' ? null : kidById(sel.value);
        let res;
        if(loaded && loaded.rows){ res = tableToNotes(loaded.rows, $('#og', ov).checked, k); if(!res){ const txt = loaded.rows.map(r => r.join(' ')).join('\n'); res = splitNotes(txt); } }
        else res = splitNotes($('#tx', ov).value);
        parsed = res;
        if(!res.entries.length){ pv.innerHTML = `<div class="err">Non ho trovato date. Ogni nota deve iniziare con una data, ad esempio <b>12/03/2025</b> o <b>12 marzo 2025</b>, oppure il file Excel deve avere una colonna "Data".</div>`; return; }
        res.entries.sort((a, b) => a.date.localeCompare(b.date));
        const dup = e => k && D.notes.some(n => n.kid === k.id && n.date === e.date);
        pv.innerHTML = `<div class="diffs" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><b class="num">${res.entries.length}</b>note trovate</div><div><b class="num">${fShort(res.entries[0].date)}</b>dalla</div><div><b class="num">${fShort(res.entries[res.entries.length - 1].date)}</b>alla</div></div>
          ${res.goalCols && res.goalCols.length ? `<p style="font-size:13.5px;color:var(--ink2);margin:0 0 10px">Obiettivi riconosciuti dalle colonne: <b>${res.goalCols.map(esc).join(', ')}</b></p>` : ''}
          <ul class="dlist" style="max-height:340px;overflow:auto">${res.entries.map((e, i) => `<li><input type="checkbox" data-inc="${i}" ${dup(e) ? '' : 'checked'} aria-label="Includi"><span><b>${fShort(e.date)} ${parseIso(e.date).getFullYear()}</b> · ${esc(e.activity)}<br><small style="color:var(--mute)">${esc(e.obs.slice(0, 110))}${e.obs.length > 110 ? '…' : ''}</small></span>${dup(e) ? '<span class="chip">già presente</span>' : '<span></span>'}</li>`).join('')}</ul>
          <button class="btn pri block" id="go">Importa nel diario</button>`;
        animateIn(pv);
        $('#go', pv).onclick = () => {
          let kk = k;
          if(!kk){ const n = $('#nkn', ov).value.trim(); if(!n){ toast('Indica il nome del bambino'); return; } kk = newKid({name: n, surname: $('#nks', ov).value.trim(), reason: '', since: res.entries[0].date}); }
          const idmap = {};
          (res.goalCols || []).forEach(h => { const key = 'new:' + h; if(!kk.goals.find(g => norm(g.label) === norm(h)) && $('#og', ov).checked){ const g = {id: uid(), label: h}; kk.goals.push(g); idmap[key] = g.id; } else { const g = kk.goals.find(x => norm(x.label) === norm(h)); if(g) idmap[key] = g.id; } });
          const inc = $$('[data-inc]', pv).filter(c => c.checked).map(c => res.entries[+c.dataset.inc]);
          inc.forEach(e => { const scores = {}; Object.entries(e.scores).forEach(([g, v]) => scores[idmap[g] || g] = v);
            D.notes.push({id: uid(), kid: kk.id, date: e.date, activity: e.activity, obs: e.obs, scores, source: 'archivio'});
            if($('#os', ov).checked && !D.sessions.some(s => s.kid === kk.id && s.date === e.date)) D.sessions.push({id: uid(), kid: kk.id, date: e.date, start: '15:00', duration: D.settings.duration, room: '', type: 'Seduta', status: 'svolta', source: 'archivio'}); });
          if(inc.length && (!kk.since || inc[0].date < kk.since)) kk.since = inc[0].date;
          log(`Importate ${inc.length} note dall'archivio per ${kname(kk)}.`);
          save(); closeModal(); location.hash = `bambino/${kk.id}/diario`; route(); toast(`${inc.length} note importate`);
        };
      }
      function analyzeKids(pv){
        if(!loaded || !loaded.rows){ pv.innerHTML = '<div class="err">Scegli un file Excel o CSV con una riga per bambino.</div>'; return; }
        const rows = loaded.rows, hdr = (rows[0] || []).map(h => norm(String(h ?? '')));
        const ci = re => hdr.findIndex(h => re.test(h));
        const c = {full: ci(/^(bambin|paziente|nome e cognome|nominativo)/), n: ci(/^nome$/), s: ci(/^cognome/), b: ci(/nascita|nato/), sc: ci(/scuola|classe/), r: ci(/motivo|invio|richiesta/), dx: ci(/diagnos|ipotesi/), si: ci(/inizio|presa in carico|dal$/), p1: ci(/madre|genitore 1|mamma/), p2: ci(/padre|genitore 2|papa/)};
        if(c.full < 0 && c.n < 0){ pv.innerHTML = '<div class="err">Il file deve avere una colonna "Nome" (e possibilmente "Cognome") oppure "Bambino".</div>'; return; }
        kidRows = rows.slice(1).map(r => { let name = '', surname = ''; if(c.n >= 0){ name = String(r[c.n] ?? '').trim(); surname = c.s >= 0 ? String(r[c.s] ?? '').trim() : ''; } else { const p = String(r[c.full] ?? '').trim().split(/\s+/); name = p[0] || ''; surname = p.slice(1).join(' '); }
          if(!name) return null; const g = i => i >= 0 ? String(r[i] ?? '').trim() : '';
          return {name: cap(name), surname, birth: c.b >= 0 ? cellDate(r[c.b]) || '' : '', school: g(c.sc), reason: g(c.r), dx: g(c.dx), since: c.si >= 0 ? cellDate(r[c.si]) || today() : today(), p1: g(c.p1), p2: g(c.p2),
            dup: D.kids.some(k => norm(k.name) === norm(name) && norm(k.surname) === norm(surname))}; }).filter(Boolean);
        pv.innerHTML = `<div class="diffs" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b class="num">${kidRows.length}</b>bambini nel file</div><div><b class="num">${kidRows.filter(x => x.dup).length}</b>già presenti</div></div>
          <ul class="dlist" style="max-height:360px;overflow:auto">${kidRows.map((x, i) => `<li><input type="checkbox" data-kr="${i}" ${x.dup ? '' : 'checked'}><span><b>${esc(x.name)} ${esc(x.surname)}</b>${x.birth ? ' · ' + ageOf(x.birth) + ' anni' : ''}<br><small style="color:var(--mute)">${esc([x.school, x.reason].filter(Boolean).join(' · ') || '—')}</small></span>${x.dup ? '<span class="chip">già presente</span>' : '<span></span>'}</li>`).join('')}</ul>
          <button class="btn pri block" id="go">Crea le schede</button>`;
        animateIn(pv);
        $('#go', pv).onclick = () => { const sel2 = $$('[data-kr]', pv).filter(c => c.checked).map(c => kidRows[+c.dataset.kr]);
          sel2.forEach(x => { const k = newKid(x); if(x.p1) k.parents[0].name = x.p1; if(x.p2) k.parents[1].name = x.p2; });
          log(`Create ${sel2.length} schede dall'elenco importato.`); save(); closeModal(); route(); toast(`${sel2.length} schede create`); };
      }
    }});
}

/* ============ NOTA PER LA COLLEGA (sostituzioni) ============ */
function handover(k){
  const ss = sessOf(k.id).filter(isDone).sort((a, b) => a.date.localeCompare(b.date));
  const last = ss[ss.length - 1], st = D.settings;
  const nn = last ? D.notes.find(n => n.kid === k.id && n.date === last.date) : null;
  modal({title: 'Nota per la collega', sub: `${esc(kname(k))}${k.colleague ? ' · per ' + esc(k.colleague) : ''}. Rivedi il testo, poi copialo o stampalo.`, width: 640,
    body: `<label class="fld"><span>Testo</span><textarea class="in" id="ht" rows="11">Ciao${k.colleague ? ' ' + k.colleague : ''},
ti lascio un breve aggiornamento sull'incontro con ${k.name} ${k.surname}${last ? ' di ' + fLong(last.date) + ' alle ' + last.start : ''}, svolto in tua sostituzione.

Cosa abbiamo fatto: ${nn ? nn.activity : ''}
Osservazioni: ${nn && nn.obs !== '—' ? nn.obs : ''}

Punti da riprendere: 

A presto,
${st.name || ''}</textarea></label>${!nn ? '<p style="color:var(--mute);font-size:13px;margin:0">Suggerimento: scrivi prima la nota dell\'incontro, verrà inserita qui in automatico.</p>' : ''}`,
    foot: `<button class="btn" id="hc">${ic('file', 17)}Copia</button><button class="btn pri" id="hp">${ic('print', 17)}Stampa</button>`,
    onOpen: ov => {
      $('#hc', ov).onclick = async () => { try { await navigator.clipboard.writeText($('#ht', ov).value); toast('Nota copiata: incollala dove preferisci'); } catch(e){ toast('Seleziona il testo e copialo a mano'); } };
      $('#hp', ov).onclick = () => { $('#print').innerHTML = `<div class="paper"><div class="hd"><div><b>${esc(st.name || 'MyMind')}</b>${esc([st.title, st.place].filter(Boolean).join(' · '))}</div><div style="text-align:right">Nota di passaggio · riservata<br>${fFull(today())}</div></div><p>${esc($('#ht', ov).value)}</p></div>`; print(); };
    }});
}

/* ============ PRESTAZIONI ============ */
let curMonth = null;
function vMoney(){
  if(!curMonth) curMonth = today().slice(0, 7);
  const st = D.settings, m = curMonth;
  const [y, mo] = m.split('-').map(Number);
  const prevM = iso(new Date(y, mo - 2, 1)).slice(0, 7), nextM = iso(new Date(y, mo, 1)).slice(0, 7);
  const list = D.sessions.filter(s => s.date.slice(0, 7) === m && isDone(s));
  const rows = D.kids.map(k => ({k, n: list.filter(s => s.kid === k.id).length, g: list.filter(s => s.kid === k.id && s.type === 'Colloquio genitori').length})).filter(r => r.n).sort((a, b) => a.k.name.localeCompare(b.k.name));
  const n = list.length, imp = n * st.fee, cp = imp * st.contrib / 100, bollo = st.bollo && imp > 77.47 ? 2 : 0, tot = imp + cp + bollo;
  const pending = D.sessions.filter(s => s.date.slice(0, 7) === m && s.status === 'programmata' && s.date <= today()).length;
  const sent = D.invoices[m];
  const isCur = m === today().slice(0, 7);
  main().innerHTML = head('Prestazioni', 'Incontri svolti e riepilogo mensile per la fattura', `<div class="mnav"><button class="iconbtn" id="mp" aria-label="Mese precedente">${ic('left', 18)}</button><b>${fMonth(m)}</b><button class="iconbtn" id="mn" aria-label="Mese successivo">${ic('right', 18)}</button></div>`) + `
  ${pending ? `<div class="card flat" style="margin-bottom:18px;border-color:color-mix(in srgb,var(--acc) 40%,var(--line));background:var(--accsoft);display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span style="color:var(--accink);font-weight:600">${ic('warn', 18)} ${pending} incontri di questo mese non sono ancora confermati e non vengono contati.</span><button class="btn sm" id="cf">Conferma ora</button></div>` : ''}
  <div class="grid c2"><div class="card pad0">${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Bambino</th><th class="r">Incontri</th><th class="r">di cui con i genitori</th><th class="r">Importo</th></tr></thead><tbody>${rows.map(r => `<tr class="lk" data-k="${r.k.id}"><td><div style="display:flex;gap:10px;align-items:center">${av(r.k, 'sm')}<b>${esc(kname(r.k))}</b>${r.k.temp ? `<span class="chip warn">Sostituzione${r.k.colleague ? ' · ' + esc(r.k.colleague) : ''}</span>` : ''}</div></td><td class="r">${r.n}</td><td class="r">${r.g || '—'}</td><td class="r">${eur(r.n * st.fee)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Totale</td><td class="r">${n}</td><td class="r">${rows.reduce((a, r) => a + r.g, 0) || '—'}</td><td class="r">${eur(imp)}</td></tr></tfoot></table></div>`
    : `<div class="empty">${ic('euro', 30, 1.3)}<b>Nessuna prestazione</b>Non ci sono incontri svolti a ${fMonth(m).toLowerCase()}.</div>`}</div>
   <div class="card" style="align-self:start"><div class="ch"><h2>Fattura${st.place ? ' a ' + esc(st.place) : ''}</h2>${sent ? `<span class="chip ok">Inviata il ${fShort(sent)}</span>` : isCur ? '<span class="chip">Mese in corso</span>' : n ? '<span class="chip warn">Da inviare</span>' : ''}</div>
    <div class="inv"><div><span>${n} prestazioni × ${eur(st.fee)}</span><span>${eur(imp)}</span></div>${list.some(s => (kidById(s.kid) || {}).temp) ? `<div style="font-size:13px;color:var(--mute)"><span>di cui in sostituzione</span><span>${list.filter(s => (kidById(s.kid) || {}).temp).length}</span></div>` : ''}<div><span>Contributo integrativo ${String(st.contrib).replace('.', ',')}%</span><span>${eur(cp)}</span></div><div><span>Marca da bollo</span><span>${eur(bollo)}</span></div><div class="tot"><span>Totale</span><span>${eur(tot)}</span></div></div>
    <div style="display:grid;gap:8px;margin-top:18px"><button class="btn" id="pr" ${n ? '' : 'disabled'}>${ic('print', 17)}Stampa il riepilogo</button><button class="btn" id="csv" ${n ? '' : 'disabled'}>${ic('down', 17)}Scarica l'elenco (CSV)</button>${!sent && n ? `<button class="btn pri" id="snt">${ic('check', 17)}Segna come inviata</button>` : ''}</div>
    <p style="color:var(--mute);font-size:12.5px;margin:14px 0 0">Compenso, contributo e bollo si impostano in Impostazioni. Verifica le voci fiscali con il tuo commercialista.</p></div></div>`;
  $('#mp').onclick = () => { curMonth = prevM; vMoney(); };
  $('#mn').onclick = () => { curMonth = nextM; vMoney(); };
  $$('tr[data-k]').forEach(r => r.onclick = () => location.hash = `bambino/${r.dataset.k}/prestazioni`);
  const cf = $('#cf'); if(cf) cf.onclick = () => confirmPast(D.sessions.filter(s => s.date.slice(0, 7) === m && s.status === 'programmata' && s.date <= today()));
  const sn = $('#snt'); if(sn) sn.onclick = () => { D.invoices[m] = today(); log(`Fattura di ${fMonth(m).toLowerCase()} segnata come inviata.`); save(); vMoney(); toast('Fattura segnata come inviata'); };
  const csv = $('#csv'); if(csv) csv.onclick = () => { const lines = [['Data', 'Ora', 'Bambino', 'Tipo', 'Stanza'].join(';')].concat(list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).map(s => [s.date.split('-').reverse().join('/'), s.start, kname(kidById(s.kid)), s.type, s.room || ''].map(x => `"${String(x).replace(/"/g, '""')}"`).join(';'))); download(`prestazioni-${m}.csv`, new Blob(['﻿' + lines.join('\r\n')], {type: 'text/csv;charset=utf-8'})); };
  const pr = $('#pr'); if(pr) pr.onclick = () => { $('#print').innerHTML = `<div class="paper"><div class="hd"><div><b>${esc(st.name || 'MyMind')}</b>${esc([st.title, st.place].filter(Boolean).join(' · '))}</div><div style="text-align:right">Riepilogo prestazioni<br>${fMonth(m)}</div></div><h3>Prestazioni di ${fMonth(m).toLowerCase()}</h3>
    <table><thead><tr><th>Data</th><th>Ora</th><th>Bambino</th><th>Tipo</th></tr></thead><tbody>${list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).map(s => `<tr><td>${fShort(s.date)}</td><td>${s.start}</td><td>${esc(kname(kidById(s.kid)))}</td><td>${esc(s.type)}${kidById(s.kid).temp && kidById(s.kid).colleague ? ' (per ' + esc(kidById(s.kid).colleague) + ')' : ''}</td></tr>`).join('')}</tbody></table>
    <h4>Riepilogo</h4><table><tbody><tr><td>${n} prestazioni × ${eur(st.fee)}</td><td class="r">${eur(imp)}</td></tr><tr><td>Contributo integrativo ${st.contrib}%</td><td class="r">${eur(cp)}</td></tr><tr><td>Marca da bollo</td><td class="r">${eur(bollo)}</td></tr><tr><td><b>Totale</b></td><td class="r"><b>${eur(tot)}</b></td></tr></tbody></table></div>`; print(); };
}

/* ============ IMPOSTAZIONI ============ */
function vSettings(){
  const st = D.settings;
  const sw = (id, on) => `<label class="sw"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></label>`;
  main().innerHTML = head('Impostazioni', 'Profilo, sicurezza e backup') + `<div class="card">
  <section class="set"><div><h2>Profilo</h2><p>Compare nei report e nei riepiloghi.</p></div><div><div class="row2"><label class="fld"><span>Nome</span><input class="in" id="s-name" value="${esc(st.name)}"></label><label class="fld"><span>Qualifica</span><input class="in" id="s-title" value="${esc(st.title)}"></label></div><label class="fld"><span>Centro o studio</span><input class="in" id="s-place" value="${esc(st.place)}"></label><label class="fld"><span>Stanze (separate da virgola)</span><input class="in" id="s-rooms" value="${esc(st.rooms)}"></label></div></section>
  <section class="set"><div><h2>Compensi</h2><p>Usati per il riepilogo mensile delle prestazioni.</p></div><div><div class="row3"><label class="fld"><span>Compenso per incontro (€)</span><input class="in" type="number" min="0" step="0.5" id="s-fee" value="${st.fee}"></label><label class="fld"><span>Contributo integrativo (%)</span><input class="in" type="number" min="0" step="0.5" id="s-contrib" value="${st.contrib}"></label><label class="fld"><span>Durata standard (min)</span><input class="in" type="number" min="10" step="5" id="s-duration" value="${st.duration}"></label></div><div class="opt"><div><b>Marca da bollo</b><small>2 € sulle fatture oltre 77,47 €</small></div>${sw('s-bollo', st.bollo)}</div></div></section>
  <section class="set"><div><h2>Sicurezza</h2><p>Protezioni del quaderno su questo dispositivo.</p></div><div>
   <div class="opt"><div><b>Blocco automatico</b><small>Richiede la password dopo un periodo di inattività</small></div><select class="in" id="s-autolock" style="width:auto">${[[1, '1 minuto'], [5, '5 minuti'], [10, '10 minuti'], [30, '30 minuti'], [0, 'Mai']].map(([v, l]) => `<option value="${v}" ${+st.autolock === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
   <div class="opt"><div><b>Modalità riservata</b><small>Mostra solo le iniziali dei bambini, utile quando lo schermo è visibile ad altri</small></div>${sw('s-masked', st.masked)}</div>
   <div class="opt"><div><b>Password</b><small>Cambiala quando vuoi: serve la password attuale</small></div><button class="btn sm" id="chpw">${ic('key', 15)}Cambia password</button></div>
   <div class="opt"><div><b>Chiave di recupero</b><small>Generane una nuova se temi che quella vecchia sia stata vista</small></div><button class="btn sm" id="nrk">${ic('key', 15)}Nuova chiave</button></div>
   <div class="opt"><div><b>Blocca ora</b><small>Chiude il quaderno su questo dispositivo</small></div><button class="btn sm" id="lk">${ic('lock', 15)}Blocca</button></div></div></section>
  <section class="set"><div><h2>Backup</h2><p>Un file cifrato che solo tu puoi aprire. Salvalo su iCloud Drive o Google Drive per ritrovare tutto su un nuovo dispositivo.</p></div><div>
   <div class="opt"><div><b>Salva backup</b><small>Ultimo backup: ${ago(st.lastBackup)}${st.lastBackup ? ' (' + new Date(st.lastBackup).toLocaleString('it-IT', {dateStyle: 'medium', timeStyle: 'short'}) + ')' : ''}</small></div><button class="btn sm pri" id="bk">${ic('up', 15)}Salva ora</button></div>
   <div class="opt"><div><b>Promemoria nel calendario</b><small>Un evento che si ripete ogni settimana, con notifica, nel calendario del telefono</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><select class="in" id="s-calDay" style="width:auto">${[1, 2, 3, 4, 5, 6, 0].map(v => `<option value="${v}" ${+st.calDay === v ? 'selected' : ''}>${cap(DL[v])}</option>`).join('')}</select><input class="in" type="time" id="s-calTime" value="${st.calTime}" style="width:auto"><button class="btn sm" id="calAdd">${ic('cal', 15)}Aggiungi</button></div></div>
   <div class="opt"><div><b>Promemoria nell'app</b><small>MyMind te lo ricorda quando lo apri</small></div><select class="in" id="s-remind" style="width:auto">${[[1, 'Ogni giorno'], [3, 'Ogni 3 giorni'], [7, 'Ogni settimana'], [14, 'Ogni 2 settimane']].map(([v, l]) => `<option value="${v}" ${+st.remind === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
   <div class="opt"><div><b>Backup automatico in una cartella</b><small>${'showSaveFilePicker' in window ? (folderHandle ? 'Attivo: ogni modifica aggiorna il file scelto' : 'Su computer: scegli un file nella cartella di iCloud Drive o Google Drive e verrà aggiornato da solo') : 'Disponibile su computer con Chrome o Edge. Su iPhone e Android usa "Salva ora".'}</small></div>${'showSaveFilePicker' in window ? `<button class="btn sm" id="af">${ic('folder', 15)}${folderHandle ? 'Disattiva' : 'Scegli file'}</button>` : ''}</div>
   <div class="opt"><div><b>Ripristina da backup</b><small>Sostituisce i dati di questo dispositivo con quelli del file</small></div><button class="btn sm" id="rs">${ic('down', 15)}Ripristina</button></div></div></section>
  <section class="set"><div><h2>Privacy</h2><p>Come sono protetti i dati.</p></div><div class="priv">
   <div>${ic('lock', 18)}<span><b>Cifratura AES-256.</b> Ogni dato è cifrato con una chiave protetta dalla tua password (PBKDF2, 600.000 iterazioni). Senza password o chiave di recupero nessuno può leggerlo.</span></div>
   <div>${ic('shield', 18)}<span><b>Nessuna connessione.</b> MyMind non invia dati a nessun server: il browser blocca ogni richiesta di rete dell'app. Non ci sono account, analisi o pubblicità.</span></div>
   <div>${ic('cloud', 18)}<span><b>Backup sotto il tuo controllo.</b> Il file di backup è cifrato: anche se salvato su iCloud o Google Drive, solo tu puoi aprirlo.</span></div></div></section>
  <section class="set"><div><h2>Dati</h2><p>Versione ${VERSION}</p></div><div>
   ${D.kids.length ? '' : `<div class="opt"><div><b>Dati di esempio</b><small>Carica alcuni bambini e incontri di prova</small></div><button class="btn sm" id="smp">Carica</button></div>`}
   <div class="opt"><div><b>Elimina tutti i dati</b><small>Cancella il quaderno da questo dispositivo. I backup già salvati non vengono toccati.</small></div><button class="btn sm danger" id="wipe">${ic('trash', 15)}Elimina</button></div></div></section></div>`;
  const bindIn = (id, key, num) => { const el = $('#' + id); el.onchange = () => { st[key] = el.type === 'checkbox' ? el.checked : num ? +el.value : el.value.trim(); save(); paintShell('impostazioni'); toast('Impostazione salvata'); }; };
  bindIn('s-name', 'name'); bindIn('s-title', 'title'); bindIn('s-place', 'place'); bindIn('s-rooms', 'rooms'); bindIn('s-fee', 'fee', 1); bindIn('s-contrib', 'contrib', 1); bindIn('s-duration', 'duration', 1); bindIn('s-bollo', 'bollo'); bindIn('s-autolock', 'autolock', 1); bindIn('s-masked', 'masked'); bindIn('s-remind', 'remind', 1); bindIn('s-calDay', 'calDay', 1); bindIn('s-calTime', 'calTime');
  $('#calAdd').onclick = calendarReminder;
  $('#lk').onclick = lockNow; $('#bk').onclick = backupNow; $('#rs').onclick = restoreInApp;
  const af = $('#af'); if(af) af.onclick = async () => { if(folderHandle){ folderHandle = null; await idb.del('fh'); vSettings(); paintBackupBox(); toast('Backup automatico disattivato'); } else pickFolderFile(); };
  const smp = $('#smp'); if(smp) smp.onclick = () => { const s = sampleData(); Object.assign(D, {kids: s.kids, sessions: s.sessions, notes: s.notes}); log('Caricati i dati di esempio.'); save(); location.hash = 'oggi'; toast('Dati di esempio caricati'); };
  $('#wipe').onclick = () => modal({title: 'Eliminare tutti i dati?', sub: 'Il quaderno verrà cancellato da questo dispositivo. Non si può annullare.', width: 460,
    body: `<label class="fld"><span>Per confermare scrivi ELIMINA</span><input class="in" id="cw" autocomplete="off"></label>`, foot: `<button class="btn" data-close>Annulla</button><button class="btn acc" id="ok">Elimina definitivamente</button>`,
    onOpen: ov => $('#ok', ov).onclick = async () => { if($('#cw', ov).value.trim().toUpperCase() !== 'ELIMINA'){ toast('Scrivi ELIMINA per confermare'); return; } clearTimeout(dirty); await idb.del('vault'); await idb.del('fh'); DEK = null; D = null; ENV = null; folderHandle = null; closeModal(); boot(); }});
  $('#chpw').onclick = () => modal({title: 'Cambia password', width: 480,
    body: `<div id="e"></div><label class="fld"><span>Password attuale</span><input class="in" type="password" id="p0" autocomplete="current-password"></label><label class="fld"><span>Nuova password</span><input class="in" type="password" id="p1" autocomplete="new-password"><div class="meter"><i id="mb"></i></div><small id="ml"></small></label><label class="fld"><span>Ripeti la nuova password</span><input class="in" type="password" id="p2" autocomplete="new-password"></label>`,
    foot: `<button class="btn" data-close>Annulla</button><button class="btn pri" id="ok">Cambia</button>`,
    onOpen: ov => { meter($('#p1', ov), $('#mb', ov), $('#ml', ov)); $('#ok', ov).onclick = async () => {
      const p1 = $('#p1', ov).value; if(p1.length < 10 || strength(p1) < 2){ $('#e', ov).innerHTML = '<div class="err">Scegli una password più robusta.</div>'; return; } if(p1 !== $('#p2', ov).value){ $('#e', ov).innerHTML = '<div class="err">Le password non coincidono.</div>'; return; }
      try { const raw = await open_(await kek($('#p0', ov).value, unb64(ENV.saltPw), ENV.iter), ENV.wrapPw); await rewrapPassword(raw, p1); log('Password cambiata.'); await persist(); closeModal(); toast('Password cambiata. Fai un nuovo backup.'); } catch(e){ $('#e', ov).innerHTML = '<div class="err">La password attuale non è corretta.</div>'; } }; }});
  $('#nrk').onclick = () => modal({title: 'Nuova chiave di recupero', sub: 'La chiave precedente smetterà di funzionare su questo dispositivo e nei backup futuri.', width: 480,
    body: `<div id="e"></div><label class="fld"><span>Password attuale</span><input class="in" type="password" id="p0"></label>`, foot: `<button class="btn" data-close>Annulla</button><button class="btn pri" id="ok">Genera</button>`,
    onOpen: ov => $('#ok', ov).onclick = async () => { try { const raw = await open_(await kek($('#p0', ov).value, unb64(ENV.saltPw), ENV.iter), ENV.wrapPw); const rec = await rewrapRecovery(raw); await persist(); log('Nuova chiave di recupero generata.');
      modal({title: 'La tua nuova chiave di recupero', sub: 'Conservala in un posto sicuro, lontano dal telefono.', width: 520, body: `<div class="reckey">${rec}</div>`, foot: `<button class="btn pri" data-close>L'ho conservata</button>`}); } catch(e){ $('#e', ov).innerHTML = '<div class="err">Password non corretta.</div>'; } }});
}

/* ============ PROMEMORIA BACKUP ============ */
function backupReminder(){
  const st = D.settings, days = st.lastBackup ? Math.floor((Date.now() - st.lastBackup) / 86400000) : null;
  modal({title: 'È il momento del backup', width: 520,
    body: `<div class="remind"><span class="ri">${ic('cloud', 26)}</span><div><p style="margin:0 0 8px;color:var(--ink2)">${days == null ? 'Non hai ancora salvato nessun backup.' : `L'ultimo backup risale a <b>${days} ${days === 1 ? 'giorno' : 'giorni'} fa</b>.`} Se perdi o cambi telefono, il backup è l'unico modo per ritrovare il tuo lavoro.</p><p style="margin:0;color:var(--mute);font-size:14px">Bastano due tocchi: salvalo su iCloud Drive o Google Drive. Il file è cifrato, solo tu puoi aprirlo.</p></div></div>
     <button class="linkbtn" id="cal" style="margin-top:12px">${ic('cal', 16)} Aggiungi un promemoria settimanale al calendario</button>`,
    foot: `<button class="btn" id="later">Ricordamelo domani</button><button class="btn pri" id="now">${ic('up', 17)}Salva backup ora</button>`,
    onOpen: ov => {
      $('#later', ov).onclick = () => { D.settings.snooze = Date.now() + 86400000; save(); closeModal(); paintBackupBox(); toast('Te lo ricordo domani'); };
      $('#now', ov).onclick = () => { closeModal(); backupNow(); };
      $('#cal', ov).onclick = () => calendarReminder();
    }});
}
function calendarReminder(){
  const st = D.settings, [hh, mm] = (st.calTime || '18:00').split(':').map(Number);
  let d = new Date(); d.setHours(hh, mm, 0, 0); while(d.getDay() !== +st.calDay || d < new Date()) d = addDays(d, 1);
  const f = x => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const z = new Date(), stampZ = `${z.getUTCFullYear()}${pad(z.getUTCMonth() + 1)}${pad(z.getUTCDate())}T${pad(z.getUTCHours())}${pad(z.getUTCMinutes())}00Z`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyMind//Promemoria//IT', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:mymind-backup-${uid()}@mymind`, `DTSTAMP:${stampZ}`, `DTSTART:${f(d)}`, 'DURATION:PT10M', 'RRULE:FREQ=WEEKLY',
    'SUMMARY:Backup di MyMind', 'DESCRIPTION:Apri MyMind e tocca "Salva backup"\\, poi scegli iCloud Drive o Google Drive. Ci vuole un minuto.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Backup di MyMind', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  download('Promemoria-backup-MyMind.ics', new Blob([ics], {type: 'text/calendar;charset=utf-8'}));
  log(`Promemoria settimanale del backup aggiunto al calendario (${DL[+st.calDay]} alle ${st.calTime}).`); save();
  toast('Apri il file per aggiungerlo al calendario');
}

/* ============ BACKUP ============ */
let folderHandle = null;
const backupName = () => `MyMind-backup-${today()}.mymind`;
const backupBlob = () => new Blob([JSON.stringify(ENV)], {type: 'application/octet-stream'});
async function backupNow(){
  if(dirty){ clearTimeout(dirty); await persist(); }
  const file = new File([backupBlob()], backupName(), {type: 'application/octet-stream'});
  const isTouch = matchMedia('(pointer:coarse)').matches;
  let ok = false;
  if(isTouch && navigator.canShare && navigator.canShare({files: [file]})){
    try { await navigator.share({files: [file], title: 'Backup MyMind'}); ok = true; } catch(e){ if(e.name === 'AbortError') return; }
  }
  if(!ok){ download(file.name, file); ok = true; }
  D.settings.lastBackup = Date.now(); D.settings.snooze = 0; log('Backup cifrato salvato.'); await persist(); paintBackupBox();
  toast(isTouch ? 'Backup pronto: scegli iCloud Drive o Google Drive' : 'Backup scaricato: spostalo nella cartella iCloud o Google Drive');
  if(location.hash === '#impostazioni') vSettings(); else if(location.hash === '' || location.hash === '#oggi') vToday();
}
async function pickFolderFile(){
  try {
    const h = await showSaveFilePicker({suggestedName: 'MyMind-backup-automatico.mymind', types: [{description: 'Backup MyMind', accept: {'application/octet-stream': ['.mymind']}}]});
    folderHandle = h; await idb.set('fh', h); await writeFolder(); toast('Backup automatico attivo'); vSettings(); paintBackupBox();
  } catch(e){ if(e.name !== 'AbortError') toast('Non è stato possibile attivare il backup automatico'); }
}
async function writeFolder(){ const w = await folderHandle.createWritable(); await w.write(backupBlob()); await w.close(); D.settings.lastBackup = Date.now(); ENV.data = await seal(DEK, enc.encode(JSON.stringify(D))); await idb.set('vault', ENV); }
let folderTimer = null;
function autoFolderBackup(){
  if(!folderHandle) return;
  clearTimeout(folderTimer);
  folderTimer = setTimeout(async () => { try { const p = await folderHandle.queryPermission({mode: 'readwrite'}); if(p !== 'granted') return; await writeFolder(); paintBackupBox(); } catch(e){} }, 4000);
}
async function restoreFolderHandle(){ try { const h = await idb.get('fh'); if(h){ folderHandle = h; const p = await h.queryPermission({mode: 'readwrite'}); if(p !== 'granted'){ const ask = () => { h.requestPermission({mode: 'readwrite'}).then(r => { if(r === 'granted'){ autoFolderBackup(); paintBackupBox(); } }).catch(() => {}); removeEventListener('pointerdown', ask); }; addEventListener('pointerdown', ask, {once: true}); } } } catch(e){} }
function restoreInApp(){
  confirmBox('Ripristinare da un backup?', 'I dati attuali su questo dispositivo verranno sostituiti da quelli del file. Ti consiglio di salvare prima un backup di quelli attuali.', 'Scegli il file', false, async () => { if(dirty){ clearTimeout(dirty); await persist(); } DEK = null; D = null; viewRestore(); });
}

/* ============ sample data ============ */
function sampleData(){
  const d = blank();
  Object.assign(d.settings, {name: 'Dott.ssa Elena Ferri', title: 'Psicologa e psicoterapeuta dell\'età evolutiva', place: 'Centro Girasole'});
  let seed = 11; const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const K = [
   ['Matteo', 'Bianchi', 7, '2ª primaria', 1, '14:30', 'Stanza 2', 'Difficoltà di lettura segnalate dalla scuola', 'Disturbo specifico della lettura (dislessia)', ['Lettura di parole', 'Velocità di lettura', 'Fiducia nelle attività scolastiche']],
   ['Luca', 'Colombo', 9, '4ª primaria', 1, '15:30', 'Stanza 2', 'Fatica a mantenere la concentrazione in classe e a casa', 'ADHD, presentazione combinata', ['Attenzione sostenuta', 'Gestione dell\'attesa', 'Organizzazione dei compiti']],
   ['Giulia', 'Ferrara', 6, '1ª primaria', 2, '15:00', 'Stanza 3', 'Pianto e rifiuto all\'ingresso a scuola', 'Ansia da separazione', ['Separazione al mattino', 'Espressione delle emozioni', 'Autonomia nelle routine']],
   ['Sofia', 'De Luca', 11, '1ª media', 2, '16:00', 'Stanza 3', 'Forte ansia prima di verifiche e interrogazioni', 'Ansia legata alla prestazione scolastica', ['Gestione dell\'ansia prima delle verifiche', 'Partecipazione in classe', 'Uso di strategie di rilassamento']],
   ['Andrea', 'Ricci', 8, '3ª primaria', 3, '14:30', 'Stanza 2', 'Episodi di rabbia a scuola e con i fratelli', 'Valutazione in corso', ['Regolazione della rabbia', 'Rispetto delle regole condivise', 'Relazione con i compagni']],
   ['Elena', 'Vitale', 13, '3ª media', 3, '15:30', 'Stanza 2', 'Chiusura e difficoltà con i coetanei', 'Difficoltà emotive e relazionali', ['Riconoscere le emozioni', 'Relazioni con i coetanei', 'Fiducia in sé']],
   ['Tommaso', 'Neri', 5, 'ultimo anno infanzia', 3, '16:30', 'Stanza 4', 'Linguaggio poco sviluppato per l\'età', 'Ritardo del linguaggio, in collaborazione con la logopedista', ['Comprensione delle consegne', 'Gioco simbolico', 'Comunicazione con gli adulti']],
   ['Francesca', 'Longo', 12, '2ª media', 4, '15:00', 'Stanza 1', 'Difficoltà persistenti in matematica', 'Disturbo specifico del calcolo (discalculia)', ['Calcolo a mente', 'Comprensione dei problemi', 'Metodo di studio']],
   ['Chiara', 'Bruno', 7, '2ª primaria', 4, '16:00', 'Stanza 1', 'Non parla con insegnanti e compagni', 'Timidezza marcata con difficoltà a parlare a scuola', ['Comunicazione con le insegnanti', 'Gioco di gruppo', 'Sicurezza in contesti nuovi']],
   ['Davide', 'Greco', 8, '3ª primaria', 5, '15:30', 'Stanza 2', 'Molti errori ortografici e rifiuto di scrivere', 'Disturbo specifico della scrittura (disortografia)', ['Correttezza ortografica', 'Produzione di brevi testi', 'Motivazione alla scrittura']]
  ];
  const ACT = ['Gioco strutturato con turni', 'Lettura condivisa con supporti visivi', 'Attività sulle emozioni con le carte', 'Respirazione e rilassamento', 'Disegno libero e racconto', 'Gioco di ruolo su una situazione scolastica', 'Compito guidato con strategie metacognitive', 'Gioco da tavolo cooperativo', 'Storia a fumetti costruita insieme', 'Termometro delle emozioni'];
  const OBS = ['Buona collaborazione per tutta la seduta.', 'Più stanco nella seconda parte, attenzione calata dopo mezz\'ora.', 'Ha raccontato spontaneamente un episodio della settimana.', 'Ha usato da solo una strategia vista nelle sedute precedenti.', 'Ingresso faticoso, poi si è sciolto nel gioco.', 'Progressi evidenti rispetto alla settimana scorsa.', 'Ha tollerato bene una piccola frustrazione durante il gioco.', 'Molto motivato, ha chiesto di ripetere l\'attività.'];
  const now = new Date(), mon0 = addDays(monday(now), -7 * 10), t = today(), nm = nowMin();
  K.forEach((k, i) => {
    const by = now.getFullYear() - k[2];
    const kid = {id: uid(), name: k[0], surname: k[1], birth: iso(new Date(by, (i * 5) % 12, 3 + i * 2)), school: k[3], reason: k[7], dx: k[8], notes: '', since: iso(addDays(mon0, k[4] - 1 + (i === 3 ? 14 : 0))), tint: i % 8, archived: false,
      parents: [{name: ['Laura', 'Marta', 'Sara', 'Anna', 'Chiara', 'Paola', 'Ilaria', 'Elisa', 'Giorgia', 'Federica'][i] + ' ' + k[1], role: 'madre', phone: '', email: '', consent: true, cdate: iso(addDays(mon0, -3))}, {name: ['Paolo', 'Andrea', 'Luigi', 'Marco', 'Stefano', 'Gianni', 'Fabio', 'Michele', 'Daniele', 'Antonio'][i] + ' ' + k[1], role: 'padre', phone: '', email: '', consent: i !== 4, cdate: i !== 4 ? iso(addDays(mon0, -3)) : ''}],
      goals: k[9].map(g => ({id: uid(), label: g}))};
    d.kids.push(kid);
    const base = kid.goals.map(() => 1.5 + r()), gain = kid.goals.map(() => 1 + r() * 1.5);
    const weeks = 12;
    let doneIdx = 0;
    for(let w = 0; w < weeks; w++){
      const date = iso(addDays(mon0, 7 * w + k[4] - 1));
      if(date < kid.since) continue;
      const past = date < t || (date === t && tmin(k[5]) + 50 < nm);
      const absent = past && r() < .08;
      const st = past ? (absent ? 'assente' : 'svolta') : 'programmata';
      d.sessions.push({id: uid(), kid: kid.id, date, start: k[5], duration: 50, room: k[6], type: date === kid.since ? 'Primo incontro' : 'Seduta', status: st, source: 'palinsesto'});
      if(st === 'svolta'){ const p = Math.min(1, doneIdx / 8); doneIdx++; const scores = {}; kid.goals.forEach((g, j) => scores[g.id] = Math.max(1, Math.min(5, Math.round((base[j] + gain[j] * p + (r() - .5) * .6) * 2) / 2)));
        if(!(w === weeks - 3 && i % 3 === 0)) d.notes.push({id: uid(), kid: kid.id, date, activity: ACT[Math.floor(r() * ACT.length)], obs: OBS[Math.floor(r() * OBS.length)], scores}); }
      if(w % 5 === 2 && (i === 1 || i === 4)) d.sessions.push({id: uid(), kid: kid.id, date, start: '17:30', duration: 50, room: 'Stanza 1', type: 'Colloquio genitori', status: past ? 'svolta' : 'programmata', source: 'palinsesto'});
    }
  });
  d.log = [{t: stamp(), x: 'Caricati i dati di esempio.'}];
  return d;
}

/* ============ boot ============ */
async function boot(){
  document.title = 'MyMind';
  try {
    if(!window.crypto || !crypto.subtle) throw new Error('crypto');
    const env = await idb.get('vault');
    if(env && env.wrapPw) viewUnlock(env); else viewSetup();
  } catch(e){
    gate(`<div class="logo">${LOGO}MyMind</div><h1>Browser non supportato</h1><p class="sub">MyMind richiede un browser aggiornato (Safari, Chrome, Edge o Firefox) aperto da un indirizzo sicuro https.</p>`);
  }
}
restoreFolderHandle();
if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
})();
