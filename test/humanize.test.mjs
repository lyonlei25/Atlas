import test from 'node:test';
import assert from 'node:assert';
import { humanizeFact, humanizeStatus } from '../web/humanize.js';

test('humanizeStatus 把 6 态翻成人话', () => {
  assert.equal(humanizeStatus('backlog'), '待办');
  assert.equal(humanizeStatus('planned'), '已排期');
  assert.equal(humanizeStatus('in_progress'), '开发中');
  assert.equal(humanizeStatus('in_review'), '待验');
  assert.equal(humanizeStatus('done'), '完成');
  assert.equal(humanizeStatus('blocked'), '受阻');
});

test('humanizeFact: register → 声明范围', () => {
  const h = humanizeFact({ kind: 'register', payload: { declaredScope: ['a', 'b'] } });
  assert.match(h.text, /声明范围/);
});

test('humanizeFact: diff → 已交改动 N 个文件', () => {
  const h = humanizeFact({ kind: 'diff', payload: { actualFiles: ['a', 'b', 'c'] } });
  assert.match(h.text, /3 个文件/);
});

test('humanizeFact: compare 干净=good / 越界=bad 且带文件', () => {
  assert.equal(humanizeFact({ kind: 'compare', payload: { breach: false } }).tone, 'good');
  const bad = humanizeFact({ kind: 'compare', payload: { breach: true, creep: ['x.js'] } });
  assert.equal(bad.tone, 'bad');
  assert.match(bad.text, /x\.js/);
});

test('humanizeFact: test_result pass/fail', () => {
  assert.equal(humanizeFact({ kind: 'test_result', payload: { result: 'pass' } }).tone, 'good');
  assert.equal(humanizeFact({ kind: 'test_result', payload: { result: 'fail' } }).tone, 'bad');
});
