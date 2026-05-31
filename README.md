# Portfolio + Admin Panel

## Run locally
1. Copy `.env.example` to `.env` and set credentials.
2. Install deps: `npm.cmd install`
3. Start server: `npm.cmd start`
4. Open:
- Public site: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`

## Admin capabilities
- Login protected content management
- Edit full JSON content (all labels, sections, items, order)
- Section visibility/order quick editor
- Draft save / publish / reset workflow
- Media upload, list, delete, and URL copy

## Data files
- `data/published.json` (live public content)
- `data/draft.json` (admin draft content)
- `data/media.json` (uploaded media metadata)

## Notes for GitHub Hosting
GitHub Pages cannot run Node/Express APIs. Use GitHub for static snapshot only.
Use VPS (or local) for full admin/API runtime.
