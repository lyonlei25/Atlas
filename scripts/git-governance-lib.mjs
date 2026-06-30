const SLUG = "[a-z0-9][a-z0-9-]*[a-z0-9]";
const SHORT_SLUG = "[a-z0-9]";

const slugPart = `(?:${SLUG}|${SHORT_SLUG})`;

const patterns = [
  { type: "main", regex: /^main$/ },
  { type: "release", regex: /^release$/ },
  {
    type: "milestone",
    regex: new RegExp(`^milestone\\/([a-z][a-z0-9]*)-(${slugPart})$`),
  },
  {
    type: "feature",
    regex: new RegExp(`^feature\\/([a-z][a-z0-9]*)-(${slugPart})$`),
  },
  {
    type: "release-fix",
    regex: new RegExp(`^fix\\/release-(${slugPart})$`),
  },
  {
    type: "fix",
    regex: new RegExp(`^fix\\/([a-z][a-z0-9]*)-(${slugPart})$`),
  },
  {
    type: "codex",
    regex: new RegExp(`^codex\\/(${slugPart})$`),
  },
];

const commitMessagePattern =
  /^(feat|fix|docs|chore|test|refactor|ci|build|perf|style)(\([a-z0-9._/-]+\))?: .{2,}$/;

const generatedCommitPatterns = [
  /^Merge /,
  /^Revert /,
  /^fixup! /,
  /^squash! /,
];

const forbiddenPathPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)\.atlas(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)atlas\.db($|[-.])/,
  /\.db$/,
  /\.db-(journal|wal|shm)$/,
  /\.log$/,
];

export function classifyBranch(branchName) {
  for (const pattern of patterns) {
    const match = pattern.regex.exec(branchName);
    if (!match) continue;

    if (pattern.type === "milestone" || pattern.type === "feature" || pattern.type === "fix") {
      return {
        type: pattern.type,
        branchName,
        milestone: match[1],
        slug: match[2],
      };
    }

    return {
      type: pattern.type,
      branchName,
      slug: match[1] ?? null,
    };
  }

  return { type: "invalid", branchName };
}

export function validateBranchName(branchName) {
  const branch = classifyBranch(branchName);
  if (branch.type !== "invalid") {
    return { ok: true, branch };
  }

  return {
    ok: false,
    branch,
    message:
      "分支名不符合 Atlas 规范。允许：main、release、milestone/<id>-<name>、feature/<milestone>-<feature>、fix/<milestone>-<bug>、fix/release-<bug>、codex/<name>。",
  };
}

export function validatePullRequestTarget(headName, baseName) {
  const head = classifyBranch(headName);
  const base = classifyBranch(baseName);

  if (head.type === "invalid") {
    return { ok: false, message: `来源分支不符合规范：${headName}` };
  }

  if (base.type === "invalid") {
    return { ok: false, message: `目标分支不符合规范：${baseName}` };
  }

  if (head.type === "feature") {
    const ok = base.type === "milestone" && head.milestone === base.milestone;
    return {
      ok,
      message: ok
        ? ""
        : `feature/${head.milestone}-* 只能合入 milestone/${head.milestone}-*，当前目标是 ${baseName}。`,
    };
  }

  if (head.type === "fix") {
    const ok = base.type === "milestone" && head.milestone === base.milestone;
    return {
      ok,
      message: ok
        ? ""
        : `fix/${head.milestone}-* 只能合入 milestone/${head.milestone}-*，当前目标是 ${baseName}。`,
    };
  }

  if (head.type === "release-fix") {
    const ok = base.type === "release";
    return {
      ok,
      message: ok ? "" : `fix/release-* 只能合入 release，当前目标是 ${baseName}。`,
    };
  }

  if (head.type === "milestone") {
    const ok = base.type === "release";
    return {
      ok,
      message: ok ? "" : `milestone/* 只能整体验证后合入 release，当前目标是 ${baseName}。`,
    };
  }

  if (head.type === "release") {
    const ok = base.type === "main";
    return {
      ok,
      message: ok ? "" : `release 只能作为归档快照合入 main，当前目标是 ${baseName}。`,
    };
  }

  if (head.type === "codex") {
    return {
      ok: false,
      message: "codex/* 只能作为临时工作分支；进入 PR 前请转为 feature/* 或 fix/*。",
    };
  }

  return {
    ok: false,
    message: `${headName} 不应作为 PR 来源分支。`,
  };
}

export function validateLocalCommitBranch(branchName) {
  const branch = classifyBranch(branchName);
  if (branch.type === "main" || branch.type === "release" || branch.type === "milestone") {
    return {
      ok: false,
      message: `禁止直接在 ${branchName} 提交，请从它切出 feature/* 或 fix/* 分支。`,
    };
  }

  return validateBranchName(branchName);
}

export function validateCommitMessage(message) {
  const line = message
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith("#"));

  if (!line) {
    return { ok: false, message: "提交信息不能为空。" };
  }

  if (generatedCommitPatterns.some((pattern) => pattern.test(line))) {
    return { ok: true };
  }

  if (commitMessagePattern.test(line)) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "提交信息需符合 <type>(<scope>): <中文摘要>，例如 docs(git): 落地 M2 分支治理。",
  };
}

export function findForbiddenPaths(paths) {
  return paths.filter((path) => forbiddenPathPatterns.some((pattern) => pattern.test(path)));
}
