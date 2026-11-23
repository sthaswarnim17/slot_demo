/**
 * Original vector art for Lantern Summit. Everything is drawn in code (no image files),
 * so the whole game stays tiny and all art is owned outright.
 * Symbols are SVG <symbol>s referenced with <use href="#sym-N">.
 */

const defs = `
<radialGradient id="gTurq" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#b6fff6"/><stop offset=".45" stop-color="#22b8b0"/><stop offset="1" stop-color="#0a4f57"/></radialGradient>
<radialGradient id="gCoral" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffc4b3"/><stop offset=".45" stop-color="#f0554a"/><stop offset="1" stop-color="#7d1520"/></radialGradient>
<radialGradient id="gAmber" cx="38%" cy="40%" r="70%"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#f6a623"/><stop offset="1" stop-color="#8f4a05"/></radialGradient>
<radialGradient id="gJade" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#d4ffc9"/><stop offset=".5" stop-color="#3fb56a"/><stop offset="1" stop-color="#0f4a2a"/></radialGradient>
<linearGradient id="gLapis" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8aa4ff"/><stop offset=".5" stop-color="#2a3fb8"/><stop offset="1" stop-color="#101850"/></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c4"/><stop offset=".45" stop-color="#f7c843"/><stop offset="1" stop-color="#9a6510"/></linearGradient>
<linearGradient id="gCopper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd2ad"/><stop offset=".5" stop-color="#d9733b"/><stop offset="1" stop-color="#6e2d10"/></linearGradient>
<radialGradient id="gRhodo" cx="50%" cy="85%" r="90%"><stop offset="0" stop-color="#ffd0de"/><stop offset=".45" stop-color="#ec3a6e"/><stop offset="1" stop-color="#7a0a32"/></radialGradient>
<linearGradient id="gBowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a0"/><stop offset=".55" stop-color="#c08f2e"/><stop offset="1" stop-color="#5e3f0e"/></linearGradient>
<radialGradient id="gMoon" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#b7cbee"/><stop offset="1" stop-color="#4b5f92"/></radialGradient>
<radialGradient id="gLantern" cx="50%" cy="70%" r="75%"><stop offset="0" stop-color="#fff8cf"/><stop offset=".35" stop-color="#ffc05a"/><stop offset=".75" stop-color="#f0612a"/><stop offset="1" stop-color="#8f2410"/></radialGradient>
<radialGradient id="gGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".9"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="mTeal" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#2f8f9a"/><stop offset="1" stop-color="#0b2c3a"/></radialGradient>
<radialGradient id="mPlum" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#8a3f8f"/><stop offset="1" stop-color="#2a0f36"/></radialGradient>
<radialGradient id="mPine" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#2f7a4f"/><stop offset="1" stop-color="#0b2a1c"/></radialGradient>
<radialGradient id="mRuby" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#b8322e"/><stop offset="1" stop-color="#3a0808"/></radialGradient>
<linearGradient id="gRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".35" stop-color="#e6a73c"/><stop offset=".7" stop-color="#8a4a12"/><stop offset="1" stop-color="#f2c45a"/></linearGradient>
<radialGradient id="gHalo" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#9fe6ff" stop-opacity=".0"/><stop offset=".8" stop-color="#9fe6ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fe6ff" stop-opacity="0"/></radialGradient>
<radialGradient id="gFlame" cx="50%" cy="65%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#fff2a8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<radialGradient id="gLeaf" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#8fd67a"/><stop offset="1" stop-color="#1f5a2a"/></radialGradient>
`;

/** Four-point twinkle used as a highlight on the gem symbols. */
const twinkle = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r} Q${x + r * .18} ${y - r * .18} ${x + r} ${y} Q${x + r * .18} ${y + r * .18} ${x} ${y + r} Q${x - r * .18} ${y + r * .18} ${x - r} ${y} Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z" fill="#fff"/>`;

/** Gold-rimmed medallion that sits behind the four premium symbols. */
const medallion = (fill: string, body: string) =>
  `<circle cx="50" cy="50" r="47" fill="url(#${fill})" stroke="url(#gRim)" stroke-width="4"/>
   <circle cx="50" cy="50" r="41.5" fill="none" stroke="#fff1b8" stroke-width=".8" opacity=".45" stroke-dasharray="2 3"/>
   <path d="M14 38 A38 38 0 0 1 86 38" stroke="#fff" stroke-width="3" fill="none" opacity=".12" stroke-linecap="round"/>
   <g transform="translate(11 11) scale(.78)">${body}</g>`;

