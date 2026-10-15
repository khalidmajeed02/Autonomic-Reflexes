const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let speed=1,runTok=0,busy=false,tab='bp';
const wait=ms=>new Promise(r=>setTimeout(r,(reduce?Math.min(ms,250):ms)*speed));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
function src(x){return x?`<span class="src">${/^(F|T|Ch)/.test(x)?x:'Chapter 13, '+x}</span>`:''}

function tween(dur,fn){
  const my=runTok;
  return new Promise(res=>{
    if(reduce){fn(1);return res();}
    const t0=performance.now(),d=dur*speed;
    (function f(t){
      if(my!==runTok)return res();
      const k=Math.min(1,(t-t0)/d),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      fn(e);k<1?requestAnimationFrame(f):res();
    })(t0);
  });
}
function spawn(svg,path,dur,guard){
  return new Promise(res=>{
    const layer=svg.querySelector('.fx'),L=path.getTotalLength(),c=document.createElementNS(NS,'circle');
    c.setAttribute('r',6);c.setAttribute('class','pz');layer.appendChild(c);
    if(reduce){const p=path.getPointAtLength(L);c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);setTimeout(()=>{c.remove();res();},250);return;}
    const t0=performance.now(),d=dur*speed;
    (function f(t){
      if(guard&&!guard()){c.remove();return res();}
      const k=Math.min(1,Math.max(0,(t-t0)/d)),p=path.getPointAtLength(k*L);
      c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);
      if(k<1)requestAnimationFrame(f);else{c.remove();res();}
    })(t0);
  });
}
function pulses(svg,ids,n=3,dur=1000,gap=260){
  const my=runTok,guard=()=>my===runTok;
  const all=[];
  ids.forEach(id=>{const path=svg.querySelector('#'+id);for(let i=0;i<n;i++)all.push(new Promise(r=>setTimeout(()=>{if(!guard())return r();spawn(svg,path,dur,guard).then(r);},i*gap*speed)));});
  return Promise.all(all);
}
function ping(svg,ids){ids.forEach(id=>{const el=svg.querySelector('#'+id);el.classList.remove('ping');void el.getBBox();el.classList.add('ping');});return wait(1300);}
function gpulse(svg,ids){ids.forEach(id=>{const el=svg.querySelector('#'+id);el.classList.remove('gpulse');void el.getBBox();el.classList.add('gpulse');});return wait(1750);}

const MARKERS=`<defs>
${['sym','para','som','aff','cns'].map(k=>`<marker id="ar-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--${{sym:'symp',para:'para',som:'soma',aff:'tx',cns:'muted'}[k]})"/></marker>`).join('')}
</defs>`;

/* ================= 1. Blood pressure (p. 133) ================= */
/* Levels run from -3 (furthest below normal) to +3 (furthest above normal); 0 is normal. */
const BP={bp:0,res:0,s:0};
const LV={
  bp:['Severely low','Moderately low','Slightly low','Normal','Slightly high','Moderately high','Severely high'],
  s:['Strongly inhibited','Moderately inhibited','Slightly inhibited','Normal','Slightly increased','Moderately increased','Greatly increased'],
  res:['Greatly decreased','Moderately decreased','Slightly decreased','Normal','Slightly increased','Moderately increased','Greatly increased'],
  flow:['Severely reduced','Moderately reduced','Slightly reduced','Sufficient','Slightly increased','Moderately increased','Greatly increased']
};
const lvTxt=(arr,v)=>arr[Math.round(clamp(v,-3,3))+3];
function mix(a,b,k){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`;}
/* Brain colour for each blood-flow level, from severely reduced (-3) to greatly increased (+3) */
const BRAIN_COL=['#c9cfd9','#ddd8dd','#ecd2cd','#f1c0b8','#e9968e','#dc6a62','#c13c35'];
const METERS=[['bp','Systemic blood pressure'],['s','Sympathetic adrenergic activity'],['res','Vascular resistance'],['flow','Blood flow to brain']];
const bpMeters=`<div class="meters" id="bp-meters">${METERS.map(([k,l])=>`<div class="meter" data-m="${k}"><div class="m-lab">${l}</div><div class="m-scale">${[-3,-2,-1,0,1,2,3].map(v=>`<span class="cell${v===0?' norm':''}"></span>`).join('')}</div><div class="m-ends"><span>${k==='bp'||k==='flow'?'Low':'Less'}</span><span>${k==='bp'||k==='flow'?'High':'More'}</span></div><div class="m-val"></div></div>`).join('')}</div>`;
const bpSVG=`<svg viewBox="0 0 700 410" role="img" aria-label="Blood pressure reflex diagram">${MARKERS}
  <text x="16" y="20" class="sub">Blood flow to brain: <tspan class="tag" id="bp-brainTxt">Sufficient</tspan></text>
  <rect id="bp-cnsBox" x="54" y="28" width="636" height="162" rx="22" class="cnsbox"/>
  <text x="676" y="52" text-anchor="end" class="lbl">CNS</text>
  <text x="676" y="70" text-anchor="end" class="sub">Brain and spinal cord</text>
  <g id="bp-brainG" transform="translate(0,26)">
    <path class="brn" d="M196 96 C 198 110, 204 122, 216 128 L 232 128 L 232 142 L 212 142 C 196 136, 184 118, 182 100 Z"/>
    <path class="brn" d="M214 92 C 236 82, 268 88, 270 104 C 270 120, 238 124, 220 116 C 208 110, 206 98, 214 92 Z"/>
    <path class="gyr" d="M220 100 C 236 95, 254 97, 266 104"/><path class="gyr" d="M220 109 C 238 107, 254 109, 265 112"/>
    <path class="brn" d="M80 72 C 66 44, 90 14, 130 12 C 158 2, 200 4, 226 18 C 256 30, 272 54, 262 80 C 256 94, 236 98, 218 94 C 200 104, 168 108, 146 102 C 116 108, 88 96, 80 72 Z"/>
    <path class="gyr" d="M98 56 C 112 44, 126 60, 142 48"/><path class="gyr" d="M120 24 C 128 34, 118 44, 128 56"/>
    <path class="gyr" d="M150 22 C 166 14, 182 30, 200 20"/><path class="gyr" d="M206 30 C 214 42, 204 50, 216 62"/>
    <path class="gyr" d="M96 82 C 114 72, 134 88, 156 76"/><path class="gyr" d="M160 50 C 178 40, 196 56, 222 46"/>
    <path class="gyr" d="M170 84 C 190 74, 210 90, 240 78"/><path class="gyr" d="M230 32 C 246 42, 240 56, 254 66"/>
  </g>
  <text x="280" y="72" class="lbl">Brain</text>
  <g id="bp-key">${['#c9cfd9','#ddd8dd','#ecd2cd','#f1c0b8','#e9968e','#dc6a62','#c13c35'].map((c,i)=>`<rect x="${282+i*24}" y="82" width="20" height="12" rx="3" style="fill:${c}"/>`).join('')}</g>
  <text x="282" y="108" class="sub" style="font-size:11.5px">◀ Reduced</text>
  <text x="282" y="121" class="sub" style="font-size:11.5px">blood flow</text>
  <text x="446" y="108" text-anchor="end" class="sub" style="font-size:11.5px">Increased ▶</text>
  <text x="446" y="121" text-anchor="end" class="sub" style="font-size:11.5px">blood flow</text>
  <rect x="228" y="154" width="452" height="16" rx="8" style="fill:#f1d9c4;stroke:#9b5a55;stroke-width:1.6"/>
  <rect x="440" y="154" width="200" height="16" style="fill:var(--symp);opacity:.28"/>
  <text x="330" y="146" class="lbl">Spinal cord</text>
  <text x="540" y="146" text-anchor="middle" class="tag" style="fill:var(--symp)">Thoracolumbar</text>
  <path d="M440 174 L440 180 L640 180 L640 174" style="fill:none;stroke:var(--symp);stroke-width:2"/>

  <line id="bp-ica-w" x1="130" y1="350" x2="130" y2="134" style="stroke:var(--vessel);stroke-linecap:round"/>
  <line id="bp-ica-l" x1="130" y1="350" x2="130" y2="134" style="stroke:var(--lumen);stroke-linecap:round"/>
  <line id="bp-ao-w" x1="20" y1="350" x2="470" y2="350" style="stroke:var(--vessel);stroke-linecap:round"/>
  <line id="bp-ao-l" x1="20" y1="350" x2="470" y2="350" style="stroke:var(--lumen);stroke-linecap:round"/>
  <line id="bp-art-w" x1="470" y1="350" x2="688" y2="350" style="stroke:var(--vessel);stroke-linecap:round"/>
  <line id="bp-art-l" x1="470" y1="350" x2="688" y2="350" style="stroke:var(--lumen);stroke-linecap:round"/>
  <g id="bp-flow"></g>
  <g id="bp-bands"></g>

  <text x="112" y="214" text-anchor="end" class="sub">Internal</text>
  <text x="112" y="230" text-anchor="end" class="sub">carotid artery</text>
  <circle id="bp-r1" cx="130" cy="256" r="10" class="rcp"/>
  <text x="112" y="253" text-anchor="end" class="tag" style="fill:var(--rx)">Stretch</text>
  <text x="112" y="269" text-anchor="end" class="tag" style="fill:var(--rx)">receptor</text>
  <text x="26" y="392" class="sub">Aorta</text>
  <circle id="bp-r2" cx="300" cy="350" r="10" class="rcp"/>
  <text x="300" y="392" text-anchor="middle" class="tag" style="fill:var(--rx)">Stretch receptor</text>
  <path id="bp-aff1" class="nerve n-aff" d="M142 256 C 186 256, 200 230, 202 196" marker-end="url(#ar-aff)"/>
  <path id="bp-aff2" class="nerve n-aff" d="M306 340 C 300 280, 292 236, 290 196" marker-end="url(#ar-aff)"/>

  <path id="bp-sym" class="nerve n-sym" d="M540 182 C 540 250, 600 272, 606 324" marker-end="url(#ar-sym)"/>
  <text x="526" y="222" text-anchor="end" class="tag" style="fill:var(--symp)">Sympathetic</text>
  <text x="526" y="238" text-anchor="end" class="tag" style="fill:var(--symp)">adrenergic neurons</text>
  <text x="526" y="256" text-anchor="end" class="sub">Activity:</text>
  <text x="526" y="272" text-anchor="end" class="sub" id="bp-symTxt" style="fill:var(--ink)">Normal</text>
  <text x="580" y="392" text-anchor="middle" class="sub">Peripheral blood vessels</text>
  <g class="fx"></g>
</svg>`;
function bpDraw(){
  const r=$('#svg-bp');if(!r)return;
  const vw=24+BP.bp*3;
  ['ica','ao'].forEach(v=>{r.querySelector(`#bp-${v}-w`).setAttribute('stroke-width',vw);r.querySelector(`#bp-${v}-l`).setAttribute('stroke-width',vw-9);});
  const aw=clamp(28-BP.res*4,14,42);
  r.querySelector('#bp-art-w').setAttribute('stroke-width',aw);r.querySelector('#bp-art-l').setAttribute('stroke-width',Math.max(4,aw-9));
  const on=BP.s>.5,op=on?clamp(.35+BP.s*.22,0,1):1;
  r.querySelector('#bp-bands').innerHTML=[492,537,582,627,664].map(x=>`<rect class="band${on?' on':''}" style="opacity:${op}" x="${x}" y="${350-aw/2-8}" width="20" height="8" rx="3"/><rect class="band${on?' on':''}" style="opacity:${op}" x="${x}" y="${350+aw/2}" width="20" height="8" rx="3"/>`).join('');
  const bv=clamp(BP.bp,-3,3),bi=Math.min(5,Math.floor(bv+3)),bc=mix(BRAIN_COL[bi],BRAIN_COL[bi+1],bv+3-bi);
  $$('#bp-key rect',r).forEach((e,j)=>e.classList.toggle('cur',j===Math.round(bv)+3));
  $$('#bp-brainG .brn',r).forEach(e=>e.style.fill=bc);
  const fl=Math.round(BP.bp),bt=r.querySelector('#bp-brainTxt');
  bt.textContent=lvTxt(LV.flow,BP.bp);bt.style.fill=fl===0?'var(--ok)':'var(--bad)';
  ['#bp-sym'].forEach(q=>{const sym=r.querySelector(q);sym.classList.toggle('on',BP.s>.5);sym.classList.toggle('inh',BP.s<-.5);});
  r.querySelector('#bp-symTxt').textContent=lvTxt(LV.s,BP.s);
  $$('#bp-meters .meter').forEach(m=>{
    const k=m.dataset.m,v=k==='flow'?BP.bp:BP[k],i=Math.round(clamp(v,-3,3))+3;
    const warn=(k==='bp'||k==='flow')&&i!==3;
    $$('.cell',m).forEach((c,j)=>{c.classList.toggle('on',j===i);c.classList.toggle('warn',j===i&&warn);c.classList.toggle('chg',j===i&&!warn&&i!==3);});
    const val=$('.m-val',m);val.textContent=lvTxt(LV[k],v);val.className='m-val'+(warn?' warn':i!==3?' chg':' ok');
  });
}
/* continuous blood flow and tonic sympathetic firing */
let flowT=0,lastT=0,tonicAcc=0;
const AO=Array.from({length:16},(_,i)=>i/16),ICA=Array.from({length:7},(_,i)=>i/7);
const PERIOD={'-3':0,'-2':3.2,'-1':2,'0':1.1,'1':.65,'2':.42,'3':.26};
function loop(t){
  const dt=lastT?Math.min(.05,(t-lastT)/1000):0;lastT=t;
  const r=$('#svg-bp');
  if(tab==='bp'&&r&&!reduce){
    flowT+=dt*(.04+(BP.bp+3)/6*.22)/speed;
    let h='';
    AO.forEach(p=>{const k=(p+flowT)%1,x=20+k*668;h+=`<circle class="flow" cx="${x}" cy="350" r="3.2"/>`;});
    ICA.forEach(p=>{const k=(p+flowT*1.3)%1,y=350-k*214;h+=`<circle class="flow" cx="130" cy="${y}" r="3.2"/>`;});
    r.querySelector('#bp-flow').innerHTML=h;
    const per=PERIOD[String(Math.round(clamp(BP.s,-3,3)))];
    if(per){tonicAcc+=dt;if(tonicAcc>per*speed){tonicAcc=0;spawn(r,r.querySelector('#bp-sym'),900);}}
  }
  requestAnimationFrame(loop);
}
const STEP_BP_CNS={t:'The information reaches the CNS.',src:'p. 133',run:async()=>{const b=$('#bp-cnsBox');await pulses($('#svg-bp'),['bp-aff1','bp-aff2'],3,900);b.classList.add('lit');await wait(1300);b.classList.remove('lit');}};
const BP_PRED={
  low:{q:'Blood pressure has dropped below normal. What will the sympathetic adrenergic neurons do?',opts:['Increase their activity','Be inhibited','Stay the same'],a:0,why:'When the stretch receptors detect a drop in pressure, an increase in activity of sympathetic adrenergic neurons produces peripheral vasoconstriction and increased vascular resistance, raising blood pressure and restoring blood flow to the brain.',src:'p. 133'},
  high:{q:'Blood pressure has risen above normal. What happens to the sympathetic adrenergic vasoconstrictor nerves?',opts:['They are inhibited','They increase their activity','Nothing changes'],a:0,why:'If blood pressure rises above normal limits, sympathetic adrenergic vasoconstrictor nerves are inhibited and blood pressure falls back to within normal limits.',src:'p. 133'}
};
function bpScen(L){
  const lo=L<0,n=Math.abs(L);
  const up=['','slightly','moderately','greatly'][n],inh=['','slightly','moderately','strongly'][n];
  const g=(f,a,b,d)=>tween(d,k=>{BP[f]=lerp(a,b,k);bpDraw();});
  return {predictKey:lo?'bp-low':'bp-high',predict:lo?BP_PRED.low:BP_PRED.high,steps:[
    {t:`Blood pressure ${lo?'falls':'rises'} to ${LV.bp[L+3].toLowerCase()}, and blood flow to the brain is ${LV.flow[L+3].toLowerCase()}.`,src:'p. 133',run:()=>g('bp',0,L,1300)},
    {t:`Stretch receptors in the internal carotid artery and the aorta detect the ${lo?'drop':'rise'}.`,src:'p. 133',run:()=>ping($('#svg-bp'),['bp-r1','bp-r2'])},
    STEP_BP_CNS,
    lo?{t:`Activity of the sympathetic adrenergic neurons increases ${up}.`,src:'p. 133',run:async()=>{await g('s',0,n,900);await pulses($('#svg-bp'),['bp-sym'],2+n,800,200);}}
      :{t:`The sympathetic adrenergic vasoconstrictor nerves are ${inh} inhibited.`,src:'p. 133',run:async()=>{await g('s',0,-n,900);await wait(900);}},
    lo?{t:`Peripheral vasoconstriction increases vascular resistance ${up} (α₁ receptors on arterioles).`,src:'p. 133; Table 13.1, p. 132',run:()=>g('res',0,n,1400)}
      :{t:`With less vasoconstrictor activity, vascular resistance decreases ${up}.`,src:'p. 133',run:()=>g('res',0,-n,1400)},
    {t:`Blood pressure ${lo?'rises':'falls'} back to within normal limits, and blood flow to the brain is sufficient again.`,src:'p. 133',run:()=>g('bp',L,0,1700)}
  ]};
}

