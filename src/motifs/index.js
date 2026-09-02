/**
 * Shared motif kit
 * ----------------
 * Every mark here is monoline SVG driven by CSS custom properties, so the same
 * geometry can be re-skinned per site:
 *
 *   --motif-stroke   line colour
 *   --motif-weight   stroke width
 *   --motif-accent   secondary colour for fills / details
 *
 * Paths tagged `data-draw` are picked up by initDraw() and animate themselves
 * on with stroke-dashoffset.
 */

const S = 'fill="none" stroke="var(--motif-stroke,currentColor)" stroke-width="var(--motif-weight,1.5)" stroke-linecap="round" stroke-linejoin="round"';
const SA = 'fill="none" stroke="var(--motif-accent,currentColor)" stroke-width="var(--motif-weight,1.5)" stroke-linecap="round" stroke-linejoin="round"';

/* ── Structure ──────────────────────────────────────────────────────────── */

/** Ogee (onion) arch — the structural device the whole system hangs off. */
export function archFrame({ id = 'arch', draw = true } = {}) {
  const d = 'M12 258 L12 132 C12 84 40 52 74 34 C88 26 96 16 100 4 C104 16 112 26 126 34 C160 52 188 84 188 132 L188 258';
  const inner = 'M26 258 L26 136 C26 94 50 66 80 50 C90 44 96 36 100 26 C104 36 110 44 120 50 C150 66 174 94 174 136 L174 258';
  return `<svg class="motif motif--arch" viewBox="0 0 200 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path ${S} d="${d}" ${draw ? 'data-draw' : ''}/>
    <path ${SA} d="${inner}" opacity=".55" ${draw ? 'data-draw data-draw-delay=".18"' : ''}/>
    <path ${SA} d="M100 4 L100 -6" opacity=".55"/>
  </svg>`;
}

/**
 * Jaali lattice — an eight-point star formed by two overlapping squares, with
 * corner ties so the tile repeats seamlessly. This is also the ajrak engine:
 * swap the tile geometry, keep the plumbing.
 */
export function jaaliPattern({ id = 'jaali', size = 40, opacity = 0.5 } = {}) {
  return `<svg class="motif motif--jaali" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
        <g ${S} opacity="${opacity}">
          <path d="M6 20 L20 6 L34 20 L20 34 Z"/>
          <path d="M8 8 L32 8 L32 32 L8 32 Z"/>
          <path d="M0 0 L8 8 M40 0 L32 8 M0 40 L8 32 M40 40 L32 32"/>
          <circle cx="20" cy="20" r="2.5"/>
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#${id})"/>
  </svg>`;
}

/** Hairline rule with a centred flourish — replaces the ✦ ❋ ✦ text dividers. */
export function ornamentRule() {
  return `<svg class="motif motif--rule" viewBox="0 0 240 24" aria-hidden="true" focusable="false">
    <g ${S}>
      <path d="M0 12 L92 12" opacity=".5"/>
      <path d="M148 12 L240 12" opacity=".5"/>
      <path d="M120 3 C126 8 132 10 138 12 C132 14 126 16 120 21 C114 16 108 14 102 12 C108 10 114 8 120 3 Z"/>
      <circle cx="120" cy="12" r="1.6"/>
    </g>
  </svg>`;
}

/** An ornamental corner — a double rule with a palmette set in the elbow. */
export function cornerBracket() {
  return `<svg class="motif motif--corner" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <g ${S}>
      <path d="M2 46 L2 12 C2 6.5 6.5 2 12 2 L46 2"/>
      <path d="M10 46 L10 17 C10 13.1 13.1 10 17 10 L46 10" opacity=".5"/>
    </g>
    <g ${SA} transform="translate(19 19) rotate(45)">
      <path d="M0 0 C 5 -6, 12 -6, 16 0 C 12 6, 5 6, 0 0 Z" opacity=".9"/>
      <path d="M3 0 L13 0" opacity=".6"/>
      <path d="M4 -2.4 L11.5 -3.2 M4 2.4 L11.5 3.2" opacity=".6"/>
    </g>
    <circle ${SA} cx="14.5" cy="14.5" r="1.4"/>
  </svg>`;
}

/* ── Botanical vignettes ────────────────────────────────────────────────── */

/** Catmull-Rom through the sampled points, as one smooth cubic path. */
function throughPoints(pts) {
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/** Even arc-length stations along a sampled polyline, with tangent angles. */
function walk(pts, spacing, start = 0) {
  const out = [];
  let carried = start;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const seg = Math.hypot(x2 - x1, y2 - y1);
    let t = carried;
    while (t <= seg) {
      const f = t / seg;
      out.push({
        x: x1 + (x2 - x1) * f,
        y: y1 + (y2 - y1) * f,
        a: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI,
      });
      t += spacing;
    }
    carried = t - seg;
  }
  return out;
}

/** Five petals and a stamen centre — one motia blossom, opened. */
function motiaFlower(scale) {
  const petal = 'M0 0 C -3.6 -4.2, -3.1 -9.6, 0 -11.8 C 3.1 -9.6, 3.6 -4.2, 0 0 Z';
  const petals = [0, 1, 2, 3, 4]
    .map((i) => `<path ${SA} d="${petal}" transform="rotate(${i * 72})"/>`)
    .join('');
  return `<g transform="scale(${scale})">${petals}<circle ${S} cx="0" cy="0" r="1.9"/></g>`;
}

/** A closed bud — the same flower before it opens. */
function motiaBud(scale) {
  return `<g transform="scale(${scale})"><path ${SA} d="M0 0 C -2.3 -2.8, -2 -6.8, 0 -8.6 C 2 -6.8, 2.3 -2.8, 0 0 Z"/></g>`;
}

/** A lanceolate leaf on its petiole, midrib included, tip along +x. */
function vineLeaf(len) {
  const k = len / 30;
  return `<g transform="scale(${k.toFixed(3)})">
    <path ${S} d="M0 0 L5.5 -1.6"/>
    <path ${S} d="M5.5 -1.6 C 12 -8.2, 22 -10.4, 30 -7 C 22.5 -0.4, 12.5 2, 5.5 -1.6 Z"/>
    <path ${S} d="M7 -1.9 C 14 -3.4, 22 -5.2, 28.4 -6.6" opacity=".5"/>
  </g>`;
}

