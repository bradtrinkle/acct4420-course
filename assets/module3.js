(function(){
  const CLAIMS = [
    "A deposit in transit of 24,000.00 is added to the bank balance.",
    "The three outstanding checks total 19,360.00.",
    "The bank service charge of 85.00 reduces the book balance, and the interest of 210.00 increases it.",
    "A \u201cmiscellaneous adjustment\u201d of 19,375.00 is added to the book balance.",
    "The adjusted bank balance is 412,500.00 + 24,000.00 \u2212 19,360.00 = 417,140.00. The adjusted book balance is 418,140.00. The 1,000.00 gap is just rounding."
  ];
  const CLAIM_VERDICTS = ["Supported by the source","Wrong or not supported by the source","The number is supported, but the explanation is missing or wrong"];
  const VERDICTS = ["Matches the source","Matches the source, but on the wrong side or the wrong type","Amount differs from the source","Not in the source"];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Draft","Mastery","Quiz","Reflect"];
  const P = "m3.";
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;

  /* ---------- render dynamic parts ---------- */
  $("#claims").innerHTML = CLAIMS.map((c,i)=>{const n=i+1; return `
    <div class="task">
      <div class="n">${n}</div>
      <div><b>Claim ${n}:</b> ${esc(c)}</div>
      <div class="row">
        <label class="lbl" for="cv${n}">Is it right?</label>
        <select id="cv${n}" data-save="c.${n}.verdict" data-req data-sel><option value="">Choose one…</option>${CLAIM_VERDICTS.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
        <label class="lbl" for="cw${n}">What did you check, and what did you find? (show your arithmetic if it is a number)</label>
        <textarea id="cw${n}" data-save="c.${n}.why" data-min="15" data-req style="min-height:60px"></textarea>
      </div>
    </div>`;}).join("");

  $("#vrows").innerHTML = [1,2,3,4,5].map(k=>`
    <div class="card">
      <h3>Reconciling item ${k}</h3>
      <label class="lbl" for="vc${k}"><b>Describe the item</b> as it appears in Claude's reconciliation (what it is and which side)</label>
      <input type="text" id="vc${k}" data-save="v.${k}.item" data-min="5" data-req>
      <label class="lbl" for="vw${k}"><b>Source line you found</b> (which file, the date, and the reference; give both file lines if the item involves two, such as a check recorded at one amount and cleared at another)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="5" data-req>
      <label class="lbl" for="vm${k}"><b>Amounts:</b> what Claude said, and what the source line says</label>
      <input type="text" id="vm${k}" data-save="v.${k}.amts" data-min="3" data-req>
      <label class="lbl" for="vv${k}"><b>What did you find?</b> (if the difference between two lines IS the reconciling item, choose "Matches the source")</label>
      <select id="vv${k}" data-save="v.${k}.verdict" data-req data-sel><option value="">Choose one…</option>${VERDICTS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <label class="lbl" for="va${k}"><b>What did you do about it?</b> (kept it, corrected it, removed it, or would ask someone)</label>
      <textarea id="va${k}" data-save="v.${k}.action" data-min="5" data-req style="min-height:50px"></textarea>
    </div>`).join("");

  /* ---------- config-driven bits ---------- */
  const C = window.COURSE || {};
  if(C.videoUrl && C.videoUrl[3]) $("#videoBox").innerHTML = videoHtml(C.videoUrl[3], "Module 3 video");
  if(C.quizUrl && C.quizUrl[3]){ const q=$("#quizLink"); q.href=C.quizUrl[3]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[3]){ const s=$("#submitLink"); s.href=C.submitUrl[3]; s.style.display="inline"; }

  /* ---------- save / restore ---------- */
  const key = el => P+"f."+el.dataset.save;
  $$("[data-save]").forEach(el=>{
    const v = store.get(key(el), null);
    if(v!==null){ if(el.type==="checkbox") el.checked = !!v; else el.value = v; }
    const ev = (el.type==="checkbox"||el.tagName==="SELECT")?"change":"input";
    el.addEventListener(ev, ()=>{ store.set(key(el), el.type==="checkbox"?el.checked:el.value); onChange(el); });
  });
  $$("input[type=checkbox]").forEach(cb=>{ const row=cb.closest(".check"); if(row){ const f=()=>row.classList.toggle("done",cb.checked); cb.addEventListener("change",f); f(); }});

  /* ---------- quick checks ---------- */
  $$(".qc").forEach(q=>{
    const id = q.dataset.id, fb = $(".fb",q), right = Number(q.dataset.correct);
    const btns = $$(".choice",q);
    const markRight = ()=>{ btns.forEach(b=>b.classList.remove("wrong")); btns[right].classList.add("right"); fb.className="fb show ok"; fb.textContent=fb.dataset.ok; q.dataset.solved="1"; };
    if(store.get(P+"qc."+id,false)) markRight();
    btns.forEach((b,i)=>b.addEventListener("click",()=>{
      if(i===right){ store.set(P+"qc."+id,true); markRight(); onChange(q); }
      else { b.classList.add("wrong"); fb.className="fb show no"; fb.textContent=fb.dataset.no; }
    }));
  });

  /* ---------- gating ---------- */
  function isGrad(){ return $("#isGrad").checked; }
  function unmet(stepEl){
    const out = [];
    $$("[data-req]",stepEl).forEach(el=>{
      let ok = true;
      if(el.classList.contains("qc")) ok = el.dataset.solved==="1";
      else if(el.type==="checkbox") ok = el.checked;
      else if(el.tagName==="SELECT") ok = el.value!=="";
      else {
        const v = el.value.trim();
        ok = v.length >= Number(el.dataset.min||1);
        if(ok && el.dataset.minwords) ok = words(v) >= Number(el.dataset.minwords);
        if(ok && el.dataset.maxwords) ok = words(v) <= Number(el.dataset.maxwords);
      }
      if(!ok) out.push(el);
    });
    if(stepEl.dataset.step==="5" && isGrad()){
      ["g1","g2"].forEach(id=>{ const el=$("#"+id); if(el.value.trim().length<30) out.push(el); });
    }
    return out;
  }

  /* ---------- navigation ---------- */
  let cur = store.get(P+"step",1), maxReached = store.get(P+"max",1);
  const steps = $$(".step"), dots = $("#dots");
  dots.innerHTML = STEP_NAMES.map((n,i)=>`<button class="dot" data-d="${i+1}" type="button"><span class="c">${i+1}</span><span class="l">${n}</span></button>`).join("");
  function render(){
    steps.forEach(s=>s.classList.toggle("active", Number(s.dataset.step)===cur));
    $$(".dot").forEach(d=>{ const i=Number(d.dataset.d); d.classList.toggle("now",i===cur); d.classList.toggle("done",i<cur||store.get(P+"done",false)); d.disabled = i>maxReached; d.setAttribute("aria-current", i===cur?"step":"false"); });
    const pct = store.get(P+"done",false) ? 100 : Math.max(3,Math.min(97,((cur-1)/8)*100+3));
    $("#fill").style.width = pct+"%"; $("#car").style.left = pct+"%";
    $("#prev").style.visibility = cur===1?"hidden":"visible";
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 3":"Next";
    nx.style.display = (cur===8 && store.get(P+"done",false)) ? "none" : "inline-block";
    updateGate();
    store.set(P+"step",cur); store.set(P+"max",maxReached);
  }
  function updateGate(){
    const g = $("#gate"), left = unmet(steps[cur-1]).length;
    if(cur===8 && store.get(P+"done",false)){ g.style.display="none"; return; }
    g.style.display = "block";
    if(left===0){ g.className="gate ok"; g.textContent = cur===8?"All set. Finish when you are ready.":"Nice work. You can continue."; }
    else { g.className="gate"; g.textContent = left+(left===1?" item":" items")+" left on this step."; }
  }
  function onChange(el){
    if(el && el.id==="wnote"){ const n=words(el.value); $("#wc").textContent = n+" words (150 or fewer)"; }
    if(el && el.id==="isGrad") $("#gradBlock").style.display = el.checked?"block":"none";
    updateGate();
  }
  function go(n){ cur = n; if(n>maxReached) maxReached = n; render(); window.scrollTo({top:0,behavior:"smooth"}); }
  $("#next").addEventListener("click",()=>{
    const left = unmet(steps[cur-1]);
    if(left.length){
      const el = left[0]; (el.closest(".task,.card,.turn,.check")||el).scrollIntoView({behavior:"smooth",block:"center"});
      if(el.focus && !el.classList.contains("qc")) el.focus({preventScroll:true});
      $("#gate").textContent = "Finish this first, then you can continue."; return;
    }
    if(cur===8) return finish();
    go(cur+1);
  });
  $("#prev").addEventListener("click",()=>go(cur-1));
  dots.addEventListener("click",e=>{ const b=e.target.closest(".dot"); if(b && !b.disabled) go(Number(b.dataset.d)); });
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(Number(b.dataset.goto))));

  /* ---------- building the submission ---------- */
  const val = id => ($("#"+id)||{value:""}).value.trim();
  function data(){
    const claims = CLAIMS.map((c,i)=>({n:i+1,t:c,v:val("cv"+(i+1)),w:val("cw"+(i+1))}));
    const ver = [1,2,3,4,5].map(k=>({k,item:val("vc"+k),where:val("vw"+k),amts:val("vm"+k),verdict:val("vv"+k),action:val("va"+k)}));
    const f = ["name","r1p","r1o","r1w","p2prompts","p2a","p2c","p2d","rc","rmiss","sc1","sc2","fin","finbank","finbook","finok","tpl","wnote","disc","e4d","e4w","rev","rej","trans","g1","g2"];
    const o = {grad:isGrad(),claims,ver}; f.forEach(id=>{o[id]=val(id);}); o.name=val("stuName"); return o;
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. CHAIN AND PROMPTING PROCESS\nFirst attempt request (one request): "+d.r1p+"\nFirst attempt summary: "+d.r1o+"\nThings I could not tell: "+d.r1w+"\n\nMy four chained requests:\n"+d.p2prompts+"\n\nStage A answer (leftover items):\n"+d.p2a+"\n\nStage C reconciliation:\n"+d.p2c+"\n\nStage D self-critique and what it changed:\n"+d.p2d+"\n\n";
    s += "B. VERIFICATION\nRecomputed totals: "+d.rc+"\n\n"+d.ver.map(x=>`Item ${x.k}: ${x.item}\nSource line: ${x.where}\nAmounts: ${x.amts}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\nMissing or invented items: "+d.rmiss+"\n\n";
    s += "C. ETHICAL AI: ACCURACY\nStep 4 review of the AI's work:\n"+d.claims.map(x=>`Claim ${x.n} (${x.t}): ${x.v}. Check: ${x.w}`).join("\n")+"\nDecision: "+d.e4d+"\nWhy: "+d.e4w+"\nHow much I verified my own final reconciliation: "+d.finok+"\n\n";
    s += "D. FINAL RECONCILIATION AND SECOND RUN\nFinal reconciliation:\n"+d.fin+"\nAdjusted bank balance: "+d.finbank+"\nAdjusted book balance: "+d.finbook+"\n\nSecond run items:\n"+d.sc1+"\n\nComparison of the two runs:\n"+d.sc2+"\n\n";
    s += "E. TEMPLATE AND NOTE\nReconciliation Chain Template:\n"+d.tpl+"\n\nNote to Walt Brenner:\n"+d.wnote+"\n\n";
    s += "F. AI USE DISCLOSURE\n"+d.disc+"\n";
    if(!forCoach){
      s += "\nG. COACH FEEDBACK AND MASTERY EVIDENCE\nWhat I changed after feedback: "+d.rev+"\nFeedback I rejected and why: "+(d.rej||"(none)")+"\n\nFull coach conversation:\n"+d.trans+"\n";
    }
    if(d.grad) s += "\nH. GRADUATE STUDENTS ONLY\nFormula check: "+d.g1+"\nComparison with AI: "+d.g2+"\n";
    return s;
  }
  function asDoc(d){
    const p = t => "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
    const cl = d.claims.map(x=>`<tr><td>${x.n}</td><td>${esc(x.t)}</td><td>${esc(x.v)}</td><td>${esc(x.w)}</td></tr>`).join("");
    const ver = d.ver.map(x=>`<tr><td>${x.k}</td><td>${esc(x.item)}</td><td>${esc(x.where)}</td><td>${esc(x.amts)}</td><td>${esc(x.verdict)}</td><td>${esc(x.action)}</td></tr>`).join("");
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 3 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 3: The Cash Reconciliation Detective</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Chain and prompting process</h2><p><b>First attempt request (one request):</b></p>${p(d.r1p)}<p><b>First attempt summary:</b></p>${p(d.r1o)}<p><b>Things I could not tell:</b></p>${p(d.r1w)}<p><b>My four chained requests:</b></p>${p(d.p2prompts)}<p><b>Stage A answer (leftover items):</b></p>${p(d.p2a)}<p><b>Stage C reconciliation:</b></p>${p(d.p2c)}<p><b>Stage D self-critique and what it changed:</b></p>${p(d.p2d)}
<h2>B. Verification</h2><p><b>Recomputed totals:</b></p>${p(d.rc)}<table><tr><th>#</th><th>Item</th><th>Source line</th><th>Amounts</th><th>What I found</th><th>What I did</th></tr>${ver}</table><p><b>Missing or invented items:</b></p>${p(d.rmiss)}
<h2>C. Ethical AI: accuracy</h2><table><tr><th>#</th><th>Claim</th><th>My verdict</th><th>What I checked</th></tr>${cl}</table><p><b>Decision:</b> ${esc(d.e4d)}</p><p><b>Why:</b></p>${p(d.e4w)}<p><b>How much I verified my own final reconciliation:</b> ${esc(d.finok)}</p>
<h2>D. Final reconciliation and second run</h2>${p(d.fin)}<p><b>Adjusted bank balance:</b> ${esc(d.finbank)} &nbsp; <b>Adjusted book balance:</b> ${esc(d.finbook)}</p><p><b>Second run items:</b></p>${p(d.sc1)}<p><b>Comparison of the two runs:</b></p>${p(d.sc2)}
<h2>E. Template and note</h2><p><b>Reconciliation Chain Template:</b></p>${p(d.tpl)}<p><b>Note to Walt Brenner:</b></p>${p(d.wnote)}
<h2>F. AI use disclosure</h2>${p(d.disc)}
<h2>G. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>H. Graduate students only</h2><p><b>Formula check</b></p>${p(d.g1)}<p><b>Comparison with AI</b></p>${p(d.g2)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module3_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyCoach").addEventListener("click",()=>copyText($("#coachText").textContent));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[4]);
    copyText("MODULE 3 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 3 complete!</h2>
      <p>You split a many-step job into a chain, made AI show its reasoning, had it challenge itself, ran it twice, checked it against the source, and wrote a ${words(d.tpl)}-word reusable template for Walt. That is the habit: <b>break big jobs into steps, make the thinking visible, and check what comes back.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 4 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 3 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#wnote").dataset.minwords = "40"; $("#wnote").dataset.maxwords = "150";
  $("#isGrad").dispatchEvent(new Event("change"));
  onChange($("#wnote")); onChange($("#isGrad"));
  render();
})();
