import { deepEqual, equal, ok } from 'node:assert/strict';
import { StrokePath } from 'tegaki/core';
import {
  canvasBox,
  charFrames,
  effectEnd,
  eraseProgress,
  fadeAlpha,
  frameProgress,
  gridPositions,
  hollowPath,
  overlapTimes,
  strokeGroups,
  visibleEnds,
} from '../.vitepress/theme/tegaki/engineering.ts';

// Asserts for the parts of the engineering plugin worth getting right without
// a browser: the stroke timing, the three line kinds' geometry, the hollow
// outline. Run with `node scripts/check-engineering.ts` (Node 24 strips types).

function straight(x0: number, y0: number, x1: number, y1: number, width = 10): StrokePath {
  return new StrokePath([
    { x: x0, y: y0, width, t: 0 },
    { x: x1, y: y1, width, t: 1 },
  ]);
}

// --- characters ---------------------------------------------------------

{
  const strokes = [
    { entryIndex: 0 },
    { entryIndex: 0 },
    { entryIndex: 1 },
    { entryIndex: 2 },
    { entryIndex: 2 },
    { entryIndex: 2 },
  ];
  deepEqual(
    strokeGroups(strokes).map((group) => group.length),
    [2, 1, 3],
  );
  deepEqual(strokeGroups([]), []);
}

// --- stroke overlap -----------------------------------------------------

{
  const timed = [
    { entryIndex: 0, start: 0, duration: 1 },
    { entryIndex: 0, start: 1, duration: 1 },
    { entryIndex: 1, start: 2, duration: 1 },
    { entryIndex: 1, start: 3, duration: 1 },
    { entryIndex: 2, start: 4, duration: 1 },
  ];
  deepEqual(
    overlapTimes(timed, 0).map((t) => t.start),
    [0, 1, 2, 3, 4],
  );
  // Each character's second stroke starts half a stroke early; the gap after
  // a character is kept, and a single-stroke character carries the shift on
  // without doubling it.
  deepEqual(
    overlapTimes(timed, 0.5).map((t) => t.start),
    [0, 0.5, 1.5, 2, 3],
  );
  deepEqual(
    overlapTimes(timed, 0.5).map((t) => t.duration),
    [1, 1, 1, 1, 1],
  );
  // Characters themselves overlap by a share of the previous character's span.
  deepEqual(
    overlapTimes(timed, 0.5, 0.5).map((t) => t.start),
    [0, 0.5, 0.75, 1.25, 1.5],
  );
  // Character overlap alone leaves stroke spacing alone.
  deepEqual(
    overlapTimes(timed, 0, 0.5).map((t) => t.start),
    [0, 1, 1, 2, 2],
  );
}

// --- timeline tail ------------------------------------------------------

{
  const timed = [
    { entryIndex: 0, start: 0, duration: 1 },
    { entryIndex: 0, start: 1, duration: 1 },
  ];
  const times = overlapTimes(timed, 0.5);
  // The writing's own three seconds of pause stay: 5 - (2 - 1.5).
  equal(effectEnd(timed, times, 5, 0.4, 0.5), 4.5);
  // But never shorter than the last character's fill and wipe.
  equal(effectEnd(timed, times, 1.5, 1, 1.2), 1.5 + 1.2);
  equal(effectEnd([], [], 3, 1, 1), 3);
}

// --- projected guides ---------------------------------------------------

{
  const path = straight(10, 20, 30, 20); // ink box x 5..35, y 15..25
  const frames = charFrames([{ entryIndex: 0, path }]);
  equal(frames.length, 1);
  const lines = frames[0]!.lines;
  equal(lines.length, 4);
  deepEqual(
    lines.map((line) => `${line.axis}:${line.at}`).sort(),
    ['h:15', 'h:25', 'v:35', 'v:5'],
  );
  // Everything is axis aligned; some line wipes toward each end.
  deepEqual(new Set(lines.map((line) => line.dir)), new Set([-1, 1]));
  // Identical strokes of one character merge instead of drawing twice.
  deepEqual(charFrames([{ entryIndex: 0, path }, { entryIndex: 0, path }]), frames);
  // Same input, same guides: nothing random.
  deepEqual(charFrames([{ entryIndex: 0, path }]), frames);
  // One character per entry.
  equal(
    charFrames([{ entryIndex: 0, path }, { entryIndex: 1, path: straight(10, 50, 30, 50) }]).length,
    2,
  );
}

// --- graph-paper backdrop ----------------------------------------------