/**
 * Jasmine (motia) vine — the strung garland, drawn as botany rather than
 * beads on a wire: one undulating stem with blossoms at every crest and
 * trough, leaves and buds off the crossings, and a tendril every fourth node.
 *
 * Sized by `slice`, not `meet`: the host's height fixes how big a blossom is
 * and the vine is simply cropped to whatever width there is, so a phone shows
 * fewer flowers at the same scale rather than the same flowers shrunk. `units`
 * therefore only needs to be long enough to overrun the widest viewport.
 */
export function jasmineGarland({ draw = true, units = 16 } = {}) {
  const P = 150;          // wavelength
  const A = 15;           // amplitude
  const MID = 52;         // centre line
  const W = P * units;

  const yAt = (x) => MID - A * Math.sin((2 * Math.PI * x) / P);
  const angleAt = (x) => {
    const dy = -A * ((2 * Math.PI) / P) * Math.cos((2 * Math.PI * x) / P);
    return (Math.atan2(dy, 1) * 180) / Math.PI;
  };

  const samples = [];
  for (let x = 0; x <= W; x += P / 8) samples.push([x, yAt(x)]);
  const stem = throughPoints(samples);

  const parts = [];
  const nodes = units * 2;

  for (let k = 0; k < nodes; k += 1) {
    // Crests and troughs: the flowers sit where the stem turns.
    const x = P / 4 + (k * P) / 2;
    const y = yAt(x);
    const up = k % 2 === 0;
    const sign = up ? -1 : 1;
    const scale = k % 3 === 1 ? 0.82 : 1;

    parts.push(`<path ${S} d="M${x.toFixed(2)} ${y.toFixed(2)} L${x.toFixed(2)} ${(y + sign * 9).toFixed(2)}" opacity=".7"/>`);
    parts.push(`<g transform="translate(${x.toFixed(2)} ${(y + sign * 9).toFixed(2)}) rotate(${up ? 0 : 180})">${motiaFlower(scale)}</g>`);

    // A bud on the far side of each blossom, tilted away from it.
    const bx = x + (up ? 19 : -19);
    const by = yAt(bx);
    const tilt = up ? -30 : 150;
    parts.push(`<g transform="translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${tilt})"><path ${S} d="M0 0 L0 -5" opacity=".7"/><g transform="translate(0 -5)">${motiaBud(0.95)}</g></g>`);
  }

  for (let k = 0; k <= nodes; k += 1) {
    // Leaves come in pairs at the crossings, so the stem reads as a growing
    // shoot rather than a wire with things hung off it.
    const x = (k * P) / 2;
    if (x > W) break;
    const y = yAt(x);
    const t = angleAt(x);
    const long = k % 2 ? 30 : 26;
    const short = k % 2 ? 24 : 28;
    parts.push(`<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(t - 34).toFixed(1)})">${vineLeaf(long)}</g>`);
    parts.push(`<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(t + 34).toFixed(1)}) scale(1 -1)">${vineLeaf(short)}</g>`);
  }

  return `<svg class="motif motif--jasmine" viewBox="0 0 ${W} 104" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path ${S} d="${stem}" ${draw ? 'data-draw' : ''}/>
    ${parts.join('\n    ')}
  </svg>`;
}

/** A scalloped ring — the petal edge every marigold head is built from. */
function scallop(r, n) {
  const pt = (k) => {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  };
  const bulge = (r * Math.sin(Math.PI / n) * 1.35).toFixed(2);
  let d = `M${pt(0)}`;
  for (let k = 1; k <= n; k += 1) d += ` A${bulge} ${bulge} 0 0 1 ${pt(k)}`;
  return `${d} Z`;
}

/** One genda phool head — three offset rings of petals around a seed centre. */
function marigoldHead(r) {
  return `<g>
    <path ${S} d="${scallop(r, 12)}"/>
    <path ${SA} d="${scallop(r * 0.72, 10)}" transform="rotate(18)" opacity=".9"/>
    <path ${SA} d="${scallop(r * 0.42, 8)}" transform="rotate(-12)" opacity=".75"/>
    <circle ${SA} cx="0" cy="0" r="${(r * 0.13).toFixed(2)}"/>
  </g>`;
}

/**
 * Marigold (genda phool) garland — strung the way it actually hangs: heads
 * threaded shoulder to shoulder in swags, not beads spaced out on a wire, with
 * a leaf pair knotted in at each hanging point.
 *
 * Sized by `slice` like the jasmine vine — the host's height sets the size of a
 * flower head and the width just decides how many you see.
 */
export function marigoldString({ draw = true, units = 4 } = {}) {
  const P = 150;          // one swag
  const A = 26;           // how far it sags
  const TOP = 22;         // where the string is pinned
  const W = P * units;

  const yAt = (x) => TOP + A * (1 - Math.cos((2 * Math.PI * x) / P)) / 2;

  const samples = [];
  for (let x = 0; x <= W; x += 3) samples.push([x, yAt(x)]);
  const swag = throughPoints(samples);

  // Heads sit a fraction under the string, so the thread reads as thread.
  const heads = walk(samples, 15.5, 8).map((pt, i) => {
    const r = [10.4, 9.2, 10, 9.6, 8.9][i % 5];
    return `<g transform="translate(${pt.x.toFixed(2)} ${(pt.y + r * 0.72).toFixed(2)})">${marigoldHead(r)}</g>`;
  }).join('\n    ');

  const knots = [];
  for (let k = 0; k <= units; k += 1) {
    const x = k * P;
    if (x > W) break;
    const y = yAt(x);
    // The pin point: a short hanger above the string, clear of the heads.
    knots.push(`<g transform="translate(${x} ${y.toFixed(2)})">
      <path ${S} d="M0 -3 L0 -9"/>
      <path ${SA} d="M-1.5 -3 C -6 -7, -11 -8, -14 -6 C -10 -2, -5 -1, -1.5 -3 Z"/>
      <path ${SA} d="M1.5 -3 C 6 -7, 11 -8, 14 -6 C 10 -2, 5 -1, 1.5 -3 Z"/>
    </g>`);
  }

  return `<svg class="motif motif--marigold" viewBox="0 0 ${W} 72" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path ${S} d="${swag}" ${draw ? 'data-draw' : ''}/>
    ${heads}
    ${knots.join('\n    ')}
  </svg>`;
}

