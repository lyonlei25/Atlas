// 抓真实操作痕迹：实际改了哪些文件 + diff 文本。这是"事实源"，不依赖 Agent 自述。
import { execFileSync } from 'node:child_process';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/** 工作区相对 HEAD 实际改动的文件（含未跟踪新增）。 */
export function changedFiles(cwd = process.cwd()) {
  let out;
  try {
    out = git(['status', '--porcelain=v1', '--untracked-files=all'], cwd);
  } catch (e) {
    throw new Error(`无法读取 git 状态（当前目录是 git 仓库吗？）: ${e.message}`);
  }
  const files = new Set();
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    // 形如 " M path"、"?? path"、"R  old -> new"
    const rest = line.slice(3);
    let path;
    if (rest.includes(' -> ')) {
      const [, to] = rest.split(' -> ');
      path = to.trim().replace(/^"|"$/g, '');
    } else {
      path = rest.trim().replace(/^"|"$/g, '');
    }
    // Atlas 自己的运行时状态永远不算"事实改动"——它是记账，不是 Agent 的活
    if (path === '.atlas' || path.startsWith('.atlas/')) continue;
    files.add(path);
  }
  return [...files];
}

/** diff 文本（已跟踪文件相对 HEAD）。仅作证据预览，比对用的是文件列表。 */
export function diffText(cwd = process.cwd()) {
  try {
    return git(['diff', 'HEAD'], cwd);
  } catch {
    return '';
  }
}

export function isGitRepo(cwd = process.cwd()) {
  try {
    git(['rev-parse', '--is-inside-work-tree'], cwd);
    return true;
  } catch {
    return false;
  }
}
