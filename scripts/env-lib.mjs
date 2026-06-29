import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const MIN_NODE_VERSION = '22.5.0';

function versionParts(version) {
  return String(version || '')
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

export function compareVersions(actual, required) {
  const a = versionParts(actual);
  const b = versionParts(required);
  const max = Math.max(a.length, b.length, 3);
  for (let i = 0; i < max; i++) {
    const left = a[i] || 0;
    const right = b[i] || 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

export function isNodeVersionSupported(version = process.versions.node) {
  return compareVersions(version, MIN_NODE_VERSION) >= 0;
}

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 && result.stdout.trim().length > 0;
}

export function detectAvailableManagers({ env = process.env, platform = process.platform } = {}) {
  const managers = [];
  if (commandExists('fnm')) managers.push('fnm');
  if (commandExists('volta')) managers.push('volta');
  if (commandExists('asdf')) managers.push('asdf');

  const nvmDir = env.NVM_DIR || join(env.HOME || '', '.nvm');
  if (commandExists('nvm') || existsSync(join(nvmDir, 'nvm.sh'))) managers.push('nvm');

  if (platform === 'darwin' && commandExists('brew')) managers.push('brew');
  return [...new Set(managers)];
}

export async function probeNodeSqlite() {
  const result = spawnSync(process.execPath, ['--no-warnings', '-e', "import('node:sqlite')"], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

export async function collectEnvironment() {
  return {
    nodeVersion: process.versions.node,
    hasNodeSqlite: await probeNodeSqlite(),
    availableManagers: detectAvailableManagers(),
    platform: process.platform,
  };
}

export function isEnvironmentReady(env) {
  return isNodeVersionSupported(env.nodeVersion) && env.hasNodeSqlite;
}

function managerCommands(manager) {
  switch (manager) {
    case 'fnm':
      return ['fnm install 22', 'fnm use 22'];
    case 'nvm':
      return ['nvm install 22', 'nvm use 22'];
    case 'volta':
      return ['volta pin node@22'];
    case 'asdf':
      return ['asdf install nodejs 22.5.0', 'asdf local nodejs 22.5.0'];
    case 'brew':
      return ['brew install node@22', 'brew link --overwrite node@22'];
    default:
      return [];
  }
}

export function formatEnvironmentReport({
  nodeVersion,
  hasNodeSqlite,
  availableManagers = [],
  platform = process.platform,
}) {
  const lines = [
    `Atlas 需要 Node >= ${MIN_NODE_VERSION}，并且运行时必须能加载 node:sqlite。`,
    `当前 Node: ${nodeVersion ? `v${nodeVersion}` : '未检测到'}`,
    `node:sqlite: ${hasNodeSqlite ? '可用' : '不可用'}`,
    '',
    '建议修复方式：',
  ];

  const managers = availableManagers.length
    ? availableManagers
    : platform === 'darwin'
      ? ['brew']
      : [];

  if (managers.length) {
    for (const manager of managers) {
      const commands = managerCommands(manager);
      if (!commands.length) continue;
      lines.push(`- 使用 ${manager}:`);
      for (const command of commands) lines.push(`  ${command}`);
    }
  }

  lines.push('- 或从 https://nodejs.org/ 下载 Node 22 LTS。');
  lines.push('');
  lines.push('安装或切换后重新运行：npm run check-env');
  return lines.join('\n');
}

export function formatOkReport({ nodeVersion }) {
  return `Atlas 环境可用：Node v${nodeVersion}，node:sqlite 可用。`;
}
