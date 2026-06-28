// Atlas 看板前端（vanilla）。轮询 /api/board，渲染全局事实状态；点 feature 看事实流水。
const boardEl = document.getElementById('board');
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');
const drawerBody = document.getElementById('drawerBody');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function fetchBoard() {
  const res = await fetch('/api/board');
  return (await res.json()).projects || [];
}

function featureCard(f, nameOf = {}) {
  const breach = f.breach;
  const cls = ['card', 'feature', f.status, breach ? 'breach' : ''].join(' ');
  const scope = (f.declared_scope || []).join('  ·  ') || '(未声明)';
  let breachHtml = '';
  if (breach && f.breach_detail) {
    const d = f.breach_detail;
    const bits = [];
    if (d.creep?.length) bits.push(`范围蔓延: ${esc(d.creep.join(', '))}`);
    if (d.hidden?.length) bits.push(`瞒报: ${esc(d.hidden.join(', '))}`);
    breachHtml = `<div class="breach-flag">⚠ 越界</div><div class="breach-detail">${bits.join('<br>')}</div>`;
  }
  return `<div class="${cls}" data-feature="${esc(f.id)}">
    <div class="accent-edge"></div>
    <div class="card-top">
      <span class="card-name">${esc(f.name)}</span>
      <span class="status st-${esc(f.status)}">${esc(f.status)}</span>
    </div>
    <div class="scope"><span class="scope-label">范围 </span>${esc(scope)}</div>
    ${breachHtml}
    ${f.owner ? `<div class="owner"><span class="mini-avatar">${esc((nameOf[f.owner] || f.owner).slice(0, 1).toUpperCase())}</span>${esc(nameOf[f.owner] || f.owner)}</div>` : ''}
  </div>`;
}

function contractCard(c) {
  return `<div class="card contract ${c.status}">
    <div class="accent-edge"></div>
    <div class="card-top">
      <span class="card-name">契约 · ${esc(c.name)}</span>
      <span class="status st-${esc(c.status)}">${esc(c.status)}</span>
    </div>
    ${c.spec ? `<div class="scope"><span class="scope-label">spec </span>${esc(c.spec)}</div>` : ''}
    ${c.last_result ? `<div class="owner">最近测试: ${esc(c.last_result)}</div>` : ''}
  </div>`;
}

function milestonesHtml(p) {
  const nameOf = Object.fromEntries((p.developers || []).map((d) => [d.userId, d.name]));
  return (p.milestones || [])
    .map((m) => {
      const tag =
        m.status && m.id !== '__unassigned__' ? `<span class="ms-status st-${esc(m.status)}">${esc(m.status)}</span>` : '';
      const body = m.features.length
        ? `<div class="grid">${m.features.map((f) => featureCard(f, nameOf)).join('')}</div>`
        : `<div class="ms-empty">无 feature</div>`;
      return `<div class="ms-head"><span class="ms-diamond">◆</span><span class="ms-name">${esc(m.name)}</span>${tag}<span class="ms-count">${m.features.length} feature</span></div>${body}`;
    })
    .join('');
}

function render(projects) {
  if (!projects.length) {
    boardEl.innerHTML = `<div class="empty">看板还是空的。<br>先在你的工程里 <code>atlas register --feature ...</code>，或跑 <code>examples/slice/demo.mjs</code>。</div>`;
    return;
  }
  boardEl.innerHTML = projects
    .map((p) => {
      const breaches = p.features.filter((f) => f.breach).length;
      const verified = p.features.filter((f) => f.status === 'verified').length;
      const devCount = (p.developers || []).length;
      return `<section class="project">
        <div class="project-head">
          <span class="project-name">${esc(p.name)}</span>
          <span class="project-id">${esc(p.id)}</span>
          <span class="counts">${devCount} 人 · ${p.features.length} feature · ${verified} verified${breaches ? ` · ⚠ ${breaches} 越界` : ''}</span>
        </div>
        ${(p.milestones || []).length ? `<div class="section-label">里程碑 ▸ feature（事实驱动状态）</div>${milestonesHtml(p)}` : ''}
        ${p.contracts.length ? `<div class="section-label">Contracts（测试驱动兑现）</div><div class="grid">${p.contracts.map(contractCard).join('')}</div>` : ''}
      </section>`;
    })
    .join('');

  boardEl.querySelectorAll('[data-feature]').forEach((el) =>
    el.addEventListener('click', () => openFeature(el.dataset.feature))
  );
}

async function openFeature(id) {
  const res = await fetch('/api/features/' + encodeURIComponent(id));
  if (!res.ok) return;
  const { feature: f, facts } = await res.json();
  const factHtml = facts
    .map((x) => {
      let payload = '';
      try {
        payload = JSON.stringify(x.payload, null, 1);
      } catch {
        payload = String(x.payload);
      }
      return `<div class="fact kind-${esc(x.kind)}">
        <div class="fact-kind">${esc(x.kind)}</div>
        <div class="fact-meta">${esc(x.created_at)} · by ${esc(x.actor || '?')}</div>
        <div class="fact-payload">${esc(payload)}</div>
      </div>`;
    })
    .join('');
  drawerBody.innerHTML = `
    <div class="d-title">${esc(f.name)}</div>
    <div class="d-id">${esc(f.id)} · ${esc(f.project_id)}</div>
    <div class="d-row"><b>状态</b><span class="status st-${esc(f.status)}">${esc(f.status)}</span>${f.breach ? ' <span class="breach-flag">⚠ 越界</span>' : ''}</div>
    <div class="d-row"><b>范围</b><span class="scope">${esc((f.declared_scope || []).join(', ') || '(未声明)')}</span></div>
    ${f.acceptance ? `<div class="d-row"><b>验收</b><span>${esc(f.acceptance)}</span></div>` : ''}
    <div class="section-label" style="margin-top:18px">事实流水（只追加，可溯源）</div>
    ${factHtml || '<div class="empty">暂无事实</div>'}
  `;
  drawer.classList.add('open');
  scrim.classList.add('open');
}

function closeDrawer() {
  drawer.classList.remove('open');
  scrim.classList.remove('open');
}
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

async function tick() {
  try {
    render(await fetchBoard());
  } catch (e) {
    boardEl.innerHTML = `<div class="empty">连不上服务端。先 <code>npm run server</code>。<br>${esc(e.message)}</div>`;
  }
}
tick();
setInterval(tick, 3000); // 自动刷新——看板始终反映最新事实
