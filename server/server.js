// Atlas 共享大脑 —— HTTP 服务端（node:http，零外部依赖）。
//
// 铁律（在路由层就守死）：没有任何端点能让 Agent "宣布完成" 直接翻牌。
//   - /register  只写基准线
//   - /submit    只收事实(diff) -> 服务端 compare -> 标红
//   - /contracts/:id/result  只接受测试结果(pass/fail) -> 驱动状态
// 比对永远在服务端 compare.js 做，绝不接受 Agent 的 "我没越界"。

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { openDb } from './db.js';
import { compare } from './compare.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = process.env.ATLAS_PORT || 4317;
const DB_FILE = process.env.ATLAS_DB || join(__dirname, 'atlas.db');

const store = openDb(DB_FILE);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function send(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({ __parseError: true });
      }
    });
  });
}

async function serveStatic(res, urlPath) {
  // 根 -> web 看板；/docs -> 蓝图阅读器
  let rel;
  if (urlPath === '/' || urlPath === '') rel = 'web/index.html';
  else if (urlPath === '/docs' || urlPath === '/docs/') rel = 'docs/site/index.html';
  else if (urlPath.startsWith('/docs/')) rel = 'docs/site/' + urlPath.slice('/docs/'.length);
  else rel = 'web/' + urlPath.replace(/^\//, '');

  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found');
  }
  const buf = await readFile(file);
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(buf);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // ---- API ----
  if (path.startsWith('/api/')) {
    try {
      // GET /api/board
      if (method === 'GET' && path === '/api/board') {
        return send(res, 200, { projects: store.board(), users: store.allUsers() });
      }

      // GET /api/features/:id
      let m;
      if (method === 'GET' && (m = path.match(/^\/api\/features\/([^/]+)$/))) {
        const f = store.getFeature(decodeURIComponent(m[1]));
        if (!f) return send(res, 404, { error: 'feature not found' });
        return send(res, 200, { feature: f, facts: store.factsFor('feature', f.id) });
      }

      // POST /api/features/:id/register
      if (method === 'POST' && (m = path.match(/^\/api\/features\/([^/]+)\/register$/))) {
        const b = await readBody(req);
        const id = decodeURIComponent(m[1]);
        if (!b.projectId) return send(res, 400, { error: 'projectId required' });
        const f = store.registerFeature({
          projectId: b.projectId,
          projectName: b.projectName,
          id,
          name: b.name,
          declaredScope: b.declaredScope || [],
          acceptance: b.acceptance,
          owner: b.owner,
          userId: b.userId,
          userName: b.userName,
          milestoneId: b.milestoneId,
        });
        return send(res, 200, { feature: f });
      }

      // POST /api/milestones —— 建/改里程碑（Project ▸ Milestone ▸ Feature 的中间层）
      if (method === 'POST' && path === '/api/milestones') {
        const b = await readBody(req);
        if (!b.projectId) return send(res, 400, { error: 'projectId required' });
        const ms = store.upsertMilestone({
          projectId: b.projectId,
          projectName: b.projectName,
          id: b.id,
          name: b.name,
          status: b.status,
        });
        store.recordUser({ projectId: b.projectId, userId: b.userId, userName: b.userName });
        return send(res, 200, { milestone: ms });
      }

      // POST /api/features/:id/submit  —— 收事实，服务端比对
      if (method === 'POST' && (m = path.match(/^\/api\/features\/([^/]+)\/submit$/))) {
        const b = await readBody(req);
        const id = decodeURIComponent(m[1]);
        const f = store.getFeature(id);
        if (!f) return send(res, 404, { error: 'feature not found; register first' });
        const cmp = compare({
          declaredScope: f.declared_scope || [],
          actualFiles: b.actualFiles || [],
          claimedFiles: Array.isArray(b.claimedFiles) ? b.claimedFiles : null,
        });
        const updated = store.applySubmission(id, {
          actualFiles: b.actualFiles || [],
          claimedFiles: b.claimedFiles || null,
          diffText: b.diffText,
          compareResult: cmp,
          actor: b.actor,
          userId: b.userId,
          userName: b.userName,
        });
        return send(res, 200, { feature: updated, compare: cmp });
      }

      // POST /api/contracts  —— upsert（注册一份可执行契约）
      if (method === 'POST' && path === '/api/contracts') {
        const b = await readBody(req);
        if (!b.projectId) return send(res, 400, { error: 'projectId required' });
        const c = store.upsertContract({
          projectId: b.projectId,
          projectName: b.projectName,
          id: b.id,
          featureId: b.featureId,
          name: b.name,
          spec: b.spec,
          testCmd: b.testCmd,
        });
        store.recordUser({ projectId: b.projectId, userId: b.userId, userName: b.userName });
        return send(res, 200, { contract: c });
      }

      // POST /api/contracts/:id/result  —— 测试结果驱动状态
      if (method === 'POST' && (m = path.match(/^\/api\/contracts\/([^/]+)\/result$/))) {
        const b = await readBody(req);
        const id = decodeURIComponent(m[1]);
        if (b.result !== 'pass' && b.result !== 'fail')
          return send(res, 400, { error: "result must be 'pass' or 'fail'" });
        const c = store.applyContractResult(id, {
          result: b.result,
          actor: b.actor,
          details: b.details,
          userId: b.userId,
          userName: b.userName,
        });
        if (!c) return send(res, 404, { error: 'contract not found; create it first' });
        return send(res, 200, { contract: c });
      }

      return send(res, 404, { error: 'unknown endpoint', path });
    } catch (err) {
      return send(res, 500, { error: String(err && err.message ? err.message : err) });
    }
  }

  // ---- static (web 看板 + docs 阅读器) ----
  if (method === 'GET') return serveStatic(res, path);
  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Atlas 共享大脑 已启动`);
  console.log(`  看板:   http://localhost:${PORT}/`);
  console.log(`  蓝图:   http://localhost:${PORT}/docs`);
  console.log(`  API:    http://localhost:${PORT}/api/board`);
  console.log(`  DB:     ${DB_FILE}`);
});

export { server };
