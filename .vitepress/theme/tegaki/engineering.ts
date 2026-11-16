import {
  createPlugin,
  expandBox,
  inkEdge,
  lengthToPx,
  offsetPath,
  paintsDrawnOnly,
  type PlacedStroke,
  type StrokePath,
  type StrokeTime,
  type TegakiFrame,
  type TegakiLength,
  unionBoxes,
} from 'tegaki/core';

// Engineering-drawing handwriting: each stroke's box projected as full-length
// guides, a graph-paper grid under everything, strokes drawn as hollow
// outlines, each character filled in once written, then its guides wiped away.
// A character is one entryIndex.

/** A stroke as the timing helpers need it. */
export type TimedStroke = Pick<PlacedStroke, 'entryIndex' | 'start' | 'duration'>;

/** A stroke as the guide helpers need it. */
export type GridStroke = Pick<PlacedStroke, 'entryIndex' | 'path'>;

/** One projected guide: a stroke box's side, run across the whole canvas. */
export interface FrameLine {
  axis: 'h' | 'v';
  /** Its x (vertical line) or y (horizontal line). */
  at: number;
  /** The end it wipes toward: low (-1) or high (+1), from the line's ordinal parity. */
  dir: -1 | 1;
}

/** One character's projected guides, in the order they wipe. */
export interface CharFrames {
  entryIndex: number;
  lines: FrameLine[];
}

/** The outline of a drawn stroke: a closed polygon, or a dot for a one-point stroke. */
export interface Hollow {
  points: { x: number; y: number }[];
  dot: { x: number; y: number; r: number } | null;
}

/** The canvas in text-box px: how far it reaches past the text box on each side. */
export interface CanvasBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The strokes gathered into characters: consecutive strokes of the same `entryIndex`, in drawing order. */
export function strokeGroups<T extends { entryIndex: number }>(strokes: readonly T[]): T[][] {
  const out: T[][] = [];
  let group: T[] = [];
  let entry = -1;
  for (const stroke of strokes) {
    if (group.length > 0 && stroke.entryIndex !== entry) {
      out.push(group);
      group = [];
    }
    entry = stroke.entryIndex;
    group.push(stroke);
  }
  if (group.length > 0) out.push(group);
  return out;
}

/**
 * The strokes' times with each character's strokes overlapping by `overlap`,
 * and each character starting `charOverlap` of the previous character's span
 * before it would otherwise end (both 0–0.9). The gap between characters is
 * kept at 0; `0` for both leaves the times as they are.
 */
export function overlapTimes(strokes: readonly TimedStroke[], overlap: number, charOverlap = 0): StrokeTime[] {
  const times = strokes.map((s) => ({ start: s.start, duration: s.duration }));
  const within = Math.min(0.9, Math.max(0, overlap));
  const between = Math.min(0.9, Math.max(0, charOverlap));
  if (within <= 0 && between <= 0) return times;

  let previousStart = 0;
  let previousEnd = 0;
  let previousSpan = 0;
  let previousOriginalEnd = 0;
  let first = true;
  let i = 0;
  while (i < strokes.length) {
    const entry = strokes[i]!.entryIndex;
    let end = i;
    while (end < strokes.length && strokes[end]!.entryIndex === entry) end++;
    const group = strokes.slice(i, end);
    const originalStart = group[0]!.start;
    const originalEnd = group.reduce((m, s) => Math.max(m, s.start + s.duration), 0);

    let start = originalStart;
    if (first) {
      first = false;
    } else {
      const gap = originalStart - previousOriginalEnd;
      start = Math.max(previousStart, previousEnd + gap - between * previousSpan);
    }

    let span = 0;
    let previousLocal = 0;
    for (let k = 0; k < group.length; k++) {
      const stroke = group[k]!;
      let local = 0;
      if (k > 0) {
        const previous = group[k - 1]!;
        // Never start a stroke later than it was scheduled: a bundle that
        // already overlaps keeps its own timing.
        local = Math.min(previousLocal + previous.duration * (1 - within), stroke.start - originalStart);
      }
      previousLocal = local;
      times[i + k] = { start: start + local, duration: stroke.duration };
      span = Math.max(span, local + stroke.duration);
    }

    previousStart = start;
    previousSpan = span;
    previousEnd = start + span;
    previousOriginalEnd = originalEnd;
    i = end;
  }
  return times;
}

