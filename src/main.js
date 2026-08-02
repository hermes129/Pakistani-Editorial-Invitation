import './styles.css';

const EVENT = {
  title: 'Noor & Zayn — Wedding',
  start: '20261017T110000Z',
  end: '20261017T170000Z',
  localDate: new Date('2026-10-17T16:00:00+05:00'),
  location: 'Beach Luxury Hotel, M. T. Khan Road, Karachi, Pakistan',
  description: 'Nikkah, dinner and dancing with Noor and Zayn.'
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const main = document.querySelector('main');
const intro = document.querySelector('.intro');
const introButton = document.querySelector('.intro__open');
const skipLink = document.querySelector('.skip-link');
const music = document.querySelector('#site-music');
const musicToggle = document.querySelector('#music-toggle');
const musicLabel = musicToggle.querySelector('.music-toggle__label');

main.inert = true;
music.volume = 0.32;

function syncMusicControl() {
  const isPlaying = !music.paused;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
  musicLabel.textContent = isPlaying ? 'Music on' : 'Play music';
}

async function setMusicPlaying(shouldPlay) {
  if (!shouldPlay) {
    music.pause();
    syncMusicControl();
    return;
  }

  try {
    await music.play();
  } catch {
    showToast('Use the music button whenever you would like sound.');
  }
  syncMusicControl();
}

function openInvitation(startMusic = true) {
  if (intro.classList.contains('is-opening')) return;
  intro.classList.add('is-opening');
  document.body.classList.remove('intro-active');
  main.inert = false;
  musicToggle.hidden = false;
  if (startMusic) setMusicPlaying(true);
  const delay = reducedMotion ? 0 : 1500;
  window.setTimeout(() => {
    intro.hidden = true;
    main.focus({ preventScroll: true });
  }, delay);
}

introButton.addEventListener('click', () => openInvitation(true));
skipLink.addEventListener('click', () => openInvitation(false));
musicToggle.addEventListener('click', () => setMusicPlaying(music.paused));
music.addEventListener('play', syncMusicControl);
music.addEventListener('pause', syncMusicControl);

const revealItems = document.querySelectorAll('.js-reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
}

function initialiseScratchReveal(container) {
  const canvas = container.querySelector('.scratch-reveal__canvas');
  const revealButton = container.querySelector('.scratch-reveal__button');
  const status = container.querySelector('[data-scratch-status]');
  const context = canvas.getContext('2d');
  const visitedCells = new Set();
  const gridSize = 18;
  let drawing = false;
  let revealed = false;
  let lastPoint = null;

  if (!context) {
    canvas.hidden = true;
    revealButton.textContent = 'Date revealed';
    revealButton.disabled = true;
    return;
  }

  function paintCover() {
    if (revealed) return;
    const bounds = container.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#0b0b0a';
    context.fillRect(0, 0, bounds.width, bounds.height);

    context.strokeStyle = 'rgba(198, 161, 90, .4)';
    context.lineWidth = 1;
    const spacing = Math.max(18, bounds.width / 12);
    for (let offset = -bounds.height; offset < bounds.width; offset += spacing) {
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset + bounds.height, bounds.height);
      context.stroke();
    }

    context.strokeStyle = '#c6a15a';
    context.lineWidth = 2;
    context.strokeRect(5, 5, Math.max(0, bounds.width - 10), Math.max(0, bounds.height - 10));
  }

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top, width: bounds.width, height: bounds.height };
  }

  function markVisited(point) {
    const cellX = Math.max(0, Math.min(gridSize - 1, Math.floor((point.x / point.width) * gridSize)));
    const cellY = Math.max(0, Math.min(gridSize - 1, Math.floor((point.y / point.height) * gridSize)));
    const radius = 2;
    for (let x = cellX - radius; x <= cellX + radius; x += 1) {
      for (let y = cellY - radius; y <= cellY + radius; y += 1) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) visitedCells.add(`${x}:${y}`);
      }
    }
  }

  function scratch(point) {
    const brushSize = Math.max(34, Math.min(point.width, point.height) * .17);
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;
    context.beginPath();
    if (lastPoint) context.moveTo(lastPoint.x, lastPoint.y);
    else context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    markVisited(point);
    lastPoint = point;

    if (visitedCells.size / (gridSize * gridSize) >= .38) revealDate();
  }

  function revealDate() {
    if (revealed) return;
    revealed = true;
    drawing = false;
    container.classList.add('is-revealed');
    status.textContent = 'Wedding date revealed: 17 October 2026.';
    try { window.sessionStorage.setItem('noor-zayn-date-revealed', 'true'); } catch { /* Storage may be unavailable. */ }
    window.setTimeout(() => { canvas.hidden = true; }, reducedMotion ? 0 : 560);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (revealed) return;
    drawing = true;
    lastPoint = null;
    container.classList.add('is-scratching');
    canvas.setPointerCapture(event.pointerId);
    scratch(pointFromEvent(event));
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drawing || revealed) return;
    scratch(pointFromEvent(event));
  });
  canvas.addEventListener('pointerup', () => { drawing = false; lastPoint = null; });
  canvas.addEventListener('pointercancel', () => { drawing = false; lastPoint = null; });
  revealButton.addEventListener('click', revealDate);

  try {
    if (window.sessionStorage.getItem('noor-zayn-date-revealed') === 'true') revealDate();
    else paintCover();
  } catch {
    paintCover();
  }

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      if (!revealed && !drawing) {
        visitedCells.clear();
        paintCover();
      }
    });
    resizeObserver.observe(container);
  }
}

