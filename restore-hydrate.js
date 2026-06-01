const fs = require('fs');
let mainJs = fs.readFileSync('main.js', 'utf8');

const hydrateFunction = `
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
      }
    }
  }
`;

// It seems it removed hydrateFromApi completely and replaced it with `catch (localErr) {`
mainJs = mainJs.replace(/      \} catch \(localErr\) \{/, hydrateFunction.trim() + '\n      } catch (localErr) {');
fs.writeFileSync('main.js', mainJs, 'utf8');