/* ================= 2. Pupillary light reflex (p. 134) ================= */
/* Front view of the iris: pupil radius 44 is normal, 20 is miosis, 72 is mydriasis */
const PU={ph:44,light:false,dim:false,para:false,sym:false};
const PCX=215,PCY=228;
const puSVG=`<svg viewBox="0 0 700 470" role="img" aria-label="Pupillary light reflex diagram">${MARKERS}
  <rect id="pu-amb" x="0" y="44" width="370" height="426" rx="14" style="fill:var(--brightbg);transition:fill .6s"/>
  <text x="14" y="460" class="tag" id="pu-ambTxt" style="fill:var(--muted)">Ambient light: Normal</text>

  <text x="10" y="18" class="tag" id="pu-sphLbl">Circular Sphincter muscle</text>
  <text x="10" y="35" class="tag" id="pu-sphSt"></text>
  <text x="270" y="18" class="tag" id="pu-radLbl">Radial Dilator muscle</text>
  <text x="270" y="35" class="tag" id="pu-radSt"></text>

  <circle cx="${PCX}" cy="${PCY}" r="148" style="fill:var(--sclera);stroke:var(--line);stroke-width:2"/>
  <circle cx="${PCX}" cy="${PCY}" r="120" style="fill:var(--iris)"/>
  <g id="pu-rad"></g>
  <g id="pu-sphRings"></g>
  <circle id="pu-pupil" cx="${PCX}" cy="${PCY}" r="44" style="fill:#0b0f18"/>
  <text id="pu-pLbl" x="${PCX}" y="${PCY+5}" text-anchor="middle" class="tag" style="fill:#fff">Pupil</text>
  <g id="pu-circ"></g>
  <line id="pu-sphLead" x1="80" y1="42" x2="150" y2="160" style="stroke:var(--muted);stroke-width:1.5"/>
  <line id="pu-radLead" x1="320" y1="42" x2="270" y2="148" style="stroke:var(--muted);stroke-width:1.5"/>
  <circle id="pu-sphDot" r="3.5" style="fill:var(--ink)"/><circle id="pu-radDot" r="3.5" style="fill:var(--ink)"/>
  <g id="pu-out" style="opacity:0;transition:opacity .4s">
    ${[0,90,180,270].map(a=>{const c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);return `<line class="nerve n-sym" x1="${PCX+124*c}" y1="${PCY+124*s}" x2="${PCX+144*c}" y2="${PCY+144*s}" marker-end="url(#ar-sym)"/>`;}).join('')}
  </g>
  <polygon id="pu-beam" points="" style="fill:#ffe27a;opacity:0;transition:opacity .4s;mix-blend-mode:screen"/>
  <g id="pu-flash" style="opacity:.35;transition:opacity .4s">
    <rect x="8" y="${PCY-13}" width="30" height="26" rx="4" style="fill:var(--muted)"/>
    <rect x="38" y="${PCY-21}" width="11" height="42" rx="3" style="fill:var(--ink)"/>
  </g>
  <text x="8" y="${PCY+40}" class="sub">Flashlight</text>
  <text x="${PCX}" y="406" text-anchor="middle" class="lbl" id="pu-cond" style="font-size:19px">Normal light</text>
  <text x="${PCX}" y="436" text-anchor="middle" class="lbl" id="pu-state" style="font-size:24px;font-weight:800"></text>

  <rect id="pu-ret" x="432" y="40" width="156" height="62" rx="12" class="box" style="transform-box:fill-box;transform-origin:center"/>
  <text x="510" y="65" text-anchor="middle" class="lbl" style="fill:var(--tx);font-size:16px">Retina</text>
  <text x="510" y="88" text-anchor="middle" class="sub" style="font-size:15px;fill:var(--ink)">Photoreceptors</text>
  <path id="pu-light" d="M${PCX+30} ${PCY-20} C 300 120, 380 72, 436 70" style="fill:none;stroke:#e9b200;stroke-width:2.5;stroke-dasharray:4 5;opacity:0;transition:opacity .4s" marker-end="url(#ar-sym)"/>
  <path id="pu-optic" class="nerve n-aff" d="M588 84 C 640 90, 650 104, 650 116" marker-end="url(#ar-aff)"/>
  <text x="606" y="114" text-anchor="end" class="sub" style="font-size:13.5px;fill:var(--ink)">Optic nerve (CN 2)</text>
  <rect x="520" y="122" width="176" height="128" rx="14" class="box" id="pu-bs"/>
  <text x="608" y="144" text-anchor="middle" class="lbl" style="font-size:17px">Brainstem</text>
  <text x="608" y="168" text-anchor="middle" class="sub" style="font-size:14px;fill:var(--ink)">Pretectal nuclei</text>
  <path id="pu-int" class="nerve n-cns" d="M608 174 L 608 196" marker-end="url(#ar-cns)"/>
  <text x="608" y="216" text-anchor="middle" class="sub" style="font-size:14px;fill:var(--ink)">Edinger–Westphal</text>
  <text x="608" y="234" text-anchor="middle" class="sub" style="font-size:14px;fill:var(--ink)">nucleus (midbrain)</text>
  <path id="pu-para" class="nerve n-para" d="M520 228 C 480 232, 450 244, 418 252" marker-end="url(#ar-para)"/>
  <circle id="pu-cg" cx="404" cy="255" r="12" style="fill:var(--para-soft);stroke:var(--para);stroke-width:2.5;transform-box:fill-box;transform-origin:center"/>
  <text x="382" y="288" class="tag" style="fill:var(--para);font-size:13.5px">Ciliary ganglion</text>
  <text x="382" y="304" class="sub" style="font-size:12.5px">Just behind the eye</text>
  <path id="pu-post" class="nerve n-para" d="" marker-end="url(#ar-para)"/>
  <text x="452" y="212" text-anchor="middle" class="sub" style="font-size:13px;fill:var(--para)">Oculomotor nerve</text>
  <text x="452" y="227" text-anchor="middle" class="sub" style="font-size:13px;fill:var(--para)">(CN 3)</text>
  <text x="446" y="160" text-anchor="middle" class="tag" style="fill:var(--para);font-size:13px">Parasympathetic</text>
  <text x="446" y="177" text-anchor="middle" class="tag" style="fill:var(--para);font-size:13px">cholinergic neurons</text>

  <rect x="504" y="314" width="192" height="128" rx="14" class="box" id="pu-symBox" style="transform-box:fill-box;transform-origin:center"/>
  <text x="600" y="336" text-anchor="middle" class="lbl" style="fill:var(--symp);font-size:15px">Sympathetic</text>
  <text x="600" y="354" text-anchor="middle" class="tag" style="fill:var(--symp);font-size:13.5px">preganglionic neurons</text>
  <text x="600" y="378" text-anchor="middle" class="sub" style="font-size:14px;fill:var(--ink)">Thoracic spinal cord</text>
  <text x="600" y="396" text-anchor="middle" class="sub" style="font-size:14px;fill:var(--ink)">(First 2–4 segments)</text>
  <text x="600" y="422" text-anchor="middle" class="sub" style="font-size:13.5px;fill:var(--symp)">Via vagosympathetic trunk</text>
  <path id="pu-vst" class="nerve n-sym" d="M504 404 L 462 404" marker-end="url(#ar-sym)"/>
  <circle id="pu-scg" cx="446" cy="404" r="12" style="fill:var(--symp-soft);stroke:var(--symp);stroke-width:2.5;transform-box:fill-box;transform-origin:center"/>
  <text x="502" y="442" text-anchor="end" class="tag" style="fill:var(--symp);font-size:13px">Cranial (superior)</text>
  <text x="502" y="458" text-anchor="end" class="tag" style="fill:var(--symp);font-size:13px">Cervical ganglion</text>
  <path id="pu-sym" class="nerve n-sym" d="M434 400 C 390 392, 330 348, 296 304" marker-end="url(#ar-sym)"/>
  <g class="fx"></g>
</svg>`;
function puDraw(){
  const r=$('#svg-pu');if(!r)return;
  const pr=PU.ph,band=pr+22,deg=Math.PI/180;
  r.querySelector('#pu-pupil').setAttribute('r',pr);
  const pl=r.querySelector('#pu-pLbl');pl.style.opacity=pr>=36?1:0;
  // circular sphincter: concentric rings just outside the pupil
  let rings='';for(let i=0;i<5;i++){rings+=`<circle cx="${PCX}" cy="${PCY}" r="${pr+3+i*4.2}" class="musc sph${PU.para?' on':''}"/>`;}
  r.querySelector('#pu-sphRings').innerHTML=rings;
  // radial dilator: spokes from the sphincter band to the edge of the iris
  let rad='';for(let i=0;i<40;i++){const a=i/40*Math.PI*2,c=Math.cos(a),s=Math.sin(a);rad+=`<line class="musc rad${PU.sym?' on':''}" x1="${PCX+(band+3)*c}" y1="${PCY+(band+3)*s}" x2="${PCX+117*c}" y2="${PCY+117*s}"/>`;}
  r.querySelector('#pu-rad').innerHTML=rad;
  // curved arrows around the sphincter while it contracts
  const ar=band+7;
  r.querySelector('#pu-circ').innerHTML=PU.para?[20,140,260].map(a0=>{const a1=a0+70,p=a=>[PCX+ar*Math.cos(a*deg),PCY+ar*Math.sin(a*deg)];const[x0,y0]=p(a0),[x1,y1]=p(a1);return `<path class="nerve n-para" d="M${x0} ${y0} A ${ar} ${ar} 0 0 1 ${x1} ${y1}" marker-end="url(#ar-para)" style="stroke-width:4;stroke:#e8f7ee"/><path class="nerve n-para" d="M${x0} ${y0} A ${ar} ${ar} 0 0 1 ${x1} ${y1}" marker-end="url(#ar-para)" style="stroke-width:2.5"/>`;}).join(''):'';
  r.querySelector('#pu-out').style.opacity=PU.sym?1:0;
  // leader lines follow the muscles
  const sp=[PCX-(pr+11)*Math.cos(45*deg),PCY-(pr+11)*Math.sin(45*deg)];
  const sl=r.querySelector('#pu-sphLead');sl.setAttribute('x2',sp[0]);sl.setAttribute('y2',sp[1]);const sd=r.querySelector('#pu-sphDot');sd.setAttribute('cx',sp[0]);sd.setAttribute('cy',sp[1]);
  const rp=[PCX+(band+117)/2*Math.cos(-60*deg),PCY+(band+117)/2*Math.sin(-60*deg)];
  const rl=r.querySelector('#pu-radLead');rl.setAttribute('x2',rp[0]);rl.setAttribute('y2',rp[1]);const rd=r.querySelector('#pu-radDot');rd.setAttribute('cx',rp[0]);rd.setAttribute('cy',rp[1]);
  const sL=r.querySelector('#pu-sphLbl'),rL=r.querySelector('#pu-radLbl');
  const sS=r.querySelector('#pu-sphSt'),rS=r.querySelector('#pu-radSt');
  sS.textContent=PU.para?'Contracts':PU.sym?'Relaxes':'';rS.textContent=PU.sym?'Contracts':PU.para?'Relaxes':'';
  sS.style.fill=PU.para?'var(--para)':'var(--muted)';rS.style.fill=PU.sym?'var(--symp)':'var(--muted)';
  sL.style.fill=PU.para?'var(--para)':'var(--ink)';rL.style.fill=PU.sym?'var(--symp)':'var(--ink)';
  // parasympathetic path ends on the sphincter band
  const ex=PCX+(pr+11)*Math.cos(25*deg),ey=PCY+(pr+11)*Math.sin(25*deg);
  r.querySelector('#pu-post').setAttribute('d',`M392 257 C 350 262, ${ex+40} ${ey+2}, ${ex+3} ${ey+1}`);
  r.querySelector('#pu-para').classList.toggle('on',PU.para);r.querySelector('#pu-post').classList.toggle('on',PU.para);
  r.querySelector('#pu-sym').classList.toggle('on',PU.sym);r.querySelector('#pu-vst').classList.toggle('on',PU.sym);
  // flashlight beam onto the pupil
  r.querySelector('#pu-beam').setAttribute('points',`49,${PCY-18} ${PCX-pr},${PCY-pr*.7} ${PCX-pr},${PCY+pr*.7} 49,${PCY+18}`);
  r.querySelector('#pu-beam').style.opacity=PU.light?.5:0;
  r.querySelector('#pu-light').style.opacity=PU.light?1:0;
  r.querySelector('#pu-flash').style.opacity=PU.light?1:.35;
  r.querySelector('#pu-amb').style.fill=PU.dim?'var(--dimbg)':'var(--brightbg)';
  const at=r.querySelector('#pu-ambTxt');at.textContent='Ambient light: '+(PU.dim?'Low':PU.light?'Bright':'Normal');at.style.fill=PU.dim?'#cfd6e4':'var(--muted)';
  const cond=r.querySelector('#pu-cond');cond.textContent=PU.dim?'Dim light':PU.light?'Bright light':'Normal light';cond.style.fill=PU.dim?'#e7ecf5':'var(--ink)';
  const st=r.querySelector('#pu-state');st.textContent=pr<30?'Miosis':pr>60?'Mydriasis':'';st.style.fill=pr<30?'var(--para)':'var(--symp)';
}

