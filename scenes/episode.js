/* MOONBOY EP.01 "First Day on the Job" — scene animation.  draw(ctx, t) renders one frame at episode time t (s).
 * Depends on MB (rig/moonboy_rig.js) and TL (scenes/timeline.js). Fully deterministic: same t -> same frame. */
const EP = (() => {
  const { W, H, FLOOR, BODY_Y, TABLE, BOOK, SURF_Y, T } = TL;
  let VOICE = null, bookArt = null, logo = null;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a)), sm = (k) => k * k * (3 - 2 * k), eio = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eout = (k) => 1 - Math.pow(1 - k, 3), back = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------------- voice / lip flap ---------------- */
  function voStart(v) { if (v.t !== null) return v.t; const L = VOICE.lines[v.id], env = L.env100; let k = 0; for (let i = 1; i < env.length; i++) if (env[i] > env[k]) k = i; return T.SNEEZE - k / 100; }
  function lip(id, t) { const v = TL.VO.find(o => o.id === id), L = VOICE.lines[id], s = voStart(v), i = Math.floor((t - s) * 100);
    if (i < 0 || i >= L.env100.length) return 0; const e = L.env100[i]; return clamp(Math.pow(e, 0.6) * 1.25); }
  function talking(t) { for (const v of TL.VO) { const s = voStart(v), d = VOICE.lines[v.id].dur; if (t >= s && t < s + d) return lip(v.id, t); } return 0; }

  /* ---------------- master prop art (original fictional manga, drawn once) ---------------- */
  function makeBookArt() {
    const c = document.createElement('canvas'); c.width = 520; c.height = 728; const g = c.getContext('2d'), w = 520, h = 728;
    g.fillStyle = '#efe3c9'; g.fillRect(0, 0, w, h);
    const grd = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 520); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(120,80,30,.28)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 46, h);                         // spine band
    g.fillStyle = '#b8402f'; g.fillRect(46, 40, w - 46, 170);                  // title band
    g.fillStyle = '#efe3c9'; g.font = '900 92px "Titan One", sans-serif'; g.textAlign = 'center'; g.fillText('COSMO', 46 + (w - 46) / 2, 125);
    g.font = '900 62px "Titan One", sans-serif'; g.fillText('KID', 46 + (w - 46) / 2, 190);
    // starburst + little rocket kid (original)
    g.save(); g.translate(300, 455); g.fillStyle = '#1a1a1a';
    g.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 120 : 175; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    g.fillStyle = '#efe3c9'; g.beginPath(); g.arc(0, 0, 105, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(0, 10, 46, 80, 0.5, 0, 7); g.fill();
    g.fillStyle = '#efe3c9'; g.beginPath(); g.arc(14, -12, 18, 0, 7); g.fill();
    g.fillStyle = '#b8402f'; g.beginPath(); g.moveTo(-40, 64); g.lineTo(-78, 120); g.lineTo(-20, 86); g.fill(); g.beginPath(); g.moveTo(-10, 80); g.lineTo(-40, 150); g.lineTo(14, 92); g.fill();
    g.restore();
    g.fillStyle = '#1a1a1a'; g.font = '700 38px Montserrat, sans-serif'; g.textAlign = 'left'; g.fillText('VOL. 1', 72, 690);
    g.textAlign = 'right'; g.font = '700 26px Montserrat, sans-serif'; g.fillText('FIRST PRINTING', w - 26, 690);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    return c;
  }
  function drawBook(ctx, x, y, rot, sy, opts = {}) {
    const bw = BOOK.w * (opts.s || 1), bh = BOOK.h * (opts.s || 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, sy);
    ctx.fillStyle = '#050505'; ctx.fillRect(-bw / 2 - 5, -bh / 2 - 5, bw + 10, bh + 10);                 // ink outline
    ctx.fillStyle = '#d9ccb2'; ctx.fillRect(-bw / 2 + 4, bh / 2 - 2, bw - 4, 6 / Math.max(sy, .3));    // page block
    ctx.drawImage(bookArt, -bw / 2, -bh / 2, bw, bh);
    if (opts.shine) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(-bw, -bh, bw, bh); const k = opts.shine;
      g.addColorStop(clamp(k - .15), 'rgba(255,255,255,0)'); g.addColorStop(clamp(k), 'rgba(255,255,255,.55)'); g.addColorStop(clamp(k + .15), 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); }
    ctx.restore();
  }
  function drawSleeve(ctx, x, y, s, drop, shine) {   // clear archival sleeve, silver edge
    const bw = BOOK.w * s + 26, bh = BOOK.h * s + 30, oy = -drop;
    ctx.save(); ctx.translate(x, y + oy);
    ctx.fillStyle = 'rgba(220,230,240,.16)'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = 'rgba(235,240,245,.95)'; ctx.lineWidth = 4; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-bw / 2 + 10, -bh / 2 + 18); ctx.lineTo(bw / 2 - 10, -bh / 2 + 18); ctx.stroke();
    const g = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2), k = shine === undefined ? .3 : shine;
    g.addColorStop(clamp(k - .2), 'rgba(255,255,255,0)'); g.addColorStop(clamp(k), 'rgba(255,255,255,.42)'); g.addColorStop(clamp(k + .2), 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.restore();
  }

  /* ---------------- environment: minimal black & silver collector studio ---------------- */
  function studio(ctx, t, spot) {
    ctx.fillStyle = '#000'; ctx.fillRect(-2000, -2000, 6000, 6000);
    // back wall silver pinstripe panels
    ctx.save(); ctx.globalAlpha = 0.5 * spot;
    for (let i = 0; i < 9; i++) { const x = 60 + i * 120; const g = ctx.createLinearGradient(0, 500, 0, FLOOR); g.addColorStop(0, 'rgba(160,160,170,0)'); g.addColorStop(.6, 'rgba(160,160,170,.16)'); g.addColorStop(1, 'rgba(160,160,170,0)');
      ctx.fillStyle = g; ctx.fillRect(x, 500, 2, FLOOR - 500); }
    // display shelves with tiny silver-edged slabs (collector vibe)
    for (const sy of [880, 1080]) { ctx.fillStyle = 'rgba(190,190,200,.35)'; ctx.fillRect(40, sy, 1000, 3);
      for (let i = 0; i < 7; i++) { const x = 90 + i * 140 + (sy === 1080 ? 60 : 0), hh = 110 - (i % 3) * 14; ctx.strokeStyle = 'rgba(200,200,210,.45)'; ctx.lineWidth = 2; ctx.strokeRect(x, sy - hh, 70, hh);
        ctx.fillStyle = 'rgba(200,200,210,.08)'; ctx.fillRect(x + 6, sy - hh + 6, 58, hh - 22);
        const tw = (Math.sin(t * 1.7 + i * 2.1 + sy) + 1) / 2; MB.star(ctx, x + 60, sy - hh + 8, 9 * tw * tw, 0, .8); } }
    ctx.restore();
    // floor
    const fg = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 500); fg.addColorStop(0, `rgba(40,40,44,${spot})`); fg.addColorStop(1, 'rgba(0,0,0,1)'); ctx.fillStyle = fg; ctx.fillRect(-2000, FLOOR, 6000, 1500);
    ctx.fillStyle = `rgba(200,200,210,${.35 * spot})`; ctx.fillRect(-2000, FLOOR, 6000, 2);
  }
  function spotlight(ctx, t, x, k) {   // cone + pool, drawn additively over the studio
    if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, `rgba(255,248,236,${.16 * k})`); g.addColorStop(1, `rgba(255,248,236,${.05 * k})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 70, -200); ctx.lineTo(x + 70, -200); ctx.lineTo(x + 470, FLOOR + 40); ctx.lineTo(x - 470, FLOOR + 40); ctx.closePath(); ctx.fill();
    const r = ctx.createRadialGradient(x, FLOOR, 10, x, FLOOR, 520); r.addColorStop(0, `rgba(255,246,230,${.22 * k})`); r.addColorStop(1, 'rgba(255,246,230,0)');
    ctx.fillStyle = r; ctx.beginPath(); ctx.ellipse(x, FLOOR + 10, 520, 120, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  function table(ctx, front) {   // black lacquer worktable, chrome trim. front=false: top+back legs, true: front apron
    const { x0, x1, top, back } = TABLE;
    if (!front) {
      ctx.fillStyle = '#9a9aa2'; ctx.fillRect(x0 + 40, back, 8, FLOOR - back); ctx.fillRect(x1 - 48, back, 8, FLOOR - back - 6);
      ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.moveTo(x0 + 18, back); ctx.lineTo(x1 - 18, back); ctx.lineTo(x1, top); ctx.lineTo(x0, top); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, back, 0, top); g.addColorStop(0, 'rgba(255,255,255,.02)'); g.addColorStop(1, 'rgba(255,255,255,.10)'); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(220,220,230,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 18, back); ctx.lineTo(x1 - 18, back); ctx.stroke();
      // felt mat
      ctx.fillStyle = 'rgba(60,60,66,.9)'; ctx.beginPath(); ctx.moveTo(x0 + 80, back + 8); ctx.lineTo(x0 + 300, back + 8); ctx.lineTo(x0 + 310, top - 8); ctx.lineTo(x0 + 66, top - 8); ctx.closePath(); ctx.fill();
      return; }
    const g = ctx.createLinearGradient(0, top, 0, top + 34); g.addColorStop(0, '#e6e6ec'); g.addColorStop(.35, '#7c7c86'); g.addColorStop(1, '#2a2a30');
    ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, 12); ctx.fillStyle = '#0b0b0d'; ctx.fillRect(x0 + 4, top + 12, x1 - x0 - 8, 30);
    ctx.fillStyle = 'rgba(210,210,220,.7)'; ctx.fillRect(x0 + 4, top + 41, x1 - x0 - 8, 2);
    const lg = ctx.createLinearGradient(x0, 0, x0 + 14, 0); lg.addColorStop(0, '#5a5a62'); lg.addColorStop(.5, '#f0f0f4'); lg.addColorStop(1, '#4a4a52');
    ctx.fillStyle = lg; ctx.fillRect(x0 + 10, top + 43, 12, FLOOR - top - 43); ctx.save(); ctx.translate(x1 - 32, 0); ctx.fillRect(0, top + 43, 12, FLOOR - top - 43); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, FLOOR + 4, (x1 - x0) / 2 + 20, 12, 0, 0, 7); ctx.fill();
  }

  /* ---------------- MOONBOY pose helpers ---------------- */
  function locW(p, lx, ly) { const d = p.dir === undefined ? 1 : p.dir, r = p.rot || 0, X = lx * d, Y = ly; return [p.x + X * Math.cos(r) - Y * Math.sin(r), p.y + X * Math.sin(r) + Y * Math.cos(r)]; }
  function hand(p, lx, ly, o = {}) { const [x, y] = locW(p, lx, ly); return Object.assign({ x, y }, o); }
  function feetStand(x, spread = 44) { return { L: { x: x - spread, y: FLOOR }, R: { x: x + spread, y: FLOOR } }; }
  function feetWalk(x, ph, dir, stride = 46, lift = 34) {
    const f = {}; for (const [s, o] of [['L', 0], ['R', Math.PI]]) { const a = ph + o; f[s] = { x: x + (s === 'L' ? -26 : 26) + dir * stride * Math.sin(a), y: FLOOR - lift * Math.max(0, Math.cos(a)), rot: dir * 0.25 * Math.max(0, Math.cos(a)) * Math.sin(a) }; } return f;
  }
  function idleArms(p, t, o = {}) { const b = Math.sin(t * 3) * 4; return { L: hand(p, -178, 72 + b, { kind: 'glove', bend: -0.22 }), R: hand(p, 182, 84 - b, { kind: 'glove', bend: 0.22 }), ...o }; }
  const BASE = { face: false };
  function exprTalk(open, extra = {}) { return Object.assign({ mouth: 'smile', open: 0.25 + 0.75 * open }, extra); }

  /* ---------------- per-frame character + book state ---------------- */
  function scene(t) {
    const S = { mb: null, book: null, bookFront: true, fx: [] };
    const blink = (t0) => { const k = ((t + t0) % 3.7); return k < 0.09 ? Math.max(.25, Math.abs(k - .045) / .045) : 1; };
    const talk = talking(t);

    if (t < T.walk0) {                                                     // SCENE 01 — hop in, trip, wave
      let x, y = BODY_Y, rot = 0, sx = 1, sy = 1, feet, hands, expr, dir = 1, face = false;
      if (t < T.hopIn) { x = -320; }
      else if (t < T.hopLand) { const k = seg(t, T.hopIn, T.hopLand), n = 3, hk = (k * n) % 1, hop = Math.floor(k * n);
        x = lerp(-280, 300, eout(k)); const hh = [230, 170, 110][Math.min(2, hop)]; y = BODY_Y - hh * 4 * hk * (1 - hk);
        const sq = hk < .12 || hk > .9 ? 1 : 0; sx = 1 + .12 * (1 - Math.abs(hk - .5) * 2) * -1 + (sq ? .12 : 0); sy = 2 - sx; rot = .12 * Math.sin(hk * Math.PI * 2);
        feet = { L: { x: x - 40, y: y + 290 - 20 * Math.sin(hk * Math.PI), rot: -.2 }, R: { x: x + 38, y: y + 290 - 34 * Math.sin(hk * Math.PI), rot: .2 } };
        hands = { L: hand({ x, y, dir, rot }, -170, -10 - 60 * Math.sin(hk * Math.PI), { kind: 'glove', bend: -.3 }), R: hand({ x, y, dir, rot }, 175, -20 - 50 * Math.sin(hk * Math.PI), { kind: 'glove', bend: .3 }) };
        expr = { mouth: 'smile', open: 1, browUp: 10 }; S.fx.push({ k: 'hopdust', t: t }); }
      else if (t < T.recover) { const k = seg(t, T.trip, T.recover); x = 300 + 40 * eout(seg(t, T.hopLand, T.trip + .2));
        rot = 0.55 * Math.sin(Math.PI * clamp(k * 1.15)); y = BODY_Y + 30 * Math.sin(Math.PI * k);
        feet = { L: { x: x - 70 + 40 * k, y: FLOOR, rot: 0 }, R: { x: x + 90 - 60 * k, y: FLOOR - 70 * Math.sin(Math.PI * k), rot: .5 * Math.sin(Math.PI * k), sole: k > .1 && k < .8 } };
        const fl = Math.sin(t * 38) * 40; hands = { L: hand({ x, y, dir, rot }, -170, -120 + fl, { kind: 'open', rot: -.5, bend: -.3 }), R: hand({ x, y, dir, rot }, 170, -140 - fl, { kind: 'open', rot: .5, bend: .3 }) };
        expr = { eyeL: 1.25, eyeR: 1.25, mouth: 'o', open: .9, browUp: 24 }; }
      else { x = 340; dir = -1; const k = seg(t, T.recover, T.wave);   // pretend nothing happened -> official pose -> wave
        y = BODY_Y - 6 * Math.sin(Math.PI * k); feet = feetStand(x, 46);
        const P = { x, y, dir, rot: 0 };
        if (t < T.wave) { expr = { mouth: 'smirk', browUp: 14, eyeL: blink(0), eyeR: blink(0) }; hands = { L: hand(P, -165, 40, { kind: 'glove', bend: -.25 }), R: hand(P, 175, 70, { kind: 'glove', bend: .2 }) }; }
        else { const w = Math.sin((t - T.wave) * 14), on = seg(t, T.wave, T.wave + .25) * (1 - seg(t, 4.75, 4.98));
          hands = { L: hand(P, lerp(-180, -205, on), lerp(70, -170, on) + 14 * w * on, { kind: on > .4 ? 'open' : 'glove', rot: -.25 + .35 * w * on, bend: -.35 }), R: hand(P, 178, 84, { kind: 'glove', bend: .2 }) };
          expr = exprTalk(talk, { browUp: 8, eyeL: blink(.5), eyeR: blink(.5) }); if (t > 4.85) { expr = null; face = true; hands.L = hand(P, -172, -110, { kind: 'fist', bend: -.3, rot: 0 }); } }
        S.mb = { x, y, dir, rot: 0, feet, hands, expr, face }; }
      if (!S.mb) S.mb = { x, y, dir, rot, sx, sy, feet: feet || feetStand(x), hands: hands || idleArms({ x, y, dir, rot }, t), expr: expr || {}, face };
      S.book = { mode: 'table', ...TL.bookFree(t) }; return S;
    }
    if (t < 9.0) {                                                         // SCENE 02 — walk to table, adjust gloves
      let x, y = BODY_Y, dir = 1, feet, hands, expr;
      const k = seg(t, T.walk0, T.walk1); x = lerp(340, 255, sm(k)); const walking = k > 0 && k < 1, ph = (t - T.walk0) * 11;
      if (t < T.walk0 + .2) dir = -1;
      if (walking) { y -= 9 * Math.abs(Math.sin(ph)); feet = feetWalk(x, ph, dir); } else feet = feetStand(x, 42);
      const P = { x, y, dir, rot: 0 };
      if (t < T.glove0) { hands = { L: hand(P, -175, 70 + 26 * Math.sin(ph), { kind: 'glove' }), R: hand(P, 178, 80 - 26 * Math.sin(ph), { kind: 'glove' }) }; expr = { mouth: 'smile', open: .7, eyeL: blink(0), eyeR: blink(0) }; }
      else { const a = seg(t, T.glove0, T.glove0 + .35), tug = Math.sin((t - T.glove0) * 16) * seg(t, T.glove0 + .3, T.glove0 + .5) * (1 - seg(t, 7.6, 7.8)), b = 1 - seg(t, 8.25, 8.6);
        hands = { L: hand(P, lerp(-175, 40, a * b), lerp(70, 40, a * b) + tug * 10, { kind: 'glove', bend: -.15, front: true, rot: .3 }), R: hand(P, lerp(178, 120, a * b), lerp(80, 50, a * b), { kind: 'open', rot: lerp(0, 1.2, a * b) - tug * .2, bend: .2 }) };
        expr = exprTalk(talk, { browUp: 16 * a, eyeL: blink(1.3), eyeR: blink(1.3) });
        if (t > 7.75 && t < 8.3) S.fx.push({ k: 'glovesparkle', x: locW(P, 120, 30)[0], y: locW(P, 120, 30)[1], a: seg(t, 7.75, 8.3) }); }
      S.mb = { x, y, dir, rot: 0, feet, hands, expr }; S.book = { mode: 'table', ...TL.bookFree(t) }; return S;
    }
    if (t < 14.0) {                                                        // SCENE 03 — THE SNEEZE (one continuous shot)
      const x0 = 255; let x = x0, y = BODY_Y, rot = 0, sx = 1, sy = 1, expr, hands, feet = feetStand(x0, 42);
      const lean = sm(seg(t, T.lean0, T.lean1));
      const inhale = seg(t, 10.0, T.SNEEZE - .08);                         // ah... aah... head tilts back, swells
      const burst = seg(t, T.SNEEZE - .08, T.SNEEZE + .06), recoil = seg(t, T.SNEEZE + .06, T.SNEEZE + .7);
      rot = lean * .16 - .22 * sm(inhale) * (1 - burst) + .30 * burst * (1 - sm(recoil)) + (.16 * (sm(recoil)) - .16 * sm(recoil)) ;
      x = x0 + 22 * lean - 10 * inhale + 26 * burst * (1 - recoil);
      sy = 1 + .07 * inhale * (1 - burst) - .1 * burst * (1 - recoil); sx = 2 - sy;
      const P = { x, y, dir: 1, rot };
      const n = t < 10 ? 0 : Math.sin(t * 40) * .5 + .5;
      if (t < T.SNEEZE - .08) { const tw = seg(t, T.twitch0, 10.2);
        expr = { mouth: t < 10.0 ? 'smile' : 'o', open: t < 10.0 ? .6 : .3 + .5 * lip('03a_ah', t), eyeL: lerp(1, .45, inhale), eyeR: lerp(1, .45, inhale), browUp: 20 * inhale, nose: { s: 1 + .12 * n * tw + .1 * inhale, dy: -6 * n * tw } };
        hands = { L: hand(P, -170, 60, { kind: 'glove', bend: -.2 }), R: hand(P, 170 - 30 * inhale, 60 - 60 * inhale, { kind: 'glove', bend: .25 }) };
        if (tw > 0) S.fx.push({ k: 'twitch', p: P, a: tw * (1 - inhale * .3), t }); }
      else if (t < T.SNEEZE + .7) { expr = { eyeL: 0, eyeR: 0, closed: 'tight', mouth: 'shout', open: 1 - .6 * recoil, browUp: -6 };
        hands = { L: hand(P, -200, -40, { kind: 'open', rot: -.6, bend: -.4 }), R: hand(P, 200, -60, { kind: 'open', rot: .6, bend: .4 }) };
        feet = { L: { x: x0 - 42, y: FLOOR }, R: { x: x0 + 52, y: FLOOR - 40 * burst * (1 - recoil), rot: .3 * burst * (1 - recoil) } }; }
      else if (t < T.notice) { const o = seg(t, T.SNEEZE + .7, T.notice - .1); expr = { mouth: 'smile', open: .3, eyeL: lerp(.2, 1, o), eyeR: lerp(.2, 1, o), browUp: 4 }; hands = idleArms(P, t); }
      else { const k = seg(t, T.notice, T.notice + .18), hold = Math.sin((t - T.notice) * 30) * (1 - seg(t, T.notice + .3, T.notice + .8)) * 3;   // the take: eyes pop
        expr = { eyeL: lerp(1, 1.35, k), eyeR: lerp(1, 1.35, k), mouth: 'o', open: lerp(.2, 1, k), browUp: 34 * k }; S.mb_jitter = hold;
        sy = 1 + .1 * k * (1 - seg(t, T.notice + .2, T.notice + .6)); sx = 2 - sy;
        hands = { L: hand(P, -190, -90 * k, { kind: 'open', rot: -.4, bend: -.4 }), R: hand(P, 195, -110 * k, { kind: 'open', rot: .4, bend: .4 }) }; }
      S.mb = { x: x + (S.mb_jitter || 0), y, dir: 1, rot, sx, sy, feet, hands, expr };
      if (t >= T.SNEEZE - .02 && t < T.SNEEZE + .9) S.fx.push({ k: 'gust', from: locW(P, 70, -8), t: t - T.SNEEZE });
      const b = TL.bookFree(t); S.book = b; if (b.mode === 'slide' || (b.mode === 'air' && t < T.edge + .3)) S.fx.push({ k: 'slidelines', b });
      return S;
    }
    if (t < T.launch) {                                                    // SCENE 04 — serious mode (+ slow-mo book)
      const x = 255; let y = BODY_Y, sy = 1, sx = 1; const P = { x, y, dir: 1, rot: 0 };
      const sk = sm(seg(t, T.serious, T.serious + .45)), cr = seg(t, T.crouch, T.launch);
      const expr = { eyeL: lerp(1.2, .72, sk), eyeR: lerp(1.2, .72, sk), browAng: -.32 * sk, browUp: lerp(20, -6, sk),
        mouth: talk > .02 ? 'shout' : (sk > .5 ? 'line' : 'o'), open: talk > .02 ? .25 + .75 * talk : .25 * (1 - sk) };
      sy = 1 - .16 * sm(cr); sx = 1 + .1 * sm(cr); y += 40 * sm(cr);
      const P2 = { x, y, dir: 1, rot: .1 * cr };
      const hands = { L: hand(P2, lerp(-175, -150, sk), lerp(70, 40, sk) + 40 * cr, { kind: sk > .5 ? 'fist' : 'glove', bend: -.25 }), R: hand(P2, lerp(178, 160, sk), lerp(84, 30, sk) + 40 * cr, { kind: sk > .5 ? 'fist' : 'glove', bend: .25 }) };
      S.mb = { x, y, dir: 1, rot: .1 * cr, sx, sy, feet: feetStand(x, 42 + 14 * cr), hands, expr, glint: t > T.glint && t < T.glint + .8 ? (t - T.glint) / .8 : 0 };
      S.book = TL.bookFree(t); S.slowmo = 1; return S;
    }
    // ---------------- SCENE 05 — the rescue ----------------
    const bc = TL.bookFree(T.CATCH);                                       // catch point (deterministic)
    if (t < T.upright1 + .55) {
      let x, y, rot, view = 'front', expr, hands, feet, sx = 1, sy = 1, book;
      if (t < T.CATCH) { const k = seg(t, T.launch, T.CATCH), e = eout(k);
        x = lerp(255, bc.x - 210, e); y = lerp(BODY_Y + 40, bc.y - 70, e) - 190 * Math.sin(Math.PI * Math.min(1, k * 1.1)) * (1 - k * .4); rot = lerp(.1, 1.3, sm(k));
        sx = 1 + .18 * Math.sin(Math.PI * k); sy = 2 - sx;
        const P = { x, y, dir: 1, rot };
        const sh = locW(P, 190, 40), reach = clamp(k * 1.15);                         // stretchy rubber-hose reach -> lands exactly on the book
        const bk = TL.bookFree(t);
        hands = { R: { x: lerp(sh[0], bk.x - 30, eout(reach)), y: lerp(sh[1], bk.y + 6, eout(reach)), kind: 'open', rot: -.6 + .6 * reach, bend: .05, front: true }, L: hand(P, -190, -40, { kind: 'open', rot: -1, bend: -.4 }) };
        feet = { L: { x: x - 140 * Math.cos(rot), y: y + 210 - 60 * k, rot: -1.0 * k, sole: true }, R: { x: x - 220 * Math.cos(rot), y: y + 170 - 80 * k, rot: -1.3 * k, sole: true } };
        expr = { eyeL: .8, eyeR: .8, browAng: -.3, browUp: -4, mouth: 'shout', open: .45 };
        book = bk; S.fx.push({ k: 'dive', p: P, a: k }); }
      else if (t < T.land) { const k = seg(t, T.CATCH, T.land);                    // tumble: forward roll to upside down
        x = lerp(bc.x - 210, 800, sm(k)); y = lerp(bc.y - 70, FLOOR - 150, k * k); rot = lerp(1.3, Math.PI, sm(k)); view = rot > 2.25 ? 'back' : 'front';
        const P = { x, y, dir: 1, rot };
        const hx = lerp(bc.x - 30, 960, sm(k)), hy = lerp(bc.y + 6, 1180, sm(k));
        hands = { R: { x: hx, y: hy, kind: 'open', rot: -.3, bend: .1, front: view === 'front' }, L: hand(P, -200, 60, { kind: 'glove', bend: -.4 }) };
        feet = { L: { ...(function () { const q = locW(P, -60, 260); return { x: q[0], y: q[1] }; })(), rot: rot, sole: true }, R: { ...(function () { const q = locW(P, 60, 280); return { x: q[0], y: q[1] }; })(), rot: rot + .3, sole: true } };
        expr = { eyeL: 1.1, eyeR: 1.1, mouth: 'o', open: .5 + .5 * talk, browUp: 10 };
        if (talk > .02) expr = { eyeL: 1, eyeR: 1, mouth: 'big', open: .3 + .7 * talk, browUp: 18 };
        book = { x: hx + 26, y: hy - 34, rot: lerp(bc.rot, Math.PI * 2, sm(k)), sy: 1 }; }
      else if (t < T.upright0) {                                                   // upside-down, backside showing, book held high & safe
        const k = seg(t, T.land, T.land + .45), wob = Math.sin((t - T.land) * 18) * Math.exp(-(t - T.land) * 3);
        x = 800; y = FLOOR - 150 + 8 * wob; rot = Math.PI + .06 * wob; view = 'back'; sy = 1 - .14 * wob; sx = 1 + .1 * wob;
        const P = { x, y, dir: 1, rot };
        const kick = Math.sin((t - T.land) * 9) * seg(t, T.land + .6, T.land + 1.0) * (1 - seg(t, 21.6, 22.0));
        feet = { L: { x: x - 70 + 22 * kick, y: 1040 + 30 * kick, rot: Math.PI - .3, sole: true }, R: { x: x + 70 - 22 * kick, y: 1030 - 30 * kick, rot: Math.PI + .3, sole: true } };
        const hy = 1180 - 10 * Math.sin((t - T.land) * 5);
        hands = { R: { x: 960, y: hy, kind: 'open', rot: -.3, bend: -.15 }, L: { x: 650, y: 1420, kind: 'glove', rot: .6, bend: .3 } };
        book = { x: 986, y: hy - 34, rot: 0, sy: 1 };
        if (t > T.land && t < T.land + .5) S.fx.push({ k: 'impact', x: 800, y: FLOOR, a: seg(t, T.land, T.land + .5) });
        if (t > T.land + .2 && t < 21.2) S.fx.push({ k: 'dizzy', x: 800, y: FLOOR - 40, t }); }
      else {                                                                        // roll back upright
        const k = seg(t, T.upright0, T.upright1); rot = lerp(Math.PI, 2 * Math.PI, eio(k)); x = lerp(800, 780, k); y = lerp(FLOOR - 150, BODY_Y, sm(k)) - 120 * Math.sin(Math.PI * k);
        view = (rot < 1.5 * Math.PI + .6) ? 'back' : 'front'; const P = { x, y, dir: -1, rot: -rot };
        if (t > T.upright1) { rot = 0; x = 780; y = BODY_Y; view = 'front'; }
        const Pf = { x, y, dir: -1, rot: t > T.upright1 ? 0 : -rot };
        const hb = locW(Pf, 120, 30); hands = { R: { x: hb[0] - 50, y: hb[1], kind: 'glove', front: true, bend: .1 }, L: { x: hb[0] + 50, y: hb[1], kind: 'glove', front: true, bend: -.1 } };
        feet = t > T.upright1 ? feetStand(x, 44) : { L: { ...(function () { const q = locW(Pf, -50, 270); return { x: q[0], y: q[1] }; })(), rot: -rot, sole: true }, R: { ...(function () { const q = locW(Pf, 50, 280); return { x: q[0], y: q[1] }; })(), rot: -rot, sole: true } };
        expr = { mouth: 'smile', open: .5, eyeL: 'happy' === 0 ? 0 : (t > T.upright1 ? 0 : 1), eyeR: t > T.upright1 ? 0 : 1, closed: 'happy' };
        book = { x: hb[0], y: hb[1] - 20, rot: 0, sy: 1 };
        S.mb = { x, y, dir: -1, rot: t > T.upright1 ? 0 : -rot, view, feet, hands, expr }; S.book = { ...book, mode: 'held' }; S.bookFront = true; return S; }
      S.mb = { x, y, dir: 1, rot, sx, sy, view, feet, hands, expr }; S.book = { ...book, mode: t < T.CATCH ? 'air' : 'held' }; S.slowmo = t < T.CATCH ? 1 - seg(t, T.CATCH - .2, T.CATCH) : 0;
      if (t >= T.CATCH && t < T.CATCH + .35) S.fx.push({ k: 'catchstar', x: bc.x, y: bc.y, a: seg(t, T.CATCH, T.CATCH + .35) });
      return S;
    }
    // ---------------- SCENE 06 — the real collector ----------------
    if (t < T.fade0 + .5) {
      const EX = 578, EY = 1168;                                           // book resting on the chrome display easel
      let x = 312, y = BODY_Y, dir = 1, feet, expr, hands; const k = seg(t, T.walkBack0, T.walkBack1);
      if (t < T.walkBack1) { x = lerp(780, 312, sm(k)); dir = -1; const ph = (t - T.walkBack0) * 12; y -= 9 * Math.abs(Math.sin(ph)); feet = feetWalk(x, ph, -1); }
      else feet = feetStand(x, 44);
      const P = { x, y, dir, rot: 0 };
      const collector = sm(seg(t, T.walkBack1, T.walkBack1 + .3)), relief = seg(t, 29.55, 29.9), smile = seg(t, 30.55, 30.8);
      let book;
      hands = { L: hand(P, -176, 74 + 3 * Math.sin(t * 3), { kind: 'glove', bend: -.22 }), R: hand(P, 182, 84, { kind: 'glove', bend: .22 }) };
      if (t < T.walkBack1) { const hb = hand(P, 190, 10, { kind: 'glove', bend: .15 }); hands.R = hb; book = { x: hb.x - 40 * dir * -1 - 10, y: hb.y - 40, rot: .12 * dir, sy: 1, mode: 'held' }; book.x = hb.x + (dir < 0 ? -30 : 30); }
      else { const pl = sm(seg(t, T.walkBack1 + .02, T.walkBack1 + .35)), hp = hand(P, 190, 10);           // set it down on the easel
        book = { x: lerp(hp.x + 30, EX, pl), y: lerp(hp.y - 40, EY, pl), rot: lerp(.12, 0, pl), sy: 1, mode: pl < 1 ? 'held' : 'easel' };
        hands.R = { x: book.x - 52, y: book.y + 52, kind: 'glove', bend: .15, front: true };
        if (pl >= 1) hands.R = hand(P, 182, 84, { kind: 'glove', bend: .22 }); }
      // inspection checklist: corners, spine, paper edge, cover surface
      const bx = EX, by = EY, CK = [[T.check0 + .15, bx + 60, by - 86, 1, -1], [T.check0 + .8, bx - 60, by + 86, -1, 1], [T.check0 + 1.45, bx - 64, by - 6, -1, 0], [T.check0 + 2.1, bx + 66, by + 42, 1, 0], [T.check0 + 2.75, bx + 8, by - 22, 1, -1]];
      let look = [0, 0];
      for (let i = 0; i < CK.length; i++) { const [ts, cx, cy, ox, oy] = CK[i];
        if (t >= ts && t < ts + .65 && t < T.sleeve0) { const a = sm(seg(t, ts, ts + .3)), prev = i ? CK[i - 1] : null;
          const sx0 = prev ? prev[1] + 12 : hands.R.x, sy0 = prev ? prev[2] + 30 : hands.R.y;
          hands.R = { x: lerp(sx0, cx + 12, a), y: lerp(sy0, cy + 30, a), kind: 'glove', bend: .2, rot: -.5, s: .78 };
          look = [(cx - x) / 260, (cy - y) / 160]; S.fx.push({ k: 'scan', x: cx, y: cy, a: seg(t, ts + .12, ts + .62) }); }
        if (t >= ts + .42 && t < T.sleeve0 + .5) S.fx.push({ k: 'check', x: cx + ox * 50, y: cy + oy * 34 - (oy === 0 ? 0 : 0), a: seg(t, ts + .42, ts + .62), i }); }
      if (t >= T.check0 + 3.4 && t < T.sleeve0) { const a = sm(seg(t, T.check0 + 3.4, T.sleeve0)); hands.R = { x: lerp(bx + 20, x + 170, a), y: lerp(by + 8, y + 70, a), kind: 'glove', bend: .2, s: lerp(.78, 1, a) }; }
      const sl = seg(t, T.sleeve0, T.sleeve1);
      if (t >= T.sleeve0) { const drop = (1 - eout(sl)) * 270; S.sleeve = { x: bx, y: by, s: 1, drop, shine: seg(t, T.sleeve1, T.sleeve1 + .8) * 1.5 - .25 };
        if (t < T.sleeve1 + .25) hands.R = { x: bx + 54, y: by - BOOK.h / 2 - 16 - drop, kind: 'glove', bend: -.25, rot: -.3, s: .85 };
        else { const a = sm(seg(t, T.sleeve1 + .25, T.sleeve1 + .55)); hands.R = { x: lerp(bx + 54, x + 182, a), y: lerp(by - BOOK.h / 2 - 16, y + 84, a), kind: 'glove', bend: .22, s: lerp(.85, 1, a) }; } }
      expr = { eyeL: lerp(1, .8, collector), eyeR: lerp(1, .8, collector), browAng: -.12 * collector, browUp: 2, mouth: 'line', nose: { dx: clamp(look[0], -1, 1) * 8, dy: clamp(look[1], -1, 1) * 6 } };
      if (t < T.walkBack1) expr = { mouth: 'smile', open: .5, eyeL: 1, eyeR: 1, browUp: 6 };
      if (t > T.sleeve0) expr = { eyeL: .85, eyeR: .85, browUp: 6, mouth: 'line' };
      if (relief > 0) expr = { eyeL: 0, eyeR: 0, closed: 'happy', browUp: 14, mouth: talk > .02 ? 'o' : 'smile', open: .2 + .7 * talk };
      if (smile > 0) expr = { eyeL: 1, eyeR: 1, browUp: 12, mouth: 'smile', open: .45 + .55 * talk };
      if (t > T.wink) { const w = seg(t, T.wink, T.wink + .12) * (1 - seg(t, T.wink + .55, T.wink + .67)); expr = { eyeL: 1, eyeR: w > .5 ? 0 : 1, closed: 'happy', browUp: 12, mouth: 'smirk' };
        hands.L = hand(P, -186, lerp(74, -40, sm(seg(t, T.wink - .15, T.wink + .1))), { kind: 'fist', bend: -.3 });
        if (w > .5) S.fx.push({ k: 'winkstar', p: P, a: seg(t, T.wink + .08, T.wink + .5) }); }
      if (t > 29.55 && t < 30.4) S.fx.push({ k: 'puff', p: P, a: seg(t, 29.6, 30.4) });
      S.mb = { x, y, dir, rot: 0, feet, hands, expr }; S.book = book; S.easel = t >= T.walkBack1; return S;
    }
    return S;
  }

  /* ---------------- effects ---------------- */
  function fx(ctx, S, t) {
    for (const e of S.fx) {
      ctx.save();
      if (e.k === 'twitch') { const [nx, ny] = locW(e.p, 70, -10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.globalAlpha = e.a;
        for (let i = 0; i < 3; i++) { const a = -0.6 + i * .6, j = Math.sin(t * 30 + i) * 4; ctx.beginPath(); ctx.moveTo(nx + 30 * Math.cos(a), ny + 30 * Math.sin(a)); ctx.lineTo(nx + (48 + j) * Math.cos(a), ny + (48 + j) * Math.sin(a)); ctx.stroke(); } }
      if (e.k === 'gust') { const [nx, ny] = e.from, k = e.t; ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) { const d = (k * 1500 - i * 40), len = 120 + rnd(i) * 80, yy = ny - 40 + i * 10 + Math.sin(i * 2 + d * .02) * 12; if (d < 0) continue;
          const a = clamp(1 - k / .8); ctx.strokeStyle = `rgba(255,255,255,${.85 * a})`; ctx.lineWidth = 7 - i * .4;
          ctx.beginPath(); ctx.moveTo(nx + Math.max(0, d - len), yy); ctx.quadraticCurveTo(nx + d - len / 2, yy - 14, nx + d, yy + 4); ctx.stroke(); }
        for (let i = 0; i < 14; i++) { const d = k * (900 + rnd(i + 9) * 700); if (k > .5) continue; ctx.fillStyle = `rgba(230,240,255,${.9 * (1 - k * 2)})`;
          ctx.beginPath(); ctx.arc(nx + 20 + d, ny - 30 + rnd(i + 3) * 60 + d * (rnd(i) - .5) * .3, 3 + rnd(i + 5) * 4, 0, 7); ctx.fill(); }
        if (k < .25) { ctx.globalAlpha = 1 - k * 4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(nx + 30 * Math.cos(a), ny + 30 * Math.sin(a)); ctx.lineTo(nx + 70 * Math.cos(a), ny + 70 * Math.sin(a)); ctx.stroke(); } } }
      if (e.k === 'slidelines') { const b = e.b; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const yy = b.y - 18 + i * 12; ctx.beginPath(); ctx.moveTo(b.x - 90 - i * 14, yy); ctx.lineTo(b.x - 160 - i * 22, yy); ctx.stroke(); } }
      if (e.k === 'hopdust' || e.k === 'impact') { const k = e.k === 'impact' ? e.a : 0; if (e.k === 'impact') { ctx.fillStyle = `rgba(200,200,205,${.6 * (1 - k)})`;
          for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 120 * eout(k), e.y + Math.sin(a) * 30 * eout(k) - 10, 18 * (1 - k) + 6, 0, 7); ctx.fill(); }
          ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 5; for (let i = 0; i < 6; i++) { const a = -Math.PI * (i + .5) / 6; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 160, e.y + Math.sin(a) * 140); ctx.lineTo(e.x + Math.cos(a) * (160 + 60 * k), e.y + Math.sin(a) * (140 + 60 * k)); ctx.stroke(); } } }
      if (e.k === 'dizzy') { for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; MB.star(ctx, e.x + Math.cos(a) * 110, e.y + Math.sin(a) * 26 - 10, 16, a, .9); } }
      if (e.k === 'dive') { ctx.strokeStyle = `rgba(255,255,255,${.7})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) { const [a0, a1] = [locW(e.p, -170, -120 + i * 48), locW(e.p, -330 - rnd(i) * 140, -120 + i * 48)]; ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...a1); ctx.stroke(); } }
      if (e.k === 'catchstar') { ctx.globalCompositeOperation = 'lighter'; MB.star(ctx, e.x, e.y, 120 * Math.sin(Math.PI * e.a), e.a * 2, 1); MB.star(ctx, e.x + 70, e.y - 60, 50 * Math.sin(Math.PI * e.a), 0, 1); }
      if (e.k === 'glovesparkle') MB.star(ctx, e.x, e.y - 30, 40 * Math.sin(Math.PI * e.a), e.a * 3, 1);
      if (e.k === 'scan') { ctx.globalAlpha = Math.sin(Math.PI * e.a); ctx.strokeStyle = '#e8e8ef'; ctx.lineWidth = 4; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.arc(e.x, e.y, 30 + 6 * Math.sin(t * 12), 0, 7); ctx.stroke(); }
      if (e.k === 'check') { const a = eout(e.a), cx = e.x + (e.i % 2 ? -40 : 40), cy = e.y - 30; ctx.translate(cx, cy); ctx.scale(a, a);
        ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.arc(0, 0, 21, 0, 7); ctx.fill(); ctx.strokeStyle = '#dcdce4'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-2, 8); ctx.lineTo(11, -8); ctx.stroke(); }
      if (e.k === 'puff') { const [mx, my] = locW(e.p, 60, 60); ctx.fillStyle = `rgba(235,235,240,${.75 * (1 - e.a)})`; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(mx - 30 - e.a * 120 - i * 16, my - 10 - e.a * 30 + (i % 2) * 14, 16 + e.a * 22 - i * 2, 0, 7); ctx.fill(); } }
      if (e.k === 'winkstar') { const [sx, sy] = locW(e.p, 20, -110); ctx.globalCompositeOperation = 'lighter'; MB.star(ctx, sx - 40, sy - 40, 38 * Math.sin(Math.PI * e.a), e.a * 2, 1); }
      ctx.restore();
    }
  }

  /* ---------------- camera (cuts + moves) ---------------- */
  function camera(t) {
    if (t < 5.0) return { x: lerp(330, 345, t / 5), y: 1245, z: lerp(1.45, 1.5, t / 5) };
    if (t < 9.0) { const k = eio(seg(t, 5.0, 6.3)); return { x: lerp(345, 470, k), y: lerp(1245, 1255, k), z: lerp(1.5, 1.14, k) }; }
    if (t < 14.0) { const k = seg(t, 9.0, 14.0); return { x: lerp(540, 545, k), y: 1255, z: lerp(1.0, 1.02, k) }; }            // continuous wide shot
    if (t < 16.95) { const k = seg(t, 14.0, 16.95); return { x: 290, y: 1345, z: lerp(1.9, 2.05, eio(k)) }; }                  // CUT: close-up, serious
    if (t < T.launch) return { x: 615, y: 1330, z: lerp(1.18, 1.22, seg(t, 16.95, 18)) };                                       // CUT: book in slow-mo
    if (t < 24.0) { const k = eio(seg(t, 18.0, 18.6)); return { x: lerp(560, 640, k), y: lerp(1300, 1290, k), z: lerp(1.0, 1.05, k) }; }
    if (t < 25.2) return { x: lerp(620, 480, eio(seg(t, 24.0, 25.2))), y: 1270, z: 1.08 };
    return { x: 452, y: 1345, z: lerp(1.6, 1.68, seg(t, 25.2, 32)) };                                                         // CUT: collector close-up
  }

  /* ---------------- frame ---------------- */
  function draw(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t >= T.fade0 + .45) return outro(ctx, t);
    const S = scene(t), cam = camera(t);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
    const on = t < T.spot ? 0 : (t < T.spot + .25 ? (Math.sin((t - T.spot) * 90) > 0 ? .55 : .15) : 1);
    studio(ctx, t, on);
    table(ctx, false);
    const b = S.book, bookOnTable = b && (b.mode === 'table' || b.mode === 'slide');
    if (bookOnTable) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 22, 72, 10, 0, 0, 7); ctx.fill(); drawBook(ctx, b.x, b.y, b.rot, b.sy); }
    spotlight(ctx, t, S.mb ? S.mb.x + (t > 18 && t < 24 ? 120 : (t > 25 ? 140 : 60)) : 540, on);
    table(ctx, true);
    if (S.easel) easel(ctx, 578, 1168);
    if (b && b.mode === 'easel') { drawBook(ctx, b.x, b.y, 0, 1, { shine: S.sleeve && S.sleeve.drop < 1 ? S.sleeve.shine : 0 }); if (S.sleeve) drawSleeve(ctx, S.sleeve.x, S.sleeve.y, S.sleeve.s, S.sleeve.drop, S.sleeve.shine); }
    if (S.slowmo && b && b.mode === 'air') slowmoGhost(ctx, t, S.slowmo);
    if (b && b.mode === 'air') { const e = TL.bookExtent(b); MB.shadow(ctx, b.x, FLOOR, 70, .9, Math.max(0, FLOOR - e.bottom) * 2); drawBook(ctx, b.x, b.y, b.rot, b.sy); }
    if (S.mb) { const m = S.mb, sh = m.view === 'back' && Math.abs(m.rot) > 2 ? 0 : 1; MB.shadow(ctx, m.x, FLOOR, 190, 1, Math.max(0, BODY_Y - m.y) + (1 - sh) * 0);
      const held = b && (b.mode === 'held');
      MB.draw(ctx, Object.assign({ between: held ? (c) => { drawBook(c, b.x, b.y, b.rot || 0, 1, { s: b.s || 1, shine: S.sleeve ? 0 : 0 }); if (S.sleeve) drawSleeve(c, S.sleeve.x, S.sleeve.y, S.sleeve.s, S.sleeve.drop, S.sleeve.shine); } : null }, m)); }
    fx(ctx, S, t);
    ctx.restore();
    if (S.slowmo) { ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1100); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.6 * S.slowmo})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // spotlight-on iris + end fade
    if (t < T.spot) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    if (t > T.fade0) { ctx.fillStyle = `rgba(0,0,0,${seg(t, T.fade0, T.fade0 + .45)})`; ctx.fillRect(0, 0, W, H); }
    filmGrain(ctx, t);
  }
  function easel(ctx, x, y) {   // chrome display easel standing on the table
    const by = y + BOOK.h / 2; ctx.save(); const g = ctx.createLinearGradient(x - 80, 0, x + 80, 0); g.addColorStop(0, '#55555e'); g.addColorStop(.5, '#f2f2f6'); g.addColorStop(1, '#4a4a52');
    ctx.fillStyle = g; ctx.fillRect(x - 78, by + 2, 156, 9); ctx.fillRect(x - 6, y - 40, 12, BOOK.h / 2 + 44);
    ctx.fillStyle = '#000'; ctx.globalAlpha = .5; ctx.beginPath(); ctx.ellipse(x, by + 14, 96, 8, 0, 0, 7); ctx.fill(); ctx.restore(); }
  function slowmoGhost(ctx, t, k) {
    for (let i = 4; i >= 1; i--) { const s = TL.bookFree(Math.max(T.edge, t - i * 0.55)); ctx.save(); ctx.globalAlpha = .1 * k * (5 - i) / 4; drawBook(ctx, s.x, s.y, s.rot, s.sy); ctx.restore(); }
    const b = TL.bookFree(t); ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.5 * k})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const x = b.x - 70 + i * 35, y0 = b.y - 120 - rnd(i) * 40; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - 60 - rnd(i + 4) * 50); ctx.stroke(); }
    ctx.restore();
  }
  function filmGrain(ctx, t) {   // subtle vintage flicker + gate weave dust (deterministic)
    const f = Math.floor(t * 24); ctx.save(); ctx.globalAlpha = .035 + .02 * rnd(f); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = .5;
    for (let i = 0; i < 6; i++) { if (rnd(f * 7 + i) > .5) continue; ctx.fillStyle = rnd(f + i * 3) > .5 ? '#fff' : '#000'; ctx.beginPath(); ctx.arc(rnd(f * 3 + i) * W, rnd(f * 5 + i) * H, 1 + rnd(f + i) * 2.5, 0, 7); ctx.fill(); }
    ctx.restore(); const v = ctx.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  /* ---------------- SCENE 07 — brand outro (official logo, unmodified pixels) ---------------- */
  let _lm = null;
  function logoMasked() { if (_lm) return _lm; const c = document.createElement('canvas'); c.width = logo.width; c.height = logo.height; const g = c.getContext('2d');
    g.drawImage(logo, 0, 0); g.globalCompositeOperation = 'destination-in'; const r = g.createRadialGradient(c.width / 2, c.height / 2, c.width * .47, c.width / 2, c.height / 2, c.width * .5);
    r.addColorStop(0, '#000'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, c.width, c.height); _lm = c; return c; }
  function outro(ctx, t) {
    const k = seg(t, T.logo0, T.logo0 + .7), sz = 860, x = (W - sz) / 2, y = 470;
    ctx.save(); ctx.globalAlpha = eout(k); ctx.globalCompositeOperation = 'lighten'; const s = lerp(.94, 1, eout(k)); ctx.translate(W / 2, y + sz / 2); ctx.scale(s, s); ctx.drawImage(logoMasked(), -sz / 2, -sz / 2, sz, sz); ctx.restore();
    const sw = seg(t, 33.05, 33.85); if (sw > 0 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(W / 2, y + sz / 2, sz * .47, 0, 7); ctx.clip();
      const gx = lerp(x - 300, x + sz + 300, sw), g = ctx.createLinearGradient(gx - 160, y, gx + 160, y + sz); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, sz, sz); ctx.restore(); }
    const tk = seg(t, 33.35, 34.0);
    ctx.save(); ctx.globalAlpha = eout(tk); ctx.textAlign = 'center'; ctx.fillStyle = '#e9e9ee';
    ctx.font = '600 46px Montserrat, sans-serif'; ctx.letterSpacing = '14px'; ctx.fillText('BEYOND THE COLLECTION.', W / 2 + 7, y + sz + 120);
    ctx.fillStyle = 'rgba(220,220,228,.55)'; ctx.fillRect(W / 2 - 150 * eout(tk), y + sz + 52, 300 * eout(tk), 2); ctx.restore();
    const sp = seg(t, 33.1, 33.7); if (sp > 0 && sp < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; MB.star(ctx, W / 2 + 330, y + 240, 70 * Math.sin(Math.PI * sp), sp, 1); ctx.restore(); }
    filmGrain(ctx, t);
  }
  async function init(base) {
    VOICE = await (await fetch(base + 'audio/voice/voice_meta.json')).json();
    await document.fonts.load('900 40px "Titan One"'); await document.fonts.load('600 40px Montserrat'); await document.fonts.load('700 40px Montserrat');
    bookArt = makeBookArt();
    logo = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = base + 'assets/brand/369_logo_official.png'; });
    return { voStarts: TL.VO.map(v => ({ id: v.id, start: voStart(v), dur: VOICE.lines[v.id].dur, onset: VOICE.lines[v.id].onset, offset: VOICE.lines[v.id].offset, en: v.en, zh: v.zh })) };
  }
  return { init, draw, scene, camera, drawBook, drawSleeve, studio, spotlight, table, bookArtCanvas: () => bookArt, voStart: (id) => voStart(TL.VO.find(v => v.id === id)) };
})();
