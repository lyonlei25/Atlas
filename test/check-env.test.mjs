import test from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';

test('check-env 在当前 Node 不满足要求时输出清楚错误', () => {
  const run = spawnSync(process.execPath, ['scripts/check-env.mjs'], { encoding: 'utf8' });
  const [major, minor] = process.versions.node.split('.').map((part) => Number(part));
  const supported = major > 22 || (major === 22 && minor >= 5);

  if (supported) {
    assert.equal(run.status, 0);
    assert.match(run.stdout, /环境可用/);
  } else {
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Node >= 22\.5\.0/);
    assert.doesNotMatch(run.stderr, /ERR_UNKNOWN_BUILTIN_MODULE/);
  }
});

test('init-env 在旧 Node 下给出初始化指引而不是堆栈', () => {
  const run = spawnSync(process.execPath, ['scripts/init-env.mjs'], { encoding: 'utf8' });
  const [major, minor] = process.versions.node.split('.').map((part) => Number(part));
  const supported = major > 22 || (major === 22 && minor >= 5);

  assert.equal(run.status, 0);
  assert.match(run.stdout, /Atlas 环境初始化/);
  if (supported) {
    assert.match(run.stdout, /环境可用/);
  } else {
    assert.match(run.stdout, /Node >= 22\.5\.0/);
  }
  assert.doesNotMatch(run.stderr, /ERR_UNKNOWN_BUILTIN_MODULE/);
});
