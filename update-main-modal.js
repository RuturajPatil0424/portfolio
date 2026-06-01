const fs = require('fs');

let code = fs.readFileSync('main.js', 'utf8');

// 1. Expose global data
code = code.replace(/const data = await res\.json\(\);\s+renderPublished\(data\);/g, 
  "const data = await res.json();\n      window.globalData = data;\n      renderPublished(data);");

// 2. Add data-tech
code = code.replace(/<div class="skill-item">/g, '<div class="skill-item" data-tech="${esc(it.name || \'\')}">');

// 3. Add initTechModals and call it
const modalLogic = `
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
      const card = document.querySelector(\`.skill-item[data-tech="\${techName}"] .skill-icon\`);
      iconEl.className = card ? card.className : '';
      
      featuresList.innerHTML = (details.features || []).map(f => \`<li>\${f}</li>\`).join('');
      usecasesList.innerHTML = (details.useCases || []).map(u => \`<li>\${u}</li>\`).join('');

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
`;

code = code.replace(/hydrateFromApi\(\)\.finally\(\(\) => \{/, 
  modalLogic + '\n  hydrateFromApi().finally(() => {');

code = code.replace(/initCounters\(\);\s+setTimeout\(type, 1000\);/, 
  'initCounters();\n    initTechModals();\n    setTimeout(type, 1000);');

fs.writeFileSync('main.js', code, 'utf8');
console.log('Successfully updated main.js with modal logic!');
