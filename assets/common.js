(function(){
  const store = {
    get(k, d){ try{ const v = localStorage.getItem("velox."+k); return v===null? d : JSON.parse(v);}catch(e){return d;} },
    set(k, v){
      try{
        const old = localStorage.getItem("velox."+k), nv = JSON.stringify(v);
        localStorage.setItem("velox."+k, nv);
        if(old!==nv && !k.startsWith("sys.")){
          // Only real work counts as unsaved: typed text, ticked boxes, answered questions, finished modules.
          if(/\.(f|qc)\./.test(k) ? !(v===""||v===false||v==null) : /\.done$/.test(k)) localStorage.setItem("velox.sys.dirty","1");
          if(window.progressChanged) progressChanged(k, v, old);
        }
      }catch(e){}
    }
  };
  window.store = store;
  window.videoHtml = function(url, title){
    const u = String(url).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
    if(/\.mp4(\?|$)/i.test(url)) return `<video controls playsinline preload="metadata" title="${title}"><source src="${u}" type="video/mp4">Your browser cannot play this video. Use the transcript button below instead.</video>`;
    return `<iframe src="${u}" title="${title}" allowfullscreen></iframe>`;
  };
  window.toast = function(msg){
    let t = document.querySelector(".toast");
    if(!t){ t = document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2200);
  };
  function manualCopy(text){
    let m = document.getElementById("copyFallback");
    if(m) m.remove();
    m = document.createElement("div"); m.id = "copyFallback"; m.setAttribute("role","dialog"); m.setAttribute("aria-label","Copy this text");
    m.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px";
    m.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:640px;width:100%;padding:18px"><p style="margin:0 0 8px"><b>Your browser blocked automatic copying.</b> The text below is already selected. Press <b>Ctrl+C</b> (Windows) or <b>Cmd+C</b> (Mac), or on a phone touch and hold it and choose Copy. Then close this box.</p><textarea readonly style="width:100%;height:240px;font:14px/1.4 monospace"></textarea><p style="margin:10px 0 0;text-align:right"><button type="button" class="btn btn-red btn-sm">Close</button></p></div>';
    document.body.appendChild(m);
    const ta = m.querySelector("textarea"); ta.value = text; ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    m.querySelector("button").addEventListener("click", ()=>m.remove());
  }
  // Returns true if copied, false if the manual-copy box was shown.
  window.copyText = async function(text){
    try{
      if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); toast("Copied!"); return true; }
    }catch(e){}
    try{
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly","");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy"); ta.remove();
      if(ok){ toast("Copied!"); return true; }
    }catch(_){}
    manualCopy(text); return false;
  };
  window.confetti = function(){
    const c = document.createElement("canvas"); c.id="confetti"; document.body.appendChild(c);
    const ctx = c.getContext("2d"); const W = c.width = innerWidth, H = c.height = innerHeight;
    const colors = ["#C8102E","#F1BE48","#ffffff","#9B0C23"];
    const bits = Array.from({length:140},()=>({x:Math.random()*W,y:-20-Math.random()*H*0.5,r:4+Math.random()*6,vy:2+Math.random()*4,vx:-2+Math.random()*4,col:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*6}));
    let n = 0;
    (function tick(){
      ctx.clearRect(0,0,W,H);
      bits.forEach(b=>{ b.x+=b.vx; b.y+=b.vy; b.rot+=.1; ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.rot); ctx.fillStyle=b.col; ctx.fillRect(-b.r/2,-b.r/2,b.r,b.r*1.6); ctx.restore(); });
      if(++n<220) requestAnimationFrame(tick); else c.remove();
    })();
  };

  // ---- Progress backup and restore -------------------------------------------------
  // All progress lives in this browser's localStorage under "velox.*". The backup file is a
  // plain JSON copy of those items so a student can move to another browser or recover.
  const BK_APP = "acct4420-velox-progress";
  const sysGet = k => { try{ return localStorage.getItem("velox.sys."+k); }catch(e){ return null; } };
  const sysSet = (k,v) => { try{ localStorage.setItem("velox.sys."+k, v); }catch(e){} };
  const progressKeys = () => { try{ return Object.keys(localStorage).filter(k=>k.startsWith("velox.") && !k.startsWith("velox.sys.")); }catch(e){ return []; } };
  function saveBackup(){
    const data = {}; progressKeys().forEach(k=>{ data[k] = localStorage.getItem(k); });
    if(!Object.keys(data).length){ toast("Nothing to back up yet. Type something first."); return false; }
    const now = new Date();
    const blob = new Blob([JSON.stringify({app:BK_APP, version:1, saved:now.toISOString(), data}, null, 1)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "acct4420-progress-backup-" + now.toISOString().slice(0,10) + ".json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    sysSet("lastBackup", now.toISOString()); sysSet("dirty", "0"); refreshBackupUi();
    toast("Backup saved. Check your Downloads folder.");
    return true;
  }
  function restoreBackup(file){
    const rd = new FileReader();
    rd.onload = ()=>{
      let o; try{ o = JSON.parse(rd.result); }catch(e){ o = null; }
      if(!o || o.app!==BK_APP || !o.data || typeof o.data!=="object"){ alert("That file is not a progress backup from this course. Choose the file named acct4420-progress-backup-(date).json that you saved earlier."); return; }
      const keys = Object.keys(o.data).filter(k=>k.startsWith("velox.") && !k.startsWith("velox.sys.") && typeof o.data[k]==="string");
      if(!keys.length){ alert("That backup file is empty."); return; }
      const when = o.saved ? new Date(o.saved).toLocaleString() : "an unknown date";
      if(!confirm("Restore your progress from the backup saved on " + when + "?\n\nThis replaces everything currently saved in this browser with the contents of that file. Continue?")) return;
      try{
        progressKeys().forEach(k=>localStorage.removeItem(k));
        keys.forEach(k=>localStorage.setItem(k, o.data[k]));
        sysSet("lastBackup", new Date().toISOString()); sysSet("dirty","0");
      }catch(e){ alert("Your browser would not let this page save the restored data. Check that private browsing is off and try again."); return; }
      alert("Your progress is restored. The page will reload now."); location.reload();
    };
    rd.readAsText(file);
  }
  let panel, fab;
  function refreshBackupUi(){
    const last = sysGet("lastBackup"), dirty = sysGet("dirty")==="1";
    if(fab){ fab.classList.toggle("unsaved", dirty); fab.querySelector(".lbl-txt").textContent = dirty ? "Save a backup (not saved yet)" : "Progress backup"; }
    const st = document.getElementById("bkStatus");
    if(st) st.textContent = last ? "Last backup saved: " + new Date(last).toLocaleString() + (dirty ? ". You have typed more since then, so save a new one." : ". Nothing new since then.") : "You have not saved a backup yet.";
  }
  function buildBackupUi(){
    fab = document.createElement("button"); fab.type="button"; fab.className="bk-fab";
    fab.innerHTML = '<span class="lbl-txt"></span>'; fab.setAttribute("aria-haspopup","dialog");
    panel = document.createElement("div"); panel.className="bk-panel"; panel.hidden = true; panel.setAttribute("role","dialog"); panel.setAttribute("aria-label","Progress backup");
    panel.innerHTML = '<h3>Protect your work</h3>' +
      '<p>Everything you type here is saved <b>only in this browser on this computer</b>. If you switch computers or browsers, use a private window, or clear your browser data, it is gone. A backup file lets you get it back.</p>' +
      '<p id="bkStatus" class="hint"></p>' +
      '<p><b>1. To save:</b> click the button. A small file downloads to your computer. <b>Keep it somewhere safe</b> (your Documents folder or a cloud drive).</p>' +
      '<p><button type="button" class="btn btn-red btn-sm" id="bkSave">Save my progress to a file</button></p>' +
      '<p><b>2. To restore</b> (new computer, new browser, or lost work): <b>open this course site, click the button below, and choose your backup file.</b></p>' +
      '<p><label class="btn btn-ghost btn-sm" for="bkFile" style="cursor:pointer">Restore my progress from a file</label><input type="file" id="bkFile" accept=".json,application/json" hidden></p>' +
      '<p class="hint">Save a new backup after each step you finish. The backup covers every module, so you only need the newest file. Your backup is not your submission: upload the Word file from the module page to Canvas.</p>' +
      '<p style="text-align:right;margin:0"><button type="button" class="btn btn-ghost btn-sm" id="bkClose">Close</button></p>';
    document.body.appendChild(panel); document.body.appendChild(fab);
    const show = on => { panel.hidden = !on; fab.setAttribute("aria-expanded", on?"true":"false"); if(on) refreshBackupUi(); };
    fab.addEventListener("click", ()=>show(panel.hidden));
    panel.querySelector("#bkClose").addEventListener("click", ()=>{ show(false); fab.focus(); });
    panel.querySelector("#bkSave").addEventListener("click", saveBackup);
    panel.querySelector("#bkFile").addEventListener("change", e=>{ const f = e.target.files[0]; if(f) restoreBackup(f); e.target.value=""; });
    document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !panel.hidden){ show(false); fab.focus(); } });
    window.openBackupPanel = ()=>show(true);
    refreshBackupUi();
  }
  // Nudge after a student finishes a step (the step counter or "done" flag advances).
  let nudgeTimer;
  window.progressChanged = function(k, v, old){
    refreshBackupUi();
    if(!/(^|\.)(max|done)$/.test(k)) return;
    if(k.endsWith("max") && !(Number(v) > Number(JSON.parse(old||"0")))) return;
    let b = document.getElementById("bkNudge");
    if(!b){
      b = document.createElement("div"); b.id="bkNudge"; b.className="bk-nudge"; b.setAttribute("role","status");
      b.innerHTML = '<span><b>Step finished.</b> Save a backup so you cannot lose your work.</span> <button type="button" class="btn btn-gold btn-sm" id="bkNudgeSave">Save backup</button> <button type="button" class="btn btn-ghost btn-sm" id="bkNudgeX" aria-label="Dismiss">Later</button>';
      document.body.appendChild(b);
      b.querySelector("#bkNudgeSave").addEventListener("click", ()=>{ if(saveBackup()) b.classList.remove("show"); });
      b.querySelector("#bkNudgeX").addEventListener("click", ()=>b.classList.remove("show"));
    }
    b.classList.add("show"); clearTimeout(nudgeTimer); nudgeTimer = setTimeout(()=>b.classList.remove("show"), 30000);
  };
  window.addEventListener("beforeunload", e=>{
    if(sysGet("dirty")==="1" && progressKeys().length){ e.preventDefault(); e.returnValue = ""; }
  });
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", buildBackupUi); else buildBackupUi();
})();
