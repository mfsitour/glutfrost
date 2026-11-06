'use strict';
// Glutfrost – Ziel-Hinweis (grüner Pfeil)
// =====================================================================
//  ZIEL-HINWEIS (grüner Pfeil)
// =====================================================================
function nearestOf(list, x, y, ok) {
  let b = null, bd = 1e9;
  for (const o of list) { if (!ok(o)) continue; const d = dist(o.x, o.y, x, y); if (d < bd) { bd = d; b = o; } }
  return b;
}
// Nächstes Objekt einer Zone: von außerhalb ab dem Zoneneingang gemessen, damit das Ziel unterwegs nicht hin und her springt
function nearZ(list, zone, ok) {
  if (zoneOf(player.x, player.y) === zone) return nearestOf(list, player.x, player.y, ok);
  const w = WP[zone][WP[zone].length - 1];
  return nearestOf(list, w[0], w[1], ok);
}
const treeOk = t => !t.stump && (t.zone === 'forest' ? S.own.forest : S.own.settle);
const readyHole = () => nearZ(holes, 'lake', h => h.cd <= 0);
const allCash = () => S.cash + S.cashPile + S.cashPile2;
// Aktive Baustelle, die noch Ressource k braucht (die mit dem kleinsten Rest)
function siteFor(k) {
  let b = null, bs = 1e9;
  for (const p of PADS) {
    if (!padActive(p)) continue;
    const rm = remOf(p); if (!(rm[k] > 0)) continue;
    let s = 0; for (const q in rm) s += rm[q];
    if (s < bs) { bs = s; b = p; }
  }
  return b;
}
// Was fehlt für die nächste Baustelle, deren Geld schon reicht?
function matNeed() {
  let best = null;
  for (const p of PADS) {
    if (!padActive(p)) continue;
    const rm = remOf(p);
    if ((rm.cash || 0) > allCash()) continue;
    let miss = null;
    if (rm.wood > 0) miss = 'wood';
    else for (const k of ['stone', 'crystal', 'iron']) if (rm[k] > (S[k] || 0)) { miss = k; break; }
    if (!miss) continue;
    if (miss === 'crystal' && !S.own.lake) continue;
    if (miss === 'iron' && !S.own.mine) continue;
    const score = (rm.cash || 0) + 10 * rm[miss];
    if (!best || score < best.score) best = { p, miss, score };
  }
  if (!best) return null;
  const p = best.p;
  if (best.miss === 'wood') {
    const t = nearestOf(trees, p.x, p.y, treeOk);
    return t && { x: t.x, y: t.y, t: 'Fälle Bäume – Holz für: ' + p.name() + ' 🪵', soft: 1 };
  }
  if (best.miss === 'stone') {
    const s = nearZ(stones, 'settle', o => !o.stump);
    return s && { x: s.x, y: s.y, t: 'Brich Steine – für: ' + p.name() + ' 🪨', soft: 1 };
  }
  if (best.miss === 'crystal') {
    const c = nearZ(crystals, 'lake', o => !o.stump);
    return c ? { x: c.x, y: c.y, t: 'Schlag Feuerkristalle im Eissee 🔶', soft: 1 } : null;
  }
  const r = nearZ(rocks, 'iron', o => !o.stump);
  return r && { x: r.x, y: r.y, t: 'Baue Eisenerz in der Mine ab ⛏️', soft: 1 };
}
function hint() {
  const st = player.stack;
  if (player.dead > 0) return null;
  if (player.warm < 30 && !inHexPt(player.x, player.y, HR) && !nearBraz()) {
    const toB = S.own.settle && dist(player.x, player.y, BRAZ.x, BRAZ.y) < dist(player.x, player.y, FURN.x, FURN.y);
    return toB ? { x: BRAZ.x, y: BRAZ.y + 50, t: 'Dir ist kalt! Ab ans Lagerfeuer 🔥' } : { x: FURN.x, y: FURN.y + 60, t: 'Dir ist kalt! Zurück zum Ofen 🔥' };
  }
  const qh = questHint(st); if (qh) return qh;
  if (st.includes('raw')) return { ...GRILL_IN, t: 'Bring das rohe Fleisch zum Ofen' };
  if (st.includes('cooked')) return { x: MEAT_CT.zx, y: MEAT_CT.zy, t: 'Bediene die Überlebenden an der Theke' };
  if (st.includes('smoked') && S.own.stall) return { x: STALL.zx, y: STALL.zy, t: 'Verkaufe den Räucherfisch am Marktstand' };
  if (st.includes('fish') && S.own.smoke) {
    const nf = countOf(st, 'fish'), h = readyHole();
    // Am Abladeplatz erst alles abgeben, sonst pendelt der Pfeil nach dem ersten Fisch zurück zum See
    if (nf >= Math.min(cap(), 8) || st.length >= cap() || !h || nf < st.length || dist(player.x, player.y, FISH_IN.x, FISH_IN.y) < 90) return { ...FISH_IN, t: 'Bring den Fisch zur Räucherei' };
    return { x: h.x, y: h.y, t: 'Angle weiter – ' + nf + ' Fische 🎣', soft: 1 };
  }
  if (st.includes('wood')) {
    const site = siteFor('wood');
    if (site) {
      const nw = countOf(st, 'wood'), need = remOf(site).wood;
      const t = nw < need && st.length < cap() ? nearestOf(trees, player.x, player.y, treeOk) : null;
      if (t && dist(t.x, t.y, player.x, player.y) < 500) return { x: t.x, y: t.y, t: 'Sammle Holz: ' + nw + '/' + need + ' 🪵', soft: 1 };
      return { x: site.x, y: site.y, t: 'Bring das Holz zur Baustelle: ' + site.name() };
    }
    if (S.own.kiln) return { ...KILN_IN, t: 'Bring das Holz zum Kohlenmeiler' };
  }
  if (st.includes('coal') && S.own.coalCt) return { x: COAL_CT.zx, y: COAL_CT.zy, t: 'Bring die Kohle zur Kohle-Theke' };
  // Kaufbares Bau-Feld?
  let best = null;
  for (const p of PADS) {
    if (!padActive(p)) continue;
    const rm = remOf(p); let ok = true, tot = 0;
    for (const k in rm) {
      if (!rm[k]) continue;
      const have = k === 'cash' ? allCash() : k === 'wood' ? countOf(st, 'wood') : (S[k] || 0);
      if (have < rm[k]) { ok = false; break; }
      tot += k === 'cash' ? rm[k] : rm[k] * 10;
    }
    if (ok && (!best || tot < best.rem)) best = { p, rem: tot };
  }
  const piles = [[CASH, S.cashPile], [CASH2, S.cashPile2]].filter(a => a[1] > 0)
    .sort((a, b) => dist(a[0].x, a[0].y, player.x, player.y) - dist(b[0].x, b[0].y, player.x, player.y));
  const pile = piles[0], pileSum = S.cashPile + S.cashPile2;
  const pileHint = pile && { x: pile[0].x, y: pile[0].y, t: 'Sammle dein Geld ein' };
  // Geld holen nur, wenn es gebraucht wird, nah liegt oder sich lohnt – sonst pendelt man ständig zurück
  const needCash = best && (remOf(best.p).cash || 0) > S.cash;
  if (pile && (needCash || S.cash < 5 || (pileSum >= 10 && dist(pile[0].x, pile[0].y, player.x, player.y) < 320) || pileSum >= 400)) return pileHint;
  if (best) return { x: best.p.x, y: best.p.y, t: 'Kaufen: ' + best.p.name() };
  const hasServer = npcs.some(n => n.kind === 'server');
  const wantM = queues.meat.list.some(s => s.state !== 'leave') && S.meatCt < 6;
  if (S.grillOut > 0 && wantM && !hasServer) return { ...GRILL_OUT, t: 'Hol das gebratene Fleisch ab' };
  if (S.own.coalCt && S.kilnOut > 0 && S.coalCt < 6 && !hasServer) return { ...KILN_OUT, t: 'Hol die Kohle ab' };
  if (S.own.stall && S.smokeOut > 0 && S.stallCt < 6 && !npcs.some(n => n.kind === 'seller')) return { ...SMOKE_OUT, t: 'Hol den Räucherfisch ab' };
  if (S.own.kiln && !S.own.lumber && S.kilnIn + S.kilnOut < 4 && st.length === 0) {
    const t = nearZ(trees, 'forest', o => !o.stump && o.zone === 'forest');
    if (t) return { x: t.x, y: t.y, t: 'Fälle Bäume im Wald 🌲' };
  }
  if (S.lv.hunter >= 1 && st.length === 0) { const m = matNeed(); if (m) return m; }
  if (S.own.lake && S.own.stall && !npcs.some(n => n.kind === 'fisher') && st.length === 0 && S.fishIn + S.smokeOut + S.stallCt < 12) {
    const h = readyHole(); if (h) return { x: h.x, y: h.y, t: 'Angle Fische im Eissee 🎣', soft: 1 };
  }
  const oh = offerHint(); if (oh) return oh;
  if (pile) return pileHint;
  const bb = nearZ(bears, 'field', b => !b.dead);
  if (bb) return { x: bb.x, y: bb.y, t: 'Jage Eisbären im Norden 🐻‍❄️', soft: 1 };
  return null;
}
