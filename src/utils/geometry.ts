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

export function getSvgPoint(evt: { clientX: number; clientY: number; currentTarget?: any; target?: any }): Point | null {
  const current = (evt as any).currentTarget as EventTarget & { ownerSVGElement?: SVGSVGElement | null };
  const svg = (current as SVGSVGElement) instanceof SVGSVGElement
    ? (current as SVGSVGElement)
    : (current as any)?.ownerSVGElement || null;
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = (evt as any).clientX;
  pt.y = (evt as any).clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}


