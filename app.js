const API_BASE = 'https://zunndev.my.id';

const form = document.getElementById('dl-form');
const urlInput = document.getElementById('url');
const btnSubmit = document.getElementById('btn-submit');
const btnMp3 = document.getElementById('btn-mp3');
const btnPaste = document.getElementById('btn-paste');
const btnLabel = document.getElementById('btn-label');
const resultBox = document.getElementById('result');
const errorBox = document.getElementById('error');

let lastPayload = null;

if (btnPaste) {
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) urlInput.value = text.trim();
    } catch {
      btnPaste.textContent = 'Blokir!';
      setTimeout(() => (btnPaste.textContent = '📋'), 1500);
    }
  });
}

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (/youtube\.com|youtu\.be/.test(host)) return 'yt';
    if (/instagram\.com|instagr\.am/.test(host)) return 'ig';
    if (/facebook\.com|fb\.watch/.test(host)) return 'fb';
    if (/tiktok\.com/.test(host)) return 'tt';
    if (/x\.com|twitter\.com/.test(host)) return 'x';
  } catch {}
  return 'download';
}

function fmtBytes(n) {
  if (!n) return '';
  const mb = n / 1024 / 1024;
  return mb > 1024 ? (mb / 1024).toFixed(1) + ' GB' : (mb >= 1 ? mb.toFixed(1) : Math.round(mb * 1024)) + (mb >= 1 ? ' MB' : ' KB');
}

function fmtTime(s) {
  if (!s) return '';
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

function render(data, audioOnly) {
  resultBox.classList.remove('hidden');
  errorBox.classList.add('hidden');
  document.getElementById('thumb').src = data.thumbnail || '';
  document.getElementById('title').textContent = data.title || 'Tanpa judul';
  document.getElementById('meta').textContent =
    [data.uploader, fmtTime(data.duration), data.platform].filter(Boolean).join(' • ');

  const links = document.getElementById('links');
  links.innerHTML = '';
  const items = audioOnly ? data.audio : data.formats;

  if (!items || !items.length) {
    links.innerHTML = '<p style="color:#8b93a7;font-size:0.85rem">Tidak ada format tersedia.</p>';
    return;
  }

  items.forEach(f => {
    const a = document.createElement('a');
    a.className = 'qbtn' + (audioOnly ? ' mp3' : '');
    a.href = f.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<div><div class="q">' + (audioOnly ? 'MP3' : (f.quality || 'Video')) + '</div>' +
      '<div class="s">' + [f.ext ? f.ext.toUpperCase() : '', fmtBytes(f.filesize)].filter(Boolean).join(' • ') + '</div></div>' +
      '<span class="ic">' + (audioOnly ? '🎵' : '⬇️') + '</span>';
    links.appendChild(a);
  });
}

function showError(msg) {
  errorBox.classList.remove('hidden');
  resultBox.classList.add('hidden');
  document.getElementById('error-text').textContent = msg;
}

function showLoading() {
  btnSubmit.disabled = true;
  btnLabel.innerHTML = '<span class="spinner"></span>';
  showError('Memproses link, mohon tunggu beberapa detik...');
}

async function fetchAndRender(endpoint, url, audioOnly) {
  showLoading();
  try {
    const res = await fetch(API_BASE + '/api/' + endpoint + '?url=' + encodeURIComponent(url));
    const body = await res.json();
    if (!res.ok || body.status !== 'success') {
      const e = body.error || {};
      throw new Error(e.message || 'Gagal memproses link.');
    }
    render(body.data, audioOnly);
    lastPayload = { endpoint, url, audioOnly };
  } catch (err) {
    showError(err.message);
  } finally {
    btnSubmit.disabled = false;
    btnLabel.textContent = 'Download';
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;
  fetchAndRender(detectPlatform(url), url, false);
});

btnMp3.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;
  fetchAndRender('mp3', url, true);
});