/** Lotus — broad petals, opened, resting on the water. */
export function lotus({ draw = true } = {}) {
  return `<svg class="motif motif--lotus" viewBox="0 0 120 76" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M60 2 C 75 22, 77 48, 60 66 C 43 48, 45 22, 60 2 Z"/>
      <path d="M60 66 C 43 62, 30 40, 29 10 C 45 26, 57 44, 60 66 Z"/>
      <path d="M60 66 C 77 62, 90 40, 91 10 C 75 26, 63 44, 60 66 Z"/>
      <path d="M60 68 C 40 68, 16 58, 5 33 C 25 32, 49 45, 60 68 Z"/>
      <path d="M60 68 C 80 68, 104 58, 115 33 C 95 32, 71 45, 60 68 Z"/>
    </g>
    <g ${SA} opacity=".65">
      <path d="M60 22 L60 60"/>
      <path d="M14 70 C 38 62, 82 62, 106 70"/>
      <path d="M22 73 C 28 69, 37 69, 43 73" opacity=".8"/>
      <path d="M77 73 C 83 69, 92 69, 98 73" opacity=".8"/>
    </g>
  </svg>`;
}

/** Mehendi hand — separated fingers, paisley palm, wrist bands. */
export function mehendiHand({ draw = true } = {}) {
  // One continuous outline: wrist → thumb lobe → four fingers → wrist.
  // Keeping the thumb inside this path is what stops it reading as a
  // detached leaf floating beside the palm.
  const outline = [
    'M46 166', 'L44 130',
    'C32 132 22 126 15 116', 'C10 110 8 104 13 102', 'C24 104 34 106 41 110',
    'L41 88', 'L40 50', 'A5.5 5.5 0 0 1 51 50', 'L51 84',
    'C52 80 53 78 55 76', 'L55 42', 'A5.5 5.5 0 0 1 66 42', 'L66 78',
    'C67 76 68 75 70 74', 'L70 48', 'A5.5 5.5 0 0 1 81 48', 'L81 80',
    'C82 78 84 78 86 78', 'L86 64', 'A5 5 0 0 1 96 64', 'L96 108',
    'C96 132 92 152 88 166', 'Z',
  ].join(' ');
  return `<svg class="motif motif--hand" viewBox="0 0 120 176" aria-hidden="true" focusable="false">
    <path ${S} d="${outline}" ${draw ? 'data-draw' : ''}/>
    <g ${SA} opacity=".9">
      <!-- fingertips dipped, the way henna is actually worn -->
      <path d="M40 57 C 43.5 51, 47.5 51, 51 57"/>
      <path d="M40.5 62 L51 62" opacity=".7"/>
      <path d="M55 49 C 58.5 43, 62.5 43, 66 49"/>
      <path d="M55 54 L66 54" opacity=".7"/>
      <path d="M70 55 C 73.5 49, 77.5 49, 81 55"/>
      <path d="M70 60 L81 60" opacity=".7"/>
      <path d="M86 71 C 89 65.5, 93 65.5, 96 71"/>
      <path d="M86 75.5 L96 75.5" opacity=".7"/>
      <path d="M15 107 C 20 101, 28 102, 34 107" opacity=".85"/>
      <!-- vines running down the fingers -->
      <path d="M45.5 70 C 43 78, 48 86, 45.5 96" opacity=".7"/>
      <path d="M60.5 62 C 58 70, 63 78, 60.5 90" opacity=".7"/>
      <path d="M75.5 68 C 73 76, 78 84, 75.5 96" opacity=".7"/>
      <circle cx="45.5" cy="80" r="1.3"/><circle cx="60.5" cy="73" r="1.3"/><circle cx="75.5" cy="79" r="1.3"/>
      <!-- the palm mandala -->
      <g transform="translate(66 122)">
        <path d="${scallop(17, 12)}"/>
        <path d="${scallop(10, 8)}" opacity=".85"/>
        <path d="${scallop(4.5, 6)}" opacity=".7"/>
        <circle cx="0" cy="0" r="1.6"/>
      </g>
      <!-- wrist bands -->
      <path d="M47 148 C 58 153, 78 153, 89 148"/>
      <path d="M49 157 C 59 162, 77 162, 87 157"/>
      <path d="M54 152.5 l2.5 -2.5 l2.5 2.5 l-2.5 2.5 Z M66 154 l2.5 -2.5 l2.5 2.5 l-2.5 2.5 Z M78 152.5 l2.5 -2.5 l2.5 2.5 l-2.5 2.5 Z" opacity=".8"/>
    </g>
  </svg>`;
}

/**
 * Peacock in profile, tail fanned behind — the Mughal arrangement.
 *
 * The bird stands to the left and the fan opens up and to the right, so no
 * plume ever crosses the head. A symmetrical front-facing fan looks right in
 * colour but not in single-weight line, where the body simply dissolves into
 * the feathers behind it.
 */
