/* Guru IT Service Desk — UI แยกตามบทบาท เน้นลูกค้าใช้ง่าย · ใช้ได้ทั้งมือถือและคอมพิวเตอร์
   รูปแบบหน้า: หัวข้อใหญ่ · ไอคอนด้านขวา · ทางลัด · แท็บข้อความ · รายการ · ปุ่ม + ลอย · ทุกส่วนย่อ/ขยายได้ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loc = () => lang === 'en' ? 'en-GB' : 'th-TH';
function fmt(d) { return d.toLocaleString(loc(), { dateStyle: 'short', timeStyle: 'short' }); }
function fmtS(d) { return d.toLocaleString(loc(), { dateStyle: 'short', timeStyle: 'medium' }); }
function fmtD(d) { return d.toLocaleDateString(loc(), { dateStyle: 'medium' }); }
function ago(d) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'เมื่อสักครู่';
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชม.ที่แล้ว`;
  return fmtD(d);
}
const nameOf = id => users[id]?.name || (id === 'system' ? 'ระบบ' : id);
const mapUrl = addr => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
const num = n => (+n || 0).toLocaleString(loc(), { maximumFractionDigits: 1 });
const hrs = n => `${num(n)} ชม.`;

const IC = {
  home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1z"/>',
  list: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  me: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 007 0"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2a5 5 0 016 4.8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
  doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  car: '<path d="M5 16h14M3 16v-4l2-5h14l2 5v4"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.1 0 1.6-.9 1.2-1.8-.5-1 .2-2.2 1.3-2.2H17a4 4 0 004-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  /* ไอคอนหมวดงาน (วาดใหม่ให้เรียบ เส้นเท่ากัน) */
  print: '<path d="M7 8V4h10v4"/><rect x="3.5" y="8" width="17" height="8.5" rx="2.5"/><path d="M7 14h10v6H7z"/><path d="M16.5 11h.01"/>',
  wifi: '<path d="M2.5 9.5a14 14 0 0119 0"/><path d="M5.5 13a9.5 9.5 0 0113 0"/><path d="M8.7 16.3a5 5 0 016.6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="M11 12.5L19.5 4"/><path d="M16 7.5l2.5 2.5M18.5 5l2 2"/>',
  pc: '<rect x="3" y="4" width="18" height="12" rx="2.5"/><path d="M9 20h6M12 16v4"/>',
  tool: '<path d="M14.5 5.5a4 4 0 005 5l-9.3 9.3a2.1 2.1 0 01-3-3z"/><path d="M14.5 5.5L17 3l4 4-2.5 2.5"/>',
  cctv: '<path d="M3.5 7.5l13-3.5 2 6.5-13 3.5z"/><path d="M8.5 13l1.2 4H4v3"/><path d="M18.5 9.5l2.5-.7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  folder: '<path d="M3.5 7a2 2 0 012-2H10l2 2.5h6.5a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/>',
  note: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8.5 12h7M8.5 16h5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  rows: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cards: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/>',
  fold: '<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
};
const ic = (n, s = 22, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

/* ค่าที่จำไว้ในเครื่องผู้ใช้ (ไม่มีก็ใช้ค่าเริ่มต้น) */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* โหมดส่วนตัว */ } },
};

let currentUser = null;   // null = ยังไม่เข้าสู่ระบบ → หน้าล็อกอิน (ตั้งจาก session ที่ server ตอนเปิดหน้า — ดูท้ายไฟล์)
let sheetStack = [];          // [{t:'ticket'|'partner', id}]
let tab = 'home';
let filter = 'all';
let homeTab = null;
let jobType = 'service';   // ประเภทงานที่ทีมงานเลือกดู (บริการ / ร้องเรียน)
let query = '', showSearch = false;
let cmtVis = 'public';
let cmtDraft = '';
let gpsTimer = null;
let rpt = { partner: 'all', period: '30', view: 'summary' };
let pfilter = 'all', pquery = '';
let draft = { desc: '', urgent: false, site: '' };   // ร่างแจ้งปัญหาของลูกค้า — ไม่หายเมื่อปิดฟอร์มโดยไม่ตั้งใจ
const pending = { create: [], cmt: [], report: [], wl: [] };  // รูปที่เลือกไว้แต่ยังไม่ส่ง
let folds = store.get('gitsd-folds', {});            // ส่วนที่ผู้ใช้ย่อ/ขยายไว้
let dense = store.get('gitsd-dense', false);         // มุมมองรายการแบบย่อ

const isOpen = tk => !['resolved', 'closed'].includes(tk.status);
const byPriority = (a, b) => (isOpen(b) - isOpen(a)) || (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

/* ---------- Toast ---------- */
let toastT;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); }

/* ---------- โหมดสี: กลางวัน / กลางคืน ---------- */
const THEMES = [['light', 'กลางวัน', 'sun'], ['dark', 'กลางคืน', 'moon']];
const THEME_COLOR = { light: '#F3F6FA', dark: '#0D141C' };
let theme = document.documentElement.dataset.theme || 'light';
function applyTheme() {
  if (!THEME_COLOR[theme]) theme = 'light';   // เครื่องที่เคยเลือกโหมด "ปกติ" ที่เลิกใช้แล้ว
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', THEME_COLOR[theme]);
}
function setTheme(t) {
  theme = t; applyTheme();
  try { localStorage.setItem('gitsd-theme', t); } catch { /* ใช้ได้เฉพาะรอบนี้ */ }
  if (tab === 'me') renderAll();
}

/* ---------- ย่อ/ขยาย ---------- */
function fold(key, title, body, opts = {}) {
  const open = key in folds ? folds[key] : opts.open !== false;
  return `<section class="fold ${open ? 'open' : ''}" data-fold="${key}">
    <div class="fold-h"><button class="fold-btn" onclick="toggleFold('${key}')" aria-expanded="${open}">
      <span class="fold-t">${title}</span>${opts.count != null ? `<span class="cnt ${opts.hot ? 'hot' : ''}">${opts.count}</span>` : ''}<span class="sp"></span><span class="fold-ic" title="${open ? 'ย่อ' : 'ขยาย'}">${ic('chev', 18, 2)}</span></button>
      ${opts.extra || ''}</div>
    <div class="fold-b">${body}</div></section>`;
}
function toggleFold(key, force) {
  document.querySelectorAll(`[data-fold="${key}"]`).forEach(s => {
    const open = force ?? !s.classList.contains('open');
    s.classList.toggle('open', open);
    s.querySelector('.fold-btn')?.setAttribute('aria-expanded', open);
    folds[key] = open;
  });
  store.set('gitsd-folds', folds);
}
function toggleAllFolds(scopeId) {
  const secs = [...$(scopeId).querySelectorAll('.fold')];
  const anyOpen = secs.some(s => s.classList.contains('open'));
  secs.forEach(s => toggleFold(s.dataset.fold, !anyOpen));
  toast(anyOpen ? 'ย่อทั้งหมดแล้ว' : 'ขยายทั้งหมดแล้ว');
}
function setDense(v) { dense = v; store.set('gitsd-dense', v); renderAll(); }

/* ---------- ปุ่มย้อนกลับของมือถือ/เบราว์เซอร์: ปิดหน้าซ้อนแทนการออกจากเว็บ ---------- */
let ovEntry = false, ignorePop = false;
const anyOverlay = () => ['modal', 'doc', 'lightbox'].some(id => $(id).classList.contains('open')) || sheetStack.length > 0;
function syncHistory() {
  setTimeout(() => {
    if (anyOverlay() && !ovEntry) { history.pushState({ ov: 1 }, ''); ovEntry = true; }
    else if (!anyOverlay() && ovEntry) { ovEntry = false; ignorePop = true; history.back(); }
  }, 0);
}
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop = false; return; }
  if (!ovEntry) return;
  ovEntry = false; closeTop(); syncHistory();
});
function closeTop() {
  if ($('lightbox').classList.contains('open')) return closeLightbox();
  if ($('doc').classList.contains('open')) return closeDoc();
  if ($('modal').classList.contains('open')) return closeModal();
  if (sheetStack.length) return backSheet();
}

/* ---------- พิมพ์ด้วยเสียง (Web Speech API, ภาษาไทย) ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
function voiceBtn(target, label) {
  if (!SR) return '';
  return `<button type="button" class="tool-btn mic" id="mic-${target}" onclick="toggleVoice('${target}')" aria-pressed="false" aria-label="พิมพ์ด้วยเสียง">${ic('mic', 20, 2)}${label ? `<span>${label}</span>` : ''}</button>`;
}
function toggleVoice(target) {
  if (rec) { rec.stop(); return; }
  if (!$(target)) return;
  const base = $(target).value.trim() ? $(target).value.replace(/\s*$/, ' ') : '';
  let finalText = '';
  rec = new SR(); rec.lang = lang === 'en' ? 'en-US' : 'th-TH'; rec.interimResults = true; rec.continuous = true;
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript; else interim += e.results[i][0].transcript;
    }
    const ta = $(target); if (!ta) return;
    ta.value = base + finalText + interim; ta.dispatchEvent(new Event('input'));
  };
  rec.onerror = e => toast(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'กรุณาอนุญาตให้ใช้ไมโครโฟน' : e.error === 'no-speech' ? 'ไม่ได้ยินเสียง ลองใหม่อีกครั้ง' : 'ใช้เสียงไม่ได้ในตอนนี้ — พิมพ์แทนได้');
  rec.onend = () => { setMic(target, false); rec = null; };
  try { rec.start(); setMic(target, true); } catch { rec = null; }
}
function setMic(target, on) {
  const b = $(`mic-${target}`);
  if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }
  $(`vb-${target}`)?.classList.toggle('listening', on);
}
function stopVoice() { if (rec) { rec.abort(); rec = null; } }
const voiceBox = (id, attrs, value = '') => `<div class="voicebox" id="vb-${id}"><textarea id="${id}" ${attrs}>${esc(value)}</textarea><div class="listening-tag" aria-live="polite"><i></i>กำลังฟัง… พูดได้เลย แตะไมค์อีกครั้งเมื่อพูดจบ</div></div>`;

/* ---------- รูปภาพ: ย่อขนาดในเครื่องก่อนแนบ ---------- */
const MAX_PHOTOS = 5;
async function compressPhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('not image');
  const bmp = await createImageBitmap(file);
  /* ย่อเหลือด้านยาว 1024px (~100KB) เพราะรูปเก็บใน localStorage ที่จุราว 5MB */
  const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  const id = `P${nextPhotoNo++}`; PHOTOS[id] = c.toDataURL('image/jpeg', 0.7);
  return id;
}
async function addPhotos(key, input) {
  const files = [...input.files]; input.value = '';
  const room = MAX_PHOTOS - pending[key].length;
  if (room <= 0) return toast(`แนบได้สูงสุด ${MAX_PHOTOS} รูป`);
  if (files.length > room) toast(`แนบได้อีก ${room} รูป`);
  for (const f of files.slice(0, room)) {
    try { pending[key].push(await compressPhoto(f)); } catch { toast('เปิดไฟล์รูปนี้ไม่ได้'); }
  }
  renderThumbs(key);
}
function dropPhoto(id) { delete PHOTOS[id]; }
function removePhoto(key, i) { dropPhoto(pending[key].splice(i, 1)[0]); renderThumbs(key); }
function clearPending(key) { pending[key].forEach(dropPhoto); pending[key] = []; }
const thumbsHtml = key => pending[key].map((id, i) => `<div class="th"><img src="${PHOTOS[id]}" alt="รูปที่ ${i + 1}"><button type="button" onclick="removePhoto('${key}',${i})" aria-label="ลบรูปที่ ${i + 1}">${ic('x', 13, 2.8)}</button></div>`).join('');
const thumbsBox = key => `<div class="thumbs" id="thumbs-${key}" ${pending[key].length ? '' : 'hidden'}>${thumbsHtml(key)}</div>`;
function renderThumbs(key) {
  const el = $(`thumbs-${key}`); if (el) { el.innerHTML = thumbsHtml(key); el.hidden = !pending[key].length; }
  const n = $(`pcount-${key}`); if (n) n.textContent = pending[key].length ? ` ${pending[key].length}/${MAX_PHOTOS}` : '';
}
const photoBtn = (key, label) => `<button type="button" class="tool-btn" onclick="$('file-${key}').click()" aria-label="แนบรูป">${ic('camera', 20, 2)}${label ? `<span>${label}<b id="pcount-${key}">${pending[key].length ? ` ${pending[key].length}/${MAX_PHOTOS}` : ''}</b></span>` : ''}</button>
  <input type="file" id="file-${key}" accept="image/*" multiple hidden onchange="addPhotos('${key}',this)">`;
const gallery = ids => ids?.length ? `<div class="gallery">${ids.filter(id => PHOTOS[id]).map(id => `<button type="button" class="gimg" onclick="openLightbox('${id}')" aria-label="ดูรูปขนาดใหญ่"><img src="${PHOTOS[id]}" alt="" loading="lazy"></button>`).join('')}</div>` : '';
function openLightbox(id) { $('lbImg').src = PHOTOS[id]; $('lightbox').classList.add('open'); syncHistory(); }
function closeLightbox() { $('lightbox').classList.remove('open'); syncHistory(); }

/* ---------- เข้าใช้งานในฐานะผู้ใช้คนนี้ (หลังเข้าสู่ระบบ) ---------- */
function switchUser(id) {
  if (!users[id]) return;
  currentUser = users[id]; filter = 'all'; homeTab = null; query = ''; showSearch = false; tab = 'home'; tabStack = []; rpt.partner = 'all';
  draft = { desc: '', urgent: false, site: '' }; cmtDraft = '';
  Object.keys(pending).forEach(clearPending);
  closeModal(); closeDoc(); closeLightbox(); closeSheet(); renderAll(); $('screen').scrollTo(0, 0);
  toast(`เข้าใช้งานในฐานะ ${ROLE_LABEL[currentUser.role]}: ${currentUser.name}`);
  deliverNotifs();
}
// ลบ session ที่ server ด้วย แล้วล้างข้อมูลบนจอ (เครื่องที่ใช้ร่วมกันจะไม่เหลือข้อมูลของคนก่อน)
async function logout() {
  await api('/logout', {}).catch(() => {});
  clearData(); currentUser = null; closeModal(); closeSheet(); renderAll();
}

/* ---------- เมนู (มือถือ = แถบล่าง, คอมพิวเตอร์ = แถบซ้าย) — สูงสุด 5 ช่อง ---------- */
function tabsFor(u) {
  const me = { id: 'me', label: 'ฉัน', icon: 'me' };
  if (u.role === 'customer') return [{ id: 'home', label: 'หน้าหลัก', icon: 'home' }, { id: 'tickets', label: 'งานของฉัน', icon: 'list' }, me];
  const projectsTab = { id: 'projects', label: 'โปรเจกต์', icon: 'folder' };
  if (u.role === 'technician') return [{ id: 'home', label: 'หน้าหลัก', icon: 'home' }, { id: 'tickets', label: 'งาน', icon: 'list' }, { id: 'mission', label: 'ภารกิจ', icon: 'pin' }, projectsTab, me];
  return [{ id: 'home', label: 'หน้าหลัก', icon: 'home' }, { id: 'tickets', label: 'งาน', icon: 'list' }, projectsTab, { id: 'team', label: 'ทีมช่าง', icon: 'team' }, me];
}
/* หน้าที่เข้าถึงได้แต่ไม่อยู่ในเมนูหลัก (เปิดจากทางลัดหน้าหลัก / หน้า "ฉัน") */
function screensFor(u) {
  const s = new Set(tabsFor(u).map(t => t.id));
  if (canSeeMissions(u)) s.add('mission');
  if (canManageUsers(u)) s.add('users');
  if (canSeePartners(u)) s.add('partners');
  if (canSeeSummaryReport(u)) s.add('reports');
  if (u.role === 'customer') s.add('projects');
  if (u.role === 'technician') s.add('history');
  return s;
}
function tabBadge(u, id) {
  const vis = visibleTickets(u);
  if (id === 'home' && u.role === 'customer') return vis.filter(x => canSignOff(u, x)).length + pendingJoins(u).length;
  if (id !== 'tickets') return 0;
  if (isManager(u)) return vis.filter(x => x.status === 'new').length;
  if (u.role === 'technician') return vis.filter(x => x.status === 'assigned').length;
  return 0;
}
function renderTabbar() {
  const list = tabsFor(currentUser);
  if (!screensFor(currentUser).has(tab)) tab = 'home';
  $('tabbar').innerHTML = `<div class="side-brand"><button class="logo-btn" onclick="goHome()" aria-label="กลับหน้าหลัก"><img src="img/logo.png" alt="Guru IT Solution Co., Ltd." width="140" height="41"></button><small>Service Desk</small></div>`
  + list.map(x => {
    const b = tabBadge(currentUser, x.id);
    return `<button class="tab ${x.id === tab ? 'on' : ''}" onclick="goTab('${x.id}')" ${x.id === tab ? 'aria-current="page"' : ''}>
      <i>${ic(x.icon, 24, 1.7)}${b ? `<span class="bdg" aria-label="${b} รายการ">${b}</span>` : ''}</i><span>${x.label}</span></button>`;
  }).join('') + (tab === 'tickets' ? sideFilters() : '');
}
/* สถานะงานในแถบซ้าย (คอมพิวเตอร์) — มือถือใช้แท็บด้านบนของหน้างานแทน */
function sideFilters() {
  const vis = ofType(currentUser, visibleTickets(currentUser));
  return `<nav class="side-filters" aria-label="สถานะงาน">${filtersFor(currentUser).map(([k, l, f]) => `<button data-k="${k}" class="${filter === k ? 'on' : ''}" onclick="setFilter('${k}')">${l}<b>${vis.filter(f).length}</b></button>`).join('')}</nav>`;
}
function renderFab() {
  const u = currentUser, show = canCreateTicket(u) && ['home', 'tickets'].includes(tab);
  const label = u.role === 'customer' ? 'แจ้งปัญหา' : 'สร้างงาน';
  $('fab').hidden = !show;
  $('fab').setAttribute('aria-label', label);
  $('fab').innerHTML = `${ic('plus', 26, 2.2)}<span>${label}</span>`;
}
/* ประวัติหน้าในแอป — ปุ่มย้อนกลับพากลับหน้าก่อนหน้าจริง ๆ ไม่ใช่หน้าหลักเสมอ */
let tabStack = [];
function goTab(id, back) {
  if (id === tab) return;
  if (back) tabStack.pop(); else { tabStack.push(tab); if (tabStack.length > 20) tabStack.shift(); }
  tab = id; filter = 'all'; homeTab = null; query = ''; showSearch = false; closeSheet(); renderAll(); $('screen').scrollTo(0, 0);
}
function goBack() { goTab(tabStack.at(-1) ?? 'home', true); }
/* โลโก้: หน้าหลักของผู้ใช้ที่เข้าแล้ว หรือกลับหน้าเข้าสู่ระบบถ้ายังไม่เข้า */
function goHome() { if (currentUser) goTab('home'); else leaveJoin(); }

