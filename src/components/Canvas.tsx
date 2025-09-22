import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "../store/useStore";
import { CoordinateGrid } from "./CoordinateGrid";
import { LineItem } from "./LineItem";
import { getSvgPoint } from "../utils/geometry";

const CANVAS_SIZE = 1000; // logical coordinate units

export function Canvas() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { lines, tempStartPoint, tempEndPoint, beginLine, updateTempEnd, commitLine, cancelTemp, mode, setHoverLine, setHoverPoint, showAxes, setShiftSelectActive, shiftSelectActive } = useStore();

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "create") return;
    if (shiftSelectActive || e.shiftKey) return; // do not start create while selecting
    const loc = getSvgPoint(e);
    if (!loc) return;
    beginLine({ x: loc.x, y: loc.y });
  }, [beginLine, mode, shiftSelectActive]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "create") return;
    if (shiftSelectActive || e.shiftKey) return;
    if (!tempStartPoint) return;
    const loc = getSvgPoint(e);
    if (!loc) return;
    updateTempEnd({ x: loc.x, y: loc.y });
  }, [mode, tempStartPoint, updateTempEnd, shiftSelectActive]);

  const handlePointerUp = useCallback(() => {
    if (mode !== "create") return;
    if (shiftSelectActive) return;
    if (!tempStartPoint || !tempEndPoint) return;
    commitLine();
  }, [commitLine, mode, tempEndPoint, tempStartPoint, shiftSelectActive]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "Escape") {
      cancelTemp();
    }
    if (e.key === "Shift") setShiftSelectActive(true);
  }, [cancelTemp]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "Shift") setShiftSelectActive(false);
  }, [setShiftSelectActive]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftSelectActive(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftSelectActive(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [setShiftSelectActive]);

  const tempLine = useMemo(() => {
    if (!tempStartPoint || !tempEndPoint) return null;
    return { id: "__temp__", p1: tempStartPoint, p2: tempEndPoint };
  }, [tempEndPoint, tempStartPoint]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        width="100%"
        height="100%"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        style={{ background: "#0b0b0c", touchAction: "none", outline: "none", cursor: shiftSelectActive ? "cell" : undefined }}
      >
        <CoordinateGrid size={CANVAS_SIZE} step={50} showAxes={showAxes} />
        {lines.map((line) => (
          <LineItem key={line.id} line={line} stroke="#61dafb" strokeWidth={2} />
        ))}
        {tempLine && <LineItem line={tempLine} stroke="#ffffff" strokeDasharray="6 6" strokeWidth={1.5} />}
        <g onMouseLeave={() => { setHoverLine(null); setHoverPoint(null); }} />
      </svg>
    </div>
  );
}

