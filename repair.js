const fs = require('fs');
let mainJs = fs.readFileSync('main.js', 'utf8');

const correctCertSection = `          </div>
          <div class="certifications glass-panel reveal mt-4">
            <h3><i class="fas fa-certificate"></i> \${esc(skills.certificationsTitle || 'Certifications')}</h3>
            <div class="cert-grid">
              \${(data.certificates || []).map((c) => \`
                <article class="cert-card">
                  <p class="project-overline">\${esc(c.issuer || 'Certification')}</p>
                  <h4>\${esc(c.title || '')}</h4>
                  <p class="cert-short">\${esc(c.description || '')}</p>
                  <div class="project-links">
                    <a class="btn btn-secondary btn-small" href="\${detailUrl('certificate', c.id)}">View</a>
                  </div>
                </article>
              \`).join('')}
            </div>
          </div>
        \`);
      }
    }

    const projectsSec = sectionMap.projects;`;

// Find where the skills section ends
mainJs = mainJs.replace(/            `\)\.join\(''\)}\r?\n          <\/div>\r?\n    if \(projectsSec\) \{/, 
  '            `).join(\'\')}\n' + correctCertSection + '\n    if (projectsSec) {');

fs.writeFileSync('main.js', mainJs, 'utf8');
console.log('Fixed main.js');
