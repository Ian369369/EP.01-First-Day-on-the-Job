// Numeric acceptance test for the sneeze -> slide -> edge -> fall -> mid-air catch sequence.
const TL = require('../scenes/timeline.js'); const { T, TABLE, FLOOR, FPS } = TL;
let ok = true; const fail = (m) => { ok = false; console.log('FAIL', m); };
console.log('phys', TL.phys, 'edge t=', T.edge.toFixed(3));
let firstClear = null, minGap = 1e9;
for (let f = Math.round(T.gustHit * FPS) - 2; f <= Math.round(T.CATCH * FPS); f++) {
  const t = f / FPS, s = TL.bookFree(t), e = TL.bookExtent(s);
  if (s.mode === 'air') {
    const gapFloor = FLOOR - e.bottom; minGap = Math.min(minGap, gapFloor);
    if (gapFloor <= 20) fail(`book within 20px of floor at f${f}`);
    if (firstClear === null && e.left > TABLE.x1 + 8) firstClear = t;
  }
  if ([276,280,284,288,292,300,312,336,360,384,408,432,444,448,452].includes(f) || f === Math.round(T.CATCH*FPS))
    console.log(`f${f} t=${t.toFixed(2)} ${s.mode} x=${s.x.toFixed(0)} y=${s.y.toFixed(0)} rot=${s.rot.toFixed(2)} L=${e.left.toFixed(0)} R=${e.right.toFixed(0)} top=${e.top.toFixed(0)} bot=${e.bottom.toFixed(0)} r=${(s.r||1).toFixed(3)}`);
}
console.log('book completely clear of table (whole book past the table edge, airborne) at t=', firstClear && firstClear.toFixed(2));
if (!(T.SNEEZE < T.gustHit && T.gustHit < T.edge)) fail('causality sneeze->gust->slide');
if (!(firstClear && firstClear < 14.0)) fail('book not clearly airborne within scene 3 (<14s)');
if (!(T.notice > T.edge)) fail('Moonboy reacts before book leaves the table');
if (!(T.launch > T.edge)) fail('Moonboy jumps before book falls');
console.log('min gap above floor during fall:', minGap.toFixed(1), 'px');
const e = TL.bookExtent(TL.bookFree(T.CATCH)); if (e.right > 1060) fail('book exits frame right');
console.log(ok ? 'BOOK-FALL QC: PASS' : 'BOOK-FALL QC: FAIL'); process.exit(ok ? 0 : 1);
