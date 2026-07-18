#!/usr/bin/env node
// Zero-dependency static index generator: snapshots/**/*.json -> docs/index.html
// Run: node scripts/generate-index.mjs

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SNAPSHOTS_DIR = join(ROOT, 'snapshots');
const DOCS_DIR = join(ROOT, 'docs');

async function findMetaFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMetaFiles(full)));
    } else if (entry.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

async function fileExists(path) {
  return readFile(path).then(() => true).catch(() => false);
}

async function main() {
  const metaFiles = await findMetaFiles(SNAPSHOTS_DIR);
  const records = [];
  for (const file of metaFiles) {
    const meta = JSON.parse(await readFile(file, 'utf8'));
    const base = file.slice(0, -'.json'.length);
    const hasProof = await fileExists(`${base}.html.ots`);
    records.push({
      ...meta,
      htmlPath: relative(ROOT, `${base}.html`),
      proofPath: hasProof ? relative(ROOT, `${base}.html.ots`) : null,
    });
  }
  records.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));

  const rows = records
    .map(
      (r) => `
    <li class="record">
      <div class="ts">${escapeHtml(r.capturedAt)}</div>
      <a class="title" href="../${r.htmlPath}">${escapeHtml(r.title || r.url)}</a>
      <div class="url">${escapeHtml(r.url)}</div>
      ${r.note ? `<div class="note">${escapeHtml(r.note)}</div>` : ''}
      <div class="meta">sha256: <code>${escapeHtml(r.sha256.slice(0, 12))}…</code>
        ${r.proofPath ? `· <a href="../${r.proofPath}">时间戳证明</a>` : '· 时间戳证明生成中'}
      </div>
    </li>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>Wick — 个人网页索引</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font: 15px/1.5 -apple-system, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #222; }
  h1 { font-size: 20px; }
  ul { padding: 0; }
  .record { list-style: none; border-bottom: 1px solid #eee; padding: 14px 0; }
  .ts { font-size: 12px; color: #999; }
  .title { font-weight: 600; text-decoration: none; color: #111; }
  .url { font-size: 12px; color: #888; word-break: break-all; }
  .note { font-size: 13px; margin-top: 4px; }
  .meta { font-size: 11px; color: #aaa; margin-top: 4px; }
</style>
</head>
<body>
  <h1>Wick — 个人网页索引</h1>
  <p>点状索引，不追求完整——每一条都是当时那一刻手动按下的快照。</p>
  <ul>${rows}</ul>
</body>
</html>
`;

  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(join(DOCS_DIR, 'index.html'), html);
  console.log(`wrote ${records.length} records to docs/index.html`);
}

main();
