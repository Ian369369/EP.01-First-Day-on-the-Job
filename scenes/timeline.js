/* MOONBOY EP.01 — master timeline + deterministic book physics (shared by renderer and QC). */
const TL = (() => {
  const FPS = 24, DUR = 35.0, W = 1080, H = 1920;
  const FLOOR = 1560, BODY_Y = FLOOR - 290;           // body-centre height when standing (official proportions)
  const TABLE = { x0: 420, x1: 800, top: 1300, back: 1258, legH: FLOOR - 1300 };
  const BOOK = { w: 130, h: 182, thick: 14, x0: 545, flat: 0.34 };   // lying on table: cover foreshortened
  const SURF_Y = (TABLE.top + TABLE.back) / 2;        // book centre on the table surface
  // ---- dialogue (start times in episode seconds; onset/offset from voice_meta) ----
  const VO = [
    { id: '01_hey', t: 3.10, en: "Hey! Name's Moonboy!", zh: '嘿！我叫 MOONBOY！' },
    { id: '02_firstday', t: 6.30, en: 'First day! Easy peasy!', zh: '第一天上班！小菜一碟！' },
    { id: '03a_ah', t: 9.95, en: 'Ah... aah...', zh: null },
    { id: '03b_achoo', t: null, en: 'ACHOO!', zh: '哈啾！' },
    { id: '04_watch', t: 15.75, en: 'Not on my watch!', zh: '有我在，休想！' },
    { id: '05_gotcha', t: 18.98, en: 'Gotcha!', zh: '接到了！' },
    { id: '06_phew', t: 29.55, en: 'Phew... Not a scratch!', zh: '呼……還好毫髮無傷！' },
  ];
  // ---- key beats ----
  const T = {
    spot: 0.35, hopIn: 0.75, hopLand: 2.05, trip: 2.12, recover: 2.75, wave: 3.0,
    walk0: 5.05, walk1: 6.15, glove0: 6.6, glove1: 8.6,
    lean0: 9.15, lean1: 9.75, twitch0: 9.8,
    SNEEZE: 11.55,                      // exact burst of the "CHOO"
    gustHit: 11.66, edge: null,         // computed
    notice: 12.30, serious: 14.25, glint: 15.05,
    crouch: 17.55, launch: 18.0, CATCH: 18.86, land: 19.55, upright0: 22.55, upright1: 23.45,
    walkBack0: 24.0, walkBack1: 25.0, check0: 25.25, sleeve0: 28.35, sleeve1: 29.35,
    wink: 31.55, fade0: 32.0, logo0: 32.45, END: 35.0,
  };
  // ---- book slide: constant friction, chosen so it reaches the edge in SLIDE_T with exit speed VX ----
  const VX = 520, SLIDE_T = 0.30, SLIDE_D = TABLE.x1 - BOOK.x0;
  const V0 = 2 * SLIDE_D / SLIDE_T - VX, DEC = (V0 - VX) / SLIDE_T;
  T.edge = T.gustHit + SLIDE_T;
  const G = 1900, DRAG = 1.4, OMEGA = 7.5;                // cartoon gravity px/s², horizontal drag, tumble rad/s (book-time)
  // cartoon slow motion: book clock rate r(t)
  const SLOW0 = 12.24, SLOW_K = 0.06, SLOW_MIN = 0.007, REL0 = 18.45, REL1 = T.CATCH;
  function rate(t) {
    if (t < SLOW0) return 1;
    let r = SLOW_MIN + (1 - SLOW_MIN) * Math.exp(-(t - SLOW0) / SLOW_K);
    if (t > REL0) r = Math.max(r, SLOW_MIN + (0.12 - SLOW_MIN) * Math.min(1, (t - REL0) / (REL1 - REL0)));
    return r;
  }
  // tabulate book-clock tau(t) for air phase
  const DT = 1 / 960, tauTab = []; { let tau = 0; for (let t = T.edge; t <= T.CATCH + 0.01; t += DT) { tauTab.push(tau); tau += rate(t) * DT; } }
  const tauAt = (t) => { const i = (t - T.edge) / DT, i0 = Math.max(0, Math.min(tauTab.length - 2, Math.floor(i))); return tauTab[i0] + (tauTab[i0 + 1] - tauTab[i0]) * (i - i0); };
  function bookAir(t) {
    const tau = tauAt(t);
    const x = TABLE.x1 + VX / DRAG * (1 - Math.exp(-DRAG * tau));
    const y = SURF_Y + 0.5 * G * tau * tau;
    const tip = Math.min(1, tau / 0.09);                     // tipping off edge: foreshortening -> upright cover
    return { x, y, rot: OMEGA * tau, sy: BOOK.flat + (1 - BOOK.flat) * (tip * tip * (3 - 2 * tip)), tau, r: rate(t), mode: 'air' };
  }
  function bookFree(t) {   // pure physics state (table/slide/air); held states are resolved by the scene
    if (t < T.gustHit) return { x: BOOK.x0, y: SURF_Y, rot: 0, sy: BOOK.flat, mode: 'table' };
    if (t < T.edge) { const d = t - T.gustHit; return { x: BOOK.x0 + V0 * d - 0.5 * DEC * d * d, y: SURF_Y, rot: 0, sy: BOOK.flat, mode: 'slide' }; }
    return bookAir(Math.min(t, T.CATCH));
  }
  // bounding extents of the book drawn as rotated rect (w x h*sy)
  function bookExtent(s) {
    const hw = BOOK.w / 2, hh = BOOK.h * s.sy / 2, c = Math.abs(Math.cos(s.rot)), sn = Math.abs(Math.sin(s.rot));
    return { left: s.x - (hw * c + hh * sn), right: s.x + (hw * c + hh * sn), top: s.y - (hw * sn + hh * c), bottom: s.y + (hw * sn + hh * c) };
  }
  return { FPS, DUR, W, H, FLOOR, BODY_Y, TABLE, BOOK, SURF_Y, VO, T, rate, bookFree, bookExtent, phys: { VX, V0, DEC, G, DRAG, OMEGA } };
})();
if (typeof module !== 'undefined') module.exports = TL;
