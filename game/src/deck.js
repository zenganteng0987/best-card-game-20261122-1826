// The deck: build, shuffle with a seeded random source, deal and draw.
// Nothing here touches the screen; the same functions drive the live game
// and the deterministic screenshot staging.
import { HAND_SIZE, SUIT_KEYS } from './config.js';

/** mulberry32: a small seeded generator, so one seed always deals one game. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh 36-card deck: four suits, powers 1..9 in each. */
export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let power = 1; power <= 9; power += 1) {
      deck.push({ suit, power });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle in place, driven by the seeded generator. */
export function shuffle(deck, random) {
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const held = deck[index];
    deck[index] = deck[other];
    deck[other] = held;
  }
  return deck;
}

/** Deal HAND_SIZE cards to each side; what is left is the draw pile. */
export function deal(deck) {
  const playerHand = [];
  const aiHand = [];
  for (let index = 0; index < HAND_SIZE; index += 1) {
    playerHand.push(deck.pop());
    aiHand.push(deck.pop());
  }
  return { playerHand, aiHand, drawPile: deck };
}

/** Draw from the pile until the hand holds HAND_SIZE cards, or the pile is dry. */
export function drawUpTo(hand, drawPile) {
  while (hand.length < HAND_SIZE && drawPile.length > 0) {
    hand.push(drawPile.pop());
  }
}
