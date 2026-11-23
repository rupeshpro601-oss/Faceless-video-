// THE MAN WHO SOLD THE EIFFEL TOWER: the shot list (Tall Tale 3D).
// A shot: { id, at, note, draw(lt, d, t, blit) }: pose the cut-out people, move the camera, E.render(...), blit(),
// then any 2D overlay. Every shot moves the camera. Times come from the voice: cut(i) = just before line i,
// Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);

// the cast (original characters, Tall Tale recipe)
const LOOK = {
  lustig: { body: '#3E3B52', pattern: 'vest', patCol: '#2A2638', hat: 'bowler', hatCol: '#2A2638', band: '#D8343F', neck: 'collar', extra: ['mustache'] },
  poisson: { body: '#E8A34A', pattern: 'vest', patCol: '#2E4E3F', hat: 'boater', hatCol: '#F2E6CF', band: '#2E4E3F', neck: 'bowtie', neckCol: '#D8343F' },
  d1: { body: '#6FA35A', hat: 'boater', hatCol: '#E8C77A', pattern: 'stripes', extra: ['glasses'] },
  d2: { body: '#B98ACF', hat: 'tophat', hatCol: '#3B3346', neck: 'tie', neckCol: '#D8343F' },
  d3: { body: '#C7B79A', hat: 'bowler', hatCol: '#5A3A2A', neck: 'collar', extra: ['monocle'] },
  d4: { body: '#4FB3A9', hat: 'cap', hatCol: '#6E8A4F', pattern: 'apron' },
  d5: { body: '#D8584A', hat: 'none', neck: 'tie', neckCol: '#2A2638', extra: ['freckles'] },
  cop: { body: '#2E4E8A', hat: 'cap', hatCol: '#2A2638', neck: 'collar', extra: ['mustache'] },
};
const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const LOOKS = { street: { bloom: 0.15, aperture: 0.0012, maxblur: 0.008 }, room: { bloom: 0.3, aperture: 0.001, maxblur: 0.008 }, field: { bloom: 0.25, aperture: 0.001, maxblur: 0.007 } };
  const shoot = (scene, people, from, to, at, at2, k, look, focus) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };

  // ── sets ─────────────────────────────────────────────────────────────────
  const SHOP_ORDER = [['BOULANGERIE', '#C9603F', 'brick', '#D8343F'], ['CAFE', '#E58A6A', 'wood', '#2E4E3F'], ['TABAC', '#B5553C', 'brick', null], ['HOTEL DE CRILLON', '#C7B79A', 'brick', '#2E4E3F'], ['BISTRO', '#E3C16F', 'wood', '#3C6FB6'], ['BUREAU DE POSTE', '#7FA36A', 'brick', '#2E4E8A'], ['MARCHAND DE FER', '#B5553C', 'brick', '#F2C230'], ['FLEURISTE', '#B98ACF', 'wood', '#2E4E3F'], ['BANQUE', '#C7B79A', 'brick', null], ['PHARMACIE', '#5FA39A', 'wood', '#D8343F'], ['CHARCUTERIE', '#D9A34A', 'wood', null], ['THEATRE', '#A3485A', 'brick', '#F2C230']];
  const ST = WD.mainStreet(E, { shops: SHOP_ORDER });
  ST.sun.key.position.set(9, 14, 4); ST.sun.key.target.position.set(0, 0, -40);
  Object.assign(ST.sun.key.shadow.camera, { left: -26, right: 26, top: 46, bottom: -46 }); ST.sun.key.shadow.camera.updateProjectionMatrix();
  const tower = PR.eiffel(40); tower.position.set(0, 0, -92); ST.scene.add(tower);
  const FER = ST.buildings.find((b) => b.name === 'MARCHAND DE FER');         // boardwalk front of the scrap dealer
  const junk = []; for (let i = 0; i < 7; i++) { const g = i % 2 ? WD.barrel() : WD.crate(0.5 + (i % 3) * 0.25); g.position.set(4.0 + (i % 3) * 0.6, 0.18, FER.z + 1.0 + (i % 4) * 0.25); g.rotation.y = i * 0.7; ST.scene.add(g); junk.push(g); }
  const stLG = person('lustig'), stPS = person('poisson');
  [stLG, stPS].forEach((p) => ST.scene.add(p.group));
  const streetPeople = () => [...ST.people, stLG, stPS];

  const view = (scene, from, look, people = []) => { const c = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 800); c.position.copy(from); c.lookAt(look); people.forEach((p) => p.face(c)); const t = WD.snapshot(E, scene, c); t.wrapS = THREE.RepeatWrapping; return t; };

  // the Crillon meeting room: desk in the middle, tower for-sale poster, tower visible through the window
  const CR = WD.interior(E, { w: 9, depth: 7, wall: '#9E2E3A', motif: '#B8414C', ceiling: '#5A3A2A', floor: '#6B3E26', signText: 'HOTEL DE CRILLON', picture: false, counterOn: false, litter: false,
    view: view(ST.scene, V3(0, 9, -50), V3(0, 14, -96)) });
  const desk = PR.desk(2.6); desk.position.set(0, 0, -3.4); CR.scene.add(desk);
  const sale = PR.poster(['LA TOUR EIFFEL', '!FOR SALE', 'AS SCRAP METAL', 'MINISTRY OF POSTES', 'CONFIDENTIAL'], { w: 1.5, h: 1.9 }); sale.position.set(-3.35, 2.2, -3.4); sale.rotation.y = Math.PI / 2; CR.scene.add(sale);
  CR.sun.key.position.set(-2, 6, -9); CR.sun.key.target.position.set(0, 1, -3.2);
  const crLG = person('lustig');
  const dealers = ['d1', 'd2', 'd3', 'd4', 'd5'].map((k) => person(k));
  const DX = [-2.9, -1.45, 0, 1.45, 2.9], DZ = [-1.9, -1.5, -1.35, -1.5, -1.9];
  crLG.at(0.05, 0, -4.35);
  dealers.forEach((p, j) => p.at(DX[j], 0, DZ[j]));
  [crLG, ...dealers].forEach((p) => CR.scene.add(p.group));
  const crCop = person('cop'); crCop.at(5.5, 0, -1.4); crCop.group.visible = false; CR.scene.add(crCop.group);
  const crPeople = [crLG, ...dealers, crCop];
  const crPose = (t) => dealers.forEach((p, j) => p.set({ mood: 'neutral', armL: [20, 10], armR: [20, 10], blink: blink(t, j * 0.25), lean: Math.sin(t * 1.2 + j) * 1.5 }));

  // Lustig's hotel suite: the forging desk
  const SU = WD.interior(E, { w: 6.5, depth: 6, wall: '#3A5E9C', motif: '#4A6EAC', ceiling: '#2A2638', floor: '#5A3A2A', signText: null, picture: false, litter: false, view: null });
  const sDesk = PR.desk(2.0); sDesk.position.set(-0.4, 0, -2.9); SU.scene.add(sDesk);
  const suit = PR.parcel(0.8, 0.34, 0.5); suit.position.set(1.6, 0, -2.6); SU.scene.add(suit);
  SU.sun.key.position.set(-2, 6, -8); SU.sun.key.target.position.set(-0.4, 1, -2.9);
  const suLG = person('lustig'); suLG.at(-0.35, 0, -3.6); SU.scene.add(suLG.group);
  const suCase = PR.parcel(0.55, 0.6, 0.4, true); suCase.position.set(0.1, 0.88, -2.75); suCase.rotation.y = 0.4; suCase.visible = false; SU.scene.add(suCase);

  // the railway: Paris leaves in the morning
  const TR = WD.meadow(E, { fenceOn: false, treesOn: false });
  TR.sun.key.position.set(6, 12, 10); TR.sun.key.target.position.set(0, 0, -12);
  const rl = PR.rails(400); rl.position.set(0, 0, -12); TR.scene.add(rl);
  const tr = PR.train(); tr.position.set(0, 0, -12); TR.scene.add(tr);
  { const p = WD.pole(6); for (let x = -60; x < 80; x += 14) { const q = p.clone(); q.position.set(x, 0, -15); TR.scene.add(q); } }
  const trLG = person('lustig'); trLG.at(2.6, 0, -8.6); TR.scene.add(trLG.group);

  // the park below the tower, sunset, for the ending
  const PK = WD.meadow(E, { sunset: true });
  PK.sun.key.position.set(-12, 4, -18); PK.sun.key.target.position.set(0, 0, -28);
  Object.assign(PK.sun.key.shadow.camera, { left: -22, right: 22, top: 34, bottom: -34 }); PK.sun.key.shadow.camera.updateProjectionMatrix();
  const pTower = PR.eiffel(30); pTower.position.set(0, 0, -28); PK.scene.add(pTower);
  const pkLG = person('lustig'); pkLG.at(0.5, 0, -14); PK.scene.add(pkLG.group);

  // ── 1 · HOOK: "In 1925, a con man" (crane down the Paris street, tower in the distance) ──
  { const st = cut(0);
    add({ id: 'S01', at: st, note: 'crane down the Paris street, Lustig strolls ahead of us toward the tower', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      stLG.at(-1.5, 0, -34 + k * 6); stLG.set({ legs: 'walk', phase: t * 7, mood: 'smug', armL: [20, 10], armR: [25, 15], blink: blink(t) });
      stPS.group.visible = false;
      shoot(ST.scene, streetPeople(), V3(-2.2, 6.8, -20), V3(-1.7, 1.75, -10), V3(-1.5, 4.4, -46), V3(-1.55, 2.5, -64), k, { ...LOOKS.street, fov: 44 });
      blit();
    } });
    cue(st + 0.05, 'whoosh', { gain: 0.6 }); cue(Wd('1925', 0), 'ding', { gain: 0.7 }); }

  // ── 2 · "sold the Eiffel Tower." (the money changes hands at the tower's feet, SOLD!) ──
  const wsold = Wd('sold', 1);
  { const st = cut(1);
    add({ id: 'S02', at: st, note: 'tower plaza: Poisson presses a fat wad of cash into Lustig\'s hands, SOLD stamp slams', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const p = clamp((t - wsold) / 0.2);
      stLG.group.visible = stPS.group.visible = true; junk.forEach((g) => (g.visible = false));
      stLG.at(-1.15, 0, -78.25); stPS.at(0.05, 0, -78.5);
      stLG.set({ mood: p > 0 ? 'smug' : 'neutral', armL: [95, -25], armR: [95, -25], blink: blink(t) });
      stPS.set({ mood: 'happy', armR: [100, -15], holdR: PROPS.cash(4), v: 'c4', blink: blink(t, 1) });
      shoot(ST.scene, streetPeople(), V3(0.5, 1.0, -81.9), V3(0.25, 0.95, -81.4), V3(-0.55, 0.95, -78.25), null, k, { ...LOOKS.street, fov: 40 }, 3.4);
      blit();
      if (p > 0) {
        ctx.save(); ctx.translate(540, 620); ctx.rotate(-0.12); const sc = lerp(2.4, 1.15, eo(p)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, p * 1.5);
        ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-260, -95, 520, 190, 22); ctx.stroke();
        ctx.fillStyle = '#C8283A'; ctx.font = '900 110px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SOLD', 0, 6);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wsold, 'stamp', { gain: 1 }); cue(wsold + 0.02, 'slam', { gain: 0.6 }); }

  // ── 3 · "To a real scrap metal dealer," (Poisson at his junk yard, proud) ──
  { const st = cut(2);
    add({ id: 'S03', at: st, note: 'the scrap-dealer boardwalk: Poisson tips his hat, junk at his feet, push-in', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      stLG.group.visible = false; stPS.at(5.0, 0.18, FER.z + 2.2); junk.forEach((g) => (g.visible = true));
      stPS.set({ mood: 'proud', armR: [lerp(30, 150, eob(seg(lt, 0.15, 0.6))), 10], armL: [20, 10], blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(4.4, 2.0, FER.z + 8.2), V3(4.8, 1.7, FER.z + 5.4), V3(5.0, 1.5, FER.z + 2.2), null, k, LOOKS.street);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'plop', { gain: 0.5 }); }

  // ── 4 · "for a fortune." (close on the fan of bills) ──
  { const st = cut(3);
    add({ id: 'S04', at: st, note: 'close-up: Lustig fans out a fat wad of bills', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      stPS.group.visible = false; stLG.at(-1.15, 0, -78.25); stLG.group.visible = true;
      stLG.set({ mood: 'sly', armL: [100, -20], holdL: PROPS.cash(5), look: [0.5, -0.4], v: 'w', blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(-0.35, 1.55, -77.0), V3(-0.7, 1.5, -77.5), V3(-1.15, 1.35, -78.25), null, k, { ...LOOKS.street, aperture: 0.0016 }, 1.6);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'zip', { gain: 0.5 }); }

  // ── 5 · "See, Victor Lustig read in the papers" (café terrace, he reads at ease) ──
  { const st = cut(4);
    add({ id: 'S05', at: st, note: 'café terrace: Lustig reads the paper, one heel on a crate, camera pushes', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      junk.forEach((g) => (g.visible = false)); stPS.group.visible = false; stLG.at(-5.1, 0.18, -12.5);
      stLG.set({ mood: 'tired', armL: [55, -40], armR: [55, -60], holdL: PROPS.paper('LE FIGARO'), look: [0, 0.6], v: 'p', blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(-4.0, 1.7, -10.0), V3(-4.6, 1.7, -11.0), V3(-5.1, 1.4, -12.5), null, k, LOOKS.street);
      blit();
    } });
    cue(st, 'whoosh'); cue(cut(5) - 0.3, 'plop', { gain: 0.5 }); }

  // ── 6 · "that Paris couldn't afford the tower anymore." (the headline) ──
  { const st = cut(5), wh = Wd('anymore', 5);
    add({ id: 'S06', at: st, note: 'over Lustig\'s shoulder: the headline spins up on "anymore"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      stLG.at(-5.1, 0.18, -12.5);
      stLG.set({ mood: 'smug', armL: [55, -40], armR: [55, -60], holdL: PROPS.paper('LE FIGARO'), look: [0, 0.7], v: 'p', blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(-4.6, 1.85, -11.2), V3(-4.95, 1.9, -11.7), V3(-5.15, 1.55, -12.6), null, k, { ...LOOKS.street, aperture: 0.0016 }, 1.6);
      blit();
      const p = clamp((t - wh) / 0.22);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 560); ctx.rotate(-0.05); const sc = lerp(1.5, 1, eo(p)); ctx.scale(sc, sc); ctx.globalAlpha = p;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-398, -218, 840, 460); ctx.fillStyle = '#F2EDE0'; ctx.fillRect(-420, -244, 840, 460);
        ctx.fillStyle = '#1F1C33'; ctx.textAlign = 'center'; ctx.font = '900 84px Inter'; ctx.fillText('LE FIGARO', 0, -160);
        ctx.fillStyle = '#B5372E'; ctx.font = '900 60px Inter'; ctx.fillText("PARIS CAN'T AFFORD", 0, -50); ctx.fillText('THE TOWER', 0, 25);
        ctx.fillStyle = '#9B958A'; ctx.font = '800 34px Inter'; ctx.fillText('repair bills keep climbing, says city', 0, 100);
        ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 6; ctx.strokeRect(-420, -244, 840, 460);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wh, 'ding', { gain: 0.7 }); }

  // ── 7 · "So he forged government letterheads." (the suite: stamp, seal, smirk) ──
  { const st = cut(6), wf = Wd('forged', 6), wl = Wd('letterheads', 6);
    add({ id: 'S07', at: st, note: 'the suite: Lustig stamps papers; letterheads fan out on "letterheads"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      const down = Math.pow(Math.max(0, Math.sin(seg(lt, wf - st, wl - st + 0.4) * Math.PI * 3)), 1.5);
      suLG.set({ mood: 'smug', armR: [lerp(95, 150 + (down * 40), down), -10], holdR: PROPS.stamp, armL: [20, 10], look: [0.5, 0.6], v: 'st', blink: blink(t) });
      suCase.visible = down > 0.25; suCase.rotation.y = 0.4 + down;
      shoot(SU.scene, [suLG], V3(0.9, 2.0, -1.4), V3(0.5, 1.85, -1.9), V3(-0.35, 1.3, -3.1), null, k, LOOKS.room);
      blit();
    } });
    cue(st, 'whoosh'); [0, 0.34, 0.68, 1.02].forEach((o) => cue(wf + 0.1 + o, 'stamp', { gain: 0.7 })); cue(wl, 'ding', { gain: 0.5 }); }

  // ── 8 · "He invited five scrap dealers to the fanciest hotel in Paris," (sweep the room) ──
  { const st = cut(7), wpar = Wd('Paris', 7);
    add({ id: 'S08', at: st, note: 'the Crillon: camera sweeps along the five dealers to Lustig at the desk', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      crLG.set({ mood: t > wpar - 0.3 ? 'happy' : 'neutral', armL: [55, -35], armR: [55, -35], look: [-0.7, 0.2], blink: blink(t) });
      dealers.forEach((p, j) => p.set({ mood: j === 4 ? 'shock' : 'neutral', armL: [20, 10], armR: [20, 10], blink: blink(t, 0.4 + j * 0.25), lean: Math.sin(t * 1.2 + j) * 1.5 }));
      shoot(CR.scene, crPeople, V3(-3.3, 1.55, 0.6), V3(-0.4, 1.7, 1.1), V3(-2.9, 1.45, -1.9), V3(0, 1.5, -4.3), k, { ...LOOKS.room, fov: 52 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wpar, 'ding', { gain: 0.7 }); }

  // ── 9 · "and swore them all to secrecy." (lean in, hush) ──
  { const st = cut(8), wsec = Wd('secrecy', 8);
    add({ id: 'S09', at: st, note: 'the dealers lean in; Lustig raises one finger to his lips on "secrecy"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const hush = eob(seg(lt, 0.15, wsec - st + 0.1));
      dealers.forEach((p, j) => p.set({ mood: 'worried', sweat: 0.5, lean: lerp(2, 8, hush), armL: [20, 10], armR: [20, 10], blink: blink(t, j * 0.7) }));
      crLG.set({ mood: 'sly', armR: [lerp(40, 150, hush), 10], armL: [20, 10], look: [0.3, 0.6], v: 'sh' });
      shoot(CR.scene, crPeople, V3(-0.5, 1.55, -0.7), V3(-0.15, 1.5, -1.35), V3(0.05, 1.5, -4.35), null, k, { ...LOOKS.room, aperture: 0.0013 }, 2.1);
      blit();
    } });
    cue(st, 'whoosh'); cue(wsec, 'tock', { gain: 0.7 }); }

  // ── 10 · "The city was selling the tower for scrap," (the FOR SALE poster) ──
  { const st = cut(9), wsc = Wd('scrap', 9);
    add({ id: 'S10', at: st, note: 'Lustig sweeps his arm at the big LA TOUR EIFFEL poster; camera pushes past him', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      crLG.set({ mood: 'proud', armL: [20, 10], armR: [lerp(30, 130, eob(seg(lt, 0.15, 0.7))), -20], blink: blink(t) });
      shoot(CR.scene, crPeople, V3(1.6, 1.7, 0.2), V3(0.6, 1.85, -1.4), V3(-3.3, 2.2, -3.4), null, k, { ...LOOKS.room, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wsc, 'plop', { gain: 0.6 }); }

  // ── 11 · "seven thousand tons of metal." (the little tower on the desk) ──
  const wton = Wd('tons', 10);
  const mini = PR.eiffel(0.52); mini.position.set(0.75, 0.88, -3.15); CR.scene.add(mini);
  { const st = cut(10);
    add({ id: 'S11', at: st, note: 'close: a little tower model on the desk, "7,000 TONS" stamps on', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      mini.rotation.y = -0.6 + Math.sin(t * 0.25) * 0.25;
      crLG.set({ mood: 'sly', armR: [60, -60], armL: [55, -35], look: [-0.7, -0.2], v: 'm', blink: blink(t) });
      shoot(CR.scene, crPeople, V3(1.9, 1.7, -1.1), V3(1.55, 1.5, -1.85), V3(0.7, 1.1, -3.2), null, k, { ...LOOKS.room, aperture: 0.0018 }, 1.35);
      blit();
      const p = clamp((t - wton) / 0.22);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 580); ctx.rotate(-0.08); const sc = lerp(2.2, 1.1, eo(p)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, p * 1.5);
        ctx.fillStyle = '#F2E6CF'; ctx.fillRect(-360, -120, 720, 240); ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 10; ctx.strokeRect(-360, -120, 720, 240);
        ctx.fillStyle = '#D8343F'; ctx.font = '900 104px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('7,000 TONS', 0, -24); ctx.fillStyle = '#1F1C33'; ctx.font = '900 52px Inter'; ctx.fillText('OF SCRAP METAL', 0, 62);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wton, 'stamp', { gain: 0.9 }); }

  // ── 12 · "The bids came in," (cash pops onto the desk) ──
  { const st = cut(11), wb = Wd('bids', 11);
    add({ id: 'S12', at: st, note: 'bid parcels slap onto the desk one after another', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      crLG.set({ mood: 'happy', armL: [20, 10], armR: [20, 10], blink: blink(t) });
      dealers.forEach((p, j) => p.set({ mood: 'neutral', armR: [lerp(40, 80, clamp((t - wb - j * 0.12) / 0.2)), -30], blink: blink(t, j * 0.25) }));
      shoot(CR.scene, crPeople, V3(0.2, 1.45, -0.4), V3(0.05, 1.5, -0.9), V3(0, 0.95, -3.4), null, k, { ...LOOKS.room, aperture: 0.0018 }, 2.3);
      blit();
    } });
    cue(st, 'whoosh'); [0, 0.12, 0.24, 0.36].forEach((o) => cue(wb + o, 'pop', { gain: 0.7 })); }

  // ── 13 · "but one name stood out." (punch in, one bid circled) ──
  { const st = cut(12), wo = Wd('one', 12);
    add({ id: 'S13', at: st, note: 'punch-in on Lustig\'s narrowing eyes; a red ring pops around one bid', draw(lt, d, t, blit) {
      const punch = eo(clamp((t - wo) / 0.35));
      crPose(t);
      crLG.set({ mood: punch > 0.5 ? 'smug' : 'neutral', armL: [20, 10], armR: [20, 10], look: [0.5, 0.2], blink: blink(t) });
      shoot(CR.scene, crPeople, V3(0.05, 1.5, -0.9), V3(-0.05, 1.7, -2.5), V3(0.05, 1.55, -4.35), null, punch, LOOKS.room);
      blit();
      const p = clamp((t - wo) / 0.25);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 760); ctx.globalAlpha = Math.min(1, p * 1.4);
        ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 16; const r = lerp(360, 240, eo(p));
        ctx.beginPath(); ctx.arc(0, 0, r, -0.9, -0.9 + 6.28 * eo(p)); ctx.stroke();
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wo, 'boing', { gain: 0.7 }); }

  // ── 14 · "Andre Poisson, a nobody dying to make his name." ──
  { const st = cut(13), wn = Wd('nobody', 13);
    add({ id: 'S14', at: st, note: 'the lobbies: Poisson checks himself over, then stands proud, sweating', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      stPS.at(-5.1, 0.18, -20.5); stLG.group.visible = false; junk.forEach((g) => (g.visible = false));
      stPS.set({ mood: lt < 1.4 ? 'worried' : 'proud', sweat: lt < 1.4 ? 1.5 : 1, armL: lt < 1.4 ? [70, -70] : [30, 10], armR: lt < 1.4 ? [70, -70] : [30, 10], look: lt < 1.4 ? [0, 0.6] : [0.2, -0.3], v: 'm' + (lt > 1.2 ? 1 : 0), blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(-4.4, 1.7, -18.2), V3(-4.8, 1.72, -18.7), V3(-5.1, 1.5, -20.5), null, k, { ...LOOKS.street, aperture: 0.0016 }, 2.0);
      blit();
    } });
    cue(st, 'whoosh'); cue(wn, 'plop', { gain: 0.5 }); }

  // ── 15 · "He won the tower," (the handshake) ──
  { const st = cut(14), ww = Wd('won', 14);
    add({ id: 'S15', at: st, note: 'across the desk: Poisson and Lustig shake hands hard on "won"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const grip = eob(clamp((t - ww) / 0.35));
      crPose(t);
      crLG.set({ mood: 'happy', armR: [lerp(20, 102, grip), lerp(10, -15, grip)], armL: [20, 10], bob: grip * 4, blink: blink(t) });
      dealers.forEach((p, j) => p.set({ mood: j === 2 ? 'angry' : 'worried', armL: [20, 10], armR: [20, 10], blink: blink(t, j * 0.25) }));
      shoot(CR.scene, crPeople, V3(1.2, 1.5, -0.9), V3(0.7, 1.45, -1.5), V3(0.2, 1.45, -4.1), null, k, { ...LOOKS.room, fov: 48 });
      blit();
    } });
    cue(st, 'whoosh'); cue(ww, 'tock', { gain: 0.8 }); }

  // ── 16 · "then paid a fat bribe on top," ──
  { const st = cut(15), wbr = Wd('bribe', 15);
    add({ id: 'S16', at: st, note: 'Poisson slides a fat wad across the desk; Lustig\'s arm sweeps it in; dealers sweat', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      dealers.forEach((p, j) => p.set({ mood: 'worried', sweat: 1, armL: [20, 10], armR: [20, 10], blink: blink(t, j * 0.25) }));
      crLG.set({ mood: t > wbr + 0.4 ? 'smug' : 'neutral', armR: t > wbr + 0.4 ? [70, -50] : [20, 10], holdR: t > wbr + 0.4 ? PROPS.cash(6) : null, look: [0.6, -0.4], v: 'g' + (t > wbr + 0.4 ? 1 : 0), blink: blink(t) });
      shoot(CR.scene, crPeople, V3(-0.15, 1.5, -1.35), V3(0.1, 1.55, -0.7), V3(0.2, 1.45, -4.1), null, k, { ...LOOKS.room, fov: 48 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wbr, 'zip', { gain: 0.7 }); cue(wbr + 0.42, 'pop', { gain: 0.8 }); }

  // ── 17 · "just to make the deal go through." (the contract gets its stamp) ──
  { const st = cut(16), wd = Wd('deal', 16);
    add({ id: 'S17', at: st, note: 'the CONTRACT fetches its rubber stamp, then slaps onto the screen, both men grinning', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      crLG.set({ mood: 'laugh', armL: [20, 10], armR: t < wd - st ? [120, -10] : [40, -30], holdR: t < wd - st ? PROPS.rubberStamp : null, v: 'r' + (t < wd - st ? 1 : 0) });
      shoot(CR.scene, crPeople, V3(0.7, 1.45, -1.5), V3(0.3, 1.5, -2.1), V3(0.2, 1.45, -4.1), null, k, { ...LOOKS.room, fov: 48 });
      blit();
      const p = clamp((t - wd + 0.1) / 0.2);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 700); ctx.rotate(lerp(-0.3, -0.08, eo(p))); const sc = lerp(1.9, 1, eo(p)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, p * 1.5);
        ctx.fillStyle = '#F4EBD6'; ctx.fillRect(-300, -200, 600, 400); ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 8; ctx.strokeRect(-280, -180, 560, 340);
        ctx.fillStyle = '#1F1C33'; ctx.font = '900 58px Inter'; ctx.textAlign = 'center'; ctx.fillText('CONTRACT', 0, -110);
        ctx.fillStyle = '#9B958A'; ctx.font = '800 30px Inter'; ctx.fillText('ONE (1) EIFFEL TOWER', 0, 30); ctx.fillText('SELLER: MINISTRY OF POSTES', 0, 80);
        ctx.fillStyle = '#C8283A'; ctx.font = '900 44px Inter'; ctx.fillText('PAID  +  PAID', 0, 150);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh'); cue(wd, 'slam', { gain: 0.6 }); cue(wd + 0.1, 'stamp', { gain: 0.9 }); }

  // ── 18 · "The next morning, Lustig was on a train to Vienna," ──
  { const st = cut(17), wtr = Wd('train', 17);
    add({ id: 'S18', at: st, note: 'the express thunders past; Lustig walks away from the tracks, cash in hand', draw(lt, d, t, blit) {
      const k = clamp(lt / d); const x = -26 + eio(clamp((t - wtr + 0.4) / (39.4 - wtr + 0.4))) * 34; tr.position.x = x; tr.update(t);
      trLG.at(2.6, 0, -8.6); trLG.set({ legs: 'walk', phase: t * 6.5, mood: 'smug', armL: [20, 10], armR: [25, 15], holdR: PROPS.cash(3), v: 'c', blink: blink(t) });
      shoot(TR.scene, [trLG], V3(2.9, 1.7, -6.0), V3(1.6, 1.55, -6.3), V3(2.6, 1.4, -8.6), null, k, { ...LOOKS.field, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wtr, 'chug', { dur: 3.2, gain: 0.9 }); }

  // ── 19 · "and Poisson never called the police." (he waits at the tower, alone) ──
  { const st = cut(18), wp = Wd('police', 18);
    add({ id: 'S19', at: st, note: 'the tower plaza: Poisson waits with his contract, glancing around; camera pulls back', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const glance = Math.sin(t * 2.4) > 0 ? 1.5 : -1.5;
      stPS.at(2.0, 0, -61.0); stLG.group.visible = false; junk.forEach((g) => (g.visible = false));
      stPS.set({ mood: 'worried', sweat: 1.5, armR: [30, -85], holdR: PROPS.paper('CONTRACT'), look: [glance, 0.2], v: 'w', blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(3.4, 1.7, -57.6), V3(2.9, 2.1, -56.2), V3(2.0, 2.0, -61.0), V3(0, 20, -92), k, { ...LOOKS.street, fov: 42 }, 5);
      blit();
    } });
    cue(st, 'whoosh'); cue(wp - 0.3, 'gulp', { gain: 0.7 }); }

  // ── 20 · "Too embarrassed to say he'd bought the Eiffel Tower." ──
  { const st = cut(19), we = Wd('Eiffel', 19);
    add({ id: 'S20', at: st, note: 'close-up: Poisson hides his face behind the contract, eyes damp, sweat dripping', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const hide = eob(clamp((t - st - 0.3) / 0.4));
      stPS.at(2.0, 0, -61.0);
      stPS.set({ mood: 'sad', sweat: 4, armR: [lerp(30, 150, hide), 10], armL: [lerp(30, 148, hide), 14], holdR: PROPS.paper('CONTRACT'), look: [0, hide > 0.5 ? 0.8 : 0.4], v: 'h' + (hide > 0.5 ? 1 : 0), blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(2.35, 1.62, -59.9), V3(2.15, 1.58, -60.3), V3(2.0, 1.5, -61.0), null, k, { ...LOOKS.street, aperture: 0.0018 }, 1.6);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'slide', { dur: 0.5, gain: 0.5 }); cue(we, 'plop', { gain: 0.5 }); }

  // ── 21 · "Then Lustig came back for round two," ──
  { const st = cut(20), wr = Wd('round', 20);
    add({ id: 'S21', at: st, note: 'back at the Crillon: Lustig raises a coffee cup, a NEW deck of dealers applauds; crane down', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); crPose(t);
      crLG.set({ mood: 'laugh', armR: [lerp(20, 140, eob(seg(lt, 0.15, 0.6))), 10], armL: [20, 10], holdR: PROPS.cup, v: 'cup' });
      dealers.forEach((p, j) => p.set({ mood: 'happy', armL: [lerp(20, 140 + Math.sin(t * 6 + j) * 12, clamp((t - st - 0.3 - j * 0.25) / 0.35)), 10], armR: [lerp(20, 140 + Math.sin(t * 6 + j + 1) * 12, clamp((t - st - 0.3 - j * 0.25) / 0.35)), 10], blink: blink(t, j * 0.25), v: 'ap' + j }));
      shoot(CR.scene, crPeople, V3(0.2, 4.6, 1.4), V3(0.05, 1.7, 1.1), V3(0, 1.6, -3.4), null, k, { ...LOOKS.room, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wr, 'pop', { gain: 0.7 }); cue(wr + 0.3, 'sparkle', { gain: 0.5 }); }

  // ── 22 · "but that mark called the cops," ──
  { const st = cut(21), wc = Wd('cops', 21);
    add({ id: 'S22', at: st, note: 'the gendarme bursts in on "cops", pointing; dealers rear back; Lustig freezes mid-toast', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); const p = clamp((t - wc) / 0.25);
      crLG.set({ mood: p > 0 ? 'shock' : 'laugh', armR: [140, 10], armL: p > 0 ? [lerp(20, 150, p), 5] : [20, 10], sweat: p, holdR: PROPS.cup, v: 'sh', blink: blink(t) });
      crCop.group.visible = p > 0.25;
      crCop.at(lerp(6.5, 4.6, p), 0, -1.4); crCop.set({ mood: 'angry', armR: [lerp(95, 100, p), -20], armL: [20, 10], look: [-0.7, 0.3], v: 'c' + Math.floor(p * 2) });
      dealers.forEach((dd, j) => {
        dd.set({ mood: p > 0 ? 'shock' : 'happy', sweat: p, armL: [20 + p * 40, 10], armR: [20 + p * 40, 10], lean: -p * 10, blink: blink(t, j * 0.25), v: 'sc' + j });
        dd.at(DX[j] + p * (j < 2 ? 1.3 : j > 2 ? -1.3 : 0), 0, DZ[j] + p * 0.6);
      });
      shoot(CR.scene, crPeople, V3(0.05, 1.7, 1.1), V3(0.15, 1.62, 0.2), V3(0, 1.55, -3.4), null, k, { ...LOOKS.room, fov: 52 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wc, 'alarm', { dur: 1.6, gain: 0.7 }); cue(wc, 'boing', { gain: 0.5 }); }

  // ── 23 · "and Lustig vanished to America." ──
  { const st = cut(22), wa = Wd('America', 22);
    add({ id: 'S23', at: st, note: 'the street: Lustig sprints for the docks clutching the cash, camera whips with him', draw(lt, d, t, blit) {
      const kk = clamp(lt / d); const run = eio(kk);
      junk.forEach((g) => (g.visible = false)); stPS.group.visible = false; stLG.group.visible = true;
      stLG.at(-4.9, 0.18, -4 + run * 7.5); stLG.set({ legs: 'run', phase: t * 11, mood: 'worried', sweat: 4, armL: [85 + Math.sin(t * 11) * 30, 10], armR: [85 - Math.sin(t * 11) * 30, 10], holdL: PROPS.cash(4), lean: 8, v: 'w', blink: blink(t) });
      shoot(ST.scene, streetPeople(), V3(-2.2, 1.55, 3.4), V3(-2.5, 1.55, 5.6), V3(-4.6, 1.45, -1 + run * 5), V3(-4.8, 1.45, -3 + run * 5), kk, { ...LOOKS.street, fov: 56 });
      blit();
      const p = clamp((t - wa) / 0.2);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 640); ctx.rotate(-0.12); const sc = lerp(2.2, 1.1, eo(p)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, p * 1.5);
        ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 12; ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 20); ctx.stroke();
        ctx.fillStyle = '#C8283A'; ctx.font = '900 84px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NEW YORK', 0, 6);
        ctx.restore();
      }
    } });
    cue(st, 'whoosh', { gain: 0.8 }); cue(wa, 'stamp', { gain: 0.9 }); cue(wa + 0.02, 'slam', { gain: 0.5 }); }

  // ── 24 · "And the tower?" (the tower at sunset) ──
  { const st = cut(23);
    add({ id: 'S24', at: st, note: 'sunset: tilt up from the base to the summit of the tower', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); pkLG.group.visible = false;
      shoot(PK.scene, [pkLG], V3(0, 1.4, -22.5), V3(0, 9.5, -20.0), V3(0, 1.5, -28), V3(0, 26, -28), k, { ...LOOKS.field, fov: 44 });
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.15, 'sparkle', { gain: 0.6 }); }

  // ── 25 · "Still standing." (wide, Lustig tiny and furious at the bottom) ──
  const wst = Wd('standing', 24);
  { const st = cut(24);
    add({ id: 'S25', at: st, note: 'the pull-back: the whole tower in the sunset; tiny Lustig shakes his fist below', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      pkLG.group.visible = true; pkLG.at(0.6, 0, -19.5);
      pkLG.set({ mood: 'angry', armR: [lerp(95, 150 + Math.sin(t * 10) * 14, eo(seg(lt, 0.15, 0.6))), 5], armL: [20, 10], look: [0.6, 1], v: 'f', blink: blink(t) });
      shoot(PK.scene, [pkLG], V3(2.4, 1.7, -13.5), V3(2.0, 2.6, -11.5), V3(0.6, 1.4, -19.5), V3(0, 4.5, -26), k, { ...LOOKS.field, fov: 40 });
      blit();
    } });
    cue(st, 'whoosh'); cue(wst, 'ding', { gain: 0.8 }); cue(wst + 0.2, 'sparkle', { gain: 0.7 }); }

  return { shots: S, cues: CUES };
}
