import gsap from "gsap";
import {
  distanceSq,
  fromRotationVector,
  fromTo,
  multiply,
  normalize,
  normalizeQuat,
  rotate,
  slerp,
  type Quat,
  type Vec3,
} from "./geometry";
import type { CategoryId, Skill } from "./skills";

/* Each skill links to this many of its nearest neighbours. */
const LINKS_PER_SKILL = 4;
/* Spin speeds in radians per frame at 60fps. */
const SLOW_SPIN = 0.0035;
const STEER_SPIN = 0.025;
/* While anything is highlighted, the spin drops to this share. */
const HIGHLIGHT_SLOWDOWN = 0.15;
/* Per-frame easing toward targets (0-1, at 60fps). */
const SPIN_EASE = 0.06;
/* Stopping under a hovered word is quicker, so the word stays put. */
const FREEZE_EASE = 0.25;
/*
 * Highlights fade in and out at this per-frame rate: about 0.9s to settle,
 * so the dimming, brightening and growing run alongside the turn to face a
 * focused skill rather than snapping ahead of it.
 */
const HIGHLIGHT_EASE = 0.055;
/* How far unlit words and links dim while something is highlighted. */
const DIM_WORDS = 0.7;
const DIM_LINKS = 0.65;
/* Turning to face a focused skill: a timed ease in and out. */
const FOCUS_SECONDS = 1.2;
const focusEase = gsap.parseEase("power2.inOut");
/* Viewer distance in sphere radii; smaller means stronger perspective. */
const PERSPECTIVE = 2.6;
/* The sphere's radius as a share of the box's shorter side. */
const RADIUS_SHARE = 0.38;
const LIT_SCALE = 1.3;
/** Words behind this depth (0 back, 1 front) ignore the pointer. */
const REACHABLE_DEPTH = 0.5;
/* A pulse's trip along one link, and the gap before the next hop sets off. */
const PULSE_SECONDS = 0.45;
const HOP_DELAY_SECONDS = 0.3;

/** Which links light up with a highlight. */
export type LinkMode = "none" | "touching" | "within";

export type Sphere = {
  /** Pointer offset from the sphere centre, each axis -1 to 1. */
  steer(dx: number, dy: number): void;
  /** Back to the slow spin, carrying on in the last direction. */
  clearSteer(): void;
  highlight(indices: number[], links: LinkMode): void;
  clearHighlight(): void;
  /** Stops the spin (quickly, not abruptly) while true; resumes when false. */
  freeze(frozen: boolean): void;
  /** Turns the sphere until these skills' centre faces the viewer. */
  focus(indices: number[]): void;
  /** Ends a focus; the slow spin resumes from where the sphere is. */
  release(): void;
  /**
   * Sends light pulses out along the links from these skills, `hops` links
   * deep. With `within`, pulses only travel between those skills.
   */
  pulse(
    origins: number[],
    options?: { within?: number[]; hops?: number },
  ): void;
  /**
   * Pulses through a whole group, starting from its most central skill and
   * staying inside the group until every reachable skill is lit.
   */
  pulseGroup(indices: number[]): void;
  resize(): void;
  destroy(): void;
};

type Node = {
  index: number;
  /** Position on the unit sphere before rotation. */
  base: Vec3;
  element: HTMLElement;
  /** Projected screen position and depth (0 back, 1 front) this frame. */
  x: number;
  y: number;
  depth: number;
  /** How lit this word is (0-1), easing toward its target. */
  lit: number;
  /** How lit it is as a neighbour of a lit word (0-1), easing likewise. */
  near: number;
  /** How dimmed it is (0-1): only words that aren't lit or near dim. */
  dim: number;
  /** A brief brightening when a pulse arrives, fading to 0. */
  flash: number;
  /** On the far side: hover and clicks pass through it. */
  hidden: boolean;
};

type Edge = {
  a: Node;
  b: Node;
  /** How lit this link is (0-1), easing toward its target. */
  lit: number;
};

type Pulse = { from: Node; to: Node; start: number };

/** Evenly spread points on the unit sphere (a Fibonacci lattice). */
function spread(count: number): Vec3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(i * golden) * r, y, z: Math.sin(i * golden) * r };
  });
}

/*
 * Category centres at the corners of a regular tetrahedron: four directions
 * as far apart from each other as four points on a sphere can be.
 */
const CENTRES: Vec3[] = [
  normalize({ x: 1, y: 1, z: 1 }),
  normalize({ x: 1, y: -1, z: -1 }),
  normalize({ x: -1, y: 1, z: -1 }),
  normalize({ x: -1, y: -1, z: 1 }),
];

