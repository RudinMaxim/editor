import { useEditorStore } from "../../../../entities/editor";

export function Undo() {
  const { undo } = useEditorStore();
  return (
    <button onClick={undo} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>
      Undo
    </button>
  );
}


