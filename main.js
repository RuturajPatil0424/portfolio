// main.js - Interactive behaviors + dynamic content rendering

document.addEventListener('DOMContentLoaded', () => {
  let typewriterTexts = ["Python Full-Stack Developer", "AI/ML Engineer", "RAG & LLM Specialist"];
  const THEME_KEY = 'portfolio_theme_pref';
  const themeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let themePref = localStorage.getItem(THEME_KEY) || 'dark';

  function resolveTheme(pref) {
    if (pref === 'dark' || pref === 'light') return pref;
    return themeQuery && themeQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(pref = themePref) {
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = resolved === 'dark' ? '🌙 Dark' : '☀ Light';
      btn.setAttribute('aria-pressed', resolved === 'dark' ? 'true' : 'false');
      btn.setAttribute('title', `Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
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

  function esc(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function sectionWrapper(id, labelNo, title, content) {
    return `
      <section id="${esc(id)}" class="section">
        <h2 class="section-title reveal"><span>${esc(labelNo)}</span> ${esc(title)}</h2>
        ${content}
      </section>
    `;
  }

  function detailUrl(type, id) {
    return `details.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id || '')}`;
  }

  function renderPublished(data) {
    if (!data || typeof data !== 'object') return;

    if (data.siteConfig?.title) document.title = data.siteConfig.title;

    const navLinks = document.querySelector('.nav-links');
    if (navLinks && Array.isArray(data.siteConfig?.nav)) {
      const links = [...data.siteConfig.nav]
        .filter((n) => n.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      navLinks.innerHTML = links
        .map((n) => `<a href="#${esc(n.id)}" class="${n.cta ? 'nav-cta' : ''}">${esc(n.label)}</a>`)
        .join('');
    }

    if (data.hero?.visible !== false) {
      const hero = document.getElementById('home');
      if (hero) {
        typewriterTexts = Array.isArray(data.hero.typewriter) && data.hero.typewriter.length ? data.hero.typewriter : typewriterTexts;
        hero.innerHTML = `
          <div class="hero-content reveal">
            <p class="greeting">${esc(data.hero.greeting || "Hello, I'm")}</p>
            <h1 class="glitch-text">${esc(data.hero.name || '')}</h1>
            <h2 class="typing-text"><span id="typewriter"></span><span class="cursor">|</span></h2>
            <p class="hero-desc">${esc(data.hero.description || '')}</p>
            <div class="hero-cta">
              ${(data.hero.cta || []).map((c) => `<a href="${esc(c.href || '#')}" class="btn btn-${esc(c.variant || 'primary')}">${esc(c.label || 'Action')}</a>`).join('')}
            </div>
            <div class="social-links">
              ${(data.hero.social || []).map((s) => `<a href="${esc(s.url || '#')}" target="_blank"><i class="${esc(s.icon || '')}"></i></a>`).join('')}
            </div>
          </div>
          <div class="hero-visual reveal-right">
            <div class="glass-orb orb-1"></div>
            <div class="glass-orb orb-2"></div>
            ${(data.hero.badges || []).map((b) => `
              <div class="glass-card floating-card ${esc(b.className || '')}">
                <i class="${esc(b.icon || '')}"></i>
                <span>${esc(b.text || '')}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    const sectionMap = Object.fromEntries((data.sections || []).map((s) => [s.id, s]));

    const about = sectionMap.about;
    if (about) {
      const node = document.getElementById('about');
      if (node) {
        if (about.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('about', about.labelNo || '01.', about.title || 'About', `
          <div class="about-grid">
            <div class="about-text glass-panel reveal">
              <h3>${esc(about.overviewTitle || '')}</h3>
              ${(about.overviewParagraphs || []).map((p) => `<p>${esc(p)}</p>`).join('')}
              <div class="stats">
                ${(about.stats || []).map((s) => `<div class="stat-item"><h4 class="stat-num">${esc(s.value || '')}</h4><p>${esc(s.label || '')}</p></div>`).join('')}
              </div>
            </div>
            <div class="education glass-panel reveal-right">
              <h3>Education</h3>
              ${(about.education || []).map((e) => `
                <div class="edu-item">
                  <h4>${esc(e.degree || '')}</h4>
                  <p class="uni">${esc(e.org || '')}</p>
                  <p class="year">${esc(e.year || '')}</p>
                  ${e.desc ? `<p class="desc">${esc(e.desc)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `);
      }
    }

    const experience = sectionMap.experience;
    if (experience) {
      const node = document.getElementById('experience');
      if (node) {
        if (experience.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('experience', experience.labelNo || '02.', experience.title || 'Experience', `
          <div class="timeline glass-panel reveal">
            ${(experience.items || []).map((it) => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-header"><h3>${esc(it.role || '')}</h3><span class="timeline-date">${esc(it.date || '')}</span></div>
                  <h4 class="company">${esc(it.company || '')}</h4>
                  <ul class="task-list">${(it.tasks || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
                </div>
              </div>
            `).join('')}
          </div>
        `);
      }
    }

    const skills = sectionMap.skills;
    if (skills) {
      const node = document.getElementById('skills');
      if (node) {
        if (skills.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('skills', skills.labelNo || '03.', skills.title || 'Skills', `
          <div class="skills-grid new-skills reveal">
            ${(skills.categories || []).map((c) => `
              <div class="skill-category glass-panel">
                <div class="category-header">
                  <span class="category-emoji">${c.emoji || ''}</span>
                  <h3>${esc(c.title || '')}</h3>
                </div>
                <div class="skill-items-grid">
                  ${(c.items || []).map((it) => `
                    <div class="skill-item" data-tech="${esc(it.name || '')}">
                      <i class="${esc(it.icon || '')} skill-icon ${it.iconDark ? 'light-only' : ''}"></i>${it.iconDark ? `\n                      <i class="${esc(it.iconDark)} skill-icon dark-only"></i>` : ''}
                      <div class="skill-info">
                        <span class="skill-name">${esc(it.name || '')}</span>
                        <span class="skill-level">${esc(it.level || '')}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="certifications glass-panel reveal mt-4">
            <h3><i class="fas fa-trophy"></i> ${esc(skills.certificationsTitle || 'Certifications')}</h3>
            <div class="cert-grid">
              ${(data.certificates || []).map((c) => `
                <article class="cert-card">
                  <p class="project-overline">${esc(c.issuer || 'Certification')}</p>
                  <h4>${esc(c.title || '')}</h4>
                  <p class="cert-short">${esc(c.description || '')}</p>
                  <div class="project-tech">
                    ${(c.skills || []).map(s => `<span class="btn btn-secondary btn-small skill-item" data-tech="${esc(s)}" style="cursor: pointer;">${esc(s)}</span>`).join('')}
                  </div>
                  <div class="project-links">
                    <a class="btn btn-secondary btn-small" href="${detailUrl('certificate', c.id)}">View</a>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        `);
      }
    }

    const projectsSec = sectionMap.projects;
    if (projectsSec) {
      const node = document.getElementById('projects');
      if (node) {
        if (projectsSec.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('projects', projectsSec.labelNo || '04.', projectsSec.title || 'Projects', `
          <div class="projects-grid">
            ${(data.projects || []).map((p) => `
              <div class="project-card glass-panel reveal"><div class="project-content">
                <p class="project-overline">${esc(p.overline || '')}</p>
                <h3 class="project-title">${esc(p.title || '')}</h3>
                <div class="project-desc"><p>${esc(p.desc || '')}</p></div>
                <div class="project-tech">${(p.tech || []).map((t) => `<span class="btn btn-secondary btn-small skill-item" data-tech="${esc(t)}" style="cursor: pointer;">${esc(t)}</span>`).join('')}</div>
                <div class="project-links">
                  <a class="btn btn-secondary btn-small" href="${detailUrl('project', p.id)}">View</a>
                </div>
              </div></div>
            `).join('')}
          </div>
        `);
      }
    }

    const stats = sectionMap.stats;
    if (stats) {
      const node = document.getElementById('stats');
      if (node) {
        if (stats.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('stats', stats.labelNo || '05.', stats.title || 'Stats', `
          <div class="skills-grid reveal">
            ${(stats.items || []).map((s) => `<div class="skill-category glass-panel"><h3>${esc(s.value || '')}</h3><p>${esc(s.label || '')}</p></div>`).join('')}
          </div>
        `);
      }
    }

    const github = sectionMap.github;
    if (github) {
      const node = document.getElementById('github');
      if (node) {
        if (github.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('github', github.labelNo || '06.', github.title || 'GitHub', `
          <div class="projects-grid">
            ${(github.items || []).map((g) => `
              <div class="project-card glass-panel reveal">
                <h3 class="project-title">${esc(g.title || '')}</h3>
                <p class="project-desc">${esc(g.desc || '')}</p>
                <div class="project-links"><a class="btn btn-secondary btn-small" href="${esc(g.url || '#')}" target="_blank">View</a></div>
              </div>
            `).join('')}
          </div>
        `);
      }
    }

    const blog = sectionMap.blog;
    if (blog) {
      const node = document.getElementById('blog');
      if (node) {
        if (blog.visible === false) node.remove();
        else node.outerHTML = sectionWrapper('blog', blog.labelNo || '07.', blog.title || 'Blog', `
          <div class="skills-grid reveal">
            ${(blog.topics || []).map((t) => `
              <div class="skill-category glass-panel">
                <h3>${esc(t.title || '')}</h3>
                <ul class="task-list">${(t.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>
        `);
      }
    }

    if (data.contact?.visible !== false) {
      const node = document.getElementById('contact');
      if (node) {
        node.innerHTML = `
          <div class="glass-panel text-center reveal p-5">
            <p class="overline">${esc(data.contact.overline || "What's Next?")}</p>
            <h2 class="contact-title">${esc(data.contact.title || 'Get In Touch')}</h2>
            <p class="contact-desc">${esc(data.contact.description || '')}</p>
            <div class="contact-info">
              <div class="contact-item"><i class="fas fa-phone"></i><span>${esc(data.contact.phone || '')}</span></div>
              <div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${esc(data.contact.location || '')}</span></div>
            </div>
            <a href="mailto:${esc(data.contact.email || '')}" class="btn btn-primary btn-large mt-3">Say Hello</a>
          </div>
        `;
      }
    }

    if (data.footer?.visible !== false) {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.innerHTML = `
          <div class="social-links footer-socials">
            ${(data.footer.social || []).map((s) => `<a href="${esc(s.url || '#')}" target="_blank"><i class="${esc(s.icon || '')}"></i></a>`).join('')}
          </div>
          <p>${esc(data.footer.line1 || '')}</p>
          <p class="copyright">${esc(data.footer.line2 || '')}</p>
        `;
      }
    }
  }

  async function hydrateFromApi() {
    try {
      const res = await fetch('/api/content/published');
      if (!res.ok) throw new Error('Published API unavailable');
      const data = await res.json();
      window.globalData = data;
      renderPublished(data);
      return;
    } catch (apiErr) {
      try {
        const res = await fetch('./data/published.json');
        if (!res.ok) throw new Error('Local JSON unavailable');
        const data = await res.json();
      window.globalData = data;
      renderPublished(data);
      } catch (localErr) {
        console.warn('Unable to hydrate published content from API and local JSON.', {
          apiError: apiErr?.message || apiErr,
          localError: localErr?.message || localErr
        });
        // fallback: keep static HTML
      }
    }
  }

  // 1. Typewriter Effect
  let count = 0;
  let index = 0;
  let currentText = '';
  let letter = '';
  let isDeleting = false;
  const typeSpeed = 100;
  const deleteSpeed = 50;
  const delayBetweenTexts = 2000;

  function type() {
    const texts = typewriterTexts;
    if (!document.getElementById('typewriter') || !texts.length) return;
    if (count === texts.length) count = 0;
    currentText = texts[count];

    letter = isDeleting ? currentText.slice(0, --index) : currentText.slice(0, ++index);
    document.getElementById('typewriter').textContent = letter;

    let speed = isDeleting ? deleteSpeed : typeSpeed;
    if (!isDeleting && letter.length === currentText.length) {
      speed = delayBetweenTexts;
      isDeleting = true;
    } else if (isDeleting && letter.length === 0) {
      isDeleting = false;
      count++;
      speed = 500;
    }
    setTimeout(type, speed);
  }

  function initInteractions() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const mobileIcon = document.querySelector('.mobile-menu-btn i');

    if (mobileMenuBtn && navLinks && mobileIcon) {
      mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        if (navLinks.classList.contains('active')) {
          mobileIcon.classList.remove('fa-bars');
          mobileIcon.classList.add('fa-times');
        } else {
          mobileIcon.classList.remove('fa-times');
          mobileIcon.classList.add('fa-bars');
        }
      });

      document.querySelectorAll('.nav-links a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          mobileIcon.classList.remove('fa-times');
          mobileIcon.classList.add('fa-bars');
        });
      });
    }

    function reveal() {
      document.querySelectorAll('.reveal, .reveal-right').forEach((item) => {
        const elementTop = item.getBoundingClientRect().top;
        if (elementTop < window.innerHeight - 150) item.classList.add('active');
      });
    }

    window.addEventListener('scroll', reveal);
    reveal();
  }

  function initCounters() {
    const counters = document.querySelectorAll('.stat-num, #stats .skill-category h3');

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          
          if (counter.classList.contains('animated')) return;
          counter.classList.add('animated');

          const text = counter.textContent.trim();
          const match = text.match(/^(\d+)(.*)$/);
          if (!match) return;

          const target = parseInt(match[1], 10);
          const suffix = match[2] || '';
          
          const duration = 3500; // 3.5 seconds
          const frameRate = 30; // ms per frame
          const totalFrames = duration / frameRate;
          const increment = target / totalFrames;
          let current = 0;
          
          counter.textContent = '0' + suffix;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              counter.textContent = target + suffix;
              clearInterval(timer);
            } else {
              counter.textContent = Math.floor(current) + suffix;
            }
          }, frameRate);
          
          obs.unobserve(counter);
        }
      });
    }, { threshold: 0.1 });
    
    counters.forEach(c => observer.observe(c));
  }

  
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
      
      // Try to find the icon from the DOM card that was clicked
      const card = document.querySelector(`.skill-item[data-tech="${techName}"] .skill-icon`);
      iconEl.className = card ? card.className : '';
      
      featuresList.innerHTML = (details.features || []).map(f => `<li>${f}</li>`).join('');
      usecasesList.innerHTML = (details.useCases || []).map(u => `<li>${u}</li>`).join('');

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // prevent scrolling
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

  hydrateFromApi().finally(() => {
    initThemeToggle();
    initInteractions();
    initCounters();
    initTechModals();
    setTimeout(type, 1000);
  });
});
