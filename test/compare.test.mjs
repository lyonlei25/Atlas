import test from 'node:test';
import assert from 'node:assert';
import { compare, matchesAny } from '../server/compare.js';

test('范围内改动 = 干净，不标红', () => {
  const r = compare({
    declaredScope: ['src/', 'README.md'],
    actualFiles: ['src/a.js', 'src/sub/b.js', 'README.md'],
  });
  assert.equal(r.breach, false);
  assert.deepEqual(r.creep, []);
  assert.equal(r.clean.length, 3);
});

test('改了声明范围外的文件 = 范围蔓延，标红', () => {
  const r = compare({
    declaredScope: ['src/business/'],
    actualFiles: ['src/business/x.js', 'src/base/price.js'],
  });
  assert.equal(r.breach, true);
  assert.deepEqual(r.creep, ['src/base/price.js']);
  assert.deepEqual(r.clean, ['src/business/x.js']);
});

test('实际改了但自陈没提 = 瞒报，标红', () => {
  const r = compare({
    declaredScope: ['src/'],
    actualFiles: ['src/a.js', 'src/secret.js'],
    claimedFiles: ['src/a.js'],
  });
  assert.equal(r.breach, true);
  assert.deepEqual(r.hidden, ['src/secret.js']);
});

test('不传 claimedFiles 时不做瞒报判定', () => {
  const r = compare({ declaredScope: ['src/'], actualFiles: ['src/a.js'] });
  assert.deepEqual(r.hidden, []);
});

test('glob: * 不跨目录', () => {
  assert.equal(matchesAny('src/a.js', ['src/*.js']), true);
  assert.equal(matchesAny('src/sub/a.js', ['src/*.js']), false);
});

test('glob: ** 跨目录', () => {
  assert.equal(matchesAny('src/sub/a.js', ['src/**']), true);
});

test('精确路径匹配', () => {
  assert.equal(matchesAny('package.json', ['package.json']), true);
  assert.equal(matchesAny('pkg/package.json', ['package.json']), false);
});

test('./ 前缀归一化', () => {
  const r = compare({ declaredScope: ['./src/'], actualFiles: ['src/a.js'] });
  assert.equal(r.breach, false);
});
