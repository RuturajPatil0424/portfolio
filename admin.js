let draftData = null;
let savedSnapshot = null;
let mediaItems = [];
let currentTab = 'site';

const $ = (id) => document.getElementById(id);

const TABS = [
  { id: 'site', label: 'Site Config + Nav' },
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills + Certificates' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact + Footer' },
  { id: 'media', label: 'Media Manager' }
];

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function toPathParts(path) {
  return String(path).split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

function getByPath(obj, path) {
  return toPathParts(path).reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setByPath(obj, path, value) {
  const parts = toPathParts(path);
  let ptr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = parts[i + 1];
    if (ptr[key] == null) ptr[key] = typeof next === 'number' ? [] : {};
    ptr = ptr[key];
  }
  ptr[parts[parts.length - 1]] = value;
}

function getArray(path) {
  const arr = getByPath(draftData, path);
  return Array.isArray(arr) ? arr : [];
}

function sectionIndex(id) {
  return draftData.sections.findIndex((s) => s.id === id);
}

function sectionPath(id, key) {
  const idx = sectionIndex(id);
  return `sections.${idx}.${key}`;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function ensureSection(id, defaults = {}) {
  let idx = sectionIndex(id);
  if (idx === -1) {
    draftData.sections.push({
      id,
      title: id,
      visible: true,
      order: draftData.sections.length + 1,
      ...defaults
    });
    idx = sectionIndex(id);
  }
  draftData.sections[idx] = { ...defaults, ...draftData.sections[idx], id };
  return draftData.sections[idx];
}

function normalizeDraft(input) {
  const d = deepClone(input || {});
  const localSectionIndex = (id) => ensureArray(d.sections).findIndex((s) => s.id === id);
  const localEnsureSection = (id, defaults = {}) => {
    let idx = localSectionIndex(id);
    if (idx === -1) {
      ensureArray(d.sections).push({
        id,
        title: id,
        visible: true,
        order: d.sections.length + 1,
        ...defaults
      });
      idx = localSectionIndex(id);
    }
    d.sections[idx] = { ...defaults, ...d.sections[idx], id };
    return d.sections[idx];
  };

  d.siteConfig = d.siteConfig || {};
  d.siteConfig.nav = ensureArray(d.siteConfig.nav);
  d.hero = d.hero || {};
  d.hero.typewriter = ensureArray(d.hero.typewriter);
  d.hero.cta = ensureArray(d.hero.cta);
  d.hero.social = ensureArray(d.hero.social);
  d.hero.badges = ensureArray(d.hero.badges);
  d.sections = ensureArray(d.sections);

  const about = localEnsureSection('about');
  about.overviewParagraphs = ensureArray(about.overviewParagraphs);
  about.stats = ensureArray(about.stats);
  about.education = ensureArray(about.education);

  const experience = localEnsureSection('experience');
  experience.items = ensureArray(experience.items);
  experience.items.forEach((x) => (x.tasks = ensureArray(x.tasks)));

  const skills = localEnsureSection('skills');
  skills.categories = ensureArray(skills.categories);
  skills.certifications = ensureArray(skills.certifications);
  skills.categories.forEach((x) => {
    x.tags = ensureArray(x.tags);
    x.highlights = ensureArray(x.highlights);
  });

  localEnsureSection('projects');
  d.projects = ensureArray(d.projects);
  d.projects.forEach((p) => {
    p.tech = ensureArray(p.tech);
    p.features = ensureArray(p.features);
    p.outcomes = ensureArray(p.outcomes);
    p.gallery = ensureArray(p.gallery);
  });

  d.certificates = ensureArray(d.certificates);
  d.certificates.forEach((c) => (c.skills = ensureArray(c.skills)));

  d.contact = d.contact || {};
  d.footer = d.footer || {};
  d.footer.social = ensureArray(d.footer.social);

  return d;
}

function showToast(message, type = 'success') {
  const stack = $('toastStack');
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  stack.appendChild(node);
  setTimeout(() => node.remove(), 2800);
}

function showErrors(errors) {
  const box = $('formErrors');
  if (!errors.length) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = `
    <strong>Please fix these before saving:</strong>
    <ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
  `;
}

function isDirty() {
  return JSON.stringify(draftData) !== JSON.stringify(savedSnapshot);
}

function refreshDirtyUI() {
  const dirty = isDirty();
  const badge = $('dirtyBadge');
  badge.classList.toggle('dirty', dirty);
  badge.classList.toggle('clean', !dirty);
  badge.textContent = dirty ? 'Unsaved Changes' : 'Saved';
  $('saveBtn').disabled = !dirty;
}

function setAuthUI(authenticated, username = '') {
  $('loginSection').classList.toggle('hidden', authenticated);
  $('adminSection').classList.toggle('hidden', !authenticated);
  $('authState').textContent = authenticated ? `Logged in as ${username}` : 'Not logged in';
  document.body.classList.toggle('auth-guest', !authenticated);
  document.body.classList.toggle('auth-logged', authenticated);
}

function toCSV(arr) {
  return ensureArray(arr).join(', ');
}

function fromCSV(text) {
  return String(text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function inputField(label, path, value, type = 'text', placeholder = '') {
  return `
    <label>${esc(label)}
      <input type="${esc(type)}" data-path="${esc(path)}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" />
    </label>
  `;
}

function checkboxField(label, path, checked) {
  return `
    <label class="inline-check">
      <input type="checkbox" data-path="${esc(path)}" ${checked ? 'checked' : ''} />
      ${esc(label)}
    </label>
  `;
}

function textareaField(label, path, value, placeholder = '') {
  return `
    <label>${esc(label)}
      <textarea data-path="${esc(path)}" placeholder="${esc(placeholder)}">${esc(value ?? '')}</textarea>
    </label>
  `;
}

function csvField(label, path, arr, placeholder = 'item1, item2') {
  return `
    <label>${esc(label)}
      <input data-path="${esc(path)}" data-mode="csv" value="${esc(toCSV(arr))}" placeholder="${esc(placeholder)}" />
    </label>
  `;
}

function stringArrayEditor(title, path) {
  const items = getArray(path);
  return `
    <div class="group">
      <div class="array-item-top">
        <h4>${esc(title)}</h4>
        <button class="btn btn-link" data-action="add-string" data-path="${esc(path)}">+ Add</button>
      </div>
      ${items
        .map(
          (it, i) => `
        <div class="array-item">
          ${inputField(`${title} #${i + 1}`, `${path}.${i}`, it)}
          <div class="array-actions">
            <button class="btn btn-icon" data-action="move-item" data-path="${esc(path)}" data-index="${i}" data-dir="-1">Up</button>
            <button class="btn btn-icon" data-action="move-item" data-path="${esc(path)}" data-index="${i}" data-dir="1">Down</button>
            <button class="btn btn-danger" data-action="remove-item" data-path="${esc(path)}" data-index="${i}">Delete</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function objectArrayControlHeader(title, path) {
  return `
    <div class="array-item-top">
      <h4>${esc(title)}</h4>
      <button class="btn btn-link" data-action="add-item" data-path="${esc(path)}">+ Add</button>
    </div>
  `;
}

function renderTabNav() {
  $('tabNav').innerHTML = TABS.map(
    (t) => `<button class="tab-btn ${t.id === currentTab ? 'active' : ''}" data-tab="${t.id}">${esc(t.label)}</button>`
  ).join('');
}

function renderSiteTab() {
  const sc = draftData.siteConfig || {};
  const nav = ensureArray(sc.nav);
  const sections = ensureArray(draftData.sections);
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Site Config</h3>
        <div class="field-grid">
          ${inputField('Site Title', 'siteConfig.title', sc.title)}
          ${inputField('Logo Text', 'siteConfig.logoText', sc.logoText)}
        </div>
      </div>
      <div class="group">
        ${objectArrayControlHeader('Navigation Items', 'siteConfig.nav')}
        ${nav
          .map(
            (n, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('ID', `siteConfig.nav.${i}.id`, n.id)}
              ${inputField('Label', `siteConfig.nav.${i}.label`, n.label)}
              ${inputField('Order', `siteConfig.nav.${i}.order`, n.order, 'number')}
            </div>
            <div class="field-grid">
              ${checkboxField('Visible', `siteConfig.nav.${i}.visible`, n.visible !== false)}
              ${checkboxField('CTA', `siteConfig.nav.${i}.cta`, !!n.cta)}
            </div>
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="siteConfig.nav" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="siteConfig.nav" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="siteConfig.nav" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="group">
        <h3>Section Order + Visibility</h3>
        ${sections
          .map(
            (s, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Section ID', `sections.${i}.id`, s.id)}
              ${inputField('Title', `sections.${i}.title`, s.title)}
              ${inputField('Order', `sections.${i}.order`, s.order, 'number')}
            </div>
            ${checkboxField('Visible', `sections.${i}.visible`, s.visible !== false)}
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderHeroTab() {
  const h = draftData.hero || {};
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Hero Basics</h3>
        <div class="field-grid">
          ${inputField('Greeting', 'hero.greeting', h.greeting)}
          ${inputField('Name', 'hero.name', h.name)}
        </div>
        ${textareaField('Description', 'hero.description', h.description)}
        ${checkboxField('Hero Visible', 'hero.visible', h.visible !== false)}
      </div>
      ${stringArrayEditor('Typewriter Text', 'hero.typewriter')}
      <div class="group">
        ${objectArrayControlHeader('Hero CTA Buttons', 'hero.cta')}
        ${ensureArray(h.cta)
          .map(
            (c, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Label', `hero.cta.${i}.label`, c.label)}
              ${inputField('Href', `hero.cta.${i}.href`, c.href)}
              ${inputField('Variant', `hero.cta.${i}.variant`, c.variant)}
            </div>
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="hero.cta" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="hero.cta" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="hero.cta" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Hero Social Links', 'hero.social')}
        ${ensureArray(h.social)
          .map(
            (s, i) => `
          <div class="array-item">
            <div class="field-grid">
              ${inputField('Icon Class', `hero.social.${i}.icon`, s.icon)}
              ${inputField('URL', `hero.social.${i}.url`, s.url)}
            </div>
            <button class="btn btn-danger" data-action="remove-item" data-path="hero.social" data-index="${i}">Delete</button>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Hero Badges', 'hero.badges')}
        ${ensureArray(h.badges)
          .map(
            (b, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Icon Class', `hero.badges.${i}.icon`, b.icon)}
              ${inputField('Text', `hero.badges.${i}.text`, b.text)}
              ${inputField('CSS Class', `hero.badges.${i}.className`, b.className)}
            </div>
            <button class="btn btn-danger" data-action="remove-item" data-path="hero.badges" data-index="${i}">Delete</button>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderAboutTab() {
  const about = draftData.sections[sectionIndex('about')];
  const basePath = `sections.${sectionIndex('about')}`;
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>About Section</h3>
        <div class="field-grid-3">
          ${inputField('Label No', `${basePath}.labelNo`, about.labelNo)}
          ${inputField('Title', `${basePath}.title`, about.title)}
          ${inputField('Overview Title', `${basePath}.overviewTitle`, about.overviewTitle)}
        </div>
        ${checkboxField('Visible', `${basePath}.visible`, about.visible !== false)}
      </div>
      ${stringArrayEditor('Overview Paragraph', `${basePath}.overviewParagraphs`)}
      <div class="group">
        ${objectArrayControlHeader('Stats', `${basePath}.stats`)}
        ${ensureArray(about.stats)
          .map(
            (s, i) => `
          <div class="array-item">
            <div class="field-grid">
              ${inputField('Value', `${basePath}.stats.${i}.value`, s.value)}
              ${inputField('Label', `${basePath}.stats.${i}.label`, s.label)}
            </div>
            <button class="btn btn-danger" data-action="remove-item" data-path="${basePath}.stats" data-index="${i}">Delete</button>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Education', `${basePath}.education`)}
        ${ensureArray(about.education)
          .map(
            (e, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Degree', `${basePath}.education.${i}.degree`, e.degree)}
              ${inputField('Institute', `${basePath}.education.${i}.org`, e.org)}
              ${inputField('Year', `${basePath}.education.${i}.year`, e.year)}
            </div>
            ${textareaField('Description', `${basePath}.education.${i}.desc`, e.desc)}
            <button class="btn btn-danger" data-action="remove-item" data-path="${basePath}.education" data-index="${i}">Delete</button>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderExperienceTab() {
  const exp = draftData.sections[sectionIndex('experience')];
  const basePath = `sections.${sectionIndex('experience')}`;
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Experience Section</h3>
        <div class="field-grid">
          ${inputField('Label No', `${basePath}.labelNo`, exp.labelNo)}
          ${inputField('Title', `${basePath}.title`, exp.title)}
        </div>
        ${checkboxField('Visible', `${basePath}.visible`, exp.visible !== false)}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Experience Items', `${basePath}.items`)}
        ${ensureArray(exp.items)
          .map(
            (it, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Role', `${basePath}.items.${i}.role`, it.role)}
              ${inputField('Date', `${basePath}.items.${i}.date`, it.date)}
              ${inputField('Company', `${basePath}.items.${i}.company`, it.company)}
            </div>
            ${stringArrayEditor('Task', `${basePath}.items.${i}.tasks`)}
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="${basePath}.items" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="${basePath}.items" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="${basePath}.items" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderSkillsTab() {
  const skills = draftData.sections[sectionIndex('skills')];
  const basePath = `sections.${sectionIndex('skills')}`;
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Skills Section</h3>
        <div class="field-grid">
          ${inputField('Label No', `${basePath}.labelNo`, skills.labelNo)}
          ${inputField('Title', `${basePath}.title`, skills.title)}
        </div>
        ${inputField('Certifications Title', `${basePath}.certificationsTitle`, skills.certificationsTitle)}
        ${checkboxField('Visible', `${basePath}.visible`, skills.visible !== false)}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Skill Categories', `${basePath}.categories`)}
        ${ensureArray(skills.categories)
          .map(
            (c, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('Icon', `${basePath}.categories.${i}.icon`, c.icon)}
              ${inputField('Title', `${basePath}.categories.${i}.title`, c.title)}
              ${csvField('Highlights (CSV)', `${basePath}.categories.${i}.highlights`, c.highlights, 'Python, RAG')}
            </div>
            ${csvField('Tags (CSV)', `${basePath}.categories.${i}.tags`, c.tags)}
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="${basePath}.categories" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="${basePath}.categories" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="${basePath}.categories" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      ${stringArrayEditor('Skills Section Certification Text', `${basePath}.certifications`)}
      <div class="group">
        ${objectArrayControlHeader('Detailed Certificates', 'certificates')}
        ${ensureArray(draftData.certificates)
          .map(
            (c, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('ID', `certificates.${i}.id`, c.id)}
              ${inputField('Title', `certificates.${i}.title`, c.title)}
              ${inputField('Issuer', `certificates.${i}.issuer`, c.issuer)}
            </div>
            <div class="field-grid-3">
              ${inputField('Issue Date', `certificates.${i}.issueDate`, c.issueDate)}
              ${inputField('Credential ID', `certificates.${i}.credentialId`, c.credentialId)}
              ${inputField('Preview Type', `certificates.${i}.previewType`, c.previewType)}
            </div>
            <div class="field-grid">
              ${inputField('File URL', `certificates.${i}.fileUrl`, c.fileUrl)}
              ${inputField('Thumbnail URL', `certificates.${i}.thumbUrl`, c.thumbUrl)}
            </div>
            ${csvField('Skills (CSV)', `certificates.${i}.skills`, c.skills)}
            ${textareaField('Description', `certificates.${i}.description`, c.description)}
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="certificates" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="certificates" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="certificates" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderProjectsTab() {
  const section = draftData.sections[sectionIndex('projects')];
  const secPath = `sections.${sectionIndex('projects')}`;
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Projects Section</h3>
        <div class="field-grid">
          ${inputField('Label No', `${secPath}.labelNo`, section.labelNo)}
          ${inputField('Title', `${secPath}.title`, section.title)}
        </div>
        ${checkboxField('Visible', `${secPath}.visible`, section.visible !== false)}
      </div>
      <div class="group">
        ${objectArrayControlHeader('Project Items', 'projects')}
        ${ensureArray(draftData.projects)
          .map(
            (p, i) => `
          <div class="array-item">
            <div class="field-grid-3">
              ${inputField('ID', `projects.${i}.id`, p.id)}
              ${inputField('Overline', `projects.${i}.overline`, p.overline)}
              ${inputField('Title', `projects.${i}.title`, p.title)}
            </div>
            ${textareaField('Description', `projects.${i}.desc`, p.desc)}
            <div class="field-grid-3">
              ${inputField('Role', `projects.${i}.role`, p.role)}
              ${inputField('Repo URL', `projects.${i}.repoUrl`, p.repoUrl)}
              ${inputField('Live URL', `projects.${i}.liveUrl`, p.liveUrl)}
            </div>
            ${csvField('Tech Stack (CSV)', `projects.${i}.tech`, p.tech)}
            ${csvField('Features (CSV)', `projects.${i}.features`, p.features)}
            ${csvField('Outcomes (CSV)', `projects.${i}.outcomes`, p.outcomes)}
            ${csvField('Gallery URLs (CSV)', `projects.${i}.gallery`, p.gallery)}
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="projects" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="projects" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="projects" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderContactFooterTab() {
  const c = draftData.contact || {};
  const f = draftData.footer || {};
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Contact</h3>
        ${checkboxField('Visible', 'contact.visible', c.visible !== false)}
        <div class="field-grid-3">
          ${inputField('Overline', 'contact.overline', c.overline)}
          ${inputField('Title', 'contact.title', c.title)}
          ${inputField('Phone', 'contact.phone', c.phone)}
        </div>
        <div class="field-grid">
          ${inputField('Location', 'contact.location', c.location)}
          ${inputField('Email', 'contact.email', c.email)}
        </div>
        ${textareaField('Description', 'contact.description', c.description)}
      </div>
      <div class="group">
        <h3>Footer</h3>
        ${checkboxField('Visible', 'footer.visible', f.visible !== false)}
        <div class="field-grid">
          ${inputField('Line 1', 'footer.line1', f.line1)}
          ${inputField('Line 2', 'footer.line2', f.line2)}
        </div>
      </div>
      <div class="group">
        ${objectArrayControlHeader('Footer Social Links', 'footer.social')}
        ${ensureArray(f.social)
          .map(
            (s, i) => `
          <div class="array-item">
            <div class="field-grid">
              ${inputField('Icon Class', `footer.social.${i}.icon`, s.icon)}
              ${inputField('URL', `footer.social.${i}.url`, s.url)}
            </div>
            <div class="array-actions">
              <button class="btn btn-icon" data-action="move-item" data-path="footer.social" data-index="${i}" data-dir="-1">Up</button>
              <button class="btn btn-icon" data-action="move-item" data-path="footer.social" data-index="${i}" data-dir="1">Down</button>
              <button class="btn btn-danger" data-action="remove-item" data-path="footer.social" data-index="${i}">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderMediaTab() {
  return `
    <div class="workspace-section">
      <div class="group">
        <h3>Upload Media</h3>
        <form id="uploadForm">
          <label>Choose file<input type="file" name="file" required /></label>
          <button class="btn btn-primary" type="submit">Upload</button>
        </form>
      </div>
      <div class="group">
        <h3>Uploaded Files</h3>
        <div class="media-grid">
          ${mediaItems
            .map(
              (m) => `
            <div class="media-item">
              <div>
                <div>${esc(m.originalName)}</div>
                <div class="small">${esc(m.url)}</div>
              </div>
              <div class="array-actions">
                <button class="btn" data-action="copy-media" data-url="${esc(m.url)}">Copy URL</button>
                <button class="btn btn-danger" data-action="delete-media" data-id="${esc(m.id)}">Delete</button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function renderWorkspace() {
  const workspace = $('workspace');
  if (!workspace) return;
  let html = '';
  if (currentTab === 'site') html = renderSiteTab();
  else if (currentTab === 'hero') html = renderHeroTab();
  else if (currentTab === 'about') html = renderAboutTab();
  else if (currentTab === 'experience') html = renderExperienceTab();
  else if (currentTab === 'skills') html = renderSkillsTab();
  else if (currentTab === 'projects') html = renderProjectsTab();
  else if (currentTab === 'contact') html = renderContactFooterTab();
  else if (currentTab === 'media') html = renderMediaTab();
  workspace.innerHTML = html;
  bindMediaUploadForm();
}

function renderAll() {
  renderTabNav();
  renderWorkspace();
  refreshDirtyUI();
  showErrors([]);
}

function getDefaultItem(path) {
  const map = {
    'siteConfig.nav': { id: 'new-id', label: 'New', visible: true, order: 1, cta: false },
    'hero.cta': { label: 'Button', href: '#', variant: 'primary' },
    'hero.social': { icon: 'fab fa-github', url: 'https://example.com' },
    'hero.badges': { icon: 'fas fa-star', text: 'New Badge', className: 'new-badge' },
    'sections.0.stats': { value: '', label: '' },
    'sections.0.education': { degree: '', org: '', year: '', desc: '' },
    'sections.1.items': { role: '', date: '', company: '', tasks: [''] },
    'sections.2.categories': { icon: '', title: '', tags: [], highlights: [] },
    certificates: {
      id: 'new-certificate',
      title: '',
      issuer: '',
      issueDate: '',
      credentialId: '',
      skills: [],
      fileUrl: '',
      previewType: 'pdf',
      thumbUrl: '',
      description: ''
    },
    projects: {
      id: 'new-project',
      overline: '',
      title: '',
      desc: '',
      role: '',
      tech: [],
      features: [],
      outcomes: [],
      repoUrl: '',
      liveUrl: '',
      gallery: []
    },
    'footer.social': { icon: 'fab fa-linkedin-in', url: 'https://example.com' }
  };
  if (map[path]) return deepClone(map[path]);
  if (path.endsWith('.stats')) return { value: '', label: '' };
  if (path.endsWith('.education')) return { degree: '', org: '', year: '', desc: '' };
  if (path.endsWith('.items')) return { role: '', date: '', company: '', tasks: [''] };
  if (path.endsWith('.categories')) return { icon: '', title: '', tags: [], highlights: [] };
  return {};
}

function validateDraft() {
  const errors = [];
  const nav = ensureArray(draftData.siteConfig?.nav);
  nav.forEach((n, i) => {
    if (!String(n.id || '').trim()) errors.push(`Navigation #${i + 1}: ID is required.`);
    if (!String(n.label || '').trim()) errors.push(`Navigation #${i + 1}: label is required.`);
  });

  const ids = new Set();
  ensureArray(draftData.sections).forEach((s, i) => {
    const id = String(s.id || '').trim();
    if (!id) errors.push(`Section #${i + 1}: section ID is required.`);
    else if (ids.has(id)) errors.push(`Section ID "${id}" is duplicated.`);
    else ids.add(id);
  });

  ensureArray(draftData.projects).forEach((p, i) => {
    if (!String(p.id || '').trim()) errors.push(`Project #${i + 1}: project ID is required.`);
    if (!String(p.title || '').trim()) errors.push(`Project #${i + 1}: title is required.`);
  });

  ensureArray(draftData.certificates).forEach((c, i) => {
    if (!String(c.id || '').trim()) errors.push(`Certificate #${i + 1}: certificate ID is required.`);
    if (!String(c.title || '').trim()) errors.push(`Certificate #${i + 1}: title is required.`);
  });

  const email = String(draftData.contact?.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Contact email is not valid.');
  }

  return errors;
}

async function loadDraft() {
  const raw = await api('/api/content/draft');
  draftData = normalizeDraft(raw);
  savedSnapshot = deepClone(draftData);
  renderAll();
}

async function loadMedia() {
  mediaItems = await api('/api/media/list');
  if (currentTab === 'media') renderWorkspace();
}

function bindMediaUploadForm() {
  const form = $('uploadForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(form);
      await api('/api/media/upload', { method: 'POST', body: fd });
      form.reset();
      await loadMedia();
      showToast('File uploaded');
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  });
}

function onWorkspaceInput(event) {
  const target = event.target;
  if (!target || !target.dataset.path) return;
  const path = target.dataset.path;
  let value;
  if (target.type === 'checkbox') value = target.checked;
  else if (target.dataset.mode === 'csv') value = fromCSV(target.value);
  else if (target.type === 'number') value = Number(target.value || 0);
  else value = target.value;
  setByPath(draftData, path, value);
  refreshDirtyUI();
}

function moveArrayItem(path, index, dir) {
  const arr = getArray(path);
  const next = index + dir;
  if (next < 0 || next >= arr.length) return;
  const tmp = arr[index];
  arr[index] = arr[next];
  arr[next] = tmp;
  setByPath(draftData, path, arr);
}

async function onWorkspaceClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const path = btn.dataset.path;
  const index = Number(btn.dataset.index);
  const dir = Number(btn.dataset.dir);

  if (action === 'add-string') {
    const arr = getArray(path);
    arr.push('');
    setByPath(draftData, path, arr);
    renderWorkspace();
    refreshDirtyUI();
    return;
  }

  if (action === 'add-item') {
    const arr = getArray(path);
    arr.push(getDefaultItem(path));
    setByPath(draftData, path, arr);
    renderWorkspace();
    refreshDirtyUI();
    return;
  }

  if (action === 'remove-item') {
    if (!confirm('Delete this item?')) return;
    const arr = getArray(path);
    arr.splice(index, 1);
    setByPath(draftData, path, arr);
    renderWorkspace();
    refreshDirtyUI();
    return;
  }

  if (action === 'move-item') {
    moveArrayItem(path, index, dir);
    renderWorkspace();
    refreshDirtyUI();
    return;
  }

  if (action === 'copy-media') {
    await navigator.clipboard.writeText(btn.dataset.url || '');
    showToast('Media URL copied');
    return;
  }

  if (action === 'delete-media') {
    if (!confirm('Delete this media file?')) return;
    await api(`/api/media/${btn.dataset.id}`, { method: 'DELETE' });
    await loadMedia();
    showToast('Media deleted');
  }
}

async function saveDraft() {
  const errors = validateDraft();
  showErrors(errors);
  if (errors.length) {
    showToast('Fix validation errors before saving', 'error');
    return;
  }
  await api('/api/content/draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftData)
  });
  savedSnapshot = deepClone(draftData);
  refreshDirtyUI();
  showToast('Draft saved');
}

async function boot() {
  const me = await api('/api/auth/me');
  setAuthUI(!!me.authenticated, me.username || '');
  if (me.authenticated) {
    await loadDraft();
    await loadMedia();
  }
}

$('tabNav').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-tab]');
  if (!btn) return;
  currentTab = btn.dataset.tab;
  renderAll();
});

$('workspace').addEventListener('input', onWorkspaceInput);
$('workspace').addEventListener('click', (e) => {
  onWorkspaceClick(e).catch((err) => showToast(err.message, 'error'));
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalLabel = submitBtn ? submitBtn.textContent : 'Login';
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }
    await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
    });
    showToast('Login successful');
    await boot();
  } catch (err) {
    showToast(`Login failed: ${err.message}`, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }
});

$('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  setAuthUI(false);
  draftData = null;
  savedSnapshot = null;
  showErrors([]);
  showToast('Logged out');
});

$('refreshBtn').addEventListener('click', async () => {
  if (isDirty() && !confirm('Discard unsaved changes and refresh draft?')) return;
  await loadDraft();
  showToast('Draft refreshed');
});

$('saveBtn').addEventListener('click', () => {
  saveDraft().catch((err) => showToast(err.message, 'error'));
});

$('publishBtn').addEventListener('click', async () => {
  if (isDirty()) {
    showToast('Save draft before publishing', 'error');
    return;
  }
  if (!confirm('Publish current draft?')) return;
  await api('/api/content/publish', { method: 'POST' });
  showToast('Published successfully');
});

$('resetBtn').addEventListener('click', async () => {
  if (!confirm('Reset draft from published content?')) return;
  await api('/api/content/reset', { method: 'POST' });
  await loadDraft();
  showToast('Draft reset from published');
});

boot().catch((e) => {
  console.error(e);
  showToast(`Error: ${e.message}`, 'error');
});
