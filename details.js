document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('detailContent');
  const backBtn = document.getElementById('backToHomeBtn');
  const themeBtn = document.getElementById('themeToggle');
  const THEME_KEY = 'portfolio_theme_pref';
  const themeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let themePref = localStorage.getItem(THEME_KEY) || 'dark';

  function esc(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function resolveTheme(pref) {
    if (pref === 'dark' || pref === 'light') return pref;
    return themeQuery && themeQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(pref = themePref) {
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    if (themeBtn) {
      themeBtn.textContent = resolved === 'dark' ? '🌙 Dark' : '☀ Light';
      themeBtn.setAttribute('aria-pressed', resolved === 'dark' ? 'true' : 'false');
      themeBtn.setAttribute('title', `Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  function initThemeToggle() {
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        themePref = next;
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }
    if (themeQuery && typeof themeQuery.addEventListener === 'function') {
      themeQuery.addEventListener('change', () => {
        themePref = localStorage.getItem(THEME_KEY) || 'dark';
        if (themePref === 'system') applyTheme('system');
      });
    }
    applyTheme(themePref);
  }

  function goHomeOrBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = './index.html';
  }

  if (backBtn) {
    backBtn.addEventListener('click', (event) => {
      event.preventDefault();
      goHomeOrBack();
    });
  }

  initThemeToggle();

  function fallback(title, message) {
    container.innerHTML = `
      <div class="details-empty">
        <h1>${esc(title)}</h1>
        <p>${esc(message)}</p>
        <button id="goHomeBtn" class="btn btn-primary btn-small mt-3" type="button">Go to Home</button>
      </div>
    `;
    const goHomeBtn = document.getElementById('goHomeBtn');
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', goHomeOrBack);
    }
  }

  async function loadPublishedData() {
    let apiError = null;
    let localError = null;

    try {
      const apiRes = await fetch('/api/content/published');
      if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`);
      return await apiRes.json();
    } catch (err) {
      apiError = err;
    }

    try {
      const localRes = await fetch('./data/published.json');
      if (!localRes.ok) throw new Error(`HTTP ${localRes.status}`);
      return await localRes.json();
    } catch (err) {
      localError = err;
    }

    const embedded = window.__DETAILS_FALLBACK__;
    if (embedded && typeof embedded === 'object') {
      console.warn('Using embedded details fallback data because API and local JSON failed.', {
        apiError: apiError?.message || apiError,
        localError: localError?.message || localError
      });
      return embedded;
    }

    console.warn('Unable to load details data from API, local JSON, and embedded fallback.', {
      apiError: apiError?.message || apiError,
      localError: localError?.message || localError
    });
    throw new Error('No details data source available');
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const id = params.get('id');

  if (!type || !id || !['certificate', 'project'].includes(type)) {
    fallback('Invalid detail URL', 'This detail link is invalid. Please go back and try again.');
    return;
  }

  try {
    const data = await loadPublishedData();
    window.globalData = data;

    if (type === 'certificate') {
      const cert = (data.certificates || []).find((c) => c.id === id);
      if (!cert) {
        fallback('Certificate not found', 'The requested certificate could not be found.');
        return;
      }

      const preview = cert.previewType === 'pdf'
        ? `<iframe class="doc-preview" src="${esc(cert.fileUrl)}" title="${esc(cert.title)}"></iframe>`
        : `<img class="cert-preview-image" src="${esc(cert.fileUrl)}" alt="${esc(cert.title)}" />`;

      container.innerHTML = `
        <article class="details-layout">
          <header class="details-header">
            <p class="project-overline">Certificate</p>
            <h1>${esc(cert.title)}</h1>
            <p class="details-lead">${esc(cert.description || '')}</p>
          </header>
          <div class="details-meta-grid">
            <div class="detail-meta-item"><strong>Issuer:</strong> ${esc(cert.issuer || 'N/A')}</div>
            <div class="detail-meta-item"><strong>Issue Date:</strong> ${esc(cert.issueDate || 'N/A')}</div>
            <div class="detail-meta-item"><strong>Credential ID:</strong> ${esc(cert.credentialId || 'N/A')}</div>
            <div class="detail-meta-item"><strong>Preview Type:</strong> ${esc(cert.previewType || 'N/A')}</div>
          </div>
          <section class="glass-panel mt-3">
            <h3>Skills Covered</h3>
            <div class="project-tech">${(cert.skills || []).map((s) => `<span class="btn btn-secondary btn-small skill-item" data-tech="${esc(s)}" style="cursor: pointer;">${esc(s)}</span>`).join('')}</div>
          </section>
          <section class="glass-panel mt-3">
            <h3>Certificate Preview</h3>
            <div class="cert-preview-wrap">${preview}</div>
            <a class="btn btn-primary btn-small mt-3" href="${esc(cert.fileUrl)}" target="_blank" rel="noopener noreferrer">Open Original</a>
          </section>
        </article>
      `;
      return;
    }

    const project = (data.projects || []).find((p) => p.id === id);
    if (!project) {
      fallback('Project not found', 'The requested project could not be found.');
      return;
    }

    container.innerHTML = `
      <article class="details-layout">
        <header class="details-header">
          <p class="project-overline">${esc(project.overline || 'Project')}</p>
          <h1>${esc(project.title || '')}</h1>
          <p class="details-lead">${esc(project.desc || '')}</p>
        </header>

        <section class="glass-panel mt-3">
          <h3>Role</h3>
          <p>${esc(project.role || 'Developer')}</p>
        </section>

        <section class="glass-panel mt-3">
          <h3>Key Features</h3>
          <ul class="task-list">${(project.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        </section>

        <section class="glass-panel mt-3">
          <h3>Outcomes</h3>
          <ul class="task-list">${(project.outcomes || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
        </section>

        <section class="glass-panel mt-3">
          <h3>Tech Stack</h3>
          <div class="project-tech">${(project.tech || []).map((t) => `<span class="btn btn-secondary btn-small skill-item" data-tech="${esc(t)}" style="cursor: pointer;">${esc(t)}</span>`).join('')}</div>
        </section>

        ${project.problemStatement ? `
        <section class="glass-panel mt-3">
          <h3>Problem Statement</h3>
          <p>${esc(project.problemStatement)}</p>
        </section>
        ` : ''}

        ${project.architecture && project.architecture.length > 0 ? `
        <section class="glass-panel mt-3">
          <h3>Technical Architecture</h3>
          <ul class="task-list">${project.architecture.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </section>
        ` : ''}

        ${project.security && project.security.length > 0 ? `
        <section class="glass-panel mt-3">
          <h3>Security Features</h3>
          <ul class="task-list">${project.security.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </section>
        ` : ''}

        ${project.highlights && project.highlights.length > 0 ? `
        <section class="glass-panel mt-3">
          <h3>Development Highlights</h3>
          <ul class="task-list">${project.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        </section>
        ` : ''}

        ${project.skills && project.skills.length > 0 ? `
        <section class="glass-panel mt-3">
          <h3>Skills Demonstrated</h3>
          <div class="project-tech">${project.skills.map((s) => `<span class="btn btn-secondary btn-small skill-item" data-tech="${esc(s)}" style="cursor: pointer;">${esc(s)}</span>`).join('')}</div>
        </section>
        ` : ''}

        <section class="glass-panel mt-3">
          <h3>Project Links</h3>
          <div class="project-links">
            ${project.repoUrl ? `<a href="${esc(project.repoUrl)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Repository</a>` : ''}
            ${project.liveUrl ? `<a href="${esc(project.liveUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
          </div>
        </section>

        ${(project.gallery && project.gallery.length > 0) ? `
        <section class="glass-panel mt-3">
          <h3>Project Gallery</h3>
          <div class="gallery-grid">
            ${project.gallery.map((img, idx) => `<img src="${esc(img)}" alt="${esc(project.title || 'Project')} screenshot ${idx + 1}" />`).join('')}
          </div>
        </section>
        ` : ''}
      </article>
    `;
  } catch (_) {
    fallback('Failed to load details', 'There was a problem loading this page. Please refresh and try again.');
  }
});


  function initTechModals() {
    const modal = document.getElementById('tech-modal');
    if (!modal) return;
    
    const closeBtn = document.getElementById('close-tech-modal');
    const nameEl = document.getElementById('tech-modal-name');
    const categoryEl = document.getElementById('tech-modal-category');
    const iconEl = document.getElementById('tech-modal-icon');
    const descEl = document.getElementById('tech-modal-desc');
    const featuresList = document.getElementById('tech-modal-features');
    const usecasesList = document.getElementById('tech-modal-usecases');

    function openModal(techName) {
      const details = window.globalData?.techDetails?.[techName];
      if (!details) return;

      nameEl.textContent = details.name || techName;
      categoryEl.textContent = details.category || 'Technology';
      descEl.textContent = details.description || '';
      
      const card = document.querySelector(`.skill-item[data-tech="${techName}"] .skill-icon`);
      iconEl.className = card ? card.className : '';
      
      featuresList.innerHTML = (details.features || []).map(f => `<li>${f}</li>`).join('');
      usecasesList.innerHTML = (details.useCases || []).map(u => `<li>${u}</li>`).join('');

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.querySelectorAll('.skill-item').forEach(item => {
      item.addEventListener('click', () => {
        const tech = item.getAttribute('data-tech');
        if (tech) openModal(tech);
      });
    });
  }
