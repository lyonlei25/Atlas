import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyBranch,
  findForbiddenPaths,
  validateCommitMessage,
  validateLocalCommitBranch,
  validatePullRequestTarget,
} from "../scripts/git-governance-lib.mjs";

test("classifyBranch 识别 Atlas 分支模型", () => {
  assert.deepEqual(classifyBranch("main"), {
    type: "main",
    branchName: "main",
    slug: null,
  });
  assert.equal(classifyBranch("release").type, "release");
  assert.deepEqual(classifyBranch("milestone/m2-dogfood"), {
    type: "milestone",
    branchName: "milestone/m2-dogfood",
    milestone: "m2",
    slug: "dogfood",
  });
  assert.equal(classifyBranch("feature/m2-git-flow").type, "feature");
  assert.equal(classifyBranch("fix/release-node22-check").type, "release-fix");
  assert.equal(classifyBranch("Feature/M2-Bad").type, "invalid");
});

test("validatePullRequestTarget 限制 feature 只能回到所属里程碑", () => {
  assert.equal(
    validatePullRequestTarget("feature/m2-git-flow", "milestone/m2-dogfood").ok,
    true,
  );
  assert.equal(validatePullRequestTarget("feature/m2-git-flow", "release").ok, false);
  assert.equal(
    validatePullRequestTarget("feature/m2-git-flow", "milestone/m3-scope-freeze").ok,
    false,
  );
});

test("validatePullRequestTarget 限制里程碑、发布线和热修目标", () => {
  assert.equal(validatePullRequestTarget("milestone/m2-dogfood", "release").ok, true);
  assert.equal(validatePullRequestTarget("milestone/m2-dogfood", "main").ok, false);
  assert.equal(validatePullRequestTarget("release", "main").ok, true);
  assert.equal(validatePullRequestTarget("fix/release-node22-check", "release").ok, true);
  assert.equal(validatePullRequestTarget("codex/m2-git-flow-docs", "milestone/m2-dogfood").ok, false);
});

test("validateLocalCommitBranch 阻止直接在长期分支提交", () => {
  assert.equal(validateLocalCommitBranch("feature/m2-git-flow").ok, true);
  assert.equal(validateLocalCommitBranch("fix/m2-board-progress").ok, true);
  assert.equal(validateLocalCommitBranch("main").ok, false);
  assert.equal(validateLocalCommitBranch("release").ok, false);
  assert.equal(validateLocalCommitBranch("milestone/m2-dogfood").ok, false);
});

test("validateCommitMessage 校验提交信息格式", () => {
  assert.equal(validateCommitMessage("docs(git): 落地 M2 分支治理").ok, true);
  assert.equal(validateCommitMessage("fix: 修复环境初始化提示").ok, true);
  assert.equal(validateCommitMessage("Merge branch 'release'").ok, true);
  assert.equal(validateCommitMessage("随便写一句").ok, false);
});

test("findForbiddenPaths 拦截运行期文件", () => {
  assert.deepEqual(findForbiddenPaths(["server/server.js", "atlas.db", ".atlas/current.json"]), [
    "atlas.db",
    ".atlas/current.json",
  ]);
  assert.deepEqual(findForbiddenPaths(["docs/README-overview.md"]), []);
});