/* ---------- การกระทำที่ทำได้กับงาน ---------- */
function actionLabel(tk, to) {
  if (to === 'in_progress') return { assigned: 'เริ่มงาน', pending: 'กลับมาทำต่อ', resolved: 'ส่งกลับไปแก้ไข', closed: 'เปิดงานอีกครั้ง' }[tk.status];
  return { pending: 'พักงาน', resolved: 'ทำเสร็จ — ออกใบรายงาน', closed: 'ปิดงาน (ไม่มีลายเซ็น)' }[to] || STATUS_LABEL[to];
}
function actionsFor(u, tk) {
  const acts = [];
  if (u.role === 'customer' && isOpen(tk)) acts.push({ label: 'ขอเลื่อนนัด', short: 'เลื่อนนัด', fn: `openReschedule('${tk.id}')`, primary: false, icon: 'clock' });
  if (isManager(u) && tk.status !== 'closed') acts.push({ label: tk.plan ? 'แก้ไขวันและเวลา' : 'วางแผนวันและเวลา', short: 'วางแผน', fn: `openPlan('${tk.id}')`, primary: false, icon: 'clock' });
  if (canAssign(u, tk)) acts.push({ label: tk.assignee ? 'ย้ายผู้รับผิดชอบ' : 'มอบหมายช่าง', short: 'มอบหมาย', fn: `openAssign('${tk.id}')`, primary: !tk.assignee, icon: 'user' });
  if (canSignOff(u, tk) && u.role === 'technician') acts.push({ label: 'ให้ลูกค้าเซ็นรับงานบนเครื่องนี้', short: 'ให้ลูกค้าเซ็น', fn: `openSignOff('${tk.id}')`, primary: true, icon: 'pen' });
  (STATUS_FLOW[tk.status] || []).filter(to => canTransition(u, tk, to)).forEach(to => {
    const forward = to === 'resolved' || (to === 'in_progress' && ['assigned', 'pending'].includes(tk.status));
    const icon = to === 'pending' ? 'pause' : to === 'resolved' ? 'doc' : forward ? 'check' : 'undo';
    acts.push({ label: actionLabel(tk, to), short: to === 'resolved' ? 'ทำเสร็จ' : actionLabel(tk, to), fn: `requestTransition('${tk.id}','${to}')`, primary: forward, icon });
  });
  return acts;
}
function quickFor(u, tk) {
  if (u.role === 'customer') return canSignOff(u, tk) ? { label: 'ตรวจสอบและเซ็นรับงาน', fn: `openSignOff('${tk.id}')`, icon: 'pen' } : null;
  const p = actionsFor(u, tk).find(a => a.primary);
  if (p) return { ...p, label: p.short };
  if (isManager(u) && tk.status === 'resolved' && canSeeReport(u, tk)) return { label: 'ใบรายงาน', fn: `openReport('${tk.id}')`, icon: 'doc' };
  return null;
}
function whyNoAction(u, tk) {
  if (u.role === 'technician' && tk.assignee !== u.id) return 'เปลี่ยนสถานะได้เฉพาะช่างที่รับผิดชอบงานนี้';
  if (tk.status === 'resolved') return 'รอลูกค้าเซ็นรับงาน — เมื่อเซ็นแล้วงานจะปิดอัตโนมัติ';
  if (tk.status === 'closed') return 'งานนี้ปิดแล้ว — หัวหน้าทีมเปิดงานอีกครั้งได้';
  if (tk.status === 'new') return 'รอหัวหน้าทีมมอบหมายช่าง';
  return 'ไม่มีขั้นตอนถัดไปสำหรับบทบาทนี้';
}
function signState(tk) {
  if (!tk.report) return null;
  if (tk.report.signoff) return 'signed';
  return tk.status === 'closed' ? 'nosign' : 'waiting';
}
const SIGN_LABEL = { signed: 'ลูกค้าเซ็นรับแล้ว', waiting: 'รอลูกค้าเซ็นรับ', nosign: 'ปิดโดยไม่มีลายเซ็น' };
const signBadge = tk => { const s = signState(tk); return s ? `<span class="sbadge s-${s}">${SIGN_LABEL[s]}</span>` : ''; };
const starsHtml = (n, size = 14) => `<span class="stars-sm" aria-label="${n} จาก 5 ดาว">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}">${ic('star', size, 1.8)}</i>`).join('')}</span>`;
const avgRating = rows => { const r = rows.filter(x => x.rating); return r.length ? r.reduce((s, x) => s + x.rating.score, 0) / r.length : null; };

/* ---------- สถานะแบบภาษาคน สำหรับลูกค้า ---------- */
const missionOf = tk => tk.missionId ? missions[tk.missionId] : null;
function custStatus(tk) {
  const tech = tk.assignee ? `ช่าง${nameOf(tk.assignee)}` : 'ช่าง';
  const m = missionOf(tk), ms = m && canSeeMissionStatus(currentUser, tk) ? m.status : null;
  if (tk.status === 'new') return { icon: 'inbox', t: 'ได้รับเรื่องแล้ว', d: 'ทีมงานกำลังจัดช่างที่เหมาะสมให้คุณ' };
  if (tk.status === 'resolved') return { icon: 'pen', t: 'งานเสร็จแล้ว — รอคุณเซ็นรับ', d: 'ตรวจสอบผลงานแล้วเซ็นรับได้เลย' };
  if (tk.status === 'closed') return { icon: 'check', t: 'เสร็จเรียบร้อย', d: 'ขอบคุณที่ใช้บริการ' };
  if (tk.status === 'pending') return { icon: 'pause', t: 'พักงานชั่วคราว', d: tk.history.filter(h => h.to === 'pending').at(-1)?.reason || 'ทีมงานจะแจ้งความคืบหน้า' };
  if (ms === 'en_route') return { icon: 'car', t: `${tech}กำลังเดินทางไปหาคุณ`, d: etaText(eta(m)) || 'ช่างจะถึงในไม่ช้า' };
  if (ms === 'arrived' || ms === 'working') return { icon: 'tool', t: `${tech}อยู่ที่หน้างานแล้ว`, d: 'กำลังตรวจสอบและแก้ไข' };
  if (tk.status === 'assigned') return { icon: 'user', t: `${tech}รับงานแล้ว`, d: 'จะเริ่มดำเนินการเร็ว ๆ นี้' };
  return { icon: 'tool', t: `${tech}กำลังแก้ไข`, d: 'เราจะแจ้งทันทีเมื่อเสร็จ' };
}

/* ---------- ส่วนประกอบหน้า ---------- */
const xbtn = () => `<button class="xbtn" onclick="closeModal()" aria-label="ปิด">${ic('x', 18, 2.2)}</button>`;
const ibtn = (icon, label, fn, pressed) => `<button class="ibtn ${pressed ? 'on' : ''}" onclick="${fn}" title="${label}" aria-label="${label}" ${pressed != null ? `aria-pressed="${!!pressed}"` : ''}>${ic(icon, 22, 1.7)}</button>`;
function pageHead(title, sub = '', actions = '', opt = {}) {
  /* ย้อนกลับได้ทุกหน้าที่เปิดต่อจากหน้าอื่น (opt.back = false เพื่อซ่อน) */
  const back = opt.back !== false && tabStack.length > 0 && !tabsFor(currentUser).some(t => t.id === tab);   // หน้าในเมนูล่างไม่ต้องมีปุ่มย้อนกลับ
  const unread = myNotifs().filter(n => !n.read).length;
  return `<header class="phead">
    ${back ? `<button class="ibtn back" onclick="goBack()" aria-label="กลับไปหน้าก่อนหน้า" title="กลับไปหน้าก่อนหน้า">${ic('back', 22, 2)}</button>` : ''}
    <div class="ph-t">${opt.logo ? '<button class="logo-btn" onclick="goHome()" aria-label="กลับหน้าหลัก"><img class="ph-logo" src="img/logo.png" alt="Guru IT Solution" width="96" height="28"></button>' : ''}<h1>${title}</h1>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
    <div class="ph-a">${actions}${opt.tools === false ? '' : toolBtns()}<button class="ibtn bell" onclick="openNotifs()" title="การแจ้งเตือน" aria-label="การแจ้งเตือน${unread ? ` ยังไม่อ่าน ${unread}` : ''}">${ic('bell', 22, 1.7)}${unread ? `<b class="tbdg">${unread}</b>` : ''}</button></div></header>`;
}
const tiles = (items, cls = '') => `<div class="tiles ${cls}">${items.filter(Boolean).map(t => `<button class="tile" onclick="${t.fn}"><i>${ic(t.icon, 26, 1.7)}${t.badge ? `<b class="tbdg">${t.badge}</b>` : ''}</i><span>${t.label}</span>${t.sub ? `<small>${t.sub}</small>` : ''}</button>`).join('')}</div>`;
function textTabs(items, cur, setter) {
  return `<div class="ttabs" role="tablist">${items.map(([k, l, n]) => `<button role="tab" data-k="${k}" aria-selected="${cur === k}" class="${cur === k ? 'on' : ''}" onclick="${setter}('${k}')">${l}${n != null ? `<sup>${n}</sup>` : ''}</button>`).join('')}</div>`;
}
const densityBtn = () => ibtn(dense ? 'cards' : 'rows', dense ? 'ขยายรายการ (แสดงรายละเอียด)' : 'ย่อรายการ (แสดงแบบสั้น)', `setDense(${!dense})`);
const empty = (msg, icon = 'check') => `<div class="empty">${ic(icon, 30, 1.5)}<div>${msg}</div></div>`;
/* ไอคอนงาน: รูปที่ลูกค้าถ่ายมา (ถ้ามี) ไม่งั้นใช้ไอคอนตามหมวดงาน */
const catOf = tk => CATEGORIES[tk.category] ? tk.category : 'other';
const complaintTag = tk => (tk.type === 'complaint' ? `<span class="tag warn">${ic('alert', 13, 2)}ร้องเรียน</span>` : '');
function ticketIcon(tk) {
  const p = tk.photos?.find(id => PHOTOS[id]);
  return p ? `<i class="tc-ic photo"><img src="${PHOTOS[p]}" alt="รูปปัญหาที่ลูกค้าถ่าย" loading="lazy"></i>`
    : `<i class="tc-ic cat-${catOf(tk)}" title="${CATEGORIES[catOf(tk)].label}">${ic(CATEGORIES[catOf(tk)].icon, 22, 1.7)}</i>`;
}

function custProgress(tk) {
  const st = CUST_STAGE[tk.status];
  return `<div class="cprog">${CUST_STEPS.map((s, i) => `<div class="cp ${i < st || (i === st && tk.status === 'closed') ? 'done' : i === st ? 'now' : ''}"><i></i><span>${s}</span></div>`).join('')}</div>`;
}

/* รายการงาน: แบบเต็ม (การ์ด) หรือแบบย่อ (แถวเดียว) */
function ticketCard(tk, opts = {}) {
  const u = currentUser, cust = u.role === 'customer';
  const quick = opts.quick ? quickFor(u, tk) : null;
  if (dense) {
    const st = cust ? custStatus(tk).t : STATUS_LABEL[tk.status];
    return `<div class="trow" onclick="openTicket('${tk.id}')" role="button" tabindex="0"><span class="sdot d-${tk.status}" aria-hidden="true"></span>
      <div class="tr-m"><b>${esc(tk.subject)}</b><small>${esc(st)}${!cust && tk.priority === 'urgent' ? ' · <em>ด่วนมาก</em>' : ''}</small></div>
      ${quick && cust ? `<span class="tr-flag">${ic('pen', 14, 2)}เซ็นรับ</span>` : ''}${ic('right', 16, 2)}</div>`;
  }
  const qbtn = quick ? `<button class="btn ${cust ? 'primary block-sm' : 'soft'} sm" onclick="event.stopPropagation();${quick.fn}">${ic(quick.icon, 16, 2)}${quick.label}</button>` : '';
  if (cust) {
    const cs = custStatus(tk);
    return `<div class="tcard ${tk.status === 'resolved' ? 'attn' : ''}" onclick="openTicket('${tk.id}')" role="button" tabindex="0">
      <div class="tc-h">${ticketIcon(tk)}<div class="tc-t"><b>${esc(tk.subject)}</b><small>${tk.id} · แจ้ง ${ago(tk.history[0].at)}</small></div></div>
      <div class="tc-f">${complaintTag(tk)}<span class="pill p-${tk.status}">${esc(cs.t)}</span>${tk.photos?.length ? `<span class="tag">${ic('camera', 13, 2)}${tk.photos.length}</span>` : ''}</div>
      ${qbtn}
    </div>`;
  }
  return `<div class="tcard" onclick="openTicket('${tk.id}')" role="button" tabindex="0">
    <div class="tc-h">${ticketIcon(tk)}<div class="tc-t"><b>${esc(tk.subject)}</b><small>${tk.id} · ${esc(custName(tk.customer))}</small></div>
      ${['urgent', 'high'].includes(tk.priority) ? `<span class="prio prio-${tk.priority}">${PRIORITY_LABEL[tk.priority]}</span>` : ''}</div>
    <div class="tc-f">${complaintTag(tk)}<span class="pill p-${tk.status}">${STATUS_LABEL[tk.status]}</span>
      ${isManager(u) ? `<span class="tag ${tk.assignee ? '' : 'warn'}">${ic('user', 13, 2)}${tk.assignee ? esc(nameOf(tk.assignee)) : 'ยังไม่มอบหมาย'}</span>` : `<span class="tag">${esc(siteOf(tk)?.name || '-')}</span>`}
      ${tk.plan ? `<span class="tag">${ic('clock', 13, 2)}${tk.plan.date.slice(5)} ${tk.plan.from}–${tk.plan.to}</span>` : ''}
      ${tk.rating ? starsHtml(tk.rating.score, 12) : ''}<span class="sp"></span>${qbtn}</div>
  </div>`;
}
const list = (arr, opts) => `<div class="list ${dense ? 'dense' : ''}">${arr.map(tk => ticketCard(tk, opts)).join('')}</div>`;

/* ---------- หน้าแรก: ลูกค้า ---------- */
function homeCustomer(u) {
  const vis = visibleTickets(u).slice().sort(byPriority);
  const toSign = vis.filter(x => canSignOff(u, x));
  const open = vis.filter(isOpen);
  const toRate = vis.filter(x => canRate(u, x)).slice(0, 1);
  const myProjects = projects.filter(p => canSeeProject(u, p) && pct(p) < 100);
  return pageHead(`สวัสดี คุณ${u.name}`, custName(u.customer), '', { tools: false })
  + tiles([
      { icon: 'alert', label: 'แจ้งเหตุ', fn: 'openCreate()' },
      { icon: 'chat', label: 'ติดต่อ', fn: 'openContact()' },
      { icon: 'doc', label: 'รายงาน', fn: "goTab('tickets')" },
      { icon: 'pen', label: 'ร้องเรียน', fn: "openCreate('complaint')" }], 'compact')
  + (pendingJoins(u).length ? fold('c-join', 'คำขอเข้าใช้งาน', `<div class="list dense">${pendingJoins(u).map(joinRow).join('')}</div>`, { count: pendingJoins(u).length, hot: true }) : '')
  + (toSign.length ? fold('c-sign', 'รอคุณเซ็นรับ', list(toSign, { quick: true }), { count: toSign.length, hot: true }) : '')
  + `<div class="sec-h"><h2>งานของฉัน${open.length ? ` <span class="cnt">${open.length}</span>` : ''}</h2><button onclick="goTab('tickets')">ดูทั้งหมด ›</button></div>`
  + (open.length ? list(open.slice(0, 4)) : empty('ไม่มีงานค้าง — ทุกอย่างเรียบร้อย'))
  + (myProjects.length ? fold('c-projects', 'โปรเจกต์ของบริษัท', `<div class="list">${myProjects.map(projCard).join('')}</div>`, { count: myProjects.length }) : '')
  + (toRate.length ? `<button class="mcard nudge" onclick="openRating('${toRate[0].id}')"><i>${ic('star', 22, 1.8)}</i><div><b>บริการครั้งล่าสุดเป็นอย่างไร?</b><small>${esc(toRate[0].subject)} — แตะเพื่อให้คะแนน</small></div>${ic('right', 18, 2)}</button>` : '');
}

/* ---------- ประเภทงานสำหรับทีมงาน: งานบริการ · ร้องเรียน · โปรเจกต์ (ลูกค้าเห็นรายการเดียว ไม่ต้องเลือก) ---------- */
const typeOf = tk => tk.type || 'service';
const ofType = (u, arr) => isStaff(u) ? arr.filter(tk => typeOf(tk) === jobType) : arr;
function setJobType(k) { jobType = k; homeTab = null; filter = 'all'; renderAll(); }
function typeChips(u) {
  const open = k => visibleTickets(u).filter(tk => typeOf(tk) === k && isOpen(tk)).length;
  const items = [['service', TYPE_LABEL.service, 'tool', open('service')], ['complaint', TYPE_LABEL.complaint, 'alert', open('complaint')]];
  return `<div class="tchips" role="tablist" aria-label="ประเภทงาน">${items.map(([k, l, icon, n]) =>
    `<button role="tab" aria-selected="${jobType === k}" class="${jobType === k ? 'on' : ''} ${k === 'complaint' && n ? 'hot' : ''}" onclick="setJobType('${k}')">${ic(icon, 18, 1.9)}${l}${n ? ` <b>${n}</b>` : ''}</button>`).join('')}</div>`;
}

/* ---------- หน้าแรก: ทีมงาน (แท็บ = สิ่งที่ต้องทำ) ---------- */
function workTabs(u) {
  const vis = ofType(u, visibleTickets(u)).slice().sort(byPriority);
  const f = (k, l, pred) => { const arr = vis.filter(pred); return { k, l, arr }; };
  if (u.role === 'technician') return [
    f('todo', 'ต้องทำ', x => ['assigned', 'in_progress'].includes(x.status)),
    f('sign', 'รอเซ็นรับ', x => x.status === 'resolved'),
    f('pending', 'พักงาน', x => x.status === 'pending')];
  return [
    f('new', 'รอมอบหมาย', x => x.status === 'new'),
    f('active', 'กำลังทำ', x => ['assigned', 'in_progress'].includes(x.status)),
    f('pending', 'พักงาน', x => x.status === 'pending'),
    f('sign', 'รอเซ็นรับ', x => x.status === 'resolved')];
}
function setHomeTab(k) { homeTab = k; renderAll(); }
function workSection(u) {
  const tabsData = workTabs(u);
  const cur = tabsData.find(t => t.k === homeTab) || tabsData.find(t => t.arr.length) || tabsData[0];
  return `${isStaff(u) ? typeChips(u) : ''}<div class="tbar">${textTabs(tabsData.map(t => [t.k, t.l, t.arr.length]), cur.k, 'setHomeTab')}</div>
    ${cur.arr.length ? list(cur.arr, { quick: true }) : empty('ไม่มีงานในหมวดนี้ตอนนี้')}`;
}
/* งานที่ช่างคนนี้ออกใบรายงานแล้ว (ใหม่สุดก่อน) */
const historyRows = u => visibleTickets(u).filter(x => x.report && x.report.by === u.id).sort((x, y) => y.report.at - x.report.at);
const monthKey = d => d.getFullYear() * 12 + d.getMonth();
function homeTech(u) {
  const mine = visibleTickets(u), today = new Date().toLocaleDateString('sv');
  const m = Object.values(missions).find(x => x.technician === u.id && x.status !== 'completed');
  const todo = mine.filter(x => ['assigned', 'in_progress'].includes(x.status)).length;
  const todayN = mine.filter(x => x.plan?.date === today && isOpen(x)).length;
  const doneMonth = historyRows(u).filter(x => monthKey(x.report.at) === monthKey(new Date())).length;
  return pageHead(`สวัสดี ${u.name}`, teams[u.team], '', { tools: false })
  + `<div class="kpis tech-kpis"><div class="kpi"><b>${todo}</b><span>ต้องทำ</span></div><div class="kpi"><b>${todayN}</b><span>นัดวันนี้</span></div><div class="kpi"><b>${doneMonth}</b><span>เสร็จเดือนนี้</span></div></div>`
  + (m ? `<button class="mcard" onclick="goTab('mission')"><i>${ic('pin', 22, 1.8)}</i><div><b>ภารกิจที่กำลังทำ</b><small>${MISSION_LABEL[m.status]}</small></div>${ic('right', 18, 2)}</button>` : '');
}
/* ประวัติการทำงานของช่าง: แยกเป็นเดือน เดือนล่าสุดเปิดไว้ */
function renderHistory() {
  const u = currentUser, rows = historyRows(u), months = [];
  rows.forEach(x => { const k = monthKey(x.report.at); (months.find(g => g.k === k) || (months.push({ k, d: x.report.at, rows: [] }), months.at(-1))).rows.push(x); });
  return pageHead('ประวัติการทำงาน', rows.length ? `ทั้งหมด ${rows.length} งาน · ${hrs(rows.reduce((t, x) => t + (+x.report.hours || 0), 0))}` : '')
  + (months.length ? months.map((g, i) => fold('h-' + g.k, g.d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
      `<div class="card">${g.rows.map(x => `<div class="rrow">
        <div class="rr-main" onclick="openTicket('${x.id}')"><div class="rr-top"><span>${fmtD(x.report.at)}</span><span>${hrs(x.report.hours)}</span></div>
          <b>${esc(x.subject)}</b><small>${esc(custName(x.customer))} · ${esc(siteLabel(x))}</small>${signBadge(x)}</div>
        <button class="ibtn" onclick="openReport('${x.id}')" aria-label="ดูใบรายงาน ${x.report.no}" title="ดูใบรายงาน">${ic('doc', 20, 1.8)}</button></div>`).join('')}</div>`,
      { count: g.rows.length, open: i === 0 })).join('')
    : empty('ยังไม่มีงานที่ทำเสร็จ — งานที่ออกใบรายงานแล้วจะมาอยู่ที่นี่', 'clock'));
}
function homeLead(u) {
  const techs = assignableTechs(u);
  const done7 = reportRows({ partner: 'all', period: '7' }), avg = avgRating(done7);
  return pageHead('หน้าหลัก', `${teams[u.team]} · ${u.name}`)
  + tiles([
      { icon: 'pin', label: 'ติดตามช่าง', fn: "goTab('mission')" },
      { icon: 'building', label: 'พาร์ทเนอร์', sub: `${allSites().length} สถานที่`, fn: "goTab('partners')" },
      { icon: 'chart', label: 'ผลงาน 7 วัน', sub: `${done7.length} งาน${avg ? ` · ★ ${num(avg)}` : ''}`, fn: "rpt.period='7';rpt.view='summary';goTab('reports')" }])
  + workSection(u)
  + (() => { const pl = tickets.filter(t => t.plan && isOpen(t)).sort((a, b) => (a.plan.date + a.plan.from) < (b.plan.date + b.plan.from) ? -1 : 1);
    const days = [...new Set(pl.map(t => t.plan.date))];
    return fold('l-plan', 'ปฏิทินงาน', pl.length ? days.map(d => `<div class="cal-day"><b>${new Date(d + 'T00:00').toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</b>${pl.filter(t => t.plan.date === d).map(t => `<button class="trow" onclick="openTicket('${t.id}')"><div class="tr-m"><b>${t.plan.from}–${t.plan.to} · ${esc(t.subject)}</b><small>${esc(custName(t.customer))} · ${esc(t.assignee ? nameOf(t.assignee) : 'ยังไม่มอบหมาย')}</small></div>${ic('right', 16, 2)}</button>`).join('')}</div>`).join('') : empty('ยังไม่มีนัดหมาย ตั้งวันและเวลาได้ในหน้ารายละเอียดงาน', 'clock'), { count: pl.length, open: pl.length > 0 }); })()
  + fold('l-load', 'ภาระงานของช่าง', `<div class="card">${techs.map(x => {
      const mine = tickets.filter(t => t.assignee === x.id && isOpen(t)), n = mine.length;
      return `<div class="load"><div class="lname"><b>${esc(x.name)}</b><small>${n} งานเปิด${mine.some(t => t.priority === 'urgent') ? ' · <em class="prio-urgent">มีงานด่วน</em>' : ''}</small></div>
        <div class="lbar"><i style="width:${Math.min(100, n * 25)}%" class="${n >= 3 ? 'hi' : ''}"></i></div></div>`; }).join('')}</div>`, { open: false, count: techs.length });
}
function homeAdmin(u) {
  const roleCount = r => Object.values(users).filter(x => x.role === r).length;
  return pageHead('หน้าหลัก', `ผู้ดูแลระบบ · ${u.name}`)
  + tiles([
      { icon: 'team', label: 'ผู้ใช้และสิทธิ์', sub: `${Object.keys(users).length} คน`, fn: "goTab('users')" },
      { icon: 'building', label: 'พาร์ทเนอร์', sub: `${allSites().length} สถานที่`, fn: "goTab('partners')" },
      { icon: 'chart', label: 'รายงาน', fn: "rpt.view='summary';goTab('reports')" }])
  + workSection(u)
  + fold('a-roles', 'ผู้ใช้ตามบทบาท', `<div class="rolegrid">${ROLE_ORDER.map(r => `<button class="rg" onclick="goTab('users')"><i>${ic(ROLE_META[r].icon, 20)}</i><b>${roleCount(r)}</b><span>${ROLE_LABEL[r]}</span></button>`).join('')}</div>`, { open: false })
  + fold('a-audit', 'เหตุการณ์ล่าสุด', `<div class="card">${auditRows(auditLog.slice(0, 5))}</div>`, { open: false, count: auditLog.length });
}

/* ---------- รายการงาน ---------- */
function filtersFor(u) {
  const waiting = ['resolved', 'รอเซ็นรับ', x => x.status === 'resolved'];
  if (u.role === 'customer') return [['all', 'ทั้งหมด', () => true], ['open', 'ยังไม่เสร็จ', x => x.status !== 'closed'], ['closed', 'เสร็จแล้ว', x => x.status === 'closed']];
  if (u.role === 'technician') return [['all', 'ทั้งหมด', () => true], ['todo', 'ต้องทำ', x => ['assigned', 'in_progress'].includes(x.status)],
    ['pending', 'พักงาน', x => x.status === 'pending'], waiting, ['closed', 'ปิดแล้ว', x => x.status === 'closed']];
  return [['all', 'ทั้งหมด', () => true], ['new', 'รอมอบหมาย', x => x.status === 'new'],
    ['active', 'กำลังทำ', x => ['assigned', 'in_progress'].includes(x.status)], ['pending', 'พักงาน', x => x.status === 'pending'],
    waiting, ['closed', 'ปิดแล้ว', x => x.status === 'closed']];
}
function filteredTickets() {
  const f = filtersFor(currentUser).find(x => x[0] === filter) || filtersFor(currentUser)[0];
  const q = query.trim().toLowerCase();
  return ofType(currentUser, visibleTickets(currentUser)).filter(f[2]).filter(x => !q ||
    [x.id, x.subject, siteLabel(x), siteOf(x)?.address, custName(x.customer), nameOf(x.assignee), x.report?.no].some(s => String(s ?? '').toLowerCase().includes(q))).sort(byPriority);
}
function toggleSearch() { showSearch = !showSearch; if (!showSearch) query = ''; renderAll(); if (showSearch) setTimeout(() => $('q')?.focus(), 30); }
function renderTickets() {
  const u = currentUser;
  const title = { customer: 'งานของฉัน', technician: 'งานของฉัน', team_leader: 'งานทั้งหมด', admin: 'งานทั้งหมด' }[u.role];
  const sub = { customer: custName(u.customer), technician: 'เฉพาะงานที่มอบหมายให้คุณ', team_leader: 'ทุกงานในระบบ', admin: 'ทุกงานในระบบ' }[u.role];
  const vis = ofType(u, visibleTickets(u));
  return pageHead(title, sub, ibtn('search', 'ค้นหา', 'toggleSearch()', showSearch))
  + (showSearch ? `<div class="searchbox">${ic('search', 18)}<input id="q" type="search" placeholder="ค้นหาเลขงาน หัวข้อ สถานที่…" value="${esc(query)}" oninput="query=this.value;$('tlist').innerHTML=ticketListHtml()" aria-label="ค้นหางาน"></div>` : '')
  + (isStaff(u) ? typeChips(u) : '')
  + fold('tk-status', 'สถานะงาน', `<div class="tbar tbar-tk">${textTabs(filtersFor(u).map(([k, l, f]) => [k, l, vis.filter(f).length]), filter, 'setFilter')}<span class="sp"></span>${densityBtn()}</div>`, { count: filteredTickets().length })
  + `<div id="tlist">${ticketListHtml()}</div>`;
}
function ticketListHtml() {
  const arr = filteredTickets();
  if (arr.length) return list(arr, { quick: true });
  return currentUser.role === 'customer' && !visibleTickets(currentUser).length
    ? empty('ยังไม่มีงาน — มีอะไรให้ช่วย กดปุ่ม + ได้เลย', 'inbox')
    : empty('ไม่พบงานที่ตรงเงื่อนไข', 'search');
}
function setFilter(k) { filter = k; renderAll(); }

/* ---------- สมัครใช้งานจากลิงก์ชวนของตัวแทนบริษัท (?join=รหัสบริษัท) ---------- */
let joinCid = null, joinInfo = null;
let joinDraft = { name: '', email: '', phone: '', photo: null, password: '' }, joinDone = false;
const validPhone = p => /^0\d{8,9}$/.test(p.replace(/[\s-]/g, ''));
console.assert(validPhone('081-234-5678') && validPhone('02 000 0001') && !validPhone('12345') && !validPhone('08123456789012'), 'validPhone');
/* อีเมล = ชื่อเข้าสู่ระบบ (เก็บเป็นตัวพิมพ์เล็ก) · เบอร์โทรยังเก็บไว้ใช้ติดต่อ */
const normEmail = s => String(s || '').trim().toLowerCase();
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
console.assert(validEmail('a.b@guru-itsolution.com') && !validEmail('a@b') && !validEmail('a b@c.com') && normEmail(' A@B.Co ') === 'a@b.co', 'validEmail');
const emailField = (id, v = '', extra = '') => `<label class="fl">อีเมล (ใช้เข้าสู่ระบบ) <em>*</em><input id="${id}" type="email" inputmode="email" autocomplete="email" maxlength="100" placeholder="name@company.com" value="${esc(v)}" ${extra}></label>`;
const emailErr = (e, exceptId) => !validEmail(e) ? 'อีเมลไม่ถูกต้อง (เช่น name@company.com)'
  : Object.values(users).some(x => x.email === e && x.id !== exceptId && !x.removed) ? 'อีเมลนี้มีในระบบแล้ว' : '';
const approverOf = cid => Object.values(users).find(u => u.customer === cid && u.approver);
function renderJoin() {
  const c = joinInfo;
  if (!c) return `<div class="join">${empty('ลิงก์สมัครไม่ถูกต้อง — ขอลิงก์ใหม่จากตัวแทนบริษัทของคุณ', 'alert')}</div>`;
  if (joinDone) return `<div class="join"><div class="done"><div class="done-ic">${ic('check', 34, 3)}</div><h3>ส่งคำขอแล้ว</h3>
    <p class="hint">ตัวแทนของ ${esc(c.name)} จะยืนยันว่าคุณเป็นพนักงานจริง<br>เมื่อยืนยันแล้วให้เข้าสู่ระบบด้วยอีเมลและรหัสที่ตั้งไว้</p></div>
    <div class="row center"><button class="btn link" onclick="leaveJoin()">กลับหน้าเข้าสู่ระบบ</button></div></div>`;
  return `<div class="join"><div class="row end" style="margin:0 0 6px">${toolBtns()}</div><img class="ph-logo" src="img/logo.png" alt="Guru IT Solution" width="96" height="28">
    <h1>สมัครใช้งาน</h1><p class="hint" style="margin:2px 0 0">${esc(c.name)}</p>
    <button type="button" class="join-photo" onclick="$('joinFile').click()"><i>${joinDraft.photo && PHOTOS[joinDraft.photo] ? `<img src="${PHOTOS[joinDraft.photo]}" alt="รูปของคุณ">` : ic('camera', 28, 1.7)}</i>${joinDraft.photo ? 'เปลี่ยนรูป' : 'รูปของคุณ (ไม่บังคับ)'}</button>
    <input type="file" id="joinFile" accept="image/*" hidden onchange="joinPhoto(this)">
    <label class="fl">ชื่อ-นามสกุล <em>*</em><input id="jName" maxlength="80" autocomplete="name" value="${esc(joinDraft.name)}" oninput="joinDraft.name=this.value"></label>
    ${emailField('jEmail', joinDraft.email, 'oninput="joinDraft.email=this.value"')}
    <label class="fl">เบอร์โทร <em>*</em><input id="jPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="15" placeholder="เช่น 081-234-5678" value="${esc(joinDraft.phone)}" oninput="joinDraft.phone=this.value"></label>
    <label class="fl">รหัสผ่านที่ใช้เข้าระบบ (อย่างน้อย 8 ตัว) <em>*</em><input id="jPw" type="password" autocomplete="new-password" maxlength="200" oninput="joinDraft.password=this.value"></label>
    ${c.sites.length > 1 ? `<label class="fl">ทำงานที่ <em>*</em><select id="jSite">${c.sites.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>` : ''}
    <div class="err" id="jErr" role="alert"></div>
    <button class="btn primary block" style="margin-top:18px" onclick="submitJoin()">ส่งคำขอ</button>
    <p class="hint" style="text-align:center;margin-top:12px">ตัวแทนบริษัทจะยืนยันว่าคุณเป็นพนักงานจริง ก่อนเข้าใช้งาน</p>
    <div class="row center"><button class="btn link" onclick="leaveJoin()">${ic('user', 16, 2)}กลับไปหน้าเข้าสู่ระบบ</button></div></div>`;
}
async function joinPhoto(input) {
  const f = input.files[0]; input.value = '';
  if (!f) return;
  try { const id = await compressPhoto(f); if (joinDraft.photo) dropPhoto(joinDraft.photo); joinDraft.photo = id; renderAll(); }
  catch { toast('เปิดไฟล์รูปนี้ไม่ได้'); }
}
// ส่งคำขอสมัคร: เซิร์ฟเวอร์เก็บบัญชีไว้แบบปิดจนกว่าตัวแทนบริษัทจะยอมรับ
async function submitJoin() {
  const c = joinInfo, name = $('jName').value.trim(), phone = $('jPhone').value.replace(/[\s-]/g, ''), email = normEmail($('jEmail').value), password = $('jPw').value;
  const siteId = c.sites.some(s => s.id === $('jSite')?.value) ? $('jSite').value : c.sites[0]?.id;
  const err = !name ? 'กรุณากรอกชื่อ' : !validEmail(email) ? 'อีเมลไม่ถูกต้อง (เช่น name@company.com)' : !validPhone(phone) ? 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)' : pwErr(password, true);
  if (err) { $('jErr').textContent = err; return; }
  try {
    await api(`/join/${encodeURIComponent(joinCid)}`, { name, email, phone, password, siteId, photo: joinDraft.photo ? PHOTOS[joinDraft.photo] : undefined });
    if (joinDraft.photo) dropPhoto(joinDraft.photo);
    joinDone = true; renderAll();
  } catch (e) { $('jErr').textContent = e.message; }
}
// เปิดหน้าสมัครของบริษัทนั้น (จากลิงก์ ?join=)
async function pickJoin(cid) {
  joinCid = cid; joinDone = false; joinDraft = { name: '', email: '', phone: '', photo: null, password: '' };
  joinInfo = await api(`/join/${encodeURIComponent(cid)}`).catch(() => null);
  if (!joinInfo) toast('ไม่พบบริษัทนี้ — ตรวจรหัสอีกครั้ง');
  renderAll();
}
function leaveJoin() {
  joinCid = null; joinInfo = null; joinDone = false; joinDraft = { name: '', email: '', phone: '', photo: null, password: '' };
  history.replaceState(null, '', location.pathname);
  renderAll();
}

const pendingJoins = u => canApproveMembers(u, u.customer) ? joinRequests.filter(r => r.customer === u.customer && r.status === 'pending') : [];
const joinRow = r => `<div class="trow jrow"><span class="javatar">${r.photo && PHOTOS[r.photo] ? `<img src="${PHOTOS[r.photo]}" alt="">` : ic('user', 20, 1.8)}</span>
  <div class="tr-m"><b>${esc(r.name)}</b><small>${r.email ? esc(r.email) + ' · ' : ''}<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a> ·${esc(customers[r.customer].sites.find(s => s.id === r.siteId)?.name || '-')} · ${ago(r.at)}</small></div>
  <button class="btn soft sm" onclick="decideJoin('${r.id}',true)">ยอมรับ</button>${ibtn('x', `ปฏิเสธ ${esc(r.name)}`, `decideJoin('${r.id}',false)`)}</div>`;
// ตัวแทนบริษัทกดยอมรับ/ปฏิเสธ: เซิร์ฟเวอร์เปิดหรือลบบัญชีที่รอไว้ แล้วโหลดข้อมูลใหม่
async function decideJoin(id, ok) {
  if (!await call(`/join-requests/${id}`, { ok })) return;
  toast(ok ? 'ยอมรับพนักงานแล้ว — เข้าใช้งานได้ทันที' : 'ปฏิเสธคำขอแล้ว'); renderAll();
}

// ตัวแทนบริษัทสร้างบัญชีพนักงานของบริษัทตัวเองทันที — server ล็อกให้เป็นลูกค้าของบริษัทนี้เท่านั้น
function openStaffForm(id) {
  if (!canApproveMembers(currentUser, currentUser.customer)) return;
  const x = id ? users[id] : null;
  openModal(`<div class="mh"><h3>${x ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h3>${xbtn()}</div>
    <label class="fl">ชื่อ-นามสกุล <em>*</em><input id="stName" maxlength="80" value="${esc(x?.name || '')}"></label>
    ${emailField('stEmail', x?.email)}
    <label class="fl">เบอร์โทร <em>*</em><input id="stPhone" type="tel" inputmode="tel" maxlength="15" placeholder="เช่น 081-234-5678" value="${esc(x?.phone || '')}"></label>
    ${pwField('stPw', !x)}
    ${x ? `<label style="display:flex;flex-direction:row;align-items:center;gap:10px;margin-top:12px"><input type="checkbox" id="stOff" style="width:20px;height:20px;padding:0" ${x.removed ? 'checked' : ''}><span>ปิดการใช้งานบัญชีนี้<small style="display:block;color:var(--text-2);margin-top:2px">พนักงานจะเข้าระบบไม่ได้ ประวัติงานยังอยู่</small></span></label>` : ''}
    <div class="err" id="stErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveStaff(${x ? `'${id}'` : ''})">บันทึก</button></div>`);
  focusLater('stName');
}
async function saveStaff(id) {
  const name = $('stName').value.trim(), email = normEmail($('stEmail').value), phone = $('stPhone').value.replace(/[\s-]/g, ''), pw = $('stPw').value;
  const err = !name ? 'กรุณากรอกชื่อ' : !validEmail(email) ? 'อีเมลไม่ถูกต้อง (เช่น name@company.com)' : !validPhone(phone) ? 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)' : emailErr(email, id) || pwErr(pw, !id);
  if (err) { $('stErr').textContent = err; return; }
  const me = currentUser, x = id ? users[id] : null;
  const body = { name, email, phone, role: 'customer', customerId: me.customer, siteId: x ? x.siteId || '' : me.siteId || '', approver: false, removed: id ? $('stOff').checked : false, password: pw };
  if (!await call(id ? `/users/${id}` : '/users', body, 'stErr')) return;
  closeModal(); toast(id ? 'บันทึกแล้ว' : `เพิ่ม ${name} แล้ว — เข้าสู่ระบบด้วย ${email}`); renderAll();
}
function openInvite() {
  const url = `${location.origin}${location.pathname}?join=${currentUser.customer}`;
  openModal(`<div class="mh"><h3>ชวนพนักงานเข้าใช้งาน</h3>${xbtn()}</div>
    <p class="hint" style="margin:0 0 12px">ส่งลิงก์นี้ให้พนักงาน (เช่นทาง LINE) — เมื่อมีคนสมัคร คำขอจะขึ้นที่หน้าหลักของคุณให้กดยอมรับ</p>
    <input id="invUrl" readonly value="${esc(url)}" onfocus="this.select()" aria-label="ลิงก์สมัคร">
    <button class="btn primary block" onclick="shareInvite()">${ic(navigator.share ? 'send' : 'doc', 18, 2)}${navigator.share ? 'แชร์ลิงก์' : 'คัดลอกลิงก์'}</button>`);
}
async function shareInvite() {
  const url = $('invUrl').value;
  try {
    if (navigator.share) await navigator.share({ title: 'สมัครใช้งาน Guru IT Service Desk', url });
    else { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แล้ว — ส่งให้พนักงานได้เลย'); }
  } catch (e) { if (e.name !== 'AbortError') { $('invUrl').focus(); toast('กดค้างที่ลิงก์ด้านบนเพื่อคัดลอก'); } }
}

/* ---------- รูปโปรไฟล์: รูปจริง หรืออักษรตัวแรกของชื่อ (ข้ามสระหน้า เ แ โ ใ ไ) ---------- */
const initialOf = name => [...String(name).trim()].find(c => !'เแโใไ'.includes(c)) || '?';
const avatarHtml = (u, s = 40) => u?.photo && PHOTOS[u.photo]
  ? `<img class="av" src="${PHOTOS[u.photo]}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px">`
  : `<span class="av" aria-hidden="true" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .42)}px">${esc(initialOf(u?.name || '?'))}</span>`;

