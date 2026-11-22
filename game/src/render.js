// Drawing only: the match and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. Every suit is drawn as a shape and
// named in text, never told apart by colour alone.
import { CARD, CENTRE_CARD, FIELD, FONT, PALETTE, START_LIFE, SUITS, SUIT_KEYS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

/** Where the player's hand sits, so input can hit-test the same rects. */
export function playerCardRects(match) {
  const hand = match.playerHand;
  const total = hand.length * CARD.width + (hand.length - 1) * CARD.gap;
  const startX = (FIELD.width - total) / 2;
  const top = FIELD.height - CARD.height - 18;
  return hand.map((card, index) => ({
    card,
    index,
    x: startX + index * (CARD.width + CARD.gap),
    y: top,
    width: CARD.width,
    height: CARD.height,
  }));
}

/** The Play again / Try again button on the end screens. */
export function endButtonRect() {
  return { x: FIELD.width / 2 - 130, y: 520, width: 260, height: 56 };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.scale = scale;
    view.x = (canvas.width - FIELD.width * scale) / 2;
    view.y = (canvas.height - FIELD.height * scale) / 2;
  }

  window.addEventListener('resize', resize);
  resize();

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * FIELD.width,
      y: ((clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  function roundRect(x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function text(value, x, y, size, color, align = 'left', weight = 'normal') {
    context.fillStyle = color;
    context.font = `${weight} ${size}px ${FONT}`;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  // ---- suit glyphs, drawn as shapes -------------------------------------

  function drawFlame(cx, cy, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(cx, cy - size);
    context.bezierCurveTo(cx + size * 0.7, cy - size * 0.25, cx + size * 0.55, cy + size * 0.45, cx, cy + size * 0.6);
    context.bezierCurveTo(cx - size * 0.55, cy + size * 0.45, cx - size * 0.7, cy - size * 0.25, cx, cy - size);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.gold;
    context.beginPath();
    context.moveTo(cx, cy - size * 0.25);
    context.bezierCurveTo(cx + size * 0.3, cy + size * 0.1, cx + size * 0.22, cy + size * 0.42, cx, cy + size * 0.45);
    context.bezierCurveTo(cx - size * 0.22, cy + size * 0.42, cx - size * 0.3, cy + size * 0.1, cx, cy - size * 0.25);
    context.closePath();
    context.fill();
  }

  function drawTide(cx, cy, size, color) {
    context.strokeStyle = color;
    context.lineWidth = Math.max(3, size * 0.22);
    context.lineCap = 'round';
    for (const row of [-0.35, 0.15]) {
      context.beginPath();
      context.moveTo(cx - size, cy + size * row);
      context.bezierCurveTo(cx - size * 0.5, cy + size * (row - 0.55), cx - size * 0.1, cy + size * (row + 0.55), cx + size * 0.4, cy + size * row);
      context.bezierCurveTo(cx + size * 0.6, cy + size * (row - 0.3), cx + size * 0.8, cy + size * (row + 0.2), cx + size, cy + size * row);
      context.stroke();
    }
  }

  function drawLeaf(cx, cy, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(cx, cy - size);
    context.bezierCurveTo(cx + size * 0.85, cy - size * 0.35, cx + size * 0.6, cy + size * 0.7, cx, cy + size * 0.75);
    context.bezierCurveTo(cx - size * 0.6, cy + size * 0.7, cx - size * 0.85, cy - size * 0.35, cx, cy - size);
    context.closePath();
    context.fill();
    context.strokeStyle = PALETTE.cream;
    context.lineWidth = Math.max(2, size * 0.1);
    context.beginPath();
    context.moveTo(cx, cy - size * 0.7);
    context.lineTo(cx, cy + size * 0.7);
    context.stroke();
  }

  function drawStone(cx, cy, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(cx - size * 0.7, cy - size * 0.55);
    context.lineTo(cx + size * 0.55, cy - size * 0.75);
    context.lineTo(cx + size * 0.9, cy + size * 0.1);
    context.lineTo(cx + size * 0.35, cy + size * 0.8);
    context.lineTo(cx - size * 0.6, cy + size * 0.7);
    context.lineTo(cx - size * 0.95, cy + size * 0.05);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,0.35)';
    context.lineWidth = Math.max(2, size * 0.08);
    context.beginPath();
    context.moveTo(cx - size * 0.55, cy - size * 0.35);
    context.lineTo(cx + size * 0.35, cy - size * 0.5);
    context.lineTo(cx + size * 0.6, cy + size * 0.15);
    context.stroke();
  }

  /** The suit's glyph, centred on (cx, cy) with the given radius. */
  function drawSuitGlyph(suit, cx, cy, size) {
    const color = SUITS[suit].color;
    if (suit === 'flame') drawFlame(cx, cy, size, color);
    else if (suit === 'tide') drawTide(cx, cy, size, color);
    else if (suit === 'leaf') drawLeaf(cx, cy, size, color);
    else drawStone(cx, cy, size, color);
  }

  // ---- cards ---------------------------------------------------------------

  function drawCardBack(x, y, width, height) {
    roundRect(x, y, width, height, 10);
    context.fillStyle = '#5a1f16';
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 2;
    context.stroke();
    roundRect(x + 8, y + 8, width - 16, height - 16, 7);
    context.strokeStyle = 'rgba(232,193,90,0.7)';
    context.lineWidth = 1.5;
    context.stroke();
    drawFlame(x + width / 2, y + height / 2, Math.min(width, height) * 0.22, PALETTE.gold);
  }

  function drawCardFace(card, x, y, width, height) {
    roundRect(x, y, width, height, 10);
    context.fillStyle = PALETTE.cream;
    context.fill();
    context.strokeStyle = SUITS[card.suit].dark;
    context.lineWidth = 3;
    context.stroke();
    const suit = SUITS[card.suit];
    // Very large power number, centred: legible even at thumbnail size.
    text(String(card.power), x + width / 2, y + height * 0.42, Math.round(width * 0.52), suit.dark, 'center', 'bold');
    drawSuitGlyph(card.suit, x + width / 2, y + height * 0.68, width * 0.16);
    text(suit.name.toUpperCase(), x + width / 2, y + height * 0.9, Math.round(width * 0.13), suit.dark, 'center', 'bold');
    // Small corner marks, like a real card.
    text(String(card.power), x + 10, y + 24, 20, suit.dark, 'left', 'bold');
    drawSuitGlyph(card.suit, x + 16, y + 40, 9);
  }

  // ---- table furniture ------------------------------------------------------

  function drawLifeBar(x, y, width, life) {
    roundRect(x, y, width, 16, 8);
    context.fillStyle = '#0c1f13';
    context.fill();
    const fraction = Math.max(0, life / START_LIFE);
    if (fraction > 0) {
      roundRect(x, y, width * fraction, 16, 8);
      context.fillStyle = fraction > 0.5 ? PALETTE.green : fraction > 0.25 ? PALETTE.gold : PALETTE.red;
      context.fill();
    }
    text(`Life ${life}`, x + width / 2, y + 13, 12, fraction >= 0.5 ? '#0c1f13' : PALETTE.text, 'center', 'bold');
  }

  function drawTable() {
    context.fillStyle = PALETTE.felt;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.strokeStyle = PALETTE.feltLight;
    context.lineWidth = 2;
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.arc(FIELD.width / 2, FIELD.height / 2, 90 + index * 70, 0, Math.PI * 2);
      context.stroke();
    }
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 4;
    roundRect(10, 10, FIELD.width - 20, FIELD.height - 20, 18);
    context.stroke();
  }

  function drawLog(match) {
    roundRect(28, 236, 290, 190, 10);
    context.fillStyle = 'rgba(18,41,26,0.85)';
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 1.5;
    context.stroke();
    text('TRICK LOG', 44, 262, 14, PALETTE.gold, 'left', 'bold');
    let lineY = 286;
    for (const line of match.log.slice(-4)) {
      lineY += wrapText(line, 44, lineY, 258, 12, PALETTE.text);
      lineY += 8;
      if (lineY > 412) break;
    }
  }

  /** Wrap `value` into the width and draw it; returns the height used. */
  function wrapText(value, x, y, maxWidth, size, color) {
    context.fillStyle = color;
    context.font = `${size}px ${FONT}`;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    const words = value.split(' ');
    let line = '';
    let lineY = y;
    let lines = 1;
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (context.measureText(trial).width > maxWidth && line) {
        context.fillText(line, x, lineY);
        line = word;
        lineY += 15;
        lines += 1;
      } else {
        line = trial;
      }
    }
    context.fillText(line, x, lineY);
    return lines * 15;
  }

  // ---- screens ---------------------------------------------------------------

  function drawTitle() {
    drawTable();
    text('EMBER COURT', FIELD.width / 2, 150, 92, PALETTE.gold, 'center', 'bold');
    text('Duel of the Cinder Cards', FIELD.width / 2, 196, 28, PALETTE.text, 'center');
    text('Play a card each trick. Higher effective power takes the trick,', FIELD.width / 2, 252, 20, PALETTE.muted, 'center');
    text('scores both cards\u2019 powers, and deals life damage equal to the gap.', FIELD.width / 2, 280, 20, PALETTE.muted, 'center');
    text('First to 0 life loses. The deck runs dry, higher life wins.', FIELD.width / 2, 308, 20, PALETTE.muted, 'center');
    // The element cycle: Flame beats Leaf beats Stone beats Tide beats Flame.
    const cycleY = 400;
    const step = 220;
    const startX = FIELD.width / 2 - (step * 3) / 2;
    SUIT_KEYS.forEach((suit, index) => {
      const cx = startX + index * step;
      drawSuitGlyph(suit, cx, cycleY, 30);
      text(SUITS[suit].name, cx, cycleY + 58, 18, SUITS[suit].color, 'center', 'bold');
      text(`beats ${SUITS[SUITS[suit].beats].name}`, cx, cycleY + 82, 14, PALETTE.muted, 'center');
      if (index < SUIT_KEYS.length - 1) {
        text('\u2192', cx + step / 2, cycleY + 8, 30, PALETTE.gold, 'center', 'bold');
      }
    });
    text('Advantage adds +3 power. A 7 Flame beats a 9 Leaf.', FIELD.width / 2, 520, 18, PALETTE.text, 'center');
    text('Click or press Enter to play', FIELD.width / 2, 600, 26, PALETTE.gold, 'center', 'bold');
  }

  function drawPlay(match, hoverIndex) {
    drawTable();
    // Opponent: name, life, score, face-down hand.
    text('THE ASH WARDEN', 40, 52, 22, PALETTE.text, 'left', 'bold');
    drawLifeBar(40, 62, 300, match.aiLife);
    text(`Score ${match.aiScore}`, 1240, 52, 22, PALETTE.text, 'right', 'bold');
    text(`Tricks ${match.aiTricks}`, 1240, 80, 16, PALETTE.muted, 'right');
    const backWidth = 62;
    const backHeight = 88;
    const backTotal = match.aiHand.length * backWidth + (match.aiHand.length - 1) * 8;
    const backStart = (FIELD.width - backTotal) / 2;
    match.aiHand.forEach((card, index) => {
      drawCardBack(backStart + index * (backWidth + 8), 104, backWidth, backHeight);
    });
    // Centre: the two played cards, or empty slots waiting for a play.
    const centreY = 236;
    const leftX = FIELD.width / 2 - CENTRE_CARD.width - 90;
    const rightX = FIELD.width / 2 + 90;
    if (match.pending) {
      drawCardFace(match.pending.playerCard, leftX, centreY, CENTRE_CARD.width, CENTRE_CARD.height);
      drawCardFace(match.pending.aiCard, rightX, centreY, CENTRE_CARD.width, CENTRE_CARD.height);
      const result =
        match.pending.winner === 'player'
          ? `You take it! +${match.pending.playerCard.power + match.pending.aiCard.power} pts`
          : match.pending.winner === 'ai'
            ? `Warden takes it! +${match.pending.playerCard.power + match.pending.aiCard.power} pts`
            : 'A tie — no points';
      text(result, FIELD.width / 2, centreY + CENTRE_CARD.height + 34, 22, match.pending.winner === 'player' ? PALETTE.green : match.pending.winner === 'ai' ? PALETTE.red : PALETTE.text, 'center', 'bold');
      const gap = Math.abs(match.pending.playerPower - match.pending.aiPower);
      if (gap > 0) {
        text(
          match.pending.winner === 'player' ? `Warden loses ${gap} life` : `You lose ${gap} life`,
          FIELD.width / 2, centreY + CENTRE_CARD.height + 62, 17, PALETTE.muted, 'center',
        );
      }
    } else {
      roundRect(leftX, centreY, CENTRE_CARD.width, CENTRE_CARD.height, 10);
      context.strokeStyle = 'rgba(242,234,214,0.4)';
      context.lineWidth = 2;
      context.setLineDash([8, 6]);
      context.stroke();
      context.setLineDash([]);
      text('YOUR CARD', leftX + CENTRE_CARD.width / 2, centreY + CENTRE_CARD.height / 2, 16, PALETTE.muted, 'center', 'bold');
      roundRect(rightX, centreY, CENTRE_CARD.width, CENTRE_CARD.height, 10);
      context.strokeStyle = 'rgba(242,234,214,0.4)';
      context.lineWidth = 2;
      context.setLineDash([8, 6]);
      context.stroke();
      context.setLineDash([]);
      text('WARDEN', rightX + CENTRE_CARD.width / 2, centreY + CENTRE_CARD.height / 2, 16, PALETTE.muted, 'center', 'bold');
      text('VS', FIELD.width / 2, centreY + 110, 30, PALETTE.gold, 'center', 'bold');
    }
    // Deck pile and trick count, right of the centre.
    const pileX = 1050;
    const pileY = 250;
    for (let index = 0; index < Math.min(3, Math.ceil(match.drawPile.length / 8)); index += 1) {
      drawCardBack(pileX + index * 4, pileY - index * 4, 62, 88);
    }
    text(`Deck: ${match.drawPile.length}`, pileX + 31, pileY + 116, 16, PALETTE.text, 'center', 'bold');
    text(`Trick ${match.tricks + 1}`, FIELD.width / 2, 208, 18, PALETTE.muted, 'center', 'bold');
    drawLog(match);
    // Player: life, score, fanned hand.
    drawLifeBar(FIELD.width - 340, 500, 300, match.playerLife);
    text(`Score ${match.playerScore}`, 40, 516, 22, PALETTE.text, 'left', 'bold');
    text(`Tricks ${match.playerTricks}`, 40, 544, 16, PALETTE.muted, 'left');
    text(match.phase === 'await' ? 'Your turn — click a card' : 'Scoring the trick\u2026', FIELD.width / 2, 516, 18, PALETTE.gold, 'center', 'bold');
    const rects = playerCardRects(match);
    rects.forEach((rect) => {
      const lift = rect.index === hoverIndex && match.phase === 'await' ? CARD.hoverLift : 0;
      drawCardFace(rect.card, rect.x, rect.y - lift, rect.width, rect.height);
    });
  }

  function drawEnd(match, won) {
    drawTable();
    const title = won ? 'THE COURT IS YOURS' : 'THE ASH WARDEN PREVAILS';
    const color = won ? PALETTE.gold : PALETTE.red;
    text(title, FIELD.width / 2, 210, 64, color, 'center', 'bold');
    text(match.overReason, FIELD.width / 2, 268, 22, PALETTE.text, 'center');
    text(`Final score — You ${match.playerScore}  ·  Warden ${match.aiScore}`, FIELD.width / 2, 330, 26, PALETTE.text, 'center');
    text(`Tricks won — You ${match.playerTricks}  ·  Warden ${match.aiTricks}  ·  ${match.tricks} played`, FIELD.width / 2, 372, 20, PALETTE.muted, 'center');
    text(`Life — You ${match.playerLife}  ·  Warden ${match.aiLife}`, FIELD.width / 2, 404, 20, PALETTE.muted, 'center');
    // A small flourish: the winning side's suits fanned across the table.
    SUIT_KEYS.forEach((suit, index) => {
      drawSuitGlyph(suit, FIELD.width / 2 - 180 + index * 120, 460, 26);
    });
    const button = endButtonRect();
    roundRect(button.x, button.y, button.width, button.height, 12);
    context.fillStyle = PALETTE.gold;
    context.fill();
    text(won ? 'Play again' : 'Try again', FIELD.width / 2, button.y + 37, 24, '#241a12', 'center', 'bold');
    text('Press R or click the button', FIELD.width / 2, 620, 18, PALETTE.muted, 'center');
  }

  return {
    toLogical,
    draw(match, screen, hoverIndex) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = PALETTE.backdrop;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
      if (screen === SCREEN_TITLE) drawTitle();
      else if (screen === SCREEN_PLAY) drawPlay(match, hoverIndex);
      else if (screen === SCREEN_WIN) drawEnd(match, true);
      else if (screen === SCREEN_LOSS) drawEnd(match, false);
    },
  };
}