export function peacock({ draw = true } = {}) {
  const OX = 78, OY = 170;
  const N = 9;
  const feathers = Array.from({ length: N }, (_, k) => {
    const deg = -10 + (k * 95) / (N - 1);
    const len = 104 - Math.abs(deg - 37.5) * 0.16;
    const q = (f) => (-len * f).toFixed(1);
    return `<g transform="translate(${OX} ${OY}) rotate(${deg.toFixed(1)})">
      <path ${S} d="M0 0 C -8 ${q(0.42)}, -7.4 ${q(0.78)}, 0 ${q(1)} C 7.4 ${q(0.78)}, 8 ${q(0.42)}, 0 0 Z"/>
      <path ${S} d="M0 ${q(0.18)} L0 ${q(0.6)}" opacity=".4"/>
      <path ${SA} d="M0 ${q(0.72)} a6 7.5 0 0 1 0 15 a6 7.5 0 0 1 0 -15"/>
      <path ${SA} d="M0 ${q(0.755)} a2.6 3.4 0 0 1 0 6.8 a2.6 3.4 0 0 1 0 -6.8" opacity=".75"/>
    </g>`;
  }).join('');
  return `<svg class="motif motif--peacock" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <g ${draw ? 'data-draw' : ''}>${feathers}</g>
    <g ${S}>
      <path d="M92 152 C 92 161, 83 168, 72 168 C 61 168, 52 161, 52 152 C 52 143, 61 136, 72 136 C 83 136, 92 143, 92 152 Z"/>
      <path d="M57 142 C 48 131, 41 120, 39 109"/>
      <path d="M69 136 C 59 127, 51 118, 48 109"/>
      <path d="M43 94 a8 8 0 0 1 0 16 a8 8 0 0 1 0 -16"/>
      <path d="M35 101 L25 104 L35 107"/>
      <path d="M68 168 L68 183 M78 168 L78 183"/>
      <path d="M62 183 L74 183 M72 183 L84 183"/>
    </g>
    <g ${SA}>
      <circle cx="41" cy="100" r="1.5"/>
      <path d="M39 94 L34 82 M43 94 L43 80 M47 94 L52 83" opacity=".85"/>
      <circle cx="34" cy="80" r="2.2"/><circle cx="43" cy="78" r="2.2"/><circle cx="52" cy="81" r="2.2"/>
      <path d="M60 149 C 69 143, 82 145, 90 153" opacity=".6"/>
      <path d="M63 159 C 71 155, 81 155, 89 159" opacity=".45"/>
    </g>
  </svg>`;
}

/** Dhol — barrel shell, V-lacing with tension rings, strap and sticks. */
export function dhol({ draw = true } = {}) {
  const L = 32, R = 128;                     // where the two heads sit
  const topY = (x) => 30 - 10 * Math.sin((Math.PI * (x - L)) / (R - L));
  const botY = (x) => 90 + 10 * Math.sin((Math.PI * (x - L)) / (R - L));

  const N = 7;
  let lace = '';
  const rings = [];
  for (let k = 0; k <= N; k += 1) {
    const x = L + ((R - L) * k) / N;
    lace += `${k ? ' L' : 'M'}${x.toFixed(1)} ${topY(x).toFixed(1)}`;
    if (k < N) {
      const mx = L + ((R - L) * (k + 0.5)) / N;
      lace += ` L${mx.toFixed(1)} ${botY(mx).toFixed(1)}`;
      rings.push(`<circle ${SA} cx="${mx.toFixed(1)}" cy="${(botY(mx) - 4).toFixed(1)}" r="2"/>`);
    }
  }

  return `<svg class="motif motif--dhol" viewBox="0 0 160 120" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <ellipse cx="${L}" cy="60" rx="10" ry="30"/>
      <ellipse cx="${R}" cy="60" rx="10" ry="30"/>
      <path d="M${L} 30 C 64 20, 96 20, ${R} 30"/>
      <path d="M${L} 90 C 64 100, 96 100, ${R} 90"/>
    </g>
    <g ${SA} opacity=".75">
      <ellipse cx="${L}" cy="60" rx="6" ry="23" opacity=".7"/>
      <ellipse cx="${R}" cy="60" rx="6" ry="23" opacity=".7"/>
      <path d="${lace}" opacity=".6"/>
      ${rings.join('')}
    </g>
    <g ${S} opacity=".8">
      <path d="M34 36 C 58 8, 102 8, 126 36"/>
      <path d="M20 108 L58 101"/>
      <path d="M22 114 C 40 112, 54 110, 62 104"/>
      <circle ${SA} cx="62" cy="104" r="2.6"/>
    </g>
  </svg>`;
}

/** Chai — two cutting-chai glasses on saucers, steam rising. */
export function chaiCups({ draw = true } = {}) {
  const glass = (x, k) => `<g transform="translate(${x} 56) scale(${k})">
    <path ${S} d="M-11 -14 L-8 6 C-8 10, -4 12, 0 12 C4 12, 8 10, 8 6 L11 -14 Z"/>
    <path ${S} d="M-13 -14 L13 -14"/>
    <path ${S} d="M-17 16 C-17 19.5, -9 21, 0 21 C9 21, 17 19.5, 17 16 C17 12.5, 9 11, 0 11 C-9 11, -17 12.5, -17 16 Z"/>
    <path ${SA} d="M-9 -6 L9 -6" opacity=".5"/>
  </g>`;
  return `<svg class="motif motif--chai" viewBox="0 0 120 90" aria-hidden="true" focusable="false">
    <g ${draw ? 'data-draw' : ''}>${glass(36, 1)}${glass(86, .86)}</g>
    <g ${SA} opacity=".65">
      <path d="M31 34 C 25 27, 35 22, 29 14"/>
      <path d="M41 34 C 35 27, 45 22, 39 14"/>
      <path d="M84 32 C 79 26, 88 22, 83 15"/>
    </g>
  </svg>`;
}

/* ── Place & practical ──────────────────────────────────────────────────── */

/**
 * Karachi waterfront — the harbour at Boat Basin: a timber jetty on braced
 * pilings, a lateen-rigged launch tied up alongside, and the domed pavilion on
 * the far bank. Drawn as one scene with a horizon rather than three symbols
 * floating in a row.
 */
