-- Atlas 看板（共享大脑）数据模型
-- 对应蓝图 05：Project → Milestone → (Feature[] + Contract[])，外加 Fact[] 事实层。
--
-- 三级可信度的落点：
--   事实层  facts            —— 从 diff / 测试自动抽取，Agent 改不动（无 UPDATE 路径，只 INSERT）
--   契约层  contracts        —— 可执行，status 由契约测试结果驱动
--   说法层  notes            —— wiki 笔记，必须挂出处+时间（本版仅建表占位，"往外长"再用）

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',   -- open | frozen | done
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS features (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  milestone_id TEXT REFERENCES milestones(id),
  name         TEXT NOT NULL,
  -- 状态只由事实翻牌：registered -> in_progress -> submitted -> verified
  -- 绝不存在 "agent 宣布 done 就 verified" 的路径。
  status       TEXT NOT NULL DEFAULT 'registered',
  -- L3 硬锚：开工时声明的范围（基准线），JSON 数组字符串
  declared_scope TEXT,           -- 计划碰的文件 glob/路径列表
  acceptance     TEXT,           -- 验收标准（自然语言）
  -- 比对结论（来自 compare.js，事实，标红用）
  breach       INTEGER NOT NULL DEFAULT 0,   -- 0 = 干净, 1 = 越界标红
  breach_detail TEXT,            -- JSON：hidden（瞒报）/ creep（擅自扩张）明细
  owner        TEXT,             -- 哪个开发者/agent 在做（全局视图用）
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  feature_id   TEXT REFERENCES features(id),
  name         TEXT NOT NULL,
  -- 契约状态由测试结果驱动：drafted -> fulfilled（测试通过）/ broken（测试红）
  status       TEXT NOT NULL DEFAULT 'drafted',
  spec         TEXT,             -- 契约描述（接受 X 返回 Y）；可执行测试是真凭据
  test_cmd     TEXT,             -- 跑这份契约的命令（可执行契约的入口）
  last_result  TEXT,             -- 'pass' | 'fail'
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- 事实层：只追加，永不修改。每条都可溯源。
CREATE TABLE IF NOT EXISTS facts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL,
  subject_type TEXT NOT NULL,    -- 'feature' | 'contract'
  subject_id  TEXT NOT NULL,
  kind        TEXT NOT NULL,     -- 'register' | 'diff' | 'compare' | 'test_result'
  payload     TEXT NOT NULL,     -- JSON：原样的事实数据
  actor       TEXT,              -- 谁交的（人/agent 名）
  created_at  TEXT NOT NULL
);

-- 说法层：本版占位。每条必须挂 source_fact + 时间，旧的贬值（往外长再实现读取/贬值逻辑）。
CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL,
  subject_type TEXT,
  subject_id  TEXT,
  body        TEXT NOT NULL,
  source_fact INTEGER REFERENCES facts(id),  -- 连不回事实 = 最低可信度的传言
  created_at  TEXT NOT NULL
);