document.querySelectorAll('[data-scratch-reveal]').forEach(initialiseScratchReveal);

function updateCountdown() {
  const difference = Math.max(0, EVENT.localDate.getTime() - Date.now());
  const values = {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
  Object.entries(values).forEach(([key, value]) => {
    const output = document.querySelector(`[data-countdown="${key}"]`);
    output.textContent = String(value).padStart(2, '0');
  });
}

updateCountdown();
const countdownTimer = window.setInterval(updateCountdown, 1000);
window.addEventListener('pagehide', () => window.clearInterval(countdownTimer), { once: true });

function escapeCalendarText(value) {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

document.querySelector('#calendar-action').addEventListener('click', () => {
  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Noor and Zayn//Wedding Invitation//EN',
    'BEGIN:VEVENT', `UID:noor-zayn-20261017@invitation`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${EVENT.start}`, `DTEND:${EVENT.end}`, `SUMMARY:${escapeCalendarText(EVENT.title)}`,
    `DESCRIPTION:${escapeCalendarText(EVENT.description)}`, `LOCATION:${escapeCalendarText(EVENT.location)}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
  link.download = 'noor-and-zayn-wedding.ics';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Calendar file downloaded');
});

document.querySelector('#copy-address').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EVENT.location);
    showToast('Address copied');
  } catch {
    showToast(EVENT.location, 5000);
  }
});

const dialog = document.querySelector('#rsvp-dialog');
const rsvpForm = document.querySelector('#rsvp-form');
let returnFocus = null;

document.querySelectorAll('[data-open-rsvp]').forEach((button) => {
  button.addEventListener('click', () => {
    returnFocus = button;
    dialog.showModal();
    window.setTimeout(() => document.querySelector('#guest-name').focus(), 0);
  });
});

function closeDialog() {
  dialog.close();
  returnFocus?.focus();
}

document.querySelector('[data-close-rsvp]').addEventListener('click', closeDialog);
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeDialog();
});

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!rsvpForm.reportValidity()) return;
  const submit = rsvpForm.querySelector('.form-submit');
  const status = rsvpForm.querySelector('.form-status');
  const payload = Object.fromEntries(new FormData(rsvpForm));
  submit.disabled = true;
  status.textContent = 'Sending your reply…';

  try {
    const endpoint = rsvpForm.dataset.endpoint.trim();
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Submission failed');
    } else {
      localStorage.setItem('noor-zayn-rsvp', JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }));
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
    status.textContent = payload.attendance === 'yes' ? 'Wonderful — we cannot wait to celebrate with you!' : 'Thank you for letting us know. You will be missed.';
    if (payload.attendance === 'yes') celebrate();
    rsvpForm.reset();
    submit.textContent = 'Reply received';
  } catch {
    status.textContent = 'We could not send that reply. Please try again.';
    submit.disabled = false;
  }
});

function celebrate() {
  if (reducedMotion) return;
  const layer = document.querySelector('.confetti');
  const colours = ['#9e1b32', '#f4eddf', '#d3ad65', '#0b0b0a'];
  layer.replaceChildren();
  for (let index = 0; index < 72; index += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    piece.style.setProperty('--duration', `${1.9 + Math.random() * 1.8}s`);
    piece.style.setProperty('--turn', `${Math.random() * 900 - 450}deg`);
    piece.style.setProperty('--colour', colours[index % colours.length]);
    layer.append(piece);
  }
  layer.classList.add('is-active');
  window.setTimeout(() => layer.classList.remove('is-active'), 4200);
}

let toastTimer;
function showToast(message, duration = 2600) {
  const toast = document.querySelector('.toast');
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, duration);
}
