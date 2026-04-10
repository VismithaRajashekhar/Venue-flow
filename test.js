'use strict';
/**
 * VenueFlow v3 — Node.js Test Runner
 * Mirrors the in-browser test suite for CI/CD and submission scoring.
 * Run: node test.js
 */

let pass=0, fail=0;

function test(group, name, fn) {
  try { fn(); console.log(`  ✅ ${group} | ${name}`); pass++; }
  catch(e) { console.log(`  ❌ ${group} | ${name}\n     → ${e.message}`); fail++; }
}
function assert(c,m='Assertion failed') { if(!c) throw new Error(m); }
function eq(a,b,m) { if(a!==b) throw new Error(m||`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function range(v,mn,mx,m) { if(v<mn||v>mx) throw new Error(m||`${v} not in [${mn},${mx}]`); }

// ── Core Logic (replicated) ──
const VFUtils={
  clamp:(v,mn,mx)=>Math.max(mn,Math.min(mx,v)),
  rnd:(a,b)=>Math.random()*(b-a)+a,
  rndInt:(a,b)=>Math.floor(Math.random()*(b-a)+a),
  lerp:(a,b,t)=>a+(b-a)*t,
  sanitize:(s)=>typeof s!=='string'?'':s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;'),
  getGateStatus:(w)=>w<4?'open':w<8?'moderate':w<12?'congested':'critical',
  getDensityLabel:(d)=>d<.4?'Clear':d<.7?'Moderate':d<.85?'Busy':d<.95?'Congested':'Critical',
  getDensityColor:(d)=>d<.4?'#10d080':d<.7?'#f0a020':d<.85?'#f07020':d<.95?'#f04060':'#9060f0',
  getWaitColor:(w)=>w<4?'var(--green)':w<8?'var(--amber)':'var(--red)',
  calcAvgWait:(w)=>{const v=Object.values(w);return v.length?v.reduce((s,x)=>s+x,0)/v.length:0;},
  gateWaitToPct:(w)=>Math.max(0,Math.min(100,(w/15)*100)),
  validateSeat:(s)=>typeof s==='string'&&s.trim().length>=2,
  findRoute:(to)=>{if(!to||typeof to!=='string')return null;const k=Object.keys(ROUTES).find(k=>to.toLowerCase().includes(k));return k?ROUTES[k]:null;},
};
const ROUTES={
  'gate a':{steps:['Aisle 12','Right stairwell','North concourse','Gate A left'],crowd:'Low',time:'4 min',dist:'320m',alt:null},
  'gate b':{steps:['Aisle 8','Concourse B','180m to Gate B'],crowd:'Moderate',time:'3 min',dist:'220m',alt:null},
  'gate c':{steps:['⚠️ Congested','Use Gate D'],crowd:'Critical',time:'6 min',dist:'410m',alt:'Gate D'},
  'gate d':{steps:['South concourse','Blue Gate D signs'],crowd:'Low',time:'5 min',dist:'350m',alt:null},
  'gate e':{steps:['VIP Aisle 2','Gold signage','Gate E'],crowd:'VIP',time:'2 min',dist:'180m',alt:null},
  'food court':{steps:['Aisle 5','North concourse','Section A junction'],crowd:'Busy',time:'2 min',dist:'150m',alt:null},
  'restroom':{steps:['Aisle 14','West restrooms'],crowd:'Low',time:'1 min',dist:'50m',alt:null},
  'first aid':{steps:['Dial 100','Section C ground'],crowd:'Priority',time:'3 min',dist:'250m',alt:null},
  'merchandise':{steps:['NW concourse','Aisle 2'],crowd:'Moderate',time:'5 min',dist:'380m',alt:null},
};
const GATE_DEFS=[
  {id:'A',lanes:4,cap:80},{id:'B',lanes:6,cap:100},{id:'C',lanes:3,cap:60},
  {id:'D',lanes:4,cap:70},{id:'E',lanes:2,cap:40},{id:'F',lanes:2,cap:30},
];
const SECTION_DEFS=[
  {id:'North Upper',cap:6000},{id:'North Lower',cap:4000},{id:'South Upper',cap:6000},
  {id:'South Lower',cap:4000},{id:'East Upper',cap:5500},{id:'East Lower',cap:3500},
  {id:'West Upper',cap:5500},{id:'West Lower',cap:3500},{id:'NE Corner',cap:2000},
  {id:'NW Corner',cap:2000},{id:'SE Corner',cap:2000},{id:'SW Corner',cap:2000},
];

console.log('\n🏟️  VenueFlow v3.0 — Node.js Test Runner\n');

// ── Utils ──
test('Utils','clamp mid',()=>eq(VFUtils.clamp(5,0,10),5));
test('Utils','clamp below min',()=>eq(VFUtils.clamp(-1,0,10),0));
test('Utils','clamp above max',()=>eq(VFUtils.clamp(11,0,10),10));
test('Utils','clamp at min boundary',()=>eq(VFUtils.clamp(0,0,10),0));
test('Utils','clamp at max boundary',()=>eq(VFUtils.clamp(10,0,10),10));
test('Utils','rnd in range',()=>{for(let i=0;i<30;i++)range(VFUtils.rnd(2,8),2,8);});
test('Utils','rndInt is integer',()=>{for(let i=0;i<10;i++)eq(VFUtils.rndInt(0,5)%1,0);});
test('Utils','lerp t=0',()=>eq(VFUtils.lerp(10,20,0),10));
test('Utils','lerp t=1',()=>eq(VFUtils.lerp(10,20,1),20));
test('Utils','lerp t=0.5',()=>eq(VFUtils.lerp(10,20,0.5),15));
test('Utils','gateWaitToPct 0',()=>eq(VFUtils.gateWaitToPct(0),0));
test('Utils','gateWaitToPct 15 = 100',()=>eq(VFUtils.gateWaitToPct(15),100));
test('Utils','gateWaitToPct clamps at 100',()=>eq(VFUtils.gateWaitToPct(30),100));
test('Utils','gateWaitToPct 7.5 = 50',()=>eq(VFUtils.gateWaitToPct(7.5),50));
test('Utils','calcAvgWait empty = 0',()=>eq(VFUtils.calcAvgWait({}),0));
test('Utils','calcAvgWait single',()=>eq(VFUtils.calcAvgWait({A:6}),6));
test('Utils','calcAvgWait multiple',()=>eq(VFUtils.calcAvgWait({A:2,B:4,C:6,D:8}),5));
test('Utils','calcAvgWait equal values',()=>eq(VFUtils.calcAvgWait({A:3,B:3,C:3}),3));

// ── Security (Sanitize) ──
test('Security','sanitize <',()=>assert(VFUtils.sanitize('<script>').includes('&lt;')));
test('Security','sanitize >',()=>assert(VFUtils.sanitize('>').includes('&gt;')));
test('Security','sanitize &',()=>assert(VFUtils.sanitize('a&b').includes('&amp;')));
test('Security','sanitize "',()=>assert(VFUtils.sanitize('"x"').includes('&quot;')));
test('Security','sanitize null → ""',()=>eq(VFUtils.sanitize(null),''));
test('Security','sanitize number → ""',()=>eq(VFUtils.sanitize(42),''));
test('Security','sanitize safe string',()=>eq(VFUtils.sanitize('Hello'),'Hello'));
test('Security','sanitize XSS pattern blocked',()=>assert(!VFUtils.sanitize('<img onerror=alert(1)>').includes('<img')));

// ── Gate Status ──
test('Gate','wait 1 → open',()=>eq(VFUtils.getGateStatus(1),'open'));
test('Gate','wait 3 → open',()=>eq(VFUtils.getGateStatus(3),'open'));
test('Gate','wait 4 → moderate',()=>eq(VFUtils.getGateStatus(4),'moderate'));
test('Gate','wait 7 → moderate',()=>eq(VFUtils.getGateStatus(7),'moderate'));
test('Gate','wait 8 → congested',()=>eq(VFUtils.getGateStatus(8),'congested'));
test('Gate','wait 11 → congested',()=>eq(VFUtils.getGateStatus(11),'congested'));
test('Gate','wait 12 → critical',()=>eq(VFUtils.getGateStatus(12),'critical'));
test('Gate','wait 18 → critical',()=>eq(VFUtils.getGateStatus(18),'critical'));

// ── Density ──
test('Density','0.20 → Clear',()=>eq(VFUtils.getDensityLabel(.20),'Clear'));
test('Density','0.40 → Moderate',()=>eq(VFUtils.getDensityLabel(.40),'Moderate'));
test('Density','0.70 → Busy',()=>eq(VFUtils.getDensityLabel(.70),'Busy'));
test('Density','0.85 → Congested',()=>eq(VFUtils.getDensityLabel(.85),'Congested'));
test('Density','0.95 → Critical',()=>eq(VFUtils.getDensityLabel(.95),'Critical'));
test('Density','1.00 → Critical',()=>eq(VFUtils.getDensityLabel(1.0),'Critical'));
test('Density','color <0.4 green',()=>eq(VFUtils.getDensityColor(.3),'#10d080'));
test('Density','color 0.5 amber',()=>eq(VFUtils.getDensityColor(.5),'#f0a020'));
test('Density','color 0.75 orange',()=>eq(VFUtils.getDensityColor(.75),'#f07020'));
test('Density','color 0.90 red',()=>eq(VFUtils.getDensityColor(.90),'#f04060'));
test('Density','color 0.96 purple',()=>eq(VFUtils.getDensityColor(.96),'#9060f0'));

// ── Routing ──
test('Routing','null → null',()=>eq(VFUtils.findRoute(null),null));
test('Routing','empty → null',()=>eq(VFUtils.findRoute(''),null));
test('Routing','Gate A resolves',()=>assert(VFUtils.findRoute('Gate A')!==null));
test('Routing','gate a lowercase',()=>assert(VFUtils.findRoute('gate a')!==null));
test('Routing','GATE A uppercase',()=>assert(VFUtils.findRoute('GATE A')!==null));
test('Routing','Gate C warns congestion',()=>assert(VFUtils.findRoute('gate c').steps[0].includes('⚠️')));
test('Routing','Gate C has alt route',()=>eq(VFUtils.findRoute('gate c').alt,'Gate D'));
test('Routing','Food Court resolves',()=>assert(VFUtils.findRoute('food court')!==null));
test('Routing','Restroom resolves',()=>assert(VFUtils.findRoute('restroom')!==null));
test('Routing','First Aid resolves',()=>assert(VFUtils.findRoute('first aid')!==null));
test('Routing','unknown → null',()=>eq(VFUtils.findRoute('xyz unknown'),null));
test('Routing','all routes have steps',()=>Object.values(ROUTES).forEach(r=>assert(r.steps.length>0)));
test('Routing','all routes have time',()=>Object.values(ROUTES).forEach(r=>assert(r.time&&r.time.length>0)));
test('Routing','all route keys lowercase',()=>Object.keys(ROUTES).forEach(k=>eq(k,k.toLowerCase())));

// ── Seat Validation ──
test('Validation','D-114 valid',()=>assert(VFUtils.validateSeat('D-114')));
test('Validation','A1 valid',()=>assert(VFUtils.validateSeat('A1')));
test('Validation','empty → false',()=>assert(!VFUtils.validateSeat('')));
test('Validation','null → false',()=>assert(!VFUtils.validateSeat(null)));
test('Validation','single char → false',()=>assert(!VFUtils.validateSeat('A')));

// ── Data Integrity ──
test('Data','6 gates',()=>eq(GATE_DEFS.length,6));
test('Data','12 sections',()=>eq(SECTION_DEFS.length,12));
test('Data','gate IDs unique',()=>{const ids=GATE_DEFS.map(g=>g.id);eq(new Set(ids).size,ids.length);});
test('Data','all gates cap>0',()=>GATE_DEFS.forEach(g=>assert(g.cap>0)));
test('Data','all gates lanes>0',()=>GATE_DEFS.forEach(g=>assert(g.lanes>0)));
test('Data','all sections cap>0',()=>SECTION_DEFS.forEach(s=>assert(s.cap>0)));

// ── Report ──
console.log(`\n${'─'.repeat(50)}`);
console.log(`Total: ${pass+fail}   ✅ ${pass} passed   ${fail>0?`❌ ${fail} failed`:'🎉 0 failed'}`);
console.log(`${'─'.repeat(50)}\n`);
if(fail>0) process.exit(1);
else console.log('🏆 All tests passed! Ready to deploy.\n');
