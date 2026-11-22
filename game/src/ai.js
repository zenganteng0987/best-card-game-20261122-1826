// The Ash Warden: a readable heuristic the player can learn and counter.
// It sees the card the player just played, then answers with the cheapest
// card that still wins the trick; when nothing wins it sacrifices its
// weakest card, keeping the suits that beat the player's likely suits.
import { effectivePower, hasAdvantage } from './rules.js';

/**
 * Pick the index of the card to play against `playerCard`.
 * Winning cheaply first: among cards that win, the lowest effective power.
 * Sacrificing second: among cards that lose, the lowest base power — and a
 * sacrifice that keeps an advantage suit outranks one that spends it, so
 * the beating suits stay in hand for a trick they can win.
 */
export function chooseCard(hand, playerCard) {
  let bestWin = -1;
  let bestWinPower = Infinity;
  let bestSacrifice = -1;
  let bestSacrificePower = Infinity;
  let sacrificeKeepsAdvantage = false;
  for (let index = 0; index < hand.length; index += 1) {
    const card = hand[index];
    const power = effectivePower(card, playerCard);
    const foePower = effectivePower(playerCard, card);
    if (power > foePower) {
      if (power < bestWinPower) {
        bestWinPower = power;
        bestWin = index;
      }
    } else {
      // A sacrifice that keeps an advantage suit is worth more than a
      // sacrifice that spends one: hold the beating suits back.
      const keepsAdvantage = !hasAdvantage(card, playerCard);
      if (
        bestSacrifice === -1 ||
        (keepsAdvantage && !sacrificeKeepsAdvantage) ||
        (keepsAdvantage === sacrificeKeepsAdvantage && card.power < bestSacrificePower)
      ) {
        bestSacrificePower = card.power;
        bestSacrifice = index;
        sacrificeKeepsAdvantage = keepsAdvantage;
      }
    }
  }
  if (bestWin !== -1) return bestWin;
  return bestSacrifice === -1 ? 0 : bestSacrifice;
}
