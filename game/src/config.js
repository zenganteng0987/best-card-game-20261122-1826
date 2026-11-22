// Ember Court: every tuning number, suit and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The four suits. Each card's power runs 1..9, so the deck holds 36 cards. */
export const SUITS = {
  flame: { name: 'Flame', color: '#e5533d', dark: '#a8321f', beats: 'leaf' },
  tide: { name: 'Tide', color: '#2f7fc2', dark: '#1d5a8f', beats: 'flame' },
  leaf: { name: 'Leaf', color: '#3d9e4d', dark: '#276b33', beats: 'stone' },
  stone: { name: 'Stone', color: '#8a7f72', dark: '#5d554c', beats: 'tide' },
};

export const SUIT_KEYS = ['flame', 'tide', 'leaf', 'stone'];

/** A suit advantage is worth this much extra effective power in a trick. */
export const ADVANTAGE = 3;

/** Cards in each hand at the start of a trick, and cards drawn back up to. */
export const HAND_SIZE = 7;

/** Life each side starts with; life 0 ends the duel at once. */
export const START_LIFE = 30;

/** Seconds the two played cards stay face up before the trick is scored. */
export const REVEAL_SECONDS = 1.15;

/** Cards: the fanned hand at the bottom, the played cards in the middle. */
export const CARD = { width: 104, height: 146, gap: 12, hoverLift: 20 };
export const CENTRE_CARD = { width: 150, height: 210 };

export const PALETTE = {
  backdrop: '#101a14',
  felt: '#1d4a2e',
  feltDark: '#143522',
  feltLight: '#27603a',
  gold: '#e8c15a',
  goldDark: '#9a7a2e',
  panel: '#12291a',
  panelEdge: '#3a5a44',
  cream: '#f7f0dc',
  ink: '#241a12',
  text: '#f2ead6',
  muted: '#b9c4ae',
  red: '#e5533d',
  green: '#7fd08a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
