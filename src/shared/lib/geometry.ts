import type { Line, Point } from "../types";

export function lineToABC(line: Line): { A: number; B: number; C: number } {
  const { p1, p2 } = line;
  const A = p2.y - p1.y;
  const B = -(p2.x - p1.x);
  const C = -A * p1.x - B * p1.y;
  return { A, B, C };
}

export function distancePointToPoint(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function getSvgPoint(evt: {
  clientX: number;
  clientY: number;
  currentTarget?: EventTarget | null;
}): Point | null {
  const current = evt.currentTarget as
    | (EventTarget & { ownerSVGElement?: SVGSVGElement | null })
    | null;
  const maybeSvg = current as unknown as
    | SVGGraphicsElement
    | SVGSVGElement
    | null;
  const svg: SVGSVGElement | null =
    maybeSvg instanceof SVGSVGElement
      ? maybeSvg
      : ((maybeSvg as SVGGraphicsElement | null)?.ownerSVGElement ?? null);
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}

export function isPointInRect(p: Point, a: Point, b: Point): boolean {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function segmentsIntersect(p: Point, p2: Point, q: Point, q2: Point): boolean {
  // Based on orientation tests
  const o = (a: Point, b: Point, c: Point) =>
    Math.sign((b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y));
  const onSeg = (a: Point, b: Point, c: Point) =>
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y);
  const o1 = o(p, p2, q);
  const o2 = o(p, p2, q2);
  const o3 = o(q, q2, p);
  const o4 = o(q, q2, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(p, p2, q)) return true;
  if (o2 === 0 && onSeg(p, p2, q2)) return true;
  if (o3 === 0 && onSeg(q, q2, p)) return true;
  if (o4 === 0 && onSeg(q, q2, p2)) return true;
  return false;
}

export function doesLineIntersectRect(line: Line, a: Point, b: Point): boolean {
  // If either endpoint is inside the rectangle
  if (isPointInRect(line.p1, a, b) || isPointInRect(line.p2, a, b)) return true;
  // Rectangle corners
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const r1: Point = { x: minX, y: minY };
  const r2: Point = { x: maxX, y: minY };
  const r3: Point = { x: maxX, y: maxY };
  const r4: Point = { x: minX, y: maxY };
  // Check against the four rectangle edges
  if (segmentsIntersect(line.p1, line.p2, r1, r2)) return true;
  if (segmentsIntersect(line.p1, line.p2, r2, r3)) return true;
  if (segmentsIntersect(line.p1, line.p2, r3, r4)) return true;
  if (segmentsIntersect(line.p1, line.p2, r4, r1)) return true;
  return false;
}
