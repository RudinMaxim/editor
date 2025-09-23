import { useEditorStore } from "../../../entities/editor";
import { lineToABC } from "../../../shared/lib";

export function useStatusBar() {
  const { mode, lines, hoverLineId, hoverPoint } = useEditorStore();
  const hovered = hoverLineId ? lines.find((l) => l.id === hoverLineId) : null;
  const eq = hovered ? lineToABC(hovered) : null;

  return {
    mode,
    hoverPoint,
    eq,
  };
}
