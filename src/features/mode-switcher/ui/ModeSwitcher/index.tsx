import { useEditorStore } from "../../../../entities/editor";
import type { Mode } from "../../../../shared/types";

const modes: Mode[] = ["create", "edit", "delete"];

export function ModeSwitcher() {
  const { mode, setMode } = useEditorStore();
  return (
    <div style={{ display: "flex", gap: 8 }}>
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
    </div>
  );
}
