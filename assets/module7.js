(function(){
  const SITUATIONS = [
    {facts:"Claude’s research memo cites a court case that is not in the Source Packet and that nobody on the team has opened.", line:"Put the case in the response to the IRS. Claude was confident and gave a full citation."},
    {facts:"Claude marked three of its own citations “Not in the packet” and said a person should open each one before it is used in anything sent to the IRS.", line:"Keep those three citations out of the response until a person has opened each one at its source and confirmed what it says."},
    {facts:"Claude offered to finish and send the response to the IRS so the November 9 deadline is not missed.", line:"Send the response letter to the IRS now from the Tax Department’s email, signed “Velox Tax Department (AI-assisted).”"},
    {facts:"Claude gave the corrected 2025 deduction as a single rounded figure without showing any arithmetic.", line:"Use that figure in the response. It looks reasonable and saves time."},
    {facts:"Claude said that a different rule, section 179 (a separate rule that lets a business deduct equipment costs in the first year, up to a dollar limit), might apply. That rule is not in the Source Packet.", line:"In the internal memo to Grace only, keep the section 179 point marked “not in the sources, to be confirmed by a tax professional,” and keep it out of anything sent to the IRS until a person confirms it."}
  ];
  const SIT_VERDICTS = ["Meets the policy","Does not meet the policy"];
  const FIND_VERDICTS = ["Matches the packet or my calculation","Differs only in rounding or wording","Differs from the packet or my calculation","Cannot be checked from the files"];
  const ANGLES = [
    {id:"Accounting: draft response to the IRS", major:"Accounting", title:"Draft response to the IRS", text:"Write a draft response letter of 150 to 200 words to the IRS for Grace to review and sign. It answers the letter’s three requests: what Velox will send (contract dates and copies, in-service dates), and Velox’s position on the items, citing the authority named in the packet note (for example, section 168(k) or Notice 2026-11) and quoting only packet words (you may add a packet label such as [S3] in brackets as a note for the reviewer, which would be removed before anything is sent), with a line marked “[to be confirmed]” for anything not yet known, such as the missing contract date. It must not claim anything the packet does not support. Leave the signature line as “[Director of Tax to review and sign]”."},
    {id:"Finance: cash and reserve estimate", major:"Finance", title:"Cash and reserve estimate", text:"Write 150 to 200 words for the CFO’s office on the cash effect: the extra tax due now if the adjustment stands (show the arithmetic), the range if the item with the missing contract date goes either way, what is paid now versus recovered in later years through larger deductions (mark the later-year amounts “to be computed” if the files do not give them), and what you would tell the treasury team to set aside. Name nobody."},
    {id:"Marketing: investor questions and answers", major:"Marketing", title:"Investor questions and answers", text:"Write a short Q&A of 150 to 200 words for the communications team in case an analyst asks about an IRS information request: three questions an analyst might ask, a careful one-or-two-sentence answer to each that does not guess at outcomes, and who must approve the wording before anyone speaks. Do not state conclusions the files do not support."},
    {id:"Management: message to plant managers", major:"Management", title:"Message to plant managers", text:"Write a message of 150 to 200 words to the South Carolina plant managers about keeping equipment purchase records: why the date a contract is signed matters for taxes, exactly what to send to the Tax Department for every equipment purchase, by when (write “[date to be set by Tax]”), and which role to ask. Do not blame anyone for the missing date."},
    {id:"Supply chain: equipment purchase checklist", major:"Supply chain", title:"Equipment purchase checklist", text:"Write a checklist of 6 to 8 items for what Procurement should record and keep for every equipment purchase (for example, the signing date of the binding contract, a copy of the signed contract, and the in-service date), each tied to something the IRS letter asks for, plus one separate item, not counted in the 6 to 8, to confirm with the Tax Department that is not in the files."},
    {id:"MIS: fixed-asset data fixes", major:"MIS (information systems)", title:"Fixed-asset data fixes", text:"Write a list of 6 to 8 items: fields and controls to add to the fixed-asset system so the contract date is never missing (for example, a required signing-date field and a check that blocks an asset from being saved without it), who owns each, and one automatic report that would have caught the missing date earlier. The files say only that a “fixed-asset system” exists, so mark anything you are unsure of “to be confirmed.”"}
  ];
  const STEP_NAMES = ["Brief","Try","Learn","Ethics","Attempt","Mastery","Quiz","Reflect"];
  const P = "m7.";
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
      <label class="lbl" for="vw${k}"><b>Where the inputs are:</b> which file and which lines or note (for example: equipment schedule, the cost column for rows where contract_signed_date is before a cutoff; or Source Packet, note S3)</label>
      <input type="text" id="vw${k}" data-save="v.${k}.where" data-min="5" data-req>
      <label class="lbl" for="vm${k}"><b>Your own arithmetic:</b> the formula, the numbers, and your result</label>
      <textarea id="vm${k}" data-save="v.${k}.amts" data-min="15" data-req style="min-height:60px"></textarea>
      <label class="lbl" for="vv${k}"><b>What did you find?</b> (choose \u201cCannot be checked from the files\u201d for a claim the files do not contain, such as a penalty amount or a Section 179 limit)</label>
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
  if(C.videoUrl && C.videoUrl[7]){ $("#videoBox").innerHTML = videoHtml(C.videoUrl[7], "Module 7 video"); const h=$("#videoHelp"); if(h) h.innerHTML = "Click the <b>play</b> button on the video to watch it. Prefer to read, or want to follow along? Use the buttons below."; }
  else { const h=$("#videoHelp"); if(h) h.textContent = "The video is not posted yet. Grace's message below covers the key points."; }
  if(C.quizUrl && C.quizUrl[7]){ const q=$("#quizLink"); q.href=C.quizUrl[7]; q.style.display="inline-block"; $("#quizNone").style.display="none"; }
  if(C.submitUrl && C.submitUrl[7]){ const s=$("#submitLink"); s.href=C.submitUrl[7]; s.style.display="inline"; }

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
    const nx = $("#next"); nx.textContent = cur===8?"Finish Module 7":"Next";
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
    s += "A. RESEARCH MEMO TEMPLATE\n"+d.tpl+"\n\n";
    s += "B. RUNNING THE ANALYSIS\nPart 1 (practice, not graded) - first try (Step 2): "+d.r1p+"\nWhat AI gave me: "+d.r1o+"\nThings I could not tell: "+d.r1w+"\n\nPart 3 requests (no sources):\n"+d.p3req+"\n\nClaude's first memo and citation table:\n"+d.p3res+"\n\nPart 4 requests (with the Source Packet):\n"+d.p4req+"\n\nClaude's citation check and grounded memo:\n"+d.p4tab+"\n\nClaude's deduction calculation and what the letter asks:\n"+d.p4oth+"\n\n";
    s += "C. VERIFICATION\n"+d.ver.map(x=>`Finding ${x.k}: ${x.item}\nWhere the inputs are: ${x.where}\nMy work: ${x.amts}\nWhat I found: ${x.verdict}\nWhat I did about it: ${x.action}`).join("\n\n")+"\n\n";
    s += "D. MEMO FOR GRACE\nMy recommended step: "+d.dec+"\nRequest I used: "+d.ppr+"\n\nMy memo:\n"+d.ppage+"\n\n";
    s += "E. MY LENS\nOption chosen: "+d.angle+"\nRequest I used: "+d.angreq+"\n\nMy piece:\n"+d.angtext+"\n\n";
    s += "F. ETHICAL AI: ACCURACY AND SOURCES\nStep 4 review of the five AI suggestions:\n"+d.sits.map(x=>`Suggestion ${x.n} (“${x.line}”): ${x.v}. Why: ${x.w}`).join("\n")+"\nDecision: "+d.e4d+"\nWhy: "+d.e4w+"\nSources I checked myself, and what I did about one that did not hold up: "+d.acc+"\nMy disclosure line: "+d.foot+"\nAI tools I used: "+d.disc+"\n";
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
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Module 7 Submission</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#C8102E}h2{color:#C8102E;border-bottom:2px solid #F1BE48}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#F3E3E6}</style></head><body>
<h1>Module 7: Show Me the Source</h1>
<p><b>Student:</b> ${esc(d.name)} &nbsp; <b>Course:</b> ACCT/MIS ${d.grad?"5420":"4420"} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
<h2>A. Research Memo Template</h2>${p(d.tpl)}
<h2>B. Running the analysis</h2><p><b>Part 1 (practice, not graded): first try (Step 2):</b></p>${p(d.r1p)}<p><b>What AI gave me:</b></p>${p(d.r1o)}<p><b>Things I could not tell:</b></p>${p(d.r1w)}<p><b>Part 3 requests (no sources):</b></p>${p(d.p3req)}<p><b>Claude's first memo and citation table:</b></p>${p(d.p3res)}<p><b>Part 4 requests (with the Source Packet):</b></p>${p(d.p4req)}<p><b>Claude's citation check and grounded memo:</b></p>${p(d.p4tab)}<p><b>Claude's deduction calculation and what the letter asks:</b></p>${p(d.p4oth)}
<h2>C. Verification</h2><table><tr><th>#</th><th>Finding (as Claude stated it)</th><th>Where the inputs are</th><th>My work</th><th>What I found</th><th>What I did</th></tr>${ver}</table>
<h2>D. Memo for Grace</h2><p><b>My recommended step:</b> ${esc(d.dec)}</p><p><b>Request I used:</b></p>${p(d.ppr)}<p><b>My memo:</b></p>${p(d.ppage)}
<h2>E. My lens</h2><p><b>Option chosen:</b> ${esc(d.angle)}</p><p><b>Request I used:</b></p>${p(d.angreq)}<p><b>My piece:</b></p>${p(d.angtext)}
<h2>F. Ethical AI: accuracy and sources</h2><table><tr><th>#</th><th>AI suggestion</th><th>My verdict</th><th>Why</th></tr>${sit}</table><p><b>Decision:</b> ${esc(d.e4d)}</p><p><b>Why:</b></p>${p(d.e4w)}<p><b>Sources I checked myself, and what I did about one that did not hold up:</b></p>${p(d.acc)}<p><b>My disclosure line:</b></p>${p(d.foot)}<p><b>AI tools I used:</b></p>${p(d.disc)}
<h2>G. Coach feedback and mastery evidence</h2><p><b>What I changed after feedback:</b></p>${p(d.rev)}<p><b>Feedback I rejected and why:</b></p>${p(d.rej||"(none)")}<p><b>Full coach conversation:</b></p>${p(d.trans)}
${d.grad?`<h2>H. Graduate students only</h2><p><b>Third finding</b></p>${p(d.g1)}<p><b>Check without AI</b></p>${p(d.g2)}<p><b>Assumption or limitation</b></p>${p(d.g3)}`:""}
</body></html>`;
  }
  function download(){
    const d = data();
    const blob = new Blob(["﻿"+asDoc(d)],{type:"application/msword"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Module7_Submission_"+(d.name.replace(/[^A-Za-z0-9]+/g,"_")||"student")+".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast("Downloaded. Upload it to Canvas.");
  }
  $$("[data-copy]").forEach(b=>b.addEventListener("click",()=>{ copyText($(b.dataset.copy).textContent.trim()).then(ok=>{ if(!ok) return; const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent="Copied!"; setTimeout(()=>b.textContent=o,1500); }); }));
  $("#copyDraft").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]));
    copyText("MODULE 7 DRAFT\n\n"+asText(data(),true)+(left.length?"\n\n(Note: my draft is not finished yet.)":""));
  });
  $("#dl1").addEventListener("click",()=>{
    const left = unmet(steps[3]).concat(unmet(steps[4]),unmet(steps[5]));
    if(left.length){ toast("Finish Steps 4, 5, and 6 first"); return; }
    download();
  });

  /* ---------- finish ---------- */
  function finishCard(){
    const d = data();
    $("#finishBox").innerHTML = `<div class="card done-card"><h2>Module 7 complete!</h2>
      <p>You wrote a reusable research memo template, had AI draft a tax memo and then check its own citations against sources you gave it, checked two results yourself, wrote Grace a memo of ${words(d.ppage)} words, and kept a person accountable for what goes to the IRS. That is the habit: <b>give AI the sources, make it quote them, open the ones that matter, and let a person sign.</b></p>
      <p><button class="btn btn-red" id="dl2" type="button">Download my submission (.doc)</button></p>
      <p class="hint">Upload it to Canvas. Module 8 opens soon.</p>
      <p><button class="btn btn-ghost btn-sm" id="reset" type="button">Clear my saved answers on this device</button></p></div>`;
    $("#dl2").addEventListener("click",download);
    $("#reset").addEventListener("click",()=>{ if(confirm("This erases everything you typed in Module 7 on this device. Continue?")){ Object.keys(localStorage).filter(k=>k.startsWith("velox."+P)).forEach(k=>localStorage.removeItem(k)); location.reload(); }});
  }
  function finish(){ store.set(P+"done",true); finishCard(); confetti(); render(); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
  if(store.get(P+"done",false)) finishCard();

  $("#ppage").dataset.minwords = "60"; $("#ppage").dataset.maxwords = "300";
  onChange($("#ppage")); onChange($("#isGrad"));
  render();
})();
