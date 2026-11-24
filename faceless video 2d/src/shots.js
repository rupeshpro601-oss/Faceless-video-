// THE RUNNER WHO WON OLYMPIC GOLD IN A CAR: the shot list (Tall Tale 3D).
// Story: the 1904 Saint Louis Olympic marathon — Fred Lorz rides 11 miles in a car, Thomas Hicks wins
// on rat poison, egg white and brandy. Sources: Wikipedia (Lorz / Hicks / 1904 marathon), Olympics.com,
// Smithsonian Magazine, Runner's World — listed in script.json.
// A shot: { id, at, note, draw(lt, d, t, blit) }. Times come from the voice: cut(i) = just before line i,
// Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, INK, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);

// the cast (original characters, Tall Tale recipe)
const LOOK = {
  lorz:   { body: '#3C6FB6', pattern: 'stripes', patCol: '#F2EFE4', hat: 'cap', hatCol: '#2C3A4A', extra: ['glasses'] },
  hicks:  { body: '#D8343F', pattern: 'plain', neck: 'collar', neckCol: '#F2EFE4', hairCol: '#4A3524' },
  tr1:    { body: '#F2C230', pattern: 'vest', patCol: '#7A4A2E', hat: 'boater', hatCol: '#E8C77A', band: '#B5372E', extra: ['mustache'] },
  tr2:    { body: '#6FA35A', pattern: 'vest', patCol: '#2E4E3F', hat: 'cap', hatCol: '#3A2A22' },
  dir:    { body: '#4A4560', hat: 'tophat', hatCol: '#2A2638', neck: 'bowtie', neckCol: '#D8343F', dots: 1, pattern: 'vest', patCol: '#2A2638', extra: ['monocle', 'mustache'] },
  carv:   { body: '#F2C230', pattern: 'overalls', patCol: '#2E4E3F', hat: 'boater', hatCol: '#F2EFE4', band: '#D8343F', extra: ['mustache'] },
  len:    { body: '#2E4E8A', pattern: 'plain', hat: 'cap', hatCol: '#E2B33C' },
  crowd1: { body: '#C9603F', hat: 'bun', hatCol: '#7A4A2E', pattern: 'apron' },
  crowd2: { body: '#9E4A3A', pattern: 'check', hat: 'bowler', hatCol: '#3A2A22' },
  crowd3: { body: '#5FA39A', hat: 'boater', hatCol: '#D9A34A', band: '#3C6FB6' },
};
const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const LOOKS = { road: { bloom: 0.18, aperture: 0.0012, maxblur: 0.008 }, heat: { bloom: 0.3, aperture: 0.0012, maxblur: 0.007 }, orchard: { bloom: 0.22, aperture: 0.001, maxblur: 0.007 }, dusk: { bloom: 0.3, aperture: 0.001, maxblur: 0.008 } };
  const shoot = (scene, people, from, to, at, at2, k, look, focus) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };
  
  // ── the race course: a dirt road running along -z, start banner at the top, FINISH tape far down ──
  const RD = WD.meadow(E, { fenceOn: false });
  RD.sun.key.position.set(9, 15, 8); RD.sun.key.target.position.set(0, 0, -30);
  Object.assign(RD.sun.key.shadow.camera, { left: -26, right: 26, top: 30, bottom: -30 }); RD.sun.key.shadow.camera.updateProjectionMatrix();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 150), WD.mat({ map: WD.T.dirt('#C98A52', [2, 26]) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -35); road.receiveShadow = true; RD.scene.add(road);
  const ground3 = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), WD.mat({ map: WD.T.grass('#79C25A', [60, 60]) })); ground3.rotation.x = -Math.PI / 2; ground3.position.y = -0.02; RD.scene.add(ground3);
  { const sb = WD.signBoard('OLYMPIC MARATHON · 1904', { w: 5.2, h: 0.7, bg: '#2E4E8A', fg: '#F2D37A' }); sb.position.set(0, 3.5, 2.5); RD.scene.add(sb);
    const sb2 = WD.signBoard('SAINT LOUIS', { w: 3.2, h: 0.5, bg: '#B5372E', fg: '#F2E6CF' }); sb2.position.set(-7.5, 3.1, 2.5); RD.scene.add(sb2); }
  const sp1 = WD.pole(6), sp2 = WD.pole(6), sp3 = WD.pole(6), sp4 = WD.pole(6);
  sp1.position.set(-3.4, 0, -66); sp2.position.set(3.4, 0, -66); sp3.position.set(-3.4, 0, -64); sp4.position.set(3.4, 0, -64);
  [sp1, sp2, sp3, sp4].forEach((p) => RD.scene.add(p));
  const fin = WD.signBoard('FINISH', { w: 2.6, h: 0.5, bg: '#B5372E', fg: '#F2E6CF' }); fin.position.set(0, 3.1, -66); RD.scene.add(fin);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.34, 0.05), WD.mat({ color: '#F2EFE4', roughness: 0.6 })); ribbon.position.set(0, 1.25, -64.7); RD.scene.add(ribbon);
  const crowd = WD.extras(RD.scene, [[-5.0, -3, 0], [5.2, -5, 1], [-5.2, -30, 2], [5.0, -40, 0], [-5.0, -62, 1], [5.2, -64, 2]]);
  const car1 = WD.car('#2C3A4A'); car1.position.set(1.6, 0, -12); RD.scene.add(car1);
    const lorz = person('lorz'), hicks = person('hicks'), tr1 = person('tr1'), tr2 = person('tr2'), boss = person('dir'), carv = person('carv'), len = person('len');
  const gaspers = [person('crowd1'), person('crowd2'), person('crowd3')].map((p) => { p.group.visible = false; p.group.scale.setScalar(1.0); return p; });
  [lorz, hicks, tr1, tr2, boss, carv, len, ...gaspers].forEach((p) => RD.scene.add(p.group));
  const runners = [];
  for (let i = 0; i < 5; i++) {
    const r = person(i % 2 ? 'crowd2' : 'crowd3', { res: 0.75 }); r.at(-2 + i, 0, -6 - i * 2.4); RD.scene.add(r.group); runners.push(r);
  }
  const rdPeople = [lorz, hicks, tr1, tr2, boss, carv, len, ...gaspers, ...runners];

  // the orchard beside the road: two apple trees + a crate
  const OR = WD.meadow(E, { fenceOn: true, treesOn: false });
  OR.sun.key.position.set(8, 13, 6); OR.sun.key.target.position.set(0, 0, -4);
  Object.assign(OR.sun.key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 }); OR.sun.key.shadow.camera.updateProjectionMatrix();
  const orPath = new THREE.Mesh(new THREE.PlaneGeometry(5, 120), WD.mat({ map: WD.T.dirt('#C98A52', [2, 22]) })); orPath.rotation.x = -Math.PI / 2; orPath.position.set(0, 0.01, -30); orPath.receiveShadow = true; OR.scene.add(orPath);
  const appleCrate = PR.chickCrate(0); appleCrate.visible = false; OR.scene.add(appleCrate);
  const appleProp = (g, x, y) => { g.save(); g.translate(x + 6, y - 40); g.rotate(-0.15); g.fillStyle = '#D8343F'; g.strokeStyle = INK; g.lineWidth = 5;
    g.beginPath(); g.arc(0, -10, 34, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#4E7A3A'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -42); g.quadraticCurveTo(8, -58, 18, -64); g.stroke(); g.restore(); };
  const apples = [];
  [[-4.5, -8], [4.6, -13]].forEach(([x, z], i) => {
    const tr = WD.tree(1.1 + i * 0.25); tr.position.set(x, 0, z); OR.scene.add(tr);
    for (let a = 0; a < 7; a++) { const ap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), WD.mat({ color: '#D8343F' })); ap.position.set((WD.rnd ? WD.rnd(a + i * 7) : a * 0.7 - 2) * 0.25, 2.2 + (a % 4) * 0.25, 0.15 + (a % 3) * 0.2); tr.add(ap); apples.push(ap); }
  });
  const oCar = person('carv'), oRunner = person('crowd3', { res: 0.75 });
  [oCar, oRunner].forEach((p) => OR.scene.add(p.group));
  const orPeople = [oCar, oRunner];

  // ── WEDNESDAY-9AM finish: sunset meadow with a BOSTON 1905 tape (outro) ──
  const BS = WD.meadow(E, { sunset: true, fenceOn: false, treesOn: false });
  BS.sun.key.position.set(-9, 7, 8); BS.sun.key.target.position.set(0, 0, -24);
  Object.assign(BS.sun.key.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 }); BS.sun.key.shadow.camera.updateProjectionMatrix();
  const bRoad = new THREE.Mesh(new THREE.PlaneGeometry(7, 80), WD.mat({ map: WD.T.dirt('#C98A52', [2, 14]) })); bRoad.rotation.x = -Math.PI / 2; bRoad.position.set(0, 0.01, -20); bRoad.receiveShadow = true; BS.scene.add(bRoad);
  { const bp1 = WD.pole(6), bp2 = WD.pole(6); bp1.position.set(-3.4, 0, -44); bp2.position.set(3.4, 0, -44); BS.scene.add(bp1); BS.scene.add(bp2);
    const bs = WD.signBoard('BOSTON · 1905', { w: 4.2, h: 0.6, bg: '#B5372E', fg: '#F2D37A' }); bs.position.set(0, 3.0, -44); BS.scene.add(bs); }
  const bLorz = person('lorz'); BS.scene.add(bLorz.group);

  // ── hand-drawn props / stand-ins ──
  const flask = (g, x, y) => { g.save(); g.translate(x, y - 40); g.rotate(0.12); g.fillStyle = '#7A4A2E'; g.strokeStyle = INK; g.lineWidth = 5;
    g.beginPath(); g.roundRect(-30, -60, 60, 78, 10); g.fill(); g.stroke(); g.fillStyle = '#5A3A20'; g.fillRect(-10, -84, 20, 26); g.strokeRect(-10, -84, 20, 26);
    g.fillStyle = '#F2D37A'; g.fillRect(-22, -34, 44, 26); g.fillStyle = INK; g.font = '900 18px Inter'; g.textAlign = 'center'; g.fillText('XXX', 0, -15); g.restore(); };
  const medal = (g, x, y) => { g.save(); g.translate(x, y - 40); g.strokeStyle = INK; g.lineWidth = 5;
    g.fillStyle = '#B5372E'; g.fillRect(-11, -70, 22, 40); g.strokeRect(-11, -70, 22, 40);
    g.fillStyle = '#E6B850'; g.beginPath(); g.arc(0, -10, 30, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#B8862F'; g.beginPath(); g.arc(0, -10, 20, 0, 7); g.fill();
    g.fillStyle = '#7A5236'; g.font = '900 26px Inter'; g.textAlign = 'center'; g.fillText('1', 0, 0); g.restore(); };

  // dogs: two-frame galloping cut-out (canvas texture planes)
  const dogDraw = (ext) => (g, w, h) => { const s = w / 256; g.scale(s, s);
    const ink = INK, body = '#8A6B4A';
    g.fillStyle = body; g.strokeStyle = ink; g.lineWidth = 7;
    g.beginPath(); g.ellipse(120, 150, 62 * (ext ? 1.08 : 1), 30, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(176, 118, 26, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#7A4A2A'; g.beginPath(); g.moveTo(196, 100); g.lineTo(216, 78); g.lineTo(162, 92); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(188, 110, 3.4, 0, 7); g.fill();
    g.fillStyle = body; g.lineWidth = 10; g.lineCap = 'round';
    if (ext) { g.beginPath(); g.moveTo(196, 104); g.lineTo(228, 66); g.stroke(); }
    else { g.beginPath(); g.moveTo(190, 104); g.lineTo(216, 92); g.lineTo(228, 100); g.stroke(); }
    g.fillStyle = body; g.lineWidth = 9;
    const legs = ext ? [[78, 200], [150, 84], [156, 210], [92, 86]] : [[84, 176], [146, 176], [160, 178], [96, 178]];
    legs.forEach(([x0, y1]) => { g.beginPath(); g.moveTo(x0, 148); g.lineTo(x0 + (ext ? 14 : 2), y1); g.stroke(); });
    g.lineWidth = 7; g.strokeStyle = ink; g.fillStyle = '#7A4A2A';
    g.beginPath(); g.arc(188, 122, 7, 0, 7); g.fill(); };
  const dogGroup = () => {
    const a = WD.canvasTex('dogA', 256, 256, dogDraw(true)), b = WD.canvasTex('dogB', 256, 256, dogDraw(false));
    const mats = [a, b].map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, toneMapped: false }));
    const geo = new THREE.PlaneGeometry(1.15, 1.15);
    const g = new THREE.Group(); const m = new THREE.Mesh(geo, mats[0]); m.position.y = 0.58; g.add(m);
    g.userData.mats = mats; return g;
  };
  const dogs = [[-1.9, -0.4, 0.9], [-2.7, -1.2, 1.1], [-1.4, -2.6, 0.75]].map(([bx, zz, s]) => {
    const d = dogGroup(); d.userData.bx = bx - 2.6; d.position.set(bx, 0, zz); d.scale.setScalar(s * 1.0); d.rotation.y = Math.PI / 2; OR.scene.add(d); RD.scene.add(d);
    return d;
  });
  const dogTick = (t, speed = 9) => dogs.forEach((d, i) => { const f = Math.floor(t * speed + i * 1.7) % 2; d.children[0].material = d.userData.mats[f]; d.position.y = Math.abs(Math.sin(t * speed + i * 2)) * 0.16; });

  const roadAt = (z) => V3(0, 1.4, z);

  // ── WEDNESDAY'S SHOTS ──  ──────

  // 1 · HOOK: "This man won Olympic gold," — Lorz in the car, medal up, smug. Punch on 'gold'.
  { const st = cut(0), wg = Wd('gold', 0);
    add({ id: 'S01', at: st, note: 'low-angle push-in: Lorz beside the car with a gleaming gold medal, runners crawling past', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers[0].group.visible = true; gaspers[0].at(-2.6, 0, -13.5); gaspers[0].set({ legs: 'run', phase: t * 5, mood: 'tired', sweat: 1, talk: 0 });
      lorz.group.visible = true; lorz.at(3.1, 0, -12.6); const up = clamp((t - wg) / 0.25);
      lorz.set({ mood: up > 0.4 ? 'smug' : 'proud', armL: [lerp(30, 150, eo(up)), lerp(-20, 10, up)], holdL: medal, v: 'm' + Math.floor(up * 3) });
      runners.forEach((r, i) => { r.at(-3 + i * 1.4, 0, -16 - i * 2); r.set({ legs: 'walk', phase: t * 2.4 + i, mood: 'tired', sweat: 1 }); });
      shoot(RD.scene, rdPeople, V3(5.4, 1.55, -7.6), V3(4.2, 1.7, -9.8), V3(3.1, 1.4, -12.6), null, k, { ...LOOKS.road, fov: 52 });
      blit();
      const gl = clamp((t - wg) / 0.35);
      if (gl > 0 && gl < 1) { ctx.save(); ctx.globalAlpha = (1 - Math.abs(gl * 2 - 1)) * 0.85; const x = 300 + gl * 380, y = 620 + gl * 120; ctx.fillStyle = '#FFF3C8';
        ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x + 26, y); ctx.lineTo(x, y + 40); ctx.lineTo(x - 26, y); ctx.closePath(); ctx.fill(); ctx.restore(); }
    } });
    cue(st, 'whoosh'); cue(wg, 'ding', { gain: 0.8 }); }

  // 2 · "by riding the marathon in a car." — the car rolls past wrecked runners.
  { const st = cut(1), wc = Wd('car', 1);
    add({ id: 'S02', at: st, note: 'the car cruises past staggering runners on the dirt road; runners tumble out of frame', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers[0].group.visible = gaspers[1].group.visible = gaspers[2].group.visible = true;
      gaspers[0].at(-2.8, 0, -14); gaspers[0].set({ legs: 'run', phase: t * 2.6, mood: 'tired', sweat: 1 });
      gaspers[1].at(2.4, 0, -19); gaspers[1].set({ legs: 'sit', lean: 16, mood: 'dizzy', bob: Math.sin(t * 2) * 3 });
      gaspers[2].at(-1.2, 0, -24); gaspers[2].set({ legs: 'sit', lean: -20, mood: 'tired', sweat: 1 });
      runners.forEach((r, i) => { r.group.visible = false; });
      const cz = -16 - lt * 2.2; car1.position.set(1.6, 0, cz);
      lorz.group.visible = true; lorz.at(3.0, 0, cz + 0.8); lorz.set({ mood: 'smug', armR: [140, 10], legs: 'walk', phase: t * 6, blink: blink(t) });
      shoot(RD.scene, rdPeople, V3(-3.4, 1.7, cz + 7.4), V3(-3.0, 1.55, cz + 6.4), V3(1.4, 1.3, cz - 2.0), null, k, { ...LOOKS.road, fov: 52 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wc, 'pop', { gain: 0.8 }); cue(st + 0.3, 'chug', { dur: 1.6, gain: 0.5 }); }

  // 3 · "See, at the nineteen oh four Olympics, athletes ran the marathon..." — the start line bursts.
  { const st = cut(2), wo = Wd('Olympics', 2);
    add({ id: 'S03', at: st, note: 'crane-down on the start banner as the field of cartoon runners explodes forward', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); lorz.group.visible = false;
      runners.forEach((r, i) => { r.group.visible = true; const kk = clamp((t - L(2) + 0.4 - i * 0.25) / 0.35); r.at(-2.4 + i * 1.2, 0, -8.5 - kk * (5 + i * 1.4)); r.set({ legs: 'run', phase: t * 8 + i * 2, mood: 'happy' }); });
      hicks.group.visible = true; const hk = clamp((t - L(2) + 0.4) / 0.35); hicks.at(0.4, 0, -9.8 - hk * 6); hicks.set({ legs: 'run', phase: t * 8 + 1, mood: 'proud' });
      len.group.visible = true; const lk = clamp((t - L(2) + 0.8) / 0.35); len.at(-1.4, 0, -10.4 - lk * 6.4); len.set({ legs: 'run', phase: t * 8.3, mood: 'happy' });
      shoot(RD.scene, rdPeople, V3(0.5, 7.5, 6.0), V3(0.2, 2.1, 2.2), V3(0, 1.6, -8.0), roadAt(-11), k, { ...LOOKS.road, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wo, 'ding', { gain: 0.6 }); cue(wo + 0.3, 'boing', { gain: 0.5 }); }

  // 4 · "...on a dirt road in brutal heat," — low tracking along the road (split off line 2)
  { const st = Wd('dirt', 2) - 0.05;
    add({ id: 'S04', at: st, note: 'skim-low along the dirt road between striders, boots thudding; ends in heat shimmer', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const zz = -18 - k * 10;
      gaspers.forEach((p) => (p.group.visible = false)); lorz.group.visible = false;
      hicks.group.visible = len.group.visible = true;
      hicks.at(1.1, 0, zz + 2); hicks.set({ legs: 'run', phase: t * 8, mood: 'proud', blink: blink(t) });
      len.at(-1.3, 0, zz + 4); len.set({ legs: 'run', phase: t * 8.2 + 1, mood: 'happy', blink: blink(t, 1.1) });
      runners.forEach((r, i) => { r.group.visible = i < 3; if (i < 3) { r.at(-3.4 + i * 3.2, 0, zz + 9 - i * 3); r.set({ legs: 'run', phase: t * 7 + i, mood: i % 2 ? 'tired' : 'happy', sweat: i === 2 ? 1 : 0 }); } });
      shoot(RD.scene, rdPeople, V3(0.6, 1.1, zz - 6.4), V3(0.2, 1.25, zz - 7.4), roadAt(zz - 6.0), null, k, { ...LOOKS.road, fov: 40 }, 3.2);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'thud', { gain: 0.4 }); cue(st + 0.8, 'thud', { gain: 0.3 }); }

  // 5 · "...in brutal heat," — stagger + sweat under a hammering sun
  { const st = Wd('brutal', 2) - 0.05;
    add({ id: 'S05', at: st, note: 'close: Carvajal and a runner wilt in the heat; big sun baked into the sky; sweat drops', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = len.group.visible = false; carv.group.visible = true; runners[0].group.visible = runners[1].group.visible = true;
      carv.at(0.9, 0, -30.5); carv.set({ legs: 'walk', phase: t * 2.6, mood: 'tired', sweat: 1, talk: 0, look: [0.3, 0] });
      runners[0].at(-1.5, 0, -32.5); runners[0].set({ legs: 'run', phase: t * 2.5, mood: 'tired', sweat: 1 });
      runners[1].at(2.6, 0, -34); runners[1].set({ legs: 'sit', lean: 22, mood: 'dizzy' });
      shoot(RD.scene, rdPeople, V3(0.4, 1.7, -26.8), V3(0.2, 1.6, -27.8), V3(0.6, 1.45, -31.8), null, k, { ...LOOKS.heat, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.4, 'sizzle', { dur: 1.2, gain: 0.5 }); }

  // 6 · "and the race director refused to give them water," — the boss stands WITH the water and blocks him.
  { const st = cut(3), ww = Wd('water', 3);
    add({ id: 'S06', at: st, note: 'boss with crossed arms the runner reaches for the cup; the boss swats it away, angry', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const hit = clamp((t - ww) / 0.2);
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = boss.group.visible = true; runners.forEach((r) => (r.group.visible = false));
      hicks.at(-0.9, 0, -38); hicks.set({ mood: 'worried', sweat: 1, talk: talk(t), armR: [lerp(95, 130, eo(seg(lt, 0, 0.6))), -10], legs: lt < 0.5 ? 'walk' : 'stand', phase: t * 5 });
      boss.at(1.1, 0, -38.6); boss.set({ mood: t > ww ? 'angry' : 'neutral', armL: [20, 10], armR: [lerp(40, 80, eo(seg(lt, 0, ww - st - 0.3))) - hit * 120, -30], look: [-0.7, 0.1], v: 'swat' + Math.floor(hit * 2) });
      const sw = clamp((t - ww - 0.12) / 0.35);
      if (sw > 0 && sw < 1) { ctx.save(); ctx.globalAlpha = 1 - sw; ctx.translate(lerp(430, 240, sw), lerp(700, 830, sw)); ctx.rotate(sw * 1.2); ctx.scale(1 - sw * 0.25, 1 - sw * 0.25);
        ctx.fillStyle = '#F4EFE4'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-38, -50, 76, 84, [4, 4, 18, 18]); ctx.fill(); ctx.stroke(); ctx.restore(); }
      shoot(RD.scene, rdPeople, V3(-0.5, 1.8, -34.2), V3(-0.1, 1.7, -35.2), V3(0.1, 1.5, -38.4), null, k, { ...LOOKS.road, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(ww, 'plop', { gain: 0.7 }); cue(ww + 0.2, 'pop', { gain: 0.5 }); }

  // 7 · "so he could study what dehydration does to the body," — the smug scientist with his clipboard.
  { const st = cut(4), ws = Wd('study', 4);
    add({ id: 'S07', at: st, note: 'slow dolly-in on the scribbling boss: STUDY OF DEHYDRATION on the clipboard, sickly smile', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = false; runners.forEach((r) => (r.group.visible = false)); boss.group.visible = true;
      boss.at(0.4, 0, -38.6); boss.set({ mood: t > ws ? 'smug' : 'neutral', armL: [55, -40], armR: [95, -20], holdL: PROPS.paper('DEHYDRATION STUDY'), v: 'pp', bob: Math.sin(t * 2.4) * 3, blink: blink(t) });
      hicks.at(-1.5, 0, -40.5); hicks.group.visible = true; hicks.set({ mood: 'sad', legs: 'sit', lean: 24, sweat: 1 });
      const punch = eo(clamp((t - ws) / 0.3));
      shoot(RD.scene, rdPeople, V3(1.2, 1.85, -35.4), V3(0.7, 1.7, -36.4), V3(0.5, 1.55, -38.6), null, punch > 0 ? eio(clamp((t - st) / (ws - st))) : eio(k), { ...LOOKS.road, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(ws, 'slide', { dur: 0.5, gain: 0.5 }); }

  // 8 · "Cars kicked up clouds of dust. Runners cramped, collapsed, and quit."
  { const st = cut(5), wd = Wd('dust', 5);
    add({ id: 'S08', at: st, note: 'the second car bottoms out a dust cloud swallowing the road; runners stagger out of sight', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const cz = -44 - lt * 1.4;
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = boss.group.visible = false;
      carv.group.visible = oRunner.group.visible = false; len.group.visible = true;
      len.at(-1.6, 0, cz + 6.5); len.set({ legs: 'run', phase: t * 2.5, mood: 'tired', sweat: 1 });
      runners.forEach((r) => (r.group.visible = true)); runners[0].at(2.4, 0, cz + 3); runners[0].set({ legs: 'sit', mood: 'dizzy', bob: 0 });
      runners[1].at(-3.0, 0, cz + 9.5); runners[1].set({ legs: 'sit', mood: 'dizzy', bob: 0 });
      runners[2].at(2.9, 0, cz + 12.5); runners[2].set({ legs: 'sit', lean: 22, mood: 'dizzy', bob: 0 });
      car1.position.set(1.6, 0, cz);
      const puff = clamp((t - wd + 0.4) / 0.5);
      shoot(RD.scene, rdPeople, V3(-3.2, 1.9, cz + 9.0), V3(-2.8, 1.7, cz + 8.2), V3(1.4, 1.4, cz + 0.5), null, k, { ...LOOKS.road, fov: 44 });
      blit();
      if (puff > 0 && puff < 1) { ctx.save(); ctx.globalAlpha = puff * 0.75; for (let i = 0; i < 7; i++) { const px = 180 + ((i * 137 + t * 40) % 760), py = 430 + ((i * 211 + t * 26) % 620), pr = lerp(40, 150, (puff + i * 0.25) % 1);
        ctx.fillStyle = i % 2 ? '#D8B48A' : '#E4C69C'; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill(); } ctx.restore(); }
    } });
    cue(st, 'whoosh'); cue(wd, 'whoosh', { gain: 0.7 }); cue(wd + 0.4, 'thud', { gain: 0.5 }); cue(Wd('quit', 5), 'plop', { gain: 0.6 }); }

  // 9 · "One Cuban postman stopped mid-race to snack on rotten apples."
  { const st = cut(6), wa = Wd('apples', 6);
    add({ id: 'S09', at: st, note: 'orchard: Carvajal strolls from a stolen apple to a brace of other apples; sour face lands on "apples"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const bite = clamp((t - wa) / 0.22);
      oCar.at(0.2, 0, -5.2); oCar.set({ legs: lt < 1.4 ? 'walk' : 'stand', phase: t * 4, mood: bite > 0.25 && bite < 0.9 ? 'worried' : (bite >= 0.9 ? 'tired' : 'smug'),
        armR: [90, -30], holdR: appleProp, v: 'ap' + Math.floor(bite * 3), sweat: bite > 0.25 ? 1 : 0, blink: blink(t) });
      oRunner.at(-2.2, 0, -7.6); oRunner.set({ legs: 'sit', mood: 'tired', bob: 0 });
      shoot(OR.scene, orPeople, V3(2.9, 1.8, -2.0), V3(2.4, 1.7, -2.6), V3(0.2, 1.5, -5.2), null, k, { ...LOOKS.orchard, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wa, 'gulp', { gain: 0.7 }); cue(wa + 0.42, 'plop', { gain: 0.5 }); }

  // 10 · "And a South African runner got chased a mile off course by a pack of wild dogs."
  { const st = cut(7), wd = Wd('dogs', 7);
    add({ id: 'S10', at: st, note: 'head-on chase: Len Tau sprints at the camera, dog pack flanking him, camera retreating down the road', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const zz = -55 - lt * 1.4;
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = boss.group.visible = false; carv.group.visible = false; runners.forEach((r) => (r.group.visible = false)); tr1.group.visible = tr2.group.visible = false;
      len.group.visible = true; len.at(0.05, 0, zz - 3.1); len.set({ legs: 'run', phase: t * 13, mood: 'shock', sweat: 1, look: [0, 0.12], armL: [118, -14], armR: [126, -10], blink: blink(t) });
      const spots = [[-0.8, -3.5, 0.95], [0.82, -3.6, 0.85], [0.05, -4.6, 0.7]];
      dogs.forEach((d, i) => { const [dx, dz, ds] = spots[i]; d.visible = t > st + 0.4 + i * 0.35; d.position.set(dx + Math.sin(t * 6 + i * 2.1) * 0.25, 0, zz + dz); d.rotation.y = 0; d.scale.setScalar(ds); });
      dogTick(t, 9);
      shoot(RD.scene, rdPeople, V3(0, 1.7, zz), V3(0, 1.6, zz - 0.7), V3(0.05, 1.45, zz - 3.1), null, k, { ...LOOKS.road, fov: 50 });
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.8, 'boing', { gain: 0.7 }); cue(wd, 'alarm', { dur: 1.2, gain: 0.45 }); }

  // 11 · "Meanwhile, the leader, Thomas Hicks, was begging for water."
  { const st = cut(8), wb = Wd('begging', 8);
    add({ id: 'S11', at: st, note: 'close: Hicks staggers begging with both hands; the trainers trail behind him on the road', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); hicks.group.visible = tr1.group.visible = tr2.group.visible = true; runners.forEach((r) => (r.group.visible = false));
      hicks.at(0.05, 0, -66.6); hicks.set({ mood: 'worried', sweat: 1, talk: talk(t), legs: lt < 1.4 ? 'run' : 'stand', phase: t * 2.6, armR: [lerp(100, 135, eo(seg(lt, 0, 0.6))), -12], armL: [20, 10], blink: blink(t) });
      tr1.at(-0.75, 0, -67.4); tr1.set({ legs: 'run', phase: t * 2.5 + 1, mood: 'neutral', eyes: 0 });
      tr2.at(0.8, 0, -67.8); tr2.set({ legs: 'run', phase: t * 2.5 + 2, mood: 'neutral', eyes: 0 });
      shoot(RD.scene, rdPeople, V3(-0.15, 1.7, -63.4), V3(0, 1.62, -64.4), V3(0.05, 1.5, -66.9), null, eio(clamp(lt / d)), { ...LOOKS.road, fov: 50 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wb, 'pop', { gain: 0.7 }); }

  // 12 · "So his trainers gave him something better." — the flask slides out from behind a back.
  { const st = cut(9), wg = Wd('better', 9);
    add({ id: 'S12', at: st, note: 'head-on triangle: Hicks front, the trainers flank; on "better" the amber flask rises behind trainer 1\'s back, sly look', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const rise = clamp((t - wg - 0.1) / 0.35);
      gaspers.forEach((p) => (p.group.visible = false)); runners.forEach((r) => (r.group.visible = false));
      hicks.group.visible = tr1.group.visible = tr2.group.visible = true;
      hicks.at(0, 0, -67.6); hicks.set({ mood: 'tired', sweat: 1, legs: 'stand', armR: [lerp(100, 30, eo(clamp(lt / 0.5))), -12], blink: blink(t) });
      tr1.at(-0.5, 0, -68.1); tr1.set({ mood: rise > 0.4 ? 'sly' : 'neutral', armL: [20, 10], armR: [lerp(30, 46, rise) + (rise > 0 && rise < 1 ? rise * 26 : 0), -30], holdR: rise > 0.25 ? flask : null, look: [0.5, 0], v: 'fl' + Math.floor(rise * 3), blink: blink(t, 0.8) });
      tr2.at(0.55, 0, -68.1); tr2.set({ mood: rise > 0.4 ? 'sly' : 'neutral', armL: [20, 10], armR: [20, 10], look: [-0.5, 0], blink: blink(t, 1.4) });
      shoot(RD.scene, rdPeople, V3(-0.15, 1.7, -64.3), V3(0, 1.64, -65.5), V3(0.05, 1.5, -68.0), null, k, { ...LOOKS.road, fov: 52 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wg + 0.15, 'slide', { dur: 0.4, gain: 0.5 }); }

  // 13 · "Strychnine, rat poison, mixed with raw egg white and brandy." — the WARNING card slams.
  { const st = cut(10), wp = Wd('poison', 10);
    add({ id: 'S13', at: st, note: 'head-on: the flask in trainer 1\'s hand becomes the star; a red RAT POISON card slams down; egg + brandy icons pop beside it', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); runners.forEach((r) => (r.group.visible = false));
      hicks.group.visible = tr1.group.visible = tr2.group.visible = true;
      tr1.at(-0.15, 0, -67.9); tr1.set({ mood: 'worried', armR: [126, -14], holdR: flask, v: 'f2', look: [0.4, 0.2] });
      tr2.at(-0.7, 0, -68.6); tr2.set({ mood: 'worried', armL: [55, -40], holdL: PROPS.paper('RACE LOG'), look: [-0.4, 0.2], v: 'pp2' });
      hicks.at(0.6, 0, -68.3); hicks.set({ mood: 'tired', sweat: 1, legs: 'stand' });
      shoot(RD.scene, rdPeople, V3(-0.1, 1.68, -64.8), V3(0, 1.7, -65.9), V3(-0.05, 1.5, -68.1), null, k, { ...LOOKS.road, fov: 52 });
      blit();
      const hit = clamp((t - wp + 0.1) / 0.22);
      if (hit > 0) {
        ctx.save(); const sc = lerp(1.9, 1, eo(hit)); ctx.translate(540, 500); ctx.rotate(lerp(0.18, -0.045, eo(hit))); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, hit * 2.4);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-256, -100, 512, 200);
        ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 12; ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 20); ctx.stroke();
        ctx.fillStyle = '#F4EBD6'; ctx.fillRect(-322, -87, 644, 174); ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 20); ctx.stroke();
        ctx.fillStyle = '#C8283A'; ctx.font = '900 92px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('! RAT POISON', 0, 4); ctx.restore();
        const e2 = clamp((t - wp - 0.3) / 0.2);
        if (e2 > 0 && e2 < 1) { ctx.save(); ctx.globalAlpha = 1 - e2; ctx.translate(lerp(700, 640, e2), lerp(520, 430, e2)); ctx.rotate(e2); ctx.fillStyle = '#F4EFE4'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.ellipse(0, 40, 40, 52, 0.15, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.globalAlpha = 1 - e2; ctx.translate(lerp(330, 400, e2), lerp(520, 430, e2)); ctx.rotate(-e2 * 0.7); flask(ctx, 0, 260); ctx.restore(); }
      }
    } });
    cue(st, 'whoosh'); cue(wp, 'slam', { gain: 1 }); cue(wp + 0.42, 'alarm', { dur: 0.7, gain: 0.4 }); }

  // 14 · "He hallucinated, collapsed at the finish, and was carried over the line."
  { const st = cut(11), wc = Wd('collapsed', 11), wl = Wd('line', 11) - 0.1;
    add({ id: 'S14', at: st, note: 'the sky shivers (hallucination); Hicks collapses; on "carried" the trainers hoist him and trot over the line', draw(lt, d, t, blit) {
      const k = clamp(lt / d); const hoist = clamp((t - wl) / 0.35);
      gaspers.forEach((p) => (p.group.visible = false)); runners.forEach((r) => (r.group.visible = false)); boss.group.visible = false; carv.group.visible = false;
      hicks.group.visible = tr1.group.visible = tr2.group.visible = true;
      if (t < wl) { hicks.at(0, 0, -67.8); hicks.set({ mood: 'dizzy', legs: 'stand', lean: 30, sweat: 1, look: [0, 0.6], bob: Math.sin(t * 10) * 3 }); }
      else { hicks.at(0, 0.34, -67.8); hicks.set({ mood: 'dizzy', legs: 'sit', lean: 10, bob: 0 }); }
      tr1.at(-0.5, 0, -68.3); tr1.set({ mood: 'worried', legs: hoist > 0.35 ? 'run' : 'walk', phase: t * 2.6, armL: [lerp(95, 130, eo(hoist)), -10], v: 'c' });
      tr2.at(0.55, 0, -68.3); tr2.set({ mood: 'worried', legs: hoist > 0.35 ? 'run' : 'walk', phase: t * 2.5 + 1, armR: [lerp(95, 130, eo(hoist)), -10], v: 'c' });
      const swirl = clamp((t - st - 0.3) / 0.5) * (1 - hoist);
      shoot(RD.scene, rdPeople, V3(-0.15, 1.72, -64.2), V3(0, 1.7 + swirl * 1.1, -65.6), V3(0.05, 1.45 + swirl * 0.8, -68.0), null, k, { ...LOOKS.road, fov: 52 });
      blit();
      if (swirl > 0 && swirl < 1) { ctx.save(); ctx.globalAlpha = swirl * 0.25; ctx.translate(540 + Math.sin(t * 1.7) * 70, 500 + Math.cos(t * 1.3) * 60); ctx.rotate(t * 0.7);
        ctx.fillStyle = '#C9A6E2'; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 7); ctx.fill(); ctx.restore(); }
    } });
    cue(st, 'whoosh'); cue(Wd('hallucinated', 11), 'sparkle', { dur: 1.0, gain: 0.45 }); cue(wc, 'thud', { gain: 0.7 }); cue(wl, 'boing', { gain: 0.5 }); }

  // 15 · "He still won gold, in three hours, twenty eight minutes,"
  { const st = cut(12), wg = Wd('gold', 12);
    add({ id: 'S15', at: st, note: 'the lurching carry crosses the FINISH tape under the board; medal slaps on his chest on "gold"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = false)); runners.forEach((r) => (r.group.visible = false));
      const x = lerp(-1.0, 0.6, k); const cz = lerp(-69.5, -65.6, k);
      hicks.at(0, 0.34, cz); hicks.set({ mood: 'dizzy', legs: 'sit', lean: 10 });
      tr1.at(x - 0.85, 0, cz + 0.42); tr1.set({ legs: 'run', phase: t * 5, mood: 'worried', armL: [132, -8] });
      tr2.at(x + 0.95, 0, cz + 0.42); tr2.set({ legs: 'run', phase: t * 5 + 1, mood: 'worried', armR: [132, -8] });
      hicks.group.visible = tr1.group.visible = tr2.group.visible = true; boss.group.visible = carv.group.visible = false;
      crowd.slice(4).forEach((c, i) => { c.group.visible = true; });
      shoot(RD.scene, rdPeople, V3(-2.8, 1.7, -62.4), V3(-1.6, 1.7, -62.4), V3(0, 1.5, -66.2), null, k, { ...LOOKS.road, fov: 44 });
      blit();
      const hit = clamp((t - wg) / 0.2);
      if (hit > 0) { hicks.set({ holdL: medal, v: 'mm' + Math.floor(hit * 2) }); const pop = 1 - clamp(hit - 0.7) * 2;
        if (pop > 0 && pop < 1) { ctx.save(); ctx.globalAlpha = 1 - pop; ctx.translate(540, 560); ctx.scale(lerp(2.2, 1, eo(pop)), lerp(2.2, 1, eo(pop))); medal(ctx, 0, 260); ctx.restore(); } }
    } });
    cue(st, 'whoosh'); cue(wg, 'ding', { gain: 0.9 }); cue(wg + 0.4, 'sparkle', { dur: 0.8, gain: 0.5 }); }

  // 16 · "still the slowest winning time in Olympic history." — the big 3:28:53 card stamps in.
  { const st = cut(13), wl = Wd('slowest', 13);
    add({ id: 'S16', at: st, note: 'the lurching carry crosses the FINISH tape under the board; medal slaps on his chest on "gold"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      gaspers.forEach((p) => (p.group.visible = true)); hicks.group.visible = tr1.group.visible = tr2.group.visible = true;
      hicks.at(0, 0.34, -65.6); hicks.set({ mood: 'dizzy', legs: 'sit', lean: 10 });
      tr1.at(-0.85, 0, -65.2); tr1.set({ legs: 'stand', mood: 'worried', armL: [132, -8] });
      tr2.at(0.95, 0, -65.2); tr2.set({ legs: 'stand', mood: 'worried', armR: [132, -8] });
      crowd.forEach((c, i) => { c.group.visible = true; c.set({ mood: t > wl ? 'shock' : 'neutral', look: [0, 0.2 + (i % 2) * 0.2] }); });
      shoot(RD.scene, rdPeople, V3(-2.2, 1.75, -62.4), V3(-1.7, 1.7, -62.4), V3(0, 1.5, -66.2), null, k, { ...LOOKS.road, fov: 40 });
      blit();
      const hit = clamp((t - wl - 0.05) / 0.2);
      if (hit > 0) { ctx.save(); const sc = lerp(1.7, 1, eo(hit)); ctx.translate(540, 560); ctx.rotate(lerp(-0.28, -0.045, eo(hit))); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, hit * 3);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-256, -100, 512, 200);
        ctx.fillStyle = '#F4EBD6'; ctx.fillRect(-256, -100, 512, 200); ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 10; ctx.strokeRect(-256, -100, 512, 200);
        ctx.fillStyle = '#C8283A'; ctx.font = '900 110px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('3:28:53', 0, -24);
        ctx.fillStyle = '#1F1C33'; ctx.font = '800 46px Inter'; ctx.fillText('SLOWEST EVER', 0, 52); ctx.restore(); }
    } });
    cue(st, 'whoosh'); cue(wl, 'stamp', { gain: 1 }); cue(wl + 0.42, 'tock'); cue(wl + 0.62, 'tock', { gain: 0.6 }); }

  // 17 · "Oh, and Fred Lorz? He said it was just a joke." — the car.
  { const st = cut(14), wj = Wd('joke', 14);
    add({ id: 'S17', at: st, note: 'the car parks roadside with a wave to onlookers; the grin curls wider; the whole street watches him go', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const w2e = clamp((t - wj - 0.1) / 0.35);
      gaspers.forEach((p) => (p.group.visible = false)); runners.forEach((r) => (r.group.visible = false)); hicks.group.visible = tr1.group.visible = tr2.group.visible = false;
      car1.position.set(1.6, 0, -12); lorz.group.visible = true; lorz.at(3.1, 0, -12.6);
      lorz.set({ mood: t > wj ? 'laugh' : 'smug', armL: [lerp(95, 140, eo(w2e)), lerp(-20, 10, w2e)], armR: [126, -8], holdL: medal, v: 'm2', blink: blink(t) });
      crowd.slice(0, 3).forEach((c, i) => { c.group.visible = true; c.at(-3.6 - i * 1.0, 0, -13.5 + i * 2.2); c.set({ mood: 'shock', look: [0.5, 0.15], armR: [126, -8] }); });
      shoot(RD.scene, rdPeople, V3(-0.6, 1.7, -8.6), V3(-0.2, 1.62, -10.0), V3(2.6, 1.4, -12.4), null, k, { ...LOOKS.road, fov: 52 });
      blit();
      const hit = clamp((t - wj) / 0.2);
      if (hit > 0) { ctx.save(); const sc = lerp(1.5, 1, eo(hit)); ctx.translate(540, 500); ctx.rotate(lerp(0.12, -0.045, eo(hit))); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, hit * 2.5);
        ctx.strokeStyle = '#2E4E8A'; ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(-290, -70, 580, 140, 18); ctx.stroke();
        ctx.fillStyle = '#F2D37A'; ctx.font = '900 64px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('IT WAS A JOKE', 0, 4); ctx.restore(); }
    } });
    cue(st, 'whoosh'); cue(Wd('Fred', 14), 'ding', { gain: 0.7 }); cue(wj, 'boing', { gain: 0.6 }); }

  // 18 · "A year later, un-banned, he won the Boston Marathon, for real." — sunset payoff.
  { const st = cut(15), wr = Wd('real', 15);
    add({ id: 'S18', at: st, note: 'sunrise over Boston: the same runner sprints down the road with both arms high crossing the tape, crowd roars', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const win = clamp((t - wr + 0.2) / 0.3);
      bLorz.group.visible = true; const zz = lerp(-34, -42.4, win); 
      bLorz.at(0.4, 0, zz); bLorz.set({ legs: win > 0.85 ? 'stand' : 'run', phase: t * 2.9, mood: win > 0.8 ? 'laugh' : 'proud', armL: [lerp(95, 150, eo(win)), -10], armR: [lerp(95, 150, eo(win)), -10], blink: blink(t) });
      shoot(BS.scene, [bLorz], V3(-2.6, 1.7, -34.0), V3(-1.8, 1.62, -35.4), V3(0.4, 1.5, zz - 1.5), null, k, { ...LOOKS.dusk, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wr, 'sparkle', { dur: 1.2, gain: 0.6 }); }

  return { shots: S, cues: CUES };
}
