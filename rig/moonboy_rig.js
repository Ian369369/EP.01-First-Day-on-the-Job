/* MOONBOY reusable 2D cut-out rig.
 * Sprites are crops of the OFFICIAL artwork (see tools/extract_assets.py). The moon body and chrome
 * ring are one sprite, so the ring can never detach / melt / change geometry. Limbs are procedural
 * rubber-hose curves (black with thin ivory rim, as in the official art). Faces are built from the
 * official eye / brow / nose / mouth pieces placed on an inpainted blank face, plus a few vector
 * mouth + closed-eye shapes for expressions that do not exist in the reference.
 */
const MB = (() => {
  const IMG = {}; let P = null;
  const NAMES = ['head_front','head_front_blank','head_back','fist','glove','shoe','shoe_sole',
                 'eye_l','eye_r','brow_l','brow_r','nose','mouth','cheek_r'];
  const RN = 284, RW = 150, S = RW / RN;          // native radius, world radius, native->world scale
  const IVORY = '#f5e4d5', TAUPE = '#b0a096', INK = '#050505';
  const LEG = 95;                                  // floor -> body bottom
  async function load(base, parts) {
    P = parts.parts;
    await Promise.all(NAMES.map(n => new Promise((res, rej) => {
      const i = new Image(); i.onload = res; i.onerror = () => rej(new Error('img ' + n)); i.src = base + n + '.png'; IMG[n] = i; })));
  }
  const ANCH = { // native px relative to body centre, official (un-mirrored) orientation
    front: { armA: [-205, 95], armB: [195, 150], hipA: [-72, 250], hipB: [58, 258] },
    back:  { armA: [-215, 80], armB: [215, 80],  hipA: [-62, 255], hipB: [62, 255] } };

  function hose(ctx, ax, ay, hx, hy, bend, w) {
    const dx = hx - ax, dy = hy - ay, len = Math.hypot(dx, dy) || 1;
    const mx = (ax + hx) / 2 - dy / len * bend * len, my = (ay + hy) / 2 + dx / len * bend * len;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, hx, hy);
    ctx.strokeStyle = IVORY; ctx.lineWidth = w + 5; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
  }
  function sprite(ctx, name, x, y, sc, rot, flip, ax, ay) {
    const im = IMG[name], p = P[name];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(sc * (flip ? -1 : 1), sc);
    ctx.drawImage(im, -(ax === undefined ? p.w / 2 : ax), -(ay === undefined ? p.h / 2 : ay)); ctx.restore();
  }
  function openHand(ctx, x, y, sc, rot, flip) { // vector open glove (for waving / presenting), official glove colours
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(sc * (flip ? -1 : 1), sc);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const shape = () => { ctx.beginPath();
      const fingers = [[-58, -52, -0.42], [-14, -78, -0.08], [34, -66, 0.3]];
      ctx.ellipse(0, 18, 70, 62, 0, 0, 7);
      for (const [fx, fy, fr] of fingers) { ctx.moveTo(fx, fy); ctx.ellipse(fx, fy, 27, 52, fr, 0, 7); }
      ctx.moveTo(74, 6); ctx.ellipse(74, 6, 24, 44, 1.05, 0, 7);            // thumb
      ctx.moveTo(0, 86); ctx.ellipse(0, 86, 52, 22, 0, 0, 7); };           // cuff roll
    shape(); ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke(); ctx.fillStyle = IVORY; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-38, -12); ctx.quadraticCurveTo(-34, -30, -36, -44); ctx.moveTo(8, -22); ctx.quadraticCurveTo(10, -40, 8, -54);
    ctx.moveTo(-46, 70); ctx.quadraticCurveTo(0, 82, 46, 70); ctx.stroke();
    ctx.fillStyle = 'rgba(176,160,150,.35)'; ctx.beginPath(); ctx.ellipse(18, 40, 40, 22, -0.3, 0, 7); ctx.fill();
    ctx.restore();
  }
  function star(ctx, x, y, r, rot, alpha, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.16 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col || '#fff'; ctx.fill(); ctx.restore();
  }

  function face(ctx, e) { // drawn in native head-local coords
    const eye = (name, open, isL) => { const p = P[name];
      if (open > 0.2) { ctx.save(); ctx.translate(p.ox, p.oy); ctx.scale(1 + 0.08 * (1 - Math.min(open, 1)) + (open > 1 ? (open - 1) * 0.5 : 0), open); ctx.drawImage(IMG[name], -p.ax, -p.ay); ctx.restore(); return; }
      ctx.save(); ctx.translate(p.ox, p.oy + 14); ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      const hw = isL ? 34 : 44, st = e.closed || 'arc';
      if (st === 'tight') { const d = isL ? 1 : -1; ctx.moveTo(-hw * d, -26); ctx.lineTo(hw * d * 0.7, 0); ctx.lineTo(-hw * d, 26); }
      else if (st === 'happy') { ctx.moveTo(-hw, 12); ctx.quadraticCurveTo(0, -40, hw, 12); }
      else { ctx.moveTo(-hw, -4); ctx.quadraticCurveTo(0, 30, hw, -4); }
      ctx.stroke(); ctx.restore(); };
    eye('eye_l', e.eyeL === undefined ? 1 : e.eyeL, true); eye('eye_r', e.eyeR === undefined ? 1 : e.eyeR, false);
    const brow = (name, sgn) => { const p = P[name]; ctx.save();
      ctx.translate(p.ox + (e.browAng || 0) * sgn * 22, p.oy - (e.browUp || 0) + Math.abs(e.browAng || 0) * 58); ctx.rotate((e.browAng || 0) * sgn);
      ctx.drawImage(IMG[name], -p.ax, -p.ay); ctx.restore(); };
    brow('brow_l', 1); brow('brow_r', -1);
    const n = P.nose, nz = e.nose || {}; ctx.save(); ctx.translate(n.ox + (nz.dx || 0), n.oy + (nz.dy || 0)); ctx.scale(nz.s || 1, nz.s || 1); ctx.drawImage(IMG.nose, -n.ax, -n.ay); ctx.restore();
    const m = P.mouth, mx = m.ox, my = m.oy, open = e.open === undefined ? 1 : e.open, kind = e.mouth || 'smile';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK;
    const tongue = (cx, cy, rx, ry) => { ctx.save(); ctx.clip(); ctx.fillStyle = TAUPE; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill(); ctx.restore(); };
    if (kind === 'smile') { const k = 0.3 + 0.7 * open; ctx.save(); ctx.translate(mx, my - m.h / 2); ctx.scale(1, k); ctx.drawImage(IMG.mouth, -m.ax, 0); ctx.restore();
      const c = P.cheek_r; ctx.drawImage(IMG.cheek_r, c.ox - c.ax, c.oy - c.ay); }
    else if (kind === 'o') { ctx.beginPath(); ctx.ellipse(mx - 30, my - 28, 24 + 16 * open, 16 + 40 * open, 0, 0, 7); ctx.fill(); if (open > 0.5) tongue(mx - 30, my + 30 * open, 30, 22); }
    else if (kind === 'big') { ctx.beginPath(); ctx.ellipse(mx - 26, my - 6, 92, 26 + 74 * open, 0, 0, 7); ctx.fill(); tongue(mx - 20, my + 70 * open, 62, 40); }
    else if (kind === 'line' || (kind === 'shout' && open < 0.14)) { ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(mx - 118, my - 44); ctx.quadraticCurveTo(mx - 20, my - 78, mx + 78, my - 52); ctx.stroke(); }
    else if (kind === 'shout') { const h = 26 + 84 * open; ctx.beginPath(); ctx.moveTo(mx - 120, my - 62); ctx.quadraticCurveTo(mx - 20, my - 84, mx + 84, my - 66);
      ctx.quadraticCurveTo(mx + 70, my - 62 + h, mx - 20, my - 58 + h); ctx.quadraticCurveTo(mx - 104, my - 62 + h, mx - 120, my - 62); ctx.closePath(); ctx.fill(); tongue(mx - 16, my - 44 + h, 56, 30);
      ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(mx - 96, my - 62); ctx.quadraticCurveTo(mx - 20, my - 80, mx + 66, my - 64); ctx.quadraticCurveTo(mx - 20, my - 56, mx - 96, my - 62); ctx.fill(); }
    else if (kind === 'smirk') { ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(mx - 130, my - 74); ctx.quadraticCurveTo(mx - 20, my + 8, mx + 110, my - 84); ctx.stroke();
      const c = P.cheek_r; ctx.drawImage(IMG.cheek_r, c.ox - c.ax, c.oy - c.ay); }
    else if (kind === 'wobble') { ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(mx - 110, my - 50); ctx.bezierCurveTo(mx - 70, my - 80, mx - 50, my - 20, mx - 15, my - 52); ctx.bezierCurveTo(mx + 15, my - 80, mx + 40, my - 30, mx + 70, my - 56); ctx.stroke(); }
  }

  /* pose p: {x,y,rot,sx,sy,dir(1=facing right),view('front'|'back'),expr,face(bool: use official baked face),
   *          hands:{L:{x,y,kind,rot,front,bend,s},R:{...}}, feet:{L:{x,y,rot,sole},R:{...}}, glint, between(ctx) }
   * hands / feet are WORLD coordinates. */
  function draw(ctx, p) {
    const view = p.view || 'front', f = (p.dir === undefined ? 1 : p.dir) > 0 ? -1 : 1; // f=-1 -> mirrored official art
    const rot = p.rot || 0, c = Math.cos(rot), s = Math.sin(rot), sx = (p.sx || 1) * S * f, sy = (p.sy || 1) * S;
    const L2W = (lx, ly) => { const x = lx * sx, y = ly * sy; return [p.x + x * c - y * s, p.y + x * s + y * c]; };
    const A = ANCH[view], W = 24;
    const pick = (a, b, left) => ((a[0] * f < b[0] * f) === left ? a : b);   // anchor that lands on screen-left / right
    const hands = p.hands || {}, feet = p.feet || {};
    // legs + shoes (behind body)
    for (const side of ['L', 'R']) { const ft = feet[side]; if (!ft) continue;
      const hip = L2W(...pick(A.hipA, A.hipB, side === 'L')), sp = P[ft.sole ? 'shoe_sole' : 'shoe'], fr = ft.rot || 0, ff = (ft.flip ? -1 : 1) * f, fs = S * (ft.s || 1);
      const ox = ft.sole ? sp.w * 0.5 : sp.w * 0.47, oy = ft.sole ? sp.h * 0.5 : sp.h - 9;       // sprite origin = sole contact point
      const cx = (sp.ax - ox) * fs * ff, cy = (sp.ay - oy) * fs, cu = [ft.x + cx * Math.cos(fr) - cy * Math.sin(fr), ft.y + cx * Math.sin(fr) + cy * Math.cos(fr)];
      hose(ctx, hip[0], hip[1], cu[0] - 6 * ff, cu[1] + 8, (ft.bend === undefined ? 0.1 : ft.bend), W);
      sprite(ctx, ft.sole ? 'shoe_sole' : 'shoe', ft.x, ft.y, fs, fr, ff < 0, ox, oy); }
    const arm = (side) => { const h = hands[side]; if (!h) return; const a = L2W(...pick(A.armA, A.armB, side === 'L'));
      hose(ctx, a[0], a[1], h.x, h.y, h.bend === undefined ? (side === 'L' ? -0.2 : 0.2) : h.bend, W); };
    const hand = (side) => { const h = hands[side]; if (!h) return; const k = h.kind || 'glove', hf = (h.flip ? -1 : 1) * f < 0, sc = S * (h.s || 1);
      if (k === 'open') openHand(ctx, h.x, h.y, sc * 1.05, h.rot || 0, hf); else sprite(ctx, k, h.x, h.y, sc, h.rot || 0, hf); };
    for (const side of ['L', 'R']) if (hands[side] && !hands[side].front) arm(side);
    for (const side of ['L', 'R']) if (hands[side] && hands[side].behind) hand(side);
    // head unit (moon + ring)
    const name = view === 'back' ? 'head_back' : (p.face ? 'head_front' : 'head_front_blank'), hp = P[name];
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.drawImage(IMG[name], -hp.ax, -hp.ay);
    if (view === 'front' && !p.face) face(ctx, p.expr || {});
    ctx.restore();
    if (p.glint) { const g = L2W(view === 'back' ? 330 : 352, view === 'back' ? 30 : -6), k = Math.sin(Math.PI * Math.min(1, p.glint));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(g[0], g[1], 0, g[0], g[1], 150 * k + 1); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(g[0] - 160, g[1] - 160, 320, 320);
      star(ctx, g[0], g[1], 150 * k, p.glint * 1.2, 1); star(ctx, g[0], g[1], 70 * k, p.glint * 1.2 + Math.PI / 4, 0.9);
      const g2 = L2W(-300, 150); star(ctx, g2[0], g2[1], 60 * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, p.glint * 1.4 - 0.4)))), 0.3, 0.9); ctx.restore(); }
    if (p.between) p.between(ctx, L2W);
    for (const side of ['L', 'R']) if (hands[side] && hands[side].front) arm(side);
    for (const side of ['L', 'R']) if (hands[side] && !hands[side].behind) hand(side);
    return L2W;
  }
  /* official floor look: taupe light pool with black contact shadows */
  function shadow(ctx, x, floorY, w, alpha, lift) {
    ctx.save(); ctx.globalAlpha *= (alpha === undefined ? 1 : alpha) * 0.5; ctx.fillStyle = TAUPE;
    ctx.beginPath(); ctx.ellipse(x, floorY + 4, w, w * 0.14, 0, 0, 7); ctx.fill();
    ctx.globalAlpha *= 1.7; ctx.fillStyle = '#000'; const k = 1 - Math.min(0.75, (lift || 0) / 500);
    ctx.beginPath(); ctx.ellipse(x, floorY + 5, w * 0.62 * k, w * 0.07 * k, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  return { load, draw, shadow, star, hose, sprite, openHand, IMG, S, RW, LEG, IVORY, TAUPE, INK, parts: () => P };
})();
if (typeof module !== 'undefined') module.exports = MB;