export function waterfront({ draw = true } = {}) {
  // Water: four lines at different phases, so it reads as a surface.
  const wave = (y, amp, len, phase, x0, x1) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 6) {
      pts.push([x, y + amp * Math.sin((x / len) * Math.PI * 2 + phase)]);
    }
    return throughPoints(pts);
  };

  const pilings = [22, 46, 70, 94].map((x) => `
    <path ${S} d="M${x} 104 L${x + 2} 128"/>
    <path ${S} d="M${x + 12} 104 L${x + 10} 128"/>
    <path ${SA} d="M${x} 112 L${x + 12} 118 M${x + 12} 112 L${x} 118" opacity=".55"/>`).join('');

  const rails = [16, 40, 64, 88, 108].map((x) => `<path ${S} d="M${x} 104 L${x} 92"/>`).join('');

  const gull = (x, y, k) => `<path ${SA} d="M${x} ${y} c ${3 * k} ${-3.4 * k}, ${6 * k} ${-3.4 * k}, ${8 * k} 0 c ${2 * k} ${-3.4 * k}, ${5 * k} ${-3.4 * k}, ${8 * k} 0" opacity=".7"/>`;

  return `<svg class="motif motif--waterfront" viewBox="0 0 320 150" aria-hidden="true" focusable="false">
    <g ${draw ? 'data-draw' : ''}>
      <!-- far bank: domed pavilion and its colonnade -->
      <path ${S} d="M232 100 L232 62 A22 26 0 0 1 276 62 L276 100"/>
      <path ${S} d="M244 100 L244 76 A10 13 0 0 1 264 76 L264 100"/>
      <path ${S} d="M254 36 L254 24"/>
      <path ${S} d="M254 24 a4 4 0 0 1 0 -8 a4 4 0 0 1 0 8"/>
      <path ${SA} d="M254 16 L254 11"/>
      <path ${S} d="M226 62 L282 62"/>
      <path ${S} d="M222 100 L286 100 M226 104 L282 104"/>
      <path ${SA} d="M236 100 L236 66 M272 100 L272 66" opacity=".6"/>
      <!-- lower block with a scalloped arch -->
      <path ${S} d="M288 100 L288 74 L314 74 L314 100"/>
      <path ${S} d="M296 100 L296 88 a5 5 0 0 1 10 0 L306 100"/>
      <path ${SA} d="M288 78 L314 78" opacity=".6"/>
      <!-- the jetty -->
      <path ${S} d="M8 104 L120 104"/>
      <path ${S} d="M8 92 L120 92" opacity=".85"/>
      ${rails}
      ${pilings}
      <!-- the launch, dropped so the hull sits in the water rather than above it -->
      <g transform="translate(0 10)">
      <path ${S} d="M126 100 C132 110, 176 110, 182 100 Z"/>
      <path ${S} d="M126 100 L182 100"/>
      <path ${SA} d="M132 104 L176 104" opacity=".6"/>
      <path ${S} d="M154 100 L154 42"/>
      <path ${S} d="M154 46 L188 74 L154 84 Z"/>
      <path ${SA} d="M154 62 L172 62 M154 72 L180 72" opacity=".55"/>
      <path ${S} d="M154 46 L134 86"/>
      <path ${SA} d="M142 100 L142 86 L154 84" opacity=".6"/>
      <path ${SA} d="M154 42 l9 3 -9 4 Z"/>
      </g>
    </g>
    <g ${SA} opacity=".8">
      <path d="${wave(118, 2.2, 62, 0, 4, 316)}"/>
      <path d="${wave(126, 2.6, 78, 1.9, 4, 316)}"/>
      <path d="${wave(134, 2.2, 54, 3.4, 4, 316)}"/>
      <path d="${wave(142, 1.8, 88, 0.7, 4, 316)}"/>
    </g>
    <g ${SA} opacity=".4">
      <path d="M138 124 L152 124 M146 131 L162 131 M234 121 L250 121 M264 128 L278 128"/>
    </g>
    ${gull(38, 34, 1)}${gull(196, 26, 1)}${gull(210, 44, -1)}
  </svg>`;
}

/** A kurta — mandarin collar, buttoned placket, side slits at the hem. */
export function garmentKurta({ draw = true } = {}) {
  return `<svg class="motif motif--garment" viewBox="0 0 120 160" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M36 34 L31 142 C46 147, 74 147, 89 142 L84 34"/>
      <path d="M36 34 L17 43 C13 45, 11 49, 12 54 L18 86 L38 82"/>
      <path d="M84 34 L103 43 C107 45, 109 49, 108 54 L102 86 L82 82"/>
      <path d="M52 34 L52 23 L68 23 L68 34"/>
      <path d="M52 34 C56 40, 64 40, 68 34"/>
    </g>
    <g ${SA} opacity=".75">
      <path d="M56 39 L56 86 M64 39 L64 86"/>
      <circle cx="60" cy="48" r="1.8"/><circle cx="60" cy="60" r="1.8"/><circle cx="60" cy="72" r="1.8"/>
      <path d="M33 132 C47 137, 73 137, 87 132"/>
      <path d="M34 142 L34 124 M86 142 L86 124"/>
      <path d="M20 80 L36 76 M100 80 L84 76"/>
    </g>
  </svg>`;
}

/** A dupatta thrown over a shoulder — two panels of unequal fall, bordered. */
export function garmentDupatta({ draw = true } = {}) {
  const fringe = (pts) => pts.map(([x, y]) => `M${x} ${y} L${(x - 1.5).toFixed(1)} ${y + 11}`).join(' ');
  return `<svg class="motif motif--garment" viewBox="0 0 120 160" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M22 26 C 44 8, 76 8, 98 26"/>
      <path d="M22 26 C 12 58, 16 96, 6 132"/>
      <path d="M50 20 C 42 56, 46 94, 36 130"/>
      <path d="M6 132 C 16 140, 28 139, 36 130"/>
      <path d="M98 26 C 108 52, 100 78, 112 104"/>
      <path d="M70 20 C 78 48, 70 74, 82 98"/>
      <path d="M112 104 C 102 112, 90 110, 82 98"/>
    </g>
    <g ${SA} opacity=".72">
      <path d="M10 114 C 20 122, 32 121, 39 112"/>
      <path d="M108 88 C 98 96, 87 94, 79 82"/>
      <path d="M30 38 C 34 68, 31 100, 26 124" opacity=".5"/>
      <path d="M41 30 C 44 62, 41 94, 33 126" opacity=".5"/>
      <path d="M79 30 C 83 58, 76 82, 86 108" opacity=".5"/>
      <path d="M89 26 C 94 54, 87 78, 98 100" opacity=".5"/>
      <path d="M17 122 L20 118 L23 122 L20 126 Z M28 121 L31 117 L34 121 L31 125 Z"/>
      <path d="M88 94 L91 90 L94 94 L91 98 Z M99 96 L102 92 L105 96 L102 100 Z"/>
      <path d="${fringe([[7,133],[13,138],[20,140],[27,139],[33,135],[37,130]])}" opacity=".85"/>
      <path d="${fringe([[111,105],[105,111],[98,113],[91,111],[86,106],[82,99]])}" opacity=".85"/>
    </g>
  </svg>`;
}

