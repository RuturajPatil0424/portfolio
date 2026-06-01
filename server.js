require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const ASSETS_DIR = path.join(ROOT, 'assets');
const PUBLISHED_PATH = path.join(DATA_DIR, 'published.json');
const DRAFT_PATH = path.join(DATA_DIR, 'draft.json');
const MEDIA_PATH = path.join(DATA_DIR, 'media.json');

function ensureFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

ensureFile(MEDIA_PATH, []);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'replace-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));

app.use('/assets', express.static(ASSETS_DIR));
app.use(express.static(ROOT));

const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const folder = ext === 'pdf' ? 'pdf' : 'images';
    const dest = path.join(ASSETS_DIR, folder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_, file, cb) => {
    const clean = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${clean}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /image|pdf|msword|officedocument|text|zip|json/.test(file.mimetype);
    cb(allowed ? null : new Error('Unsupported file type'), allowed);
  }
});

function requireAuth(req, res, next) {
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === expectedUser && password === expectedPass) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ ok: true, username });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (req.session?.authenticated) return res.json({ authenticated: true, username: req.session.username });
  return res.json({ authenticated: false });
});

app.get('/api/content/published', (_, res) => res.json(readJson(PUBLISHED_PATH)));

app.get('/api/content/draft', requireAuth, (_, res) => res.json(readJson(DRAFT_PATH)));

app.put('/api/content/draft', requireAuth, (req, res) => {
  const nextDraft = req.body;
  if (!nextDraft || typeof nextDraft !== 'object') return res.status(400).json({ error: 'Invalid payload' });
  writeJson(DRAFT_PATH, nextDraft);
  res.json({ ok: true });
});

app.post('/api/content/publish', requireAuth, (_, res) => {
  const draft = readJson(DRAFT_PATH);
  writeJson(PUBLISHED_PATH, draft);
  res.json({ ok: true, publishedAt: new Date().toISOString() });
});

app.post('/api/content/reset', requireAuth, (_, res) => {
  const published = readJson(PUBLISHED_PATH);
  writeJson(DRAFT_PATH, published);
  res.json({ ok: true });
});

app.post('/api/media/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const media = readJson(MEDIA_PATH);
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const folder = ext === 'pdf' ? 'pdf' : 'images';
  const item = {
    id: `${Date.now()}`,
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `assets/${folder}/${req.file.filename}`,
    createdAt: new Date().toISOString()
  };
  media.unshift(item);
  writeJson(MEDIA_PATH, media);
  res.json({ ok: true, item });
});

app.get('/api/media/list', requireAuth, (_, res) => {
  res.json(readJson(MEDIA_PATH));
});

app.delete('/api/media/:id', requireAuth, (req, res) => {
  const media = readJson(MEDIA_PATH);
  const index = media.findIndex((m) => m.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Not found' });

  const [item] = media.splice(index, 1);
  const ext = item.filename.split('.').pop().toLowerCase();
  const folder = ext === 'pdf' ? 'pdf' : 'images';
  const filePath = path.join(ASSETS_DIR, folder, item.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  writeJson(MEDIA_PATH, media);
  res.json({ ok: true });
});

app.get('/admin', (_, res) => {
  res.sendFile(path.join(ROOT, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