/**
 * The timeline's length once the strokes are at `times`: the writing's own
 * pause after its last stroke kept, and time left for the last character's
 * fill and wipe, which painting needs after the pen has finished.
 */
export function effectEnd(
  strokes: readonly TimedStroke[],
  times: readonly StrokeTime[],
  duration: number,
  fade: number,
  erase: number,
): number {
  if (strokes.length === 0) return duration;
  const before = strokes.reduce((m, s) => Math.max(m, s.start + s.duration), 0);
  const after = times.reduce((m, t) => Math.max(m, t.start + t.duration), 0);
  return Math.max(duration + after - before, after + Math.max(fade, erase));
}

/**
 * Each character's projected guides: the four sides of every stroke's ink box
 * at their exact position (the drawing itself extends each across the canvas).
 * Coincident sides of one character are merged, then sorted by axis and
 * position, and their ordinal parity picks the end each wipes toward — so the
 * directions are deterministic and need no seed.
 */
export function charFrames(strokes: readonly GridStroke[]): CharFrames[] {
  const out: CharFrames[] = [];
  for (const group of strokeGroups(strokes)) {
    const seen = new Map<string, FrameLine>();
    const add = (axis: 'h' | 'v', at: number) => {
      const key = `${axis}:${Math.round(at * 100)}`;
      if (!seen.has(key)) seen.set(key, { axis, at, dir: 1 });
    };
    for (const stroke of group) {
      const box = stroke.path.bounds();
      if (!box) continue;
      add('v', box.minX);
      add('v', box.maxX);
      add('h', box.minY);
      add('h', box.maxY);
    }
    const lines = [...seen.values()].sort((a, b) => (a.axis === b.axis ? a.at - b.at : a.axis === 'h' ? -1 : 1));
    let horizontal = 0;
    let vertical = 0;
    for (const line of lines) line.dir = (line.axis === 'h' ? horizontal++ : vertical++) % 2 === 0 ? -1 : 1;
    out.push({ entryIndex: group[0]!.entryIndex, lines });
  }
  return out;
}

/** The grid's lines between `from` and `to`, on the global multiples of `pitch`. */
export function gridPositions(from: number, to: number, pitch: number): number[] {
  if (!(pitch > 0) || !(to > from)) return [];
  const out: number[] = [];
  const first = Math.ceil(from / pitch);
  for (let k = first; k * pitch <= to; k++) {
    out.push(k * pitch);
    // shortcut: 2000 lines is already unreadable; a finer mesh is a mistake.
    if (out.length >= 2000) break;
  }
  return out;
}

/** The canvas in text-box px, from its device-px size and the context's scale/offset. */
export function canvasBox(
  width: number,
  height: number,
  transform: { a: number; d: number; e: number; f: number },
): CanvasBox {
  const a = transform.a || 1;
  const d = transform.d || 1;
  const clean = (value: number) => (value === 0 ? 0 : value);
  return {
    left: clean(-transform.e / a),
    top: clean(-transform.f / d),
    right: clean((width - transform.e) / a),
    bottom: clean((height - transform.f) / d),
  };
}

/** The visible stretch of a guide, revealed and wiped as far as `reveal` / `erase` (0–1) have played; `null` when nothing is left. */
export function visibleEnds(line: FrameLine, from: number, to: number, reveal: number, erase: number): { a: number; b: number } | null {
  const length = to - from;
  if (!(length > 0)) return null;
  const r = Math.min(1, Math.max(0, reveal));
  const w = Math.min(1, Math.max(0, erase));
  // A reveal grows the line from the end its wipe collapses to; the wipe then
  // shrinks it toward that same end, so the two animations are exact reverses.
  const [r0, r1] = line.dir < 0 ? [from, from + length * r] : [to - length * r, to];
  const [w0, w1] = line.dir < 0 ? [from, to - length * w] : [from + length * w, to];
  const a = Math.max(r0, w0);
  const b = Math.min(r1, w1);
  return b > a ? { a, b } : null;
}

/** How far a character's wipe has played (0–1) at `time`. */
export function eraseProgress(time: number, end: number, erase: number): number {
  if (time < end) return 0;
  if (!(erase > 0)) return 1;
  return Math.min(1, (time - end) / erase);
}

/** Whether the guides show all at once or with each character. */
export type FrameShowMode = 'all' | 'char';

/** Whether the guides hide all at once or with each character. */
export type FrameHideMode = 'char' | 'all';

