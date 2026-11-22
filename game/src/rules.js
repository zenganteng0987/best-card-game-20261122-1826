// The rules of Ember Court: trick resolution, scoring, life and the end
// of the duel. A match is plain data; these functions are the only ones
// that change it, so the live game, the AI and the screenshot staging all
// play by exactly the same rules.
import { ADVANTAGE, HAND_SIZE, START_LIFE, SUITS } from './config.js';
import { buildDeck, createRandom, deal, drawUpTo, shuffle } from './deck.js';
import { chooseCard } from './ai.js';

/** A fresh match from a seeded generator: shuffled deck, 7 cards each. */
export function createMatch(random) {
  const deck = shuffle(buildDeck(), random);
  const { playerHand, aiHand, drawPile } = deal(deck);
  return {
    random,
    playerHand,
    aiHand,
    drawPile,
    playerLife: START_LIFE,
    aiLife: START_LIFE,
    playerScore: 0,
    aiScore: 0,
    tricks: 0,
    playerTricks: 0,
    aiTricks: 0,
    phase: 'await',
    pending: null,
    log: ['The duel begins. Play a card to open the first trick.'],
    winner: null,
    overReason: '',
  };
}

/** A card's suit beats the other card's suit in the element cycle. */
export function hasAdvantage(card, foeCard) {
  return SUITS[card.suit].beats === foeCard.suit;
}

/** Effective power: base power, plus ADVANTAGE when the suit beats the foe's. */
export function effectivePower(card, foeCard) {
  return card.power + (hasAdvantage(card, foeCard) ? ADVANTAGE : 0);
}

/**
 * The player opens a trick with the card at `handIndex`. The Ash Warden
 * answers, and the pair waits in `pending` until the reveal is applied.
 * Returns false when no trick can open (a trick is already open, the duel
 * is over, or the hand is empty).
 */
export function playTrick(match, handIndex) {
  if (match.phase !== 'await' || match.winner !== null) return false;
  if (handIndex < 0 || handIndex >= match.playerHand.length) return false;
  const playerCard = match.playerHand.splice(handIndex, 1)[0];
  const aiIndex = chooseCard(match.aiHand, playerCard);
  const aiCard = match.aiHand.splice(aiIndex, 1)[0];
  const playerPower = effectivePower(playerCard, aiCard);
  const aiPower = effectivePower(aiCard, playerCard);
  const winner = playerPower > aiPower ? 'player' : aiPower > playerPower ? 'ai' : 'draw';
  match.pending = { playerCard, aiCard, playerPower, aiPower, winner };
  match.phase = 'reveal';
  return true;
}

/**
 * Score the pending trick: the winner takes points equal to the sum of
 * both cards' base powers, the loser loses life equal to the difference
 * in effective power. Both sides draw back up to HAND_SIZE, then the duel
 * ends when a life hits 0 or no cards remain anywhere.
 */
export function applyTrick(match) {
  const pending = match.pending;
  if (!pending) return;
  match.pending = null;
  match.phase = 'await';
  match.tricks += 1;
  const points = pending.playerCard.power + pending.aiCard.power;
  const suitWord = (card) => `${card.power} ${SUITS[card.suit].name}`;
  if (pending.winner === 'player') {
    match.playerScore += points;
    match.playerTricks += 1;
    const damage = pending.playerPower - pending.aiPower;
    match.aiLife = Math.max(0, match.aiLife - damage);
    match.log.push(
      `T${match.tricks}: You ${suitWord(pending.playerCard)} beat ${suitWord(pending.aiCard)}, +${points}, Warden -${damage}`,
    );
  } else if (pending.winner === 'ai') {
    match.aiScore += points;
    match.aiTricks += 1;
    const damage = pending.aiPower - pending.playerPower;
    match.playerLife = Math.max(0, match.playerLife - damage);
    match.log.push(
      `T${match.tricks}: Warden ${suitWord(pending.aiCard)} beat ${suitWord(pending.playerCard)}, +${points}, you -${damage}`,
    );
  } else {
    match.log.push(
      `T${match.tricks}: ${suitWord(pending.playerCard)} ties ${suitWord(pending.aiCard)}`,
    );
  }
  if (match.log.length > 6) match.log.splice(0, match.log.length - 6);
  drawUpTo(match.playerHand, match.drawPile);
  drawUpTo(match.aiHand, match.drawPile);
  checkEnd(match);
}

/** End the duel when a life hits 0, or when the deck and both hands are dry. */
export function checkEnd(match) {
  if (match.winner !== null) return;
  if (match.playerLife <= 0) {
    match.winner = 'ai';
    match.overReason = 'Your life reached 0.';
    return;
  }
  if (match.aiLife <= 0) {
    match.winner = 'player';
    match.overReason = 'The Ash Warden\u2019s life reached 0.';
    return;
  }
  const cardsLeft = match.drawPile.length + match.playerHand.length + match.aiHand.length;
  if (cardsLeft === 0) {
    if (match.playerLife !== match.aiLife) {
      match.winner = match.playerLife > match.aiLife ? 'player' : 'ai';
      match.overReason = 'The deck ran out — higher life takes the court.';
    } else if (match.playerScore !== match.aiScore) {
      match.winner = match.playerScore > match.aiScore ? 'player' : 'ai';
      match.overReason = 'The deck ran out — tied on life, higher score takes the court.';
    } else {
      match.winner = 'player';
      match.overReason = 'The deck ran out — tied on life and score, the challenger takes the court.';
    }
  }
}

/** A seeded match, for tests and screenshots: same seed, same duel. */
export function createSeededMatch(seed) {
  return createMatch(createRandom(seed));
}
