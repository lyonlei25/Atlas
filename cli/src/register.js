// atlas register —— 开工：声明范围(基准线) + 验收。对应 L3 硬锚 / 看板"承诺"。
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, api } from './api.js';

export async function register(args) {
  const cfg = loadConfig();
  const featureId = args.feature || args.f;
  if (!featureId) throw new Error('用法: atlas register --feature <id> --files a.js,src/ [--acceptance "..."]');
  const declaredScope = (args.files || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (declaredScope.length === 0)
    console.warn('⚠ 没声明 --files：基准线为空，收工时任何改动都会算越界。');

  const body = {
    projectId: cfg.projectId,
    projectName: cfg.projectName,
    name: args.name || featureId,
    declaredScope,
    acceptance: args.acceptance || null,
    milestoneId: args.milestone || null,
    userId: cfg.userId,
    userName: cfg.userName,
    owner: args.owner || cfg.userId,
  };
  const { feature } = await api.post(cfg, `/api/features/${encodeURIComponent(featureId)}/register`, body);

  // 记下"当前 feature"，让收工 hook / submit 无需再传 id，事实源不依赖 Agent 自觉。
  try {
    const dir = join(cfg.projectRoot, '.atlas');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'current'), featureId);
  } catch {
    /* 写不了就算了，不影响主流程 */
  }

  console.log(`✓ 已登记基准线  [${cfg.projectId}] ${feature.id}`);
  if (feature.milestone_id) console.log(`  里程碑: ${feature.milestone_id}`);
  console.log(`  开发者: ${cfg.userName} (${cfg.userId})`);
  console.log(`  范围: ${declaredScope.join(', ') || '(空)'}`);
  if (feature.acceptance) console.log(`  验收: ${feature.acceptance}`);
  console.log(`  状态: ${feature.status}`);
  return feature;
}
