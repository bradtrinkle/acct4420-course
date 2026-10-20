(function(){
  const SITUATIONS = [
    {facts:"The analyst pasted the statements into Claude, asked for a draft, tidied the wording, and sent it to Priya. Nobody else has seen it.", line:"Prepared by Jamie Ortiz."},
    {facts:"The analyst had Claude draft the page, recalculated the ratios by hand from the files, and found that the reason for the marketing increase is not in the notes, so the page says so. Walt Brenner read the whole page and the hand calculations and approved it.", line:"AI-assisted draft, reviewed by Walt Brenner. Ratios recomputed by hand. The cause of the marketing increase is not in the data."},
    {facts:"The analyst built the page in the Velox Reporting Project, then opened a second chat and asked Claude to review it. No person has read it.", line:"AI-assisted draft, reviewed by Velox Reporting Project (Claude)."},
    {facts:"The analyst used Claude for the draft, edited it, and sent it to Priya. Walt has not seen it and nobody else checked it.", line:"Written with AI."},
    {facts:"Walt received the page in the morning and had time to read only the headline and the first bullet before a meeting. He replied, “looks good.”", line:"AI-assisted draft, reviewed and verified by Walt Brenner."}
  ];
  const SIT_VERDICTS = ["Meets the policy","Does not meet the policy"];
  const FIND_VERDICTS = ["Matches my calculation","Differs only in rounding or wording","Differs from my calculation","Cannot be checked from the files"];
  const ANGLES = [
    {id:"Accounting: the cash story", major:"Accounting", title:"The cash story", text:"Write a paragraph of 150 to 200 words for the quarterly report that explains why cash fell by 13,900 even though net income was 30,100. Name two numbers that you matched across different statements."},
    {id:"Finance: analyst questions", major:"Finance", title:"Analyst questions", text:"Investors will ask three questions: why did margins fall, was the dividend covered by this quarter\u2019s cash, and how is the debt? Write a short answer to each, 60 words or fewer per answer, using only the files. The files give no outlook, so \u201cnot in the data\u201d can be part of an answer."},
    {id:"Marketing: pricing and volume brief", major:"Marketing", title:"Pricing and volume brief", text:"Revenue rose about 3.5% on about 3.4% more cars delivered, while margin fell. Write a brief of 150 to 200 words for sales and marketing leaders on what this suggests about price and volume, and list two questions to ask Finance. Remember note 5: keep confidential items out."},
    {id:"Management: manager message", major:"Management", title:"Message to managers", text:"Write a message of 150 to 200 words that a manager can use with their teams about the quarter: what to say and what not to say (see note 5), and how incentive pay follows operating income."},
    {id:"Supply chain: inventory and tariff briefing", major:"Supply chain", title:"Inventory and tariff briefing", text:"Inventory is at 72 days against a target of 65 to 70, and the new tariff cost about 3,800 (thousands of dollars, about $3.8 million) in Q3 2026, which management expects to continue. Write a briefing of 150 to 200 words for the supply chain team with two recommended actions and the extra data you would need."},
    {id:"MIS: reporting data checklist", major:"MIS (information systems)", title:"Reporting data checklist", text:"Write a checklist of 6 to 8 items for refreshing and checking the four Velox files each quarter: where each file comes from, three tie-outs that should always hold (a tie-out is a check that the same number agrees across two statements), who approves the files, and what goes wrong if a file is stale. The files do not say where they come from or who approves them, so write what you would need to confirm with the Controller\u2019s Office, marked \u201cto be confirmed.\u201d"}
  ];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Attempt","Mastery","Quiz","Reflect"];
  const P = "m4.";
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;

  /* ---------- render dynamic parts ---------- */
  $("#situations").innerHTML = SITUATIONS.map((s,i)=>{const n=i+1; return `
    <div class="task">
      <div class="n">${n}</div>
      <div><b>Analyst ${n}:</b> ${esc(s.facts)}<br><b>Closing line:</b> <i>“${esc(s.line)}”</i></div>
      <div class="row">
        <label class="lbl" for="sv${n}">Does this line meet the policy?</label>
        <select id="sv${n}" data-save="sit.${n}.verdict" data-req data-sel><option value="">Choose one…</option>${SIT_VERDICTS.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
        <label class="lbl" for="sw${n}">Why? Name what the line gets right, or what is missing or untrue.</label>
        <textarea id="sw${n}" data-save="sit.${n}.why" data-min="15" data-req style="min-height:60px"></textarea>
      </div>
    </div>`;}).join("");

  $("#vrows").innerHTML = [1,2].map(k=>`
    <div class="card">
      <h3>Finding ${k}</h3>
      <label class="lbl" for="vc${k}"><b>Quote the finding</b> exactly as Claude stated it in your final Part 3 answer</label>
      <input type="text" id="vc${k}" data-save="v.${k}.item" data-min="5" data-req>
      <label class="lbl" for="vw${k}"><b>Where the inputs are:</b> which file and which lines (for example: income statement file, rows Gross profit and Revenue)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="5" data-req>
      <label class="lbl" for="vm${k}"><b>Your own arithmetic:</b> the formula, the numbers, and your result</label>
      <textarea id="vm${k}" data-save="v.${k}.amts" data-min="15" data-req style="min-height:60px"></textarea>
      <label class="lbl" for="vv${k}"><b>What did you find?</b> (choose \u201cCannot be checked from the files\u201d for a claim about a cause that the files do not support)</label>
      <select id="vv${k}" data-save="v.${k}.verdict" data-req data-sel><option value="">Choose one…</option>${FIND_VERDICTS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <label class="lbl" for="va${k}"><b>What did you do about it?</b> (kept it, corrected it, removed it, or would ask someone)</label>
      <textarea id="va${k}" data-save="v.${k}.action" data-min="5" data-req style="min-height:50px"></textarea>
    </div>`).join("");

  $("#angleCards").innerHTML = ANGLES.map((a,i)=>`
    <div class="card">
      <h3>Option ${i+1} · ${esc(a.major)}: ${esc(a.title)}</h3>
      <p style="margin:0">${esc(a.text)}</p>
    </div>`).join("");
  $("#angle").innerHTML = '<option value="">Choose one…</option>'+ANGLES.map(a=>`<option>${esc(a.id)}</option>`).join("");

  /* ---------- config-driven bits ---------- */
  const C = window.COURSE || {};
  if(C.videoUrl && C.videoUrl[4]) $("#videoBox").innerHTML = videoHtml(C.videoUrl[4], "Module 4 video");
  else { const h=$("#videoHelp"); if(h) h.textContent = "The video is not posted yet. You can read the transcript or follow along with the slides using the buttons below."; }
  if(C.quizUrl && C.quizUrl[4]){ const q=$("#quizLink"); q.href=C.quizUrl[4]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[4]){ const s=$("#submitLink"); s.href=C.submitUrl[4]; s.style.display="inline"; }

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
      ["g1","g2","g3"].forEach(id=>{ const el=$("#"+id); if(el.value.trim().length<30) out.push(el); });
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
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 4":"Next";
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
    if(el && el.id==="ppage"){ const n=words(el.value); $("#wc").textContent = n+" words (300 or fewer)"; }
    if(el && el.id==="isGrad") $("#gradBlock").style.display = el.checked?"block":"none";
    updateGate();
  }
  function go(n){ cur = n; if(n>maxReached) maxReached = n; render(); window.scrollTo({top:0,behavior:"smooth"}); }
  $("#next").addEventListener("click",()=>{
    const left = unmet(steps[cur-1]);
    if(left.length){
      const el = left[0]; (el.closest(".task,.card,.turn,.check")||el).scrollIntoView({behavior:"smooth",block:"center"});
      if(el.focus && !el.classList.contains("qc")) el.focus({preventScroll:true});
      const lb = el.id && $('label[for="'+el.id+'"]'); const nm = lb ? lb.textContent.replace(/\s+/g," ").trim().slice(0,90) : (el.classList.contains("qc") ? "the quick check above" : "");
      $("#gate").textContent = "Still needed: "+(nm||"finish the highlighted item")+(nm.length>=90?"\u2026":""); return;
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
    const sits = SITUATIONS.map((s,i)=>({n:i+1,line:s.line,v:val("sv"+(i+1)),w:val("sw"+(i+1))}));
    const ver = [1,2].map(k=>({k,item:val("vc"+k),where:val("vw"+k),amts:val("vm"+k),verdict:val("vv"+k),action:val("va"+k)}));
    const f = ["r1p","r1o","r1w","pinst","ptest","p3req","p3rat","p3why","ppr","ppage","angle","angreq","angtext","foot","disc","e4d","e4w","rev","rej","trans","g1","g2","g3"];
    const o = {grad:isGrad(),sits,ver}; f.forEach(id=>{o[id]=val(id);}); o.name=val("stuName"); return o;
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. VELOX REPORTING PROJECT\nMy Project instructions:\n"+d.pinst+"\n\nMy test question and Claude's answer:\n"+d.ptest+"\n\n";
    s += "B. RATIOS AND THE STORY\nFirst attempt request (Step 2): "+d.r1p+"\nFirst attempt summary: "+d.r1o+"\nThings I could not tell: "+d.r1w+"\n\nMy two requests:\n"+d.p3req+"\n\nClaude's six ratios:\n"+d.p3rat+"\n\nClaude's explanation of what changed:\n"+d.p3why+"\n\n";
    s += "C. VERIFICATION\n"+d.ver.map(x=>`Finding ${x.k}: ${x.item}\nWhere the inputs are: ${x.where}\nMy arithmetic: ${x.amts}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\n";
    s += "D. EXPLANATION FOR PRIYA\nRequest I used: "+d.ppr+"\n\nMy page:\n"+d.ppage+"\n\n";
    s += "E. MY ANGLE\nOption chosen: "+d.angle+"\nRequest I used: "+d.angreq+"\n\nMy piece:\n"+d.angtext+"\n\n";
    s += "F. ETHICAL AI: TRANSPARENCY AND DISCLOSURE\nStep 4 review of the five closing lines:\n"+d.sits.map(x=>`Line ${x.n} (“${x.line}”): ${x.v}. Why: ${x.w}`).join("\n")+"\nDecision: "+d.e4d+"\nWhy: "+d.e4w+"\nMy closing line for Priya: "+d.foot+"\nAI tools I used: "+d.disc+"\n";
    if(!forCoach){
      s += "\nG. COACH FEEDBACK AND MASTERY EVIDENCE\nWhat I changed after feedback: "+d.rev+"\nFeedback I rejected and why: "+(d.rej||"(none)")+"\n\nFull coach conversation:\n"+d.trans+"\n";
    }
    if(d.grad) s += "\nH. GRADUATE STUDENTS ONLY\nThird finding: "+d.g1+"\nCheck without AI: "+d.g2+"\nAssumption or limitation: "+d.g3+"\n";
    return s;
  }
  function asDoc(d){
    const p = t => "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
    const sit = d.sits.map(x=>`<tr><td>${x.n}</td><td>${esc(x.line)}</td><td>${esc(x.v)}</td><td>${esc(x.w)}</td></tr>`).join("");
    const ver = d.ver.map(x=>`<tr><td>${x.k}</td><td>${esc(x.item)}</td><td>${esc(x.where)}</td><td>${esc(x.amts)}</td><td>${esc(x.verdict)}</td><td>${esc(x.action)}</td></tr>`).join("");
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 4 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 4: Explain the Quarter</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Velox Reporting Project</h2><p><b>My Project instructions:</b></p>${p(d.pinst)}<p><b>My test question and Claude's answer:</b></p>${p(d.ptest)}
<h2>B. Ratios and the story</h2><p><b>First attempt request (Step 2):</b></p>${p(d.r1p)}<p><b>First attempt summary:</b></p>${p(d.r1o)}<p><b>Things I could not tell:</b></p>${p(d.r1w)}<p><b>My two requests:</b></p>${p(d.p3req)}<p><b>Claude's six ratios:</b></p>${p(d.p3rat)}<p><b>Claude's explanation of what changed:</b></p>${p(d.p3why)}
<h2>C. Verification</h2><table><tr><th>#</th><th>Finding (as Claude stated it)</th><th>Where the inputs are</th><th>My arithmetic</th><th>What I found</th><th>What I did</th></tr>${ver}</table>
<h2>D. Explanation for Priya</h2><p><b>Request I used:</b></p>${p(d.ppr)}<p><b>My page:</b></p>${p(d.ppage)}
<h2>E. My angle</h2><p><b>Option chosen:</b> ${esc(d.angle)}</p><p><b>Request I used:</b></p>${p(d.angreq)}<p><b>My piece:</b></p>${p(d.angtext)}
<h2>F. Ethical AI: transparency and disclosure</h2><table><tr><th>#</th><th>Closing line</th><th>My verdict</th><th>Why</th></tr>${sit}</table><p><b>Decision:</b> ${esc(d.e4d)}</p><p><b>Why:</b></p>${p(d.e4w)}<p><b>My closing line for Priya:</b></p>${p(d.foot)}<p><b>AI tools I used:</b></p>${p(d.disc)}
<h2>G. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>H. Graduate students only</h2><p><b>Third finding</b></p>${p(d.g1)}<p><b>Check without AI</b></p>${p(d.g2)}<p><b>Assumption or limitation</b></p>${p(d.g3)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module4_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]));
    copyText("MODULE 4 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 4 complete!</h2>
      <p>You gave AI the facts and rules once in a Project, had it show its calculations, checked two of its findings yourself, explained the quarter to a CFO in ${words(d.ppage)} words, and told readers honestly how AI helped. That is the habit: <b>set AI up with your facts and rules, make it show its work, and say what you checked.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 5 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 4 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#ppage").dataset.minwords = "60"; $("#ppage").dataset.maxwords = "300";
  onChange($("#ppage")); onChange($("#isGrad"));
  render();
})();
