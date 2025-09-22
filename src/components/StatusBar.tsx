import { useStore } from "../store/useStore";
import { lineToABC } from "../utils/geometry";

export function StatusBar() {
  const { mode, lines, hoverLineId, hoverPoint } = useStore();
  const hovered = hoverLineId ? lines.find((l) => l.id === hoverLineId) : null;
  const eq = hovered ? lineToABC(hovered) : null;
  return (
    <div style={{ padding: 8, fontSize: 12, color: "#c8c8d0", background: "#0f0f12", borderTop: "1px solid #222" }}>
      Mode: {mode}
      {hoverPoint && <> | P: ({hoverPoint.x.toFixed(1)}, {hoverPoint.y.toFixed(1)})</>}
      {eq && <> | Eq: {eq.A.toFixed(2)}x + {eq.B.toFixed(2)}y + {eq.C.toFixed(2)} = 0</>}
    </div>
  );
}


