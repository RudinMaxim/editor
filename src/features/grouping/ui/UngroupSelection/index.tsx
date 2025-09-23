import { useEditorStore } from "../../../../entities/editor";

export function UngroupSelection() {
  const { ungroupSelected } = useEditorStore();
  return (
    <button onClick={ungroupSelected} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1a1a1f", color: "#e6e6e6" }}>
      Ungroup
    </button>
  );
}


