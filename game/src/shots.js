// The screenshot scenes behind ?shot=start|play|win|loss. Each one drives
// the real engine forward from a fresh seeded match with a fixed player
// policy, so the frame is what a short game really looks like and the
// same seed always gives the same frame. No screen is drawn outside the
// game code: a win or loss shot only returns when the engine reached it.
//
// The policies are real ways to play, and they teach the game's lesson:
// the win scene counts cards (the best expected margin against the unseen
// deck), the loss scene goes all-in on its biggest card every trick — and
// the Warden punishes that, picking the big cards off cheaply until the
// challenger's life runs out. The loss scene's deal is seed 2: on seed 7
// the all-in line survives 7 life to 1, so the loss is staged on the seed
// where the same reckless line genuinely loses 0 life to 23.
import { buildDeck } from './deck.js';
import { effectivePower } from './rules.js';
import { applyTrick, playTrick } from './rules.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** Cards the player has not seen: the whole deck minus its own hand. */
function unseenPool(match) {
  const seen = new Set(match.playerHand.map((card) => `${card.suit}${card.power}`));
  return buildDeck().filter((card) => !seen.has(`${card.suit}${card.power}`));
}

/** A card's expected margin against a random unseen card. */
function expectedMargin(match, card) {
  const pool = unseenPool(match);
  let total = 0;
  for (const foe of pool) total += effectivePower(card, foe) - effectivePower(foe, card);
  return total / pool.length;
}

/** Card counting: the highest expected margin, tie-break higher power. */
function countingBestIndex(match) {
  let best = 0;
  let bestScore = -Infinity;
  for (let index = 0; index < match.playerHand.length; index += 1) {
    const score = expectedMargin(match, match.playerHand[index]);
    if (score > bestScore || (score === bestScore && match.playerHand[index].power > match.playerHand[best].power)) {
      bestScore = score;
      best = index;
    }
  }
  return best;
}

/** All-in: the biggest card in hand, whatever the Warden holds. */
function strongestIndex(match) {
  let best = 0;
  for (let index = 1; index < match.playerHand.length; index += 1) {
    if (match.playerHand[index].power > match.playerHand[best].power) best = index;
  }
  return best;
}

/** A middling card: the lowest that can beat a 5, else the weakest. */
function middlingIndex(match) {
  let best = -1;
  for (let index = 0; index < match.playerHand.length; index += 1) {
    const card = match.playerHand[index];
    if (card.power >= 5 && (best === -1 || card.power < match.playerHand[best].power)) best = index;
  }
  if (best !== -1) return best;
  let weakest = 0;
  for (let index = 1; index < match.playerHand.length; index += 1) {
    if (match.playerHand[index].power < match.playerHand[weakest].power) weakest = index;
  }
  return weakest;
}

/** Play one trick at once, skipping the reveal pause the live game shows. */
function playTrickNow(match, handIndex) {
  if (!playTrick(match, handIndex)) return false;
  applyTrick(match);
  return true;
}

/**
 * Set `match` to the named scene (start, play, win or loss; any other
 * name is start) and return the screen to draw over it. The win and loss
 * scenes play the whole duel out; the play scene stops mid-duel.
 */
export function stageShot(name, match) {
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    return { screen: SCREEN_TITLE };
  }
  const policy = name === 'win' || name === 'play' ? countingBestIndex : name === 'loss' ? strongestIndex : middlingIndex;
  const tricksToPlay = name === 'play' ? 6 : 40;
  for (let index = 0; index < tricksToPlay; index += 1) {
    if (match.winner !== null) break;
    if (match.playerHand.length === 0) break;
    if (!playTrickNow(match, policy(match))) break;
  }
  if (name === 'win' || name === 'loss') {
    const wanted = name === 'win' ? 'player' : 'ai';
    const reached = match.winner === wanted;
    return { screen: reached ? (wanted === 'player' ? SCREEN_WIN : SCREEN_LOSS) : SCREEN_PLAY, reached };
  }
  return { screen: SCREEN_PLAY, reached: match.winner === null };
}