/* ---------- การแจ้งเตือน: กระดิ่งในแอป + เด้งเตือนของเครื่อง + เสียง ---------- */
// shortcut: แจ้งเตือนเก็บในเบราว์เซอร์นี้ และเด้งเมื่อผู้รับเปิดแอป — ส่งถึงมือถือ/คอมที่ปิดแอปอยู่ต้องมี server + Web Push
const myNotifs = () => currentUser ? notifs.filter(n => n.to === currentUser.id).sort((a, b) => b.at - a.at) : [];
const dispatchers = () => Object.values(users).filter(u => isManager(u) && !u.removed).map(u => u.id);
// การแจ้งเตือนสร้างที่ server แล้ว (ดู backend/server.js) หน้าเว็บแค่โหลดและแสดง
function notify() {}
let audioCtx = null;
function chime() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + i * .18;
      o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.25, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .35);
      o.start(t0); o.stop(t0 + .4);
    });
  } catch { /* เบราว์เซอร์ไม่รองรับเสียง */ }
}
/* แสดงแจ้งเตือนที่ยังไม่เคยเด้งของผู้ใช้ปัจจุบัน: เสียง + แจ้งเตือนของเครื่อง (ถ้าอนุญาต) ไม่งั้นแถบข้อความ */
function deliverNotifs() {
  const fresh = myNotifs().filter(n => !n.read && !n.shown);
  if (!fresh.length) return;
  fresh.forEach(n => { n.shown = true; });
  chime();
  let shown = false;
  if ('Notification' in window && Notification.permission === 'granted') {
    try { fresh.slice(0, 3).forEach(n => { const x = new Notification(n.title, { body: n.body, icon: 'img/icon-192.png', tag: n.id }); x.onclick = () => { window.focus(); openNotif(n.id); }; }); shown = true; }
    catch { /* มือถือบางรุ่นเด้งได้เฉพาะผ่าน service worker */ }
  }
  if (!shown) toast(`🔔 ${fresh[0].title} — ${fresh[0].body}`);
}
async function enableSystemNotifs() {
  if (!('Notification' in window)) return toast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
  const p = await Notification.requestPermission();
  toast(p === 'granted' ? 'เปิดการแจ้งเตือนบนเครื่องนี้แล้ว' : 'ยังไม่ได้อนุญาตการแจ้งเตือน — เปิดได้ในการตั้งค่าเบราว์เซอร์');
  if ($('modal').classList.contains('open')) openNotifs(); else renderAll();
}
function openNotifs() {
  const list = myNotifs(), perm = 'Notification' in window ? Notification.permission : 'unsupported';
  openModal(`<div class="mh"><h3>การแจ้งเตือน</h3>${xbtn()}</div>
    ${perm === 'default' ? `<button class="mcard" onclick="enableSystemNotifs()"><i>${ic('bell', 22)}</i><div><b>เปิดการแจ้งเตือนบนเครื่องนี้</b><small>เด้งเตือนพร้อมเสียงเมื่อมีงานใหม่</small></div>${ic('right', 18, 2)}</button>` : ''}
    ${list.length ? `<div class="list dense">${list.map(n => `<button class="trow ${n.read ? '' : 'unread'}" onclick="openNotif('${n.id}')"><span class="sdot ${n.read ? '' : 'd-new'}" aria-hidden="true"></span>
      <div class="tr-m"><b>${esc(n.title)}</b><small>${esc(n.body)} · ${ago(n.at)}</small></div>${ic('right', 16, 2)}</button>`).join('')}</div>` : empty('ยังไม่มีการแจ้งเตือน', 'bell')}
    ${list.some(n => !n.read) ? `<div class="row center"><button class="btn link" onclick="markAllRead()">อ่านแล้วทั้งหมด</button></div>` : ''}`);
}
function openNotif(id) {
  const n = notifs.find(x => x.id === id && x.to === currentUser?.id); if (!n) return;
  n.read = true; api('/notifications/read', { id }).catch(() => {}); closeModal();
  if (n.go) goTab(n.go); else renderAll();
  if (n.ticketId) openTicket(n.ticketId);
}
function markAllRead() { api('/notifications/read', {}).then(loadState).then(() => { closeModal(); renderAll(); }, () => {}); }

/* ---------- เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน (ตรวจที่ server) ---------- */
/* หน้าลูกค้า / หน้าเจ้าหน้าที่ ต่างกันแค่ข้อความ — ทุกบัญชีเข้าได้จากทั้งสองหน้า */
let login = { id: '', staff: false };
function setLoginMode(staff) { login = { id: $('lgId')?.value || '', staff }; renderAll(); focusLater('lgId'); }
function renderLogin() {
  const st = login.staff;
  return `<div class="join"><div class="row end" style="margin:0 0 6px">${toolBtns()}</div><img class="ph-logo" src="img/logo.png" alt="Guru IT Solution" width="96" height="28">
    <h1>${st ? 'เข้าสู่ระบบเจ้าหน้าที่' : 'เข้าสู่ระบบ'}</h1><p class="hint" style="margin:2px 0 0">${st ? 'สำหรับช่าง หัวหน้าทีม และผู้ดูแลระบบ' : 'Guru IT Service Desk · สำหรับลูกค้า'}</p>
      <label class="fl">อีเมลที่ลงทะเบียน<input id="lgId" type="email" inputmode="email" autocomplete="username" maxlength="100" placeholder="name@company.com" value="${esc(login.id)}" onkeydown="if(event.key==='Enter')$('lgPw').focus()"></label>
      <label class="fl">รหัสผ่าน<input id="lgPw" type="password" autocomplete="current-password" maxlength="200" onkeydown="if(event.key==='Enter')doLogin()"></label>
      <p class="hint" style="margin:-6px 0 0">ลืมรหัสผ่าน? ให้ตัวแทนบริษัทหรือผู้ดูแลระบบ Guru IT ตั้งรหัสใหม่ให้</p>
      <div class="err" id="lgErr" role="alert"></div>
      <button class="btn primary block" id="lgBtn" style="margin-top:16px" onclick="doLogin()">เข้าสู่ระบบ</button>
    ${st ? '' : `<div class="divider">ยังไม่มีบัญชี?</div>
    <p class="hint" style="margin:6px 0 8px">ขอลิงก์สมัครจากตัวแทนบริษัทของคุณ หรือให้ผู้ดูแลระบบ Guru IT สร้างบัญชีให้</p>
    `}

    <button class="btn link block" style="margin-top:22px" onclick="setLoginMode(${!st})">${st ? `${ic('user', 16, 2)}กลับไปเข้าสู่ระบบลูกค้า` : `${ic('tool', 16, 2)}เข้าสู่ระบบสำหรับช่าง / เจ้าหน้าที่`}</button>
  </div>`;
}
async function doLogin() {
  const email = normEmail($('lgId').value), password = $('lgPw').value;
  login.id = $('lgId').value.trim();
  if (!validEmail(email)) { $('lgErr').textContent = 'อีเมลไม่ถูกต้อง (เช่น name@company.com)'; return; }
  if (!password) { $('lgErr').textContent = 'กรุณากรอกรหัสผ่าน'; $('lgPw').focus(); return; }
  $('lgBtn').disabled = true; $('lgErr').textContent = '';
  try { await api('/login', { email, password }); await loadState(); }
  catch (e) { $('lgErr').textContent = e.message; $('lgBtn').disabled = false; return; }
  login = { id: '', staff: login.staff }; switchUser(currentUser.id);
}

/* ---------- ทีมช่าง: โปรไฟล์ · ความถนัด · เพิ่ม/ลบ (หัวหน้า/แอดมิน) ---------- */
const techs = () => Object.values(users).filter(u => u.role === 'technician' && !u.removed);
const techLoad = id => tickets.filter(t => t.assignee === id && isOpen(t)).length;
const techStats = id => { const done = tickets.filter(t => t.report?.by === id); return { open: techLoad(id), done: done.length, avg: avgRating(done) }; };
const skillTags = u => (u.skills || []).map(k => `<span class="tag">${ic(CATEGORIES[k]?.icon || 'help', 13, 2)}${CATEGORIES[k]?.label || k}</span>`).join('');
function renderTeam() {
  const all = techs();
  return pageHead('ทีมช่าง', `${all.length} คน · ${teams[currentUser.team] || teams.T1}`, canManageTeam(currentUser) ? ibtn('plus', 'เพิ่มช่าง', 'openTechForm()') : '')
  + (all.length ? `<div class="list">${all.map(x => { const s = techStats(x.id);
    return `<div class="tcard" onclick="openTech('${x.id}')" role="button" tabindex="0">
      <div class="tc-h">${avatarHtml(x, 44)}<div class="tc-t"><b>${esc(x.name)}</b><small>${s.open ? `${s.open} งานเปิด` : 'ว่าง'} · เสร็จ ${s.done} งาน${s.avg ? ` · ★ ${num(s.avg)}` : ''}</small></div></div>
      <div class="tc-f tc-f-wide">${skillTags(x) || '<span class="hint">ยังไม่ระบุความถนัด</span>'}</div></div>`; }).join('')}</div>` : empty('ยังไม่มีช่าง — กด + เพิ่มช่าง', 'team'));
}
function openTech(id) { pushSheet({ t: 'tech', id }); }
function techSheet(id) {
  const x = users[id];
  if (!x || x.role !== 'technician' || x.removed || !canManageTeam(currentUser)) return [id, empty('ไม่พบข้อมูล', 'search')];
  const s = techStats(id), open = tickets.filter(t => t.assignee === id && isOpen(t)).sort(byPriority), pj = projects.filter(p => p.owner === id);
  return [x.name, `<div class="card profile-card">${avatarHtml(x, 88)}<h3 class="tk-title">${esc(x.name)}</h3><p class="hint">${ROLE_LABEL[x.role]} · ${teams[x.team] || ''}</p>
      ${x.phone ? `<a class="btn sm" href="tel:${esc(x.phone)}">${ic('phone', 15, 2)}${esc(x.phone)}</a>` : ''}</div>
    <div class="kpis in-sheet"><div class="kpi"><b>${s.open}</b><span>งานเปิด</span></div><div class="kpi"><b>${s.done}</b><span>งานเสร็จ</span></div>
      <div class="kpi"><b>${s.avg ? '★ ' + num(s.avg) : '–'}</b><span>คะแนน</span></div><div class="kpi"><b>${pj.length}</b><span>โปรเจกต์</span></div></div>
    ${fold('t-skills', 'ความถนัด', `<div class="card"><div class="badges">${skillTags(x) || '<span class="hint">ยังไม่ระบุ</span>'}</div></div>`)}
    ${fold('t-jobs', 'งานที่กำลังทำ', open.length ? list(open) : empty('ไม่มีงานค้าง'), { count: open.length })}
    ${pj.length ? fold('t-projects', 'โปรเจกต์', `<div class="list">${pj.map(projCard).join('')}</div>`, { count: pj.length, open: false }) : ''}
    <div class="row"><button class="btn" onclick="openTechForm('${id}')">${ic('pen', 16, 2)}แก้ไข</button><button class="btn ghost-red" onclick="removeTech('${id}')">${ic('trash', 16, 2)}ลบช่าง</button></div>`];
}
/* รหัสผ่าน: บัญชีใหม่ต้องตั้งรหัสเริ่มต้น (แจ้งเจ้าของบัญชีเอง) · แก้ไขแล้วเว้นว่าง = ใช้รหัสเดิม */
const pwField = (id, isNew) => `<label class="fl">${isNew ? 'รหัสผ่านเริ่มต้น <em>*</em>' : 'ตั้งรหัสผ่านใหม่'}<input id="${id}" type="password" autocomplete="new-password" maxlength="200" placeholder="${isNew ? 'อย่างน้อย 8 ตัว — แจ้งเจ้าของบัญชีเอง' : 'เว้นว่าง = ใช้รหัสเดิม'}"></label>`;
const pwErr = (v, isNew) => (isNew || v) && v.length < 8 ? 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว' : '';
// ข้อมูลบัญชีที่ส่งให้ server — ส่งครบทุกช่องเพราะ server บันทึกทั้งแถว
const userBody = x => ({ name: x.name, email: x.email, role: x.role, phone: x.phone || '', team: x.team || '', skills: x.skills || [],
  customerId: x.customer || '', siteId: x.siteId || '', approver: !!x.approver, removed: !!x.removed });
