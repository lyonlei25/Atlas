// atlas board —— 读全局看板 / 单 feature 状态。
import { loadConfig, api } from './api.js';

const ICON = {
  backlog: '·',
  planned: '○',
  in_progress: '◐',
  in_review: '◑',
  done: '●',
  blocked: '⛔',
  drafted: '○',
  fulfilled: '●',
  broken: '✗',
};

export async function board(args) {
  const cfg = loadConfig();

  if (args.feature || args.f) {
    const id = args.feature || args.f;
    const { feature, facts } = await api.get(cfg, `/api/features/${encodeURIComponent(id)}`);
    console.log(`# ${feature.id}  [${feature.project_id}]`);
    console.log(`  状态: ${ICON[feature.status] || ''} ${feature.status}${feature.breach ? '  ⚠ 越界' : ''}`);
    console.log(`  范围: ${(feature.declared_scope || []).join(', ') || '(空)'}`);
    if (feature.breach && feature.breach_detail) {
      if (feature.breach_detail.creep?.length) console.log(`  范围蔓延: ${feature.breach_detail.creep.join(', ')}`);
      if (feature.breach_detail.hidden?.length) console.log(`  瞒报: ${feature.breach_detail.hidden.join(', ')}`);
    }
    console.log(`  事实流水: ${facts.length} 条`);
    for (const f of facts.slice(0, 8)) console.log(`    · ${f.created_at}  ${f.kind}  by ${f.actor || '?'}`);
    return;
  }

  const { projects } = await api.get(cfg, '/api/board');
  if (projects.length === 0) {
    console.log('(看板还是空的 —— 先 atlas register 一个 feature)');
    return;
  }
  // 主结构：项目 ▸ 里程碑 ▸ feature(▸ 契约)；开发者作为 feature 上的标签
  for (const p of projects) {
    const devCount = (p.developers || []).length;
    console.log(`\n# ${p.name}  [${p.id}]  · ${devCount} 人`);
    const milestones = p.milestones || [];
    if (milestones.length === 0 && p.contracts.length === 0) {
      console.log('  (空)');
      continue;
    }
    for (const m of milestones) {
      const tag = m.status && m.id !== '__unassigned__' ? ` (${m.status})` : '';
      console.log(`  ◆ ${m.name}${tag}`);
      if (!m.features.length) console.log('      (无 feature)');
      for (const f of m.features) {
        const who = f.owner ? `  @${f.owner}` : '';
        const flag = f.breach ? '  ⚠ 越界' : '';
        console.log(`      ${ICON[f.status] || ' '} ${f.status.padEnd(11)} ${f.name}${who}${flag}`);
      }
    }
    if (p.contracts.length) {
      console.log('  ◇ 契约');
      for (const c of p.contracts) {
        console.log(`      ${ICON[c.status] || ' '} ${c.status.padEnd(9)} ${c.name}`);
      }
    }
  }
}
