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
  /* Reviewer mode: module-N.html?review=1 opens the step bar for that module so evaluators can read every step.
     It asks for a password once per browser. The page is static, so this is a speed bump, not real security.
     While it is on for a module, a gold pill stays on screen with a Turn off button. */
  try{
    const rm = location.pathname.match(/module-(\d+)\.html$/);
    if(rm){
      const N = rm[1], FLAG = "sys.rv" + N;
      const REVIEW_HASH = "4a03ac2b94c4ff8841e9992f452ea36c73b487a626b4a694f9c46357dc7a122c", REVIEW_SALT = "acct4420-review-v1:";
      const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
      const authed = store.get("sys.reviewOK","")===REVIEW_HASH;
      const wants = new URLSearchParams(location.search).get("review")==="1";
      const turnOn = () => { store.set("m"+N+".max", 8); store.set(FLAG, true); };
      if(wants && authed) turnOn();
      if(authed && store.get(FLAG,false)){
        document.addEventListener("DOMContentLoaded", ()=>{
          const b = document.createElement("div");
          b.id = "rvPill"; b.setAttribute("role","status");
          b.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:58;background:#F1BE48;color:#000;border:2px solid #c99a2c;border-radius:14px;padding:10px 14px;max-width:min(340px,calc(100vw - 28px));font:600 14px/1.35 system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.25)";
          b.innerHTML = 'REVIEWER MODE IS ON for this module. Click any numbered step to read it. <button type="button" style="margin-left:6px;font:inherit;cursor:pointer">Turn off</button>';
          b.querySelector("button").addEventListener("click", ()=>{ store.set("m"+N+".max",1); store.set("m"+N+".step",1); store.set(FLAG,false); location.href = location.pathname; });
          document.body.appendChild(b);
        });
      }
      if(wants && !authed){
        document.addEventListener("DOMContentLoaded", ()=>{
          const m = document.createElement("div"); m.className = "bk-modal"; m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true"); m.setAttribute("aria-label","Reviewer password");
          m.style.zIndex = "10000";
          m.innerHTML = '<div class="bk-modal-box"><h2 style="margin-top:0">Reviewer mode</h2><p><b>Type the reviewer password</b> your instructor gave you, then <b>click Open</b>. If you are a student taking the course, <b>click Cancel</b> and work through the steps in order.</p>' +
            '<p><label for="rvPw" class="lbl">Reviewer password</label><input type="password" id="rvPw" autocomplete="off" style="width:100%"></p><p id="rvMsg" role="alert" style="color:#C8102E;min-height:1.4em"></p>' +
            '<p style="margin-bottom:0"><button type="button" class="btn btn-red" id="rvGo">Open</button> <button type="button" class="btn btn-ghost btn-sm" id="rvNo">Cancel</button></p></div>';
          document.body.appendChild(m);
          const pw = m.querySelector("#rvPw"); pw.focus();
          const go = async ()=>{
            if(await sha(REVIEW_SALT + pw.value.trim().toLowerCase()) === REVIEW_HASH){ store.set("sys.reviewOK", REVIEW_HASH); turnOn(); location.reload(); }
            else m.querySelector("#rvMsg").textContent = "That password is not right. Check it and try again.";
          };
          m.querySelector("#rvGo").addEventListener("click", go);
          pw.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
          m.querySelector("#rvNo").addEventListener("click", ()=>{ location.href = location.pathname; });
        });
      }
    }
  }catch(e){}
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
  // Pages write default values (step 1, empty fields) when they load, so "has progress" means real
  // typing, ticked boxes, answered questions, or having moved past step 1.
  function hasRealWork(){
    return progressKeys().some(k=>{
      let v; try{ v = JSON.parse(localStorage.getItem(k)); }catch(e){ return true; }
      if(/\.(step|max)$/.test(k)) return Number(v) > 1;
      return !(v==="" || v===false || v==null);
    });
  }
  function backupJson(){
    if(!hasRealWork()) return null;
    const data = {}; progressKeys().forEach(k=>{ data[k] = localStorage.getItem(k); });
    return JSON.stringify({app:BK_APP, version:1, saved:new Date().toISOString(), data}, null, 1);
  }
  function saveBackup(){
    const text = backupJson();
    if(!text){ toast("Nothing to back up yet. Type something first."); return false; }
    const now = new Date();
    const blob = new Blob([text], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "acct4420-progress-backup-" + now.toISOString().slice(0,10) + ".json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    sysSet("lastBackup", now.toISOString()); sysSet("dirty", "0"); refreshBackupUi();
    toast("Backup saved. Check your Downloads folder.");
    return true;
  }
  function parseBackup(text){
    let o; try{ o = JSON.parse(text); }catch(e){ return null; }
    if(!o || o.app!==BK_APP || !o.data || typeof o.data!=="object") return null;
    const keys = Object.keys(o.data).filter(k=>k.startsWith("velox.") && !k.startsWith("velox.sys.") && typeof o.data[k]==="string");
    return keys.length ? {saved:o.saved, keys, data:o.data} : null;
  }
  // Returns true if the page is about to reload with restored data.
  function applyBackup(b, ask){
    const when = b.saved ? new Date(b.saved).toLocaleString() : "an unknown date";
    if(ask && !confirm("Restore your progress from the backup saved on " + when + "?\n\nThis replaces everything currently saved in this browser with the contents of that file. Continue?")) return false;
    try{
      progressKeys().forEach(k=>localStorage.removeItem(k));
      b.keys.forEach(k=>localStorage.setItem(k, b.data[k]));
      sysSet("lastBackup", new Date().toISOString()); sysSet("dirty","0");
    }catch(e){ alert("Your browser would not let this page save the restored data. Check that private browsing is off and try again."); return false; }
    alert("Your progress is restored. The page will reload now."); location.reload();
    return true;
  }
  function restoreBackup(file){
    const rd = new FileReader();
    rd.onload = ()=>{
      const b = parseBackup(rd.result);
      if(!b){ alert("That file is not a progress backup from this course. Choose the file named acct4420-progress-backup-(date).json or acct4420-progress.json that you saved earlier."); return; }
      applyBackup(b, true);
    };
    rd.readAsText(file);
  }

  // ---- Automatic saving to a file on the student's computer ------------------------
  // Chrome and Edge on a computer can keep a file handle the student picks once; the page then
  // rewrites that file whenever progress changes. Other browsers keep the manual backup button.
  const FS_OK = typeof window.showSaveFilePicker === "function" && window.isSecureContext && !!window.indexedDB;
  const AUTO_PICK = {suggestedName:"acct4420-progress.json", types:[{description:"Course progress", accept:{"application/json":[".json"]}}]};
  const idb = {
    db(){ return new Promise((res,rej)=>{ const r = indexedDB.open("acct4420-autosave",1); r.onupgradeneeded=()=>r.result.createObjectStore("h"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); },
    async get(k){ const d = await this.db(); return new Promise((res,rej)=>{ const q = d.transaction("h").objectStore("h").get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); },
    async set(k,v){ const d = await this.db(); return new Promise((res,rej)=>{ const t = d.transaction("h","readwrite"); t.objectStore("h").put(v,k); t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); }); },
    async del(k){ const d = await this.db(); return new Promise((res,rej)=>{ const t = d.transaction("h","readwrite"); t.objectStore("h").delete(k); t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); }); }
  };
  let autoHandle = null, autoState = FS_OK ? "init" : "none", autoTimer, autoName = "";   // none | off | on | paused | error
  function setAuto(st){ autoState = st; refreshBackupUi(); }
  async function writeAuto(){
    if(!autoHandle || autoState==="paused") return;
    const text = backupJson();
    if(!text) return;   // never replace a good file with an empty one
    try{
      const w = await autoHandle.createWritable(); await w.write(text); await w.close();
      sysSet("lastAuto", new Date().toISOString()); sysSet("dirty","0"); setAuto("on");
    }catch(e){ setAuto("error"); }
  }
  function scheduleAuto(){ if(autoHandle){ clearTimeout(autoTimer); autoTimer = setTimeout(writeAuto, 1200); } }
  async function readAutoFile(){
    try{ const f = await autoHandle.getFile(); return f.size ? parseBackup(await f.text()) : null; }catch(e){ return null; }
  }
  async function enableAuto(){
    let fh;
    try{ fh = await window.showSaveFilePicker(AUTO_PICK); }catch(e){ return; }   // student cancelled
    autoHandle = fh; autoName = fh.name || "";
    try{ await idb.set("handle", fh); }catch(e){}
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
    if(!hasRealWork()){          // new browser or cleared data: the file may already hold the work
      const b = await readAutoFile();
      if(b && applyBackup(b, true)) return;
    }
    setAuto("on");                       // the student just granted access to this file
    await writeAuto();
    if(autoState==="on") toast("Automatic saving is on.");
  }
  async function resumeAuto(){
    if(!autoHandle) return enableAuto();
    let p = "denied"; try{ p = await autoHandle.requestPermission({mode:"readwrite"}); }catch(e){}
    if(p!=="granted"){ setAuto("paused"); return; }
    setAuto("on");
    if(!hasRealWork()){ const b = await readAutoFile(); if(b && applyBackup(b, true)) return; }
    await writeAuto();
  }
  async function disableAuto(){
    clearTimeout(autoTimer); autoHandle = null; autoName = "";
    try{ await idb.del("handle"); }catch(e){}
    setAuto("off");
  }
  async function initAutoCore(){
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
    if(!FS_OK) return;
    let h = null; try{ h = await idb.get("handle"); }catch(e){}
    if(!h){ setAuto("off"); return; }
    autoHandle = h; autoName = h.name || "";
    let p = "prompt"; try{ p = await h.queryPermission({mode:"readwrite"}); }catch(e){}
    if(p!=="granted"){ setAuto("paused"); return; }
    setAuto("on");
    if(!hasRealWork()){          // storage was cleared but the file is still here
      const b = await readAutoFile();
      if(b && applyBackup(b, true)) return;
    }
    await writeAuto();
  }
  async function initAuto(){
    try{ await initAutoCore(); }catch(e){}
    showStartPrompt();
  }
  document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="hidden" && autoState==="on") writeAuto(); });
  window.addEventListener("pagehide", ()=>{ if(autoState==="on") writeAuto(); });

  // Reminder shown on every module page, every visit: is automatic saving on?
  const isCoursePage = () => !!document.querySelector("main .wrap") && (!!document.querySelector(".step") || !!document.getElementById("startBtn"));
  function renderStatusBar(){
    if(!isCoursePage() || autoState==="none" || autoState==="init") return;
    const host = document.querySelector("main .wrap");
    let bar = document.getElementById("bkBar");
    if(!bar){
      bar = document.createElement("div"); bar.id = "bkBar"; bar.setAttribute("role","status");
      bar.innerHTML = '<span class="bk-bar-txt"></span> <button type="button" class="btn btn-sm bk-bar-btn"></button>';
      host.insertBefore(bar, host.firstChild);
      bar.querySelector("button").addEventListener("click", ()=>{ if(autoState==="paused") resumeAuto(); else if(autoState==="on") window.openBackupPanel && openBackupPanel(); else enableAuto(); });
    }
    const t = bar.querySelector(".bk-bar-txt"), b = bar.querySelector("button");
    const where = autoName ? " to " + autoName : "";
    if(autoState==="on"){ bar.className = "bk-bar ok"; t.innerHTML = "<b>Auto-save is ON.</b> Your work is being saved" + where + " as you type."; b.textContent = "Details"; b.className = "btn btn-ghost btn-sm bk-bar-btn"; }
    else if(autoState==="paused"){ bar.className = "bk-bar bad"; t.innerHTML = "<b>Auto-save is PAUSED.</b> Click Resume before you keep working, or your new work will not be saved to your file."; b.textContent = "Resume auto-save"; b.className = "btn btn-red btn-sm bk-bar-btn"; }
    else if(autoState==="error"){ bar.className = "bk-bar bad"; t.innerHTML = "<b>Auto-save is NOT working.</b> Your file may have been moved or deleted. Choose a save location again."; b.textContent = "Fix auto-save"; b.className = "btn btn-red btn-sm bk-bar-btn"; }
    else { bar.className = "bk-bar bad"; t.innerHTML = "<b>Auto-save is OFF.</b> Turn it on before you start working, or you could lose your work."; b.textContent = "Turn on auto-save"; b.className = "btn btn-red btn-sm bk-bar-btn"; }
  }
  let startPromptShown = false;
  function showStartPrompt(){
    if(startPromptShown || autoState==="on" || autoState==="none" || autoState==="init" || !document.querySelector(".step")) return;
    startPromptShown = true;
    const m = document.createElement("div"); m.id = "bkStart"; m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true"); m.setAttribute("aria-label","Turn on automatic saving");
    m.className = "bk-modal";
    const paused = autoState==="paused";
    m.innerHTML = '<div class="bk-modal-box"><h2 style="margin-top:0">' + (paused ? "Welcome back. Resume auto-save." : "Before you start: turn on auto-save") + '</h2>' +
      '<p>' + (paused
        ? "Your browser needs your permission again before it can keep saving your work to your file. <b>Click the red button below</b> to resume. It takes one click."
        : "Everything you type in this course is kept in this browser only. <b>If auto-save is off, you can lose your work.</b> It takes about 30 seconds to turn on: <b>click the red button, choose a folder you will not delete (such as Documents), and click Save</b>.") + '</p>' +
      '<p style="margin-bottom:0"><button type="button" class="btn btn-red" id="bkStartGo">' + (paused ? "Resume auto-save" : "Turn on auto-save") + '</button> <button type="button" class="btn btn-ghost btn-sm" id="bkStartLater">Not now (not recommended)</button></p></div>';
    document.body.appendChild(m);
    const close = () => { m.remove(); };
    m.querySelector("#bkStartGo").addEventListener("click", async ()=>{ close(); await (paused ? resumeAuto() : enableAuto()); });
    m.querySelector("#bkStartLater").addEventListener("click", close);
    m.querySelector("#bkStartGo").focus();
  }
  let panel, fab;
  function refreshBackupUi(){
    const last = sysGet("lastBackup"), dirty = sysGet("dirty")==="1", lastAuto = sysGet("lastAuto");
    if(fab){
      const t = {on:"Progress auto-saved", paused:"Auto-save paused: click to fix", error:"Auto-save problem: click", off:"Turn on auto-save"}[autoState]
        || (dirty ? "Save a backup (not saved yet)" : "Progress backup");
      fab.classList.toggle("unsaved", autoState==="paused" || autoState==="error" || autoState==="off" || (autoState==="none" && dirty));
      fab.classList.toggle("ok", autoState==="on");
      fab.querySelector(".lbl-txt").textContent = t;
    }
    const st = document.getElementById("bkStatus");
    if(st) st.textContent = last ? "Last backup file saved: " + new Date(last).toLocaleString() + (dirty ? ". You have typed more since then, so save a new one." : ". Nothing new since then.") : "You have not saved a backup file yet.";
    const as = document.getElementById("autoStatus");
    if(as){
      const where = autoName ? " (" + autoName + ")" : "";
      as.textContent = {
        on: "Automatic saving is ON" + where + (lastAuto ? ". Last saved " + new Date(lastAuto).toLocaleTimeString() + "." : "."),
        paused: "Automatic saving is PAUSED. Your browser needs your permission again. Click Resume.",
        error: "The last automatic save did not work. The file may have been moved or deleted. Click Choose a save location to fix it.",
        off: "Automatic saving is OFF. Your work is saved only in this browser until you turn it on.",
        none: "Automatic saving needs Chrome or Edge on a computer. Use the manual backup below instead."
      }[autoState] || "";
      as.className = "bk-auto " + (autoState==="on" ? "ok" : "warn");
    }
    renderStatusBar();
    const q = id => document.getElementById(id);
    if(q("autoOn")) q("autoOn").hidden = !(autoState==="off" || autoState==="error");
    if(q("autoResume")) q("autoResume").hidden = autoState!=="paused";
    if(q("autoOff")) q("autoOff").hidden = !(autoState==="on" || autoState==="paused" || autoState==="error");
  }
  function buildBackupUi(){
    fab = document.createElement("button"); fab.type="button"; fab.className="bk-fab";
    fab.innerHTML = '<span class="lbl-txt"></span>'; fab.setAttribute("aria-haspopup","dialog");
    panel = document.createElement("div"); panel.className="bk-panel"; panel.hidden = true; panel.setAttribute("role","dialog"); panel.setAttribute("aria-label","Protect your work");
    panel.innerHTML = '<h3>Protect your work</h3>' +
      '<p>What you type is kept <b>in this browser on this computer</b>. If you switch computers or browsers, use a private window, or clear your browser data, it is gone, unless you save it to a file.</p>' +
      '<div id="autoBox"><h4>Automatic saving (recommended)</h4>' +
      '<p id="autoStatus" class="bk-auto"></p>' +
      '<p><button type="button" class="btn btn-red btn-sm" id="autoOn">Turn on automatic saving</button><button type="button" class="btn btn-red btn-sm" id="autoResume">Resume automatic saving</button> <button type="button" class="btn btn-ghost btn-sm" id="autoOff">Turn off</button></p>' +
      '<p class="hint">When you click <b>Turn on automatic saving</b>, a Save window opens. <b>Choose a folder you will not delete</b>, such as Documents or a cloud-synced folder like OneDrive or Google Drive, and <b>click Save</b>. After that the file <code>acct4420-progress.json</code> updates by itself whenever you type. Only you can see that file.</p></div>' +
      '<h4>Manual backup file</h4>' +
      '<p id="bkStatus" class="hint"></p>' +
      '<p><button type="button" class="btn btn-ghost btn-sm" id="bkSave">Save my progress to a file</button></p>' +
      '<h4>Get your work back</h4>' +
      '<p>On a new computer or browser, <b>open this course site, click the button below, and choose your backup file</b> (<code>acct4420-progress.json</code> or a file named <code>acct4420-progress-backup-(date).json</code>). If you use automatic saving on a computer that already has your file, you can also just turn it on and pick that same file.</p>' +
      '<p><label class="btn btn-ghost btn-sm" for="bkFile" style="cursor:pointer">Restore my progress from a file</label><input type="file" id="bkFile" accept=".json,application/json" hidden></p>' +
      '<p class="hint">One file covers every module. Your backup is not your submission: upload the Word file from the module page to Canvas.</p>' +
      '<p style="text-align:right;margin:0"><button type="button" class="btn btn-ghost btn-sm" id="bkClose">Close</button></p>';
    document.body.appendChild(panel); document.body.appendChild(fab);
    const show = on => { panel.hidden = !on; fab.setAttribute("aria-expanded", on?"true":"false"); if(on) refreshBackupUi(); };
    fab.addEventListener("click", ()=>{
      if(panel.hidden && autoState==="paused"){ resumeAuto(); }       // the click is the permission gesture
      show(panel.hidden);
    });
    panel.querySelector("#bkClose").addEventListener("click", ()=>{ show(false); fab.focus(); });
    panel.querySelector("#bkSave").addEventListener("click", saveBackup);
    panel.querySelector("#autoOn").addEventListener("click", enableAuto);
    panel.querySelector("#autoResume").addEventListener("click", resumeAuto);
    panel.querySelector("#autoOff").addEventListener("click", ()=>{ if(confirm("Turn off automatic saving? Your existing file stays where it is, but it will stop updating.")) disableAuto(); });
    panel.querySelector("#bkFile").addEventListener("change", e=>{ const f = e.target.files[0]; if(f) restoreBackup(f); e.target.value=""; });
    document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !panel.hidden){ show(false); fab.focus(); } });
    window.openBackupPanel = ()=>show(true);
    refreshBackupUi();
    initAuto();
    // The course asks for Chrome or Edge on a computer; say so plainly on module pages in any other browser.
    const host = document.querySelector("main .wrap");
    if(!FS_OK && host && document.querySelector(".step")){
      const n = document.createElement("div"); n.className = "bk-browser"; n.setAttribute("role","alert");
      n.innerHTML = "<b>Please switch browsers.</b> This course requires <b>Google Chrome or Microsoft Edge on a computer</b>. Your browser cannot save your work automatically, so you could lose it. <b>Open this page in Chrome or Edge.</b>";
      host.insertBefore(n, host.firstChild);
    }
  }
  // Nudge after a student finishes a step (the step counter or "done" flag advances).
  let nudgeTimer;
  window.progressChanged = function(k, v, old){
    scheduleAuto();
    refreshBackupUi();
    if(autoState==="on") return;       // saved by itself
    if(!/(^|\.)(max|done)$/.test(k)) return;
    if(old==null || (k.endsWith("max") ? !(Number(v) > Number(JSON.parse(old))) : v!==true)) return;   // not a first-visit default
    let b = document.getElementById("bkNudge");
    if(!b){
      b = document.createElement("div"); b.id="bkNudge"; b.className="bk-nudge"; b.id = "rvPill"; b.setAttribute("role","status");
      b.innerHTML = '<span id="bkNudgeTxt"></span> <button type="button" class="btn btn-gold btn-sm" id="bkNudgeSave"></button> <button type="button" class="btn btn-ghost btn-sm" id="bkNudgeX" aria-label="Dismiss">Later</button>';
      document.body.appendChild(b);
      b.querySelector("#bkNudgeX").addEventListener("click", ()=>b.classList.remove("show"));
    }
    const auto = autoState==="off" || autoState==="paused" || autoState==="error";
    b.querySelector("#bkNudgeTxt").innerHTML = auto ? "<b>Step finished.</b> Turn on automatic saving so you cannot lose your work." : "<b>Step finished.</b> Save a backup so you cannot lose your work.";
    const btn = b.querySelector("#bkNudgeSave"); btn.textContent = auto ? "Turn on automatic saving" : "Save backup";
    btn.onclick = ()=>{ b.classList.remove("show"); if(auto) (autoState==="paused" ? resumeAuto() : enableAuto()); else saveBackup(); };
    b.classList.add("show"); clearTimeout(nudgeTimer); nudgeTimer = setTimeout(()=>b.classList.remove("show"), 30000);
  };
  window.addEventListener("beforeunload", e=>{
    if(autoState!=="on" && sysGet("dirty")==="1" && hasRealWork()){ e.preventDefault(); e.returnValue = ""; }
  });
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", buildBackupUi); else buildBackupUi();
})();
