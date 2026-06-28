// 一键演示最小纵切（蓝图 06）。需要先启动服务端：npm run server
//   1) register 声明范围(基准线)
//   2) 跑契约测试 → 通过这个【事实】驱动服务端翻牌 contract=fulfilled / feature=verified
//   3) 业务模块读到事实状态才把占位符替换成真实基础模块
//   4) 注入越界 → submit 真实改动 → 服务端机械比对 → 标红
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render } from './business-module/dashboard.mjs';

const SERVER = (process.env.ATLAS_SERVER || 'http://localhost:4317').replace(/\/$/, '');
const PROJECT = 'atlas-demo';
const __dirname = dirname(fileURLToPath(import.meta.url));

async function post(path, body) {
  const res = await fetch(SERVER + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${json.error || ''}`);
  return json;
}

const line = (s = '') => console.log(s);
const h = (s) => line('\n\x1b[1m' + s + '\x1b[0m');

async function main() {
  // 探活
  try {
    await fetch(SERVER + '/api/board');
  } catch {
    line(`✗ 连不上服务端 ${SERVER}。先开另一个终端跑: npm run server`);
    process.exit(1);
  }

  h('① register —— 声明范围(基准线)');
  await post('/api/features/quote-feature/register', {
    projectId: PROJECT,
    projectName: 'Atlas Demo',
    name: '报价 feature（基础+业务+契约）',
    declaredScope: ['examples/slice/base-module/', 'examples/slice/business-module/', 'examples/slice/contract/'],
    acceptance: '业务模块能拿到真实报价；基础模块兑现 quote-provider@v1',
    owner: 'demo',
  });
  line('  ✓ quote-feature 已登记，状态 registered');

  h('② 替换前 —— 业务模块此刻该用占位符（契约尚未兑现）');
  const before = await render(SERVER, 'quote-contract', 'NVDA');
  line(`  数据源: ${before.source}`);
  line(`  报价: ${JSON.stringify(before.quote)}`);

  h('③ 跑可执行契约测试 —— 让【事实】驱动状态');
  // 先把契约登记进看板（住看板，不住对话）
  await post('/api/contracts', {
    projectId: PROJECT,
    id: 'quote-contract',
    featureId: 'quote-feature',
    name: 'quote-provider@v1',
    spec: 'getQuote(symbol) -> {symbol,price>0,currency}',
    testCmd: 'node --test contract/quote.test.mjs',
  });
  const testRun = spawnSync('node', ['--test', join(__dirname, 'contract', 'quote.test.mjs')], {
    encoding: 'utf8',
  });
  const result = testRun.status === 0 ? 'pass' : 'fail';
  line(`  契约测试结果(事实): ${result}`);
  const { contract } = await post('/api/contracts/quote-contract/result', {
    result,
    actor: 'demo',
    details: { exitCode: testRun.status },
  });
  line(`  → 服务端翻牌: contract=${contract.status}（feature 随之 verified）`);

  h('④ 替换后 —— 业务模块读到事实状态，自动换成真实基础模块');
  const after = await render(SERVER, 'quote-contract', 'NVDA');
  line(`  数据源: ${after.source}`);
  line(`  报价: ${JSON.stringify(after.quote)}`);
  if (after.source.startsWith('REAL')) line('  ✓ 占位符已被替换 —— 由事实(契约兑现)触发，不是谁通知的');

  h('⑤ 注入越界 —— diff 机械比对抓"自作主张碰了范围外的东西"');
  await post('/api/features/scoped-feature/register', {
    projectId: PROJECT,
    projectName: 'Atlas Demo',
    name: '只该改业务模块的小改动',
    declaredScope: ['examples/slice/business-module/dashboard.mjs'],
    acceptance: '只动 dashboard.mjs',
    owner: 'demo',
  });
  // 模拟"实际改动"：除了声明的 dashboard.mjs，还顺手动了范围外的基础模块
  const { compare } = await post('/api/features/scoped-feature/submit', {
    actualFiles: ['examples/slice/business-module/dashboard.mjs', 'examples/slice/base-module/price-service.mjs'],
    diffText: '(demo synthetic diff)',
    actor: 'demo',
  });
  line(`  ${compare.summary}`);
  if (compare.creep.length) line('  范围蔓延(没声明却改了): ' + compare.creep.join(', '));
  line('  → 看板上 scoped-feature 会标红，不用读代码就能看到');

  h('完成。打开看板看全局：' + SERVER + '/');
}

main().catch((e) => {
  console.error('✗ ' + e.message);
  process.exit(1);
});
