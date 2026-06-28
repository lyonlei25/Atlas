// Atlas 看板（下钻分层）。项目 ▸ 里程碑 ▸ feature，每层只露人关心的信息，藏机制细节。
import { humanizeStatus, humanizeFact } from './humanize.js';

const app = document.getElementById('app');
let DATA = { projects: [], users: [] };

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function loadBoard() {
  const res = await fetch('/api/board');
  DATA = await res.json();
}
async function loadFeature(id) {
  const res = await fetch('/api/features/' + encodeURIComponent(id));
  return res.ok ? await res.json() : null;
}

// ---- routing ----
function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const r = { view: 'projects' };
  if (parts[0] === 'p' && parts[1]) {
    r.view = 'project';
    r.pid = decodeURIComponent(parts[1]);
  }
  if (parts[2] === 'm' && parts[3]) {
    r.view = 'milestone';
    r.mid = decodeURIComponent(parts[3]);
  }
  if (parts[4] === 'f' && parts[5]) {
    r.view = 'feature';
    r.fid = decodeURIComponent(parts[5]);
  }
  return r;
}

// ---- small bits ----
const crumb = (items) =>
  `<nav class="crumb">${items
    .map((it) => (it.href != null ? `<a href="${it.href}">${esc(it.label)}</a>` : `<b>${esc(it.label)}</b>`))
    .join(' <span class="sep">/</span> ')}</nav>`;

const statusPill = (status) => `<span class="pill st-${esc(status)}">${esc(humanizeStatus(status))}</span>`;

const bar = (pr) => `<div class="bar"><span style="width:${(pr && pr.pct) || 0}%"></span></div>`;

const progText = (pr) =>
  `${(pr && pr.verified) || 0}/${(pr && pr.total) || 0} feature 已验证 · ${(pr && pr.pct) || 0}%${
    pr && pr.breach ? ` · ⚠ ${pr.breach} 越界` : ''
  }`;

const notFound = (back = '#/') => `${crumb([{ label: '返回', href: back }])}<div class="empty">找不到这个对象（可能已变化）。</div>`;

const realMilestones = (p) => (p.milestones || []).filter((m) => m.id !== '__unassigned__' || m.features.length);

// ---- 项目列表 ----
function viewProjects() {
  const ps = DATA.projects || [];
  if (!ps.length)
    return `${crumb([{ label: '全部项目' }])}<div class="empty">看板还是空的。<br>在你的工程里 <code>atlas register</code>，或跑 <code>examples/slice/demo.mjs</code>。</div>`;
  return (
    crumb([{ label: '全部项目' }]) +
    `<h1 class="vh">全部项目</h1>` +
    `<div class="list">` +
    ps
      .map((p) => {
        const pr = p.progress || {};
        return `<a class="row" href="#/p/${encodeURIComponent(p.id)}">
        <div class="row-main"><div class="row-title">${esc(p.name)}</div><div class="row-sub">${esc(p.goal || '（未设目标）')}</div></div>
        <div class="row-meta">${progText(pr)} ›</div>
      </a>`;
      })
      .join('') +
    `</div>`
  );
}

// ---- 项目层：目标/wiki/状态/进度 + 里程碑列表（不出现 feature）----
function viewProject(pid) {
  const p = (DATA.projects || []).find((x) => x.id === pid);
  if (!p) return notFound();
  const pr = p.progress || {};
  const mss = realMilestones(p);
  const active = mss.find((m) => m.status && m.status !== 'done');
  const statusText = active
    ? `${active.name} 进行中 · ${progText(pr)}`
    : mss.length
    ? progText(pr)
    : '尚无里程碑';
  return (
    crumb([{ label: '全部项目', href: '#/' }, { label: p.name }]) +
    `<div class="vhead"><h1 class="vh">${esc(p.name)}</h1></div>` +
    bar(pr) +
    `<div class="info">
      <span class="k">目标</span><span>${esc(p.goal || '（未设，atlas project set --goal "..."）')}</span>
      <span class="k">当前状态</span><span>${esc(statusText)}</span>
      ${p.wiki ? `<span class="k">wiki</span><span>${esc(p.wiki)}</span>` : ''}
    </div>` +
    `<div class="sec">里程碑（点进去看 feature）</div>` +
    (mss.length
      ? `<div class="list">` +
        mss
          .map((m) => {
            const mp = m.progress || {};
            const sp = m.status ? statusPillRaw(m.status) : '';
            return `<a class="row" href="#/p/${encodeURIComponent(p.id)}/m/${encodeURIComponent(m.id)}">
            <div class="row-main"><div class="row-title"><span class="dia">◆</span> ${esc(m.name)} ${sp}</div><div class="row-sub">${esc(m.goal || '（未设目标）')}</div></div>
            <div class="row-meta">${mp.total || 0} feature · ${mp.pct || 0}%${mp.breach ? ` · ⚠${mp.breach}` : ''} ›</div>
          </a>`;
          })
          .join('') +
        `</div>`
      : `<div class="empty">还没有里程碑。<code>atlas milestone create --id M1 --goal "..."</code></div>`)
  );
}

const statusPillRaw = (s) => `<span class="pill st-${esc(s)}">${esc(s)}</span>`;

