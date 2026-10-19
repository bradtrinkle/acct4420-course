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
  window.copyText = async function(text){
    try{ await navigator.clipboard.writeText(text); toast("Copied!"); }
    catch(e){
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try{ document.execCommand("copy"); toast("Copied!"); }catch(_){ toast("Select the text and copy it"); }
      ta.remove();
    }
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