/* ================= 3. Micturition (pp. 134–135, Fig. 13.5) ================= */
const MI0={fill:.06,sym:false,para:false,paraInh:false,som:false,intS:'',extS:'',det:'',pag:false,pmc:false,fore:false,full:false,decided:false,jInh:false,jExc:false,hl:''};
const MI={...MI0};
const BLADDER='M520 210 C 610 210, 642 280, 626 340 C 612 388, 572 412, 542 424 L 498 424 C 468 412, 428 388, 414 340 C 398 280, 430 210, 520 210 Z';
const miLegend=`<div class="mi-legend">
  <span class="lg-head" style="color:var(--tx)">Afferent:</span>
  <span><i class="lg dash" style="border-color:var(--tx)"></i>Visceral afferents</span>
  <span class="lg-sep"></span>
  <span class="lg-head">Efferent:</span>
  <span><i class="lg" style="border-color:var(--symp)"></i>Sympathetic (lumbar)</span>
  <span><i class="lg" style="border-color:var(--para)"></i>Parasympathetic (sacral)</span>
  <span><i class="lg" style="border-color:var(--soma)"></i>Somatic (sacral)</span>
  <span class="lg-sep"></span>
  <span class="lg-head" style="color:var(--muted)">Within CNS:</span>
  <span><i class="lg dash" style="border-color:var(--muted)"></i>Descending control</span>
  <span><i class="jdot" style="background:var(--bad)"></i>Inhibited</span>
  <span><i class="jdot" style="background:var(--para)"></i>Excited</span>
</div>`;
const miSVG=`<svg viewBox="0 0 720 560" role="img" aria-label="Micturition reflex diagram">${MARKERS}
  <defs><clipPath id="mi-clip"><path d="${BLADDER}"/></clipPath></defs>
  <text x="710" y="26" text-anchor="end" class="lbl" id="mi-phase" style="font-size:20px"></text>

  <!-- Brain: forebrain, midbrain, pons, then spinal cord -->
  <g transform="translate(15,6)">
    <path id="mi-fore" class="brn mbrn" d="M80 72 C 66 44, 90 14, 130 12 C 158 2, 200 4, 226 18 C 256 30, 272 54, 262 80 C 256 94, 236 98, 218 94 C 200 104, 168 108, 146 102 C 116 108, 88 96, 80 72 Z"/>
    <path class="gyr" d="M98 56 C 112 44, 126 60, 142 48"/><path class="gyr" d="M120 24 C 128 34, 118 44, 128 56"/>
    <path class="gyr" d="M150 22 C 166 14, 182 30, 200 20"/><path class="gyr" d="M206 30 C 214 42, 204 50, 216 62"/>
    <path class="gyr" d="M96 82 C 114 72, 134 88, 156 76"/><path class="gyr" d="M160 50 C 178 40, 196 56, 222 46"/>
    <path class="gyr" d="M230 32 C 246 42, 240 56, 254 66"/>
  </g>
  <text x="183" y="62" text-anchor="middle" class="lbl halo" style="font-size:16px">Forebrain</text>
  <text x="300" y="44" class="sub" style="fill:var(--ink)">Perceives bladder fullness;</text>
  <text x="300" y="62" class="sub" style="fill:var(--ink)">cognitive, regulatory and</text>
  <text x="300" y="80" class="sub" style="fill:var(--ink)">emotional areas</text>

  <rect id="mi-pag" class="brn mbrn" x="154" y="114" width="60" height="58" rx="6"/>
  <rect id="mi-pmc" class="brn mbrn" x="142" y="172" width="84" height="58" rx="24"/>
  <path class="brn mbrn" d="M156 228 L 212 228 L 210 266 L 160 266 Z"/>
  <line x1="120" y1="114" x2="248" y2="114" class="demarc"/>
  <line x1="120" y1="172" x2="248" y2="172" class="demarc"/>
  <text x="184" y="148" text-anchor="middle" class="tag halo" style="font-size:14px">PAG</text>
  <text x="184" y="206" text-anchor="middle" class="tag halo" style="font-size:14px">PMC</text>
  <text x="150" y="140" text-anchor="end" class="lbl" style="font-size:15px">Midbrain</text>
  <text x="150" y="157" text-anchor="end" class="sub">Periaqueductal gray</text>
  <text x="140" y="198" text-anchor="end" class="lbl" style="font-size:15px">Pons</text>
  <text x="140" y="215" text-anchor="end" class="sub">Pontine micturition</text>
  <text x="140" y="230" text-anchor="end" class="sub">center</text>

  <rect x="160" y="262" width="50" height="282" rx="22" style="fill:#f1d9c4;stroke:#9b5a55;stroke-width:1.6"/>
  <rect x="160" y="322" width="50" height="88" style="fill:var(--symp);opacity:.28"/>
  <rect x="160" y="410" width="50" height="94" style="fill:var(--para);opacity:.22"/>
  <line x1="160" y1="410" x2="210" y2="410" style="stroke:#9b5a55;stroke-width:1.5"/>
  <text x="156" y="300" text-anchor="end" class="sub">Spinal cord</text>
  <text x="156" y="366" text-anchor="end" class="lbl" style="font-size:15px">Lumbar</text>
  <text x="156" y="414" text-anchor="end" class="sub" style="font-size:12.5px;fill:var(--tx)">Lumbosacral ▸</text>
  <text x="156" y="462" text-anchor="end" class="lbl" style="font-size:15px">Sacral</text>

  <path id="mi-toFore" class="nerve n-aff" d="M164 114 L164 94" marker-end="url(#ar-aff)"/>
  <path id="mi-fromFore" class="nerve n-cns" d="M204 94 L204 114" marker-end="url(#ar-cns)"/>
  <path id="mi-toPmc" class="nerve n-cns" d="M184 156 L184 184" marker-end="url(#ar-cns)"/>
  <path id="mi-up" class="nerve n-aff" d="M214 410 L164 410 L164 122" marker-end="url(#ar-aff)"/>
  <path id="mi-down" class="nerve n-cns" d="M204 216 L204 494" style="stroke-dasharray:6 5"/>
  <g id="mi-junc">${[346,372,452,494].map((y,i)=>`<circle id="mi-j${i}" class="junc" cx="204" cy="${y}" r="5"/>`).join('')}</g>
  <rect id="mi-hlLumbar" class="hlbox" x="88" y="316" width="136" height="84" rx="8"/>

  <g id="mi-bl">
    <rect id="mi-urine" x="400" y="424" width="240" height="0" clip-path="url(#mi-clip)" style="fill:var(--urine);opacity:.85"/>
    <path id="mi-wall" class="wall" d="${BLADDER}"/>
  </g>
  <text x="520" y="196" text-anchor="middle" class="tag" style="font-size:14px" id="mi-fillTxt">Bladder filling: 6%</text>
  <text x="716" y="204" text-anchor="end" class="sub" style="fill:var(--ink)">Bladder wall:</text>
  <text x="716" y="221" text-anchor="end" class="sub" style="fill:var(--ink)">Detrusor muscle</text>
  <text x="716" y="238" text-anchor="end" class="sub">(Smooth muscle)</text>
  <text x="716" y="257" text-anchor="end" class="tag" style="font-size:13.5px" id="mi-detTxt"></text>
  <line x1="510" y1="424" x2="510" y2="552" style="stroke:var(--ink);stroke-width:1.5"/>
  <line x1="530" y1="424" x2="530" y2="552" style="stroke:var(--ink);stroke-width:1.5"/>
  <rect id="mi-stream" x="512" y="426" width="16" height="134" style="fill:var(--urine);opacity:0;transition:opacity .4s"/>
  <rect id="mi-int" x="496" y="426" width="48" height="14" rx="6" class="sph-r"/>
  <text x="556" y="436" class="sub" style="fill:var(--ink)">Internal sphincter</text>
  <text x="556" y="452" class="sub">(Smooth muscle)</text>
  <text x="556" y="469" class="tag" style="font-size:14px" id="mi-intTxt"></text>
  <rect id="mi-ext" x="490" y="490" width="60" height="16" rx="6" class="sph-e"/>
  <text x="560" y="497" class="sub" style="fill:var(--ink)">External sphincter</text>
  <text x="560" y="513" class="sub">Urethralis muscle</text>
  <text x="560" y="528" class="sub">(Skeletal muscle)</text>
  <text x="560" y="546" class="tag" style="font-size:14px" id="mi-extTxt"></text>

  <path id="mi-symW" class="nerve n-sym" d="M210 346 C 300 346, 360 302, 414 302" marker-end="url(#ar-sym)"/>
  <path id="mi-symS" class="nerve n-sym" d="M210 372 C 320 380, 420 446, 492 434" marker-end="url(#ar-sym)"/>
  <path id="mi-aff" class="nerve n-aff" d="M428 374 C 340 374, 268 410, 214 410" marker-end="url(#ar-aff)"/>
  <path id="mi-para" class="nerve n-para" d="M210 452 C 300 452, 380 410, 440 398" marker-end="url(#ar-para)"/>
  <path id="mi-som" class="nerve n-som" d="M210 494 C 320 498, 420 498, 486 498" marker-end="url(#ar-som)"/>
  <g class="fx"></g>
</svg>`;
function miDraw(){
  const r=$('#svg-mi');if(!r)return;
  const h=MI.fill*214;const u=r.querySelector('#mi-urine');u.setAttribute('y',424-h);u.setAttribute('height',h);
  r.querySelector('#mi-fillTxt').textContent=`Bladder filling: ${Math.round(MI.fill*100)}%`;
  const set=(id,cls,on)=>r.querySelector('#'+id).classList.toggle(cls,!!on);
  set('mi-symW','on',MI.sym);set('mi-symS','on',MI.sym);
  set('mi-para','on',MI.para);set('mi-para','inh',MI.paraInh);
  set('mi-som','on',MI.som);
  set('mi-symW','inh',MI.sym===null);set('mi-symS','inh',MI.sym===null);set('mi-som','inh',MI.som===null);
  const w=r.querySelector('#mi-wall');w.classList.toggle('contract',MI.det==='contract');w.classList.toggle('relaxed',MI.det==='relaxed');
  r.querySelector('#mi-detTxt').textContent=MI.det==='contract'?'Contracting':MI.det==='relaxed'?'Inhibited':'';
  r.querySelector('#mi-detTxt').style.fill=MI.det==='contract'?'var(--para)':'var(--symp)';
  ['int','ext'].forEach(k=>{const el=r.querySelector('#mi-'+k),v=MI[k+'S'];el.classList.toggle('closed',v==='closed');el.classList.toggle('open',v==='open');
    const t=r.querySelector(`#mi-${k}Txt`);t.textContent=v==='closed'?'Contracted':v==='open'?'Relaxed':'';t.style.fill=k==='int'?'var(--symp)':'var(--soma)';});
  set('mi-pag','lit',MI.pag);set('mi-pmc','lit',MI.pmc);set('mi-fore','lit',MI.fore);
  [0,1,3].forEach(i=>set('mi-j'+i,'inhib',MI.jInh));set('mi-j2','excit',MI.jExc);
  set('mi-hlLumbar','on',MI.hl==='lumbar');
  const ph=r.querySelector('#mi-phase');
  const voiding=MI.pmc||MI.det==='contract';
  ph.textContent=voiding?'Voiding phase':(MI.sym||MI.som||MI.intS==='closed')?'Storage phase':'';
  ph.style.fill=voiding?'var(--para)':'var(--symp)';
}