let techPhoto = null;
async function techPhotoPick(input) {
  const f = input.files[0]; input.value = '';
  if (!f) return;
  try { techPhoto = await compressPhoto(f); $('techPh').innerHTML = `<img src="${PHOTOS[techPhoto]}" alt="">`; } catch { toast('เปิดไฟล์รูปนี้ไม่ได้'); }
}
function openTechForm(id) {
  if (!canManageTeam(currentUser)) return;
  const x = id ? users[id] : null; techPhoto = null;
  openModal(`<div class="mh"><h3>${x ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่าง'}</h3>${xbtn()}</div>
    <button type="button" class="join-photo" onclick="$('techFile').click()"><i id="techPh">${x?.photo && PHOTOS[x.photo] ? `<img src="${PHOTOS[x.photo]}" alt="">` : ic('camera', 28, 1.7)}</i>รูปโปรไฟล์</button>
    <input type="file" id="techFile" accept="image/*" hidden onchange="techPhotoPick(this)">
    <label class="fl">ชื่อ <em>*</em><input id="tName" maxlength="60" value="${esc(x?.name || '')}"></label>
    ${emailField('tEmail', x?.email)}
    <label class="fl">เบอร์โทร <em>*</em><input id="tPhone" type="tel" inputmode="tel" maxlength="15" value="${esc(x?.phone || '')}"></label>
    ${pwField('tPw', !x)}
    <div class="fl">ถนัดงาน<div class="catpick">${Object.entries(CATEGORIES).filter(([k]) => k !== 'other').map(([k, c]) =>
      `<label><input type="checkbox" name="skill" value="${k}" ${x?.skills?.includes(k) ? 'checked' : ''}><span>${ic(c.icon, 18)}${c.label}</span></label>`).join('')}</div></div>
    <div class="err" id="tErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveTech(${x ? `'${id}'` : ''})">บันทึก</button></div>`);
}
async function saveTech(id) {
  const u = currentUser; if (!canManageTeam(u)) return;
  const name = $('tName').value.trim(), email = normEmail($('tEmail').value), phone = $('tPhone').value.replace(/[\s-]/g, ''), pw = $('tPw').value;
  const skills = [...document.querySelectorAll('input[name=skill]:checked')].map(i => i.value);
  const err = !name ? 'กรุณากรอกชื่อ' : emailErr(email, id) || (!validPhone(phone) ? 'เบอร์โทรไม่ถูกต้อง' : phoneTaken(phone, id) ? 'เบอร์นี้มีในระบบแล้ว' : pwErr(pw, !id));
  if (err) { $('tErr').textContent = err; return; }
  const x = id ? users[id] : { role: 'technician', team: u.team || 'T1' };
  if (!await call(id ? `/users/${id}` : '/users', { ...userBody({ ...x, name, email, phone, skills }), password: pw, photo: techPhoto ? PHOTOS[techPhoto] : undefined }, 'tErr')) return;
  closeModal(); toast(id ? 'บันทึกแล้ว' : `เพิ่ม ${name} แล้ว — เข้าสู่ระบบด้วย ${email}`); renderAll();
}
/* ลบ = ปิดบัญชี (เก็บประวัติงานเดิมไว้) และต้องย้ายงาน/โปรเจกต์ที่ค้างก่อน ไม่ให้งานลูกค้าหลุด */
function removeTech(id) {
  const x = users[id]; if (!x || !canManageTeam(currentUser)) return;
  const busy = techLoad(id) + projects.filter(p => p.owner === id && pct(p) < 100).length;
  if (busy) return toast(`${x.name} มีงาน/โปรเจกต์ค้าง ${busy} รายการ — ย้ายให้คนอื่นก่อนจึงลบได้`);
  openModal(`<div class="mh"><h3>ลบ ${esc(x.name)}?</h3>${xbtn()}</div>
    <p class="hint" style="margin:0">ช่างคนนี้จะเข้าระบบไม่ได้อีก ประวัติงานเดิมยังอยู่ครบ</p>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="confirmRemoveTech('${id}')">ลบช่าง</button></div>`);
}
async function confirmRemoveTech(id) {
  const x = users[id]; if (!x || !canManageTeam(currentUser) || techLoad(id)) return;
  if (!await call(`/users/${id}`, userBody({ ...x, removed: true }))) return;
  closeModal(); closeSheet(); toast(`ลบ ${x.name} แล้ว`); renderAll();
}

/* ---------- แนะนำหมวดงานจากข้อความลูกค้า (ใช้จับคู่ช่างที่ถนัด) ---------- */
const CAT_WORDS = { printer: ['พิมพ์', 'ปริ้น', 'printer', 'หมึก'], network: ['เน็ต', 'wifi', 'ไวไฟ', 'เครือข่าย', 'lan'], account: ['รหัส', 'password', 'vpn', 'ล็อกอิน', 'login', 'อีเมล'],
  cctv: ['กล้อง', 'cctv', 'nvr'], install: ['ติดตั้ง', 'ลงโปรแกรม'], repair: ['เสีย', 'ซ่อม', 'จอ', 'เปิดไม่ติด', 'ค้าง', 'พัง'] };
const guessCategory = text => { const s = String(text).toLowerCase(); return Object.keys(CAT_WORDS).find(k => CAT_WORDS[k].some(w => s.includes(w))) || 'other'; };
console.assert(guessCategory('เครื่องพิมพ์ชั้น 2 พิมพ์ไม่ออก') === 'printer' && guessCategory('ติดตั้งกล้องหน้าร้าน') === 'cctv' && guessCategory('สวัสดี') === 'other', 'guessCategory');

