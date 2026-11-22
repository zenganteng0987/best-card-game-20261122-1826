// Boot and the one loop: input is read every frame, a trick's reveal
// counts down in real time, and the renderer paints what is there. The
// game moves between four screens: title, play, win and loss.
//
// ?seed=N fixes the deal. ?shot=start|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady (and window.__shotScreen) for a screenshot.
import { REVEAL_SECONDS } from './config.js';
import { createRandom } from './deck.js';
import { applyTrick, createMatch, playTrick } from './rules.js';
import { ACTION_CONFIRM, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, endButtonRect, playerCardRects, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function runShot(name) {
  const match = createMatch(createRandom(seed));
  const staged = stageShot(name, match);
  let painted = 0;
  function paint() {
    renderer.draw(match, staged.screen, -1);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      window.__shotScreen = staged.screen;
      console.log(`shot ${name} seed ${seed} -> ${staged.screen} (reached: ${staged.reached === true})`);
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const audio = createAudio();
  const input = createInput(canvas, (x, y) => renderer.toLogical(x, y));
  let match = createMatch(createRandom(seed));
  let screen = SCREEN_TITLE;
  let revealLeft = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    match = createMatch(createRandom(Math.floor(Math.random() * 4294967296)));
    screen = SCREEN_PLAY;
    revealLeft = 0;
    announce('Playing. Life 30 each. Click a card to open a trick.');
  }

  function endGame() {
    screen = match.winner === 'player' ? SCREEN_WIN : SCREEN_LOSS;
    if (match.winner === 'player') audio.winGame();
    else audio.loseGame();
    announce(
      match.winner === 'player'
        ? `You win the court. Final score ${match.playerScore} to ${match.aiScore}.`
        : `The Ash Warden prevails. Final score ${match.playerScore} to ${match.aiScore}.`,
    );
  }

  function hoverIndex() {
    if (screen !== SCREEN_PLAY || match.phase !== 'await') return -1;
    const mouse = input.mouse();
    const rects = playerCardRects(match);
    for (let index = rects.length - 1; index >= 0; index -= 1) {
      const rect = rects[index];
      if (mouse.x >= rect.x && mouse.x <= rect.x + rect.width && mouse.y >= rect.y && mouse.y <= rect.y + rect.height) {
        return index;
      }
    }
    return -1;
  }

  function handleClicks() {
    const clicks = input.takeClicks();
    for (const point of clicks) {
      audio.unlock();
      if (screen === SCREEN_TITLE) {
        startGame();
        return;
      }
      if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
        const button = endButtonRect();
        if (point.x >= button.x && point.x <= button.x + button.width && point.y >= button.y && point.y <= button.y + button.height) {
          startGame();
        }
        return;
      }
      if (screen === SCREEN_PLAY && match.phase === 'await') {
        const index = hoverIndex();
        if (index !== -1 && playTrick(match, index)) {
          audio.play();
          revealLeft = REVEAL_SECONDS;
        }
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startGame();
      else if (screen === SCREEN_WIN || screen === SCREEN_LOSS) startGame();
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_WIN || screen === SCREEN_LOSS)) {
      startGame();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min((now - last) / 1000, 0.25);
    last = now;
    handleActions();
    handleClicks();
    if (screen === SCREEN_PLAY && match.phase === 'reveal') {
      revealLeft -= delta;
      if (revealLeft <= 0) {
        const winner = match.pending ? match.pending.winner : null;
        applyTrick(match);
        if (winner === 'player') audio.winTrick();
        else if (winner === 'ai') audio.loseTrick();
        if (match.winner !== null) endGame();
        else announce(`Trick ${match.tricks} scored. Your turn.`);
      }
    }
    renderer.draw(match, screen, hoverIndex());
  }

  // A read-only handle for the play-test script: the screen and the match.
  window.__ember = {
    screen: () => screen,
    match: () => match,
  };

  announce('Ember Court. Press Enter or click to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