/* ================= Scene definitions ================= */
const SC={
 bp:{title:'Control of blood pressure',svgId:'svg-bp',svg:bpSVG,extra:bpMeters,draw:bpDraw,levels:true,
  about:`Keeping sufficient blood flow to the brain is among the body’s major priorities. Stretch receptors in the internal carotid artery and the aorta detect systemic blood pressure.${src('p. 133')} Choose a blood pressure below or above normal and watch the reflex bring it back.`,
  note:`<b>About the levels</b>The three levels on each side are for illustration only. They show the direction of each change, not its size.${src('p. 133')}`,
  reset(){Object.assign(BP,{bp:0,res:0,s:0});bpDraw();},
  buttons:[],scen:{}},
 pupil:{title:'Pupillary light reflex',svgId:'svg-pu',svg:puSVG,draw:puDraw,
  about:`The iris has two sets of smooth muscle fibres. Circular constrictor fibres around the pupil make it smaller when they contract; they are supplied by the parasympathetic system. Radial dilator fibres, like the spokes of a wheel, make it larger; they are supplied by the sympathetic system.${src('Ch. 14, p. 145')} When a flashlight is shined into an animal’s eye, a parasympathetic reflex makes the pupil smaller.${src('Ch. 13, p. 134; Ch. 14, p. 145')} In low ambient light, sympathetic control of the dilator smooth muscle of the iris enlarges the pupil.${src('p. 131')}`,
  note:`<b>Both pupils constrict</b>Many optic nerve axons cross at the optic chiasm, and many pretectal axons also cross the midline. So light shone into one eye constricts that pupil (direct reflex) and the other pupil too (indirect or consensual reflex).${src('Ch. 14, p. 145; Fig. 14.10, p. 146')}`,
  reset(){Object.assign(PU,{ph:44,light:false,dim:false,para:false,sym:false});puDraw();},
  buttons:[['light','Shine the flashlight'],['dim','Dim the lights']],
  scen:{
   light:{predict:{q:'A flashlight is shined into the eye. Which division makes the pupil smaller?',opts:['Parasympathetic','Sympathetic','Somatic'],a:0,why:'Parasympathetic cholinergic neurons stimulate the constrictor smooth muscle of the iris, so the pupillary diameter becomes smaller.',src:'Ch. 13, p. 134; Ch. 14, p. 145'},
    steps:[
     {t:'A flashlight is shined into the animal’s eye.',src:'Ch. 13, p. 134; Ch. 14, p. 145',run:async()=>{PU.light=true;puDraw();await wait(900);}},
     {t:'Light stimulates photoreceptors in the retina.',src:'Ch. 13, p. 134; Ch. 14, p. 145',run:()=>ping($('#svg-pu'),['pu-ret'])},
     {t:'Retinal ganglion cell action potentials travel along the optic nerve (CN 2) to the pretectal nuclei of the brainstem.',src:'Ch. 13, p. 134; Ch. 14, p. 145',run:()=>pulses($('#svg-pu'),['pu-optic'],3,1000)},
     {t:'Pretectal neurons synapse on the parasympathetic preganglionic neurons of the Edinger–Westphal nucleus in the midbrain.',src:'Ch. 13, p. 134; Ch. 14, p. 145',run:()=>pulses($('#svg-pu'),['pu-int'],3,700)},
     {t:'Their preganglionic axons travel in the oculomotor nerve (CN 3) to the ciliary ganglion, in the orbit just behind the eye.',src:'Ch. 14, p. 145; Fig. 14.10, p. 146',run:async()=>{PU.para=true;puDraw();await pulses($('#svg-pu'),['pu-para'],3,900);await gpulse($('#svg-pu'),['pu-cg']);}},
     {t:'Parasympathetic postganglionic neurons of the ciliary ganglion release acetylcholine onto the circular constrictor (Sphincter) muscle, which contracts.',src:'Ch. 13, p. 134; Table 13.1, p. 132; Ch. 14, p. 145',run:()=>pulses($('#svg-pu'),['pu-post'],3,900)},
     {t:'The pupil becomes smaller (miosis): the direct pupillary light reflex.',src:'Ch. 13, p. 134; Ch. 14, p. 145',run:()=>tween(1300,k=>{PU.ph=lerp(44,20,k);puDraw();})}
    ]},
   dim:{predict:{q:'The ambient light is low. What enlarges the pupil?',opts:['Sympathetic control of the dilator smooth muscle','Parasympathetic control of the constrictor smooth muscle','Somatic motor neurons to the iris'],a:0,why:'Sympathetic control of the dilator smooth muscle in the iris enlarges the pupil in low ambient light. When the radial dilator fibres contract, the pupil becomes larger.',src:'Ch. 13, p. 131; Ch. 14, p. 145'},
    steps:[
     {t:'The ambient light is low.',src:'Ch. 13, p. 131',run:async()=>{PU.dim=true;puDraw();await wait(1000);}},
     {t:'Sympathetic preganglionic neurons, which begin in the first thoracic segments of the spinal cord, are activated.',src:'Ch. 13, pp. 131, 136; Ch. 14, p. 145',run:async()=>{PU.sym=true;puDraw();await ping($('#svg-pu'),['pu-symBox']);}},
     {t:'Their axons course cranially in the vagosympathetic trunk and synapse in the cranial (superior) cervical ganglion of the neck.',src:'Ch. 13, p. 136; Ch. 14, p. 145',run:async()=>{await pulses($('#svg-pu'),['pu-vst'],3,800);await gpulse($('#svg-pu'),['pu-scg']);}},
     {t:'Postganglionic axons from this ganglion course to the eye and stimulate the radial Dilator muscle of the iris, through α₁ receptors.',src:'Ch. 13, p. 136; Table 13.1, p. 132; Ch. 14, p. 145',run:()=>pulses($('#svg-pu'),['pu-sym'],3,1100)},
     {t:'The radial Dilator muscle contracts, and the pupil enlarges (mydriasis).',src:'Ch. 13, p. 131; Table 13.1, p. 132; Ch. 14, p. 145',run:()=>tween(1300,k=>{PU.ph=lerp(44,72,k);puDraw();})}
    ]}
  }},
 mict:{title:'Micturition (urination)',svgId:'svg-mi',svg:miSVG,extra:miLegend,draw:miDraw,
  about:`Micturition is an interplay of autonomic reflexes and skeletal muscle control, with an element of voluntary regulation on top. Pelvic parasympathetic output contracts the bladder wall (detrusor); sympathetic output from the lumbar splanchnic nerves helps store urine.${src('p. 134')}`,
  note:``,
  reset(){Object.assign(MI,MI0);const s=$('#svg-mi');if(s)s.querySelector('#mi-stream').style.opacity=0;miDraw();},
  buttons:[['fill','Fill the bladder']],
  scen:{
   fill:{predict:{hl:'lumbar',q:'As the bladder begins to fill, what does the lumbar sympathetic output do to the detrusor muscle?',opts:['Inhibits its contraction','Makes it contract','Has no effect'],a:0,why:'Sympathetic output from the lumbar splanchnic nerves inhibits contraction of the detrusor muscle, directly and by inhibiting the parasympathetic neurons that induce bladder contraction. This facilitates urine storage.',src:'p. 134; Fig. 13.5A'},
    steps:[
     {t:'The bladder begins to fill with urine.',src:'p. 134; Fig. 13.5A',run:()=>tween(1400,k=>{MI.fill=lerp(.06,.4,k);miDraw();})},
     {t:'Visceral afferents from the bladder wall, neck and urethra carry distention information to the lumbosacral spinal cord.',src:'p. 134; Fig. 13.5A',run:()=>pulses($('#svg-mi'),['mi-aff'],3,1100)},
     {t:'This visceral afferent input excites the lumbar spinal cord sympathetic output (lumbar splanchnic nerves).',src:'p. 134; Fig. 13.5A',run:async()=>{MI.sym=true;miDraw();await pulses($('#svg-mi'),['mi-symW','mi-symS'],3,1000);}},
     {t:'The sympathetic output inhibits contraction of the bladder wall smooth muscle (detrusor muscle), directly and by inhibiting the parasympathetic neurons that induce bladder contraction.',src:'p. 134; Fig. 13.5A',run:async()=>{MI.det='relaxed';MI.paraInh=true;miDraw();await wait(1300);}},
     {t:'It also excites contraction of the smooth muscle internal sphincter at the neck of the bladder.',src:'p. 134; Fig. 13.5A',run:async()=>{MI.intS='closed';miDraw();await wait(1200);}},
     {t:'The visceral afferent input also excites the sacral spinal cord somatic output, which contracts the skeletal muscle external sphincter (urethralis muscle).',src:'p. 134; Fig. 13.5A',run:async()=>{MI.som=true;MI.extS='closed';miDraw();await pulses($('#svg-mi'),['mi-som'],3,1000);}},
     {t:'Together, these urine storage reflexes, primarily organized at the level of the spinal cord, store urine as the bladder fills.',src:'p. 134; Fig. 13.5A',run:()=>tween(1800,k=>{MI.fill=lerp(.4,.92,k);miDraw();})}
    ],after(){MI.full=true;}},
   void:{predict:{q:'The bladder is full and the situation is safe. Which output contracts the detrusor muscle?',opts:['Sacral parasympathetic (pelvic) output','Lumbar sympathetic output','Sacral somatic output'],a:0,why:'Autonomic efferent control of bladder emptying is principally achieved by pelvic parasympathetic output, which causes contraction of the bladder wall (detrusor muscle).',src:'p. 134; Fig. 13.5B'},
    steps:[
     {t:'The bladder is distended with urine. Distention information from the bladder wall, neck and urethra is sent from the spinal cord up to the periaqueductal gray (PAG) of the midbrain.',src:'p. 134; Fig. 13.5B',run:async()=>{await pulses($('#svg-mi'),['mi-aff'],2,900);MI.pag=true;miDraw();await pulses($('#svg-mi'),['mi-up'],3,1300);}},
     {t:'The PAG passes this information to forebrain regions that consciously perceive bladder fullness, and to forebrain regions involved in cognitive (e.g., prefrontal cortex), regulatory (e.g., hypothalamus) and emotional (e.g., amygdala) processes.',src:'pp. 134–135; Fig. 13.5B',run:async()=>{MI.fore=true;miDraw();await pulses($('#svg-mi'),['mi-toFore'],3,600);}},
     {t:'These forebrain areas send voluntary control-related information back to the PAG about the safety and social context: it is safe to void.',src:'p. 135; Fig. 13.5B',run:()=>pulses($('#svg-mi'),['mi-fromFore'],3,600)},
     {t:'The PAG integrates this with the distention signals. Bladder filling has reached a critical level, so the PAG excites the pontine micturition center (PMC) in the pons.',src:'pp. 134–135; Fig. 13.5B',run:async()=>{MI.pmc=true;miDraw();await pulses($('#svg-mi'),['mi-toPmc'],3,600);}},
     {t:'The PMC’s projections to the spinal cord inhibit the urine storage reflexes, relaxing the internal and external sphincters.',src:'p. 134; Fig. 13.5B',run:async()=>{await pulses($('#svg-mi'),['mi-down'],2,1300);MI.jInh=true;miDraw();await gpulse($('#svg-mi'),['mi-j0','mi-j1','mi-j3']);MI.sym=null;MI.som=null;MI.intS='open';MI.extS='open';MI.paraInh=false;MI.det='';miDraw();await wait(700);}},
     {t:'The PMC also excites the sacral spinal cord parasympathetic (pelvic) output, which contracts the bladder wall smooth muscle (detrusor muscle).',src:'p. 134; Fig. 13.5B',run:async()=>{MI.jExc=true;miDraw();await gpulse($('#svg-mi'),['mi-j2']);MI.para=true;MI.det='contract';miDraw();await pulses($('#svg-mi'),['mi-para'],3,1000);}},
     {t:'The voiding reflexes empty the bladder.',src:'p. 135',run:async()=>{const s=$('#svg-mi #mi-stream');s.style.opacity=.85;await tween(2200,k=>{MI.fill=lerp(.92,.04,k);miDraw();});s.style.opacity=0;}}
    ],after(){Object.assign(MI,{...MI0,fill:.04});miDraw();}},
   hold:{steps:[
     {t:'The bladder is distended with urine. Distention information from the bladder wall, neck and urethra is sent from the spinal cord up to the periaqueductal gray (PAG) of the midbrain.',src:'p. 134; Fig. 13.5B',run:async()=>{await pulses($('#svg-mi'),['mi-aff'],2,900);MI.pag=true;miDraw();await pulses($('#svg-mi'),['mi-up'],3,1300);}},
     {t:'The PAG passes this information to forebrain regions that consciously perceive bladder fullness, and to forebrain regions involved in cognitive (e.g., prefrontal cortex), regulatory (e.g., hypothalamus) and emotional (e.g., amygdala) processes.',src:'pp. 134–135; Fig. 13.5B',run:async()=>{MI.fore=true;miDraw();await pulses($('#svg-mi'),['mi-toFore'],3,600);}},
     {t:'These forebrain areas send voluntary control-related information back to the PAG: survival or social conditions are not favorable.',src:'pp. 134–135; Fig. 13.5B',run:()=>pulses($('#svg-mi'),['mi-fromFore'],3,600)},
     {t:'The PAG does not activate the PMC, so the urine storage reflexes continue and urine is held.',src:'pp. 134–135',run:async()=>{MI.pag=false;MI.fore=false;miDraw();await wait(1400);}}
    ],after(){MI.full=true;}}
  }}
};

