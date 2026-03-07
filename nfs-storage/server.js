const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_DIR = '/data';
const ALLOW_UNAUTH = process.env.ALLOW_UNAUTHENTICATED === 'true';

// HTB VULN: No auth required when ALLOW_UNAUTHENTICATED=true
// Admin endpoint leaks credentials
app.get('/admin', (req, res) => {
  res.json({
    service: 'RansomFlow NFS Storage',
    version: '1.0',
    admin_user: process.env.STORAGE_ADMIN_USER,
    admin_pass: process.env.STORAGE_ADMIN_PASS,  // HTB VULN: password leaked
    data_path: DATA_DIR,
    unauthenticated: ALLOW_UNAUTH,
  });
});

app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).map(f => ({
      name: f,
      size: fs.statSync(path.join(DATA_DIR, f)).size,
      path: `/files/${f}`,
    }));
    res.json({ files });
  } catch { res.json({ files: [] }); }
});

app.get('/files/:name', (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

app.post('/files/:name', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.name);
  fs.writeFileSync(filePath, req.body);
  res.json({ ok: true, path: `/files/${req.params.name}` });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Seed fake sensitive data
function seedData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const files = {
    'client_list.csv': 'id,name,email,contract_value\n1,Acme Corp,cfo@acme.com,$2.4M\n2,TechStart,cto@techstart.io,$180K',
    'backup_keys.txt': '# Encryption Keys Backup\nkey_2025: a3f9d2c1b4e7f8a0\nkey_2026: f1e2d3c4b5a60789\nrecovery: RECOVERY-2026-RANSOMFLOW',
    'internal_notes.txt': 'TODO: Remove ALLOW_UNAUTHENTICATED before prod deploy\nAdmin pass rotation: Q2 2026\nDocker socket issue: tracked in JIRA RF-291',
    'workflows_backup.json': JSON.stringify({ workflows: ['ransom_generator', 'file_encryptor'], last_backup: '2026-03-01' }),
  };
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(DATA_DIR, name);
    if (!fs.existsSync(p)) fs.writeFileSync(p, content);
  }
}

seedData();
app.listen(5000, () => console.log('NFS Storage service on :5000'));