/** A masjid lamp — suspension ring, three chains, flared mouth, pierced belly. */
export function archLamp({ draw = true } = {}) {
  const chain = (x2, y2) => {
    const links = [0.3, 0.55, 0.8].map((t) =>
      `<circle ${SA} cx="${(40 + (x2 - 40) * t).toFixed(1)}" cy="${(13 + (y2 - 13) * t).toFixed(1)}" r="1.7" opacity=".8"/>`).join('');
    return `<path ${S} d="M40 13 L${x2} ${y2}" opacity=".8"/>${links}`;
  };
  return `<svg class="motif motif--lamp" viewBox="0 0 80 130" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M40 4 a4.5 4.5 0 0 1 0 9 a4.5 4.5 0 0 1 0 -9"/>
      <path d="M17 34 L63 34"/>
      <path d="M21 34 C 23 42, 26 46, 30 50"/>
      <path d="M59 34 C 57 42, 54 46, 50 50"/>
      <path d="M30 50 C 15 60, 14 88, 30 99 C 36 103, 44 103, 50 99 C 66 88, 65 60, 50 50"/>
      <path d="M40 103 L40 110"/>
      <path d="M40 110 C 35 114, 35 121, 40 126 C 45 121, 45 114, 40 110 Z"/>
    </g>
    ${chain(20, 34)}${chain(60, 34)}${chain(40, 34)}
    <g ${SA} opacity=".7">
      <path d="M19 40 L61 40" opacity=".6"/>
      <path d="M26 76 a7 7 0 0 1 14 0 L40 90 L26 90 Z" opacity=".8"/>
      <path d="M42 76 a7 7 0 0 1 14 0 L56 90 L42 90 Z" opacity=".8"/>
      <path d="M28 64 L54 64" opacity=".55"/>
    </g>
  </svg>`;
}

export const motifs = {
  archFrame, jaaliPattern, ornamentRule, cornerBracket,
  jasmineGarland, marigoldString, lotus, mehendiHand, peacock, dhol, chaiCups,
  waterfront, garmentKurta, garmentDupatta, archLamp,
};

/* ═══════════════════════════════════════════════════════════════════════
   Per-site tiles
   The pattern plumbing is identical across sites; only the tile geometry
   changes. That is the whole re-skinning mechanism.
   ═══════════════════════════════════════════════════════════════════════ */

function tile({ id, size, opacity, body }) {
  return `<svg class="motif motif--tile" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
        <g ${S} opacity="${opacity}">${body}</g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#${id})"/>
  </svg>`;
}

/**
 * Ajrak block print. Real ajrak is a resist-printed grid of stepped crosses
 * and quartered rosettes — which is to say it is already a tiling system, so
 * it belongs in code rather than in a photograph of cloth.
 */
export function ajrakTile({ id = 'ajrak', size = 64, opacity = 0.55 } = {}) {
  // The eight-pointed star (sitara) — two overlapped squares, one axis-aligned
  // and one turned 45°. This is the motif an ajrak field is actually built on.
  const sitara = (cx, cy, s) => {
    const d = s * 1.414;
    return `<path d="M${cx - s} ${cy - s} H${cx + s} V${cy + s} H${cx - s} Z"/>
      <path d="M${cx} ${cy - d} L${cx + d} ${cy} L${cx} ${cy + d} L${cx - d} ${cy} Z"/>`;
  };
  // The stepped cross (kakar) that links the stars along the grid.
  const kakar = (cx, cy, k) => {
    const t = k / 3;
    return `<path d="M${cx - k} ${cy - t} L${cx - t} ${cy - t} L${cx - t} ${cy - k}
      L${cx + t} ${cy - k} L${cx + t} ${cy - t} L${cx + k} ${cy - t}
      L${cx + k} ${cy + t} L${cx + t} ${cy + t} L${cx + t} ${cy + k}
      L${cx - t} ${cy + k} L${cx - t} ${cy + t} L${cx - k} ${cy + t} Z"/>`;
  };
  const R = 'fill="var(--motif-resist,var(--motif-stroke,currentColor))" stroke="none"';

  // Half-drop: stars on the corners and the centre, crosses on the edge
  // midpoints. That diagonal reading is what makes a field look block-printed
  // rather than like graph paper.
  return tile({ id, size, opacity, body: `
    <g>
      ${sitara(0, 0, 7)}${sitara(64, 0, 7)}${sitara(0, 64, 7)}${sitara(64, 64, 7)}
      ${sitara(32, 32, 9)}
      ${kakar(32, 0, 7)}${kakar(0, 32, 7)}${kakar(64, 32, 7)}${kakar(32, 64, 7)}
    </g>
    <g opacity=".72">
      <circle cx="32" cy="32" r="2.6"/>
      <path d="M16 16 L18 18 M48 16 L46 18 M16 48 L18 46 M48 48 L46 46"/>
    </g>
    <g ${R} opacity=".85">
      <circle cx="16" cy="16" r="1.5"/><circle cx="48" cy="16" r="1.5"/>
      <circle cx="16" cy="48" r="1.5"/><circle cx="48" cy="48" r="1.5"/>
      <circle cx="32" cy="32" r="1.1"/>
    </g>
  ` });
}

/**
 * Ajrak pallav — the wide ornamental border band that runs along the edge of
 * every real ajrak, carrying a denser motif than the field. Sized like the
 * garlands: host height sets the band depth, width decides how many units you
 * see, so it survives any viewport.
 */
