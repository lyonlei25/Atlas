/* ============================================================
   md.js — 自包含 Markdown 渲染器（无外部依赖）
   只覆盖本工程文档实际用到的语法，确保双击离线可用。
   ============================================================ */
(function(){
  function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  // inline: code, bold, italic, links, images
  function inline(s){
    const codes=[];
    // protect inline code first
    s=s.replace(/`([^`]+)`/g,(m,c)=>{codes.push(c);return "\u0000"+(codes.length-1)+"\u0000";});
    s=esc(s);
    // images ![alt](src)
    s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(m,a,src)=>`<img src="${src}" alt="${a}">`);
    // links [txt](href)
    s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(m,t,h)=>`<a href="${h}">${t}</a>`);
    // bold **x**
    s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
    // italic *x*  (avoid ** already handled)
    s=s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,"$1<em>$2</em>");
    // restore code
    s=s.replace(/\u0000(\d+)\u0000/g,(m,i)=>`<code>${esc(codes[+i])}</code>`);
    return s;
  }

  function parseTableRow(line){
    let cells=line.trim().replace(/^\|/,"").replace(/\|$/,"").split("|");
    return cells.map(c=>c.trim());
  }

  window.renderMarkdown = function(md){
    const lines=md.replace(/\r\n/g,"\n").split("\n");
    let html=[], i=0;

    while(i<lines.length){
      let line=lines[i];

      // code fence
      if(/^```/.test(line)){
        let buf=[]; i++;
        while(i<lines.length && !/^```/.test(lines[i])){ buf.push(lines[i]); i++; }
        i++; // skip closing fence
        html.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
        continue;
      }

      // hr
      if(/^---+\s*$/.test(line)){ html.push("<hr>"); i++; continue; }

      // heading
      let hm=line.match(/^(#{1,6})\s+(.*)$/);
      if(hm){ const lv=hm[1].length; html.push(`<h${lv}>${inline(hm[2])}</h${lv}>`); i++; continue; }

      // blockquote (consume consecutive > lines)
      if(/^>\s?/.test(line)){
        let buf=[];
        while(i<lines.length && /^>\s?/.test(lines[i])){ buf.push(lines[i].replace(/^>\s?/,"")); i++; }
        // recurse render inside (supports multi-para + bold)
        let inner=window.renderMarkdown(buf.join("\n"));
        html.push(`<blockquote>${inner}</blockquote>`);
        continue;
      }

      // table (header row + separator)
      if(line.includes("|") && i+1<lines.length && /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(lines[i+1])){
        const head=parseTableRow(line);
        i+=2; // skip header + separator
        let rows=[];
        while(i<lines.length && lines[i].includes("|") && lines[i].trim()!==""){
          rows.push(parseTableRow(lines[i])); i++;
        }
        let t=`<table><thead><tr>${head.map(h=>`<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>`;
        t+=rows.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join("")}</tr>`).join("");
        t+=`</tbody></table>`;
        html.push(t);
        continue;
      }

      // unordered list
      if(/^[-*]\s+/.test(line)){
        let items=[];
        while(i<lines.length && /^[-*]\s+/.test(lines[i])){
          items.push(lines[i].replace(/^[-*]\s+/,"")); i++;
        }
        html.push(`<ul>${items.map(t=>`<li>${inline(t)}</li>`).join("")}</ul>`);
        continue;
      }

      // ordered list
      if(/^\d+\.\s+/.test(line)){
        let items=[];
        while(i<lines.length && /^\d+\.\s+/.test(lines[i])){
          items.push(lines[i].replace(/^\d+\.\s+/,"")); i++;
        }
        html.push(`<ol>${items.map(t=>`<li>${inline(t)}</li>`).join("")}</ol>`);
        continue;
      }

      // blank
      if(line.trim()===""){ i++; continue; }

      // paragraph (gather until blank / block start)
      let buf=[line]; i++;
      while(i<lines.length && lines[i].trim()!=="" &&
            !/^(#{1,6}\s|>|```|---+\s*$|[-*]\s|\d+\.\s)/.test(lines[i]) &&
            !(lines[i].includes("|") && i+1<lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i+1]||""))){
        buf.push(lines[i]); i++;
      }
      html.push(`<p>${inline(buf.join(" "))}</p>`);
    }
    return html.join("\n");
  };
})();
