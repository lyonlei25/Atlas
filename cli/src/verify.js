// atlas verify —— 事实闸门：把测试/CI 结果当事实交看板，驱动 feature 进「完成」。
// 任何 CI 或本地都能调，不绑平台。done 还要求无越界（服务端守）。
import { spawnSync } from 'node:child_process';
import { loadConfig, api } from './api.js';

export async function verify(args) {
  const cfg = loadConfig();
  const featureId = args.feature || args.f;
  if (!featureId) throw new Error('用法: atlas verify --feature <id> --cmd "<测试命令>" | --result pass|fail');

  let result = args.result;
  if (!result && args.cmd) {
    console.log(`▶ 跑验收测试: ${args.cmd}`);
    const run = spawnSync(args.cmd, { shell: true, stdio: 'inherit', cwd: cfg.projectRoot });
    result = run.status === 0 ? 'pass' : 'fail';
  }
  if (result !== 'pass' && result !== 'fail') throw new Error('需要 --cmd "<命令>" 或 --result pass|fail');

  const r = await api.post(cfg, `/api/features/${encodeURIComponent(featureId)}/verify`, {
    result,
    userId: cfg.userId,
    userName: cfg.userName,
  });
  if (r.done) {
    console.log(`✓ 测试通过 + 无越界 → ${featureId} 进「完成」(done)`);
  } else {
    console.log(`✗ 未进「完成」：${r.reason || result}`);
    process.exitCode = 2;
  }
  return r;
}