/** How far a character's guides have revealed and wiped. */
export interface FrameProgress {
  reveal: number;
  erase: number;
}

/**
 * How far a character's guides have revealed and wiped at `time`: showing all
 * at once skips the reveal; hiding all at once waits for the text's last end.
 */
export function frameProgress(
  time: number,
  start: number,
  end: number,
  lastEnd: number,
  show: FrameShowMode,
  hide: FrameHideMode,
  erase: number,
): FrameProgress {
  return {
    reveal: show === 'all' ? 1 : eraseProgress(time, start, erase),
    erase: eraseProgress(time, hide === 'char' ? end : lastEnd, erase),
  };
}

/** How strong a character's fill is (0–1) at `time`, easing in over `fade` after `end`. */
export function fadeAlpha(time: number, end: number, fade: number): number {
  if (time < end) return 0;
  if (!(fade > 0)) return 1;
  const p = Math.min(1, (time - end) / fade);
  return p * p * (3 - 2 * p);
}

/**
 * The closed outline of the stroke's ink drawn so far: both edges of the
 * drawn stretch, ending flat at the pen (so a butt-capped bundle's fill sits
 * inside it). A one-point stroke is a dot.
 */
export function hollowPath(path: StrokePath, progress: number): Hollow | null {
  if (progress <= 0 || path.points.length === 0) return null;
  const head = path.pointAt(progress);
  const first = path.points[0]!;
  const dot = { x: head.x, y: head.y, r: Math.max(first.width, head.width, 0.5) / 2 };
  if (path.points.length === 1 || path.length <= 1e-6) return { points: [], dot };

  const slice = progress >= 1 ? path : path.slice(0, progress);
  const points = slice.points;
  if (points.length < 2) return { points: [], dot };

  const left = offsetPath(slice, inkEdge(0, 1));
  const right = offsetPath(slice, inkEdge(0, -1));
  if (left.points.length < 2 || right.points.length < 2) return { points: [], dot };
  return {
    points: [
      ...left.points.map((p) => ({ x: p.x, y: p.y })),
      ...right.points
        .slice()
        .reverse()
        .map((p) => ({ x: p.x, y: p.y })),
    ],
    dot: null,
  };
}

/** Add the hollow outline to a path, for stroking. `false` when there is nothing to add. */
function traceHollow(ctx: CanvasRenderingContext2D, hollow: Hollow): boolean {
  ctx.beginPath();
  if (hollow.dot) {
    ctx.arc(hollow.dot.x, hollow.dot.y, hollow.dot.r, 0, Math.PI * 2);
    return true;
  }
  const points = hollow.points;
  if (points.length < 2) return false;
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]!.x, points[i]!.y);
  ctx.closePath();
  return true;
}

/** A line's width in px at `fontSize`; 0 disables it. */
function lineWidth(length: TegakiLength, fontSize: number): number {
  const px = lengthToPx(length, fontSize);
  return px > 0 ? Math.max(0.6, px) : 0;
}

/** A beat of guides and grid alone before the pen starts, so it reads as a drawing before it is drawn. */
const LEAD = 0.25;

