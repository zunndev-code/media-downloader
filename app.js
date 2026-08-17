const API_BASE = 'https://mediaapi-99cc9.containers.snapdeploy.app';

const form = document.getElementById('dl-form');
const urlInput = document.getElementById('url');
const btnSubmit = document.getElementById('btn-submit');
const resultBox = document.getElementById('result');
const errorBox = document.getElementById('error');

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
  return mb > 1024 ? (mb / 1024).toFixed(1) + ' GB' : mb.toFixed(0) + ' MB';
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
  document.getElementById('title').textContent = data.title;
  document.getElementById('meta').textContent =
    [data.uploader, fmtTime(data.duration), data.platform].filter(Boolean).join(' • ');

  const links = document.getElementById('links');
  links.innerHTML = '';

  const items = audioOnly ? data.audio : data.formats;
  items.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'link';
    const label = audioOnly
      ? (i === 0 ? 'MP3 (kualitas terbaik)' : 'MP3 ' + (f.abr ? f.abr.toFixed(0) + ' kbps' : ''))
      : (i === 0 ? 'Video (kualitas terbaik)' : (f.height ? f.height + 'p' : '') + ' ' + (f.ext || ''));
    const size = fmtBytes(f.filesize || f.filesize_approx);
    div.innerHTML = '<span class="lbl">' + label + '</span><a href="' + f.url + '" target="_blank" rel="noopener">' + (size || 'Download') + '</a>';
    links.appendChild(div);
  });
}

function showError(msg) {
  errorBox.classList.remove('hidden');
  resultBox.classList.add('hidden');
  document.getElementById('error-text').textContent = msg;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  const type = e.submitter && e.submitter.dataset.type ? e.submitter.dataset.type : null;
  const endpoint = type || detectPlatform(url);

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Memproses...';
  showError('Memproses link, mohon tunggu...');
  errorBox.classList.remove('hidden');

  try {
    const res = await fetch(API_BASE + '/api/' + endpoint + '?url=' + encodeURIComponent(url));
    const body = await res.json();
    if (!res.ok || body.status !== 'success') {
      const e = body.error || {};
      throw new Error(e.message || 'Gagal memproses link.');
    }
    render(body.data, type === 'mp3');
  } catch (err) {
    showError(err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Download';
  }
});