export function ajrakBorder({ draw = true, units = 40 } = {}) {
  const U = 48;
  const W = U * units;
  const H = 34;
  const R = 'fill="var(--motif-resist,var(--motif-stroke,currentColor))" stroke="none"';
  // A badam (almond) bud — one closed teardrop, mirrored about its own axis.
  const badam = (cx, cy) => `<path ${SA} d="M${cx} ${cy - 6}
    C${cx - 4} ${cy - 2}, ${cx - 4} ${cy + 4}, ${cx} ${cy + 7}
    C${cx + 4} ${cy + 4}, ${cx + 4} ${cy - 2}, ${cx} ${cy - 6} Z"/>`;
  let body = '';
  for (let i = 0; i < units; i += 1) {
    const x = i * U;
    body += `<path ${S} d="M${x} 20 L${x + 12} 10 L${x + 24} 20 L${x + 36} 10 L${x + 48} 20"/>`;
    body += badam(x + 12, 25) + badam(x + 36, 25);
    body += `<g ${R} opacity=".85"><circle cx="${x + 24}" cy="25" r="1.5"/></g>`;
  }
  // Deliberately far wider than any viewport: with xMinYMid slice the taller
  // ratio wins, so the band fills its host's HEIGHT exactly and crops off the
  // right instead of shaving the rule lines off the top and bottom.
  return `<svg class="motif motif--ajrak-border" viewBox="0 0 ${W} ${H}"
    preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
    <path ${S} d="M0 3 L${W} 3" opacity=".9"/>
    <path ${SA} d="M0 6 L${W} 6" opacity=".55"/>
    <g ${draw ? 'data-draw' : ''}>${body}</g>
    <path ${SA} d="M0 32.5 L${W} 32.5" opacity=".55"/>
  </svg>`;
}

/** Mehendi vine tile — paisley buds on a trellis, the henna vocabulary. */
export function mehendiTile({ id = 'mehendi', size = 52, opacity = 0.5 } = {}) {
  // A single diagonal vine, not a lattice — two crossing curves read as
  // chain-link rather than henna. Endpoints sit on tile corners so it repeats.
  return tile({ id, size, opacity, body: `
    <path d="M0 52 Q 18 34, 26 26 T 52 0"/>
    <path d="M26 26 C 20 20, 22 12, 28 10 C 34 12, 34 20, 26 26 Z"/>
    <circle cx="27.5" cy="17" r="1.3"/>
    <path d="M12 40 C 8 36, 8 31, 12 29 C 15 32, 15 38, 12 40 Z"/>
    <path d="M40 12 C 44 16, 44 21, 40 23 C 37 20, 37 14, 40 12 Z"/>
    <circle cx="43" cy="43" r="1.5"/><circle cx="9" cy="9" r="1.5"/>
  ` });
}

/** A whisper of a tile for the quietest skin — a single fine diamond grid. */
export function fineGridTile({ id = 'fine', size = 34, opacity = 0.42 } = {}) {
  return tile({ id, size, opacity, body: `
    <path d="M17 5 L29 17 L17 29 L5 17 Z"/>
    <circle cx="17" cy="17" r="1.2"/>
  ` });
}

/* ── Additional vignettes ───────────────────────────────────────────────── */

/** A row of lit diyas — clay bowl, flared rim, wick and flame. */
export function candleRow({ draw = true } = {}) {
  const diya = (x, k) => `<g transform="translate(${x} 84) scale(${k})">
    <path ${S} d="M-19 0 C-19 11, -11 18, 0 18 C11 18, 19 11, 19 0 Z"/>
    <path ${S} d="M-23 0 C-23 -5, -12 -8.5, 0 -8.5 C12 -8.5, 23 -5, 23 0"/>
    <path ${S} d="M-7 18 L-9 23 L9 23 L7 18"/>
    <path ${SA} d="M-13 -4 C-7 -1.5, 7 -1.5, 13 -4" opacity=".55"/>
    <path ${SA} d="M0 -8 L0 -14"/>
    <path ${SA} d="M0 -14 C-6 -22, -4.5 -32, 0 -40 C4.5 -32, 6 -22, 0 -14 Z"/>
    <path ${SA} d="M0 -18 C-2.6 -23, -1.6 -28, 0 -32 C1.6 -28, 2.6 -23, 0 -18 Z" opacity=".55"/>
  </g>`;
  return `<svg class="motif motif--candles" viewBox="0 0 160 110" aria-hidden="true" focusable="false">
    <g ${draw ? 'data-draw' : ''}>${diya(30, .88)}${diya(80, 1)}${diya(130, .88)}</g>
    <path ${SA} d="M6 104 L154 104" opacity=".4"/>
  </svg>`;
}

/** Old-city rooftops — parapets, a jharokha, water tanks, bunting and kites. */
export function rooftopSkyline({ draw = true } = {}) {
  const merlons = (x0, x1, y, step) => {
    let d = '';
    for (let x = x0; x <= x1; x += step) d += `M${x} ${y} L${x} ${y - 7} `;
    return d.trim();
  };
  return `<svg class="motif motif--rooftops" viewBox="0 0 320 150" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M8 134 L8 92 L64 92 L64 134"/>
      <path d="M64 134 L64 68 L128 68 L128 134"/>
      <path d="M128 134 L128 98 L196 98 L196 134"/>
      <path d="M196 134 L196 56 L262 56 L262 134"/>
      <path d="M262 134 L262 84 L312 84 L312 134"/>
      <path d="M0 134 L320 134"/>
      <path d="M86 68 L86 44 C86 33, 94 27, 103 27 C112 27, 120 33, 120 44 L120 68"/>
      <path d="M82 44 L124 44"/>
      <path d="M212 56 L212 38 L246 38 L246 56"/>
      <path d="M208 38 L250 38"/>
      <path d="M280 84 L280 66 L296 66 L296 84"/>
      <path d="M283 66 L283 58 M293 66 L293 58 M281 58 L295 58"/>
    </g>
    <g ${SA} opacity=".7">
      <path d="${merlons(12, 60, 92, 8)}"/>
      <path d="${merlons(200, 236, 98, 9)}"/>
      <path d="${merlons(266, 308, 84, 10)}"/>
      <path d="M94 52 a9 9 0 0 1 18 0 L112 68 L94 68 Z" opacity=".8"/>
      <path d="M220 46 L238 46 M220 52 L238 52" opacity=".7"/>
      <path d="M143 88 A9 9 0 0 1 157 84" opacity=".85"/>
      <path d="M150 98 L150 87 M146 98 L154 98" opacity=".85"/>
      <path d="M150 88 L155 84" opacity=".7"/>
      <circle cx="155.5" cy="83.5" r="1.4"/>
      <path d="M14 88 C 30 93, 46 93, 60 88" opacity=".7"/>
      <path d="M24 90.5 L24 98 L31 98 L31 89.5 M38 91.5 L38 99 L45 99 L45 91.5" opacity=".7"/>
      <path d="M64 68 C 96 84, 128 84, 128 68" opacity=".6"/>
      <path d="M72 74 L72 80 M84 78 L84 84 M96 80 L96 86 M108 80 L108 86 M120 76 L120 82" opacity=".6"/>
      <path d="M166 20 L178 8 L190 20 L178 32 Z"/>
      <path d="M178 32 C 174 46, 166 54, 154 60"/>
      <path d="M178 32 l-4 5 l5 3 l-4 5" opacity=".8"/>
      <path d="M246 16 L254 8 L262 16 L254 24 Z" opacity=".8"/>
      <path d="M254 24 C 252 34, 250 42, 246 50" opacity=".7"/>
    </g>
  </svg>`;
}

