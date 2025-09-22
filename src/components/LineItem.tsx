import React, { useCallback } from "react";
import type { Line } from "../types";
import { useStore } from "../store/useStore";
import { distancePointToPoint, getSvgPoint } from "../utils/geometry";

interface Props extends React.SVGProps<SVGLineElement> {
  line: Line;
}

export function LineItem({ line, stroke = "#61dafb", strokeWidth = 2, ...rest }: Props) {
  const { mode, deleteLine, setHoverLine, setHoverPoint, hoverLineId, toggleSelectLine, beginDragFromLine, updateDrag, endDrag } = useStore();
  const handleClick = useCallback((e: React.MouseEvent<SVGLineElement>) => {
    if (mode !== "delete") return;
    e.stopPropagation();
    deleteLine(line.id);
  }, [deleteLine, line.id, mode]);

  const handleEnter = useCallback(() => {
    if (mode === "focus") setHoverLine(line.id);
  }, [line.id, mode, setHoverLine]);
  const handleLeave = useCallback(() => {
    if (mode === "focus") setHoverLine(null);
    setHoverPoint(null);
  }, [mode, setHoverLine, setHoverPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGLineElement>) => {
    if (mode !== "focus") return;
    const loc = getSvgPoint(e);
    if (!loc) return;
    // show endpoint coordinates if near endpoints
    const p1 = line.p1;
    const p2 = line.p2;
    const nearThreshold = 8; // in canvas units
    const d1 = distancePointToPoint(loc, p1);
    const d2 = distancePointToPoint(loc, p2);
    if (d1 <= nearThreshold) setHoverPoint(p1);
    else if (d2 <= nearThreshold) setHoverPoint(p2);
    else setHoverPoint(null);
  }, [line.p1, line.p2, mode, setHoverPoint]);

  const isHovered = hoverLineId === line.id && mode === "focus";
  const visualStroke = isHovered ? "#ffd166" : stroke;
  const visualWidth = isHovered ? (typeof strokeWidth === "number" ? strokeWidth + 1.5 : strokeWidth) : strokeWidth;

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGLineElement>) => {
    if (mode === "edit") {
      const loc = getSvgPoint(e);
      if (!loc) return;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      beginDragFromLine(line.id, { x: loc.x, y: loc.y });
    }
  }, [beginDragFromLine, line.id, mode]);

  const handlePointerMoveDrag = useCallback((e: React.PointerEvent<SVGLineElement>) => {
    if (mode !== "edit") return;
    const loc = getSvgPoint(e);
    if (!loc) return;
    updateDrag({ x: loc.x, y: loc.y });
  }, [mode, updateDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGLineElement>) => {
    if (mode === "edit") {
      endDrag();
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    }
  }, [endDrag, mode]);

  const handleSelect = useCallback((e: React.MouseEvent<SVGLineElement>) => {
    if (mode !== "edit") return;
    // Shift+click toggles selection, click without Shift selects single
    const additive = e.shiftKey;
    toggleSelectLine(line.id, additive);
  }, [line.id, mode, toggleSelectLine]);

  return (
    <line
      x1={line.p1.x}
      y1={line.p1.y}
      x2={line.p2.x}
      y2={line.p2.y}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleSelect}
      onClick={handleClick}
      style={{ cursor: mode === "delete" ? "pointer" : undefined }}
      stroke={visualStroke}
      strokeWidth={visualWidth}
      {...rest}
    />
  );
}


