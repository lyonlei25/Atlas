#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  findForbiddenPaths,
  validateBranchName,
  validateCommitMessage,
  validateLocalCommitBranch,
  validatePullRequestTarget,
} from "./git-governance-lib.mjs";

const args = new Set(process.argv.slice(2));

function fail(messages) {
  console.error(["Atlas Git 治理检查失败：", ...messages.map((item) => `- ${item}`)].join("\n"));
  process.exit(1);
}

function info(message) {
  console.log(`Atlas Git 治理检查：${message}`);
}

function git(commandArgs) {
  const result = spawnSync("git", commandArgs, { encoding: "utf8" });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function currentBranchName() {
  return (
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    git(["branch", "--show-current"])
  );
}

function stagedFiles() {
  const output = git(["diff", "--cached", "--name-only", "--diff-filter=ACMRT"]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function trackedFiles() {
  const output = git(["ls-files"]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

const commitMessageArg = [...args].find((arg) => arg.startsWith("--commit-msg="));
if (commitMessageArg) {
  const file = commitMessageArg.slice("--commit-msg=".length);
  const result = validateCommitMessage(readFileSync(file, "utf8"));
  if (!result.ok) fail([result.message]);
  info("提交信息符合规范。");
  process.exit(0);
}

const failures = [];
const branchName = currentBranchName();

if (!branchName) {
  failures.push("无法识别当前分支。请确认不是 detached HEAD，或在 CI 中提供 GITHUB_HEAD_REF / GITHUB_REF_NAME。");
} else {
  const branchResult = args.has("--mode=local")
    ? validateLocalCommitBranch(branchName)
    : validateBranchName(branchName);
  if (!branchResult.ok) failures.push(branchResult.message);
}

if (process.env.GITHUB_HEAD_REF && process.env.GITHUB_BASE_REF) {
  const prResult = validatePullRequestTarget(process.env.GITHUB_HEAD_REF, process.env.GITHUB_BASE_REF);
  if (!prResult.ok) failures.push(prResult.message);
}

const filesToCheck = args.has("--staged") ? stagedFiles() : trackedFiles();
const forbidden = findForbiddenPaths(filesToCheck);
if (forbidden.length > 0) {
  failures.push(`以下运行期或本地文件不应进入提交：${forbidden.join(", ")}`);
}

if (failures.length > 0) {
  fail(failures);
}

info("通过。");
