import test, { before, after } from 'node:test';
import assert from 'node:assert';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';

const DB = join(tmpdir(), `atlas-test-${Date.now()}.db`);
let base, server;

before(async () => {
  process.env.ATLAS_PORT = '0'; // OS 选空闲端口
  process.env.ATLAS_DB = DB;
  ({ server } = await import('../server/server.js'));
  if (!server.listening) await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  for (const ext of ['', '-wal', '-shm', '-journal']) {
    try {
      rmSync(DB + ext);
    } catch {}
  }
});

const post = (p, b) =>
  fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(
    async (r) => ({ status: r.status, json: await r.json() })
  );
const get = (p) => fetch(base + p).then((r) => r.json());

test('register 写基准线，状态 registered', async () => {
  const { json } = await post('/api/features/f1/register', {
    projectId: 'p1',
    projectName: 'Proj 1',
    declaredScope: ['src/business/'],
    acceptance: 'x',
  });
  assert.equal(json.feature.status, 'registered');
  assert.deepEqual(json.feature.declared_scope, ['src/business/']);
});

test('契约测试 pass → contract=fulfilled 且关联 feature=verified（事实驱动翻牌）', async () => {
  await post('/api/contracts', { projectId: 'p1', id: 'c1', featureId: 'f1', name: 'iface@v1' });
  const { json } = await post('/api/contracts/c1/result', { result: 'pass', actor: 'tester' });
  assert.equal(json.contract.status, 'fulfilled');
  const { feature } = await get('/api/features/f1');
  assert.equal(feature.status, 'verified', 'feature 应被事实(测试通过)驱动成 verified');
});

test('契约测试 fail → contract=broken，不翻成兑现', async () => {
  await post('/api/features/f2/register', { projectId: 'p1', declaredScope: ['src/'] });
  await post('/api/contracts', { projectId: 'p1', id: 'c2', featureId: 'f2', name: 'iface2' });
  const { json } = await post('/api/contracts/c2/result', { result: 'fail' });
  assert.equal(json.contract.status, 'broken');
  const { feature } = await get('/api/features/f2');
  assert.notEqual(feature.status, 'verified');
});

test('submit 越界 → 服务端比对 breach=true，creep 抓到范围外文件', async () => {
  const { json } = await post('/api/features/f1/submit', {
    actualFiles: ['src/business/ok.js', 'src/base/price.js'],
    actor: 'dev',
  });
  assert.equal(json.compare.breach, true);
  assert.deepEqual(json.compare.creep, ['src/base/price.js']);
  assert.equal(json.feature.breach, true);
  assert.equal(json.feature.status, 'submitted');
});

test('没有"宣布完成"的端点：result 只认 pass/fail', async () => {
  const { status } = await post('/api/contracts/c1/result', { result: 'done' });
  assert.equal(status, 400);
});

test('board 汇总全局', async () => {
  const { projects } = await get('/api/board');
  const p = projects.find((x) => x.id === 'p1');
  assert.ok(p);
  assert.ok(p.features.length >= 2);
  assert.ok(p.contracts.length >= 2);
});

test('身份：register 归属到 user，user 被 upsert，成员关系建立', async () => {
  await post('/api/features/f3/register', {
    projectId: 'p2',
    projectName: 'Proj 2',
    declaredScope: ['x/'],
    userId: 'alice',
    userName: 'Alice',
  });
  const { projects, users } = await get('/api/board');
  const alice = users.find((u) => u.id === 'alice');
  assert.ok(alice && alice.name === 'Alice', 'user 应被 upsert 且带展示名');
  const p2 = projects.find((p) => p.id === 'p2');
  assert.equal(p2.features[0].owner, 'alice', 'feature 应归属到 user');
  assert.ok(p2.members.some((m) => m.id === 'alice'), '应记成员关系');
});

test('board 按开发者聚合（feature 数 / 越界数 / 展示名）', async () => {
  await post('/api/features/f4/register', {
    projectId: 'p2',
    declaredScope: ['y/'],
    userId: 'bob',
    userName: 'Bob',
  });
  await post('/api/features/f4/submit', {
    actualFiles: ['z/out.js'],
    userId: 'bob',
    userName: 'Bob',
  });
  const { projects } = await get('/api/board');
  const p2 = projects.find((p) => p.id === 'p2');
  const bob = p2.developers.find((d) => d.userId === 'bob');
  assert.equal(bob.featureCount, 1);
  assert.equal(bob.breachCount, 1, '越界应计入该开发者');
  assert.equal(bob.name, 'Bob');
});

test('里程碑：create + register --milestone，board 按里程碑嵌套（Project▸Milestone▸Feature）', async () => {
  await post('/api/milestones', { projectId: 'p2', id: 'M1', name: '里程碑一' });
  await post('/api/features/f5/register', {
    projectId: 'p2',
    declaredScope: ['m/'],
    userId: 'carol',
    userName: 'Carol',
    milestoneId: 'M1',
  });
  const { projects } = await get('/api/board');
  const p2 = projects.find((p) => p.id === 'p2');
  const ms = p2.milestones.find((m) => m.id === 'M1');
  assert.ok(ms, '应有里程碑 M1');
  assert.equal(ms.name, '里程碑一');
  assert.ok(
    ms.features.some((f) => f.id === 'f5'),
    'feature 应嵌在里程碑下'
  );
  const un = p2.milestones.find((m) => m.id === '__unassigned__');
  assert.ok(un && un.features.length >= 1, '未挂里程碑的 feature 进 unassigned 桶');
});
