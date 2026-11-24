// Device library: provenance rules, and the fitted SPICE models reproduce the datasheet numbers
// they were fitted from (on-resistance, body diode, forward voltage), run through the engine.
import { allDevices, deviceSpec, findDevice, type DiodeSpec, type MosSpec } from '../src/spice/devicelib';
import { parseSpice } from '../src/spice/netlist';
import { Engine } from '../src/spice/engine';
import { allRegulators, findRegulator } from '../src/spice/regulators';
import { looksLikePartNumber, searchPrefixes } from '../src/io/partNumbers';
import { cleanUrl, parseDigikey, parseMouser } from '../src/io/distributors';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

/** Operating point of a deck that instantiates `sub` as X1 on pads p1..pn. */
function op(sub: string, pads: string[], body: string) {
  const deck = `t\n${sub}\nX1 ${pads.join(' ')} ${/\.subckt (\S+)/.exec(sub)![1]}\n${body}\n.end`;
  const r = new Engine(parseSpice(deck)).op();
  assert(r.converged, `deck converges:\n${deck}`);
  return r;
}

function run() {
  const devs = allDevices();
  let checked = 0, verified = 0;
  for (const d of devs) {
    // provenance: a verified entry names its datasheet; an unverified one says why
    if (d.verified) { verified++; assert(d.source && /Rev|rev|revision/.test(d.source), `${d.mpn}: verified entry cites a datasheet revision`); }
    else assert(d.note && /unverified|limits|estimate/i.test(d.note), `${d.mpn}: unverified entry says why`);

    const pads = [...new Set(d.units.flatMap((u) => Object.values(u.pins)))];
    const spec = deviceSpec(d, pads);
    assert(spec?.spice && spec.ports, `${d.mpn}: model emitted`);
    const sub = spec.spice;
    const node = (pad: string) => `n${pad}`;
    const portNodes = spec.ports.map(node);
    d.units.forEach((u, ui) => {
      const tag = `${d.mpn} unit ${ui + 1}`;
      if (u.kind === 'nmos' || u.kind === 'pmos') {
        const m = u as MosSpec, sg = m.kind === 'pmos' ? -1 : 1;
        // other units' pads tied to their own source/ground through 1 GΩ so the deck is regular
        const ties = pads.map((p) => `RT${p} ${node(p)} 0 1G`).join('\n');
        // on-resistance at the highest datasheet VGS, 20 mV across D–S
        const [vgs, rds] = [...m.rds].sort((a, b) => b[0] - a[0])[0];
        const on = op(sub, portNodes, `${ties}\nVS ${node(m.pins.S)} 0 0\nVG ${node(m.pins.G)} 0 ${sg * vgs}\nVD ${node(m.pins.D)} 0 ${sg * 0.02}`);
        const id = Math.abs(on.branches.get('i(VD)')!);
        const r = 0.02 / id;
        // level 1 is fitted to the on-curve; a single-point fit lands on it, a two-point fit near it
        assert(Math.abs(r - rds) / rds < 0.3, `${tag}: RDS(on) at ${vgs} V is ${(r * 1e3).toFixed(2)} mΩ, datasheet ${(rds * 1e3).toFixed(2)} mΩ`);
        if (m.body) {
          // gate off, drain pulled the "wrong" way: only the body diode conducts, and only once
          const [vsd, is] = m.body;
          const bd = op(sub, portNodes, `${ties}\nVS ${node(m.pins.S)} 0 0\nVG ${node(m.pins.G)} 0 0\nVD ${node(m.pins.D)} 0 ${-sg * vsd}`);
          const ib = Math.abs(bd.branches.get('i(VD)')!);
          assert(ib > is * 0.5 && ib < is * 2, `${tag}: body diode at ${vsd} V carries ${ib.toPrecision(3)} A, datasheet ${is} A (one diode, not two)`);
        }
      } else if (u.kind === 'res') {
        // one resistor of a network: 1 V across its two pins draws 1 V / ohms, the others stay out of it
        const ties = pads.map((p) => `RT${p} ${node(p)} 0 1G`).join('\n');
        const f = op(sub, portNodes, `${ties}\nVB ${node(u.pins['2'])} 0 0\nVA ${node(u.pins['1'])} 0 1`);
        const ia = Math.abs(f.branches.get('i(VA)')!);
        assert(Math.abs(1 / ia - u.ohms) / u.ohms < 0.01, `${tag}: ${(1 / ia).toFixed(1)} Ω between pins ${u.pins['1']} and ${u.pins['2']}, expected ${u.ohms} Ω`);
      } else if (u.kind !== 'npn' && u.kind !== 'pnp' && u.kind !== 'tvs-bi') {
        const dd = u as DiodeSpec;
        const [vf, i] = [...dd.vf].sort((a, b) => a[1] - b[1])[0];
        const ties = pads.map((p) => `RT${p} ${node(p)} 0 1G`).join('\n');
        const f = op(sub, portNodes, `${ties}\nVK ${node(dd.pins.K)} 0 0\nIA 0 ${node(dd.pins.A)} ${i}`);
        const v = f.nodes.get(node(dd.pins.A))!;
        assert(Math.abs(v - vf) < 0.03, `${tag}: VF at ${i} A is ${v.toFixed(3)} V, datasheet ${vf} V`);
      }
      checked++;
    });
  }
  assert(verified >= 8, `datasheet-verified entries: ${verified}`);
  // part numbers on boards (npm run parts): real MPNs pass, generic values do not
  for (const v of ['TLV62568DBV', 'SIC477ED-T1-GE3', 'LM62440-Q1', 'BSS138PW', 'PCA9517ADP']) assert(looksLikePartNumber(v), `${v} is a part number`);
  for (const v of ['10k', '100nF', 'C_100n_0402', 'R0402', 'DNP', 'LED_G_0603_LG', 'Inductor', '4.7uH']) assert(!looksLikePartNumber(v), `${v} is a generic value`);
  assert(JSON.stringify(searchPrefixes('SIC477ED-T1-GE3')) === JSON.stringify(['SIC477ED-T1-GE3', 'SIC477ED-T1', 'SIC477ED']), 'ordering suffixes cut at "-"');
  // distributor API responses (npm run parts fallback): parsed, best match picked, errors surfaced
  {
    const dk = parseDigikey({ Product: { ManufacturerProductNumber: 'SISA18DN-T1-GE3', Manufacturer: { Name: 'Vishay Siliconix' }, DatasheetUrl: '//www.vishay.com/docs/62579/sisa18dn.pdf',
      Description: { ProductDescription: 'MOSFET N-CH 30V' }, ProductVariations: [{ DigiKeyProductNumber: 'SISA18DN-T1-GE3CT-ND' }],
      Parameters: [{ ParameterText: 'Supplier Device Package', ValueText: 'PowerPAK® 1212-8S' }, { ParameterText: 'Vgs(th) (Max) @ Id', ValueText: '2.4V @ 250µA' }] } }, 'SISA18DN');
    assert(dk?.source === 'digikey' && dk.mfr === 'SISA18DN-T1-GE3' && dk.datasheet === 'https://www.vishay.com/docs/62579/sisa18dn.pdf' && dk.package.startsWith('PowerPAK') && dk.id.endsWith('-ND'), `Digi-Key product parsed: ${JSON.stringify(dk)}`);
    const kw = parseDigikey({ Products: [{ ManufacturerProductNumber: 'XSISA18', DatasheetUrl: 'a' }, { ManufacturerProductNumber: 'SISA18DN-T1-GE3' }] }, 'SISA18DN');
    assert(kw?.mfr === 'SISA18DN-T1-GE3', 'keyword results: the part that starts with the number wins, not a lookalike');
    const ex = parseDigikey({ ExactMatches: [{ ManufacturerProductNumber: 'SISA18DN-T1-GE3', DatasheetUrl: 'x.pdf' }], Products: [] }, 'SISA18DN');
    assert(ex?.mfr === 'SISA18DN-T1-GE3', 'keyword ExactMatches are used');
    const mo = parseMouser({ Errors: [], SearchResults: { Parts: [
      { ManufacturerPartNumber: 'BAT30CWFILMX', Manufacturer: 'ST', DataSheetUrl: '', MouserPartNumber: '511-X' },
      { ManufacturerPartNumber: 'BAT30CWFILM', Manufacturer: 'STMicroelectronics', DataSheetUrl: 'https://www.mouser.com/datasheet/2/389/bat30.pdf', MouserPartNumber: '511-BAT30CWFILM', Description: 'Schottky' },
    ] } }, 'BAT30CWFILM');
    assert(mo?.source === 'mouser' && mo.mfr === 'BAT30CWFILM' && mo.id === '511-BAT30CWFILM' && mo.datasheet.endsWith('bat30.pdf'), `Mouser: exact part number preferred: ${JSON.stringify(mo)}`);
    let threw = '';
    try { parseMouser({ Errors: [{ Code: 'Invalid', Message: 'Invalid unique identifier.' }] }, 'X1234'); } catch (e) { threw = String(e); }
    assert(/Invalid unique identifier/.test(threw), 'Mouser errors (bad key) are reported, not silently empty');
    assert(parseMouser({ SearchResults: { Parts: [] } }, 'X1234') === null && cleanUrl(' //a b.pdf') === 'https://a%20b.pdf', 'empty result and URL clean-up');
  }
  // regulators: longest part-number match, datasheet source on every entry
  assert(findRegulator('LMR16006YQ3')?.fixedOut === 3.3 && findRegulator('LMR16006XDDCR')?.vref === 0.765, 'fixed LMR16006YQ3 vs adjustable LMR16006');
  assert(findRegulator('TLV62568DBV')?.vref === 0.6 && findRegulator('SIC477ED-T1-GE3')?.vref === 0.8 && !findRegulator('LM317'), 'board values match by prefix only');
  assert(allRegulators().every((r) => /Rev|rev|20\d\d/.test(r.source) && (r.vref ?? r.fixedOut ?? r.ilim ?? r.charger) !== undefined), 'every regulator cites its datasheet and carries data');
  // Olimex-style values: part number, then a package / reel note; JEDEC 1N types with a maker's package code
  assert(findRegulator('SY8089AAAC(SOT23-5)')?.vref === 0.6 && findRegulator('HX6211A332MR')?.fixedOut === 3.3, 'regulators by board value');
  assert(findRegulator('TP4054-42-SOT25-R')?.charger?.kprog === 1000 && findRegulator('BL4054B-42TPRN(SOT23-5)')?.charger?.vfloat === 4.2, 'chargers by board value');
  assert(findDevice('1N5819S4/SOD123')?.mpn === '1N5819' && findDevice('1N5819HW-7-F')?.mpn === '1N5819' && findDevice('1N4148WS')?.mpn === '1N4148WS', '1N types: package codes and notes stripped, own entries kept');
  assert(findDevice('WPM2015-3/TR')?.mpn === 'WPM2015' && findDevice('IRLML6402TRPbF')?.mpn === 'IRLML6402', 'reel notes after a slash');
  console.log(`DEVICELIB TESTS PASSED (${devs.length} parts, ${verified} datasheet-verified with sources; ${checked} units: fitted RDS(on), body diode and VF match their datasheet points)`);
}

run();
