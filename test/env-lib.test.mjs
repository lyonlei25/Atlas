import test from 'node:test';
import assert from 'node:assert';
import {
  compareVersions,
  isNodeVersionSupported,
  formatEnvironmentReport,
} from '../scripts/env-lib.mjs';

test('compareVersions 按语义版本比较数字段', () => {
  assert.equal(compareVersions('22.5.0', '22.5.0'), 0);
  assert.equal(compareVersions('22.6.0', '22.5.0'), 1);
  assert.equal(compareVersions('22.4.9', '22.5.0'), -1);
  assert.equal(compareVersions('24.0.0', '22.5.0'), 1);
});

test('isNodeVersionSupported 以 22.5.0 为最低版本', () => {
  assert.equal(isNodeVersionSupported('20.20.2'), false);
  assert.equal(isNodeVersionSupported('22.4.0'), false);
  assert.equal(isNodeVersionSupported('22.5.0'), true);
  assert.equal(isNodeVersionSupported('24.0.0'), true);
});

test('formatEnvironmentReport 对缺失 node:sqlite 给出可执行建议', () => {
  const report = formatEnvironmentReport({
    nodeVersion: '20.20.2',
    hasNodeSqlite: false,
    availableManagers: ['brew'],
    platform: 'darwin',
  });
  assert.match(report, /Node >= 22\.5\.0/);
  assert.match(report, /node:sqlite/);
  assert.match(report, /brew install node@22/);
  assert.match(report, /brew link --overwrite node@22/);
});

test('formatEnvironmentReport 优先展示已发现的版本管理器', () => {
  const report = formatEnvironmentReport({
    nodeVersion: '18.20.0',
    hasNodeSqlite: false,
    availableManagers: ['fnm', 'nvm'],
    platform: 'linux',
  });
  assert.match(report, /fnm install 22/);
  assert.match(report, /nvm install 22/);
});
