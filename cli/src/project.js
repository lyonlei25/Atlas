// atlas project —— 设/看项目层信息（目标 / wiki），让项目层不再是空壳。
import { loadConfig, api } from './api.js';

export async function project(args, sub) {
  const cfg = loadConfig();

  if (sub === 'set') {
    const { project } = await api.post(cfg, '/api/projects', {
      projectId: cfg.projectId,
      name: args.name,
      goal: args.goal,
      wiki: args.wiki,
      userId: cfg.userId,
      userName: cfg.userName,
    });
    console.log(`✓ 项目信息已更新  [${project.id}] ${project.name}`);
    if (project.goal) console.log(`  目标: ${project.goal}`);
    if (project.wiki) console.log(`  wiki: ${project.wiki}`);
    return project;
  }

  if (sub === 'show' || !sub) {
    const { projects } = await api.get(cfg, '/api/board');
    const p = projects.find((x) => x.id === cfg.projectId);
    if (!p) {
      console.log('(本 project 还不存在 —— 先 atlas register 或 atlas project set)');
      return;
    }
    console.log(`# ${p.name}  [${p.id}]`);
    console.log(`  目标: ${p.goal || '(未设，用 atlas project set --goal "...")'}`);
    console.log(`  wiki: ${p.wiki || '(未设)'}`);
    console.log(`  进度: ${p.progress.done}/${p.progress.total} 完成 (${p.progress.pct}%)${p.progress.breach ? ` · ⚠ ${p.progress.breach} 越界` : ''}`);
    return;
  }

  throw new Error('用法: atlas project <set|show> [--goal "..."] [--wiki "..."]');
}