/** The nikkah nama — a bound register with a crest, signatures and a seal. */
export function nikkahDocument({ draw = true } = {}) {
  return `<svg class="motif motif--document" viewBox="0 0 150 170" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="M28 12 L116 12 C124 12, 130 18, 130 26 L130 152 L28 152 Z"/>
      <path d="M28 12 C19 12, 14 19, 14 26 L14 138 C14 145, 19 152, 28 152"/>
      <path d="M28 12 L28 152"/>
    </g>
    <g ${SA} opacity=".82">
      <path d="M20 30 L20 36 M20 48 L20 54 M20 66 L20 72 M20 84 L20 90 M20 102 L20 108 M20 120 L20 126"/>
      <path d="M62 42 C62 32, 70 26, 79 26 C88 26, 96 32, 96 42"/>
      <path d="M74 34 a5 5 0 0 1 10 0 L84 42 L74 42 Z" opacity=".8"/>
      <path d="M52 48 L106 48"/>
      <path d="M44 62 L114 62 M44 72 L114 72 M44 82 L96 82"/>
      <path d="M86 108 L120 108 M86 132 L120 132"/>
      <path d="M90 104 C 96 96, 102 106, 108 98 C 112 93, 116 98, 118 104" opacity=".8"/>
      <path d="M90 128 C 97 120, 101 130, 108 122 C 112 118, 115 122, 118 128" opacity=".8"/>
    </g>
    <g ${SA}>
      <path d="${scallop(13, 14)}" transform="translate(56 116)"/>
      <path d="${scallop(7, 8)}" transform="translate(56 116)" opacity=".8"/>
      <circle cx="56" cy="116" r="2"/>
      <path d="M50 127 L45 148 L56 140 L64 150 L63 127" opacity=".85"/>
    </g>
  </svg>`;
}

/** Chakri — a rangoli medallion, rings of petals worked out from the centre. */
export function chakri({ draw = true } = {}) {
  const petals = Array.from({ length: 12 }, (_, k) =>
    `<path ${SA} transform="rotate(${k * 30} 50 50)" d="M50 26 C 55 32, 55 40, 50 45 C 45 40, 45 32, 50 26 Z" opacity=".85"/>`).join('');
  const dots = Array.from({ length: 12 }, (_, k) => {
    const a = ((k * 30 + 15) * Math.PI) / 180;
    return `<circle ${SA} cx="${(50 + Math.cos(a) * 34).toFixed(1)}" cy="${(50 + Math.sin(a) * 34).toFixed(1)}" r="1.5" opacity=".75"/>`;
  }).join('');
  return `<svg class="motif motif--chakri" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g ${S} ${draw ? 'data-draw' : ''}>
      <path d="${scallop(44, 18)}" transform="translate(50 50)"/>
      <path d="${scallop(21, 12)}" transform="translate(50 50)"/>
    </g>
    ${petals}${dots}
    <g ${SA}>
      <path d="${scallop(9, 6)}" transform="translate(50 50)"/>
      <circle cx="50" cy="50" r="2.4"/>
    </g>
  </svg>`;
}

/** Hanging lanterns — capped, panelled, with a skirt and tassel. */
export function lanternString({ draw = true } = {}) {
  const lamp = (x, drop) => `<g transform="translate(${x} ${drop})">
    <path ${S} d="M0 0 L0 8"/>
    <path ${S} d="M-8 8 L8 8 L6 12 L-6 12 Z"/>
    <path ${S} d="M-6 12 C-13 20, -13 38, -6 46 L6 46 C13 38, 13 20, 6 12 Z"/>
    <path ${S} d="M-7 46 L7 46 L5 51 L-5 51 Z"/>
    <path ${SA} d="M-11 22 L11 22 M-11 36 L11 36" opacity=".55"/>
    <path ${SA} d="M-3.5 24 a3.5 4.5 0 0 1 7 0 L3.5 34 L-3.5 34 Z" opacity=".8"/>
    <path ${SA} d="M-3 51 L-3 60 M0 51 L0 64 M3 51 L3 60" opacity=".8"/>
  </g>`;
  return `<svg class="motif motif--lanterns" viewBox="0 0 130 78" aria-hidden="true" focusable="false">
    <path ${S} d="M0 6 C 32 22, 98 22, 130 6" ${draw ? 'data-draw' : ''}/>
    ${lamp(26, 14)}${lamp(65, 21)}${lamp(104, 14)}
  </svg>`;
}

Object.assign(motifs, {
  ajrakTile, ajrakBorder, mehendiTile, fineGridTile,
  candleRow, rooftopSkyline, nikkahDocument, chakri, lanternString,
});
