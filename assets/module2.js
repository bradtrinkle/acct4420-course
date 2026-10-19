(function(){
  const ITEMS = [
    {n:1,r:"Revenue",t:"Cars sold: 1,210 versus 1,265 in the budget."},
    {n:2,r:"Cost of goods sold",t:"A new tariff on imported carbon-fiber panels added about $3,800 thousand to cost of goods sold."},
    {n:3,r:"Cost of goods sold",t:"Supplier Vexa Composites prices panel sets at $4,150 each under contract VC-2291."},
    {n:4,r:"Freight-out",t:"Expedited air freight to dealers for the launch cars raised freight costs."},
    {n:5,r:"Revenue",t:"A planned 4% dealer price increase takes effect in January; dealers have not been told."},
    {n:6,r:"Selling, general and administrative",t:"The estimated legal settlement of $1,250 thousand is under negotiation and is not public."},
    {n:7,r:"Incentive compensation",t:"Includes a $410 thousand retention bonus for the VP of Engineering."},
    {n:8,r:"Severance accrual",t:"Restructuring plan for 62 employees at the South Carolina plant. Not yet announced to employees."}
  ];
  const DECISIONS = ["Keep","Generalize","Remove"];
  const VERDICTS = ["Matches the data","Does not match the data","Not in the data"];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Draft","Mastery","Quiz","Reflect"];
  const P = "m2.";
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;

  /* ---------- render dynamic parts ---------- */
  $("#items").innerHTML = ITEMS.map(t=>`
    <div class="task">
      <div class="n">${t.n}</div>
      <div><b>${esc(t.t)}</b><div class="hint" style="margin:2px 0 0">It sits in the row: ${esc(t.r)}</div></div>
      <div class="row">
        <label class="lbl" for="dec${t.n}">What would you do?</label>
        <select id="dec${t.n}" data-save="dec.${t.n}" data-req data-sel><option value="">Choose one…</option>${DECISIONS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
        <label class="lbl" for="dwhy${t.n}">Why? (needed for the summary? harm if it leaked?)</label>
        <textarea id="dwhy${t.n}" data-save="dwhy.${t.n}" data-min="10" data-req style="min-height:60px"></textarea>
      </div>
    </div>`).join("");

  $("#vrows").innerHTML = [1,2,3].map(k=>`
    <div class="card">
      <h3>Claim ${k}</h3>
      <label class="lbl" for="vc${k}"><b>Copy the claim</b> from the summary</label>
      <textarea id="vc${k}" data-save="v.${k}.claim" data-min="10" data-req style="min-height:60px"></textarea>
      <label class="lbl" for="vw${k}"><b>Where in your safe file</b> did you look? (line item and column)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="3" data-req>
      <label class="lbl" for="vv${k}"><b>What did you find?</b></label>
      <select id="vv${k}" data-save="v.${k}.verdict" data-req data-sel><option value="">Choose one…</option>${VERDICTS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <label class="lbl" for="va${k}"><b>What did you do about it?</b> (kept it, fixed the number, removed it, or would confirm with someone)</label>
      <textarea id="va${k}" data-save="v.${k}.action" data-min="10" data-req style="min-height:60px"></textarea>
    </div>`).join("");

  /* ---------- config-driven bits ---------- */
  const C = window.COURSE || {};
  if(C.videoUrl && C.videoUrl[2]) $("#videoBox").innerHTML = videoHtml(C.videoUrl[2], "Module 2 video");
  if(C.quizUrl && C.quizUrl[2]){ const q=$("#quizLink"); q.href=C.quizUrl[2]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[2]){ const s=$("#submitLink"); s.href=C.submitUrl[2]; s.style.display="inline"; }

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
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 2":"Next";
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
    const decs = ITEMS.map(t=>({n:t.n,t:t.t,d:val("dec"+t.n),w:val("dwhy"+t.n)}));
    const ver = [1,2,3].map(k=>({k,claim:val("vc"+k),where:val("vw"+k),verdict:val("vv"+k),action:val("va"+k)}));
    return {name:val("stuName"),grad:isGrad(),decs,ver,
      r1p:val("r1p"),r1o:val("r1o"),r1w:val("r1w"),safedesc:val("safedesc"),
      r2p:val("r2p"),r2q:val("r2q"),r2o:val("r2o"),cmp:val("cmp"),tpl:val("tpl"),wnote:val("wnote"),disc:val("disc"),
      rev:val("rev"),rej:val("rej"),trans:val("trans"),g1:val("g1"),g2:val("g2")};
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. STRUCTURED PROMPT AND PROCESS (Round 2)\nRequest I sent:\n"+d.r2p+"\n\nQuestions Claude asked and my answers:\n"+d.r2q+"\n\nFinal summary Claude wrote:\n"+d.r2o+"\n\n";
    s += "B. VERIFICATION\n"+d.ver.map(x=>`Claim ${x.k}: ${x.claim}\nWhere I looked: ${x.where}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\n";
    s += "C. ETHICAL AI: CONFIDENTIALITY\n"+d.decs.map(x=>`Note ${x.n} (${x.t}): ${x.d}. Reason: ${x.w}`).join("\n")+"\n\nHow I built the prompt-safe file:\n"+d.safedesc+"\n\n";
    s += "D. COMPARISON AND PLAYBOOK\nRound 1 request: "+d.r1p+"\nRound 1 output summary: "+d.r1o+"\nRound 1 weaknesses: "+d.r1w+"\n\nWhat changed from Round 1 to Round 2:\n"+d.cmp+"\n\nPrompt Playbook template:\n"+d.tpl+"\n\nNote to Walt Brenner:\n"+d.wnote+"\n\n";
    s += "E. AI USE DISCLOSURE\n"+d.disc+"\n";
    if(!forCoach){
      s += "\nF. COACH FEEDBACK AND MASTERY EVIDENCE\nWhat I changed after feedback: "+d.rev+"\nFeedback I rejected and why: "+(d.rej||"(none)")+"\n\nFull coach conversation:\n"+d.trans+"\n";
    }
    if(d.grad) s += "\nG. GRADUATE STUDENTS ONLY\nComparison 1: "+d.g1+"\nComparison 2: "+d.g2+"\n";
    return s;
  }
  function asDoc(d){
    const p = t => "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
    const dec = d.decs.map(x=>`<tr><td>${x.n}</td><td>${esc(x.t)}</td><td>${esc(x.d)}</td><td>${esc(x.w)}</td></tr>`).join("");
    const ver = d.ver.map(x=>`<tr><td>${x.k}</td><td>${esc(x.claim)}</td><td>${esc(x.where)}</td><td>${esc(x.verdict)}</td><td>${esc(x.action)}</td></tr>`).join("");
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 2 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 2: The Prompt Playbook</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Structured prompt and process (Round 2)</h2><p><b>Request I sent:</b></p>${p(d.r2p)}<p><b>Questions Claude asked and my answers:</b></p>${p(d.r2q)}<p><b>Final summary Claude wrote:</b></p>${p(d.r2o)}
<h2>B. Verification</h2><table><tr><th>#</th><th>Claim</th><th>Where I looked</th><th>What I found</th><th>What I did</th></tr>${ver}</table>
<h2>C. Ethical AI: confidentiality</h2><table><tr><th>#</th><th>Note</th><th>Decision</th><th>Reason</th></tr>${dec}</table><p><b>How I built the prompt-safe file:</b></p>${p(d.safedesc)}
<h2>D. Comparison and Playbook</h2><p><b>Round 1 request:</b></p>${p(d.r1p)}<p><b>Round 1 output summary:</b></p>${p(d.r1o)}<p><b>Round 1 weaknesses:</b></p>${p(d.r1w)}<p><b>What changed from Round 1 to Round 2:</b></p>${p(d.cmp)}<p><b>Prompt Playbook template:</b></p>${p(d.tpl)}<p><b>Note to Walt Brenner:</b></p>${p(d.wnote)}
<h2>E. AI use disclosure</h2>${p(d.disc)}
<h2>F. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>G. Graduate students only</h2><p><b>Comparison 1</b></p>${p(d.g1)}<p><b>Comparison 2</b></p>${p(d.g2)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module2_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyCoach").addEventListener("click",()=>copyText($("#coachText").textContent));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[4]);
    copyText("MODULE 2 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 2 complete!</h2>
      <p>You ran the same task two ways, kept confidential notes out of the prompt, checked what AI said against the data, and wrote a ${words(d.tpl)}-word reusable template for Walt. That is the habit: <b>give AI the context it needs, keep out what it should never see, and check what comes back.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 3 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 2 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#wnote").dataset.minwords = "40"; $("#wnote").dataset.maxwords = "150";
  $("#isGrad").dispatchEvent(new Event("change"));
  onChange($("#wnote")); onChange($("#isGrad"));
  render();
})();
