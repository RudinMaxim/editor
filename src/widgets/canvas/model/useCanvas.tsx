import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "../../../entities/editor";
import { getSvgPoint } from "../../../shared/lib";

export function useCanvas() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const {
    lines,
    tempStartPoint,
    tempEndPoint,
    beginLine,
    updateTempEnd,
    commitLine,
    cancelTemp,
    mode,
    setHoverLine,
    setHoverPoint,
    showAxes,
    setShiftSelectActive,
    shiftSelectActive,
    beginMarquee,
    updateMarquee,
    commitMarquee,
    marqueeStart,
    marqueeEnd,
  } = useEditorStore();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const loc = getSvgPoint(e);
      if (!loc) return;
      if (shiftSelectActive || e.shiftKey) {
        beginMarquee({ x: loc.x, y: loc.y });
        return;
      }
      if (mode !== "create") return;
      beginLine({ x: loc.x, y: loc.y });
    },
    [beginMarquee, beginLine, mode, shiftSelectActive]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const loc = getSvgPoint(e);
      if (!loc) return;
      if (shiftSelectActive || e.shiftKey) {
        updateMarquee({ x: loc.x, y: loc.y });
        return;
      }
      if (mode !== "create") return;
      if (!tempStartPoint) return;
      updateTempEnd({ x: loc.x, y: loc.y });
    },
    [mode, tempStartPoint, updateTempEnd, shiftSelectActive, updateMarquee]
  );

  const handlePointerUp = useCallback(() => {
    if (marqueeStart && marqueeEnd) {
      commitMarquee();
      return;
    }
    if (mode !== "create") return;
    if (!tempStartPoint || !tempEndPoint) return;
    commitLine();
  }, [
    commitLine,
    commitMarquee,
    marqueeStart,
    marqueeEnd,
    mode,
    tempEndPoint,
    tempStartPoint,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "Escape") {
        cancelTemp();
      }
      if (e.key === "Shift") setShiftSelectActive(true);
    },
    [cancelTemp]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "Shift") setShiftSelectActive(false);
    },
    [setShiftSelectActive]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftSelectActive(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftSelectActive(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setShiftSelectActive]);

  const tempLine = useMemo(() => {
    if (!tempStartPoint || !tempEndPoint) return null;
    return { id: "__temp__", p1: tempStartPoint, p2: tempEndPoint };
  }, [tempEndPoint, tempStartPoint]);

  const marqueeRect = useMemo(() => {
    if (!marqueeStart || !marqueeEnd) return null;
    const x = Math.min(marqueeStart.x, marqueeEnd.x);
    const y = Math.min(marqueeStart.y, marqueeEnd.y);
    const w = Math.abs(marqueeStart.x - marqueeEnd.x);
    const h = Math.abs(marqueeStart.y - marqueeEnd.y);
    return { x, y, w, h };
  }, [marqueeStart, marqueeEnd]);

  return {
    svgRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleKeyUp,
    shiftSelectActive,
    lines,
    showAxes,
    tempLine,
    marqueeRect,
    setHoverLine,
    setHoverPoint,
  };
}
