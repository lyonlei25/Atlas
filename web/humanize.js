// 事实 → 人话。把 register/diff/compare/test_result 这种机制名词翻译成"人关心的"一句话。
// 纯函数：前端用，node:test 也能测。

export function humanizeStatus(status) {
  return (
    {
      backlog: '待办',
      planned: '已排期',
      in_progress: '开发中',
      in_review: '待验',
      done: '完成',
      blocked: '受阻',
      // 契约
      drafted: '草拟中',
      fulfilled: '已兑现',
      broken: '测试未过',
      // 兼容旧值
      registered: '开发中',
      submitted: '待验',
      verified: '完成',
    }[status] || status
  );
}

export function humanizeFact(fact) {
  const payload = fact.payload || {};
  switch (fact.kind) {
    case 'register': {
      const n = (payload.declaredScope || []).length;
      return { tone: 'plain', text: `声明范围（基准线）：${n} 处` };
    }
    case 'diff': {
      const n = (payload.actualFiles || []).length;
      return { tone: 'plain', text: `已交改动：${n} 个文件` };
    }
    case 'compare': {
      const over = [...(payload.creep || []), ...(payload.hidden || [])];
      return payload.breach
        ? { tone: 'bad', text: `越界：${over.join(', ')}` }
        : { tone: 'good', text: '比对通过：未越界' };
    }
    case 'test_result': {
      const pass = payload.result === 'pass';
      return pass
        ? { tone: 'good', text: '契约测试通过' }
        : { tone: 'bad', text: '契约测试失败' };
    }
    default:
      return { tone: 'plain', text: fact.kind };
  }
}
