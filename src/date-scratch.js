export function initDateScratch(selector = '[data-date-scratch]') {
  document.querySelectorAll(selector).forEach((container) => {
    const stage = container.querySelector('.date-scratch__stage');
    const value = container.querySelector('.date-scratch__value');
    const canvas = container.querySelector('.date-scratch__canvas');
    const hint = container.querySelector('.date-scratch__hint');
    const button = container.querySelector('.date-scratch__button');
    const status = container.querySelector('[data-date-scratch-status]');
    const context = canvas?.getContext('2d');

    if (!stage || !value || !canvas || !hint || !button || !status || !context) {
      container.classList.add('is-revealed');
      return;
    }

    const storageKey = container.dataset.scratchKey || 'wedding-date-revealed';
    const coverColour = container.dataset.scratchCover || '#171513';
    const accentColour = container.dataset.scratchAccent || '#c9a66b';
    const gridColumns = 24;
    const gridRows = 8;
    const visitedCells = new Set();
    let drawing = false;
    let revealed = false;
    let lastPoint = null;

    function setLayerVisibility(hidden) {
      canvas.hidden = hidden;
      hint.hidden = hidden;
      button.hidden = hidden;
    }

    function revealDate({ moveFocus = false, remember = true } = {}) {
      if (revealed) return;
      revealed = true;
      drawing = false;
      container.classList.add('is-revealed');
      status.textContent = 'Wedding date revealed: 17 October 2026.';
      if (remember) {
        try {
          window.sessionStorage.setItem(storageKey, 'true');
        } catch {
          // The interaction still works when browser storage is unavailable.
        }
      }

      const finish = () => {
        setLayerVisibility(true);
        if (moveFocus) value.focus({ preventScroll: true });
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
      else window.setTimeout(finish, 520);
    }

    function paintCover() {
      if (revealed) return;
      const bounds = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = coverColour;
      context.fillRect(0, 0, bounds.width, bounds.height);

      const spacing = Math.max(18, bounds.width / 16);
      context.strokeStyle = accentColour;
      context.globalAlpha = 0.34;
      context.lineWidth = 1;
      for (let offset = -bounds.height; offset < bounds.width; offset += spacing) {
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset + bounds.height, bounds.height);
        context.stroke();
      }

      context.globalAlpha = 1;
      context.strokeStyle = accentColour;
      context.lineWidth = 1.5;
      context.strokeRect(4.5, 4.5, Math.max(0, bounds.width - 9), Math.max(0, bounds.height - 9));
    }

    function getPoint(event) {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    }

    function markVisited(point) {
      const cellX = Math.max(0, Math.min(gridColumns - 1, Math.floor((point.x / point.width) * gridColumns)));
      const cellY = Math.max(0, Math.min(gridRows - 1, Math.floor((point.y / point.height) * gridRows)));
      for (let x = cellX - 2; x <= cellX + 2; x += 1) {
        for (let y = cellY - 1; y <= cellY + 1; y += 1) {
          if (x >= 0 && x < gridColumns && y >= 0 && y < gridRows) visitedCells.add(`${x}:${y}`);
        }
      }
    }

    function scratch(point) {
      const brushSize = Math.max(32, Math.min(point.width, point.height) * 0.42);
      context.globalCompositeOperation = 'destination-out';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = brushSize;
      context.beginPath();
      context.moveTo(lastPoint?.x ?? point.x, lastPoint?.y ?? point.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      markVisited(point);
      lastPoint = point;

      if (visitedCells.size / (gridColumns * gridRows) >= 0.36) revealDate();
    }

    canvas.addEventListener('pointerdown', (event) => {
      if (revealed) return;
      event.preventDefault();
      drawing = true;
      lastPoint = null;
      container.classList.add('is-scratching');
      canvas.setPointerCapture(event.pointerId);
      scratch(getPoint(event));
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!drawing || revealed) return;
      event.preventDefault();
      scratch(getPoint(event));
    });

    function stopDrawing() {
      drawing = false;
      lastPoint = null;
    }

    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    button.addEventListener('click', () => revealDate({ moveFocus: true }));

    try {
      if (window.sessionStorage.getItem(storageKey) === 'true') {
        revealDate({ remember: false });
        setLayerVisibility(true);
      } else {
        paintCover();
      }
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
      resizeObserver.observe(stage);
    }
  });
}
