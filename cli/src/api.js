// 配置发现 + 服务端 HTTP 客户端。CLI 是 Claude Code / Codex / 人 / CI 共享的接口。
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

const DEFAULTS = {
  serverUrl: process.env.ATLAS_SERVER || 'http://localhost:4317',
  projectId: null,
  projectName: null,
  owner: process.env.ATLAS_OWNER || process.env.USER || 'unknown',
};

/** 从 cwd 向上找 atlas.config.json，合并默认值与环境变量。 */
export function loadConfig(startDir = process.cwd()) {
  let dir = startDir;
  const { root } = parse(dir);
  let found = null;
  while (true) {
    const p = join(dir, 'atlas.config.json');
    if (existsSync(p)) {
      found = p;
      break;
    }
    if (dir === root) break;
    dir = dirname(dir);
  }
  let fileCfg = {};
  if (found) {
    try {
      fileCfg = JSON.parse(readFileSync(found, 'utf8'));
    } catch (e) {
      throw new Error(`atlas.config.json 解析失败 (${found}): ${e.message}`);
    }
  }
  const cfg = { ...DEFAULTS, ...fileCfg, configPath: found, projectRoot: found ? dirname(found) : startDir };
  if (process.env.ATLAS_SERVER) cfg.serverUrl = process.env.ATLAS_SERVER;
  if (!cfg.projectId) {
    cfg.projectId = found ? require_basename(dirname(found)) : require_basename(startDir);
  }
  if (!cfg.projectName) cfg.projectName = cfg.projectId;
  return cfg;
}

function require_basename(d) {
  return d.split(/[\\/]/).filter(Boolean).pop() || 'project';
}

async function http(method, cfg, path, body) {
  const url = cfg.serverUrl.replace(/\/$/, '') + path;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`连不上 Atlas 服务端 ${url}\n  先启动: npm run server\n  原因: ${e.message}`);
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`服务端 ${res.status}: ${json.error || text}`);
  return json;
}

export const api = {
  get: (cfg, path) => http('GET', cfg, path),
  post: (cfg, path, body) => http('POST', cfg, path, body),
};
