// atlas submit —— 收工：抓真实 diff 原样交服务端，由服务端机械比对(声称/承诺 vs 实际)。
// 注意：客户端不下任何"我没越界"的判断；它只交事实。审判在服务端。
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, api } from './api.js';
import { changedFiles, diffText, isGitRepo } from './git.js';

export async function submit(args) {
  const cfg = loadConfig();
  let featureId = args.feature || args.f;
  if (!featureId) {
    // 退回到 register 记下的"当前 feature"——让 Stop hook 能无参自动收工
    const p = join(cfg.projectRoot, '.atlas', 'current');
    if (existsSync(p)) featureId = readFileSync(p, 'utf8').trim();
  }
  if (!featureId)
    throw new Error('没有 --feature，也没有 .atlas/current（先 atlas register）');
  if (!isGitRepo(cfg.projectRoot)) throw new Error('当前不是 git 仓库，拿不到事实源 diff。');

  const actualFiles = changedFiles(cfg.projectRoot);
  const claimedFiles = args.claimed
    ? args.claimed.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const body = {
    actualFiles,
    claimedFiles,
    diffText: diffText(cfg.projectRoot),
    actor: args.owner || cfg.owner,
  };
  const { feature, compare } = await api.post(
    cfg,
    `/api/features/${encodeURIComponent(featureId)}/submit`,
    body
  );

  console.log(`✓ 已交事实  ${feature.id}  状态: ${feature.status}`);
  console.log(`  实际改动 ${actualFiles.length} 个文件`);
  console.log('  ' + compare.summary);
  if (compare.creep.length) console.log('  范围蔓延(自作主张碰的): ' + compare.creep.join(', '));
  if (compare.hidden.length) console.log('  瞒报(说没碰其实碰了): ' + compare.hidden.join(', '));
  if (compare.breach) process.exitCode = 2; // 让 CI/hook 能感知越界
  return { feature, compare };
}
