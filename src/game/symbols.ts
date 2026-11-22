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
<radialGradient id="gLeaf" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#8fd67a"/><stop offset="1" stop-color="#1f5a2a"/></radialGradient>
`;

const shine = `<ellipse cx="36" cy="30" rx="13" ry="7" fill="#fff" opacity=".5" transform="rotate(-32 36 30)"/>`;

export const SYMBOL_SVG: string[] = [
  // 0 Lapis: faceted diamond with gold flecks
  `<polygon points="50,7 91,50 50,93 9,50" fill="url(#gLapis)" stroke="#0c1340" stroke-width="3" stroke-linejoin="round"/>
   <polygon points="50,22 76,50 50,78 24,50" fill="#fff" opacity=".13"/>
   <path d="M50 7 L50 22 M91 50 L76 50 M50 93 L50 78 M9 50 L24 50" stroke="#c9d4ff" stroke-width="1.5" opacity=".5"/>
   <circle cx="58" cy="58" r="2.2" fill="#ffd76a"/><circle cx="40" cy="62" r="1.6" fill="#ffd76a"/><circle cx="62" cy="40" r="1.4" fill="#ffd76a"/>
   <polygon points="50,12 30,40 40,38" fill="#fff" opacity=".45"/>`,
  // 1 Jade: carved rounded tile
  `<rect x="14" y="14" width="72" height="72" rx="20" fill="url(#gJade)" stroke="#0b3a20" stroke-width="3"/>
   <rect x="29" y="29" width="42" height="42" rx="12" fill="none" stroke="#e3ffdc" stroke-width="3" opacity=".55"/>
   <circle cx="50" cy="50" r="7" fill="none" stroke="#e3ffdc" stroke-width="3" opacity=".55"/>${shine}`,
  // 2 Amber: teardrop
  `<path d="M50 7 C67 32 84 50 84 64 C84 82 68 92 50 92 C32 92 16 82 16 64 C16 50 33 32 50 7Z" fill="url(#gAmber)" stroke="#6b3604" stroke-width="3"/>
   <path d="M50 26 C60 42 70 54 70 64" stroke="#fff3c9" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
   <ellipse cx="38" cy="56" rx="7" ry="11" fill="#fff" opacity=".45" transform="rotate(20 38 56)"/>`,
  // 3 Coral: polished round bead
  `<circle cx="50" cy="50" r="38" fill="url(#gCoral)" stroke="#5e0d16" stroke-width="3"/>
   <path d="M18 54 Q50 66 82 54" stroke="#ffd9cf" stroke-width="2.5" fill="none" opacity=".45"/>
   <circle cx="50" cy="50" r="6" fill="#5e0d16" opacity=".5"/>${shine}`,
  // 4 Turquoise: hexagonal cabochon with matrix veins
  `<polygon points="50,8 87,29 87,71 50,92 13,71 13,29" fill="url(#gTurq)" stroke="#063a40" stroke-width="3" stroke-linejoin="round"/>
   <path d="M24 44 Q36 50 44 40 T64 46 M34 70 Q44 62 56 68 T76 60" stroke="#0a3d43" stroke-width="2" fill="none" opacity=".55"/>${shine}`,
  // 5 Singing bowl with striker and sound rings
  `<path d="M22 30 Q50 18 78 30" stroke="#ffe9a8" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>
   <path d="M32 20 Q50 11 68 20" stroke="#ffe9a8" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>
   <path d="M12 46 H88 C88 74 72 88 50 88 C28 88 12 74 12 46Z" fill="url(#gBowl)" stroke="#4a300a" stroke-width="3"/>
   <ellipse cx="50" cy="46" rx="38" ry="8.5" fill="#f8e19a" stroke="#4a300a" stroke-width="2.5"/>
   <ellipse cx="50" cy="47" rx="31" ry="5" fill="#7a5418"/>
   <path d="M22 60 H78" stroke="#fff1c0" stroke-width="2" opacity=".5"/>
   <rect x="64" y="58" width="32" height="7" rx="3.5" fill="#8b4a22" stroke="#3a1c08" stroke-width="2" transform="rotate(-38 80 62)"/>`,
  // 6 Copper kettle (butter-tea pot)
  `<path d="M33 42 C33 16 67 16 67 42" stroke="#6e2d10" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M70 56 C82 54 86 44 92 32 L87 30 C81 41 77 46 70 49Z" fill="url(#gCopper)" stroke="#4a1d08" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M27 44 C22 70 30 88 50 88 C70 88 78 70 73 44 Z" fill="url(#gCopper)" stroke="#4a1d08" stroke-width="3"/>
   <ellipse cx="50" cy="44" rx="23" ry="6" fill="#f2a46b" stroke="#4a1d08" stroke-width="2.5"/>
   <circle cx="50" cy="35" r="5" fill="#f7c843" stroke="#4a1d08" stroke-width="2"/>
   <path d="M30 62 H70" stroke="#f7c843" stroke-width="3"/>
   <ellipse cx="38" cy="58" rx="5" ry="12" fill="#fff" opacity=".35"/>`,
  // 7 Rhododendron flower
  `<ellipse cx="22" cy="72" rx="20" ry="9" fill="url(#gLeaf)" transform="rotate(-30 22 72)"/>
   <ellipse cx="78" cy="72" rx="20" ry="9" fill="url(#gLeaf)" transform="rotate(30 78 72)"/>
   ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="28" rx="16" ry="22" fill="url(#gRhodo)" stroke="#5c0624" stroke-width="2.5" transform="rotate(${a} 50 50)"/>`).join('')}
   <circle cx="50" cy="50" r="10" fill="#ffd36a" stroke="#8a4a05" stroke-width="2"/>
   ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="50" cy="38" r="2.4" fill="#fff4c0" transform="rotate(${a} 50 50)"/>`).join('')}`,
  // 8 Golden bell
  `<circle cx="50" cy="10" r="5" fill="none" stroke="#9a6510" stroke-width="3.5"/>
   <path d="M50 14 C65 14 71 26 71 41 C71 58 76 66 86 74 H14 C24 66 29 58 29 41 C29 26 35 14 50 14Z" fill="url(#gGold)" stroke="#6b4508" stroke-width="3"/>
   <rect x="11" y="72" width="78" height="9" rx="4.5" fill="#f7c843" stroke="#6b4508" stroke-width="2.5"/>
   <circle cx="50" cy="87" r="6.5" fill="#c58a1a" stroke="#6b4508" stroke-width="2.5"/>
   <path d="M33 52 H67" stroke="#9a6510" stroke-width="2.5"/>
   <path d="M38 24 C33 32 33 44 34 56" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>`,
  // 9 Snow Leopard Spirit (scatter): leopard face on a moon disc
  `<circle cx="50" cy="50" r="46" fill="url(#gMoon)" stroke="#e6efff" stroke-width="3"/>
   <circle cx="50" cy="50" r="40" fill="none" stroke="#6a7fb4" stroke-width="1.5" stroke-dasharray="3 4"/>
   <circle cx="30" cy="31" r="9" fill="#d8d0c2" stroke="#2e2e3a" stroke-width="2"/>
   <circle cx="70" cy="31" r="9" fill="#d8d0c2" stroke="#2e2e3a" stroke-width="2"/>
   <circle cx="30" cy="32" r="4" fill="#b59a9a"/><circle cx="70" cy="32" r="4" fill="#b59a9a"/>
   <ellipse cx="50" cy="54" rx="27" ry="25" fill="#eee9df" stroke="#2e2e3a" stroke-width="2.2"/>
   <g fill="none" stroke="#4a4a58" stroke-width="2"><circle cx="35" cy="41" r="3"/><circle cx="65" cy="41" r="3"/><circle cx="50" cy="35" r="2.6"/><circle cx="29" cy="57" r="2.6"/><circle cx="71" cy="57" r="2.6"/><circle cx="42" cy="34" r="1.8"/><circle cx="58" cy="34" r="1.8"/></g>
   <ellipse cx="40" cy="51" rx="5.5" ry="4" fill="#4fd0ff" stroke="#123" stroke-width="1.5"/>
   <ellipse cx="60" cy="51" rx="5.5" ry="4" fill="#4fd0ff" stroke="#123" stroke-width="1.5"/>
   <ellipse cx="40" cy="51" rx="1.3" ry="3.4" fill="#0b1a24"/><ellipse cx="60" cy="51" rx="1.3" ry="3.4" fill="#0b1a24"/>
   <ellipse cx="50" cy="67" rx="12" ry="8.5" fill="#fbf8f2"/>
   <path d="M45 60 H55 L50 65Z" fill="#d98a8a" stroke="#6b3a3a" stroke-width="1.2"/>
   <path d="M50 65 V69 M50 69 Q45 73 42 70 M50 69 Q55 73 58 70" stroke="#2e2e3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
   <path d="M38 66 L24 63 M38 69 L25 71 M62 66 L76 63 M62 69 L75 71" stroke="#6b6b78" stroke-width="1.1"/>
   <path d="M14 18 l3 0 m-1.5 -1.5 l0 3 M84 82 l3 0 m-1.5 -1.5 l0 3 M86 20 l2 0 m-1 -1 l0 2" stroke="#fff" stroke-width="1.5"/>`,
  // 10 Sky lantern (multiplier); value is drawn on top in HTML
  `<circle cx="50" cy="52" r="48" fill="url(#gGlow)"/>
   <path d="M22 18 C22 10 78 10 78 18 L69 76 H31 Z" fill="url(#gLantern)" stroke="#7a1f0c" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M38 14 L42 76 M62 14 L58 76 M50 12 V76" stroke="#c2451a" stroke-width="1.5" opacity=".55"/>
   <path d="M26 34 H74" stroke="#c2451a" stroke-width="1.2" opacity=".45"/>
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
