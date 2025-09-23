import { useEditorStore } from "../../../../entities/editor";

export function ClearCanvas() {
  const { clear } = useEditorStore();
  return (
    <button
      onClick={clear}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #333",
        background: "#1a1a1f",
        color: "#e6e6e6",
      }}
    >
      Clear
    </button>
  );
}
