// Mouse and keyboard input, in the 1280x720 logical coordinates the
// renderer draws in. Clicks are queued as points and taken once by the
// loop, so a click between two frames is never lost or counted twice.
export const ACTION_CONFIRM = 1;
export const ACTION_RESTART = 2;

const CONFIRM = new Set(['Space', 'Enter']);
const RESTART = new Set(['KeyR']);

export function createInput(canvas, toLogical) {
  let mouse = { x: -1, y: -1 };
  let clicks = [];
  let actions = 0;

  canvas.addEventListener('mousemove', (event) => {
    mouse = toLogical(event.clientX, event.clientY);
  });
  canvas.addEventListener('mouseleave', () => {
    mouse = { x: -1, y: -1 };
  });
  canvas.addEventListener('click', (event) => {
    clicks.push(toLogical(event.clientX, event.clientY));
  });
  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else {
      return;
    }
    event.preventDefault();
  });

  return {
    mouse() {
      return mouse;
    },
    /** The clicks since the last call, in arrival order. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    /** The one-shot key actions since the last call. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
