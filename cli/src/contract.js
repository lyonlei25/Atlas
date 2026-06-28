// atlas contract —— 可执行契约：跑测试，由"测试通过/失败"这个事实驱动服务端状态。
// 这是整套体系信息含量最高的一块（蓝图 06）：状态不是谁宣布的，是测试翻的。
import { spawnSync } from 'node:child_process';
import { loadConfig, api } from './api.js';

export async function contract(args, sub) {
  const cfg = loadConfig();

  if (sub === 'create') {
    const id = args.id;
    if (!id) throw new Error('用法: atlas contract create --id <cid> [--feature <fid>] [--name ..] [--cmd ..] [--spec ..]');
    const { contract } = await api.post(cfg, '/api/contracts', {
      projectId: cfg.projectId,
      projectName: cfg.projectName,
      id,
      featureId: args.feature || null,
      name: args.name || id,
      spec: args.spec || null,
      testCmd: args.cmd || null,
    });
    console.log(`✓ 契约已登记  ${contract.id}  状态: ${contract.status}`);
    return contract;
  }

  if (sub === 'run') {
    const id = args.id;
    const cmd = args.cmd;
    if (!id || !cmd)
      throw new Error('用法: atlas contract run --id <cid> --cmd "node --test contract/" [--feature <fid>]');

    // 先确保契约在看板存在（可执行契约住看板，不住对话）
    await api.post(cfg, '/api/contracts', {
      projectId: cfg.projectId,
      projectName: cfg.projectName,
      id,
      featureId: args.feature || null,
      name: args.name || id,
      spec: args.spec || null,
      testCmd: cmd,
    });

    console.log(`▶ 跑契约测试: ${cmd}`);
    const run = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: cfg.projectRoot });
    const result = run.status === 0 ? 'pass' : 'fail';

    const { contract } = await api.post(cfg, `/api/contracts/${encodeURIComponent(id)}/result`, {
      result,
      actor: args.owner || cfg.owner,
      details: { exitCode: run.status, cmd },
    });
    console.log(
      result === 'pass'
        ? `✓ 测试通过 → 服务端翻牌: contract=${contract.status}（关联 feature 随之 verified）`
        : `✗ 测试失败 → contract=${contract.status}（状态不会翻成兑现）`
    );
    if (result === 'fail') process.exitCode = 2;
    return contract;
  }

  throw new Error('用法: atlas contract <create|run> ...');
}
