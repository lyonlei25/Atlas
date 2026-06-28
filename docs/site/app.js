/* ============================================================
   AI-Native 工程治理 — 应用逻辑
   纯静态：hash 路由 + marked 渲染，双击 index.html 即可运行
   ============================================================ */
(function(){
  const DOCS = window.DOCS || [];
  const byId = Object.fromEntries(DOCS.map(d => [d.id, d]));

  // tier groups for sidebar
  const TIERS = [
    {key:"intro", label:"开篇",        pip:"var(--accent)"},
    {key:"L1",    label:"L1 · 项目级",  pip:"var(--c-fact)"},
    {key:"L2",    label:"L2 · 里程碑",  pip:"var(--c-contract)"},
    {key:"L3",    label:"L3 · Feature", pip:"var(--c-agent)"},
    {key:"board", label:"看板 · 落地",  pip:"var(--c-say)"},
  ];
  const tierColor = {
    intro:"var(--accent)", L1:"var(--c-fact)", L2:"var(--c-contract)",
    L3:"var(--c-agent)", board:"var(--c-say)"
  };

  // ---- markdown renderer: local, no CDN (see md.js) ----
  const renderMD = window.renderMarkdown;

  // ---------- build sidebar nav ----------
  function buildNav(){
    const nav = document.getElementById("nav");
    let html = "";
    TIERS.forEach(t => {
      const items = DOCS.filter(d => d.tier === t.key);
      if(!items.length) return;
      html += `<div class="nav-group">
        <div class="nav-glabel"><span class="pip" style="background:${t.pip}"></span>${t.label}</div>`;
      items.forEach(d => {
        html += `<a class="nav-item" href="#${d.id}" data-link data-id="${d.id}">
          <span class="nav-num">${d.num||"·"}</span>
          <span class="nav-body">
            <span class="nav-title">${d.title}</span>
            <span class="nav-sub">${d.sub||""}</span>
          </span>
        </a>`;
      });
      html += `</div>`;
    });
    nav.innerHTML = html;
  }

  // ---------- render a doc ----------
  function renderDoc(id){
    const d = byId[id] || byId["home"];
    const docEl = document.getElementById("doc");

    // eyebrow above the H1
    const tlabel = (TIERS.find(t=>t.key===d.tier)||{}).label || "";
    const eyebrow = `<div class="eyebrow">
        <span class="tierpip" style="background:${tierColor[d.tier]}"></span>
        ${d.num ? d.num + " · " : ""}${tlabel}
      </div>`;

    docEl.innerHTML = eyebrow + renderMD(d.md);

    // add ids to headings for TOC + add check/cross coloring
    decorateHeadings(docEl);
    colorMarks(docEl);

    buildTOC(docEl);
    buildPager(d);

    // active nav state
    document.querySelectorAll(".nav-item").forEach(a=>{
      a.classList.toggle("active", a.dataset.id === d.id);
    });

    // reset scroll
    window.scrollTo(0,0);
    document.title = (d.title==="总览"? "AI-Native 工程治理" : d.title + " · AI-Native 治理");

    // close mobile nav
    document.body.classList.remove("navopen");
    updateReadbar();
  }

  // give headings slug ids
  function decorateHeadings(root){
    let n=0;
    root.querySelectorAll("h2,h3").forEach(h=>{
      h.id = "h-"+(n++);
    });
  }

  // color ✓ / ❌ marks and ① ② ③ in tables/text subtly
  function colorMarks(root){
    root.querySelectorAll("td,li,p").forEach(el=>{
      // only touch text-ish leaf nodes
      el.querySelectorAll && el.childNodes.forEach(node=>{
        if(node.nodeType===3){
          const t=node.nodeValue;
          if(/[✓❌✗🔒]/.test(t)){
            const span=document.createElement("span");
            span.innerHTML=t
              .replace(/✓/g,'<b style="color:var(--c-fact)">✓</b>')
              .replace(/[❌✗]/g,'<b style="color:var(--c-danger)">✗</b>');
            node.replaceWith(span);
          }
        }
      });
    });
  }

  // ---------- TOC ----------
  function buildTOC(root){
    const toc = document.getElementById("toc");
    const hs = [...root.querySelectorAll("h2,h3")];
    if(hs.length < 2){ toc.innerHTML=""; return; }
    let html = `<div class="toc-head">本页目录</div>`;
    hs.forEach(h=>{
      const cls = h.tagName==="H3" ? "toc-link h3" : "toc-link";
      html += `<a class="${cls}" href="#${h.id}" data-toc="${h.id}">${h.textContent}</a>`;
    });
    toc.innerHTML = html;

    // smooth scroll w/o changing route hash
    toc.querySelectorAll("[data-toc]").forEach(a=>{
      a.addEventListener("click",e=>{
        e.preventDefault();
        const el=document.getElementById(a.dataset.toc);
        if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
      });
    });
  }

  // ---------- prev / next pager ----------
  function buildPager(d){
    const pager=document.getElementById("pager");
    const idx=DOCS.findIndex(x=>x.id===d.id);
    const prev=DOCS[idx-1], next=DOCS[idx+1];
    let html="";
    if(prev){
      html+=`<a class="prev" href="#${prev.id}" data-link>
        <span class="pg-dir">← 上一篇</span>
        <span class="pg-ttl">${prev.num?prev.num+" ":""}${prev.title}</span></a>`;
    } else { html+=`<span class="pg-empty"></span>`; }
    if(next){
      html+=`<a class="next" href="#${next.id}" data-link>
        <span class="pg-dir">下一篇 →</span>
        <span class="pg-ttl">${next.num?next.num+" ":""}${next.title}</span></a>`;
    } else { html+=`<span class="pg-empty"></span>`; }
    pager.innerHTML=html;
  }

  // ---------- scroll spy (toc active) ----------
  function setupSpy(){
    let ticking=false;
    window.addEventListener("scroll",()=>{
      if(ticking) return; ticking=true;
      requestAnimationFrame(()=>{
        updateReadbar();
        const hs=[...document.querySelectorAll(".doc h2,.doc h3")];
        let cur=null;
        for(const h of hs){
          if(h.getBoundingClientRect().top < 120) cur=h.id; else break;
        }
        document.querySelectorAll("[data-toc]").forEach(a=>{
          a.classList.toggle("active", a.dataset.toc===cur);
        });
        ticking=false;
      });
    },{passive:true});
  }

  function updateReadbar(){
    const h=document.documentElement;
    const max=h.scrollHeight-h.clientHeight;
    const p=max>0 ? (h.scrollTop/max)*100 : 0;
    document.getElementById("readbarFill").style.width=p+"%";
  }

  // ---------- routing ----------
  function route(){
    const id=(location.hash||"#home").slice(1);
    renderDoc(byId[id] ? id : "home");
  }

  // intercept internal links
  document.addEventListener("click",e=>{
    const a=e.target.closest('a[data-link]');
    if(a){ /* let hashchange handle it, but ensure same-hash re-render */
      const targetHash=a.getAttribute("href");
      if(targetHash===location.hash){ e.preventDefault(); route(); }
    }
  });

  // mobile nav toggle
  document.getElementById("burger").addEventListener("click",()=>{
    document.body.classList.toggle("navopen");
  });
  document.getElementById("scrim").addEventListener("click",()=>{
    document.body.classList.remove("navopen");
  });

  // keyboard: left/right arrows = prev/next doc
  document.addEventListener("keydown",e=>{
    if(e.target.matches("input,textarea")) return;
    const idx=DOCS.findIndex(x=> "#"+x.id===(location.hash||"#home"));
    if(e.key==="ArrowRight" && DOCS[idx+1]) location.hash=DOCS[idx+1].id;
    if(e.key==="ArrowLeft" && DOCS[idx-1]) location.hash=DOCS[idx-1].id;
  });

  window.addEventListener("hashchange",route);

  // init
  buildNav();
  setupSpy();
  route();
})();
