import { CoordinateGrid } from "../../../../shared/ui/CoordinateGrid";
import { LineItem } from "../../../../entities/line/ui/LineItem";
import { useCanvas } from "../../model/useCanvas";

const CANVAS_SIZE = 1000;

export function Canvas() {
  const {
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
  } = useCanvas();

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
        style={{
          background: "#0b0b0c",
          touchAction: "none",
          outline: "none",
          cursor: shiftSelectActive ? "cell" : undefined,
        }}
      >
        <CoordinateGrid size={CANVAS_SIZE} step={50} showAxes={showAxes} />
        {lines.map((line) => (
          <LineItem
            key={line.id}
            line={line}
            stroke="#61dafb"
            strokeWidth={2}
          />
        ))}
        {tempLine && (
          <LineItem
            line={tempLine}
            stroke="#ffffff"
            strokeDasharray="6 6"
            strokeWidth={1.5}
          />
        )}
        {marqueeRect && (
          <rect
            x={marqueeRect.x}
            y={marqueeRect.y}
            width={marqueeRect.w}
            height={marqueeRect.h}
            fill="rgba(134, 204, 255, 0.12)"
            stroke="#8ecae6"
            strokeDasharray="4 4"
            strokeWidth={1}
            pointerEvents="none"
          />
        )}
        <g
          onMouseLeave={() => {
            setHoverLine(null);
            setHoverPoint(null);
          }}
        />
      </svg>
    </div>
  );
}
