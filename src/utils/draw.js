import * as kit from '../motifs/index.js';

/**
 * Illustration layer — no framework dependency.
 *
 * Deliberately gsap-free: two of these sites never loaded gsap, and a draw-on
 * reveal is just a stroke-dashoffset transition plus an IntersectionObserver.
 */

/* ── Injection ──────────────────────────────────────────────────────────── */

/**
 * Motifs are declared in markup: <div data-motif="lotus"></div>
 * Keeps the HTML readable and the motif kit the single source of truth.
 */
export function initMotifs(root = document) {
  root.querySelectorAll('[data-motif]').forEach((host) => {
    // Video drop-in: set data-gate-video="./assets/gate.mp4" on the same host
    // and the motif is replaced by a looping muted video — no other change.
    // data-gate-poster paints until the first frame decodes; if the file is
    // missing or the browser refuses to autoplay, the motif stays as the floor.
    const src = host.dataset.gateVideo;
    if (src) {
      const poster = host.dataset.gatePoster ? ` poster="${host.dataset.gatePoster}"` : '';
      host.innerHTML = `<video class="motif-video" autoplay muted loop playsinline preload="auto"${poster}><source src="${src}"></video>`;
      const video = host.firstElementChild;
      video.addEventListener('error', () => renderMotif(host), { once: true });
      video.play?.().catch(() => renderMotif(host));
      return;
    }
    renderMotif(host);
  });
}

function renderMotif(host) {
  const make = kit[host.dataset.motif];
  if (typeof make !== 'function') return;
  const opts = {};
  if (host.dataset.motifId) opts.id = host.dataset.motifId;
  if (host.dataset.motifSize) opts.size = Number(host.dataset.motifSize);
  if (host.dataset.motifOpacity) opts.opacity = Number(host.dataset.motifOpacity);
  if (host.dataset.motifUnits) opts.units = Number(host.dataset.motifUnits);
  host.innerHTML = make(opts);
}

/* ── Draw-on reveal ─────────────────────────────────────────────────────── */

const HOST_SELECTOR = 'section, figure, .opener, .intro, .story__card, .story-card, [data-draw-host]';

/**
 * Every [data-draw] path is measured, dashed out, and drawn back in when its
 * section scrolls into view — the one thing photography could never do.
 *
 * Under prefers-reduced-motion the finished state is painted immediately, so
 * an illustration is never left half-drawn.
 */
export function initDraw(reduced, root = document) {
  const paths = [...root.querySelectorAll('[data-draw]')]
    .flatMap((node) => (node.tagName.toLowerCase() === 'g' ? [...node.children] : [node]))
    .filter((node) => typeof node.getTotalLength === 'function');

  if (!paths.length) return;

  if (reduced) {
    paths.forEach(paint);
    return;
  }

  const groups = new Map();

  paths.forEach((path) => {
    let length = 0;
    try {
      length = path.getTotalLength();
    } catch {
      return;
    }
    if (!length) {
      paint(path);
      return;
    }

    const owner = path.closest('[data-draw]') ?? path;
    const delay = Number(owner.dataset.drawDelay ?? path.dataset.drawDelay ?? 0);
    const duration = 1.4 + Math.min(length / 900, 1.4);

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.transition = `stroke-dashoffset ${duration.toFixed(2)}s cubic-bezier(.4,0,.2,1) ${delay}s`;

    const host = path.closest(HOST_SELECTOR) ?? path.ownerSVGElement ?? path;
    if (!groups.has(host)) groups.set(host, []);
    groups.get(host).push(path);
  });

  if (!groups.size) return;

  if (!('IntersectionObserver' in window)) {
    groups.forEach((list) => list.forEach(paint));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      (groups.get(entry.target) ?? []).forEach((path) => {
        path.style.strokeDashoffset = '0';
      });
    });
  }, { rootMargin: '0px 0px -18% 0px', threshold: 0.01 });

  groups.forEach((_list, host) => observer.observe(host));
}

function paint(path) {
  path.style.strokeDasharray = 'none';
  path.style.strokeDashoffset = '0';
  path.style.transition = 'none';
}