/** The plugin. */
export const engineeringPlugin = paintsDrawnOnly(
  createPlugin({
    name: 'engineering',
    label: 'Engineering drawing',
    description:
      'Blueprint style: full-canvas projection guides from every stroke box, graph paper under it, strokes drawn hollow, each character filled in once written, then its guides wiped away. underlay + paint + timing.',
    params: {
      mesh: {
        type: 'length',
        label: 'Grid mesh',
        description: 'Spacing of the graph-paper backdrop; 0 hides it.',
        default: 0.125,
        unit: 'em',
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      gridColor: { type: 'color', label: 'Grid color', default: '#64748b' },
      gridWidth: {
        type: 'length',
        label: 'Grid width',
        description: 'Thickness of the backdrop grid; 0 hides it.',
        default: 0.005,
        unit: 'em',
        min: 0,
        max: 0.2,
        step: 0.002,
      },
      gridOpacity: {
        type: 'number',
        label: 'Grid opacity',
        description: '0 hides the backdrop grid.',
        default: 0.16,
        min: 0,
        max: 1,
        step: 0.02,
      },
      frameColor: { type: 'color', label: 'Guide color', default: '#38bdf8' },
      frameWidth: {
        type: 'length',
        label: 'Guide width',
        description: 'Thickness of the projected stroke-box guides; 0 hides them.',
        default: 0.008,
        unit: 'em',
        min: 0,
        max: 0.2,
        step: 0.002,
      },
      frameOpacity: {
        type: 'number',
        label: 'Guide opacity',
        description: '0 hides the projected guides.',
        default: 0.25,
        min: 0,
        max: 1,
        step: 0.02,
      },
      frameShow: {
        type: 'select',
        label: 'Guide show',
        description: 'All at once, or each character at its start (the reverse of its wipe).',
        default: 'all',
        options: [
          { value: 'all', label: 'Together' },
          { value: 'char', label: 'Per character' },
        ],
      },
      frameHide: {
        type: 'select',
        label: 'Guide hide',
        description: "Each character at its end, or all together once the text's last character is written.",
        default: 'char',
        options: [
          { value: 'char', label: 'Per character' },
          { value: 'all', label: 'Together' },
        ],
      },
      outlineColor: { type: 'color', label: 'Outline color', default: '#e2e8f0' },
      outlineWidth: {
        type: 'length',
        label: 'Outline width',
        description: "Thickness of a stroke's own trajectory; 0 hides it.",
        default: 0.012,
        unit: 'em',
        min: 0,
        max: 0.2,
        step: 0.002,
      },
      outlineOpacity: {
        type: 'number',
        label: 'Outline opacity',
        description: '0 hides the stroke outlines.',
        default: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
      },
      fade: {
        type: 'number',
        label: 'Fill fade',
        description: 'Seconds the fill takes to come in once a character is written.',
        default: 0.45,
        min: 0,
        max: 3,
        step: 0.05,
      },
      erase: {
        type: 'number',
        label: 'Guide erase',
        description: "Seconds a character's guides take to wipe away.",
        default: 0.45,
        min: 0,
        max: 3,
        step: 0.05,
      },
      overlap: {
        type: 'number',
        label: 'Stroke overlap',
        description: 'Share of a stroke the next one starts before it ends; 0 for none.',
        default: 0,
        min: 0,
        max: 0.9,
        step: 0.05,
      },
      charOverlap: {
        type: 'number',
        label: 'Character overlap',
        description: "Share of the previous character's drawing span the next one starts before it ends; 0 for none.",
        default: 0,
        min: 0,
        max: 0.9,
        step: 0.05,
      },
    },
    setup: ({
      mesh,
      gridColor,
      gridWidth,
      gridOpacity,
      frameColor,
      frameWidth,
      frameOpacity,
      frameShow,
      frameHide,
      outlineColor,
      outlineWidth,
      outlineOpacity,
      fade,
      erase,
      overlap,
      charOverlap,
    }) => {
      let framesCache: { first: StrokePath | undefined; count: number; frames: CharFrames[] } | null = null;
      const framesOf = (strokes: readonly PlacedStroke[]): CharFrames[] => {
        const first = strokes[0]?.path;
        if (!framesCache || framesCache.first !== first || framesCache.count !== strokes.length) {
          framesCache = { first, count: strokes.length, frames: charFrames(strokes) };
        }
        return framesCache.frames;
      };

      // A frame is drawn over and over at one time; its characters' spans are
      // read once per frame, not once per stroke.
      const timesByFrame = new WeakMap<
        TegakiFrame,
        { chars: Map<number, { start: number; end: number }>; lastEnd: number }
      >();
      const timesOf = (frame: TegakiFrame) => {
        let times = timesByFrame.get(frame);
        if (!times) {
          const chars = new Map<number, { start: number; end: number }>();
          let lastEnd = 0;
          for (const stroke of frame.strokes) {
            const end = stroke.start + stroke.duration;
            const time = chars.get(stroke.entryIndex);
            if (time) {
              time.start = Math.min(time.start, stroke.start);
              time.end = Math.max(time.end, end);
            } else {
              chars.set(stroke.entryIndex, { start: stroke.start, end });
            }
            lastEnd = Math.max(lastEnd, end);
          }
          times = { chars, lastEnd };
          timesByFrame.set(frame, times);
        }
        return times;
      };

      const outlines = new WeakMap<StrokePath, Hollow | null>();
      const hollowOf = (path: StrokePath, progress: number): Hollow | null => {
        if (progress < 1) return hollowPath(path, progress);
        if (!outlines.has(path)) outlines.set(path, hollowPath(path, 1));
        return outlines.get(path) ?? null;
      };

      return {
        bounds: ({ strokes, fontSize }) =>
          expandBox(
            unionBoxes(strokes.map((s) => s.path.bounds())),
            Math.max(1, fontSize * 0.02) + lineWidth(outlineWidth, fontSize),
          ),

        timing: ({ strokes, duration }) => {
          if (strokes.length === 0) return { strokes, duration };
          // Every stroke opens a beat late: the whole text's guides show first.
          const times = overlapTimes(strokes, overlap, charOverlap).map((t) => ({ start: t.start + LEAD, duration: t.duration }));
          return { strokes: times, duration: effectEnd(strokes, times, duration, fade, erase) };
        },

        underlay: ({ ctx, frame, fontSize }) => {
          const pitch = lengthToPx(mesh, fontSize);
          const gridLine = lineWidth(gridWidth, fontSize);
          const guideLine = lineWidth(frameWidth, fontSize);
          const gridOn = pitch > 0 && gridOpacity > 0 && gridLine > 0;
          const guidesOn = frameOpacity > 0 && guideLine > 0;
          if (!gridOn && !guidesOn) return;

          const box = canvasBox(ctx.canvas.width, ctx.canvas.height, ctx.getTransform());

          if (gridOn) {
            const xs = gridPositions(box.left, box.right, pitch);
            const ys = gridPositions(box.top, box.bottom, pitch);
            if (xs.length > 0 || ys.length > 0) {
              ctx.save();
              ctx.strokeStyle = gridColor;
              ctx.lineWidth = gridLine;
              ctx.lineCap = 'butt';
              ctx.globalAlpha *= gridOpacity;
              ctx.beginPath();
              for (const x of xs) {
                ctx.moveTo(x, box.top);
                ctx.lineTo(x, box.bottom);
              }
              for (const y of ys) {
                ctx.moveTo(box.left, y);
                ctx.lineTo(box.right, y);
              }
              ctx.stroke();
              ctx.restore();
            }
          }

          if (!guidesOn) return;
          const times = timesOf(frame);
          ctx.save();
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = guideLine;
          ctx.lineCap = 'butt';
          ctx.globalAlpha *= frameOpacity;
          ctx.beginPath();
          let drawn = false;
          for (const character of framesOf(frame.strokes)) {
            const span = times.chars.get(character.entryIndex);
            if (!span) continue;
            const shown = frameProgress(frame.time, span.start, span.end, times.lastEnd, frameShow, frameHide, erase);
            if (shown.reveal <= 0 || shown.erase >= 1) continue;
            for (const line of character.lines) {
              const low = line.axis === 'v' ? box.top : box.left;
              const high = line.axis === 'v' ? box.bottom : box.right;
              const stretch = visibleEnds(line, low, high, shown.reveal, shown.erase);
              if (!stretch) continue;
              drawn = true;
              if (line.axis === 'v') {
                ctx.moveTo(line.at, stretch.a);
                ctx.lineTo(line.at, stretch.b);
              } else {
                ctx.moveTo(stretch.a, line.at);
                ctx.lineTo(stretch.b, line.at);
              }
            }
          }
          if (drawn) ctx.stroke();
          ctx.restore();
        },

        paint(stroke, next) {
          const own = stroke.stroke;
          if (own.state === 'pending' || own.progress <= 0) return;
          const outlineLine = lineWidth(outlineWidth, stroke.fontSize);
          const outlineOn = outlineOpacity > 0 && outlineLine > 0;
          const end = timesOf(stroke.frame).chars.get(own.entryIndex)?.end;
          const alpha = end === undefined ? 1 : fadeAlpha(stroke.frame.time, end, fade);
          // Hollow until the character is written: the fill goes in after it.
          if (alpha > 0) {
            stroke.ctx.save();
            stroke.ctx.globalAlpha *= alpha;
            next(stroke);
            stroke.ctx.restore();
          }
          if (!outlineOn) return;
          const hollow = hollowOf(own.path, own.progress);
          if (!hollow) return;
          stroke.ctx.save();
          stroke.ctx.globalAlpha *= outlineOpacity;
          stroke.ctx.strokeStyle = outlineColor;
          stroke.ctx.lineWidth = outlineLine;
          stroke.ctx.lineJoin = 'round';
          stroke.ctx.lineCap = 'round';
          // shortcut: nib stamps aren't outlined (rare fonts); only path ink is.
          if (traceHollow(stroke.ctx, hollow)) stroke.ctx.stroke();
          stroke.ctx.restore();
        },
      };
    },
  }),
);
