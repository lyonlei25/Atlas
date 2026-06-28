// atlas board —— 读全局看板 / 单 feature 状态。
import { loadConfig, api } from './api.js';

const ICON = {
  registered: '○',
  in_progress: '◐',
  submitted: '◑',
  verified: '●',
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
  for (const p of projects) {
    console.log(`\n# ${p.name}  [${p.id}]`);
    if (p.features.length === 0 && p.contracts.length === 0) {
      console.log('  (空)');
      continue;
    }
    // 按开发者分组（"看全局所有开发人员"）
    const nameOf = Object.fromEntries((p.developers || []).map((d) => [d.userId, d.name]));
    const groups = {};
    for (const f of p.features) (groups[f.owner || '(未指派)'] ||= []).push(f);
    for (const [uid, feats] of Object.entries(groups)) {
      const dev = (p.developers || []).find((d) => d.userId === uid);
      const summary = dev
        ? `${dev.featureCount} feature${dev.verifiedCount ? ` · ${dev.verifiedCount} verified` : ''}${dev.breachCount ? ` · ⚠ ${dev.breachCount} 越界` : ''}`
        : '';
      console.log(`  ▸ ${nameOf[uid] || uid}  ${summary}`);
      for (const f of feats) {
        const flag = f.breach ? '  ⚠ 越界' : '';
        console.log(`      ${ICON[f.status] || ' '} ${f.status.padEnd(11)} ${f.name}${flag}`);
      }
    }
    if (p.contracts.length) {
      console.log('  ▸ 契约');
      for (const c of p.contracts) {
        console.log(`      ${ICON[c.status] || ' '} ${c.status.padEnd(9)} ${c.name}`);
      }
    }
  }
}
