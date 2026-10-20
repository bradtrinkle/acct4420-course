(function(){
  const SITUATIONS = [
    {facts:"Claude drafted the findings section of the report from the payment pattern and one other clue.", line:"The approver and an employee committed fraud through the vendor, so this should go to the audit committee as a finding."},
    {facts:"Claude drafted the report so that it calls the results indicators for follow-up, lists what is not known, and names the head of Internal Audit as the person who reviews and signs it.", line:"These are indicators that need follow-up, not conclusions. Nadia Ferreira will review and sign this report before it goes to the audit committee."},
    {facts:"Claude suggested a way to speed things up.", line:"Email the list of flagged payments, with the approver IDs and the employee ID, to all Purchasing managers so they can look into it themselves."},
    {facts:"Claude offered to finish the paperwork.", line:"Sign the finished report as “Prepared and reviewed by: AI audit assistant” and send it to the audit committee."},
    {facts:"Claude found that one flag is probably explained by a fixed-fee contract. Instead of dropping it, Claude kept it in the report with the likely explanation and asked a person to confirm it.", line:"Keep the fixed-fee vendor’s flag in the report, note the contract as the likely explanation, and ask a person to confirm it in the contract before the flag is closed."}
  ];
  const SIT_VERDICTS = ["Meets the policy","Does not meet the policy"];
  const FIND_VERDICTS = ["Matches my calculation","Differs only in rounding or wording","Differs from my calculation","Cannot be checked from the files"];
  const ANGLES = [
    {id:"Accounting: fraud-risk and controls memo", major:"Accounting", title:"Fraud-risk and controls memo", text:"Write a memo of 150 to 200 words for the head of Internal Audit that names two controls that did not stop these payments, explains in plain words why each did not stop them, and recommends one fix for each. Say what is not in the data."},
    {id:"Finance: exposure estimate", major:"Finance", title:"Exposure estimate", text:"Write 150 to 200 words for the CFO’s office on how much Velox paid the vendor with the strongest indicators in the quarter and what share of the quarter’s total payments in dollars that is (show the arithmetic), what is at risk versus what is unknown (such as whether anything was delivered), and what you would need before deciding to set money aside. Name nobody."},
    {id:"Marketing: trust and communication brief", major:"Marketing", title:"Trust and communication brief", text:"Write a brief of 150 to 200 words for the communications team on how Velox should talk to employees, vendors, and the public if news of an internal review leaked: three things to say, three things never to say (no names, no conclusions), and who approves the wording."},
    {id:"Management: message to the Purchasing team", major:"Management", title:"Message to the Purchasing team", text:"Write a message of 150 to 200 words to the Purchasing team about a routine review of vendor payments: why it is happening, that no conclusions have been reached, how people can raise concerns, and what to do if they are asked for records. Do not hint at any suspect or name the vendor."},
    {id:"Supply chain: vendor onboarding checklist", major:"Supply chain", title:"Vendor onboarding checklist", text:"Write a checklist of 6 to 8 items for how Velox should verify a new vendor before paying it (for example, a signed tax form, a purchase order, an address and bank-account check), each tied to something that went wrong in the records, and one thing to confirm that is not in the files."},
    {id:"MIS: data and logs request", major:"MIS (information systems)", title:"Data and logs request", text:"Write a list of 6 to 8 items: the system records to preserve and request for the investigation (for example, the vendor-list change history, approval logs, bank-account changes), who owns each, and one data check that would catch a similar pattern earlier. The files do not name Velox’s systems, so write what you would need to confirm, marked “to be confirmed.”"}
  ];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Attempt","Mastery","Quiz","Reflect"];
  const P = "m6.";
  const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const words = s => (String(s).trim().match(/\S+/g)||[]).length;

  /* ---------- render dynamic parts ---------- */
  $("#situations").innerHTML = SITUATIONS.map((s,i)=>{const n=i+1; return `
    <div class="task">
      <div class="n">${n}</div>
      <div><b>Suggestion ${n}, the facts:</b> ${esc(s.facts)}<br><b>Claude’s suggestion:</b> <i>“${esc(s.line)}”</i></div>
      <div class="row">
        <label class="lbl" for="sv${n}">Does this suggestion meet the policy?</label>
        <select id="sv${n}" data-save="sit.${n}.verdict" data-req data-sel><option value="">Choose one…</option>${SIT_VERDICTS.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
        <label class="lbl" for="sw${n}">Why? Name what the suggestion has AI do that a person must do, or what makes it acceptable.</label>
        <textarea id="sw${n}" data-save="sit.${n}.why" data-min="15" data-req style="min-height:60px"></textarea>
      </div>
    </div>`;}).join("");

  $("#vrows").innerHTML = [1,2].map(k=>`
    <div class="card">
      <h3>Finding ${k}</h3>
      <label class="lbl" for="vc${k}"><b>Quote the finding</b> exactly as Claude stated it in your final Part 3 or Part 4 answer</label>
      <input type="text" id="vc${k}" data-save="v.${k}.item" data-min="5" data-req>
      <label class="lbl" for="vw${k}"><b>Where the inputs are:</b> which file and which lines (for example: payments ledger, the amount column for rows where vendor_id is V-9999, a made-up code)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="5" data-req>
      <label class="lbl" for="vm${k}"><b>Your own arithmetic:</b> the formula, the numbers, and your result</label>
      <textarea id="vm${k}" data-save="v.${k}.amts" data-min="15" data-req style="min-height:60px"></textarea>
      <label class="lbl" for="vv${k}"><b>What did you find?</b> (choose \u201cCannot be checked from the files\u201d for a claim the files do not contain, such as whether goods were actually delivered)</label>
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
  if(C.videoUrl && C.videoUrl[6]){ $("#videoBox").innerHTML = videoHtml(C.videoUrl[6], "Module 6 video"); const h=$("#videoHelp"); if(h) h.innerHTML = "Click the <b>play</b> button on the video to watch it. Prefer to read, or want to follow along? Use the buttons below."; }
  else { const h=$("#videoHelp"); if(h) h.textContent = "The video is not posted yet. You can read the transcript or follow along with the slides using the buttons below."; }
  if(C.quizUrl && C.quizUrl[6]){ const q=$("#quizLink"); q.href=C.quizUrl[6]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[6]){ const s=$("#submitLink"); s.href=C.submitUrl[6]; s.style.display="inline"; }

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
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 6":"Next";
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
    if(el && el.id==="ppage"){ const n=words(el.value); $("#wc").textContent = n+" words (60 to 300)"+(n>300?": too long, shorten it":(n>0&&n<60?": too short":"")); }
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
    const f = ["r1p","r1o","r1w","tpl","p3req","p3res","p4req","p4tab","p4oth","dec","ppr","ppage","angle","angreq","angtext","acc","foot","disc","e4d","e4w","rev","rej","trans","g1","g2","g3"];
    const o = {grad:isGrad(),sits,ver}; f.forEach(id=>{o[id]=val(id);}); o.name=val("stuName"); return o;
  }
  function asText(d, forCoach){
    let s = "";
    s += "A. AUDIT EXTRACTION TEMPLATE\n"+d.tpl+"\n\n";
    s += "B. RUNNING THE ANALYSIS\nPart 1 (practice, not graded) - tip-only request (Step 2): "+d.r1p+"\nTip-only summary: "+d.r1o+"\nThings I could not tell: "+d.r1w+"\n\nExtraction requests I sent:\n"+d.p3req+"\n\nClaude's extraction table and patterns:\n"+d.p3res+"\n\nLedger requests I sent:\n"+d.p4req+"\n\nClaude's Benford table and the vendors behind each gap:\n"+d.p4tab+"\n\nClaude's other checks and innocent explanations:\n"+d.p4oth+"\n\n";
    s += "C. VERIFICATION\n"+d.ver.map(x=>`Finding ${x.k}: ${x.item}\nWhere the inputs are: ${x.where}\nMy work: ${x.amts}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\n";
    s += "D. REPORT FOR NADIA\nMy recommended next step: "+d.dec+"\nRequest I used: "+d.ppr+"\n\nMy report:\n"+d.ppage+"\n\n";
    s += "E. MY LENS\nOption chosen: "+d.angle+"\nRequest I used: "+d.angreq+"\n\nMy piece:\n"+d.angtext+"\n\n";
    s += "F. ETHICAL AI: HUMAN ACCOUNTABILITY\nStep 4 review of the five AI suggestions:\n"+d.sits.map(x=>`Suggestion ${x.n} (“${x.line}”): ${x.v}. Why: ${x.w}`).join("\n")+"\nDecision: "+d.e4d+"\nWhy: "+d.e4w+"\nDecisions I left to a person, and the check I made: "+d.acc+"\nMy disclosure line: "+d.foot+"\nAI tools I used: "+d.disc+"\n";
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
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 6 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 6: Follow the Money</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Audit Extraction Template</h2>${p(d.tpl)}
<h2>B. Running the analysis</h2><p><b>Part 1 (practice, not graded): tip-only request (Step 2):</b></p>${p(d.r1p)}<p><b>Tip-only summary:</b></p>${p(d.r1o)}<p><b>Things I could not tell:</b></p>${p(d.r1w)}<p><b>Extraction requests I sent:</b></p>${p(d.p3req)}<p><b>Claude's extraction table and patterns:</b></p>${p(d.p3res)}<p><b>Ledger requests I sent:</b></p>${p(d.p4req)}<p><b>Claude's Benford table and the vendors behind each gap:</b></p>${p(d.p4tab)}<p><b>Claude's other checks and innocent explanations:</b></p>${p(d.p4oth)}
<h2>C. Verification</h2><table><tr><th>#</th><th>Finding (as Claude stated it)</th><th>Where the inputs are</th><th>My work</th><th>What I found</th><th>What I did</th></tr>${ver}</table>
<h2>D. Report for Nadia</h2><p><b>My recommended next step:</b> ${esc(d.dec)}</p><p><b>Request I used:</b></p>${p(d.ppr)}<p><b>My report:</b></p>${p(d.ppage)}
<h2>E. My lens</h2><p><b>Option chosen:</b> ${esc(d.angle)}</p><p><b>Request I used:</b></p>${p(d.angreq)}<p><b>My piece:</b></p>${p(d.angtext)}
<h2>F. Ethical AI: human accountability</h2><table><tr><th>#</th><th>AI suggestion</th><th>My verdict</th><th>Why</th></tr>${sit}</table><p><b>Decision:</b> ${esc(d.e4d)}</p><p><b>Why:</b></p>${p(d.e4w)}<p><b>Decisions I left to a person, and the check I made:</b></p>${p(d.acc)}<p><b>My disclosure line:</b></p>${p(d.foot)}<p><b>AI tools I used:</b></p>${p(d.disc)}
<h2>G. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>H. Graduate students only</h2><p><b>Third finding</b></p>${p(d.g1)}<p><b>Check without AI</b></p>${p(d.g2)}<p><b>Assumption or limitation</b></p>${p(d.g3)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module6_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]));
    copyText("MODULE 6 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 6 complete!</h2>
      <p>You wrote a reusable extraction template, had AI pull the facts from messy records and test a ledger for unusual patterns, checked two of its results yourself, reported indicators to the right person in ${words(d.ppage)} words, and kept the accountability with people. That is the habit: <b>get AI to do the counting, make it show its work, verify what matters, and let a person decide.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 7 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 6 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#ppage").dataset.minwords = "60"; $("#ppage").dataset.maxwords = "300";
  onChange($("#ppage")); onChange($("#isGrad"));
  render();
})();
