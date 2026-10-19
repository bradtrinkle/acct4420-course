(function(){
  const TASKS = [
    {n:1,t:"Draft an email reminding dealers about missing warranty paperwork",team:"Controller's Office"},
    {n:2,t:"Create a first draft of a month-end close checklist",team:"Controller's Office"},
    {n:3,t:"Translate a parts memo for an Italian carbon-fiber supplier",team:"Cost and Planning"},
    {n:4,t:"Summarize the payment terms in a 40-page supplier contract",team:"Cost and Planning"},
    {n:5,t:"Explain why gross margin fell from Q2 to Q3, using the figures in Step 2",team:"Controller's Office"},
    {n:6,t:"Calculate the Q3 warranty reserve, the amount set aside for expected repair claims (1,210 cars, 4% claim rate, $6,500 per claim)",team:"Controller's Office"},
    {n:7,t:"Find the current Iowa corporate income tax rate",team:"Tax"},
    {n:8,t:"Recommend whether to write off (stop expecting payment on) a struggling dealer's $1.2 million receivable",team:"Controller's Office"},
    {n:9,t:"Prepare support for the CFO's quarterly certification that Velox's internal controls over financial reporting work (known as SOX, short for Sarbanes-Oxley, certification)",team:"Internal Audit"},
    {n:10,t:"Analyze employee salary and performance files to support layoff planning",team:"Human Resources and Finance",req:true}
  ];
  const CATS = ["AI does it well","AI helps, a person checks","AI assists, a person decides"];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Draft","Mastery","Quiz","Reflect"];
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;
  const taskById = n => TASKS.find(t=>t.n===Number(n));

  /* ---------- render dynamic parts ---------- */
  const tasksEl = $("#tasks");
  tasksEl.innerHTML = TASKS.map(t=>`
    <div class="task">
      <div class="n">${t.n}</div>
      <div><b>${esc(t.t)}</b>${t.req?'<span class="req">REQUIRED TEST</span>':''}<div class="hint">${esc(t.team)}</div></div>
      <div class="row">
        <label class="lbl" for="sort${t.n}">Category</label>
        <select id="sort${t.n}" data-save="sort.${t.n}" data-req data-sel><option value="">Choose one…</option>${CATS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
        <label class="lbl" for="why${t.n}">Why?</label>
        <textarea id="why${t.n}" data-save="why.${t.n}" data-min="12" data-req style="min-height:60px"></textarea>
      </div>
    </div>`).join("");

  const testsEl = $("#tests");
  testsEl.innerHTML = [1,2,3].map(k=>`
    <div class="card">
      <h3>Test ${k}${k===1?" · Task 10 (required)":""}</h3>
      ${k===1?'':`<label class="lbl" for="tt${k}">Which task did you test?</label>
      <select id="tt${k}" data-save="test.${k}.task" data-req data-sel><option value="">Choose a task…</option>${TASKS.filter(t=>t.n!==10).map(t=>`<option value="${t.n}">Task ${t.n}: ${esc(t.t)}</option>`).join("")}</select>`}
      <label class="lbl" for="tp${k}">Your prompt (paste it)</label>
      <textarea id="tp${k}" data-save="test.${k}.prompt" data-min="10" data-req></textarea>
      <div class="cols two">
        <div><label class="lbl" for="to${k}">What did AI give you? (summary)</label><textarea id="to${k}" data-save="test.${k}.out" data-min="10" data-req style="min-height:70px"></textarea></div>
        <div><label class="lbl" for="th${k}">What did you check, and how?</label><textarea id="th${k}" data-save="test.${k}.how" data-min="10" data-req style="min-height:70px"></textarea></div>
      </div>
      <label class="lbl" for="tr${k}">What was the result? (right, wrong, partly right…)</label>
      <textarea id="tr${k}" data-save="test.${k}.res" data-min="5" data-req style="min-height:50px"></textarea>
    </div>`).join("");
  $("#memo").dataset.minwords = "80";

  /* ---------- config-driven bits ---------- */
  const C = window.COURSE || {};
  if(C.videoUrl && C.videoUrl[1]) $("#videoBox").innerHTML = `<iframe src="${esc(C.videoUrl[1])}" title="Module 1 video" allowfullscreen></iframe>`;
  if(C.quizUrl && C.quizUrl[1]){ const q=$("#quizLink"); q.href=C.quizUrl[1]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[1]){ const s=$("#submitLink"); s.href=C.submitUrl[1]; s.style.display="inline"; }

  /* ---------- save / restore ---------- */
  const key = el => "m1.f."+el.dataset.save;
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
    if(store.get("m1.qc."+id,false)) markRight();
    btns.forEach((b,i)=>b.addEventListener("click",()=>{
      if(i===right){ store.set("m1.qc."+id,true); markRight(); onChange(q); }
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
      }
      if(!ok) out.push(el);
    });
    if(stepEl.dataset.step==="5" && isGrad()){
      ["g1","g2"].forEach(id=>{ const el=$("#"+id); if(el.value.trim().length<30) out.push(el); });
    }
    return out;
  }

  /* ---------- navigation ---------- */
  let cur = store.get("m1.step",1), maxReached = store.get("m1.max",1);
  const steps = $$(".step"), dots = $("#dots");
  dots.innerHTML = STEP_NAMES.map((n,i)=>`<button class="dot" data-d="${i+1}" type="button"><span class="c">${i+1}</span><span class="l">${n}</span></button>`).join("");
  function render(){
    steps.forEach(s=>s.classList.toggle("active", Number(s.dataset.step)===cur));
    $$(".dot").forEach(d=>{ const i=Number(d.dataset.d); d.classList.toggle("now",i===cur); d.classList.toggle("done",i<cur||store.get("m1.done",false)); d.disabled = i>maxReached; d.setAttribute("aria-current", i===cur?"step":"false"); });
    const pct = store.get("m1.done",false) ? 100 : Math.max(3,Math.min(97,((cur-1)/8)*100+3));
    $("#fill").style.width = pct+"%"; $("#car").style.left = pct+"%";
    $("#prev").style.visibility = cur===1?"hidden":"visible";
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 1":"Next";
    nx.style.display = (cur===8 && store.get("m1.done",false)) ? "none" : "inline-block";
    updateGate();
    store.set("m1.step",cur); store.set("m1.max",maxReached);
  }
  function updateGate(){
    const g = $("#gate"), left = unmet(steps[cur-1]).length;
    if(cur===8 && store.get("m1.done",false)){ g.style.display="none"; return; }
    g.style.display = "block";
    if(left===0){ g.className="gate ok"; g.textContent = cur===8?"All set. Finish when you are ready.":"Nice work. You can continue."; }
    else { g.className="gate"; g.textContent = left+(left===1?" item":" items")+" left on this step."; }
  }
  function onChange(el){
    if(el && el.id==="memo") $("#wc").textContent = words(el.value)+" words (aim for 350 or fewer)";
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
    const sorts = TASKS.map(t=>({n:t.n,t:t.t,c:val("sort"+t.n),w:val("why"+t.n)}));
    const tests = [1,2,3].map(k=>{
      const tn = k===1?10:Number(val("tt"+k)); const tk = taskById(tn);
      return {k,task:tk?("Task "+tk.n+": "+tk.t):"(not chosen)",prompt:val("tp"+k),out:val("to"+k),how:val("th"+k),res:val("tr"+k)};
    });
    return {name:val("stuName"),grad:isGrad(),sorts,tests,anon:val("anon"),s4a:val("t4a"),s4b:val("t4b"),memo:val("memo"),disc:val("disc"),rev:val("rev"),rej:val("rej"),trans:val("trans"),g1:val("g1"),g2:val("g2")};
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. TASK SORT\n"+d.sorts.map(x=>`Task ${x.n} (${x.t}): ${x.c}. Reason: ${x.w}`).join("\n")+"\n\n";
    s += "B. AI TESTS\n"+d.tests.map(x=>`Test ${x.k} - ${x.task}\nPrompt: ${x.prompt}\nAI output summary: ${x.out}\nWhat I checked and how: ${x.how}\nResult: ${x.res}`).join("\n\n")+"\n\n";
    s += "C. TASK 10 ETHICS\n"+d.anon+"\n\nScenario 1 (what they should have done): "+d.s4a+"\nScenario 2 (transparency): "+d.s4b+"\n\n";
    s += "D. MEMO TO PRIYA NATARAJAN\n"+d.memo+"\n\n";
    s += "E. AI USE DISCLOSURE\n"+d.disc+"\n";
    if(!forCoach){
      s += "\nF. COACH FEEDBACK AND MASTERY EVIDENCE\nWhat I changed after feedback: "+d.rev+"\nFeedback I rejected and why: "+(d.rej||"(none)")+"\n\nFull coach conversation:\n"+d.trans+"\n";
    }
    if(d.grad) s += "\nG. GRADUATE STUDENTS ONLY\nComparison 1: "+d.g1+"\nComparison 2: "+d.g2+"\n";
    return s;
  }
  function asDoc(d){
    const p = t => "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
    const rows = d.sorts.map(x=>`<tr><td>${x.n}</td><td>${esc(x.t)}</td><td>${esc(x.c)}</td><td>${esc(x.w)}</td></tr>`).join("");
    const tests = d.tests.map(x=>`<h3>Test ${x.k}: ${esc(x.task)}</h3><p><b>Prompt:</b> ${esc(x.prompt).replace(/\n/g,"<br>")}</p><p><b>What AI gave me:</b> ${esc(x.out).replace(/\n/g,"<br>")}</p><p><b>What I checked and how:</b> ${esc(x.how).replace(/\n/g,"<br>")}</p><p><b>Result:</b> ${esc(x.res).replace(/\n/g,"<br>")}</p>`).join("");
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 1 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 1: What Can AI Do for Velox?</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Task sort</h2><table><tr><th>#</th><th>Task</th><th>Category</th><th>Reason</th></tr>${rows}</table>
<h2>B. AI tests</h2>${tests}
<h2>C. Task 10 ethics</h2><p><b>Anonymization and policy areas:</b></p>${p(d.anon)}<p><b>Scenario 1, what they should have done:</b></p>${p(d.s4a)}<p><b>Scenario 2, what transparency requires:</b></p>${p(d.s4b)}
<h2>D. Memo to Priya Natarajan</h2>${p(d.memo)}
<h2>E. AI use disclosure</h2>${p(d.disc)}
<h2>F. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>G. Graduate students only</h2><p><b>Comparison 1</b></p>${p(d.g1)}<p><b>Comparison 2</b></p>${p(d.g2)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module1_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyCoach").addEventListener("click",()=>copyText($("#coachText").textContent));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[4]).filter(el=>!el.closest("[data-step]")||true);
    copyText(asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[4]).concat(unmet(steps[5]));
    if(left.length){ toast("Finish Steps 5 and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 1 complete!</h2>
      <p>You sorted ${d.sorts.length} tasks, tested AI three times, wrote a ${words(d.memo)}-word memo to the CFO, and practiced the Responsible AI Policy. That is the habit: <b>how can AI help me do this, and how do I know it is right?</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. <a href="module-2.html">Continue to Module 2</a> when your instructor opens it.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 1 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox.m1.")).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set("m1.done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get("m1.done",false)) finishCard();

  $("#isGrad").dispatchEvent(new Event("change"));
  onChange($("#memo")); onChange($("#isGrad"));
  render();
})();
