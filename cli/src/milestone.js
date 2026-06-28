// atlas milestone —— 管理里程碑（Project ▸ Milestone ▸ Feature 的中间层）。
import { loadConfig, api } from './api.js';

export async function milestone(args, sub) {
  const cfg = loadConfig();

  if (sub === 'create' || sub === 'set') {
    const id = args.id;
    if (!id) throw new Error('用法: atlas milestone create --id <mid> [--name "..."] [--goal "..."] [--status open|frozen|done]');
    const { milestone } = await api.post(cfg, '/api/milestones', {
      projectId: cfg.projectId,
      projectName: cfg.projectName,
      id,
      name: args.name,
      goal: args.goal,
      status: args.status,
      userId: cfg.userId,
      userName: cfg.userName,
    });
    console.log(`✓ 里程碑已登记  [${cfg.projectId}] ${milestone.id}  ${milestone.name}  (${milestone.status})`);
    if (milestone.goal) console.log(`  目标: ${milestone.goal}`);
    return milestone;
  }

  if (sub === 'list' || !sub) {
    const { projects } = await api.get(cfg, '/api/board');
    const p = projects.find((x) => x.id === cfg.projectId);
    const ms = (p?.milestones || []).filter((m) => m.id !== '__unassigned__');
    if (!ms.length) {
      console.log('(本 project 还没有里程碑 —— atlas milestone create --id <mid> --name "...")');
      return;
    }
    console.log(`# ${p.name} [${p.id}] 里程碑`);
    for (const m of ms) console.log(`  ◆ ${m.id}  ${m.name}  (${m.status}) · ${m.features.length} feature`);
    return;
  }

  throw new Error('用法: atlas milestone <create|list> ...');
}