/* ================= UI ================= */
const asked={},lastOrder={};
const narrow=()=>matchMedia('(max-width:1060px)').matches;
function sceneHTML(id){
  const S=SC[id];
  return `<section class="scene" id="scene-${id}" ${id===tab?'':'hidden'}>
    <div class="stage">
      <div id="${S.svgId}-wrap">${S.svg.replace('<svg ',`<svg id="${S.svgId}" `)}</div>
      ${S.extra||''}
      <div class="caprow"><div class="caption" id="cap-${id}" aria-live="polite"></div><div class="watch-slot" id="watch-${id}"></div></div>
      <div class="controls" id="ctl-${id}"></div>
      <div class="pred-stage" id="predStage-${id}"></div>
    </div>
    <aside class="panel">
      <h2>${S.title}</h2>
      <p>${S.about}</p>
      <div class="pred-panel" id="predPanel-${id}"><div id="pred-${id}" aria-live="polite"></div></div>
      <div class="note">${S.note}</div>
    </aside>
    <aside class="panel steps-panel" aria-label="Steps">
      <h2>Steps</h2>
      <ol class="steps" id="steps-${id}"><li class="empty">Choose what to do under the diagram to see each step here.</li></ol>
    </aside>
  </section>`;
}
function placePreds(){
  Object.keys(SC).forEach(id=>{
    const node=$('#pred-'+id),target=narrow()?$('#predStage-'+id):$('#predPanel-'+id);
    if(node.parentElement!==target)target.appendChild(node);
  });
}
const where=()=>narrow()?'below':'on the right';
function idleCaption(id){
  return id==='bp'?'Choose a blood pressure below or above normal. Make a prediction, then watch the reflex.':'Choose what to do below. Make a prediction, then watch the reflex.';
}
function controls(id){
  const S=SC[id],c=$('#ctl-'+id);
  if(S.levels){
    const btn=L=>`<button type="button" class="btn lvl ${L<0?'lo':'hi'}" data-level="${L}" ${busy?'disabled':''}>${LV.bp[L+3]}</button>`;
    c.innerHTML=`<div class="lv-wrap"><div class="lv-scale"><span>◀ Below normal</span><span>Above normal ▶</span></div><div class="lv-row">${[-3,-2,-1,1,2,3].map(btn).join('')}</div></div>
      <div class="lv-row"><button type="button" class="btn" data-reset>Back to normal</button></div>`;
    return;
  }
  let b=S.buttons.map(([k,l])=>{
    let dis=busy;
    if(id==='mict')dis=busy||MI.full;
    return `<button type="button" class="btn primary" data-go="${k}" ${dis?'disabled':''}>${l}</button>`;}).join('');
  b+=`<button type="button" class="btn" data-reset>Reset</button>`;
  c.innerHTML=b;
  if(id==='mict'&&MI.full&&!busy){
    $('#pred-mict').innerHTML=`<div class="pred"><h3>The bladder is distended with urine</h3><p>Is it safe and socially appropriate for the animal to void?</p>
      <div class="opts"><button type="button" class="opt" data-go="void">Yes, it is safe to void</button><button type="button" class="opt" data-go="hold">No, conditions are not favorable</button></div></div>`;
  }
}
function renderSteps(id,steps,cur){
  $('#steps-'+id).innerHTML=steps.map((s,i)=>`<li class="${i<cur?'done':i===cur?'now':''}">${s.t}${src(s.src)}</li>`).join('');
}
function ask(id,key){
  const sc=SC[id].scen[key],pk=sc.predictKey||id+key;
  $('#watch-'+id).innerHTML='';
  if(!sc.predict){$('#pred-'+id).innerHTML='';return run(id,key);}
  const p=sc.predict;
  let order;const prev=lastOrder[pk];
  do{order=[...p.opts.keys()];for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}}while(order.length>1&&prev&&order.join()===prev);
  lastOrder[pk]=order.join();
  if(id==='mict'){MI.hl=p.hl||'';miDraw();}
  $('#pred-'+id).innerHTML=`<div class="pred"><h3>Predict first</h3><p>${p.q}</p><div class="opts">${order.map(i=>`<button type="button" class="opt" data-ans="${i}" data-key="${key}">${p.opts[i]}</button>`).join('')}</div></div>`;
  $('#cap-'+id).textContent=`Choose your prediction ${where()}.`;
  const first=$('#pred-'+id+' .opt');if(first)first.focus({preventScroll:true});
  if(!narrow())$('#scene-'+id+' .panel').scrollTop=0;
}
function answer(id,key,i){
  const sc=SC[id].scen[key],p=sc.predict;asked[sc.predictKey||id+key]=true;
  const box=$('#pred-'+id+' .pred');
  $$('.opt',box).forEach(b=>{const j=+b.dataset.ans;b.disabled=true;if(j===p.a)b.classList.add('ok');else if(j===i)b.classList.add('bad');});
  box.insertAdjacentHTML('beforeend',`<div class="explain"><b>${i===p.a?'Correct.':'Not quite.'}</b> ${p.why}${src(p.src)}</div>`);
  $('#watch-'+id).innerHTML=`<button type="button" class="btn primary watch" data-watch="${key}">Watch it happen</button>`;
  $('#cap-'+id).textContent='Now press Watch it happen.';
  $('#watch-'+id+' [data-watch]').focus({preventScroll:true});
}
async function run(id,key){
  const S=SC[id],sc=S.scen[key];
  if(id==='mict'){MI.hl='';miDraw();}
  busy=true;controls(id);
  const my=++runTok;
  if(id==='bp'||id==='pupil')S.reset();
  for(let i=0;i<sc.steps.length;i++){
    if(my!==runTok)return;
    renderSteps(id,sc.steps,i);$('#cap-'+id).textContent=sc.steps[i].t;
    await sc.steps[i].run();
    if(my!==runTok)return;
    await wait(650);
  }
  if(my!==runTok)return;
  renderSteps(id,sc.steps,sc.steps.length);
  busy=false;if(sc.after)sc.after();
  $('#cap-'+id).textContent=id==='mict'&&MI.full?`The bladder is full. Decide what happens next ${where()}.`:id==='bp'?'Done. Try another level, or go back to normal.':'Done. Try the other scenario, or press Reset.';
  controls(id);
}
function resetScene(id){
  runTok++;busy=false;SC[id].reset();
  Object.keys(asked).forEach(k=>{if(k.startsWith(id))delete asked[k];});
  $$('#'+SC[id].svgId+' .fx circle').forEach(c=>c.remove());
  $('#pred-'+id).innerHTML='';$('#watch-'+id).innerHTML='';$('#cap-'+id).textContent=idleCaption(id);
  $('#steps-'+id).innerHTML='<li class="empty">Choose what to do under the diagram to see each step here.</li>';
  controls(id);
}
function setTab(t){
  if(t===tab)return;
  if(SC[tab])resetScene(tab);else runTok++;
  tab=t;
  $$('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  Object.keys(SC).forEach(k=>$('#scene-'+k).hidden=k!==t);
  $('#scene-quiz').hidden=t!=='quiz';
  if(SC[t])resetScene(t);
}

$('#main').insertAdjacentHTML('afterbegin',Object.keys(SC).map(sceneHTML).join(''));
placePreds();matchMedia('(max-width:1060px)').addEventListener('change',placePreds);
Object.keys(SC).forEach(id=>{SC[id].reset();controls(id);$('#cap-'+id).textContent=idleCaption(id);});
$('#main').addEventListener('click',e=>{
  const sec=e.target.closest('.scene');if(!sec)return;const id=sec.id.replace('scene-','');
  const lv=e.target.closest('[data-level]');
  if(lv&&!busy){const L=+lv.dataset.level,key='L'+L;SC.bp.scen[key]=bpScen(L);ask('bp',key);return;}
  const go=e.target.closest('[data-go]');if(go&&!busy){if(id==='mict'&&go.dataset.go!=='fill')$('#pred-mict').innerHTML='';ask(id,go.dataset.go);return;}
  const an=e.target.closest('[data-ans]');if(an&&!an.disabled){answer(id,an.dataset.key,+an.dataset.ans);return;}
  const w=e.target.closest('[data-watch]');if(w){w.remove();run(id,w.dataset.watch);return;}
  if(e.target.closest('[data-reset]'))resetScene(id);
});
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$$('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=+b.dataset.speed;$$('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
requestAnimationFrame(loop);

/* ================= 4. Test yourself (own scope) ================= */
(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const reshuffle=(n,prev)=>{let o;do{o=shuffle([...Array(n).keys()]);}while(n>1&&prev&&o.join()===prev);return o;};
const TOPIC={bp:'Blood pressure',pupil:'Pupillary light reflex',mict:'Micturition'};

/* Question bank: Cunningham's Textbook of Veterinary Physiology, 6th ed., Chapters 13 and 14 */
const BANK=[
 /* ---------- Blood pressure ---------- */
 {id:'b1',topic:'bp',type:'mcq',level:'Recall',q:"Where are the stretch receptors that detect systemic blood pressure?",
  opts:["In the internal carotid artery and the aorta","In the bladder wall and neck","In the peripheral blood vessels","In the retina"],a:0,
  fb:["","Information from the bladder wall and neck signals bladder distention, not blood pressure.","Peripheral vasoconstriction is the response; the pressure is detected in the internal carotid artery and the aorta.","The retina contains photoreceptors, which are stimulated by light."],
  why:"Stretch receptors in the internal carotid artery and the aorta detect systemic blood pressure.",src:"Ch. 13, p. 133"},
 {id:'b2',topic:'bp',type:'mcq',level:'Understand',q:"Systemic blood pressure drops. What happens to the activity of the sympathetic adrenergic neurons?",
  opts:["It increases","It is inhibited","It does not change","It is replaced by parasympathetic activity"],a:0,
  fb:["","Inhibition of the vasoconstrictor nerves happens when pressure rises above normal, not when it drops.","The reflex must change sympathetic activity to correct the drop.","This reflex works through sympathetic adrenergic neurons."],
  why:"When the stretch receptors detect a drop in pressure, an increase in activity of sympathetic adrenergic neurons produces peripheral vasoconstriction.",src:"Ch. 13, p. 133"},
 {id:'b3',topic:'bp',type:'mcq',level:'Understand',q:"How does increased sympathetic adrenergic activity raise blood pressure in this reflex?",
  opts:["By peripheral vasoconstriction, which increases vascular resistance","By peripheral vasodilation, which decreases vascular resistance","By inhibiting the vasoconstrictor nerves","By increasing urine storage"],a:0,
  fb:["","Vasodilation lowers vascular resistance, so pressure would fall.","Inhibiting the vasoconstrictor nerves is the response to pressure above normal, and it lowers pressure.","Urine storage is a separate reflex."],
  why:"Increased sympathetic adrenergic activity produces peripheral vasoconstriction and increased vascular resistance, which increases blood pressure and restores sufficient blood flow to the brain.",src:"Ch. 13, p. 133"},
 {id:'b4',topic:'bp',type:'mcq',level:'Understand',q:"Blood pressure rises above normal limits. What happens next?",
  opts:["The sympathetic adrenergic vasoconstrictor nerves are inhibited, and pressure falls back to normal","Sympathetic adrenergic activity increases further","Peripheral vasoconstriction increases","Nothing changes until pressure drops"],a:0,
  fb:["","More sympathetic activity would raise pressure even further.","More vasoconstriction would raise pressure even further.","The reflex responds to a rise in pressure as well as to a drop."],
  why:"If blood pressure rises above normal limits, sympathetic adrenergic vasoconstrictor nerves are inhibited and blood pressure falls back to within normal limits.",src:"Ch. 13, p. 133"},
 {id:'b6',topic:'bp',type:'mcq',level:'Recall',q:"What is the main purpose of this reflex?",
  opts:["To keep sufficient blood flow to the brain","To empty the bladder","To make the pupil smaller","To store urine"],a:0,
  fb:["","Emptying the bladder is the voiding reflex.","Making the pupil smaller is the pupillary light reflex.","Storing urine is the urine storage reflex."],
  why:"Among the body’s major priorities is keeping a sufficient blood pressure and flow to the brain.",src:"Ch. 13, p. 133"},
 {id:'b7',topic:'bp',type:'order',level:'Understand',q:"Blood pressure has dropped. Put the steps of the reflex in order.",
  items:["Systemic blood pressure drops","Stretch receptors in the internal carotid artery and the aorta detect the drop","Activity of the sympathetic adrenergic neurons increases","Peripheral vasoconstriction and increased vascular resistance","Blood pressure increases and sufficient blood flow to the brain is restored"],
  why:"When the receptors detect a drop in pressure, an increase in activity of sympathetic adrenergic neurons produces peripheral vasoconstriction and increased vascular resistance to increase blood pressure and restore sufficient blood flow to the brain.",src:"Ch. 13, p. 133"},
 {id:'b8',topic:'bp',type:'mcq',level:'Apply',q:"A dog’s blood pressure falls moderately below normal. Which combination describes the reflex response?",
  opts:["Sympathetic activity increases; vascular resistance increases","Sympathetic activity decreases; vascular resistance decreases","Sympathetic activity increases; vascular resistance decreases","Sympathetic activity decreases; vascular resistance increases"],a:0,
  fb:["","That is the response to pressure above normal.","Increased sympathetic activity causes vasoconstriction, which increases resistance.","Vascular resistance rises because sympathetic activity rises."],
  why:"A drop in pressure increases sympathetic adrenergic activity, which causes vasoconstriction and increases vascular resistance.",src:"Ch. 13, p. 133"},
 {id:'b10',topic:'bp',type:'match',level:'Understand',q:"Match each situation with the reflex response.",
  pairs:[["Blood pressure below normal","Sympathetic adrenergic activity increases"],["Blood pressure above normal","Vasoconstrictor nerves are inhibited"],["Increased sympathetic adrenergic activity","Peripheral vasoconstriction"],["Peripheral vasoconstriction","Increased vascular resistance"]],
  why:"Each link in the reflex causes the next: a change in pressure alters sympathetic activity, which alters vessel diameter and resistance.",src:"Ch. 13, p. 133"},

 /* ---------- Pupillary light reflex ---------- */
 {id:'p1',topic:'pupil',type:'mcq',level:'Understand',q:"A flashlight is shined into an animal’s eye. What happens to the pupil, and which division causes it?",
  opts:["It becomes smaller; parasympathetic","It becomes larger; sympathetic","It becomes smaller; sympathetic","It becomes larger; parasympathetic"],a:0,
  fb:["","Pupil enlargement by the sympathetic system happens in low ambient light.","The sympathetic system supplies the dilator, which enlarges the pupil.","The parasympathetic system supplies the constrictor, which makes the pupil smaller."],
  why:"Light triggers a reflex in which parasympathetic cholinergic neurons stimulate the constrictor smooth muscle of the iris, so the pupil becomes smaller.",src:"Ch. 13, p. 134; Ch. 14, p. 145"},
 {id:'p2',topic:'pupil',type:'mcq',level:'Recall',q:"Which muscle contracts to make the pupil smaller (miosis)?",
  opts:["The circular constrictor (Sphincter) muscle of the iris","The radial Dilator muscle of the iris","The ciliary muscle","The muscle that lifts the upper eyelid"],a:0,
  fb:["","The radial dilator contracts to enlarge the pupil (mydriasis).","Pupil size is set by the constrictor and dilator fibres of the iris.","Pupil size is set by the smooth muscle of the iris."],
  why:"Contraction of the circular constrictor fibres around the pupil makes it smaller (miosis).",src:"Ch. 13, Table 13.1, p. 132; Ch. 14, p. 145"},
 {id:'p3',topic:'pupil',type:'mcq',level:'Recall',q:"Where are the cell bodies of the parasympathetic postganglionic neurons that supply the iris constrictor?",
  opts:["In the ciliary ganglion","In the cranial (superior) cervical ganglion","In the otic ganglion","In the submandibular ganglion"],a:0,
  fb:["","This sympathetic ganglion supplies the dilator muscle.","The otic ganglion is another parasympathetic ganglion of the head, not the one for the iris.","The submandibular ganglion is another parasympathetic ganglion of the head, not the one for the iris."],
  why:"The constrictor fibres are innervated by postganglionic parasympathetic neurons whose cell bodies lie in the ciliary ganglion, just behind the eye.",src:"Ch. 14, p. 145"},
 {id:'p4',topic:'pupil',type:'mcq',level:'Recall',q:"In which nerve do the parasympathetic preganglionic axons travel to the ciliary ganglion?",
  opts:["Oculomotor nerve (CN 3)","Optic nerve (CN 2)","Facial nerve (CN 7)","Vagus nerve (CN 10)"],a:0,
  fb:["","The optic nerve carries the sensory signal from the retina to the brainstem.","The facial nerve carries parasympathetic fibres to other targets in the head.","The vagus nerve supplies the thoracic and abdominal organs."],
  why:"Preganglionic neurons of the Edinger–Westphal nucleus send their axons in the oculomotor nerve (CN 3) to the ciliary ganglion.",src:"Ch. 14, p. 145"},
 {id:'p5',topic:'pupil',type:'mcq',level:'Recall',q:"Which neurotransmitter do the postganglionic parasympathetic neurons release onto the iris constrictor muscle?",
  opts:["Acetylcholine","Norepinephrine","Epinephrine","Serotonin"],a:0,
  fb:["","Norepinephrine is released by most sympathetic postganglionic neurons.","Epinephrine is released mainly by the adrenal medulla.","Serotonin is not the transmitter in this pathway."],
  why:"The postganglionic parasympathetic neurons secrete acetylcholine as the neurotransmitter to the muscle.",src:"Ch. 13, p. 134; Ch. 14, p. 145"},
 {id:'p6',topic:'pupil',type:'order',level:'Understand',q:"Put the steps of the pupillary light reflex in order.",
  items:["Light stimulates photoreceptors in the retina","Action potentials travel along the optic nerve (CN 2) to the pretectal nuclei","Pretectal neurons synapse on the Edinger–Westphal nucleus","Preganglionic axons travel in the oculomotor nerve (CN 3) to the ciliary ganglion","Postganglionic neurons release acetylcholine onto the constrictor muscle","The pupil becomes smaller"],
  why:"The signal runs from the retina to the brainstem, then out through the parasympathetic pathway to the iris.",src:"Ch. 13, p. 134; Ch. 14, p. 145"},
 {id:'p7',topic:'pupil',type:'mcq',level:'Understand',q:"In low ambient light, what enlarges the pupil?",
  opts:["Sympathetic control of the dilator smooth muscle","Parasympathetic control of the constrictor smooth muscle","Somatic motor neurons to the iris","Acetylcholine from the ciliary ganglion"],a:0,
  fb:["","The parasympathetic constrictor makes the pupil smaller.","The iris muscles are smooth muscle under autonomic control.","Acetylcholine from the ciliary ganglion acts on the constrictor, which makes the pupil smaller."],
  why:"The sympathetic system controls the dilator smooth muscle in the iris for enlargement of the pupil in low ambient light.",src:"Ch. 13, p. 131"},
 {id:'p9',topic:'pupil',type:'mcq',level:'Recall',q:"Where do the sympathetic preganglionic neurons to the eye synapse?",
  opts:["In the cranial (superior) cervical ganglion","In the ciliary ganglion","In the celiac ganglion","In the adrenal medulla"],a:0,
  fb:["","The ciliary ganglion contains parasympathetic neurons.","The celiac ganglion is a prevertebral ganglion for abdominal organs.","The adrenal medulla releases epinephrine and norepinephrine into the blood."],
  why:"Sympathetic preganglionic neurons ascend in the vagosympathetic trunk and synapse in the cranial (superior) cervical ganglion; postganglionic axons go to the dilator muscle of the iris.",src:"Ch. 14, p. 145"},
 {id:'p10',topic:'pupil',type:'mcq',level:'Analyse',q:"Light is shone into the left eye only. What happens to the pupils?",
  opts:["Both pupils constrict","Only the left pupil constricts","Only the right pupil constricts","Neither pupil changes"],a:0,
  fb:["","Crossing fibres also carry the signal to the other side, so the right pupil constricts too.","The left eye received the light, so its pupil constricts.","The light was shone into the left eye, so the left pupil must constrict."],
  why:"Many optic nerve axons cross at the optic chiasm, and many pretectal axons cross the midline, so both pupils constrict: the direct reflex in the left eye and the indirect (consensual) reflex in the right.",src:"Ch. 14, p. 145; Fig. 14.10, p. 146"},
 {id:'p11',topic:'pupil',type:'match',level:'Recall',q:"Match each structure with its role in the pupillary light reflex.",
  pairs:[["Retina","Photoreceptors detect the light"],["Pretectal nuclei","Receive the optic nerve signal"],["Edinger–Westphal nucleus","Parasympathetic preganglionic neurons"],["Ciliary ganglion","Parasympathetic postganglionic neurons"]],
  why:"Retina, pretectal nuclei, Edinger–Westphal nucleus and ciliary ganglion are the successive stations of the reflex.",src:"Ch. 14, p. 145"},

 /* ---------- Micturition ---------- */
 {id:'m1',topic:'mict',type:'mcq',level:'Recall',q:"Which output principally achieves autonomic control of bladder emptying?",
  opts:["Pelvic parasympathetic output","Lumbar sympathetic output","Sacral somatic output","Vagal output"],a:0,
  fb:["","Lumbar sympathetic output facilitates urine storage.","Sacral somatic output controls the external sphincter.","The bladder receives its parasympathetic supply from the sacral cord through the pelvic nerves."],
  why:"Autonomic efferent control of bladder emptying is principally achieved by pelvic parasympathetic output, which causes contraction of the bladder wall (detrusor muscle).",src:"Ch. 13, p. 134; Fig. 13.5B"},
 {id:'m2',topic:'mict',type:'mcq',level:'Understand',q:"As the bladder begins to fill, what does the lumbar sympathetic output do to the detrusor muscle?",
  opts:["Inhibits its contraction","Makes it contract","Has no effect"],a:0,
  fb:["","Contraction of the detrusor empties the bladder; during filling it is inhibited.","The sympathetic output acts on the detrusor to help store urine."],
  why:"Sympathetic output inhibits contraction of the detrusor muscle, directly and by inhibiting the parasympathetic neurons that induce bladder contraction.",src:"Ch. 13, p. 134; Fig. 13.5A"},
 {id:'m3',topic:'mict',type:'mcq',level:'Recall',q:"Which statement about the internal sphincter is correct?",
  opts:["It is smooth muscle at the neck of the bladder, contracted by sympathetic output","It is skeletal muscle controlled by sacral somatic motor neurons","It is contracted by pelvic parasympathetic output","It is the urethralis muscle"],a:0,
  fb:["","That describes the external sphincter.","Pelvic parasympathetic output contracts the detrusor, not the sphincter.","The urethralis is the external sphincter."],
  why:"Sympathetic output facilitates urine storage by contracting the smooth muscle internal sphincter at the neck of the bladder.",src:"Ch. 13, p. 134; Fig. 13.5A"},
 {id:'m4',topic:'mict',type:'mcq',level:'Recall',q:"What controls the external sphincter (urethralis muscle)?",
  opts:["Somatic motor neurons of the sacral spinal cord","Sympathetic output from the lumbar spinal cord","Pelvic parasympathetic output","The PAG directly"],a:0,
  fb:["","Lumbar sympathetic output contracts the internal sphincter.","Pelvic parasympathetic output contracts the detrusor.","The PAG acts through the PMC and the spinal cord, not directly on the sphincter."],
  why:"The skeletal muscle external sphincter (urethralis muscle) is controlled by somatic motor neurons of the sacral spinal cord.",src:"Ch. 13, p. 134; Fig. 13.5A"},
 {id:'m5',topic:'mict',type:'mcq',level:'Recall',q:"Where do the visceral afferents from the bladder enter the spinal cord?",
  opts:["The lumbosacral spinal cord","The cervical spinal cord","The thoracic spinal cord","They go straight to the brainstem"],a:0,
  fb:["","The visceral afferents from the bladder go to the lumbosacral spinal cord.","The visceral afferents from the bladder go to the lumbosacral spinal cord.","They go to the lumbosacral spinal cord first; the distention information is then sent from the spinal cord to the PAG."],
  why:"Visceral afferents to the lumbosacral spinal cord from the bladder wall and urethra provide distention information.",src:"Ch. 13, p. 134"},
 {id:'m6',topic:'mict',type:'mcq',level:'Recall',q:"Where are the periaqueductal gray (PAG) and the pontine micturition center (PMC)?",
  opts:["PAG in the midbrain; PMC in the pons","PAG in the pons; PMC in the midbrain","Both in the forebrain","Both in the sacral spinal cord"],a:0,
  fb:["","The two are the other way round.","The forebrain receives information from the PAG but contains neither.","Both are in the brainstem."],
  why:"Distention information goes to a region of the midbrain called the PAG, which signals a region of the pons called the PMC.",src:"Ch. 13, p. 134"},
 {id:'m7',topic:'mict',type:'mcq',level:'Recall',q:"Where are the urine storage reflexes primarily organized?",
  opts:["The spinal cord","The pons","The midbrain","The forebrain"],a:0,
  fb:["","The pons (PMC) triggers the voiding reflexes.","The midbrain (PAG) integrates information for voiding.","The forebrain provides voluntary control."],
  why:"The urine storage reflexes are primarily organized at the level of the spinal cord.",src:"Ch. 13, p. 134"},
 {id:'m8',topic:'mict',type:'order',level:'Understand',q:"The bladder is full and conditions are favorable. Put the voiding steps in order.",
  items:["The bladder is distended with urine","Distention information goes up to the PAG","The PAG passes it to the forebrain","The forebrain sends voluntary control-related information back to the PAG","The PAG excites the PMC","The PMC inhibits the storage reflexes and excites the sacral parasympathetic output"],
  why:"Distention information goes up to the PAG and forebrain, the PAG excites the PMC, and the PMC coordinates the voiding reflexes.",src:"Ch. 13, pp. 134–135; Fig. 13.5B"},
 {id:'m9',topic:'mict',type:'match',level:'Understand',q:"Match each output with its effect.",
  pairs:[["Lumbar sympathetic output","Contracts the internal sphincter"],["Sacral somatic output","Contracts the external sphincter"],["Sacral parasympathetic output","Contracts the detrusor muscle"],["Pontine micturition center (PMC)","Inhibits the urine storage reflexes"]],
  why:"Two outputs store urine (sympathetic, somatic), one empties the bladder (parasympathetic), and the PMC switches from storage to voiding.",src:"Ch. 13, p. 134; Fig. 13.5"},
 {id:'m10',topic:'mict',type:'mcq',level:'Analyse',q:"The bladder is full, but survival or social conditions are not favorable. What happens?",
  opts:["The PAG does not activate the PMC, and the storage reflexes continue","The PMC is activated anyway, and the bladder empties","Both sphincters relax, but the detrusor stays relaxed","The lumbar sympathetic output stops"],a:0,
  fb:["","Activation of the PMC is under an element of voluntary control.","The sphincters relax only when the PMC inhibits the storage reflexes.","The storage reflexes, including the sympathetic output, continue."],
  why:"Animals do not immediately void when the bladder is full because survival or social conditions are not always favorable; there is voluntary control over whether the PMC is activated.",src:"Ch. 13, pp. 134–135"},
 {id:'m11',topic:'mict',type:'mcq',level:'Apply',q:"During voiding, what happens to the internal and external sphincters, and why?",
  opts:["Both relax, because the PMC inhibits the urine storage reflexes","Both contract, because sympathetic output increases","Only the internal sphincter relaxes; the external stays contracted","Both relax, because the pelvic nerves inhibit them"],a:0,
  fb:["","Sympathetic output is part of the storage reflexes, which are inhibited during voiding.","The PMC inhibits the storage reflexes, so both sphincters relax.","Relaxation comes from inhibition of the storage reflexes, not from the pelvic nerves."],
  why:"The voiding reflexes include inhibition of the sympathetically mediated storage reflexes, resulting in relaxation of the internal and external sphincters.",src:"Ch. 13, p. 134; Fig. 13.5B"}
];

/* ---------- State ---------- */
const S={screen:'setup',topics:new Set(['bp','pupil','mict']),len:10,mode:'practice',queue:[],i:0,results:[],cur:null,lastOrders:{}};

function prepare(q){
  const c={...q};
  if(q.type==='mcq'){c.order=reshuffle(q.opts.length,S.lastOrders[q.id]);S.lastOrders[q.id]=c.order.join();c.sel=null;}
  if(q.type==='order'){let o;do{o=shuffle([...q.items.keys()]);}while(o.every((v,i)=>v===i));c.cur=o;}
  if(q.type==='match'){c.rights=shuffle(q.pairs.map(p=>p[1]));c.sel=q.pairs.map(()=> '');}
  c.conf=null;c.checked=false;return c;
}
function build(list){
  // interleave topics so they alternate rather than block
  const by={};list.forEach(q=>(by[q.topic]=by[q.topic]||[]).push(q));
  Object.keys(by).forEach(k=>by[k]=shuffle(by[k]));
  const out=[];let left=true;
  while(left){left=false;for(const k of shuffle(Object.keys(by))){if(by[k].length){out.push(by[k].shift());left=true;}}}
  return out;
}
function start(list){
  S.queue=list.map(prepare);S.i=0;S.results=[];S.screen='q';render();
}

/* ---------- Screens ---------- */
function render(){
  const app=$('#app');
  if(S.screen==='setup')app.innerHTML=setupHTML();
  else if(S.screen==='q')app.innerHTML=questionHTML();
  else app.innerHTML=reportHTML();
  window.scrollTo({top:0,behavior:'auto'});
  const f=$('#app .qz-opt, #app .mv, #app select, #app .qz-btn.primary');if(f&&S.screen!=='setup')f.focus({preventScroll:true});
}
function setupHTML(){
  const n=BANK.filter(q=>S.topics.has(q.topic)).length;
  const lens=[10,20,'all'];
  return `<section class="card">
    <h2>Set up your test</h2>
    <h3>1. Choose the reflexes</h3>
    <div class="qz-chips">${Object.entries(TOPIC).map(([k,v])=>`<button type="button" class="chip" data-topic="${k}" aria-pressed="${S.topics.has(k)}">${v}<small>${BANK.filter(q=>q.topic===k).length} questions</small></button>`).join('')}</div>
    <h3>2. Number of questions</h3>
    <div class="qz-chips">${lens.map(l=>`<button type="button" class="chip" data-len="${l}" aria-pressed="${S.len===l}" ${l!=='all'&&l>n?'disabled':''}>${l==='all'?`All (${n})`:l}</button>`).join('')}</div>
    <h3>3. Mode</h3>
    <div class="qz-chips">
      <button type="button" class="chip wide" data-mode="practice" aria-pressed="${S.mode==='practice'}">Practice<small>Feedback after every question. Missed questions come back later.</small></button>
      <button type="button" class="chip wide" data-mode="exam" aria-pressed="${S.mode==='exam'}">Exam<small>No feedback until the end, like a real test.</small></button>
    </div>
    <h3>How to get the most from this test</h3>
    <ul class="tips">
      <li>Answer from memory first. Don’t look back at the reflex animations until you finish.</li>
      <li>Before checking, say how sure you are. Your report will show where you were confident but wrong: revise those first.</li>
      <li>Read the explanation for every question, even the ones you got right.</li>
      <li>Come back another day and test yourself again. Spacing your practice helps you remember.</li>
    </ul>
    <div class="row"><button type="button" class="qz-btn primary" data-act="start" ${S.topics.size?'':'disabled'}>Start the test</button>
    ${S.topics.size?'':'<span class="muted">Choose at least one reflex.</span>'}</div>
  </section>`;
}
function answered(c){
  if(c.type==='mcq')return c.sel!==null;
  if(c.type==='order')return true;
  if(c.type==='match')return c.sel.every(v=>v);
}
function isCorrect(c){
  if(c.type==='mcq')return c.sel===c.a;
  if(c.type==='order')return c.cur.every((v,i)=>v===i);
  if(c.type==='match')return c.sel.every((v,i)=>v===c.pairs[i][1]);
}
function questionHTML(){
  const c=S.queue[S.i],N=S.queue.length,done=c.checked;
  let body='';
  if(c.type==='mcq'){
    body=`<div class="qz-opts">${c.order.map(i=>{let cls='';if(done){if(i===c.a)cls='ok';else if(i===c.sel)cls='bad';}
      return `<button type="button" class="qz-opt ${cls}" data-opt="${i}" aria-pressed="${c.sel===i}" ${done?'disabled':''}>${c.opts[i]}</button>`;}).join('')}</div>`;
  }else if(c.type==='order'){
    body=`<p class="how">Use the arrows to move each step into the right position.</p><ol class="ord">${c.cur.map((v,pos)=>{const cls=done?(v===pos?'ok':'bad'):'';
      return `<li class="${cls}"><span>${c.items[v]}</span><button type="button" class="mv" data-up="${pos}" aria-label="Move up" ${pos===0||done?'disabled':''}>▲</button><button type="button" class="mv" data-down="${pos}" aria-label="Move down" ${pos===c.cur.length-1||done?'disabled':''}>▼</button></li>`;}).join('')}</ol>`;
  }else{
    body=`<p class="how">Choose the matching answer for each item. Each answer is used once.</p><div class="match">${c.pairs.map((p,i)=>{const cls=done?(c.sel[i]===p[1]?'ok':'bad'):'';
      return `<div class="mrow ${cls}"><b>${p[0]}</b><select data-m="${i}" ${done?'disabled':''} aria-label="Match for ${p[0]}"><option value="">Choose…</option>${c.rights.map(r=>`<option ${c.sel[i]===r?'selected':''}>${r}</option>`).join('')}</select>${done&&c.sel[i]!==p[1]?`<span class="fix">Correct match: ${p[1]}</span>`:''}</div>`;}).join('')}</div>`;
  }
  const conf=`<div class="conf"><p>How sure are you?</p><div class="qz-chips">${['Sure','Unsure','Guessing'].map(x=>`<button type="button" class="chip" data-conf="${x}" aria-pressed="${c.conf===x}" ${done?'disabled':''}>${x}</button>`).join('')}</div></div>`;
  let fb='';
  if(done&&S.mode==='practice'){
    const ok=isCorrect(c);
    const wrongWhy=c.type==='mcq'&&!ok&&c.fb&&c.fb[c.sel]?`<p class="why-wrong">${c.fb[c.sel]}</p>`:'';
    const ordFix=c.type==='order'&&!ok?`<p><b>Correct order:</b></p><ol>${c.items.map(t=>`<li>${t}</li>`).join('')}</ol>`:'';
    fb=`<div class="feedback"><span class="v ${ok?'ok':'bad'}">${ok?'Correct.':'Not quite.'}</span>${wrongWhy}${ordFix}${c.why}<span class="qz-src">${c.src}</span>${!ok&&!c.retry?'<p class="muted" style="margin:8px 0 0">This question will come back later in the test.</p>':''}</div>`;
  }
  const canCheck=answered(c)&&c.conf;
  const actions=done?`<button type="button" class="qz-btn primary" data-act="next">${S.i+1<N?'Next question':'See my results'}</button>`
    :`<button type="button" class="qz-btn primary" data-act="check" ${canCheck?'':'disabled'}>${S.mode==='practice'?'Check my answer':'Submit and continue'}</button>${canCheck?'':'<span class="muted">Answer the question and choose how sure you are.</span>'}`;
  return `<section class="card">
    <div class="meta"><span>Question ${S.i+1} of ${N}</span><span>${S.mode==='practice'?'Practice':'Exam'} mode</span></div>
    <div class="bar"><i style="width:${S.i/N*100}%"></i></div>
    <span class="qz-tag t-${c.topic}">${TOPIC[c.topic]}</span><span class="qz-tag t-lvl">${c.level}</span>${c.retry?'<span class="qz-tag t-lvl">Second try</span>':''}
    <h2 class="q">${c.q}</h2>
    ${body}${conf}${fb}
    <div class="row">${actions}<button type="button" class="qz-btn" data-act="quit">End test</button></div>
  </section>`;
}
function ansText(c){
  if(c.type==='mcq')return c.sel===null?'(no answer)':c.opts[c.sel];
  if(c.type==='order')return c.cur.map(v=>c.items[v]).join(' → ');
  return c.pairs.map((p,i)=>`${p[0]}: ${c.sel[i]||'(none)'}`).join('; ');
}
function rightText(c){
  if(c.type==='mcq')return c.opts[c.a];
  if(c.type==='order')return c.items.join(' → ');
  return c.pairs.map(p=>`${p[0]}: ${p[1]}`).join('; ');
}
function reportHTML(){
  const R=S.results.filter(r=>!r.c.retry);  // score first attempts only
  const tot=R.length,cor=R.filter(r=>r.ok).length,pct=tot?Math.round(cor/tot*100):0;
  const topics=[...new Set(R.map(r=>r.c.topic))];
  const cal={sureOk:0,sureBad:0,unsureOk:0,unsureBad:0};
  R.forEach(r=>{const s=r.c.conf==='Sure';cal[(s?'sure':'unsure')+(r.ok?'Ok':'Bad')]++;});
  const missed=R.filter(r=>!r.ok);
  const sureWrong=R.filter(r=>!r.ok&&r.c.conf==='Sure');
  const item=r=>`<li><span class="mq"><span class="qz-tag t-${r.c.topic}">${TOPIC[r.c.topic]}</span>${r.c.q}</span>
    <div>Your answer: <span class="myours">${ansText(r.c)}</span></div>
    <div>Correct answer: <span class="ma">${rightText(r.c)}</span></div>
    <div style="margin-top:4px">${r.c.why}<span class="qz-src">${r.c.src}</span></div></li>`;
  return `<section class="card">
    <h2>Your results</h2>
    <p><span class="big">${cor}/${tot}</span> <span class="muted">(${pct}%) on first attempts</span></p>
    <h3>By reflex</h3>
    <div class="topics">${topics.map(t=>{const a=R.filter(r=>r.c.topic===t),k=a.filter(r=>r.ok).length,p=Math.round(k/a.length*100);
      return `<div class="trow"><span>${TOPIC[t]}</span><span class="tbar"><i style="width:${p}%;background:${p>=80?'var(--ok)':p>=50?'var(--warn)':'var(--bad)'}"></i></span><span>${k}/${a.length}</span></div>`;}).join('')}</div>
    <h3>How well did you judge yourself?</h3>
    <div class="calib">
      <div class="cbox"><b>${cal.sureOk}</b><span>Sure and correct: secure knowledge</span></div>
      <div class="cbox alert"><b>${cal.sureBad}</b><span>Sure but wrong: revise these first</span></div>
      <div class="cbox shaky"><b>${cal.unsureOk}</b><span>Unsure or guessing, but correct: revise to make these secure</span></div>
      <div class="cbox"><b>${cal.unsureBad}</b><span>Unsure or guessing, and wrong: you knew to check these</span></div>
    </div>
    ${sureWrong.length?`<h3>Revise first: you were sure, but wrong</h3><ul class="missed">${sureWrong.map(item).join('')}</ul>`:''}
    ${(()=>{const rest=missed.filter(r=>r.c.conf!=='Sure');return missed.length?(rest.length?`<h3>${sureWrong.length?'Other questions':'Questions'} to review (${rest.length})</h3><ul class="missed">${rest.map(item).join('')}</ul>`:''):'<h3>Excellent: no questions to review.</h3>';})()}
    ${S.mode==='exam'?`<details class="all"><summary>See every question and answer</summary><ul class="missed" style="margin-top:10px">${R.map(item).join('')}</ul></details>`:''}
    <p class="muted" style="margin-top:14px">To revise, go back to the matching tab on the Autonomic reflexes page and run the animation again.</p>
    <div class="row">${missed.length?'<button type="button" class="qz-btn primary" data-act="retry">Retry the missed questions</button>':''}<button type="button" class="qz-btn ${missed.length?'':'primary'}" data-act="new">New test</button></div>
  </section>`;
}

/* ---------- Events ---------- */
$('#app').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.topic){const k=b.dataset.topic;S.topics.has(k)?S.topics.delete(k):S.topics.add(k);return render();}
  if(b.dataset.len){S.len=b.dataset.len==='all'?'all':+b.dataset.len;return render();}
  if(b.dataset.mode){S.mode=b.dataset.mode;return render();}
  const c=S.queue[S.i];
  if(b.dataset.opt!==undefined){c.sel=+b.dataset.opt;return render();}
  if(b.dataset.up!==undefined){const p=+b.dataset.up;[c.cur[p-1],c.cur[p]]=[c.cur[p],c.cur[p-1]];render();$$('#app [data-up]')[p-1]?.focus();return;}
  if(b.dataset.down!==undefined){const p=+b.dataset.down;[c.cur[p+1],c.cur[p]]=[c.cur[p],c.cur[p+1]];render();$$('#app [data-down]')[p+1]?.focus();return;}
  if(b.dataset.conf){c.conf=b.dataset.conf;return render();}
  const a=b.dataset.act;
  if(a==='start'){
    let pool=build(BANK.filter(q=>S.topics.has(q.topic)));
    if(S.len!=='all')pool=pool.slice(0,S.len);
    return start(pool);
  }
  if(a==='check'){
    c.checked=true;const ok=isCorrect(c);S.results.push({c,ok});
    if(S.mode==='practice'&&!ok&&!c.retry){const again=prepare(BANK.find(q=>q.id===c.id));again.retry=true;const pos=Math.min(S.queue.length,S.i+3);S.queue.splice(pos,0,again);}
    if(S.mode==='exam'){S.i++;S.screen=S.i<S.queue.length?'q':'report';}
    return render();
  }
  if(a==='next'){S.i++;S.screen=S.i<S.queue.length?'q':'report';return render();}
  if(a==='quit'){S.screen=S.results.length?'report':'setup';return render();}
  if(a==='retry'){const ids=S.results.filter(r=>!r.c.retry&&!r.ok).map(r=>r.c.id);return start(build(BANK.filter(q=>ids.includes(q.id))));}
  if(a==='new'){S.screen='setup';return render();}
});
$('#app').addEventListener('change',e=>{
  const s=e.target.closest('select[data-m]');if(!s)return;
  const c=S.queue[S.i],i=+s.dataset.m;
  // each answer is used once: clear it from any other row
  c.sel=c.sel.map((v,j)=>j!==i&&v===s.value?'':v);c.sel[i]=s.value;render();
  $(`#app select[data-m="${i}"]`)?.focus();
});
render();
})();