const shine = `<ellipse cx="36" cy="30" rx="13" ry="7" fill="#fff" opacity=".5" transform="rotate(-32 36 30)"/>`;

export const SYMBOL_SVG: string[] = [
  // 0 Lapis: cut diamond with table, crown facets and gold flecks
  `<polygon points="50,6 92,50 50,94 8,50" fill="url(#gLapis)" stroke="#0c1340" stroke-width="3" stroke-linejoin="round"/>
   <polygon points="50,22 76,50 50,78 24,50" fill="#6f8cff" opacity=".35" stroke="#c9d4ff" stroke-width="1.2" stroke-opacity=".6"/>
   <path d="M50 6 L50 22 M92 50 L76 50 M50 94 L50 78 M8 50 L24 50 M29 29 L37 37 M71 29 L63 37 M29 71 L37 63 M71 71 L63 63" stroke="#c9d4ff" stroke-width="1.3" opacity=".55"/>
   <polygon points="50,6 24,50 37,37" fill="#fff" opacity=".42"/><polygon points="50,94 76,50 63,63" fill="#000" opacity=".25"/>
   <circle cx="58" cy="60" r="2.2" fill="#ffd76a"/><circle cx="40" cy="62" r="1.6" fill="#ffd76a"/><circle cx="62" cy="42" r="1.4" fill="#ffd76a"/>
   ${twinkle(36, 30, 7)}`,
  // 1 Jade: carved tile with a knot motif
  `<rect x="12" y="12" width="76" height="76" rx="20" fill="url(#gJade)" stroke="#0b3a20" stroke-width="3"/>
   <rect x="17" y="17" width="66" height="66" rx="16" fill="none" stroke="#bff5c9" stroke-width="1.2" opacity=".45"/>
   <path d="M36 36 H64 V64 H36Z M36 50 H64 M50 36 V64" fill="none" stroke="#0b3a20" stroke-width="5" opacity=".35" stroke-linejoin="round"/>
   <path d="M36 36 H64 V64 H36Z M36 50 H64 M50 36 V64" fill="none" stroke="#e3ffdc" stroke-width="2.6" opacity=".75" stroke-linejoin="round"/>
   <path d="M20 40 Q22 22 40 20" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
   ${twinkle(72, 74, 5)}`,
  // 2 Amber: teardrop with a trapped glow
  `<path d="M50 6 C67 32 85 50 85 64 C85 82 68 93 50 93 C32 93 15 82 15 64 C15 50 33 32 50 6Z" fill="url(#gAmber)" stroke="#6b3604" stroke-width="3"/>
   <circle cx="54" cy="66" r="14" fill="#fff6c8" opacity=".35"/>
   <path d="M50 26 C60 42 70 54 70 64" stroke="#fff3c9" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
   <ellipse cx="37" cy="56" rx="6.5" ry="12" fill="#fff" opacity=".5" transform="rotate(20 37 56)"/>
   ${twinkle(62, 38, 6)}`,
  // 3 Coral: polished bead on a cord
  `<path d="M6 50 H18 M82 50 H94" stroke="#d9a35a" stroke-width="4" stroke-linecap="round"/>
   <circle cx="50" cy="50" r="38" fill="url(#gCoral)" stroke="#5e0d16" stroke-width="3"/>
   <path d="M16 56 Q50 70 84 56" stroke="#ffd9cf" stroke-width="2.5" fill="none" opacity=".4"/>
   <ellipse cx="50" cy="50" rx="7" ry="6" fill="#5e0d16" opacity=".5"/>
   ${shine}${twinkle(66, 30, 5)}`,
  // 4 Turquoise: hexagonal cabochon with matrix veins in a silver bezel
  `<polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="#d8dde8" stroke="#4a5266" stroke-width="2.5" stroke-linejoin="round"/>
   <polygon points="50,11 85,30 85,70 50,89 15,70 15,30" fill="url(#gTurq)" stroke="#063a40" stroke-width="2" stroke-linejoin="round"/>
   <path d="M24 44 Q36 50 44 40 T64 46 M34 70 Q44 62 56 68 T76 60 M60 24 Q58 32 66 34" stroke="#0a3d43" stroke-width="2" fill="none" opacity=".55"/>
   ${shine}${twinkle(70, 64, 5)}`,
  // 5 Singing bowl with striker and sound rings (teal medallion)
  medallion('mTeal', `<path d="M22 30 Q50 18 78 30" stroke="#bff6ff" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>
   <path d="M32 20 Q50 11 68 20" stroke="#bff6ff" stroke-width="2.5" fill="none" opacity=".55" stroke-linecap="round"/>
   <path d="M12 46 H88 C88 74 72 88 50 88 C28 88 12 74 12 46Z" fill="url(#gBowl)" stroke="#4a300a" stroke-width="3"/>
   <ellipse cx="50" cy="46" rx="38" ry="8.5" fill="#f8e19a" stroke="#4a300a" stroke-width="2.5"/>
   <ellipse cx="50" cy="47" rx="31" ry="5" fill="#7a5418"/>
   <path d="M22 60 H78" stroke="#fff1c0" stroke-width="2" opacity=".5"/><path d="M26 68 H74" stroke="#5e3f0e" stroke-width="1.5" opacity=".5"/>
   <path d="M20 54 Q22 72 34 80" stroke="#fff" stroke-width="3.5" fill="none" opacity=".35" stroke-linecap="round"/>
   <rect x="64" y="58" width="32" height="7" rx="3.5" fill="#8b4a22" stroke="#3a1c08" stroke-width="2" transform="rotate(-38 80 62)"/>`),
  // 6 Copper kettle (plum medallion)
  medallion('mPlum', `<path d="M33 42 C33 16 67 16 67 42" stroke="#6e2d10" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M70 56 C82 54 86 44 92 32 L87 30 C81 41 77 46 70 49Z" fill="url(#gCopper)" stroke="#4a1d08" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M27 44 C22 70 30 88 50 88 C70 88 78 70 73 44 Z" fill="url(#gCopper)" stroke="#4a1d08" stroke-width="3"/>
   <ellipse cx="50" cy="44" rx="23" ry="6" fill="#f2a46b" stroke="#4a1d08" stroke-width="2.5"/>
   <circle cx="50" cy="35" r="5" fill="#f7c843" stroke="#4a1d08" stroke-width="2"/>
   <path d="M30 62 H70" stroke="#f7c843" stroke-width="3"/><path d="M33 70 Q50 76 67 70" stroke="#f7c843" stroke-width="1.6" fill="none"/>
   <ellipse cx="38" cy="58" rx="5" ry="12" fill="#fff" opacity=".4"/>
   <path d="M88 24 q-4 -6 0 -12 M94 26 q-4 -6 0 -12" stroke="#fff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>`),
  // 7 Rhododendron flower (pine medallion)
  medallion('mPine', `<ellipse cx="22" cy="74" rx="20" ry="9" fill="url(#gLeaf)" transform="rotate(-30 22 74)"/>
   <ellipse cx="78" cy="74" rx="20" ry="9" fill="url(#gLeaf)" transform="rotate(30 78 74)"/>
   ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="28" rx="16" ry="22" fill="url(#gRhodo)" stroke="#5c0624" stroke-width="2.5" transform="rotate(${a} 50 50)"/>`).join('')}
   ${[0, 72, 144, 216, 288].map(a => `<path d="M50 44 L50 16" stroke="#ffd0de" stroke-width="1.4" opacity=".55" transform="rotate(${a} 50 50)"/>`).join('')}
   <circle cx="50" cy="50" r="10" fill="#ffd36a" stroke="#8a4a05" stroke-width="2"/>
   ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="50" cy="38" r="2.4" fill="#fff4c0" transform="rotate(${a} 50 50)"/>`).join('')}`),
  // 8 Golden bell (ruby medallion)
  medallion('mRuby', `<circle cx="50" cy="10" r="5" fill="none" stroke="#9a6510" stroke-width="3.5"/>
   <path d="M50 14 C65 14 71 26 71 41 C71 58 76 66 86 74 H14 C24 66 29 58 29 41 C29 26 35 14 50 14Z" fill="url(#gGold)" stroke="#6b4508" stroke-width="3"/>
   <rect x="11" y="72" width="78" height="9" rx="4.5" fill="#f7c843" stroke="#6b4508" stroke-width="2.5"/>
   <circle cx="50" cy="87" r="6.5" fill="#c58a1a" stroke="#6b4508" stroke-width="2.5"/>
   <path d="M33 52 H67 M31 60 H69" stroke="#9a6510" stroke-width="2.2"/>
   <path d="M44 34 L50 28 L56 34 L50 40Z" fill="#fff6c4" stroke="#9a6510" stroke-width="1.5"/>
   <path d="M38 24 C33 32 33 44 34 56" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>
   ${twinkle(70, 22, 6)}`),
  // 9 Snow Leopard Spirit (scatter): leopard face on a glowing moon disc
  `<circle cx="50" cy="50" r="50" fill="url(#gHalo)"/>
   <circle cx="50" cy="50" r="45" fill="url(#gMoon)" stroke="#e6efff" stroke-width="3"/>
   <circle cx="50" cy="50" r="40" fill="none" stroke="#6a7fb4" stroke-width="1.5" stroke-dasharray="3 4"/>
   <circle cx="30" cy="31" r="9" fill="#d8d0c2" stroke="#2e2e3a" stroke-width="2"/>
   <circle cx="70" cy="31" r="9" fill="#d8d0c2" stroke="#2e2e3a" stroke-width="2"/>
   <circle cx="30" cy="32" r="4" fill="#b59a9a"/><circle cx="70" cy="32" r="4" fill="#b59a9a"/>
   <ellipse cx="50" cy="54" rx="27" ry="25" fill="#eee9df" stroke="#2e2e3a" stroke-width="2.2"/>
   <g fill="none" stroke="#4a4a58" stroke-width="2"><circle cx="35" cy="41" r="3"/><circle cx="65" cy="41" r="3"/><circle cx="50" cy="35" r="2.6"/><circle cx="29" cy="57" r="2.6"/><circle cx="71" cy="57" r="2.6"/><circle cx="42" cy="34" r="1.8"/><circle cx="58" cy="34" r="1.8"/></g>
   <ellipse cx="40" cy="51" rx="5.5" ry="4" fill="#4fd0ff" stroke="#123" stroke-width="1.5"/>
   <ellipse cx="60" cy="51" rx="5.5" ry="4" fill="#4fd0ff" stroke="#123" stroke-width="1.5"/>
   <ellipse cx="40" cy="51" rx="1.3" ry="3.4" fill="#0b1a24"/><ellipse cx="60" cy="51" rx="1.3" ry="3.4" fill="#0b1a24"/>
   <circle cx="41.6" cy="49.4" r="1" fill="#fff"/><circle cx="61.6" cy="49.4" r="1" fill="#fff"/>
   <ellipse cx="50" cy="67" rx="12" ry="8.5" fill="#fbf8f2"/>
   <path d="M45 60 H55 L50 65Z" fill="#d98a8a" stroke="#6b3a3a" stroke-width="1.2"/>
   <path d="M50 65 V69 M50 69 Q45 73 42 70 M50 69 Q55 73 58 70" stroke="#2e2e3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
   <path d="M38 66 L24 63 M38 69 L25 71 M62 66 L76 63 M62 69 L75 71" stroke="#6b6b78" stroke-width="1.1"/>
   ${twinkle(15, 18, 5)}${twinkle(86, 82, 4)}${twinkle(87, 20, 3)}`,
  // 10 Sky lantern (multiplier); value is drawn on top in HTML
  `<circle cx="50" cy="52" r="48" fill="url(#gGlow)"/>
   <path d="M22 18 C22 10 78 10 78 18 L69 76 H31 Z" fill="url(#gLantern)" stroke="#7a1f0c" stroke-width="2.5" stroke-linejoin="round"/>
   <ellipse cx="50" cy="62" rx="16" ry="14" fill="url(#gFlame)" opacity=".9"/>
   <path d="M38 14 L42 76 M62 14 L58 76 M50 12 V76" stroke="#c2451a" stroke-width="1.5" opacity=".5"/>
   <path d="M25 30 H75 M28 54 H72" stroke="#c2451a" stroke-width="1.2" opacity=".4"/>
   <path d="M24 22 H76" stroke="#ffe08a" stroke-width="2.5" opacity=".7"/>
   <path d="M27 20 C27 40 30 60 33 74" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>
   <rect x="30" y="75" width="40" height="5" rx="2.5" fill="#5a2a10"/>
   <path d="M50 81 C55 86 54 92 50 95 C46 92 45 86 50 81Z" fill="#ffe27a" stroke="#ff9a2a" stroke-width="1.2"/>`,
];

export function installSymbolDefs(): void {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs>${defs}</defs>` +
    SYMBOL_SVG.map((body, i) => `<symbol id="sym-${i}" viewBox="0 0 100 100">${body}</symbol>`).join('');
  document.body.prepend(svg);
}

export function symbolUse(id: number): string {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#sym-${id}"/></svg>`;
}
