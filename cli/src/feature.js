// atlas feature —— 设 feature 的意图状态（backlog/planned/in_progress/in_review/blocked）。
// done 不在此列：必须经 atlas verify（事实），服务端会拒绝手动设 done。
import { loadConfig, api } from './api.js';

export async function feature(args, sub) {
  const cfg = loadConfig();

  if (sub === 'status') {
    const id = args.feature || args.f;
    const status = args.status;
    if (!id || !status)
      throw new Error(
        '用法: atlas feature status --feature <id> --status <backlog|planned|in_progress|in_review|blocked>'
      );
    const r = await api.post(cfg, `/api/features/${encodeURIComponent(id)}/status`, { status });
    console.log(`✓ ${id} → ${r.feature.status}`);
    return r;
  }

  throw new Error('用法: atlas feature status --feature <id> --status <state>');
}
