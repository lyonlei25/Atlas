// 共享大脑的存储层（node:sqlite，零原生依赖）。
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => new Date().toISOString();
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function openDb(file = join(__dirname, 'atlas.db')) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  return new Store(db);
}

class Store {
  constructor(db) {
    this.db = db;
  }

  // --- 自动建顶层结构（嵌入新工程时第一次 register 会自然创建） ---
  ensureProject(id, name) {
    const row = this.db.prepare('SELECT id FROM projects WHERE id=?').get(id);
    if (!row) {
      this.db
        .prepare('INSERT INTO projects(id,name,created_at) VALUES(?,?,?)')
        .run(id, name || id, now());
    }
    return id;
  }

  // --- 事实层：只追加 ---
  addFact({ projectId, subjectType, subjectId, kind, payload, actor }) {
    this.db
      .prepare(
        'INSERT INTO facts(project_id,subject_type,subject_id,kind,payload,actor,created_at) VALUES(?,?,?,?,?,?,?)'
      )
      .run(projectId, subjectType, subjectId, kind, JSON.stringify(payload ?? {}), actor || null, now());
  }

  factsFor(subjectType, subjectId) {
    return this.db
      .prepare('SELECT * FROM facts WHERE subject_type=? AND subject_id=? ORDER BY id DESC')
      .all(subjectType, subjectId)
      .map((f) => ({ ...f, payload: safeParse(f.payload) }));
  }

  // --- Feature ---
  registerFeature({ projectId, projectName, id, name, declaredScope, acceptance, owner }) {
    this.ensureProject(projectId, projectName);
    const fid = id || uid('feat');
    const existing = this.db.prepare('SELECT id FROM features WHERE id=?').get(fid);
    if (existing) {
      this.db
        .prepare(
          'UPDATE features SET name=?, declared_scope=?, acceptance=?, owner=?, status=?, breach=0, breach_detail=NULL, updated_at=? WHERE id=?'
        )
        .run(
          name,
          JSON.stringify(declaredScope || []),
          acceptance || null,
          owner || null,
          'registered',
          now(),
          fid
        );
    } else {
      this.db
        .prepare(
          'INSERT INTO features(id,project_id,name,status,declared_scope,acceptance,owner,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)'
        )
        .run(
          fid,
          projectId,
          name || fid,
          'registered',
          JSON.stringify(declaredScope || []),
          acceptance || null,
          owner || null,
          now(),
          now()
        );
    }
    this.addFact({
      projectId,
      subjectType: 'feature',
      subjectId: fid,
      kind: 'register',
      payload: { declaredScope: declaredScope || [], acceptance: acceptance || null },
      actor: owner,
    });
    return this.getFeature(fid);
  }

  getFeature(id) {
    const f = this.db.prepare('SELECT * FROM features WHERE id=?').get(id);
    if (!f) return null;
    return hydrateFeature(f);
  }

  // 收 diff -> 写事实 -> 比对结果落库（status: submitted）。比对在 server/compare.js 做，不信自陈。
  applySubmission(id, { actualFiles, claimedFiles, diffText, compareResult, actor }) {
    const f = this.db.prepare('SELECT * FROM features WHERE id=?').get(id);
    if (!f) return null;
    const projectId = f.project_id;
    this.addFact({
      projectId,
      subjectType: 'feature',
      subjectId: id,
      kind: 'diff',
      payload: { actualFiles, claimedFiles, diffPreview: (diffText || '').slice(0, 4000) },
      actor,
    });
    this.addFact({
      projectId,
      subjectType: 'feature',
      subjectId: id,
      kind: 'compare',
      payload: compareResult,
      actor: 'atlas-server',
    });
    this.db
      .prepare('UPDATE features SET status=?, breach=?, breach_detail=?, updated_at=? WHERE id=?')
      .run(
        'submitted',
        compareResult.breach ? 1 : 0,
        JSON.stringify({ creep: compareResult.creep, hidden: compareResult.hidden }),
        now(),
        id
      );
    return this.getFeature(id);
  }

  // 仅当事实（测试结果）允许时才翻 verified。没有"宣布完成"的路径。
  markVerifiedByFact(id, actor) {
    this.db
      .prepare('UPDATE features SET status=?, updated_at=? WHERE id=?')
      .run('verified', now(), id);
    return this.getFeature(id);
  }

  // --- Contract ---
  upsertContract({ projectId, projectName, id, featureId, name, spec, testCmd }) {
    this.ensureProject(projectId, projectName);
    const cid = id || uid('ctr');
    const existing = this.db.prepare('SELECT id FROM contracts WHERE id=?').get(cid);
    if (existing) {
      this.db
        .prepare('UPDATE contracts SET feature_id=?, name=?, spec=?, test_cmd=?, updated_at=? WHERE id=?')
        .run(featureId || null, name, spec || null, testCmd || null, now(), cid);
    } else {
      this.db
        .prepare(
          'INSERT INTO contracts(id,project_id,feature_id,name,status,spec,test_cmd,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)'
        )
        .run(cid, projectId, featureId || null, name || cid, 'drafted', spec || null, testCmd || null, now(), now());
    }
    return this.getContract(cid);
  }

  getContract(id) {
    return this.db.prepare('SELECT * FROM contracts WHERE id=?').get(id) || null;
  }

  // 契约状态由测试结果驱动：pass -> fulfilled，fail -> broken。这是"测试驱动状态"的核心。
  applyContractResult(id, { result, actor, details }) {
    const c = this.db.prepare('SELECT * FROM contracts WHERE id=?').get(id);
    if (!c) return null;
    const status = result === 'pass' ? 'fulfilled' : 'broken';
    this.db
      .prepare('UPDATE contracts SET status=?, last_result=?, updated_at=? WHERE id=?')
      .run(status, result, now(), id);
    this.addFact({
      projectId: c.project_id,
      subjectType: 'contract',
      subjectId: id,
      kind: 'test_result',
      payload: { result, details: details || null },
      actor,
    });
    // 契约兑现 -> 关联 feature 跟着翻 verified（同样是事实驱动，不是宣布）
    if (status === 'fulfilled' && c.feature_id) {
      this.markVerifiedByFact(c.feature_id, 'atlas-server(contract)');
    }
    return this.getContract(id);
  }

  // --- 全局看板视图 ---
  board() {
    const projects = this.db.prepare('SELECT * FROM projects ORDER BY created_at').all();
    return projects.map((p) => ({
      ...p,
      features: this.db
        .prepare('SELECT * FROM features WHERE project_id=? ORDER BY created_at DESC')
        .all(p.id)
        .map(hydrateFeature),
      contracts: this.db
        .prepare('SELECT * FROM contracts WHERE project_id=? ORDER BY created_at DESC')
        .all(p.id),
    }));
  }
}

function hydrateFeature(f) {
  return {
    ...f,
    declared_scope: safeParse(f.declared_scope) || [],
    breach_detail: safeParse(f.breach_detail),
    breach: !!f.breach,
  };
}

function safeParse(s) {
  if (s == null) return null;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
