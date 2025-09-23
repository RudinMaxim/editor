import { useStatusBar } from "../../model/useStatusBar";

export function StatusBar() {
  const { mode, hoverPoint, eq } = useStatusBar();

  return (
    <div
      style={{
        padding: 8,
        fontSize: 12,
        color: "#c8c8d0",
        background: "#0f0f12",
        borderTop: "1px solid #222",
      }}
    >
      Mode: {mode}
      {hoverPoint && (
        <>
          {" "}
          | P: ({hoverPoint.x.toFixed(1)}, {hoverPoint.y.toFixed(1)})
        </>
      )}
      {eq && (
        <>
          {" "}
          | Eq: {eq.A.toFixed(2)}x + {eq.B.toFixed(2)}y + {eq.C.toFixed(2)} = 0
        </>
      )}
    </div>
  );
}