{
  deepEqual(gridPositions(0, 30, 10), [0, 10, 20, 30]);
  // The module is global: a range that starts mid-cell snaps to the grid.
  deepEqual(gridPositions(-15, 15, 10), [-10, 0, 10]);
  deepEqual(gridPositions(5, 5, 10), []);
  deepEqual(gridPositions(0, 10, 0), []);
  // A pathologically fine mesh is capped rather than freezing the render.
  equal(gridPositions(0, 100000, 0.01).length, 2000);
}

// --- canvas and wiping --------------------------------------------------

{
  deepEqual(canvasBox(200, 100, { a: 2, d: 2, e: 10, f: 20 }), { left: -5, top: -10, right: 95, bottom: 40 });
  deepEqual(canvasBox(200, 100, { a: 1, d: 1, e: 0, f: 0 }), { left: 0, top: 0, right: 200, bottom: 100 });
}

{
  const line = { axis: 'h' as const, at: 0 };
  const plain = { ...line, dir: 1 as const };
  const back = { ...line, dir: -1 as const };
  // Fully revealed and not wiped yet.
  deepEqual(visibleEnds(plain, 0, 10, 1, 0), { a: 0, b: 10 });
  // Wiping shrinks toward the line's low or high end.
  deepEqual(visibleEnds(plain, 0, 10, 1, 0.5), { a: 5, b: 10 });
  deepEqual(visibleEnds(back, 0, 10, 1, 0.5), { a: 0, b: 5 });
  equal(visibleEnds(plain, 0, 10, 1, 1), null);
  // Revealing grows from the end the wipe collapses to.
  deepEqual(visibleEnds(plain, 0, 10, 0.5, 0), { a: 5, b: 10 });
  deepEqual(visibleEnds(back, 0, 10, 0.5, 0), { a: 0, b: 5 });
  // A short character can reveal and wipe at the same time: only the overlap shows.
  deepEqual(visibleEnds(back, 0, 10, 0.2, 0.9), { a: 0, b: 1 });
}

// --- guide show / hide modes -------------------------------------------

{
  // start 1, end 3, last char ends at 5, each animation 1s.
  const at = (time: number, show: 'all' | 'char', hide: 'char' | 'all') => frameProgress(time, 1, 3, 5, show, hide, 1);
  deepEqual(at(0, 'all', 'char'), { reveal: 1, erase: 0 });
  deepEqual(at(0.5, 'char', 'char'), { reveal: 0, erase: 0 });
  deepEqual(at(1.5, 'char', 'char'), { reveal: 0.5, erase: 0 });
  deepEqual(at(2.5, 'char', 'char'), { reveal: 1, erase: 0 });
  equal(at(3.5, 'char', 'char').erase, 0.5);
  // Hiding all together waits for the last end.
  equal(at(2, 'all', 'all').erase, 0);
  equal(at(5.5, 'all', 'all').erase, 0.5);
  equal(at(6, 'all', 'all').erase, 1);
  equal(eraseProgress(0.5, 1, 0.5), 0);
  equal(eraseProgress(1.25, 1, 0.5), 0.5);
  equal(eraseProgress(2, 1, 0.5), 1);
}

// --- fill ---------------------------------------------------------------

{
  equal(fadeAlpha(0.5, 1, 0.5), 0);
  equal(fadeAlpha(1.25, 1, 0.5), 0.5);
  equal(fadeAlpha(2, 1, 0.5), 1);
  equal(fadeAlpha(2, 1, 0), 1);
}

// --- hollow outline -----------------------------------------------------

{
  const path = straight(10, 20, 30, 20);
  const hollow = hollowPath(path, 1);
  ok(hollow && hollow.dot === null);
  ok(hollow.points.length >= 4);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of hollow.points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  // The ends sit at the pen, so a butt-capped fill fits inside the contour.
  ok(Math.abs(minX - 10) < 0.001 && Math.abs(maxX - 30) < 0.001, 'ends at the stroke ends');
  ok(minY <= 15.001 && maxY >= 24.999, 'sides on the ink edges');

  const partial = hollowPath(path, 0.5);
  ok(partial && partial.dot === null);
  ok(partial.points.every((p) => p.x <= 20.001), 'a half-drawn stroke stops at the pen');

  const dot = hollowPath(new StrokePath([{ x: 1, y: 2, width: 8, t: 0 }]), 1);
  ok(dot?.dot);
  equal(dot.dot.r, 4);
  equal(hollowPath(path, 0), null);
}

console.log('engineering plugin: checks passed');
