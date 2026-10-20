/* Walt's Scorer: checks a close memo against hashed answer keys (no answers are stored in this file). */
(function(root){
  function sha256(str){
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const enc = (typeof TextEncoder!=="undefined") ? new TextEncoder().encode(str) : Buffer.from(str,"utf8");
    const l = enc.length, bits = l*8;
    const n = (((l+9+63)>>6)<<6);
    const buf = new Uint8Array(n); buf.set(enc); buf[l]=0x80;
    const dv = new DataView(buf.buffer); dv.setUint32(n-4, bits>>>0); dv.setUint32(n-8, Math.floor(bits/4294967296));
    let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const w=new Array(64);
    const rr=(x,c)=>(x>>>c)|(x<<(32-c));
    for(let o=0;o<n;o+=64){
      for(let i=0;i<16;i++) w[i]=dv.getUint32(o+i*4);
      for(let i=16;i<64;i++){ const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3), s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10); w[i]=(w[i-16]+s0+w[i-7]+s1)|0; }
      let [a,b,c,d,e,f,g,hh]=h;
      for(let i=0;i<64;i++){
        const S1=rr(e,6)^rr(e,11)^rr(e,25), ch=(e&f)^(~e&g), t1=(hh+S1+ch+K[i]+w[i])|0;
        const S0=rr(a,2)^rr(a,13)^rr(a,22), mj=(a&b)^(a&c)^(b&c), t2=(S0+mj)|0;
        hh=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
      }
      h=[(h[0]+a)|0,(h[1]+b)|0,(h[2]+c)|0,(h[3]+d)|0,(h[4]+e)|0,(h[5]+f)|0,(h[6]+g)|0,(h[7]+hh)|0];
    }
    return h.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("");
  }
  const WRONGDOING = /\b(fraud\w*|steal\w*|stole\w*|theft|thief|embezzl\w*|misappropriat\w*|criminal\w*|crime|guilty|kickback\w*)\b/ig;
  function extract(text){
    const t = String(text||"");
    const refs = new Set(), lines = new Set(), pays = new Set();
    let m;
    const reRef = /\b(CHK|CHECK|DEP|WIRE|ACH|RTN|FEE|INT)\s?-?(\d{4,5})\b/gi;
    while((m=reRef.exec(t))){ let p=m[1].toUpperCase(); if(p==="CHECK") p="CHK"; refs.add(p+m[2]); }
    const reLine = /\bL(\d{2})\b/g;
    while((m=reLine.exec(t))){ lines.add("L"+m[1]); }
    const rePay = /\bP-?(\d{6})\b/gi;
    while((m=rePay.exec(t))){ pays.add("P-"+m[1]); }
    const nums = (t.match(/\d[\d,]*\.\d{2}/g)||[]).map(x=>x.replace(/,/g,""));
    return {refs:[...refs], lines:[...lines], pays:[...pays], nums};
  }
  function words(s){ return (String(s).trim().match(/\S+/g)||[]).length; }
  function score(month, text, KEYS){
    const K = KEYS[month]; if(!K) throw new Error("No key for "+month);
    const h = tok => sha256("velox-m8|"+month+"|"+tok);
    const ex = extract(text);
    const stages = [
      {name:"Stage 1 (cash)", toks:ex.refs, uni:new Set(K.u1), groups:K.t1},
      {name:"Stage 2 (variances)", toks:ex.lines, uni:new Set(K.u2), groups:K.t2},
      {name:"Stage 3 (payments)", toks:ex.pays, uni:new Set(K.u3), groups:K.t3}
    ];
    const out = {stages:[], falseAlarms:[], invented:[], caught:0, total:0};
    stages.forEach(s=>{
      const hs = s.toks.map(t=>({t, h:h(t)}));
      const truth = new Set(); s.groups.forEach(g=>g.forEach(x=>truth.add(x)));
      let c=0; s.groups.forEach(g=>{ if(hs.some(o=>g.includes(o.h))) c++; });
      hs.forEach(o=>{ if(!s.uni.has(o.h)) out.invented.push(o.t); else if(!truth.has(o.h)) out.falseAlarms.push(o.t); });
      out.stages.push({name:s.name, caught:c, total:s.groups.length});
      out.caught += c; out.total += s.groups.length;
    });
    out.balanceOk = ex.nums.some(n=>sha256("velox-m8|"+month+"|"+n)===K.adj);
    out.words = words(text);
    out.signoff = /reviewed\s+by\s*:/i.test(text);
    out.wrongdoing = [...new Set((String(text).match(WRONGDOING)||[]).map(x=>x.toLowerCase()))];
    const flagged = out.falseAlarms.length + out.invented.length;
    out.formatOk = out.words<=300 && out.signoff && out.wrongdoing.length===0;
    // points on the 15-point Gauntlet scale: balance 3, findings 10 * caught / (planted + false alarms + codes not in the files), format 2
    out.points = (out.balanceOk?3:0) + 10*out.caught/(out.total+flagged) + (out.formatOk?2:0);
    out.points = Math.round(out.points*10)/10;
    return out;
  }
  root.M8Score = {sha256, extract, score, words};
  if(typeof module!=="undefined") module.exports = root.M8Score;
})(typeof window!=="undefined"?window:globalThis);