// ---- 里程碑层：目标/状态/进度 + feature 列表 + 本里程碑契约 ----
function viewMilestone(pid, mid) {
  const p = (DATA.projects || []).find((x) => x.id === pid);
  if (!p) return notFound();
  const m = (p.milestones || []).find((x) => x.id === mid);
  if (!m) return notFound('#/p/' + encodeURIComponent(pid));
  const mp = m.progress || {};
  const nameOf = Object.fromEntries((p.developers || []).map((d) => [d.userId, d.name]));
  const myFeatureIds = new Set(m.features.map((f) => f.id));
  const contracts = (p.contracts || []).filter((c) => c.feature_id && myFeatureIds.has(c.feature_id));
  return (
    crumb([
      { label: '全部项目', href: '#/' },
      { label: p.name, href: '#/p/' + encodeURIComponent(p.id) },
      { label: m.name },
    ]) +
    `<div class="vhead"><h1 class="vh"><span class="dia">◆</span> ${esc(m.name)}</h1>${
      m.status ? statusPillRaw(m.status) : ''
    }</div>` +
    bar(mp) +
    `<div class="info">
      <span class="k">目标</span><span>${esc(m.goal || '（未设）')}</span>
      <span class="k">进度</span><span>${esc(progText(mp))}</span>
    </div>` +
    `<div class="sec">feature</div>` +
    (m.features.length
      ? `<div class="list">` +
        m.features
          .map((f) => {
            const who = f.owner ? `<span class="who"><span class="mini-avatar">${esc((nameOf[f.owner] || f.owner).slice(0, 1).toUpperCase())}</span>${esc(nameOf[f.owner] || f.owner)}</span>` : '';
            return `<a class="row ${f.breach ? 'breach' : ''}" href="#/p/${encodeURIComponent(p.id)}/m/${encodeURIComponent(m.id)}/f/${encodeURIComponent(f.id)}">
            <div class="row-main"><div class="row-title">${esc(f.name)} ${statusPill(f.status)}${f.breach ? ' <span class="flag">⚠ 越界</span>' : ''}</div><div class="row-sub">${esc(f.acceptance || '（未写验收）')}</div></div>
            <div class="row-meta">${who} ›</div>
          </a>`;
          })
          .join('') +
        `</div>`
      : `<div class="empty">这个里程碑还没有 feature。</div>`) +
    (contracts.length
      ? `<div class="sec">契约</div><div class="list">` +
        contracts
          .map(
            (c) =>
              `<div class="row static"><div class="row-main"><div class="row-title">${esc(c.name)} ${statusPillRaw(c.status)}</div><div class="row-sub">${esc(c.spec || '')}</div></div></div>`
          )
          .join('') +
        `</div>`
      : '')
  );
}

// ---- feature 层：目标/设计/状态/人话进展；机制细节折叠 ----
async function viewFeature(pid, mid, fid) {
  const data = await loadFeature(fid);
  if (!data) return notFound('#/p/' + encodeURIComponent(pid) + '/m/' + encodeURIComponent(mid));
  const f = data.feature;
  const facts = data.facts || [];
  const p = (DATA.projects || []).find((x) => x.id === pid);
  const m = p && (p.milestones || []).find((x) => x.id === mid);

  const timeline = facts
    .map((x) => {
      const h = humanizeFact(x);
      const t = (x.created_at || '').replace('T', ' ').slice(5, 16);
      return `<div class="ev ev-${h.tone}"><span class="ev-dot"></span><div class="ev-body"><div class="ev-text">${esc(h.text)}</div><div class="ev-meta">${esc(t)} · ${esc(x.actor || '?')}</div></div></div>`;
    })
    .join('');

  const raw = facts
    .map((x) => `${x.created_at} ${x.kind} by ${x.actor || '?'}\n${JSON.stringify(x.payload, null, 1)}`)
    .join('\n\n');

  return (
    crumb([
      { label: '全部项目', href: '#/' },
      { label: p ? p.name : pid, href: '#/p/' + encodeURIComponent(pid) },
      { label: m ? m.name : mid, href: '#/p/' + encodeURIComponent(pid) + '/m/' + encodeURIComponent(mid) },
      { label: f.name },
    ]) +
    `<div class="vhead"><h1 class="vh">${esc(f.name)}</h1>${statusPill(f.status)}${
      f.breach ? ' <span class="flag">⚠ 越界</span>' : ''
    }</div>` +
    `<div class="info">
      <span class="k">目标</span><span>${esc(f.acceptance || '（未写验收）')}</span>
      <span class="k">设计 · 范围</span><span class="mono">${esc((f.declared_scope || []).join('  ·  ') || '（未声明）')}</span>
      <span class="k">当前状态</span><span>${esc(humanizeStatus(f.status))}${f.breach ? '（有越界，见进展）' : ''}</span>
    </div>` +
    `<div class="sec">进展</div>` +
    `<div class="timeline">${timeline || '<div class="empty">暂无进展</div>'}</div>` +
    `<details class="tech"><summary>技术细节（原始事实）</summary><pre>${esc(raw || '（无）')}</pre></details>`
  );
}

// ---- render loop ----
async function render() {
  const r = parseRoute();
  try {
    if (r.view === 'feature') app.innerHTML = await viewFeature(r.pid, r.mid, r.fid);
    else if (r.view === 'milestone') app.innerHTML = viewMilestone(r.pid, r.mid);
    else if (r.view === 'project') app.innerHTML = viewProject(r.pid);
    else app.innerHTML = viewProjects();
  } catch (e) {
    app.innerHTML = `<div class="empty">渲染出错：${esc(e.message)}</div>`;
  }
}

async function tick() {
  try {
    await loadBoard();
    await render();
  } catch (e) {
    app.innerHTML = `<div class="empty">连不上服务端。先 <code>npm run server</code>。<br>${esc(e.message)}</div>`;
  }
}

window.addEventListener('hashchange', render);
tick();
setInterval(tick, 4000);
