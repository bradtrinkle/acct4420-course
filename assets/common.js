(function(){
  const store = {
    get(k, d){ try{ const v = localStorage.getItem("velox."+k); return v===null? d : JSON.parse(v);}catch(e){return d;} },
    set(k, v){ try{ localStorage.setItem("velox."+k, JSON.stringify(v)); }catch(e){} }
  };
  window.store = store;
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
})();
