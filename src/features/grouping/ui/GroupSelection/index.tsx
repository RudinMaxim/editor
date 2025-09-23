import { useEditorStore } from "../../../../entities/editor";

export function GroupSelection() {
  const { createGroupFromSelection } = useEditorStore();
  return (
    <button
      onClick={createGroupFromSelection}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #333",
        background: "#1a1a1f",
        color: "#e6e6e6",
      }}
    >
      Group
    </button>
  );
}
