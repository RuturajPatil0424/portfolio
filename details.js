document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('detailContent');
  const backBtn = document.getElementById('backToHomeBtn');

  function esc(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
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
            <ul class="project-tech">${(cert.skills || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
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
          <ul class="project-tech">${(project.tech || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </section>

        <section class="glass-panel mt-3">
          <h3>Project Links</h3>
          <div class="project-links">
            ${project.repoUrl ? `<a href="${esc(project.repoUrl)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Repository</a>` : ''}
            ${project.liveUrl ? `<a href="${esc(project.liveUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
          </div>
        </section>

        <section class="glass-panel mt-3">
          <h3>Project Gallery</h3>
          <div class="gallery-grid">
            ${(project.gallery || []).map((img, idx) => `<img src="${esc(img)}" alt="${esc(project.title || 'Project')} screenshot ${idx + 1}" />`).join('')}
          </div>
        </section>
      </article>
    `;
  } catch (_) {
    fallback('Failed to load details', 'There was a problem loading this page. Please refresh and try again.');
  }
});