/* Upper bound on the swap pass in `layout`; it settles in a few rounds. */
const MAX_SWAP_ROUNDS = 50;

/** The direction of a set of points' average (unit length). */
function centroid(points: Vec3[]): Vec3 {
  return normalize(
    points.reduce(
      (sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y, z: sum.z + p.z }),
      { x: 0, y: 0, z: 0 },
    ),
  );
}

/**
 * Places each skill on the sphere so every category forms one contiguous
 * region, and links each skill to its nearest neighbours.
 */
export function layout(skills: Skill[], categories: CategoryId[]) {
  const points = spread(skills.length);
  const capacity = categories.map(
    (id) => skills.filter((skill) => skill.category === id).length,
  );

  // Greedy: the closest point-to-centre pairs claim first, until each
  // category has as many points as it has skills.
  const pairs = points.flatMap((point, p) =>
    CENTRES.slice(0, categories.length).map((centre, c) => ({
      p,
      c,
      d: distanceSq(point, centre),
    })),
  );
  pairs.sort((x, y) => x.d - y.d);
  const owner = new Map<number, number>();
  for (const { p, c } of pairs) {
    const left = capacity[c] ?? 0;
    if (owner.has(p) || left === 0) continue;
    owner.set(p, c);
    capacity[c] = left - 1;
  }

  // The greedy pass can strand a category's last points on the far side.
  // Swap points between categories while that pulls each one tighter around
  // its own centre, until no swap helps.
  for (let round = 0; round < MAX_SWAP_ROUNDS; round++) {
    const centres = categories.map((_, c) =>
      centroid(points.filter((_, p) => owner.get(p) === c)),
    );
    let swapped = false;
    points.forEach((p1, i) => {
      points.forEach((p2, j) => {
        const a = owner.get(i);
        const b = owner.get(j);
        if (j <= i || a === undefined || b === undefined || a === b) return;
        const ca = centres[a];
        const cb = centres[b];
        if (!ca || !cb) return;
        const now = distanceSq(p1, ca) + distanceSq(p2, cb);
        const after = distanceSq(p1, cb) + distanceSq(p2, ca);
        if (after < now - 1e-9) {
          owner.set(i, b);
          owner.set(j, a);
          swapped = true;
        }
      });
    });
    if (!swapped) break;
  }

  const placed = new Map<number, Vec3>();
  categories.forEach((id, c) => {
    const slots = points.filter((_, p) => owner.get(p) === c);
    skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ skill }) => skill.category === id)
      .forEach(({ index }, k) => {
        const slot = slots[k];
        if (slot) placed.set(index, slot);
      });
  });
  const positions = skills.map(
    (_, index) => placed.get(index) ?? { x: 0, y: 0, z: 1 },
  );

  const seen = new Set<string>();
  const links: [number, number][] = [];
  positions.forEach((position, i) => {
    positions
      .map((other, j) => ({ j, d: distanceSq(position, other) }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, LINKS_PER_SKILL)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push([i, j]);
      });
  });

  return { positions, links };
}

/** Per-frame easing factor, corrected for frame rate. */
function ease(rate: number, frames: number): number {
  return 1 - (1 - rate) ** frames;
}

/**
 * The skills sphere's motion and drawing. Words are positioned with CSS
 * transforms; links and pulses are drawn on the canvas behind them.
 */
