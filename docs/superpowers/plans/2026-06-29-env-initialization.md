# Atlas 环境初始化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Atlas 提供可发布、跨平台友好的 Node 22 环境检查与初始化入口。

**Architecture:** 新增 `scripts/env-lib.mjs` 放通用检测与提示逻辑，`scripts/check-env.mjs` 负责严格检查，`scripts/init-env.mjs` 负责给出安装/切换指引。`package.json` 暴露 `check-env`、`init-env`，并在 `server`、`test` 前运行环境检查。

**Tech Stack:** Node ESM、`node:test`、Node 内置模块；不新增第三方依赖。

---

### Task 1: 环境检测核心

**Files:**
- Create: `scripts/env-lib.mjs`
- Create: `test/env-lib.test.mjs`

- [x] **Step 1: Write the failing test**

```js
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
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test --no-warnings test/env-lib.test.mjs`

Expected: FAIL because `scripts/env-lib.mjs` does not exist.

- [x] **Step 3: Write minimal implementation**

Create `scripts/env-lib.mjs` with version comparison, manager-specific suggestions, current-runtime probing, and report formatting.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test --no-warnings test/env-lib.test.mjs`

Expected: PASS.

### Task 2: CLI wrappers and npm entrypoints

**Files:**
- Create: `scripts/check-env.mjs`
- Create: `scripts/init-env.mjs`
- Modify: `package.json`
- Create: `.node-version`
- Create: `.nvmrc`

- [x] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';

test('check-env 在当前 Node 不满足要求时输出清楚错误', () => {
  const run = spawnSync(process.execPath, ['scripts/check-env.mjs'], { encoding: 'utf8' });
  if (process.versions.node.startsWith('22.') || Number(process.versions.node.split('.')[0]) > 22) {
    assert.equal(run.status, 0);
    assert.match(run.stdout, /环境可用/);
  } else {
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Node >= 22\.5\.0/);
  }
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test --no-warnings test/check-env.test.mjs`

Expected: FAIL because `scripts/check-env.mjs` does not exist.

- [x] **Step 3: Write minimal implementation**

Add strict `check-env` wrapper, friendly `init-env` wrapper, package scripts, and version-manager hint files.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test --no-warnings test/check-env.test.mjs`

Expected: PASS in both old and supported Node environments, with different exit expectations.

### Task 3: 文档和完整验证

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`

- [x] **Step 1: Update docs**

Document `npm run init-env`, `npm run check-env`, `.node-version` / `.nvmrc`, and Node 22 requirement before `npm run server`.

- [x] **Step 2: Verify old-Node failure is friendly**

Run: `npm run check-env`

Expected on Node 20: non-zero exit with direct Node 22 guidance, not `ERR_UNKNOWN_BUILTIN_MODULE`.

- [x] **Step 3: Verify supported Node path**

Run with Node 22+: `npm test`

Expected: all tests pass.
