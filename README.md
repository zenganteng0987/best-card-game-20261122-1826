# Ember Court — Duel of the Cinder Cards

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/zenganteng0987/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/zenganteng0987/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original duel card game for the make.fun best-card-game bounty. You face
the Ash Warden across a green felt table with a 36-card deck of cinder suits.
No build step, no network: serve `game/` with any static server
(`node serve.ts`, then open http://localhost:8080) and play in a desktop
browser with mouse and keyboard.

## How to play

- Click or press Enter on the title screen to start a duel.
- Each trick, click one card from your hand. The Ash Warden answers with one
  of its own. Higher effective power takes the trick.
- The trick winner scores points equal to both cards' powers added together.
  The loser loses life equal to the gap in effective power.
- Both sides draw back up to 7 cards. Life starts at 30 each; life 0 loses
  at once. If the deck runs dry, higher life wins (then higher score).
- Press R or click the button on the end screens to play again.

## The suits and the element cycle

Four suits, powers 1–9 in each. A suit advantage adds +3 effective power:

- **Flame** beats **Leaf**
- **Leaf** beats **Stone**
- **Stone** beats **Tide**
- **Tide** beats **Flame**

So a 7 Flame (7 + 3 = 10) beats a 9 Leaf. Suits are told apart by colour,
by a drawn glyph, and by their name on the card — never by colour alone.

## The Ash Warden

The Warden plays a readable heuristic you can counter: it answers with the
cheapest card that still wins the trick, and when nothing wins it sacrifices
its weakest card while keeping the suits that beat yours. Bait out its
advantage cards with low plays, then take the big tricks with yours.

## Files

- `game/src/config.js` — suits, cycle, constants, palette
- `game/src/deck.js` — seeded shuffle, deal, draw
- `game/src/rules.js` — trick resolution, scoring, life, end of duel
- `game/src/ai.js` — the Ash Warden heuristic
- `game/src/render.js` — all canvas drawing: table, cards, screens
- `game/src/input.js` — mouse and keyboard
- `game/src/audio.js` — WebAudio synth blips
- `game/src/shots.js` — deterministic staging for the screenshots
- `game/src/main.js` — game loop and screen state machine
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`
- `serve.ts` — tiny static server for local play

All art is drawn in code and all sound is synthesised in code; nothing is
copied from another game.
