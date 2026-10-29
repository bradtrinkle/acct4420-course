(function(){
  const SITUATIONS = [
    {facts:"The machine stops at Gate 1 with a long reconciliation. The person running it is busy and the machine has been right every month so far.", line:"Type ‘approved’ at Gate 1 without reading it, so the close is not delayed."},
    {facts:"A teammate wants the monthly memo to reach the Controller without anyone opening it first.", line:"Set the machine to email the memo automatically and fill in the sign-off line as ‘Reviewed by: Velox Close Machine.’"},
    {facts:"At Gate 2 the machine reports that it found no payment exceptions this month.", line:"Skip Gate 2 whenever the machine reports no exceptions, since there is nothing to review."},
    {facts:"The memo lists seven exceptions by code.", line:"Before signing, a named accountant opens the bank, ledger, variance, and payment files behind each exception, confirms what the machine says, and then signs the memo."},
    {facts:"Walt wants to change a threshold in the rules file.", line:"The Controller approves the change in writing, it is recorded with the date, and an earlier month is run again to confirm the machine still catches what it caught before."}
  ];
  const SIT_VERDICTS = ["Meets the policy","Does not meet the policy"];
  const FIND_VERDICTS = ["Matches the files or my calculation","Differs only in rounding or wording","Differs from the files or my calculation","Cannot be checked from the files"];
  const PIECES = [
    {n:1, stage:"Stage 1: Reconcile cash", hint:"For example, your Module 3 reconciliation chain (match, classify, compute, challenge)."},
    {n:2, stage:"Stage 2: Explain the variances", hint:"For example, your Module 2 variance summary template and your Module 4 habit that the numbers say what and the notes say why."},
    {n:3, stage:"Stage 3: Scan the payments", hint:"For example, your Module 6 payment checks and your Module 7 rule to write “not in the sources” (here, “not in the data”)."},
    {n:4, stage:"Stage 4: Write the close memo", hint:"For example, your Module 2 prompt constraints, your Module 5 template with defined inputs, and your Module 7 habit of writing for the reader."}
  ];
  const ENGAGEMENTS = [
    {title:"Journal Entry Testing", lens:"audit and assurance", acc:true, text:"Check the month's manual journal entries that the close system flagged as unusual."},
    {title:"Sales and Use Tax Check", lens:"tax", acc:true, text:"Check that the sales tax Velox charged and reported in six states is right."},
    {title:"Account Reconciliations", lens:"financial reporting", acc:true, text:"Tie about fifteen balance sheet accounts back to the bank, the subledgers and the schedules."},
    {title:"Cash Forecast Check", lens:"finance", text:"Compare the 13-week cash forecast with the cash that really moved each week."},
    {title:"Dealer Incentive Claims", lens:"marketing and sales", text:"Check dealers' bonus claims against the terms of the sales programs."},
    {title:"Plant Scorecard", lens:"management and operations", text:"Check the South Carolina plant's weekly scorecard against its production, downtime and scrap logs."},
    {title:"Three-Way Match", lens:"supply chain", text:"Match supplier invoices to the purchase orders and the receiving records."},
    {title:"Data Quality Check", lens:"MIS and information systems", text:"Check the monthly vendor, dealer and parts data extract for errors and duplicates."}
  ];
  const OCT_KEY = {
    stage1:"CHK40311 (the bank cleared 41,620.00; the books recorded 41,260.00), DEP1015 (the bank posted the 218,400.00 deposit twice), and RTN1021 (a 36,750.00 NSF return that is not in the books).",
    stage2:"Lines to investigate: L04 (warranty, +420), L06 (marketing, −420), and L11 (equipment lease, 640 against a zero budget). Subtotal error: L13 is printed as 14,805 but L04 to L12 add to 14,985; L14 carries the error.",
    stage3:"P-200007 and P-200031 (the same vendor, invoice, and amount paid twice), P-200011 and P-200012 (a possible split), P-200026 (12,430.00 with no second approval), and P-200035 (vendor V-4410 is not on the Approved Vendor List). The five Heartland payments P-200017 to P-200021 are legitimate under Rule 3f.",
    balance:"The adjusted cash balance is 4,401,612.70."
  };
  const MONTH_LABEL = {october:"October (practice)", november:"November (Walt’s Gauntlet)", december:"December (mastery test)"};
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Attempt","Mastery","Quiz","Reflect"];
  const P = "m8.";
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;

  /* ---------- render dynamic parts ---------- */
  $("#situations").innerHTML = SITUATIONS.map((s,i)=>{const n=i+1; return `
    <div class="task">
      <div class="n">${n}</div>
      <div><b>Suggestion ${n}, the facts:</b> ${esc(s.facts)}<br><b>Suggestion:</b> <i>“${esc(s.line)}”</i></div>
      <div class="row">
        <label class="lbl" for="sv${n}">Does this suggestion meet the policy?</label>
        <select id="sv${n}" data-save="sit.${n}.verdict" data-req data-sel><option value="">Choose one…</option>${SIT_VERDICTS.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
        <label class="lbl" for="sw${n}">Why? Name what a person must do, or what makes it acceptable.</label>
        <textarea id="sw${n}" data-save="sit.${n}.why" data-min="15" data-req style="min-height:60px"></textarea>
      </div>
    </div>`;}).join("");

  $("#pieces").innerHTML = PIECES.map(p=>`
    <div class="card">
      <h3>${esc(p.stage)}</h3>
      <p class="hint" style="margin-top:0">${esc(p.hint)}</p>
      <label class="lbl" for="pm${p.n}"><b>Which piece will you reuse (which module, what it does), and what will you change for this task?</b></label>
      <textarea id="pm${p.n}" data-save="s5.pm${p.n}" data-min="40" data-req style="min-height:70px"></textarea>
    </div>`).join("");

  $("#vrows").innerHTML = [1,2].map(k=>`
    <div class="card">
      <h3>Finding ${k}</h3>
      <label class="lbl" for="vc${k}"><b>Quote the finding</b> exactly as your machine stated it in the November output</label>
      <input type="text" id="vc${k}" data-save="v.${k}.item" data-min="5" data-req>
      <label class="lbl" for="vw${k}"><b>Where the inputs are:</b> which file and which rows or columns (for example: November cash ledger, the last running_balance; or November payment register, rows for one vendor)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="5" data-req>
      <label class="lbl" for="vm${k}"><b>Your own check:</b> the formula or steps, the numbers, and your result</label>
      <textarea id="vm${k}" data-save="v.${k}.amts" data-min="15" data-req style="min-height:60px"></textarea>
      <label class="lbl" for="vv${k}"><b>What did you find?</b> (choose “Cannot be checked from the files” for a claim the files do not contain, such as why a deposit amount differs)</label>
      <select id="vv${k}" data-save="v.${k}.verdict" data-req data-sel><option value="">Choose one…</option>${FIND_VERDICTS.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <label class="lbl" for="va${k}"><b>What did you do about it?</b> (kept it, corrected it, removed it, or would ask someone)</label>
      <textarea id="va${k}" data-save="v.${k}.action" data-min="5" data-req style="min-height:50px"></textarea>
    </div>`).join("");

  $("#angleCards").innerHTML = ENGAGEMENTS.map((e,i)=>`
    <div class="card">
      <h3>${i+1}. ${esc(e.title)} <span class="hint" style="font-weight:400">· ${esc(e.lens)}${e.acc?" · <b>Accounting engagement</b>":""}</span></h3>
      <p style="margin:0">${esc(e.text)}</p>
    </div>`).join("");
  $("#angle").innerHTML = '<option value="">Choose one…</option>'+ENGAGEMENTS.map(e=>`<option>${esc(e.title)}</option>`).join("");

  /* ---------- config-driven bits ---------- */
  const C = window.COURSE || {};
  if(C.videoUrl && C.videoUrl[8]){ $("#videoBox").innerHTML = videoHtml(C.videoUrl[8], "Module 8 video"); $("#dlTranscript").style.display="inline-block"; $("#dlSlides").style.display="inline-block"; }
  else { const h=$("#videoHelp"); if(h) h.textContent = "The video is not posted yet. Walt's message below covers the key points."; }
  if(C.quizUrl && C.quizUrl[8]){ const q=$("#quizLink"); q.href=C.quizUrl[8]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[8]){ const s=$("#submitLink"); s.href=C.submitUrl[8]; s.style.display="inline"; }

  /* ---------- the scorer ---------- */
  const getLog = () => store.get(P+"log", []);
  const scored = m => getLog().some(e=>e.month===m);
  function memoCode(t){ return M8Score.sha256("memo|"+t).slice(0,8); }
  function buildScorer(el){
    const id = el.dataset.scorer, month = el.dataset.default;
    el.innerHTML = `<div class="card scorer-card">
      <h3>Walt’s Scorer: ${esc(MONTH_LABEL[month])}</h3>
      <p class="hint" style="margin-top:0"><b>Paste only the memo</b> from your machine’s ${month==="october"?"October":month==="november"?"November":"December"} run${month==="october"?" (or, for the baseline, your Step 2 answer)":""}. The scorer reads the codes in the text (for example DEP9930, L08, or P-900123, codes made up for this example) and compares them with Walt’s hidden answers. It runs in your browser; nothing is sent anywhere. Walt’s answers are stored scrambled (hashed) in the page; trying to reverse them is cheating, and your grader recomputes everything from the memo and stage outputs you paste. It reports the planted problems caught, false alarms, the cash balance, and the memo format. It reads three kinds of code: bank and ledger references (CHK, CHECK, DEP, WIRE, ACH, RTN, FEE, or INT followed by digits), variance line numbers (L01 to L14), and payment IDs (P- and six digits). It ignores vendor IDs, invoice numbers, and approver IDs. Put in the memo only the codes that Rule 5c allows: any other code you mention (a routine item, a line you did not investigate, a payment cleared by Rule 3f) counts as a false alarm. For a pair of payments (a duplicate or a split), either payment ID counts as catching it. For a subtotal error, naming the line where it starts, or a later line that carries it, counts. Walt’s planted problems in the variance report are every line that must be investigated, even when its note explains it, plus any subtotal error, so the scorer’s total can be bigger than the number of exceptions in your memo’s first sentence. The scorer treats a bank “CHECK 99012” and a ledger “CHK99012” as the same item. Every run is logged and added to your submission.</p>
      <label class="lbl" for="${id}-t"><b>Paste the memo here</b></label>
      <textarea id="${id}-t" style="min-height:140px" data-noscore></textarea>
      <p><button class="btn btn-gold btn-sm" type="button">Score this memo</button></p>
      <div class="res" role="status" aria-live="polite"></div>
      ${month==="october"?'<details class="reveal" style="display:none"><summary>Reveal the October answers (what Walt planted)</summary><p><b>Stage 1:</b> '+esc(OCT_KEY.stage1)+'</p><p><b>Stage 2:</b> '+esc(OCT_KEY.stage2)+'</p><p><b>Stage 3:</b> '+esc(OCT_KEY.stage3)+'</p><p><b>Balance:</b> '+esc(OCT_KEY.balance)+'</p><p class="hint">October is only for practice. Use this to find <i>why</i> your machine missed something, then fix the rule so it works on any month. Walt’s November and December answers stay hidden.</p></details>':''}
    </div>`;
    const ta = $("textarea",el), res = $(".res",el), btn = $("button",el), rev = $(".reveal",el);
    ta.value = store.get(P+"sc."+id,"");
    ta.addEventListener("input",()=>store.set(P+"sc."+id, ta.value));
    if(rev && scored("october")) rev.style.display = "block";
    btn.addEventListener("click",()=>{
      const t = ta.value.trim();
      if(words(t)<15){ res.innerHTML = '<p class="fb show no">Paste the memo first (it is much longer than this).</p>'; return; }
      let r; try{ r = M8Score.score(month, t, window.M8KEYS); }catch(e){ res.innerHTML = '<p class="fb show no">The scorer could not load its answer file. Reload the page and try again.</p>'; return; }
      const log = getLog(); const run = log.filter(e=>e.month===month).length+1;
      log.push({month, run, when:new Date().toISOString().slice(0,16).replace("T"," "), stages:r.stages.map(s=>s.caught+"/"+s.total), caught:r.caught, total:r.total, fa:r.falseAlarms.slice(), inv:r.invented.slice(), bal:r.balanceOk, words:r.words, sign:r.signoff, wrong:r.wrongdoing.slice(), pts:r.points, code:memoCode(t)});
      store.set(P+"log", log);
      const yes = '<b style="color:var(--good)">yes</b>', no = '<b style="color:var(--bad)">no</b>';
      res.innerHTML = `<table class="t"><tr><th>Check</th><th>Result</th></tr>
        ${r.stages.map(s=>`<tr><td>Planted problems caught, ${esc(s.name)}</td><td><b>${s.caught} of ${s.total}</b></td></tr>`).join("")}
        <tr><td><b>Total caught</b></td><td><b>${r.caught} of ${r.total}</b> (missed: ${r.total-r.caught})</td></tr>
        <tr><td>False alarms (codes in your memo that are real items but were not planted problems)</td><td>${r.falseAlarms.length?esc(r.falseAlarms.join(", ")):"none"}</td></tr>
        <tr><td>Codes that are not in this month’s files at all</td><td>${r.invented.length?esc(r.invented.join(", ")):"none"}</td></tr>
        <tr><td>Adjusted cash balance found in the memo and correct</td><td>${r.balanceOk?yes:no}</td></tr>
        <tr><td>Memo length (limit 300 words)</td><td>${r.words} words: ${r.words<=300?yes:no}</td></tr>
        <tr><td>Ends with a “Reviewed by:” line</td><td>${r.signoff?yes:no}</td></tr>
        <tr><td>Wrongdoing language (words such as fraud or theft)</td><td>${r.wrongdoing.length?no+" ("+esc(r.wrongdoing.join(", "))+")":"none"}</td></tr>
        <tr><td><b>Points on the 15-point Gauntlet scale</b>${month==="october"?" (practice, not graded)":""}</td><td><b>${r.points} of 15</b></td></tr></table>
        <p class="hint">Run ${run} for this month, logged. ${r.total-r.caught>0?"The scorer does not say which items you missed"+(month==="october"?" (but the October answers are revealed below)":"")+". Look at which stage fell short and ask what kind of check would have found the missing item in any month.":"Nothing was missed on this run. Check that it would still hold on a different month."} A false alarm is a code you put in the memo that Walt did not plant, such as a routine item, a line you did not need to investigate, or a legitimate payment.</p>`;
      if(rev) rev.style.display = "block";
      onChange(ta);
    });
  }
  $$("[data-scorer]").forEach(buildScorer);

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
    const step = stepEl.dataset.step;
    const need = (m, id, what) => { if(!scored(m)){ const w=$('[data-scorer="'+id+'"]'); w.dataset.need = what; out.push(w); } };
    if(step==="5"){ need("october","s5oct","score your October memo in Walt’s Scorer (Part 4)"); need("november","s5nov","score your November memo in Walt’s Scorer (Part 5)"); }
    if(step==="6"){ need("december","s6dec","score your December memo in Walt’s Scorer"); }
    if(step==="5" && isGrad()){
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
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 8":"Next";
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
    if(el && el.id==="angtext"){ const n=words(el.value); $("#wc2").textContent = n+" words (150 to 250)"+(n>250?": too long, shorten it":(n>0&&n<150?": too short":"")); }
    if(el && el.id==="isGrad") $("#gradBlock").style.display = el.checked?"block":"none";
    updateGate();
  }
  function go(n){ cur = n; if(n>maxReached) maxReached = n; render(); window.scrollTo({top:0,behavior:"smooth"}); }
  $("#next").addEventListener("click",()=>{
    const left = unmet(steps[cur-1]);
    if(left.length){
      const el = left[0]; (el.closest(".task,.card,.turn,.check")||el).scrollIntoView({behavior:"smooth",block:"center"});
      if(el.focus && !el.classList.contains("qc") && !el.dataset.scorer) el.focus({preventScroll:true});
      const lb = el.id && $('label[for="'+el.id+'"]'); const nm = el.dataset.need || (lb ? lb.textContent.replace(/\s+/g," ").trim().slice(0,90) : (el.classList.contains("qc") ? "the quick check above" : ""));
      $("#gate").textContent = "Still needed: "+(nm||"finish the highlighted item")+(nm.length>=90?"…":""); return;
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
    const pcs = PIECES.map(p=>({stage:p.stage,t:val("pm"+p.n)}));
    const f = ["r1p","r1o","r1w","instr","stoptest","ooutp","omemo","obase","ochg","noutp","nmemo","ngate","cd1","cd2","cd3","cd4","angle","angreq","angtext","acc","foot","disc","e4d","e4w","rev","instr2","doutp","dmemo","cmp","regr","rej","trans","g1","g2","g3"];
    const o = {grad:isGrad(),sits,ver,pcs,log:getLog()}; f.forEach(id=>{o[id]=val(id);}); o.name=val("stuName"); return o;
  }
  function logText(d, month){
    const rows = d.log.filter(e=>e.month===month);
    if(!rows.length) return "(no scorer runs logged)";
    return rows.map(e=>`Run ${e.run} (${e.when}): caught ${e.caught} of ${e.total} [stage 1 ${e.stages[0]}, stage 2 ${e.stages[1]}, stage 3 ${e.stages[2]}]; false alarms: ${e.fa.length?e.fa.join(", "):"none"}; codes not in the files: ${e.inv.length?e.inv.join(", "):"none"}; balance correct: ${e.bal?"yes":"no"}; ${e.words} words; Reviewed-by line: ${e.sign?"yes":"no"}; wrongdoing words: ${e.wrong.length?e.wrong.join(", "):"none"}; points ${e.pts}/15; memo code ${e.code}`).join("\n");
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. MY MACHINE\nPieces I reused:\n"+d.pcs.map(x=>x.stage+": "+x.t).join("\n")+"\n\nInstructions:\n"+d.instr+"\n\nWhat it said with no files attached:\n"+d.stoptest+"\n\n";
    s += "B. REHEARSAL ON OCTOBER\nPart 1 (practice, not graded) - first try (Step 2): "+d.r1p+"\nWhat Claude gave me: "+d.r1o+"\nThings I could not rely on: "+d.r1w+"\n\nStage outputs and my replies at the gates:\n"+d.ooutp+"\n\nMemo:\n"+d.omemo+"\n\nScorer log (October):\n"+logText(d,"october")+"\n\nBaseline comparison: "+(d.obase||"(none)")+"\nWhat I changed and why:\n"+d.ochg+"\n\n";
    s += "C. WALT'S GAUNTLET (NOVEMBER)\nStage outputs and my replies at the gates:\n"+d.noutp+"\n\nMemo:\n"+d.nmemo+"\n\nScorer log (November):\n"+logText(d,"november")+"\n\nWhat I checked at each gate:\n"+d.ngate+"\n\n";
    s += "D. VERIFICATION\n"+d.ver.map(x=>`Finding ${x.k}: ${x.item}\nWhere the inputs are: ${x.where}\nMy check: ${x.amts}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\n";
    s += "E. MACHINE CARD AND FINAL-PROJECT IDEA\n1. What it does and needs: "+d.cd1+"\n2. Stages and gates: "+d.cd2+"\n3. Testing and results: "+d.cd3+"\n4. Limits and who signs: "+d.cd4+"\n\nEngagement I lean toward: "+d.angle+"\nRequest I used: "+d.angreq+"\n\nMy idea note:\n"+d.angtext+"\n\n";
    s += "F. ETHICAL AI: HUMAN ACCOUNTABILITY\nStep 4 review of the five suggestions:\n"+d.sits.map(x=>`Suggestion ${x.n} (“${x.line}”): ${x.v}. Why: ${x.w}`).join("\n")+"\nDecision: "+d.e4d+"\nWhy: "+d.e4w+"\nAccountable person, what they check, and one thing the machine got wrong: "+d.acc+"\nMy disclosure line: "+d.foot+"\nAI tools I used: "+d.disc+"\n";
    if(!forCoach || d.rev || d.doutp){
      s += "\nG. MASTERY EVIDENCE\nWhat I changed and why: "+d.rev+"\n\nUpdated instructions:\n"+d.instr2+"\n\nDecember stage outputs and my replies at the gates:\n"+d.doutp+"\n\nDecember memo:\n"+d.dmemo+"\n\nScorer log (December):\n"+logText(d,"december")+"\n\nNovember versus December: "+d.cmp+"\nRe-run of October (optional): "+(d.regr||"(none)")+"\nFeedback I rejected and why: "+(d.rej||"(none)")+"\n";
    }
    if(!forCoach) s += "\nFull coach conversation:\n"+d.trans+"\n";
    if(d.grad) s += "\nH. GRADUATE STUDENTS ONLY\nSecond scenario and key: "+d.g1+"\nComparison with November: "+d.g2+"\nOne improvement: "+d.g3+"\n";
    return s;
  }
  function asDoc(d){
    const p = t => "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
    const sit = d.sits.map(x=>`<tr><td>${x.n}</td><td>${esc(x.line)}</td><td>${esc(x.v)}</td><td>${esc(x.w)}</td></tr>`).join("");
    const ver = d.ver.map(x=>`<tr><td>${x.k}</td><td>${esc(x.item)}</td><td>${esc(x.where)}</td><td>${esc(x.amts)}</td><td>${esc(x.verdict)}</td><td>${esc(x.action)}</td></tr>`).join("");
    const lg = m => { const rows = d.log.filter(e=>e.month===m); if(!rows.length) return "<p>(no scorer runs logged)</p>"; return `<table><tr><th>Run</th><th>When</th><th>Caught</th><th>Stage 1 / 2 / 3</th><th>False alarms</th><th>Codes not in files</th><th>Balance</th><th>Words</th><th>Reviewed-by line</th><th>Wrongdoing words</th><th>Points /15</th><th>Memo code</th></tr>${rows.map(e=>`<tr><td>${e.run}</td><td>${esc(e.when)}</td><td>${e.caught} of ${e.total}</td><td>${esc(e.stages.join(" / "))}</td><td>${esc(e.fa.join(", ")||"none")}</td><td>${esc(e.inv.join(", ")||"none")}</td><td>${e.bal?"correct":"not correct"}</td><td>${e.words}</td><td>${e.sign?"yes":"no"}</td><td>${esc(e.wrong.join(", ")||"none")}</td><td>${e.pts}</td><td>${esc(e.code)}</td></tr>`).join("")}</table>`; };
    const pcs = d.pcs.map(x=>`<tr><td>${esc(x.stage)}</td><td>${esc(x.t)}</td></tr>`).join("");
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 8 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 8: The Velox Close Machine</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. My machine</h2><p><b>Pieces I reused:</b></p><table><tr><th>Stage</th><th>Piece reused and what I changed</th></tr>${pcs}</table><p><b>Instructions:</b></p>${p(d.instr)}<p><b>What it said with no files attached:</b></p>${p(d.stoptest)}
<h2>B. Rehearsal on October</h2><p><b>Part 1 (practice, not graded): first try (Step 2):</b></p>${p(d.r1p)}<p><b>What Claude gave me:</b></p>${p(d.r1o)}<p><b>Things I could not rely on:</b></p>${p(d.r1w)}<p><b>Stage outputs and my replies at the gates:</b></p>${p(d.ooutp)}<p><b>Memo:</b></p>${p(d.omemo)}<p><b>Scorer log (October):</b></p>${lg("october")}<p><b>Baseline comparison:</b> ${esc(d.obase||"(none)")}</p><p><b>What I changed and why:</b></p>${p(d.ochg)}
<h2>C. Walt's Gauntlet (November)</h2><p><b>Stage outputs and my replies at the gates:</b></p>${p(d.noutp)}<p><b>Memo:</b></p>${p(d.nmemo)}<p><b>Scorer log (November):</b></p>${lg("november")}<p><b>What I checked at each gate:</b></p>${p(d.ngate)}
<h2>D. Verification</h2><table><tr><th>#</th><th>Finding (as my machine stated it)</th><th>Where the inputs are</th><th>My check</th><th>What I found</th><th>What I did</th></tr>${ver}</table>
<h2>E. Machine card and final-project idea</h2><p><b>1. What it does and needs:</b></p>${p(d.cd1)}<p><b>2. Stages and gates:</b></p>${p(d.cd2)}<p><b>3. Testing and results:</b></p>${p(d.cd3)}<p><b>4. Limits and who signs:</b></p>${p(d.cd4)}<p><b>Engagement I lean toward:</b> ${esc(d.angle)}</p><p><b>Request I used:</b></p>${p(d.angreq)}<p><b>My idea note:</b></p>${p(d.angtext)}
<h2>F. Ethical AI: human accountability</h2><table><tr><th>#</th><th>Suggestion</th><th>My verdict</th><th>Why</th></tr>${sit}</table><p><b>Decision:</b> ${esc(d.e4d)}</p><p><b>Why:</b></p>${p(d.e4w)}<p><b>Accountable person, what they check, and one thing the machine got wrong:</b></p>${p(d.acc)}<p><b>My disclosure line:</b></p>${p(d.foot)}<p><b>AI tools I used:</b></p>${p(d.disc)}
<h2>G. Mastery evidence</h2><p><b>What I changed and why:</b></p>${p(d.rev)}<p><b>Updated instructions:</b></p>${p(d.instr2)}<p><b>December stage outputs and my replies at the gates:</b></p>${p(d.doutp)}<p><b>December memo:</b></p>${p(d.dmemo)}<p><b>Scorer log (December):</b></p>${lg("december")}<p><b>November versus December:</b></p>${p(d.cmp)}<p><b>Re-run of October (optional):</b> ${esc(d.regr||"(none)")}</p><p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>H. Graduate students only</h2><p><b>Second scenario and key</b></p>${p(d.g1)}<p><b>Comparison with November</b></p>${p(d.g2)}<p><b>One improvement</b></p>${p(d.g3)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module8_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]));
    copyText("MODULE 8 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    const best = m => { const r = d.log.filter(e=>e.month===m); return r.length ? r[r.length-1] : null; };
    const n = best("november"), dec = best("december");
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 8 complete!</h2>
      <p>You chained your saved pieces into a four-stage machine with two gates, rehearsed it on October, faced Walt’s Gauntlet${n?` (caught ${n.caught} of ${n.total})`:""}, fixed it with general rules, and tested it on a month it had never seen${dec?` (caught ${dec.caught} of ${dec.total})`:""}. That is the habit: <b>build the steps, put a person at the gates, test it on a month you have not seen, and write down what it cannot do.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 9 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 8 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#angtext").dataset.minwords = "150"; $("#angtext").dataset.maxwords = "250";
  onChange($("#angtext")); onChange($("#isGrad"));
  render();
})();
