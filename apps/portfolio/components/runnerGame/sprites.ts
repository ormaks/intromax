/*
 * Pixel art as rows of `#` (filled) and `.` (empty). Every row in a sprite has
 * the same length; one character is one `CELL` of world units.
 */

export type Bitmap = readonly string[];

/** World units per bitmap pixel. */
export const CELL = 2;

const DINO_BODY: Bitmap = [
  "...........#######..",
  "..........##.######.",
  "..........#########.",
  "..........#########.",
  "..........####......",
  "..........#######...",
  "#........#####......",
  "#.......######......",
  "##.....########.....",
  "###...######.##.....",
  "############.#......",
  ".##########.........",
  "..#########.........",
  "...#######..........",
  "....#####...........",
];

/* A wider eye, for the frame after a crash. */
const DINO_BODY_DEAD: Bitmap = [
  "...........#######..",
  "..........#..######.",
  "..........#..######.",
  ...DINO_BODY.slice(3),
];

const LEGS_STAND: Bitmap = [
  "....##..##..........",
  "....#....#..........",
  "....#....#..........",
  "....##...##.........",
];

const LEGS_RUN_A: Bitmap = [
  "....##..##..........",
  "....#....##.........",
  "....#...............",
  "....##..............",
];

const LEGS_RUN_B: Bitmap = [
  "....##..##..........",
  "...##....#..........",
  ".........#..........",
  ".........##.........",
];

export const DINO = {
  run: [
    [...DINO_BODY, ...LEGS_RUN_A],
    [...DINO_BODY, ...LEGS_RUN_B],
  ],
  jump: [...DINO_BODY, ...LEGS_STAND],
  dead: [...DINO_BODY_DEAD, ...LEGS_STAND],
} satisfies Record<string, Bitmap | Bitmap[]>;

export const BUG: Bitmap = [
  "..#.....#..",
  "...#...#...",
  "..#######..",
  "#.#.###.#.#",
  ".#########.",
  "#.#######.#",
  "..#######..",
  ".#..###..#.",
];

export function bitmapSize(bitmap: Bitmap) {
  return { w: bitmap[0]!.length * CELL, h: bitmap.length * CELL };
}

export function drawBitmap(
  context: CanvasRenderingContext2D,
  bitmap: Bitmap,
  x: number,
  y: number,
) {
  bitmap.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === "#") {
        context.fillRect(x + i * CELL, y + j * CELL, CELL, CELL);
      }
    }
  });
}
