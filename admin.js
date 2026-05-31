let draftData = null;

const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function setAuthUI(authenticated, username = '') {
  $('loginSection').classList.toggle('hidden', authenticated);
  $('adminSection').classList.toggle('hidden', !authenticated);
  $('authState').textContent = authenticated ? `Logged in as ${username}` : 'Not logged in';
}

function renderSectionEditor() {
  const sections = draftData.sections || [];
  $('sectionsEditor').innerHTML = sections
    .map((s, i) => `
      <div class="row">
        <input data-i="${i}" data-k="id" value="${s.id || ''}" />
        <input data-i="${i}" data-k="title" value="${s.title || ''}" />
        <input data-i="${i}" data-k="order" type="number" value="${s.order ?? i + 1}" />
        <label><input data-i="${i}" data-k="visible" type="checkbox" ${s.visible ? 'checked' : ''}/> visible</label>
      </div>
    `)
    .join('');
}

async function loadDraft() {
  draftData = await api('/api/content/draft');
  $('jsonEditor').value = JSON.stringify(draftData, null, 2);
  renderSectionEditor();
}

async function loadMedia() {
  const items = await api('/api/media/list');
  $('mediaList').innerHTML = items
    .map((m) => `
      <div class="media-item">
        <div>
          <div>${m.originalName}</div>
          <div class="small">${m.url}</div>
        </div>
        <div>
          <button onclick="copyUrl('${m.url}')">Copy URL</button>
          <button class="danger" onclick="deleteMedia('${m.id}')">Delete</button>
        </div>
      </div>
    `)
    .join('');
}

window.copyUrl = async (url) => {
  await navigator.clipboard.writeText(url);
  alert('Copied URL: ' + url);
};

window.deleteMedia = async (id) => {
  if (!confirm('Delete this file?')) return;
  await api(`/api/media/${id}`, { method: 'DELETE' });
  await loadMedia();
};

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
  });
  await boot();
});

$('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  setAuthUI(false);
});

$('refreshBtn').addEventListener('click', loadDraft);

$('applySectionBtn').addEventListener('click', () => {
  const rows = [...$('sectionsEditor').querySelectorAll('.row')];
  rows.forEach((row, idx) => {
    const get = (k) => row.querySelector(`[data-k="${k}"]`);
    draftData.sections[idx].id = get('id').value.trim();
    draftData.sections[idx].title = get('title').value.trim();
    draftData.sections[idx].order = Number(get('order').value || idx + 1);
    draftData.sections[idx].visible = get('visible').checked;
  });
  $('jsonEditor').value = JSON.stringify(draftData, null, 2);
  alert('Applied section changes into JSON editor. Click Save Draft.');
});

$('saveBtn').addEventListener('click', async () => {
  const payload = JSON.parse($('jsonEditor').value);
  await api('/api/content/draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  draftData = payload;
  renderSectionEditor();
  alert('Draft saved');
});

$('publishBtn').addEventListener('click', async () => {
  await api('/api/content/publish', { method: 'POST' });
  alert('Published successfully');
});

$('resetBtn').addEventListener('click', async () => {
  await api('/api/content/reset', { method: 'POST' });
  await loadDraft();
  alert('Draft reset from published');
});

$('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api('/api/media/upload', { method: 'POST', body: fd });
  e.target.reset();
  await loadMedia();
});

async function boot() {
  const me = await api('/api/auth/me');
  setAuthUI(!!me.authenticated, me.username || '');
  if (me.authenticated) {
    await loadDraft();
    await loadMedia();
  }
}

boot().catch((e) => {
  console.error(e);
  alert('Error: ' + e.message);
});