export function createSphere(
  skills: Skill[],
  categories: CategoryId[],
  elements: {
    box: HTMLElement;
    canvas: HTMLCanvasElement;
    words: HTMLElement[];
  },
): Sphere {
  const { positions, links } = layout(skills, categories);
  const { box, canvas, words } = elements;
  const context = canvas.getContext("2d");
  const accent =
    getComputedStyle(box).getPropertyValue("--color-accent").trim() ||
    "#08fdd8";

  const nodes: Node[] = positions.flatMap((base, index) => {
    const element = words[index];
    return element
      ? [
          {
            index,
            base,
            element,
            x: 0,
            y: 0,
            depth: 0,
            lit: 0,
            near: 0,
            dim: 0,
            flash: 0,
            hidden: false,
          },
        ]
      : [];
  });
  const byIndex = new Map(nodes.map((node) => [node.index, node]));
  const edges: Edge[] = links.flatMap(([a, b]) => {
    const from = byIndex.get(a);
    const to = byIndex.get(b);
    return from && to ? [{ a: from, b: to, lit: 0 }] : [];
  });

  let frozen = false;
  /* How dimmed the unlit links are (0-1), easing likewise. */
  let dim = 0;
  let orientation: Quat = fromRotationVector({ x: 0.35, y: 0, z: 0 });
  let spin: Vec3 = { x: 0, y: SLOW_SPIN, z: 0 };
  let spinTarget: Vec3 = { ...spin };
  /* The pointer-driven spin while the pointer is over the column. */
  let steering: Vec3 | null = null;
  let lastDirection: Vec3 = { x: 0, y: 1, z: 0 };
  let focusTurn: { from: Quat; to: Quat; start: number } | null = null;
  let lit = new Set<Node>();
  let litEdges = new Set<Edge>();
  let litNeighbours = new Set<Node>();
  let pulses: Pulse[] = [];
  let width = 0;
  let height = 0;
  let radius = 0;

  const nodesFor = (indices: number[]) =>
    indices.flatMap((i) => {
      const node = byIndex.get(i);
      return node ? [node] : [];
    });

  const neighboursOf = (node: Node) =>
    edges.flatMap((edge) =>
      edge.a === node ? [edge.b] : edge.b === node ? [edge.a] : [],
    );

  const slowSpin = (): Vec3 => ({
    x: lastDirection.x * SLOW_SPIN,
    y: lastDirection.y * SLOW_SPIN,
    z: lastDirection.z * SLOW_SPIN,
  });

  const resize = () => {
    width = box.clientWidth;
    height = box.clientHeight;
    radius = Math.min(width, height) * RADIUS_SHARE;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const turn = (frames: number, time: number) => {
    if (focusTurn) {
      const progress = Math.min(1, (time - focusTurn.start) / FOCUS_SECONDS);
      orientation = slerp(focusTurn.from, focusTurn.to, focusEase(progress));
      return;
    }
    const slowdown = frozen ? 0 : lit.size > 0 ? HIGHLIGHT_SLOWDOWN : 1;
    const k = ease(frozen ? FREEZE_EASE : SPIN_EASE, frames);
    spin = {
      x: spin.x + (spinTarget.x * slowdown - spin.x) * k,
      y: spin.y + (spinTarget.y * slowdown - spin.y) * k,
      z: spin.z + (spinTarget.z * slowdown - spin.z) * k,
    };
    orientation = normalizeQuat(
      multiply(
        fromRotationVector({
          x: spin.x * frames,
          y: spin.y * frames,
          z: spin.z * frames,
        }),
        orientation,
      ),
    );
  };

  const placeWords = (frames: number) => {
    const k = ease(HIGHLIGHT_EASE, frames);
    dim += ((lit.size > 0 ? 1 : 0) - dim) * k;
    for (const node of nodes) {
      const p = rotate(orientation, node.base);
      const s = PERSPECTIVE / (PERSPECTIVE - p.z);
      node.x = width / 2 + p.x * radius * s;
      node.y = height / 2 + p.y * radius * s;
      node.depth = (p.z + 1) / 2;

      const isLit = lit.has(node);
      const isNear = litNeighbours.has(node);
      node.lit += ((isLit ? 1 : 0) - node.lit) * k;
      node.near += ((isNear ? 1 : 0) - node.near) * k;
      const dims = lit.size > 0 && !isLit && !isNear;
      node.dim += ((dims ? 1 : 0) - node.dim) * k;
      node.flash = Math.max(0, node.flash - 0.03 * frames);

      const dimmed = (0.2 + node.depth * 0.8) * (1 - DIM_WORDS * node.dim);
      const opacity = Math.min(
        1,
        Math.max(
          dimmed + (1 - dimmed) * node.lit,
          dimmed + (0.75 - dimmed) * node.near,
        ) + node.flash,
      );
      const scale =
        (0.7 + node.depth * 0.5) * (1 + (LIT_SCALE - 1) * node.lit) +
        node.flash * 0.2;

      const { style } = node.element;
      style.transform = `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      style.opacity = opacity.toFixed(3);
      style.zIndex = String(Math.round(node.depth * 100));

      // Only words on the near side can be hovered or clicked; the pointer
      // passes through the far side to the sphere column behind it.
      const hidden = node.depth < REACHABLE_DEPTH;
      if (hidden !== node.hidden) {
        node.hidden = hidden;
        style.pointerEvents = hidden ? "none" : "";
      }
    }
  };

  const drawLinks = (ctx: CanvasRenderingContext2D, frames: number) => {
    const k = ease(HIGHLIGHT_EASE, frames);
    ctx.strokeStyle = accent;
    for (const edge of edges) {
      edge.lit += ((litEdges.has(edge) ? 1 : 0) - edge.lit) * k;
      const depth = (edge.a.depth + edge.b.depth) / 2;
      const dimmed = (0.05 + depth * 0.2) * (1 - DIM_LINKS * dim);
      // Lit links sit between the resting links and the lit words, so the
      // words stay the brightest thing and read clearly over them.
      const litAlpha = 0.3 + depth * 0.25;
      ctx.globalAlpha = dimmed + (litAlpha - dimmed) * edge.lit;
      ctx.lineWidth = 0.75 + 0.25 * edge.lit;
      ctx.beginPath();
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.lineTo(edge.b.x, edge.b.y);
      ctx.stroke();
    }
  };

  const drawPulses = (ctx: CanvasRenderingContext2D, time: number) => {
    if (pulses.length === 0) return;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 1;
    pulses = pulses.filter(({ from, to, start }) => {
      const progress = (time - start) / PULSE_SECONDS;
      if (progress < 0) return true;
      if (progress >= 1) {
        to.flash = 1;
        return false;
      }
      ctx.beginPath();
      ctx.arc(
        from.x + (to.x - from.x) * progress,
        from.y + (to.y - from.y) * progress,
        2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      return true;
    });
  };

  const tick = (time: number) => {
    const frames = gsap.ticker.deltaRatio(60);
    turn(frames, time);
    placeWords(frames);
    if (!context) return;
    context.clearRect(0, 0, width, height);
    drawLinks(context, frames);
    drawPulses(context, time);
    context.globalAlpha = 1;
  };

  /**
   * Pulses spreading out from `origins` along the links, one hop at a time,
   * never revisiting a skill. With `allowed`, they stay inside that set.
   */
  const sendPulses = (
    origins: Node[],
    allowed: Set<Node> | null,
    hops: number,
  ) => {
    const now = gsap.ticker.time;
    let frontier = origins;
    const visited = new Set(frontier);
    frontier.forEach((node) => (node.flash = 1));
    for (let hop = 0; hop < hops && frontier.length > 0; hop++) {
      const next: Node[] = [];
      for (const from of frontier) {
        for (const to of neighboursOf(from)) {
          if (visited.has(to) || (allowed && !allowed.has(to))) continue;
          visited.add(to);
          next.push(to);
          pulses.push({
            from,
            to,
            start: now + hop * HOP_DELAY_SECONDS + Math.random() * 0.08,
          });
        }
      }
      frontier = next;
    }
  };

  resize();
  gsap.ticker.add(tick);

  return {
    steer(dx, dy) {
      steering = { x: -dy * STEER_SPIN, y: dx * STEER_SPIN, z: 0 };
      spinTarget = steering;
      if (Math.hypot(dx, dy) > 0.05) lastDirection = normalize(steering);
    },

    clearSteer() {
      steering = null;
      spinTarget = slowSpin();
    },

    highlight(indices, mode) {
      lit = new Set(nodesFor(indices));
      litEdges = new Set(
        edges.filter(({ a, b }) =>
          mode === "touching"
            ? lit.has(a) || lit.has(b)
            : mode === "within" && lit.has(a) && lit.has(b),
        ),
      );
      litNeighbours = new Set(
        [...litEdges]
          .flatMap(({ a, b }) => [a, b])
          .filter((node) => !lit.has(node)),
      );
    },

    freeze(next) {
      frozen = next;
    },

    clearHighlight() {
      lit = new Set();
      litEdges = new Set();
      litNeighbours = new Set();
    },

    focus(indices) {
      const group = nodesFor(indices);
      if (group.length === 0) return;
      const centre = centroid(group.map(({ base }) => base));
      const facing = rotate(orientation, centre);
      focusTurn = {
        from: orientation,
        to: normalizeQuat(
          multiply(fromTo(facing, { x: 0, y: 0, z: 1 }), orientation),
        ),
        start: gsap.ticker.time,
      };
    },

    release() {
      focusTurn = null;
      spin = { x: 0, y: 0, z: 0 };
      spinTarget = steering ?? slowSpin();
    },

    pulse(origins, { within, hops = 2 } = {}) {
      sendPulses(
        nodesFor(origins),
        within ? new Set(nodesFor(within)) : null,
        hops,
      );
    },

    pulseGroup(indices) {
      const group = nodesFor(indices);
      const centre = centroid(group.map(({ base }) => base));
      const origin = group.reduce<Node | null>(
        (best, node) =>
          !best || distanceSq(node.base, centre) < distanceSq(best.base, centre)
            ? node
            : best,
        null,
      );
      if (origin) sendPulses([origin], new Set(group), group.length);
    },

    resize,

    destroy() {
      gsap.ticker.remove(tick);
    },
  };
}
