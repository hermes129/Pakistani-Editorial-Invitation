import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INK = '#0b0b0a';
const PAPER = '#f3ecdd';
const BLOOD = '#971c35';
const GOLD = '#c6a15a';
const root = document.documentElement;

/* The evening, in order. Each act names the ground it arrives on, so the
   page reads as one continuous Karachi evening rather than a stack of
   differently coloured panels.

   The ground is deliberately NOT a single linear ramp across the whole
   page. A linear ramp spends real scroll distance in the mid-tones, and
   in the mid-tones neither ink nor paper text clears 4.5:1 against the
   ground. Instead each act holds a settled ground while its text is read,
   and the change happens during the act's leading padding, where there is
   nothing to read. Same continuity, contrast never dips. */
const ACTS = [
  { sel: '.hero',        ground: [243, 236, 221] }, // 4:00, afternoon
  { sel: '.announcement', ground: [239, 228, 208] }, // the peak stays lit
  { sel: '.story',       ground: [226, 207, 174] }, // the sun getting low
  { sel: '.venue',       ground: [59, 44, 34] },    // dusk, arrival
  { sel: '.programme',   ground: [42, 32, 26] },    // lamps on
  { sel: '.dress',       ground: [28, 22, 19] },
  { sel: '.highlights',  ground: [23, 18, 16] },
  { sel: '.countdown',   ground: [14, 13, 12] },    // night
  { sel: '.rsvp',        ground: [11, 11, 10] }
];

/* WCAG relative luminance, used to decide whether ink or paper text sits
   on the current ground. Measured rather than eyeballed per act. */
function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function mix(from, to, t) {
  return [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * t);
}

function applyGround(rgb) {
  const [r, g, b] = rgb.map((v) => Math.round(v));
  const lit = luminance(rgb) > 0.28;
  root.style.setProperty('--ground', `rgb(${r} ${g} ${b})`);
  root.style.setProperty('--ground-ink', lit ? INK : PAPER);
  // Oxblood reads at 2.3:1 on the night ground. Same accent, lit for the hour.
  root.style.setProperty('--accent', lit ? BLOOD : GOLD);
}

/* The fold. Each act hinges down from its top edge as it arrives, the way
   a folded card falls open, and the crease along the hinge catches light
   as the leaf flattens. Small angle on purpose: at this register it should
   read as paper settling, not as a 3D flip. */
function initFold() {
  const leaves = gsap.utils.toArray('.js-reveal');
  leaves.forEach((leaf) => {
    leaf.classList.add('fold-leaf');
    if (leaf.parentElement) leaf.parentElement.classList.add('fold');

    /* Deliberately no opacity in this tween.

       An earlier version faded each leaf up from 0.001. That makes the fold
       load-bearing for legibility: anything that stops the trigger updating
       leaves all 17 leaves at 0.001 and the invitation renders blank. A
       wedding invitation has to fail readable. Folding from a transform
       alone degrades to "no animation" instead of "no page", and at this
       register the settle reads better than a fade anyway. */
    gsap.fromTo(
      leaf,
      { rotateX: -12, y: 34, '--crease': 1 },
      {
        rotateX: 0,
        y: 0,
        '--crease': 0,
        ease: 'none',
        scrollTrigger: {
          trigger: leaf,
          start: 'top 92%',
          end: 'top 62%',
          scrub: 0.6
        }
      }
    );
  });
}

let acts = [];

/* Solved as a pure function of scroll position rather than with one scrubbed
   trigger per act. A per-act trigger only reports while the playhead is
   inside its own band, so at any position outside every band the ground keeps
   whatever the last firing trigger happened to leave, which after a bad first
   measurement is the wrong end of the evening. This is deterministic: give it
   a scroll offset and it returns the ground for that offset, every time. */
function groundAt(scrollY, vh) {
  let current = acts[0].ground;
  for (let i = 1; i < acts.length; i += 1) {
    // The change runs while the act's top travels from the viewport bottom
    // up to 72% of viewport height, which is above its first line of text.
    const startY = acts[i].top - vh;
    const endY = acts[i].top - vh * 0.72;
    if (scrollY >= endY) {
      current = acts[i].ground;
    } else if (scrollY > startY) {
      current = mix(acts[i - 1].ground, acts[i].ground, (scrollY - startY) / (endY - startY));
      break;
    } else {
      break;
    }
  }
  return current;
}

function measureActs() {
  const offset = window.scrollY || window.pageYOffset || 0;
  acts.forEach((act) => {
    act.top = act.el.getBoundingClientRect().top + offset;
  });
}

let lastKey = '';

function updateGround() {
  if (!acts.length) return;
  const rgb = groundAt(window.scrollY || window.pageYOffset || 0, window.innerHeight);
  const key = rgb.map((v) => Math.round(v)).join(',');
  // The ticker runs every frame; the ground changes on maybe a tenth of them.
  if (key === lastKey) return;
  lastKey = key;
  applyGround(rgb);
}

function initGround() {
  acts = ACTS.map((act) => ({ ...act, el: document.querySelector(act.sel), top: 0 })).filter((a) => a.el);
  if (!acts.length) return;
  measureActs();
  updateGround();

  /* One trigger spanning the document, reporting scroll position. groundAt()
     does the rest: because it is a pure function of the offset it needs no
     scrub and no per-act bookkeeping, and it returns the right ground at any
     position rather than only inside an active band. */
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: updateGround,
    onRefresh: () => {
      measureActs();
      lastKey = '';
      updateGround();
    }
  });
}

let started = false;

/* Called once, and only after the intro overlay is gone.

   Everything here measures document positions, and while the intro is up the
   body carries overflow:hidden, so the document is not scrollable and every
   trigger's start and end resolve to roughly zero. Build them then and the
   leaves hinge at the wrong scroll offsets for the life of the page. So the
   triggers are not created until there is a real scrollable document to
   measure against. */
export function initEvening(reducedMotion) {
  if (reducedMotion || started) return false;
  started = true;
  root.classList.add('sc-fold-active');
  initGround();
  initFold();
  ScrollTrigger.refresh();
  return true;
}

