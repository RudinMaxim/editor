import { useStore } from "../store/useStore";
import type { Mode } from "../types/index";

const modes: Mode[] = ["create", "edit", "delete", "focus"];

export function Toolbar() {
  const { mode, setMode, clear, toggleAxes, showAxes, createGroupFromSelection, ungroupSelected, undo, redo } = useStore();
  return (
    <div style={{ display: "flex", gap: 8, padding: 8 }}>
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #333",
            background: mode === m ? "#2f2f35" : "#1a1a1f",
            color: "#e6e6e6",
            cursor: "pointer",
          }}
        >
          {m}
        </button>
      ))}
      <button onClick={clear} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>Clear</button>
      <button onClick={toggleAxes} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>{showAxes ? "Hide Axes" : "Show Axes"}</button>
      <button onClick={createGroupFromSelection} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>Group</button>
      <button onClick={ungroupSelected} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>Ungroup</button>
      <button onClick={undo} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>Undo</button>
      <button onClick={redo} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>Redo</button>
    </div>
  );
}