/* ---------- GPS: ระยะทางและเวลาถึงโดยประมาณ ---------- */
const toRad = d => d * Math.PI / 180;
function kmBetween([a, b], [c, d]) { const h = Math.sin(toRad(c - a) / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(toRad(d - b) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); }
console.assert(kmBetween([13.75, 100.5], [13.75, 100.5]) === 0 && Math.abs(kmBetween([0, 0], [0, 1]) - 111.19) < .1, 'kmBetween');
// shortcut: ระยะเส้นตรง ×1.3 และความเร็วเมืองคงที่ 25 กม./ชม. — ใช้ Directions API (Google/Longdo) เมื่อต้องการตามถนนและการจราจรจริง
function eta(m) {
  const s = siteById(m.siteId); if (!s?.lat || !m.posLL) return null;
  const km = kmBetween(m.posLL, [s.lat, s.lng]) * 1.3;
  return { km, min: Math.max(1, Math.round(km / 25 * 60)) };
}
const etaText = e => !e ? '' : e.km < .1 ? 'ถึงที่หมายแล้ว' : `อีก ${num(e.km)} กม. · ประมาณ ${e.min} นาที`;
/* แปลงพิกัดเป็นตำแหน่งบนแผนที่จำลอง: จุดเริ่ม (15,80) → ที่หมาย (85,20) */
function mapXY(m, ll) {
  const s = siteById(m.siteId), a = m.startLL;
  return [15 + 70 * (ll[1] - a[1]) / ((s.lng - a[1]) || 1), 80 - 60 * (ll[0] - a[0]) / ((s.lat - a[0]) || 1)];
}

/* ---------- โน้ตส่วนตัวของแต่ละบัญชี ---------- */
// shortcut: โน้ตเก็บในเบราว์เซอร์เครื่องนี้ — ย้ายไปเก็บที่ server เมื่อต้องเปิดจากหลายเครื่อง
const notesKey = () => `gitsd-notes-${currentUser.id}`;
function openNotes() {
  const notes = store.get(notesKey(), []);
  openModal(`<div class="mh"><h3>โน้ตส่วนตัว</h3>${xbtn()}</div><p class="hint" style="margin:0 0 10px">เห็นเฉพาะคุณ</p>
    ${voiceBox('noteText', 'rows="3" maxlength="2000" placeholder="จดอะไรก็ได้…" aria-label="โน้ตใหม่"')}
    <div class="crow">${voiceBtn('noteText')}<span class="sp"></span><button class="btn primary sm" onclick="addNote()">${ic('plus', 16, 2)}บันทึก</button></div>
    ${notes.length ? `<div class="list dense" style="margin-top:14px">${notes.map((n, i) => `<div class="trow jrow"><div class="tr-m"><b class="note-txt">${esc(n.text)}</b><small>${fmt(new Date(n.at))}</small></div>${ibtn('trash', 'ลบโน้ต', `delNote(${i})`)}</div>`).join('')}</div>` : empty('ยังไม่มีโน้ต', 'note')}`);
}
function addNote() {
  const t = $('noteText').value.trim(); if (!t) return;
  stopVoice(); const notes = store.get(notesKey(), []); notes.unshift({ text: t, at: Date.now() }); store.set(notesKey(), notes); openNotes();
}
function delNote(i) { const notes = store.get(notesKey(), []); notes.splice(i, 1); store.set(notesKey(), notes); openNotes(); }

/* ---------- โปรเจกต์: ผู้รับผิดชอบ + ความคืบหน้าตามขั้นตอน ---------- */
const pct = p => p.tasks.length ? Math.round(p.tasks.filter(x => x.done).length / p.tasks.length * 100) : 0;
const projCard = p => `<div class="tcard" onclick="openProject('${p.id}')" role="button" tabindex="0">
  <div class="tc-h"><i class="tc-ic cat-${CATEGORIES[p.category] ? p.category : 'other'}">${ic(CATEGORIES[p.category]?.icon || 'folder', 22, 1.7)}</i><div class="tc-t"><b>${esc(p.name)}</b><small>${esc(custName(p.customer))} · ${esc(siteById(p.siteId)?.name || '-')}</small></div><b class="pct">${pct(p)}%</b></div>
  <div class="pbar" role="progressbar" aria-valuenow="${pct(p)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(p)}%"></i></div>
  <div class="tc-f"><span class="tag">${ic('user', 13, 2)}${esc(nameOf(p.owner))}</span><span class="tag ${p.due < new Date() && pct(p) < 100 ? 'warn' : ''}">${ic('clock', 13, 2)}กำหนด ${fmtD(p.due)}</span></div></div>`;
let pjFilter = 'active';
function setPjFilter(k) { pjFilter = k; renderAll(); }
function renderProjects() {
  const u = currentUser, vis = projects.filter(p => canSeeProject(u, p));
  const arr = vis.filter(p => (pjFilter === 'done') === (pct(p) === 100)).sort((a, b) => a.due - b.due);
  return pageHead('โปรเจกต์', u.role === 'customer' ? custName(u.customer) : 'งานติดตั้งและผู้รับผิดชอบ', isManager(u) ? ibtn('plus', 'สร้างโปรเจกต์', 'openProjectForm()') : '')
  + `<div class="tbar">${textTabs([['active', 'กำลังทำ', vis.filter(p => pct(p) < 100).length], ['done', 'เสร็จแล้ว', vis.filter(p => pct(p) === 100).length]], pjFilter, 'setPjFilter')}</div>`
  + (arr.length ? `<div class="list">${arr.map(projCard).join('')}</div>` : empty('ไม่มีโปรเจกต์', 'folder'));
}
function openProject(id) { pushSheet({ t: 'project', id }); }
function projectSheet(id) {
  const p = projects.find(x => x.id === id), u = currentUser;
  if (!p || !canSeeProject(u, p)) return [id, empty('ไม่พบโปรเจกต์', 'search')];
  const edit = canEditProject(u, p);
  return [p.name, `<div class="card"><div class="badges"><span class="tag">${CATEGORIES[p.category]?.label || ''}</span><span class="sp"></span><b class="pct big">${pct(p)}%</b></div>
      <h3 class="tk-title">${esc(p.name)}</h3><div class="pbar"><i style="width:${pct(p)}%"></i></div>
      <dl class="facts" style="margin-top:12px"><dt>ลูกค้า</dt><dd>${esc(custName(p.customer))}</dd><dt>สถานที่</dt><dd>${esc(siteById(p.siteId)?.name || '-')}</dd>
        <dt>ผู้รับผิดชอบ</dt><dd>${isManager(u) ? `<a class="lnk" onclick="openTech('${p.owner}')">${esc(nameOf(p.owner))}</a>` : esc(nameOf(p.owner))}</dd><dt>กำหนดเสร็จ</dt><dd>${fmtD(p.due)}</dd></dl></div>
    ${fold('pj-tasks', 'ขั้นตอนงาน', `<div class="card">${p.tasks.map((x, i) => `<label class="task ${x.done ? 'done' : ''}"><input type="checkbox" ${x.done ? 'checked' : ''} ${edit ? `onchange="toggleTask('${id}',${i})"` : 'disabled'}><span>${esc(x.text)}</span></label>`).join('') || '<p class="hint">ยังไม่มีขั้นตอน</p>'}
      ${edit ? `<div class="cbox" style="margin-top:10px"><input id="newTask" placeholder="เพิ่มขั้นตอน…" maxlength="120" aria-label="ขั้นตอนใหม่" onkeydown="if(event.key==='Enter')addTask('${id}')"><button class="btn primary send" onclick="addTask('${id}')" aria-label="เพิ่มขั้นตอน">${ic('plus', 18, 2.4)}</button></div>` : ''}</div>`,
      { count: `${p.tasks.filter(x => x.done).length}/${p.tasks.length}` })}`];
}
async function toggleTask(id, i) {
  const p = projects.find(x => x.id === id); if (!p || !canEditProject(currentUser, p)) return;
  await call(`/projects/${id}/tasks/${p.tasks[i].id}`, { done: !p.tasks[i].done });
  renderAll();
}
async function addTask(id) {
  const p = projects.find(x => x.id === id), t = $('newTask').value.trim();
  if (!t || !p || !canEditProject(currentUser, p)) return;
  await call(`/projects/${id}/tasks`, { text: t });
  renderAll();
}
function openProjectForm() {
  if (!isManager(currentUser)) return;
  const first = Object.keys(customers)[0];
  openModal(`<div class="mh"><h3>สร้างโปรเจกต์</h3>${xbtn()}</div>
    <label class="fl">ชื่อโปรเจกต์ <em>*</em><input id="pjName" maxlength="80" placeholder="เช่น ติดตั้งกล้องวงจรปิด 8 จุด"></label>
    <div class="two"><label class="fl">ประเภท<select id="pjCat">${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}</select></label>
    <label class="fl">กำหนดเสร็จ <em>*</em><input id="pjDue" type="date" value="${new Date(Date.now() + 7 * DAY * 1000).toISOString().slice(0, 10)}"></label></div>
    <label class="fl">ลูกค้า <em>*</em><select id="fCust" onchange="$('fSite').innerHTML=siteOptions(this.value)">${Object.values(customers).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>
    <label class="fl">สถานที่ <em>*</em><select id="fSite">${siteOptions(first)}</select></label>
    <label class="fl">ผู้รับผิดชอบ <em>*</em><select id="pjOwner">${techs().map(x => `<option value="${x.id}">${esc(x.name)}${x.skills?.length ? ' — ถนัด ' + x.skills.map(k => CATEGORIES[k]?.label).join(', ') : ''}</option>`).join('')}</select></label>
    <label class="fl">ขั้นตอนงาน (บรรทัดละ 1 ขั้น)<textarea id="pjTasks" rows="4" placeholder="สำรวจหน้างาน&#10;เดินสาย&#10;ติดตั้ง&#10;ส่งมอบ"></textarea></label>
    <div class="err" id="pjErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveProject()">สร้างโปรเจกต์</button></div>`);
}
async function saveProject() {
  const u = currentUser; if (!isManager(u)) return;
  const name = $('pjName').value.trim(), due = $('pjDue').value, owner = $('pjOwner').value, customer = $('fCust').value, siteId = $('fSite').value;
  const err = !name ? 'กรุณากรอกชื่อโปรเจกต์' : !due ? 'กรุณาเลือกวันกำหนดเสร็จ' : !owner ? 'กรุณาเลือกผู้รับผิดชอบ' : '';
  if (err) { $('pjErr').textContent = err; return; }
  const tasks = $('pjTasks').value.split('\n').map(s => s.trim()).filter(Boolean);
  const d = await call('/projects', { name, category: $('pjCat').value, customerId: customer, siteId, ownerId: owner, due, tasks }, 'pjErr');
  if (!d) return;
  closeModal(); toast('สร้างโปรเจกต์แล้ว'); renderAll(); openProject(d.id);
}

/* ---------- หน้า "ฉัน": โปรไฟล์ · โหมดสี · ตั้งค่า ---------- */
function renderMe() {
  const u = currentUser;
  const row = (icon, label, fn, sub = '') => `<button class="srow" onclick="${fn}"><i>${ic(icon, 20, 1.8)}</i><span>${label}${sub ? `<small>${sub}</small>` : ''}</span>${ic('right', 16, 2)}</button>`;
  return pageHead('ฉัน')
  + `<div class="me-card">${avatarHtml(u, 76)}<b>${esc(u.name)}</b><small>${ROLE_LABEL[u.role]} · ${u.customer ? esc(custName(u.customer)) : u.team ? teams[u.team] : 'Guru IT Solution'}</small><small>${esc(u.email || '')}</small>
    <button class="btn soft sm" onclick="openProfile()">${ic('pen', 16, 2)}แก้ไขข้อมูลของฉัน</button></div>
  <div class="sgroup">
    ${u.role === 'technician' ? row('clock', 'ประวัติการทำงาน', "goTab('history')", 'แยกตามเดือน') : ''}
    ${row('note', 'โน้ตส่วนตัว', 'openNotes()', `${store.get(notesKey(), []).length} โน้ต · เห็นเฉพาะคุณ`)}
    ${row('bell', 'การแจ้งเตือน', 'openNotifs()', !('Notification' in window) ? 'เบราว์เซอร์นี้แจ้งเตือนได้เฉพาะในแอป' : Notification.permission === 'granted' ? 'เด้งเตือนบนเครื่องนี้: เปิดอยู่' : 'แตะเพื่อเปิดเด้งเตือนบนเครื่องนี้')}
  </div>
  ${fold('me-disp', 'การแสดงผล', `<div class="sgroup">
    <div class="srow static"><i>${ic('palette', 20, 1.8)}</i><span>โหมดสี</span></div>
    <div class="theme-pick" role="radiogroup" aria-label="โหมดสี">${THEMES.map(([k, l, i]) => `<button role="radio" aria-checked="${theme === k}" class="${theme === k ? 'on' : ''}" onclick="setTheme('${k}')"><span class="sw sw-${k}">${ic(i, 20, 1.8)}</span>${l}</button>`).join('')}</div>
    <div class="srow static"><i>${ic('globe', 20, 1.8)}</i><span>ภาษา</span></div>
    <div class="theme-pick" role="radiogroup" aria-label="ภาษา">${LANGS.map(([k, l]) => `<button role="radio" aria-checked="${lang === k}" class="${lang === k ? 'on' : ''}" onclick="setLang('${k}')"><span class="sw sw-lang">${k.toUpperCase()}</span>${l}</button>`).join('')}</div>
    <button class="srow" onclick="setDense(${!dense})"><i>${ic(dense ? 'rows' : 'cards', 20, 1.8)}</i><span>มุมมองรายการ<small>${dense ? 'แบบย่อ — แถวเดียว' : 'แบบเต็ม — แสดงรายละเอียด'}</small></span><span class="switch ${dense ? 'on' : ''}" aria-hidden="true"></span></button>
  </div>`, { open: false })}
  ${canApproveMembers(u, u.customer) ? `<div class="sgroup"><h4>บริษัทของฉัน</h4>${row('team', 'ชวนพนักงานเข้าใช้งาน', 'openInvite()', 'ส่งลิงก์สมัคร — คุณเป็นผู้อนุมัติ')}${row('user', 'เพิ่มพนักงานเอง', 'openStaffForm()', 'สร้างบัญชีให้พนักงานทันที ไม่ต้องรอสมัคร')}${Object.values(users).filter(x => x.role === 'customer' && x.customer === u.customer && !x.approver && x.id !== u.id).map(x => row('user', esc(x.name) + (x.removed ? ' (ปิดแล้ว)' : ''), `openStaffForm('${x.id}')`, x.email || '')).join('')}</div>` : ''}
  ${isManager(u) ? `<div class="sgroup"><h4>จัดการ</h4>
    ${canManageUsers(u) ? row('team', 'ผู้ใช้และสิทธิ์', "goTab('users')") : ''}
    ${canSeeMissions(u) ? row('pin', 'ติดตามช่างภาคสนาม', "goTab('mission')") : ''}
    ${row('building', 'พาร์ทเนอร์และสถานที่', "goTab('partners')")}
    ${row('chart', 'รายงานผลงาน', "rpt.view='summary';goTab('reports')")}
    ${row('shield', 'บันทึกตรวจสอบ', "rpt.view='audit';goTab('reports')")}</div>` : ''}
  <div class="sgroup"><h4>บัญชี</h4>${row('lock', 'เปลี่ยนรหัสผ่าน', 'openPassword()')}${row('logout', 'ออกจากระบบ', 'logout()')}</div>
  <p class="about"><img src="img/icon-192.png" alt="" width="28" height="28">Guru IT Service Desk</p>`;
}

/* แก้ข้อมูลของตัวเอง (ทุกบทบาท) — เปลี่ยนอีเมลต้องยืนยันรหัสปัจจุบัน */
function openProfile() {
  const u = currentUser; techPhoto = null;
  openModal(`<div class="mh"><h3>แก้ไขข้อมูลของฉัน</h3>${xbtn()}</div>
    <button type="button" class="join-photo" onclick="$('techFile').click()"><i id="techPh">${u.photo && PHOTOS[u.photo] ? `<img src="${PHOTOS[u.photo]}" alt="">` : ic('camera', 28, 1.7)}</i>เปลี่ยนรูปโปรไฟล์</button>
    <input type="file" id="techFile" accept="image/*" hidden onchange="techPhotoPick(this)">
    <label class="fl">ชื่อ-นามสกุล <em>*</em><input id="mName" maxlength="80" value="${esc(u.name)}"></label>
    <label class="fl">เบอร์โทร<input id="mPhone" type="tel" inputmode="tel" maxlength="15" placeholder="เช่น 081-234-5678" value="${esc(u.phone || '')}"></label>
    ${emailField('mEmail', u.email, `oninput="$('mCur').style.display = normEmail(this.value) === currentUser.email ? 'none' : ''"`)}
    <label class="fl" id="mCur" style="display:none">รหัสผ่านปัจจุบัน (ยืนยันการเปลี่ยนอีเมล) <em>*</em><input id="mCurPw" type="password" autocomplete="current-password" maxlength="200"></label>
    <div class="err" id="mErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveProfile()">บันทึก</button></div>`);
}
async function saveProfile() {
  const u = currentUser, name = $('mName').value.trim(), phone = $('mPhone').value.replace(/[\s-]/g, ''), email = normEmail($('mEmail').value), cur = $('mCurPw').value;
  const err = !name ? 'กรุณากรอกชื่อ' : phone && !validPhone(phone) ? 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)' : emailErr(email, u.id) || (email !== u.email && !cur ? 'ใส่รหัสผ่านปัจจุบันเพื่อเปลี่ยนอีเมล' : '');
  if (err) { $('mErr').textContent = err; return; }
  if (!await call('/me', { name, phone, email, currentPassword: cur, photo: techPhoto ? PHOTOS[techPhoto] : undefined }, 'mErr')) return;
  closeModal(); toast('บันทึกแล้ว'); renderAll();
}
function openPassword() {
  openModal(`<div class="mh"><h3>เปลี่ยนรหัสผ่าน</h3>${xbtn()}</div>
    <label class="fl">รหัสผ่านปัจจุบัน <em>*</em><input id="pwCur" type="password" autocomplete="current-password" maxlength="200"></label>
    <label class="fl">รหัสผ่านใหม่ <em>*</em><input id="pwNew" type="password" autocomplete="new-password" maxlength="200" placeholder="อย่างน้อย 8 ตัว"></label>
    <label class="fl">พิมพ์รหัสผ่านใหม่อีกครั้ง <em>*</em><input id="pwNew2" type="password" autocomplete="new-password" maxlength="200"></label>
    <div class="err" id="pwErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="savePassword()">เปลี่ยนรหัสผ่าน</button></div>`);
}
async function savePassword() {
  const u = currentUser, cur = $('pwCur').value, next = $('pwNew').value;
  const err = !cur ? 'กรุณาใส่รหัสผ่านปัจจุบัน' : pwErr(next, true) || (next !== $('pwNew2').value ? 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' : '');
  if (err) { $('pwErr').textContent = err; return; }
  if (!await call('/me', { name: u.name, phone: u.phone || '', email: u.email, currentPassword: cur, newPassword: next }, 'pwErr')) return;
  closeModal(); toast('เปลี่ยนรหัสผ่านแล้ว — เครื่องอื่นที่เข้าไว้จะถูกออกจากระบบ');
}

/* ---------- Sheet (หน้าซ้อน: งาน / พาร์ทเนอร์) ---------- */
function pushSheet(v) {
  sheetStack.push(v); renderSheet();
  $('sheet').classList.add('open'); $('sheet').setAttribute('aria-hidden', 'false'); $('sheetBg').classList.add('on');
  $('sheet').querySelector('.sheet-body').scrollTo(0, 0);
  $('sheet').querySelector('.sheet-bar .ibtn')?.focus({ preventScroll: true });
  syncHistory();
}
function openTicket(id) {
  if (sheetStack.at(-1)?.id !== id) { cmtVis = 'public'; cmtDraft = ''; clearPending('cmt'); clearPending('wl'); }
  pushSheet({ t: 'ticket', id });
}
function openPartner(id) { pushSheet({ t: 'partner', id }); }
function backSheet() { stopVoice(); sheetStack.pop(); if (sheetStack.length) renderSheet(); else hideSheet(); syncHistory(); }
function closeSheet() { stopVoice(); sheetStack = []; hideSheet(); syncHistory(); }
function hideSheet() { $('sheet').classList.remove('open'); $('sheet').setAttribute('aria-hidden', 'true'); $('sheetBg').classList.remove('on'); }

function renderSheet() {
  const v = sheetStack.at(-1); if (!v) return;
  const body = $('sheet').querySelector('.sheet-body');
  const keep = body && body.dataset.key === v.t + v.id ? body.scrollTop : 0;
  const [title, inner] = ({ partner: partnerSheet, tech: techSheet, project: projectSheet }[v.t] || ticketSheet)(v.id);
  $('sheet').innerHTML = `<div class="sheet-bar"><button class="ibtn" onclick="backSheet()" aria-label="กลับ">${ic('back', 22, 2)}</button><h2>${esc(title)}</h2>
    ${ibtn('fold', 'ย่อ / ขยายทั้งหมด', "toggleAllFolds('sheetInner')")}</div>
    <div class="sheet-body" data-key="${v.t + v.id}"><div class="sheet-inner" id="sheetInner">${inner}</div></div>`;
  $('sheet').querySelector('.sheet-body').scrollTop = keep;
}

/* ---------- รายละเอียดงาน (แต่ละส่วนย่อ/ขยายได้) ---------- */
function siteBox(tk, withActions) {
  const s = siteOf(tk); if (!s) return '';
  return `<div class="sitebox"><i>${ic('building', 20)}</i><div><b>${esc(s.name)}${tk.location ? ` · ${esc(tk.location)}` : ''}</b><small>${esc(s.address)}</small>
    ${s.contact ? `<small>ผู้ติดต่อ: ${esc(s.contact)}${s.phone ? ` · <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : ''}</small>` : ''}</div>
    ${withActions ? `<a class="btn sm" href="${mapUrl(s.address)}" target="_blank" rel="noopener">${ic('pin', 15, 2)}แผนที่</a>` : ''}</div>`;
}
function reportCard(tk) {
  const u = currentUser, r = tk.report; if (!r || !canSeeReport(u, tk)) return '';
  const s = signState(tk), cust = u.role === 'customer';
  const buttons = [];
  if (canSignOff(u, tk)) buttons.push(`<button class="btn primary" onclick="openSignOff('${tk.id}')">${ic('pen', 16, 2)}${cust ? 'ตรวจสอบและเซ็นรับงาน' : 'ให้ลูกค้าเซ็นบนเครื่องนี้'}</button>`);
  buttons.push(`<button class="btn" onclick="openReport('${tk.id}')">${ic('doc', 16, 2)}ดูใบรายงาน</button>`);
  if (canRejectWork(u, tk)) buttons.push(`<button class="btn ghost-red" onclick="openReject('${tk.id}')">${ic('undo', 16, 2)}ยังไม่เรียบร้อย</button>`);
  return fold('d-report', `ใบรายงาน <span class="mono muted">${r.no}</span>`, `<div class="card ${s === 'waiting' && cust ? 'attn' : ''}">
    <div class="badges">${signBadge(tk)}</div>
    <p class="rsum">${esc(r.summary)}</p>
    ${gallery(r.photos)}
    <div class="rmeta"><span>${ic('user', 13, 2)}${esc(nameOf(r.by))}</span><span>${ic('clock', 13, 2)}${hrs(r.hours)}</span>${r.parts ? `<span>${ic('tool', 13, 2)}${esc(r.parts)}</span>` : ''}</div>
    ${r.signoff ? `<div class="signed"><img src="${r.signoff.sig}" alt="ลายเซ็น"><div><b>${esc(r.signoff.name)}</b><small>${esc(r.signoff.position || '')}${r.signoff.position ? ' · ' : ''}${fmt(r.signoff.at)} · ${r.signoff.via === 'onsite' ? 'เซ็นหน้างาน' : 'เซ็นผ่านแอป'}</small></div></div>` : ''}
    ${s === 'nosign' ? `<div class="locked">${ic('alert', 18)}<div>ปิดงานโดยไม่มีลายเซ็น: ${esc(r.closedNoSign || '-')}</div></div>` : ''}
    <div class="row">${buttons.join('')}</div></div>`, { open: true });
}
function ratingCard(tk) {
  const u = currentUser;
  if (tk.rating) return `<div class="card rating-card">${starsHtml(tk.rating.score, 20)}<div><b>${RATE_LABEL[tk.rating.score]}</b>${tk.rating.comment ? `<small>“${esc(tk.rating.comment)}”</small>` : ''}</div></div>`;
  if (canRate(u, tk)) return `<button class="mcard nudge" onclick="openRating('${tk.id}')"><i>${ic('star', 22, 1.8)}</i><div><b>บริการครั้งนี้เป็นอย่างไร?</b><small>แตะเพื่อให้คะแนน — ใช้เวลา 5 วินาที</small></div>${ic('right', 18, 2)}</button>`;
  return '';
}
function composerHtml(tk) {
  const u = currentUser, cust = u.role === 'customer';
  return `<div class="composer ${cust ? 'public' : cmtVis}">
    ${isStaff(u) ? `<div class="seg" role="tablist"><button class="${cmtVis === 'public' ? 'on' : ''}" onclick="setCmtVis('public')">${ic('chat', 14, 2)}ตอบลูกค้า</button><button class="${cmtVis === 'internal' ? 'on' : ''}" onclick="setCmtVis('internal')">${ic('lock', 14, 2)}บันทึกภายใน</button></div>
    <div class="vis-hint">${cmtVis === 'public' ? 'ลูกค้าจะเห็นข้อความนี้' : 'เห็นเฉพาะทีมงาน — ลูกค้าไม่เห็น'}</div>` : ''}
    ${voiceBox('newCmt', `rows="2" oninput="cmtDraft=this.value" placeholder="${cust ? 'พิมพ์ข้อความถึงทีมงาน…' : cmtVis === 'public' ? 'พิมพ์ข้อความถึงลูกค้า…' : 'บันทึกสำหรับทีมงาน…'}" aria-label="ข้อความ"`, cmtDraft)}
    ${thumbsBox('cmt')}
    <div class="crow">${voiceBtn('newCmt')}${photoBtn('cmt')}<span class="sp"></span><button class="btn primary sm" onclick="addComment('${tk.id}')">${ic('send', 16, 2)}ส่ง</button></div></div>`;
}
function ticketSheet(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser;
  if (!tk || !canSeeTicket(u, tk)) return [id, `<div class="card">${empty('ไม่พบงานนี้', 'search')}<p class="hint" style="text-align:center">(ระบบตอบ 404 แทน 403 เพื่อไม่ให้รู้ว่างานนี้มีอยู่)</p></div>`];
  const cat = CATEGORIES[tk.category] || CATEGORIES.other, cust = u.role === 'customer';
  const m = missionOf(tk);
  const acts = actionsFor(u, tk);
  const seen = tk.comments.filter(c => canSeeComment(u, c));
  const msgs = seen.map(c => {
    const mine = c.by === u.id, staff = users[c.by] ? isStaff(users[c.by]) : false;
    return `<div class="bubble ${mine ? 'me' : ''} ${c.vis === 'internal' ? 'internal' : ''}">
      <div class="meta">${c.vis === 'internal' ? `${ic('lock', 12, 2.2)}บันทึกภายใน · ` : ''}${esc(nameOf(c.by))}${staff && cust ? ' (ทีมงาน)' : ''} · ${ago(c.at)}</div>${c.text ? `<div class="btxt">${esc(c.text)}</div>` : ''}${gallery(c.photos)}</div>`;
  }).join('') || '<div class="hint">ยังไม่มีข้อความ</div>';
  const convo = fold('d-chat', cust ? 'คุยกับทีมงาน' : 'การสนทนา', `<div class="card"><div class="thread">${msgs}</div>${composerHtml(tk)}</div>`, { count: seen.length });
  const timeline = `<div class="timeline">${tk.history.slice().reverse().map(h => `<div><b>${h.from ? STATUS_LABEL[h.from] + ' → ' : ''}${STATUS_LABEL[h.to]}</b> <span>โดย ${esc(nameOf(h.by))}</span><br><span class="mono">${fmt(h.at)}</span>${h.reason ? `<div class="reason">${esc(h.reason)}</div>` : ''}</div>`).join('')}</div>`;
  const history = fold('d-hist', 'ประวัติ', `<div class="card">${timeline}</div>`, { open: false, count: tk.history.length });

  if (cust) {
    const cs = custStatus(tk);
    const status = `<div class="card status-card st-${tk.status}">
      <div class="st-row"><div class="st-ic">${ic(cs.icon, 24, 1.9)}</div><div><b>${esc(cs.t)}</b><small>${esc(cs.d)}</small></div></div>
      ${custProgress(tk)}
      ${tk.assignee ? `<div class="techline"><div class="avatar sm">${ic('tool', 16, 1.8)}</div><div><b>ช่าง${esc(nameOf(tk.assignee))}</b><small>ช่างผู้ดูแลงานของคุณ</small></div></div>` : ''}
    </div>`;
    const details = fold('d-info', 'รายละเอียด', `<div class="card"><h3 class="tk-title">${esc(tk.subject)}</h3>
      <dl class="facts"><dt>เลขที่</dt><dd class="mono">${tk.id}</dd><dt>สถานที่</dt><dd>${esc(siteLabel(tk))}</dd><dt>แจ้งเมื่อ</dt><dd>${fmt(tk.history[0].at)}</dd></dl>
      ${gallery(tk.photos)}</div>`, { open: false, count: tk.photos?.length ? `${tk.photos.length} รูป` : null });
    return [tk.id, status + reportCard(tk) + ratingCard(tk) + convo + details + history];
  }

  const summary = `<div class="card">
    <div class="badges"><span class="pill p-${tk.status}">${STATUS_LABEL[tk.status]}</span>${['urgent', 'high'].includes(tk.priority) ? `<span class="prio prio-${tk.priority}">${PRIORITY_LABEL[tk.priority]}</span>` : ''}<span class="sp"></span><span class="hint">${cat.label}</span></div>
    <h3 class="tk-title">${esc(tk.subject)}</h3>
    <dl class="facts">
      <dt>ลูกค้า</dt><dd>${isManager(u) ? `<a class="lnk" onclick="openPartner('${tk.customer}')">${esc(custName(tk.customer))}</a>` : esc(custName(tk.customer))}</dd>
      <dt>ผู้รับผิดชอบ</dt><dd>${tk.assignee ? (isManager(u) ? `<a class="lnk" onclick="openTech('${tk.assignee}')">${esc(nameOf(tk.assignee))}</a>` : esc(nameOf(tk.assignee))) : '<span class="prio-urgent">ยังไม่มอบหมาย</span>'}</dd>
    </dl>
    ${acts.length ? `<div class="row">${acts.map(a => `<button class="btn ${a.primary ? 'primary' : ''}" onclick="${a.fn}">${ic(a.icon, 16, 2)}${a.label}</button>`).join('')}</div>`
      : `<div class="locked" style="margin-top:12px">${ic('info', 18)}<div>${whyNoAction(u, tk)}</div></div>`}
  </div>`;
  const where = fold('d-site', 'สถานที่และรายละเอียด', `<div class="card">${siteBox(tk, true)}
    <dl class="facts" style="margin-top:12px"><dt>แจ้งเมื่อ</dt><dd>${fmt(tk.history[0].at)} โดย ${esc(nameOf(tk.history[0].by))}</dd><dt>ประเภท</dt><dd>${cat.label}</dd><dt>ความสำคัญ</dt><dd>${PRIORITY_LABEL[tk.priority]}</dd></dl>
    ${gallery(tk.photos)}</div>`, { open: false });
  const worklog = canSeeWorklog(u) ? fold('d-wl', `Work log <small class="int">${ic('lock', 11, 2.2)}ภายใน</small>`, `<div class="card">
    ${tk.worklogs.map(w => `<div class="cmt"><div class="meta">${esc(nameOf(w.by))} · ${fmt(w.at)}</div>${esc(w.text)}${gallery(w.photos)}</div>`).join('') || '<div class="hint">ยังไม่มีบันทึกการทำงาน</div>'}
    ${canAddWorklog(u, tk) ? `<div class="cbox" style="margin-top:10px"><textarea id="newWl" rows="2" placeholder="ทำอะไรไป ใช้เวลาเท่าไร… (แนบรูปหลักฐานได้)" aria-label="บันทึกการทำงาน"></textarea><button class="btn primary send" onclick="addWorklog('${tk.id}')" aria-label="บันทึก">${ic('plus', 18, 2.4)}</button></div>
    <div class="tools">${photoBtn('wl', 'แนบรูปหลักฐาน')}</div>${thumbsBox('wl')}` : ''}</div>`, { open: false, count: tk.worklogs.length }) : '';
  const mission = m && canSeeMissions(u) ? `<button class="mcard" onclick="closeSheet();goTab('mission')"><i>${ic('pin', 22)}</i><div><b>ภารกิจภาคสนาม ${m.id}</b><small>${MISSION_LABEL[m.status]} — แตะเพื่อดูแผนที่</small></div>${ic('right', 18, 2)}</button>` : '';
  return [tk.id, summary + reportCard(tk) + ratingCard(tk) + mission + convo + where + worklog + history];
}
function setCmtVis(v) { cmtVis = v; renderSheet(); $('newCmt')?.focus(); }

/* ---------- การเปลี่ยนสถานะ ---------- */
const REASON_FOR = {
  pending: ['พักงาน', 'เหตุผลที่พักงาน (ลูกค้าเห็น)', 'เช่น รออะไหล่ 2-3 วัน / รอลูกค้าสะดวก'],
  reopen: ['เปิดงานอีกครั้ง', 'เหตุผลที่เปิดงานอีกครั้ง', 'เช่น ลูกค้าแจ้งว่าปัญหากลับมาอีก'],
  sendback: ['ส่งกลับไปแก้ไข', 'สิ่งที่ต้องแก้ไขเพิ่ม', 'เช่น ทดสอบไม่ผ่านที่เครื่องลูกค้าอีก 1 เครื่อง'],
  nosign: ['ปิดงานโดยไม่มีลายเซ็นลูกค้า', 'เหตุผล (จะแสดงในใบรายงาน)', 'เช่น ลูกค้ายืนยันทางโทรศัพท์ / ติดต่อลูกค้าไม่ได้เกิน 7 วัน'],
};
function requestTransition(id, to) {
  const tk = tickets.find(x => x.id === id);
  if (!canTransition(currentUser, tk, to)) return;
  if (to === 'resolved') return openResolve(id);
  const key = to === 'pending' ? 'pending' : to === 'closed' ? 'nosign'
    : to === 'in_progress' && tk.status === 'closed' ? 'reopen' : to === 'in_progress' && tk.status === 'resolved' ? 'sendback' : null;
  if (!key) return doTransition(id, to, null);
  const [title, label, ph] = REASON_FOR[key];
  openModal(`<div class="mh"><h3>${title} · ${tk.id}</h3>${xbtn()}</div>
    <label class="fl">${label} <em>*</em><textarea id="reason" rows="3" placeholder="${ph}"></textarea></label>
    <div class="err" id="reasonErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="confirmReason('${id}','${to}')">ยืนยัน</button></div>`);
  focusLater('reason');
}
function confirmReason(id, to) {
  const r = $('reason').value.trim();
  if (!r) { $('reasonErr').textContent = 'กรุณากรอกข้อมูลนี้'; $('reason').focus(); return; }
  closeModal(); doTransition(id, to, r);
}
/* เปลี่ยนสถานะที่ server (ตรวจสิทธิ์และกันสองคนเปลี่ยนพร้อมกัน) — ทำเสร็จอีกครั้งจะออกใบรายงานใหม่แทนใบเดิม */
async function doTransition(id, to, reason) {
  const tk = tickets.find(x => x.id === id);
  if (!canTransition(currentUser, tk, to)) return;
  if (!await call(`/tickets/${id}/status`, { to, reason })) return;
  toast(`${id}: ${STATUS_LABEL[to]}`); renderAll();
}

/* ---------- ทำเสร็จ → ออกใบรายงาน (แนบรูปหลังซ่อมเป็นหลักฐานได้) ---------- */
function suggestHours(tk) {
  const start = tk.history.find(h => h.to === 'in_progress')?.at || tk.history[0].at;
  return Math.max(0.5, Math.round((Date.now() - start.getTime()) / 3600000 * 2) / 2);
}
function openResolve(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser;
  if (!canResolveWithReport(u, tk)) return;
  const onsite = u.role === 'technician';
  clearPending('report');
  openModal(`<div class="mh"><h3>ทำเสร็จ — ออกใบรายงาน</h3>${xbtn()}</div>
    <p class="hint" style="margin:0 0 4px">${tk.id} · ${esc(tk.subject)}<br>ลูกค้าจะเห็นใบรายงานนี้และใช้เซ็นรับงาน — เขียนให้ลูกค้าเข้าใจ</p>
    <label class="fl" for="rSum">สรุปงานที่ทำ <em>*</em></label>
    ${voiceBox('rSum', 'rows="3" placeholder="เช่น เปลี่ยนลูกกลิ้งดึงกระดาษ ทดสอบพิมพ์ 20 แผ่นปกติ"')}
    <div class="tools">${voiceBtn('rSum', 'พูดแทนพิมพ์')}${photoBtn('report', 'รูปหลังซ่อม')}</div>
    ${thumbsBox('report')}
    <div class="two"><label class="fl">อุปกรณ์ / อะไหล่ที่ใช้<input id="rParts" placeholder="ไม่มีให้เว้นว่าง"></label>
    <label class="fl">เวลาที่ใช้ (ชั่วโมง)<input id="rHours" type="number" min="0" step="0.5" value="${suggestHours(tk)}" inputmode="decimal"></label></div>
    <div class="fl">ขั้นตอนถัดไป<div class="opts" style="margin-top:6px">
      ${onsite ? `<label class="opt"><input type="radio" name="nextSign" value="now" checked><div><b>ให้ลูกค้าเซ็นบนเครื่องนี้ทันที</b><small>เหมาะเมื่ออยู่หน้างานกับลูกค้า</small></div></label>` : ''}
      <label class="opt"><input type="radio" name="nextSign" value="app" ${onsite ? '' : 'checked'}><div><b>ส่งให้ลูกค้าเซ็นในแอป</b><small>ลูกค้าจะเห็น "รอคุณเซ็นรับ"</small></div></label>
    </div></div>
    <div class="err" id="rErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="submitResolve('${id}')">${ic('doc', 16, 2)}ออกใบรายงาน</button></div>`);
  focusLater('rSum');
}
async function submitResolve(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser, summary = $('rSum').value.trim();
  if (!summary) { $('rErr').textContent = 'กรุณาสรุปงานที่ทำ'; $('rSum').focus(); return; }
  if (!canResolveWithReport(u, tk)) return;
  stopVoice();
  const next = document.querySelector('input[name=nextSign]:checked')?.value;
  if (!await call(`/tickets/${id}/resolve`, { summary, parts: $('rParts').value.trim(), hours: Math.max(0, +$('rHours').value || 0), photos: pending.report.map(p => PHOTOS[p]) }, 'rErr')) return;
  clearPending('report');
  const no = tickets.find(x => x.id === id)?.report?.no;
  if (next !== 'now') notify(Object.values(users).filter(x => x.customer === tk.customer).map(x => x.id), 'งานเสร็จแล้ว — กรุณาเซ็นรับ', tk.subject, id);
  renderAll();
  if (next === 'now') openSignOff(id); else { closeModal(); toast(`ออกใบรายงาน ${no} แล้ว — รอลูกค้าเซ็นรับ`); }
}

/* ---------- เซ็นรับงาน (ลายเซ็นบนจอ) → ให้คะแนน ---------- */
function openSignOff(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser, r = tk?.report;
  if (!tk || !canSignOff(u, tk)) return;
  const onsite = u.role === 'technician', s = siteOf(tk);
  openModal(`<div class="mh"><h3>เซ็นรับงาน</h3>${xbtn()}</div>
    ${onsite ? `<div class="note-sm">${ic('pen', 16, 2)}ยื่นเครื่องให้ลูกค้าตรวจสอบและเซ็นรับงาน</div>` : ''}
    <div class="mini-report">
      <div class="mr-head"><span class="mono">${r.no}</span><span>${tk.id}</span></div>
      <b>${esc(tk.subject)}</b>
      <small>${esc(s?.name || '')}${tk.location ? ' · ' + esc(tk.location) : ''}</small>
      <div class="mr-sum">${esc(r.summary)}</div>
      ${gallery(r.photos)}
      <div class="rmeta"><span>${ic('user', 13, 2)}ช่าง${esc(nameOf(r.by))}</span><span>${ic('clock', 13, 2)}${hrs(r.hours)}</span>${r.parts ? `<span>${ic('tool', 13, 2)}${esc(r.parts)}</span>` : ''}</div>
      <a class="lnk" onclick="openReport('${id}')" style="font-size:13px">ดูใบรายงานฉบับเต็ม</a>
    </div>
    <label class="fl">ชื่อผู้รับงาน <em>*</em><input id="sgName" value="${onsite ? esc(s?.contact || '') : esc(customers[tk.customer]?.contact || u.name)}" autocomplete="name"></label>
    ${onsite ? `<label class="fl">ตำแหน่ง<input id="sgPos" placeholder="เช่น ผู้จัดการสาขา"></label>` : ''}
    <div class="fl">เซ็นชื่อ <em>*</em>
      <div class="sigwrap" id="sigwrap"><canvas id="sigpad" aria-label="ช่องเซ็นชื่อ"></canvas><span class="sig-ph">ใช้นิ้วหรือเมาส์เซ็นในกรอบนี้</span>
        <button type="button" class="sig-clear" onclick="clearSig()">${ic('undo', 14, 2)}ล้าง</button></div></div>
    <p class="agree-txt">การเซ็นนี้ยืนยันว่าได้รับบริการตามใบรายงานนี้เรียบร้อยแล้ว</p>
    <div class="err" id="sgErr" role="alert"></div>
    <button class="btn primary block" onclick="submitSignOff('${id}')">${ic('check', 18, 2.4)}ยืนยัน งานเรียบร้อย</button>`);
  initSigPad();
}
let sig = null;
function initSigPad() {
  const c = $('sigpad'); if (!c) return;
  /* ใช้ขนาด layout (ไม่ถูกแอนิเมชันย่อ/ขยายของหน้าต่างรบกวน) */
  const w = c.offsetWidth, h = c.offsetHeight, dpr = window.devicePixelRatio || 1;
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1F2937';
  sig = { c, ctx, ink: false, drawing: false };
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
  c.onpointerdown = e => {
    e.preventDefault(); c.setPointerCapture?.(e.pointerId); sig.drawing = true;
    const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .1, y + .1); ctx.stroke();
    sig.ink = true; $('sigwrap').classList.add('inked');
  };
  c.onpointermove = e => { if (!sig.drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
  c.onpointerup = c.onpointercancel = () => { sig.drawing = false; };
}
function clearSig() { if (!sig) return; sig.ctx.clearRect(0, 0, sig.c.width, sig.c.height); sig.ink = false; $('sigwrap').classList.remove('inked'); }
async function submitSignOff(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser, name = $('sgName').value.trim();
  const err = !name ? 'กรุณากรอกชื่อผู้รับงาน' : !sig?.ink ? 'กรุณาเซ็นชื่อในกรอบ' : '';
  if (err) { $('sgErr').textContent = err; return; }
  if (!canSignOff(u, tk)) return;
  // server ตรวจว่าเป็นไฟล์ PNG จริง และบันทึกว่าเซ็นผ่านแอป (ลูกค้า) หรือหน้างาน (ช่าง)
  if (!await call(`/tickets/${id}/signoff`, { name, position: $('sgPos')?.value.trim() || '', signature: sig.c.toDataURL('image/png') }, 'sgErr')) return;
  renderAll();
  openRating(id, true);
}
let ratePick = 0;
function openRating(id, justSigned) {
  const tk = tickets.find(x => x.id === id);
  if (!tk || !canRate(currentUser, tk)) { if (justSigned) { closeModal(); toast('เซ็นรับงานแล้ว — ปิดงานเรียบร้อย'); } return; }
  ratePick = 0;
  openModal(`${justSigned ? `<div class="done"><div class="done-ic">${ic('check', 34, 3)}</div><h3>เซ็นรับงานเรียบร้อย</h3><p class="hint">งาน ${tk.id} ปิดแล้ว ขอบคุณที่ใช้บริการ</p></div>` : `<div class="mh"><h3>ให้คะแนนบริการ</h3>${xbtn()}</div>`}
    <div class="rate-box"><b>${currentUser.role === 'technician' ? 'ให้ลูกค้าให้คะแนนบริการ' : 'บริการครั้งนี้เป็นอย่างไร?'}</b>
      <div class="stars" role="radiogroup" aria-label="คะแนน">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" aria-label="${n} ดาว ${RATE_LABEL[n]}" onclick="pickRate(${n})">${ic('star', 40, 1.5)}</button>`).join('')}</div>
      <div class="rate-label" id="rateLabel">แตะดาวเพื่อให้คะแนน</div>
      <textarea id="rateCmt" rows="2" placeholder="อยากบอกอะไรเพิ่มเติม (ไม่บังคับ)" hidden aria-label="ความคิดเห็น"></textarea></div>
    <button class="btn primary block" id="rateSend" disabled onclick="submitRating('${id}')">ส่งคะแนน</button>
    <div class="row center"><button class="btn link" onclick="closeModal()">ไว้ทีหลัง</button><button class="btn link" onclick="openReport('${id}')">ดูใบรายงาน</button></div>`);
}
function pickRate(n) {
  ratePick = n;
  document.querySelectorAll('.stars button').forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-checked', i === n - 1); });
  $('rateLabel').textContent = RATE_LABEL[n]; $('rateCmt').hidden = false; $('rateSend').disabled = false;
}
async function submitRating(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser;
  if (!ratePick || !canRate(u, tk)) return;
  if (!await call(`/tickets/${id}/rating`, { score: ratePick, comment: $('rateCmt').value.trim() })) return;
  closeModal(); toast('ขอบคุณสำหรับคะแนน'); renderAll();
}
function openReject(id) {
  const tk = tickets.find(x => x.id === id);
  if (!canRejectWork(currentUser, tk)) return;
  openModal(`<div class="mh"><h3>งานยังไม่เรียบร้อย</h3>${xbtn()}</div>
    <p class="hint" style="margin:0">${tk.id} · ${esc(tk.subject)}<br>งานจะถูกส่งกลับให้ช่างดำเนินการต่อ</p>
    <label class="fl" for="reason">ปัญหาที่ยังพบ <em>*</em></label>
    ${voiceBox('reason', 'rows="3" placeholder="เช่น ยังพิมพ์ไม่ออกที่เครื่องชั้น 2"')}
    <div class="tools">${voiceBtn('reason', 'พูดแทนพิมพ์')}</div>
    <div class="err" id="reasonErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="submitReject('${id}')">ส่งกลับให้ช่าง</button></div>`);
  focusLater('reason');
}
async function submitReject(id) {
  const tk = tickets.find(x => x.id === id), u = currentUser, r = $('reason').value.trim();
  if (!r) { $('reasonErr').textContent = 'กรุณาระบุปัญหาที่ยังพบ'; return; }
  if (!canRejectWork(u, tk)) return;
  stopVoice();
  // server บันทึกประวัติและความเห็น "ยังไม่เรียบร้อย" ให้ช่างเห็น
  if (!await call(`/tickets/${id}/status`, { to: 'in_progress', reason: r }, 'reasonErr')) return;
  closeModal(); toast('ส่งกลับให้ช่างแล้ว'); renderAll();
}

/* ---------- มอบหมายงาน ---------- */
// ติดต่อทีมงาน: เลื่อนนัดงาน (ส่งเป็นความเห็นในงาน) หรือขอสร้างบัญชี/เรื่องอื่น (เปิดเป็นงานใหม่ให้ทีมติดตาม)
const CONTACT_LABEL = { reschedule: 'เลื่อนนัดงาน', account: 'ขอสร้างบัญชีพนักงาน', other: 'เรื่องอื่น ๆ' };
function openContact() {
  const open = tickets.filter(isOpen), today = new Date().toLocaleDateString('sv-SE');
  openModal(`<div class="mh"><h3>ติดต่อร้องขอ</h3>${xbtn()}</div>
    <div class="catpick">${Object.entries(CONTACT_LABEL).filter(([k]) => k !== 'reschedule' || open.length).map(([k, l], i) => `<label><input type="radio" name="ctype" value="${k}" ${i === 0 ? 'checked' : ''} onchange="document.getElementById('ctRs').hidden = this.value !== 'reschedule'"><span>${l}</span></label>`).join('')}</div>
    <div id="ctRs"><label class="fl">งานที่ต้องการเลื่อน <em>*</em><select id="ctTicket">${open.map(t => `<option value="${t.id}">${esc(t.subject)}</option>`).join('')}</select></label>
    <label class="fl">วันที่สะดวก <em>*</em><input id="ctDate" type="date" min="${today}"></label>
    <div class="two"><label class="fl">เริ่ม <em>*</em><input id="ctFrom" type="time" value="09:00"></label>
    <label class="fl">ถึง <em>*</em><input id="ctTo" type="time" value="12:00"></label></div></div>
    <label class="fl">รายละเอียด <em>*</em><textarea id="ctText" rows="3" maxlength="1000" placeholder="เช่น ขอเปิดบัญชีให้พนักงานชื่อ... อีเมล..."></textarea></label>
    <div class="err" id="ctErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveContact()">ส่ง</button></div>`);
  document.getElementById('ctRs').hidden = true;
}
async function saveContact() {
  const type = document.querySelector('input[name=ctype]:checked')?.value, text = $('ctText').value.trim();
  if (!text) { $('ctErr').textContent = 'กรุณากรอกรายละเอียด'; return; }
  if (type === 'reschedule') {
    const date = $('ctDate').value, from = $('ctFrom').value, to = $('ctTo').value, id = $('ctTicket').value;
    if (!id) { $('ctErr').textContent = 'ไม่มีงานที่เลื่อนได้'; return; }
    if (!date) { $('ctErr').textContent = 'กรุณาเลือกวันที่'; return; }
    if (!from || !to || from >= to) { $('ctErr').textContent = 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม'; return; }
    if (!await call(`/tickets/${id}/comments`, { text: `ขอเลื่อนนัดเป็น ${date} ${from}–${to} — ${text}`, vis: 'public' }, 'ctErr')) return;
    closeModal(); toast('ส่งคำขอเลื่อนนัดแล้ว ทีมงานจะยืนยันให้'); renderAll(); return;
  }
  const d = await call('/tickets', { type: 'service', desc: `${CONTACT_LABEL[type]}: ${text}`, urgent: false, siteId: currentUser.siteId || '', category: 'other' }, 'ctErr');
  if (!d) return;
  closeModal(); toast(`ส่งเรื่องแล้ว เลขงาน ${d.id} ทีมงานจะติดต่อกลับ`); renderAll();
}
// ลูกค้าขอเลื่อนนัด: ส่งเป็นความเห็นในงาน ทีมงานเห็นแล้ววางแผนใหม่ในปฏิทิน
function openReschedulePick() {
  const open = tickets.filter(isOpen);
  if (!open.length) return toast('ไม่มีงานที่เลื่อนนัดได้ในตอนนี้');
  openModal(`<div class="mh"><h3>เลื่อนนัดงานไหน?</h3>${xbtn()}</div>
    <div class="opts">${open.map(t => `<button class="btn block" onclick="openReschedule('${t.id}')">${esc(t.subject)}</button>`).join('')}</div>`);
}
function openReschedule(id) {
  const tk = tickets.find(x => x.id === id);
  if (!tk || !isOpen(tk)) return;
  openModal(`<div class="mh"><h3>ขอเลื่อนนัด ${tk.id}</h3>${xbtn()}</div>
    <p class="hint" style="margin:0 0 8px">${esc(tk.subject)}</p>
    <label class="fl">วันที่สะดวก <em>*</em><input id="rsDate" type="date" min="${new Date().toLocaleDateString('sv-SE')}"></label>
    <div class="two"><label class="fl">เริ่ม <em>*</em><input id="rsFrom" type="time" value="09:00"></label>
    <label class="fl">ถึง <em>*</em><input id="rsTo" type="time" value="12:00"></label></div>
    <label class="fl">เหตุผล (ไม่บังคับ)<input id="rsWhy" maxlength="200" placeholder="เช่น ไม่มีคนรับเรื่องในช่วงนั้น"></label>
    <div class="err" id="rsErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveReschedule('${tk.id}')">ส่งคำขอ</button></div>`);
}
async function saveReschedule(id) {
  const date = $('rsDate').value, from = $('rsFrom').value, to = $('rsTo').value, why = $('rsWhy').value.trim();
  const err = !date ? 'กรุณาเลือกวันที่' : !from || !to || from >= to ? 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม' : '';
  if (err) { $('rsErr').textContent = err; return; }
  const text = `ขอเลื่อนนัดเป็น ${date} ${from}–${to}${why ? ' — ' + why : ''}`;
  if (!await call(`/tickets/${id}/comments`, { text, vis: 'public' }, 'rsErr')) return;
  closeModal(); toast('ส่งคำขอเลื่อนนัดแล้ว ทีมงานจะยืนยันให้'); renderAll();
}
// วางแผนงานในปฏิทิน: วันที่ + ช่วงเวลา · ปล่อยวันที่ว่างเพื่อล้างแผน
function openPlan(id) {
  const tk = tickets.find(x => x.id === id);
  if (!isManager(currentUser) || !tk) return;
  openModal(`<div class="mh"><h3>วางแผน ${tk.id}</h3>${xbtn()}</div>
    <p class="hint" style="margin:0 0 8px">${esc(tk.subject)}</p>
    <label class="fl">วันที่ <em>*</em><input id="plDate" type="date" value="${tk.plan?.date || ''}"></label>
    <div class="two"><label class="fl">เริ่ม <em>*</em><input id="plFrom" type="time" value="${tk.plan?.from || '09:00'}"></label>
    <label class="fl">ถึง <em>*</em><input id="plTo" type="time" value="${tk.plan?.to || '12:00'}"></label></div>
    <div class="err" id="plErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button>${tk.plan ? `<button class="btn ghost-red" onclick="savePlan('${tk.id}', true)">ล้างแผน</button>` : ''}<button class="btn primary" onclick="savePlan('${tk.id}')">บันทึก</button></div>`);
}
async function savePlan(id, clear = false) {
  const body = clear ? { date: '' } : { date: $('plDate').value, from: $('plFrom').value, to: $('plTo').value };
  if (!clear && !body.date) { $('plErr').textContent = 'กรุณาเลือกวันที่'; return; }
  if (!await call(`/tickets/${id}/schedule`, body, 'plErr')) return;
  closeModal(); toast(clear ? 'ล้างแผนแล้ว' : 'บันทึกแผนแล้ว'); renderAll();
}
function openAssign(id) {
  const tk = tickets.find(x => x.id === id);
  if (!canAssign(currentUser, tk)) return;
  /* แนะนำช่าง: ถนัดหมวดงานนี้ก่อน แล้วค่อยดูว่าใครว่างที่สุด */
  const cat = catOf(tk);
  const ranked = assignableTechs(currentUser).map(x => ({ ...x, load: techLoad(x.id), fit: (x.skills || []).includes(cat) }))
    .sort((a, b) => (b.fit - a.fit) || (a.load - b.load));
  openModal(`<div class="mh"><h3>มอบหมาย ${tk.id}</h3>${xbtn()}</div>
    <p class="hint" style="margin:0 0 12px">${esc(tk.subject)} · <span class="prio-${tk.priority}">${PRIORITY_LABEL[tk.priority]}</span> · ${CATEGORIES[cat].label}<br>${esc(custName(tk.customer))} · ${esc(siteLabel(tk))}</p>
    <div class="opts">${ranked.map((x, i) => `<label class="opt"><input type="radio" name="tech" value="${x.id}" ${(tk.assignee ? x.id === tk.assignee : i === 0) ? 'checked' : ''}>
      ${avatarHtml(x, 36)}<div><b>${esc(x.name)}</b>${i === 0 ? ' <span class="tagok">แนะนำ</span>' : ''}<small>${x.fit ? `ถนัด${CATEGORIES[cat].label} · ` : ''}${x.load ? `${x.load} งานเปิดอยู่` : 'ว่าง'}</small></div></label>`).join('') || empty('ยังไม่มีช่างในทีม', 'team')}</div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="confirmAssign('${id}')">มอบหมาย</button></div>`);
}
async function confirmAssign(id) {
  const tk = tickets.find(x => x.id === id), techId = document.querySelector('input[name=tech]:checked')?.value;
  if (!techId || !canAssign(currentUser, tk)) return;
  if (!await call(`/tickets/${id}/assign`, { assigneeId: techId })) return;
  notify([techId], `ได้รับมอบหมายงาน${tk.priority === 'urgent' ? ' · ด่วนมาก' : ''}`, `${tk.subject} — ${siteLabel(tk)}`, id);
  closeModal(); toast(`มอบหมาย ${id} ให้ ${nameOf(techId)} แล้ว`); renderAll();
}

/* ---------- แจ้งปัญหา (ลูกค้า): พิมพ์ / พูด / ถ่ายรูป — ช่องเดียวจบ ---------- */
let createType = 'service', createCat = '';
function openCreateCustomer(mode, cat = '') {
  const u = currentUser, sites = sitesFor(u, u.customer), cpl = mode === 'complaint';
  createType = cpl ? 'complaint' : 'service';
  createCat = cat;
  openModal(`<div class="mh"><h3>${cpl ? 'ร้องเรียน / ติชมบริการ' : 'แจ้งปัญหา'}</h3>${xbtn()}</div>
    ${cpl ? '' : `<div class="catpick">${Object.entries(CATEGORIES).map(([k, c]) => `<label><input type="radio" name="ccat" value="${k}" ${createCat === k ? 'checked' : ''} onchange="createCat=this.value"><span>${ic(c.icon, 18)}${c.label}</span></label>`).join('')}</div>`}
    <p class="lead-hint">${cpl ? 'เล่าสิ่งที่ไม่พอใจ — หัวหน้าทีมจะดูแลเรื่องนี้โดยตรง' : 'บอกเราสั้น ๆ ว่าเกิดอะไรขึ้น'}</p>
    ${voiceBox('fDesc', `rows="4" placeholder="${cpl ? 'เช่น ช่างมาช้ากว่านัด ไม่มีใครโทรแจ้ง' : 'เช่น เครื่องพิมพ์ชั้น 2 พิมพ์ไม่ออก'}" oninput="draft.desc=this.value" aria-label="${cpl ? 'เรื่องที่ร้องเรียน' : 'ปัญหาที่พบ'}"`, draft.desc)}
    <div class="tools big">${voiceBtn('fDesc', 'พูดแทนพิมพ์')}${photoBtn('create', 'ถ่าย / แนบรูป')}</div>
    ${thumbsBox('create')}
    ${sites.length > 1 ? `<label class="fl">ที่ไหน?<select id="fSite" onchange="draft.site=this.value">${sites.map(s => `<option value="${s.id}" ${(draft.site || u.siteId) === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
    ${cpl ? '' : `<label class="urgent-toggle"><input type="checkbox" id="fUrgent" ${draft.urgent ? 'checked' : ''} onchange="draft.urgent=this.checked"><span><b>ด่วน</b><small>ใช้งานไม่ได้เลย / กระทบหลายคน</small></span></label>`}
    <div class="err" id="fErr" role="alert"></div>
    <button class="btn primary block" onclick="submitCreateCustomer()">${ic('send', 18, 2.2)}ส่งเรื่อง</button>`);
  /* ทางลัดจากหน้าแรก: เริ่มฟังเสียง หรือเปิดกล้องทันที (ยังอยู่ในจังหวะที่ผู้ใช้แตะ) */
  if (mode === 'voice' && SR) toggleVoice('fDesc');
  if (mode === 'photo') $('file-create')?.click();
}
async function submitCreateCustomer() {
  const u = currentUser, desc = $('fDesc').value.trim(), sites = sitesFor(u, u.customer);
  if (!desc && !pending.create.length) { $('fErr').textContent = 'กรุณาพิมพ์ พูด หรือแนบรูปปัญหาที่พบ'; $('fDesc').focus(); return; }
  stopVoice();
  const siteId = sites.some(s => s.id === $('fSite')?.value) ? $('fSite').value : sites[0]?.id;
  const urgent = !!$('fUrgent')?.checked, cpl = createType === 'complaint';
  // server ตั้งหัวข้อจากบรรทัดแรก ความสำคัญ และเลขงานให้
  const d = await call('/tickets', { type: createType, desc, urgent, siteId, category: createCat || guessCategory(desc), photos: pending.create.map(p => PHOTOS[p]) }, 'fErr');
  if (!d) return;
  clearPending('create');
  const id = d.id, subject = tickets.find(x => x.id === id)?.subject || desc || 'แจ้งปัญหาพร้อมรูปภาพ';
  draft = { desc: '', urgent: false, site: '' };
  notify(dispatchers(), cpl ? 'เรื่องร้องเรียนใหม่' : `งานใหม่${urgent ? ' · ด่วนมาก' : ''}`, `${subject} — ${custName(u.customer)}`, id);
  renderAll();
  openModal(`<div class="done"><div class="done-ic">${ic('check', 34, 3)}</div><h3>ส่งเรื่องเรียบร้อย</h3><p>เลขที่งาน <b class="mono">${id}</b></p></div>
    <ol class="next-steps"><li class="on"><i>${ic('check', 14, 3)}</i>เราได้รับเรื่องแล้ว</li><li><i>2</i>ทีมงานจะจัดช่างและติดต่อกลับ</li><li><i>3</i>ติดตามได้ที่ "งานของฉัน" — เราจะแจ้งเมื่อช่างออกเดินทาง</li></ol>
    <button class="btn primary block" onclick="closeModal();openTicket('${id}')">ดูสถานะงาน</button>
    <div class="row center"><button class="btn link" onclick="closeModal()">กลับหน้าหลัก</button></div>`);
}

/* ---------- สร้างงาน (ทีมงาน) ---------- */
const URGENCY_HELP = { low: 'ไม่เร่งด่วน', medium: 'ใช้งานได้บางส่วน', high: 'กระทบงานหลายคน', urgent: 'ใช้งานไม่ได้ทั้งหมด' };
const siteOptions = cid => sitesFor(currentUser, cid).map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
function openCreate(mode = '', cat = '') {
  const u = currentUser;
  if (!canCreateTicket(u)) return;
  if (u.role === 'customer') return openCreateCustomer(mode, cat);
  const firstCust = Object.keys(customers)[0];
  openModal(`<div class="mh"><h3>สร้างงานใหม่</h3>${xbtn()}</div>
    <div class="fl">ประเภท <em>*</em><div class="catpick">${Object.entries(CATEGORIES).map(([k, c]) =>
      `<label><input type="radio" name="cat" value="${k}"><span>${ic(c.icon, 18)}${c.label}</span></label>`).join('')}</div></div>
    <label class="fl">หัวข้อ <em>*</em><input id="fSubj" placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด"></label>
    <label class="fl">ลูกค้า / พาร์ทเนอร์ <em>*</em><select id="fCust" onchange="$('fSite').innerHTML=siteOptions(this.value)">${Object.values(customers).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>
    <div class="two"><label class="fl">สถานที่ <em>*</em><select id="fSite">${siteOptions(firstCust)}</select></label>
    <label class="fl">ชั้น / ห้อง / จุด<input id="fLoc" placeholder="เช่น ชั้น 2 ห้องบัญชี"></label></div>
    <div class="fl">ความสำคัญ<div class="urg">${['low', 'medium', 'high', 'urgent'].map(p =>
      `<label class="u-${p}"><input type="radio" name="prio" value="${p}" ${p === 'medium' ? 'checked' : ''}><span><b>${PRIORITY_LABEL[p]}</b><small>${URGENCY_HELP[p]}</small></span></label>`).join('')}</div></div>
    <label class="fl" for="fDesc">รายละเอียด</label>
    ${voiceBox('fDesc', 'rows="3" placeholder="อาการที่พบ เกิดตั้งแต่เมื่อไร"')}
    <div class="tools">${voiceBtn('fDesc', 'พูด')}${photoBtn('create', 'แนบรูป')}</div>
    ${thumbsBox('create')}
    <div class="err" id="fErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="submitCreate()">สร้างงาน</button></div>`);
}
async function submitCreate() {
  const u = currentUser, cat = document.querySelector('input[name=cat]:checked')?.value, subj = $('fSubj').value.trim();
  const customer = $('fCust').value, siteId = $('fSite').value;
  const err = !cat ? 'กรุณาเลือกประเภทปัญหา' : !subj ? 'กรุณากรอกหัวข้อ' : !sitesFor(u, customer).some(s => s.id === siteId) ? 'กรุณาเลือกสถานที่' : '';
  if (err) { $('fErr').textContent = err; return; }
  stopVoice();
  const d = await call('/tickets', { customerId: customer, siteId, location: $('fLoc').value.trim(), subject: subj, category: cat,
    priority: document.querySelector('input[name=prio]:checked').value, desc: $('fDesc').value.trim(), photos: pending.create.map(p => PHOTOS[p]) }, 'fErr');
  if (!d) return;
  clearPending('create');
  notify(dispatchers().filter(x => x !== u.id), 'งานใหม่', `${subj} — ${custName(customer)}`, d.id);
  closeModal(); toast(`สร้างงาน ${d.id} แล้ว`);
  renderAll(); openTicket(d.id);
}

async function addComment(id) {
  const text = $('newCmt').value.trim();
  const vis = currentUser.role === 'customer' ? 'public' : cmtVis;
  if ((!text && !pending.cmt.length) || !canComment(currentUser, vis)) return;
  stopVoice();
  if (!await call(`/tickets/${id}/comments`, { text, vis, photos: pending.cmt.map(p => PHOTOS[p]) })) return;
  clearPending('cmt'); cmtDraft = '';
  toast(vis === 'internal' ? 'บันทึกภายในแล้ว' : 'ส่งข้อความแล้ว'); renderAll();
}
async function addWorklog(id) {
  const tk = tickets.find(x => x.id === id), text = $('newWl').value.trim();
  if ((!text && !pending.wl.length) || !canAddWorklog(currentUser, tk)) return;
  if (!await call(`/tickets/${id}/worklog`, { text, photos: pending.wl.map(p => PHOTOS[p]) })) return;
  clearPending('wl');
  toast('บันทึกการทำงานแล้ว'); renderAll();
}

/* ---------- Modal ---------- */
let modalReturn = null;
function openModal(html) {
  stopVoice();
  if (!$('modal').classList.contains('open')) modalReturn = document.activeElement;
  $('modalCard').innerHTML = html; $('modal').classList.add('open'); $('modal').setAttribute('aria-hidden', 'false'); $('modalCard').scrollTop = 0;
  $('modalCard').setAttribute('aria-label', $('modalCard').querySelector('h3')?.textContent || 'หน้าต่าง');
  /* ย้ายโฟกัสเข้าหน้าต่างให้ผู้ใช้คีย์บอร์ด/โปรแกรมอ่านจอ — ใช้ปุ่มปิด เพื่อไม่ให้คีย์บอร์ดมือถือเด้ง */
  ($('modalCard').querySelector('.xbtn') || $('modalCard').querySelector('button'))?.focus({ preventScroll: true });
  syncHistory();
}
function closeModal() {
  stopVoice(); $('modal').classList.remove('open'); $('modal').setAttribute('aria-hidden', 'true'); syncHistory();
  if (modalReturn?.isConnected) modalReturn.focus({ preventScroll: true }); modalReturn = null;
}
/* โฟกัสช่องแรกเฉพาะบนคอมพิวเตอร์ — บนมือถือไม่เด้งคีย์บอร์ดบังฟอร์ม */
function focusLater(id) { if (matchMedia('(pointer:fine)').matches) setTimeout(() => $(id)?.focus(), 60); }

/* ---------- เอกสาร (ใบรายงาน / รายงานสรุป) — พิมพ์หรือบันทึกเป็น PDF ได้ ---------- */
function openDoc(title, html, extra = '') {
  $('doc').innerHTML = `<div class="doc-bar"><button class="ibtn" onclick="closeDoc()" aria-label="กลับ">${ic('back', 22, 2)}</button><b>${esc(title)}</b><span class="sp"></span>${extra}
    <button class="btn primary sm" onclick="window.print()">${ic('print', 16, 2)}พิมพ์ / PDF</button></div>
    <div class="doc-scroll"><article class="paper">${html}</article></div>`;
  $('doc').classList.add('open'); $('doc').setAttribute('aria-hidden', 'false'); $('doc').querySelector('.doc-scroll').scrollTop = 0;
  document.title = title; syncHistory();
}
function closeDoc() { $('doc').classList.remove('open'); $('doc').setAttribute('aria-hidden', 'true'); document.title = 'Guru IT Service Desk'; syncHistory(); }
const paperHead = (title, en, right) => `<header class="p-head"><img src="img/logo.png" class="p-logo" alt="Guru IT Solution Co., Ltd." width="150" height="44">
  <div class="p-title"><h1>${title}</h1><small>${en}</small>${right || ''}</div></header>`;

function openReport(id) {
  const tk = tickets.find(x => x.id === id);
  if (!tk || !canSeeReport(currentUser, tk)) return;
  const r = tk.report, s = siteOf(tk), so = r.signoff, st = signState(tk);
  const started = tk.history.filter(h => h.to === 'in_progress').at(-1)?.at;
  const html = paperHead('ใบรายงานการปฏิบัติงาน', 'Service Report', `<div class="p-no">เลขที่ <b>${r.no}</b></div><div class="p-no">วันที่ ${fmtD(r.at)}</div>`)
  + `<table class="p-grid">
      <tr><th>ลูกค้า</th><td colspan="3"><b>${esc(custName(tk.customer))}</b></td></tr>
      <tr><th>สถานที่</th><td colspan="3">${esc(s?.name || '-')}${tk.location ? ` · ${esc(tk.location)}` : ''}<br><small>${esc(s?.address || '')}</small></td></tr>
      <tr><th>ผู้ติดต่อ</th><td>${esc(s?.contact || '-')}</td><th>โทร</th><td>${esc(s?.phone || '-')}</td></tr>
      <tr><th>เลขที่งาน</th><td class="mono">${tk.id}</td><th>วันที่แจ้ง</th><td>${fmt(tk.history[0].at)}</td></tr>
      <tr><th>ประเภท</th><td>${(CATEGORIES[tk.category] || CATEGORIES.other).label}</td><th>ความสำคัญ</th><td>${PRIORITY_LABEL[tk.priority]}</td></tr>
      <tr><th>ปัญหาที่แจ้ง</th><td colspan="3">${esc(tk.subject)}</td></tr>
    </table>
    <h2>รายละเอียดการดำเนินงาน</h2><p class="p-text">${esc(r.summary)}</p>
    <table class="p-grid">
      <tr><th>อุปกรณ์ / อะไหล่ที่ใช้</th><td colspan="3">${esc(r.parts || '-')}</td></tr>
      <tr><th>ช่างผู้ปฏิบัติงาน</th><td>${esc(nameOf(r.by))}</td><th>เวลาที่ใช้</th><td>${hrs(r.hours)}</td></tr>
      <tr><th>เริ่มดำเนินการ</th><td>${started ? fmt(started) : '-'}</td><th>แล้วเสร็จ</th><td>${fmt(r.at)}</td></tr>
    </table>
    ${r.photos?.length ? `<h2>รูปภาพประกอบ</h2><div class="p-photos">${r.photos.filter(p => PHOTOS[p]).map(p => `<img src="${PHOTOS[p]}" alt="รูปหลังดำเนินการ">`).join('')}</div>` : ''}
    <div class="p-signs">
      <div class="p-sign"><div class="p-sigbox typed">${esc(nameOf(r.by))}</div><b>( ${esc(nameOf(r.by))} )</b><small>ผู้ปฏิบัติงาน · ${fmtD(r.at)}</small><small class="muted">ยืนยันตัวตนด้วยการเข้าสู่ระบบ</small></div>
      <div class="p-sign"><div class="p-sigbox">${so ? `<img src="${so.sig}" alt="ลายเซ็นผู้รับบริการ">` : `<span class="p-wait">${st === 'nosign' ? 'ปิดงานโดยไม่มีลายเซ็น' : 'รอลงนาม'}</span>`}</div>
        <b>( ${so ? esc(so.name) : '.................................'} )</b><small>ผู้รับบริการ${so?.position ? ' · ' + esc(so.position) : ''}${so ? ' · ' + fmtD(so.at) : ''}</small>
        ${so ? `<small class="muted">${so.via === 'onsite' ? 'ลงนามบนอุปกรณ์ของช่าง ณ หน้างาน' : 'ลงนามผ่านแอปของลูกค้า'} · ${fmtS(so.at)}</small>` : ''}</div>
    </div>
    ${st === 'nosign' ? `<div class="p-note">หมายเหตุ: ปิดงานโดยไม่มีลายเซ็นลูกค้า — ${esc(r.closedNoSign || '-')}</div>` : ''}
    <footer class="p-foot">เอกสารนี้สร้างจากระบบ Guru IT Service Desk · สถานะ: ${SIGN_LABEL[st]} · พิมพ์เมื่อ ${fmtS(new Date())}</footer>`;
  openDoc(`ใบรายงาน ${r.no}`, html);
}

/* ---------- รายงานสรุป (หัวหน้าทีม / ผู้ดูแล) ---------- */
const PERIODS = { 7: '7 วันล่าสุด', 30: '30 วันล่าสุด', 90: '90 วันล่าสุด', all: 'ทั้งหมด' };
function reportRows(f = rpt) {
  const since = f.period === 'all' ? 0 : Date.now() - (+f.period) * DAY * 1000;
  return visibleTickets(currentUser).filter(x => x.report && x.report.at.getTime() >= since && (f.partner === 'all' || x.customer === f.partner))
    .sort((a, b) => b.report.at - a.report.at);
}
function byPartner(rows) {
  const g = {};
  rows.forEach(x => { const p = g[x.customer] ||= { id: x.customer, n: 0, signed: 0, hours: 0, sites: new Set(), rows: [] };
    p.n++; p.hours += +x.report.hours || 0; p.sites.add(x.siteId); p.rows.push(x); if (x.report.signoff) p.signed++; });
  return Object.values(g).sort((a, b) => b.n - a.n);
}
function setRptView(v) { rpt.view = v; renderAll(); }
function renderReports() {
  const u = currentUser;
  const head = pageHead('รายงาน', rpt.view === 'audit' ? 'ทุกการกระทำถูกบันทึกและแก้ไขไม่ได้' : PERIODS[rpt.period],
    rpt.view === 'summary' ? ibtn('print', 'พิมพ์รายงานสรุป', 'openSummaryDoc()') + ibtn('download', 'ดาวน์โหลด CSV', 'downloadCsv()') : '');
  const tabs = canSeeAudit(u) ? `<div class="tbar">${textTabs([['summary', 'สรุปผลงาน'], ['audit', 'บันทึกตรวจสอบ']], rpt.view, 'setRptView')}</div>` : '';
  if (rpt.view === 'audit') return head + tabs + `<div class="card">${auditRows(auditLog.slice(0, 40))}</div>`;
  const rows = reportRows(), groups = byPartner(rows), avg = avgRating(rows);
  const tot = { n: rows.length, signed: rows.filter(x => x.report.signoff).length, waiting: rows.filter(x => x.status === 'resolved').length, hours: rows.reduce((s, x) => s + (+x.report.hours || 0), 0) };
  return head + tabs + `
  <div class="filters">
    <label><span>พาร์ทเนอร์</span><select onchange="rpt.partner=this.value;renderAll()"><option value="all">ทุกพาร์ทเนอร์</option>${Object.values(customers).map(c => `<option value="${c.id}" ${rpt.partner === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
    <label><span>ช่วงเวลา</span><select onchange="rpt.period=this.value;renderAll()">${Object.entries(PERIODS).map(([k, v]) => `<option value="${k}" ${rpt.period === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  </div>
  <div class="kpis">
    <div class="kpi"><b>${tot.n}</b><span>งานที่ทำเสร็จ</span></div>
    <div class="kpi"><b>${tot.signed}</b><span>เซ็นรับแล้ว</span></div>
    <div class="kpi"><b>${tot.waiting}</b><span>รอเซ็นรับ</span></div>
    <div class="kpi"><b>${num(tot.hours)}</b><span>ชั่วโมง</span></div>
    <div class="kpi"><b>${avg ? `★ ${num(avg)}` : '–'}</b><span>ความพึงพอใจ</span></div>
  </div>
  ${rpt.partner === 'all' && groups.length ? fold('r-partner', 'แยกตามพาร์ทเนอร์', `<div class="card">${groups.map(g => { const a = avgRating(g.rows);
    return `<button class="prow" onclick="rpt.partner='${g.id}';renderAll()">
      <i>${ic('building', 18)}</i><div><b>${esc(custName(g.id))}</b><small>${g.n} งาน · ${g.sites.size} สถานที่ · ${hrs(g.hours)}${a ? ` · ★ ${num(a)}` : ''}</small></div>
      <span class="sbadge s-signed">${g.signed}/${g.n} เซ็นแล้ว</span></button>`; }).join('')}</div>`, { count: groups.length, open: false }) : ''}
  ${fold('r-list', 'งานที่ทำเสร็จ', rows.length ? `<div class="card">${rows.map(x => `<div class="rrow">
      <div class="rr-main" onclick="openTicket('${x.id}')"><div class="rr-top"><span class="mono">${x.report.no}</span><span>${fmtD(x.report.at)}</span></div>
        <b>${esc(x.subject)}</b><small>${esc(custName(x.customer))} · ${esc(siteLabel(x))} · ${esc(nameOf(x.report.by))} · ${hrs(x.report.hours)}</small>${signBadge(x)} ${x.rating ? starsHtml(x.rating.score, 12) : ''}</div>
      <button class="ibtn" onclick="openReport('${x.id}')" aria-label="ดูใบรายงาน ${x.report.no}" title="ดูใบรายงาน">${ic('doc', 20, 1.8)}</button></div>`).join('')}</div>` : empty('ยังไม่มีงานที่ทำเสร็จในช่วงนี้', 'doc'), { count: rows.length })}`;
}
function openSummaryDoc() {
  if (!canSeeSummaryReport(currentUser)) return;
  const rows = reportRows(), groups = byPartner(rows), p = rpt.partner === 'all' ? null : customers[rpt.partner];
  const totalH = rows.reduce((s, x) => s + (+x.report.hours || 0), 0), signed = rows.filter(x => x.report.signoff).length, avg = avgRating(rows);
  const html = paperHead('รายงานสรุปผลการให้บริการ', 'Service Summary Report', `<div class="p-no">${PERIODS[rpt.period]}</div><div class="p-no">ออกเมื่อ ${fmtD(new Date())}</div>`)
  + `<table class="p-grid"><tr><th>ลูกค้า</th><td colspan="3"><b>${p ? esc(p.name) : 'ทุกพาร์ทเนอร์'}</b>${p ? ` · ${CONTRACT_LABEL[p.contract] || ''}` : ''}</td></tr>
      <tr><th>งานที่ทำเสร็จ</th><td>${rows.length} งาน</td><th>ชั่วโมงทำงานรวม</th><td>${hrs(totalH)}</td></tr>
      <tr><th>ลูกค้าเซ็นรับแล้ว</th><td>${signed} งาน</td><th>ความพึงพอใจเฉลี่ย</th><td>${avg ? `${num(avg)} / 5` : '-'}</td></tr></table>
  ${!p && groups.length ? `<h2>สรุปตามพาร์ทเนอร์</h2><table class="p-table"><thead><tr><th>พาร์ทเนอร์</th><th>สถานที่</th><th>งาน</th><th>เซ็นแล้ว</th><th>ชั่วโมง</th><th>คะแนน</th></tr></thead>
    <tbody>${groups.map(g => { const a = avgRating(g.rows); return `<tr><td>${esc(custName(g.id))}</td><td class="c">${g.sites.size}</td><td class="c">${g.n}</td><td class="c">${g.signed}</td><td class="c">${num(g.hours)}</td><td class="c">${a ? num(a) : '-'}</td></tr>`; }).join('')}</tbody></table>` : ''}
  <h2>รายละเอียดงาน</h2>
  <table class="p-table"><thead><tr><th>#</th><th>วันที่</th><th>เลขที่รายงาน</th>${p ? '' : '<th>ลูกค้า</th>'}<th>สถานที่</th><th>งาน / ผลการดำเนินงาน</th><th>ช่าง</th><th>ชม.</th><th>ลงนาม</th><th>คะแนน</th></tr></thead>
    <tbody>${rows.map((x, i) => `<tr><td class="c">${i + 1}</td><td>${fmtD(x.report.at)}</td><td class="mono">${x.report.no}<br><small>${x.id}</small></td>${p ? '' : `<td>${esc(custName(x.customer))}</td>`}
      <td>${esc(siteLabel(x))}</td><td><b>${esc(x.subject)}</b><br><small>${esc(x.report.summary)}</small></td><td>${esc(nameOf(x.report.by))}</td><td class="c">${x.report.hours}</td>
      <td>${x.report.signoff ? `✓ ${esc(x.report.signoff.name)}` : SIGN_LABEL[signState(x)]}</td><td class="c">${x.rating ? `${x.rating.score}/5` : '-'}</td></tr>`).join('') || `<tr><td colspan="10" class="c">ไม่มีข้อมูลในช่วงนี้</td></tr>`}</tbody></table>
  <footer class="p-foot">เอกสารนี้สร้างจากระบบ Guru IT Service Desk · ใบรายงานแต่ละฉบับพร้อมลายเซ็นลูกค้าเปิดดูได้ในระบบ · พิมพ์เมื่อ ${fmtS(new Date())}</footer>`;
  openDoc('รายงานสรุปผลการให้บริการ', html, `<button class="btn sm" onclick="downloadCsv()">${ic('download', 15, 2)}CSV</button>`);
}
function downloadCsv() {
  if (!canSeeSummaryReport(currentUser)) return;
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['เลขที่รายงาน', 'เลขที่งาน', 'วันที่เสร็จ', 'ลูกค้า', 'สถานที่', 'ที่อยู่', 'หัวข้อ', 'สรุปงาน', 'อุปกรณ์/อะไหล่', 'ช่าง', 'ชั่วโมง', 'สถานะลงนาม', 'ผู้ลงนาม', 'วันที่ลงนาม', 'คะแนน (1-5)', 'ความคิดเห็นลูกค้า'];
  const lines = reportRows().map(x => { const r = x.report, so = r.signoff;
    return [r.no, x.id, fmt(r.at), custName(x.customer), siteLabel(x), siteOf(x)?.address, x.subject, r.summary, r.parts, nameOf(r.by), r.hours, SIGN_LABEL[signState(x)], so?.name, so ? fmt(so.at) : '', x.rating?.score, x.rating?.comment].map(q).join(','); });
  const blob = new Blob(['﻿' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `service-report-${rpt.partner}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('ดาวน์โหลด CSV แล้ว (เปิดด้วย Excel ได้)');
}

/* ---------- พาร์ทเนอร์ & สถานที่ ---------- */
const openCount = cid => tickets.filter(t => t.customer === cid && isOpen(t)).length;
function partnerMatches(c) {
  const q = pquery.trim().toLowerCase();
  return (pfilter === 'all' || c.contract === pfilter) && (!q || [c.name, c.contact, ...c.sites.flatMap(s => [s.name, s.address])].some(v => String(v || '').toLowerCase().includes(q)));
}
function partnerListHtml() {
  const arr = Object.values(customers).filter(partnerMatches);
  if (!arr.length) return empty('ไม่พบพาร์ทเนอร์ที่ตรงเงื่อนไข', 'search');
  return `<div class="list ${dense ? 'dense' : ''}">${arr.map(c => dense
    ? `<div class="trow" onclick="openPartner('${c.id}')" role="button" tabindex="0"><span class="sdot ${openCount(c.id) ? 'd-in_progress' : 'd-closed'}"></span><div class="tr-m"><b>${esc(c.name)}</b><small>${c.sites.length} สถานที่${openCount(c.id) ? ` · ${openCount(c.id)} งานเปิด` : ''}</small></div>${ic('right', 16, 2)}</div>`
    : `<div class="tcard" onclick="openPartner('${c.id}')" role="button" tabindex="0">
      <div class="tc-h"><i class="tc-ic">${ic('building', 20, 1.8)}</i><div class="tc-t"><b>${esc(c.name)}</b><small>${c.sites.map(s => esc(s.name)).join(' · ')}</small></div></div>
      <div class="tc-f"><span class="tag">${CONTRACT_LABEL[c.contract] || '-'}</span><span class="tag">${ic('pin', 13, 2)}${c.sites.length} สถานที่</span>${openCount(c.id) ? `<span class="pill p-in_progress">${openCount(c.id)} งานเปิด</span>` : ''}</div></div>`).join('')}</div>`;
}
function setPFilter(k) { pfilter = k; renderAll(); }
function togglePSearch() { showSearch = !showSearch; if (!showSearch) pquery = ''; renderAll(); if (showSearch) setTimeout(() => $('pq')?.focus(), 30); }
function renderPartners() {
  const u = currentUser, all = Object.values(customers);
  return pageHead('พาร์ทเนอร์', `ดูแลอยู่ ${allSites().length} สถานที่ จาก ${all.length} พาร์ทเนอร์`,
    ibtn('search', 'ค้นหา', 'togglePSearch()', showSearch) + (canManagePartners(u) ? ibtn('plus', 'เพิ่มพาร์ทเนอร์', 'openPartnerForm()') : ''))
  + (showSearch ? `<div class="searchbox">${ic('search', 18)}<input id="pq" type="search" placeholder="ค้นหาชื่อ สถานที่ หรือที่อยู่…" value="${esc(pquery)}" oninput="pquery=this.value;$('plist').innerHTML=partnerListHtml()" aria-label="ค้นหาพาร์ทเนอร์"></div>` : '')
  + `<div class="tbar">${textTabs([['all', 'ทั้งหมด', all.length], ...Object.entries(CONTRACT_LABEL).map(([k, l]) => [k, l.replace(/\s*\(.*\)/, ''), all.filter(c => c.contract === k).length])], pfilter, 'setPFilter')}<span class="sp"></span>${densityBtn()}</div>
  <div id="plist">${partnerListHtml()}</div>`;
}
function partnerSheet(id) {
  const c = customers[id], u = currentUser;
  if (!c || !canSeePartners(u)) return [id, empty('ไม่พบข้อมูล', 'search')];
  const tks = tickets.filter(t => t.customer === id).sort(byPriority);
  const done = tks.filter(t => t.report), manage = canManagePartners(u), avg = avgRating(tks);
  const siteCards = c.sites.map(s => { const n = tks.filter(t => t.siteId === s.id && isOpen(t)).length;
    return `<div class="card site">
      <div class="site-head"><i>${ic('pin', 18, 2)}</i><b>${esc(s.name)}</b>${n ? `<span class="pill p-in_progress">${n} งานเปิด</span>` : ''}</div>
      <p class="addr">${esc(s.address)}</p>
      ${s.contact || s.phone ? `<div class="hint">ผู้ติดต่อ: ${esc(s.contact || '-')}${s.phone ? ` · <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : ''}</div>` : ''}
      <div class="row"><a class="btn sm" href="${mapUrl(s.address)}" target="_blank" rel="noopener">${ic('pin', 15, 2)}เปิดแผนที่</a>
        ${manage ? `<button class="btn sm" onclick="openSiteForm('${id}','${s.id}')">${ic('pen', 15, 2)}แก้ไข</button>` : ''}</div></div>`; }).join('');
  return [c.name, `<div class="card">
      <div class="badges"><span class="tag">${CONTRACT_LABEL[c.contract] || '-'}</span><span class="sp"></span>${manage ? `<button class="btn sm" onclick="openPartnerForm('${id}')">${ic('pen', 15, 2)}แก้ไข</button>` : ''}</div>
      <h3 class="tk-title">${esc(c.name)}</h3>
      <dl class="facts"><dt>ผู้ติดต่อหลัก</dt><dd>${esc(c.contact || '-')}</dd>
        <dt>โทร</dt><dd>${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '-'}</dd>
        <dt>อีเมล</dt><dd>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '-'}</dd></dl>
    </div>
    <div class="kpis in-sheet">
      <div class="kpi"><b>${c.sites.length}</b><span>สถานที่</span></div>
      <div class="kpi"><b>${openCount(id)}</b><span>งานเปิด</span></div>
      <div class="kpi"><b>${done.length}</b><span>งานเสร็จ</span></div>
      <div class="kpi"><b>${avg ? `★ ${num(avg)}` : '–'}</b><span>ความพึงพอใจ</span></div>
    </div>
    <button class="mcard" onclick="rpt.partner='${id}';rpt.view='summary';goTab('reports')"><i>${ic('chart', 22)}</i><div><b>รายงานผลงานของพาร์ทเนอร์นี้</b><small>สรุปงานที่ทำ พร้อมพิมพ์ส่งลูกค้า</small></div>${ic('right', 18, 2)}</button>
    ${fold('p-sites', 'สถานที่ที่ดูแล', siteCards || empty('ยังไม่มีสถานที่', 'pin'), { count: c.sites.length, extra: manage ? `<button class="ibtn" onclick="openSiteForm('${id}')" title="เพิ่มสถานที่" aria-label="เพิ่มสถานที่">${ic('plus', 20, 2)}</button>` : '' })}
    ${fold('p-tickets', 'งานล่าสุด', tks.length ? list(tks.slice(0, 6)) : empty('ยังไม่มีงาน', 'list'), { count: tks.length, open: false })}`];
}
function openPartnerForm(id) {
  if (!canManagePartners(currentUser)) return;
  const c = id ? customers[id] : null;
  openModal(`<div class="mh"><h3>${c ? 'แก้ไขพาร์ทเนอร์' : 'เพิ่มพาร์ทเนอร์'}</h3>${xbtn()}</div>
    <label class="fl">ชื่อบริษัท / องค์กร <em>*</em><input id="pName" value="${esc(c?.name || '')}" placeholder="เช่น บริษัท ตัวอย่าง จำกัด"></label>
    <label class="fl">รูปแบบสัญญา<select id="pContract">${Object.entries(CONTRACT_LABEL).map(([k, v]) => `<option value="${k}" ${c?.contract === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <div class="two"><label class="fl">ผู้ติดต่อหลัก<input id="pContact" value="${esc(c?.contact || '')}"></label>
    <label class="fl">โทร<input id="pPhone" type="tel" value="${esc(c?.phone || '')}"></label></div>
    <label class="fl">อีเมล<input id="pEmail" type="email" value="${esc(c?.email || '')}"></label>
    ${c && approverOf(id) ? '' : `<label class="fl">อีเมลตัวแทนบริษัท<input id="pRepEmail" type="email" inputmode="email" maxlength="100" placeholder="ผู้ติดต่อหลักใช้อีเมลนี้เข้าระบบ และอนุมัติพนักงาน"></label>
    <label class="fl">รหัสผ่านเริ่มต้นของตัวแทน<input id="pRepPw" type="password" autocomplete="new-password" maxlength="200" placeholder="อย่างน้อย 8 ตัว — ใส่เมื่อกรอกอีเมลตัวแทน"></label>`}
    ${c ? '' : `<div class="divider">สถานที่แรก</div>
    <label class="fl">ชื่อสถานที่ <em>*</em><input id="sName" placeholder="เช่น สำนักงานใหญ่"></label>
    <label class="fl">ที่อยู่ <em>*</em><textarea id="sAddr" rows="2" placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"></textarea></label>`}
    <div class="err" id="pErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="savePartner(${c ? `'${id}'` : ''})">บันทึก</button></div>`);
  focusLater('pName');
}
async function savePartner(id) {
  const u = currentUser; if (!canManagePartners(u)) return;
  const name = $('pName').value.trim();
  if (!name) { $('pErr').textContent = 'กรุณากรอกชื่อพาร์ทเนอร์'; return; }
  const data = { name, contract: $('pContract').value, contact: $('pContact').value.trim(), phone: $('pPhone').value.trim(), email: $('pEmail').value.trim() };
  /* ตัวแทนบริษัท = บัญชีลูกค้าคนแรกของบริษัท (approver) — server สร้างบัญชีพร้อมรหัสผ่านเริ่มต้น */
  const rep = normEmail($('pRepEmail')?.value), repPassword = $('pRepPw')?.value || '';
  const repErr = !rep ? '' : !data.contact ? 'กรุณากรอกชื่อผู้ติดต่อหลัก (ตัวแทนบริษัท)' : emailErr(rep) || pwErr(repPassword, true);
  if (repErr) { $('pErr').textContent = repErr; return; }
  const site = id ? undefined : { name: $('sName').value.trim(), address: $('sAddr').value.trim() };
  if (site && (!site.name || !site.address)) { $('pErr').textContent = 'กรุณากรอกชื่อและที่อยู่ของสถานที่แรก'; return; }
  const d = await call(id ? `/customers/${id}` : '/customers', { ...data, site, repEmail: rep, repPassword }, 'pErr');
  if (!d) return;
  closeModal(); toast(id ? 'บันทึกแล้ว' : rep ? `เพิ่ม ${name} แล้ว — ตัวแทนเข้าระบบด้วย ${rep}` : `เพิ่ม ${name} แล้ว`); renderAll();
  if (!id) openPartner(d.id);
}
function openSiteForm(cid, sid) {
  if (!canManagePartners(currentUser)) return;
  const s = sid ? customers[cid].sites.find(x => x.id === sid) : null;
  openModal(`<div class="mh"><h3>${s ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</h3>${xbtn()}</div>
    <p class="hint" style="margin:0">${esc(custName(cid))}</p>
    <label class="fl">ชื่อสถานที่ <em>*</em><input id="sName" value="${esc(s?.name || '')}" placeholder="เช่น สาขาบางนา"></label>
    <label class="fl">ที่อยู่ <em>*</em><textarea id="sAddr" rows="3" placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์">${esc(s?.address || '')}</textarea></label>
    <div class="two"><label class="fl">ผู้ติดต่อที่สถานที่<input id="sContact" value="${esc(s?.contact || '')}"></label>
    <label class="fl">โทร<input id="sPhone" type="tel" value="${esc(s?.phone || '')}"></label></div>
    <div class="err" id="sErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveSite('${cid}'${sid ? `,'${sid}'` : ''})">บันทึก</button></div>`);
  focusLater('sName');
}
async function saveSite(cid, sid) {
  const u = currentUser; if (!canManagePartners(u)) return;
  const data = { name: $('sName').value.trim(), address: $('sAddr').value.trim(), contact: $('sContact').value.trim(), phone: $('sPhone').value.trim() };
  if (!data.name || !data.address) { $('sErr').textContent = 'กรุณากรอกชื่อและที่อยู่'; return; }
  if (!await call(`/customers/${cid}/sites${sid ? `/${sid}` : ''}`, data, 'sErr')) return;
  closeModal(); toast('บันทึกสถานที่แล้ว'); renderAll();
}

/* ---------- ภารกิจภาคสนาม ---------- */
const MISSION_LABEL = { assigned: 'มอบหมายแล้ว', en_route: 'กำลังเดินทาง', arrived: 'ถึงหน้างาน', working: 'กำลังปฏิบัติงาน', completed: 'เสร็จสิ้น' };
const MISSION_FLOW = { assigned: 'en_route', en_route: 'arrived', arrived: 'working', working: 'completed' };
const MISSION_NEXT_LABEL = { assigned: 'ออกเดินทาง', en_route: 'ถึงหน้างานแล้ว', arrived: 'เริ่มปฏิบัติงาน', working: 'จบภารกิจ' };
function freshness(d) { const s = (Date.now() - d.getTime()) / 1000; return s < 30 ? 'fresh' : s < 120 ? 'stale' : 'lost'; }

function renderMission() {
  const u = currentUser;
  const ms = Object.values(missions).filter(m => canSeeTicket(u, tickets.find(t => t.id === m.ticketId)));
  return pageHead(u.role === 'technician' ? 'ภารกิจ' : 'ติดตามช่าง',
    u.role === 'technician' ? 'แชร์ตำแหน่งเฉพาะระหว่างภารกิจ · ลูกค้าเห็นแค่ "กำลังเดินทาง"' : 'เห็นตำแหน่งเฉพาะช่างในทีมของคุณ', '',
    {})
  + `<div class="list">${ms.map(missionCard).join('') || empty('ไม่มีภารกิจในขณะนี้', 'pin')}</div>`;
}
function missionCard(m) {
  const u = currentUser, see = canSeeLocation(u, m), next = MISSION_FLOW[m.status];
  const canAct = u.role === 'technician' && u.id === m.technician;
  const tk = tickets.find(t => t.id === m.ticketId);
  const order = ['assigned', 'en_route', 'arrived', 'working', 'completed'], idx = order.indexOf(m.status);
  const steps = `<div class="steps">${order.map((s, i) => `<div class="step ${i < idx || m.status === 'completed' ? 'done' : i === idx ? 'now' : ''}"><i></i>${MISSION_LABEL[s]}</div>`).join('')}</div>`;
  let body;
  if (!see) {
    body = `<div class="locked">${ic('lock', 20)}<div>ไม่แสดงตำแหน่ง — อยู่นอกขอบเขตสิทธิ์ของบทบาทนี้</div></div>`;
  } else {
    const fr = m.session ? freshness(m.session.lastAt) : null, [px, py] = mapXY(m, m.posLL);
    body = `<div class="mapwrap">
        <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="routeLine" d="M ${px} ${py} L 85 20" stroke-width="1.6" stroke-dasharray="3 2.5" fill="none" vector-effect="non-scaling-stroke"/></svg>
        <div class="pin-dest" style="left:85%;top:20%"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-6.5 8-12a8 8 0 10-16 0c0 5.5 8 12 8 12z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg></div>
        <div class="dot" id="gpsDot" style="left:${px}%;top:${py}%"></div></div>
      ${m.session ? `<div class="row" style="align-items:center;margin-top:8px"><span class="fresh f-${fr}">${fr === 'fresh' ? 'ตำแหน่งล่าสุด' : fr === 'stale' ? 'ล่าช้า' : 'ขาดการเชื่อมต่อ'}</span><span class="hint mono">${fmtS(m.session.lastAt)} · ±${m.session.acc}m</span></div>`
        : `<div class="hint" style="margin-top:8px">${canAct ? 'จะเริ่มแชร์ตำแหน่งเมื่อกด "ออกเดินทาง"' : 'ช่างยังไม่เริ่มแชร์ตำแหน่ง'} · แผนที่จำลอง</div>`}`;
  }
  const e = m.status === 'completed' ? null : eta(m);
  return `<div class="card">
    <h4>${ic('pin', 18)} ${esc(m.dest)} <span class="pill p-in_progress" style="margin-left:auto">${MISSION_LABEL[m.status]}</span></h4>
    ${e ? `<div class="eta" id="eta-${m.id}" aria-live="polite">${ic('nav', 20, 1.9)}<b>${etaText(e)}</b></div>` : ''}
    <div class="hint" style="margin-bottom:12px">ช่าง: ${esc(nameOf(m.technician))} · งาน <a class="lnk" onclick="openTicket('${m.ticketId}')">${m.ticketId}</a></div>
    ${fold('m-site', 'สถานที่', tk ? siteBox(tk, true) : '', { open: false })}
    ${fold('m-map', 'แผนที่', body)}${steps}
    ${canAct && next ? `<div class="row"><button class="btn primary block" onclick="missionTransition('${m.id}')">${MISSION_NEXT_LABEL[m.status]}</button></div>`
      : !canAct && next ? '<div class="hint" style="margin-top:10px">ช่างที่รับผิดชอบเป็นผู้อัปเดตขั้นตอน</div>' : ''}
  </div>`;
}
function missionTransition(id) {
  const m = missions[id], next = MISSION_FLOW[m.status];
  if (!next || currentUser.id !== m.technician) return;
  m.status = next; logAudit(currentUser, `ภารกิจ ${id}`, `→ ${MISSION_LABEL[next]}`);
  if (next === 'en_route') startGps(m);
  if (next === 'working' && !gpsTimer) startGps(m);
  if (next === 'completed') stopGps(m);
  toast(MISSION_LABEL[next]); renderAll();
}
function startGps(m) {
  m.session = { lastAt: new Date(), acc: Math.round(10 + Math.random() * 20) };
  logAudit(users[m.technician], 'เริ่มแชร์ตำแหน่ง', `ภารกิจ ${m.id} (จำลอง consent)`);
  clearInterval(gpsTimer);
  gpsTimer = setInterval(() => {
    if (m.status !== 'en_route' && m.status !== 'working') { clearInterval(gpsTimer); gpsTimer = null; return; }
    // shortcut: จำลองการเคลื่อนที่เข้าหาที่หมาย — ของจริงรับพิกัดจาก GPS มือถือช่างผ่าน server
    const s = siteById(m.siteId), k = m.status === 'en_route' ? .12 : 0;
    m.posLL = [m.posLL[0] + (s.lat - m.posLL[0]) * k, m.posLL[1] + (s.lng - m.posLL[1]) * k];
    m.session.lastAt = new Date(); m.session.acc = Math.round(10 + Math.random() * 20);
    const [x, y] = mapXY(m, m.posLL), dot = $('gpsDot'), ln = $('routeLine'), el = $(`eta-${m.id}`);
    if (dot) { dot.style.left = x + '%'; dot.style.top = y + '%'; }
    if (ln) ln.setAttribute('d', `M ${x} ${y} L 85 20`);
    if (el) el.querySelector('b').textContent = etaText(eta(m));
  }, 3000);
}
function stopGps(m) { clearInterval(gpsTimer); gpsTimer = null; logAudit(users[m.technician], 'สิ้นสุดการแชร์ตำแหน่ง', `ภารกิจ ${m.id}`); }

/* ---------- ผู้ใช้และสิทธิ์ (ผู้ดูแลระบบ) ---------- */
let userFilter = 'all';
function renderUsers() {
  const cell = v => v === 1 ? `<span class="yes">${ic('check', 16, 2.6)}</span>` : v === 0 ? '<span class="nope">–</span>' : `<small>${v}</small>`;
  const isTech = r => r === 'technician';
  const chips = [['all', 'ทั้งหมด'], ...ROLE_ORDER.map(r => [r, ROLE_LABEL[r]])];
  const list = Object.values(users).filter(x => !x.removed && (userFilter === 'all' || x.role === userFilter))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name, 'th'));
  const rows = list.map(x => `<div class="urow">${avatarHtml(x, 36)}<div style="flex:1;min-width:0"><b>${esc(x.name)}${x.approver ? ' <span class="role-chip">ตัวแทนบริษัท</span>' : ''}</b>
      <small>${ROLE_LABEL[x.role]}${x.customer ? ' · ' + esc(custName(x.customer)) : ''}${x.team ? ' · ทีม ' + esc(x.team) : ''}${x.email ? ' · ' + esc(x.email) : ''}</small></div>
      ${ibtn('pen', `แก้ไข ${esc(x.name)}`, isTech(x.role) ? `openTechForm('${x.id}')` : `openUserForm('${x.role}','${x.id}')`)}
      ${x.id === currentUser.id ? '' : ibtn('trash', `ลบ ${esc(x.name)}`, isTech(x.role) ? `removeTech('${x.id}')` : `removeUser('${x.id}')`)}</div>`).join('');
  return pageHead('ผู้ใช้และสิทธิ์', 'เฉพาะผู้ดูแลระบบ', ibtn('plus', 'เพิ่มผู้ใช้', 'openRolePick()'))
  + `<div class="tchips">${chips.map(([k, l]) => `<button class="${userFilter === k ? 'on' : ''}" onclick="userFilter='${k}';renderAll()">${l}</button>`).join('')}</div>`
  + `<div class="card">${rows || '<div class="hint">ยังไม่มี</div>'}</div>`
  + fold('u-matrix', 'ตารางสิทธิ์ตามบทบาท', `<div class="card tblwrap"><table class="matrix"><thead><tr><th></th>${ROLE_ORDER.map(r => `<th><span class="role-chip">${ROLE_LABEL[r]}</span></th>`).join('')}</tr></thead>
    <tbody>${PERMISSION_MATRIX.map(([p, v]) => `<tr><th>${p}</th>${ROLE_ORDER.map(r => `<td>${cell(v[r])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`, { open: false })
  + `<div class="note">${ic('lock', 18)}<div><b>ผู้ดูแลระบบไม่เห็นตำแหน่ง GPS ของช่าง</b>ข้อมูลตำแหน่งเปิดให้เฉพาะช่างเจ้าของภารกิจและหัวหน้าทีมของเขา เพื่อความเป็นส่วนตัว</div></div>`;
}
// เลือกบทบาทก่อนเพิ่มผู้ใช้ (ช่างใช้ฟอร์มช่าง ที่เหลือใช้ฟอร์มผู้ใช้)
function openRolePick() {
  openModal(`<div class="mh"><h3>เพิ่มผู้ใช้</h3>${xbtn()}</div>
    <div class="opts">${[['customer', 'ลูกค้า (พนักงานบริษัท)'], ['technician', 'ช่างเทคนิค'], ['team_leader', 'หัวหน้าทีม'], ['admin', 'ผู้ดูแลระบบ']].map(([r, l]) => `<button class="btn block" onclick="closeModal();${r === 'technician' ? 'openTechForm()' : `openUserForm('${r}')`}">${l}</button>`).join('')}</div>`);
}

/* เพิ่ม / แก้ไข ลูกค้า · หัวหน้าทีม · ผู้ดูแลระบบ (ช่างใช้ openTechForm) */
function openUserForm(role, id) {
  if (!canManageUsers(currentUser) || !ROLE_LABEL[role] || role === 'technician') return;
  const x = id ? users[id] : null, cs = Object.values(customers);
  if (role === 'customer' && !cs.length) return toast('เพิ่มพาร์ทเนอร์ก่อน แล้วจึงเพิ่มลูกค้าของบริษัทนั้น');
  openModal(`<div class="mh"><h3>${x ? 'แก้ไข' : 'เพิ่ม'}${ROLE_LABEL[role]}</h3>${xbtn()}</div>
    <label class="fl">ชื่อ <em>*</em><input id="usName" maxlength="60" value="${esc(x?.name || '')}"></label>
    ${emailField('usEmail', x?.email)}
    <label class="fl">เบอร์โทร <em>*</em><input id="usPhone" type="tel" inputmode="tel" maxlength="15" value="${esc(x?.phone || '')}"></label>
    ${pwField('usPw', !x)}
    ${role === 'customer' ? `<label class="fl">บริษัท <em>*</em><select id="usCust">${cs.map(c => `<option value="${c.id}" ${x?.customer === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
    <label style="display:flex;flex-direction:row;align-items:center;gap:10px;margin-top:12px"><input type="checkbox" id="usRep" style="width:20px;height:20px;padding:0" ${x?.approver ? 'checked' : ''}><span>ตัวแทนบริษัท<small>ชวนและอนุมัติพนักงานของบริษัทได้</small></span></label>` : ''}
    <div class="err" id="usErr" role="alert"></div>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="saveUser('${role}'${x ? `,'${id}'` : ''})">บันทึก</button></div>`);
  focusLater('usName');
}
async function saveUser(role, id) {
  const u = currentUser; if (!canManageUsers(u) || role === 'technician') return;
  const name = $('usName').value.trim(), email = normEmail($('usEmail').value), phone = $('usPhone').value.replace(/[\s-]/g, ''), pw = $('usPw').value;
  const cid = $('usCust')?.value;
  const err = !name ? 'กรุณากรอกชื่อ' : emailErr(email, id) || (!validPhone(phone) ? 'เบอร์โทรไม่ถูกต้อง' : phoneTaken(phone, id) ? 'เบอร์นี้มีในระบบแล้ว'
    : role === 'customer' && !customers[cid] ? 'กรุณาเลือกบริษัท' : pwErr(pw, !id));
  if (err) { $('usErr').textContent = err; return; }
  const data = { name, email, phone, role, ...(role === 'customer' ? { customer: cid, siteId: customers[cid].sites[0]?.id, approver: $('usRep').checked } : {}),
    ...(role === 'team_leader' ? { team: users[id]?.team || 'T1' } : {}) };
  if (!await call(id ? `/users/${id}` : '/users', { ...userBody({ ...users[id], ...data }), password: pw }, 'usErr')) return;
  closeModal(); toast(`บันทึก ${name} แล้ว — เข้าสู่ระบบด้วย ${email}`); renderAll();
}
/* ลบ = ปิดบัญชี (ประวัติงานยังอยู่) · ห้ามลบตัวเอง และต้องเหลือผู้ดูแลอย่างน้อย 1 คน */
const activeAdmins = () => Object.values(users).filter(x => x.role === 'admin' && !x.removed).length;
function removeUser(id) {
  const x = users[id]; if (!x || !canManageUsers(currentUser) || x.id === currentUser.id) return;
  if (x.role === 'admin' && activeAdmins() <= 1) return toast('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน');
  openModal(`<div class="mh"><h3>ลบ ${esc(x.name)}?</h3>${xbtn()}</div>
    <p class="hint" style="margin:0">${ROLE_LABEL[x.role]}คนนี้จะเข้าระบบไม่ได้อีก ประวัติงานเดิมยังอยู่ครบ</p>
    <div class="row end"><button class="btn" onclick="closeModal()">ยกเลิก</button><button class="btn primary" onclick="confirmRemoveUser('${id}')">ลบ</button></div>`);
}
async function confirmRemoveUser(id) {
  const x = users[id]; if (!x || !canManageUsers(currentUser) || x.id === currentUser.id || x.role === 'technician') return;
  if (x.role === 'admin' && activeAdmins() <= 1) return;
  if (!await call(`/users/${id}`, userBody({ ...x, removed: true }))) return;
  closeModal(); toast(`ลบ ${x.name} แล้ว`); renderAll();
}
const phoneTaken = (phone, exceptId) => Object.values(users).some(x => x.phone === phone && x.id !== exceptId && !x.removed);

/* ---------- บันทึกตรวจสอบ ---------- */
function auditRows(rows) {
  return rows.map(a => `<div class="auditline"><span class="role-dot rc-${a.role}" title="${ROLE_LABEL[a.role] || ''}"></span><div><b>${esc(a.actor)}</b> ${esc(a.action)} ${a.detail ? '<span>' + esc(a.detail) + '</span>' : ''}<br><small class="mono">${fmtS(a.at)}</small></div></div>`).join('') || '<div class="hint">ยังไม่มีเหตุการณ์</div>';
}

/* ---------- Render ---------- */
/* ---------- บันทึก / สำรอง / กู้คืนข้อมูล ---------- */
/* ทุกการแก้ไขจบด้วย renderAll() จึงบันทึกที่นี่ที่เดียว */
let saveWarned = false;
function persist() {
  if (saveDb()) { saveWarned = false; return; }
  if (!saveWarned) { saveWarned = true; toast('บันทึกไม่สำเร็จ: พื้นที่ในเครื่องเต็ม — สำรองข้อมูลแล้วลบรูปที่ไม่จำเป็น'); }
}
/* เปิดหลายแท็บ: แท็บอื่นบันทึกแล้ว → โหลดใหม่ กันแท็บเก่าเขียนทับข้อมูลใหม่ */
addEventListener('storage', e => { if (e.key === DB_KEY) location.reload(); });

/* ปุ่มเปลี่ยนภาษา/โหมดสี: อยู่ในแถบหัวของหน้า ไม่ลอยทับเนื้อหา */
function toolBtns() {
  return `<button type="button" class="ftool" onclick="toggleLang()" aria-label="${lang === 'en' ? 'ภาษาไทย' : 'Switch to English'}" title="${lang === 'en' ? 'ภาษาไทย' : 'English'}">${lang === 'en' ? 'ไทย' : 'EN'}</button>
    <button type="button" class="ftool" onclick="setTheme(theme === 'dark' ? 'light' : 'dark')" aria-label="${theme === 'dark' ? 'โหมดกลางวัน' : 'โหมดกลางคืน'}" title="${theme === 'dark' ? 'กลางวัน' : 'กลางคืน'}">${ic(theme === 'dark' ? 'sun' : 'moon', 20, 1.8)}</button>`;
}
function renderAll() {
  persist();
  const u = currentUser;
  $('tabbar').hidden = !!joinCid || !u;
  if (joinCid || !u) { $('shell').className = 'shell joining'; $('fab').hidden = true; $('screen').innerHTML = `<div class="page">${joinCid ? renderJoin() : renderLogin()}</div>`; return; }
  $('shell').className = `shell role-${u.role}`;
  renderTabbar();
  const home = { customer: homeCustomer, technician: homeTech, team_leader: homeLead, admin: homeAdmin }[u.role];
  const screens = { home: () => home(u), tickets: renderTickets, mission: renderMission, partners: renderPartners, reports: renderReports, users: renderUsers, me: renderMe, projects: renderProjects, team: renderTeam, history: renderHistory };
  $('screen').innerHTML = `<div class="page">${screens[tab]()}</div>`;
  renderFab();
  if (sheetStack.length) renderSheet();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTop();
  if (e.key === 'Enter' && (e.target.classList?.contains('tcard') || e.target.classList?.contains('trow'))) e.target.click();
});
applyTheme();
// เปิดหน้า: ถ้ายังมี session ที่ server ให้เข้าใช้งานต่อเลย ไม่งั้นแสดงหน้าเข้าสู่ระบบ
loadState().catch(() => {}).finally(() => {
  const jc = new URLSearchParams(location.search).get('join');
  if (jc && !currentUser) return pickJoin(jc);   // ลิงก์ชวนพนักงาน
  renderAll(); if (currentUser) setTimeout(deliverNotifs, 600);
});
