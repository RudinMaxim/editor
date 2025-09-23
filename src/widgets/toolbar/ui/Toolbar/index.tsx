import { ModeSwitcher } from "../../../../features/mode-switcher";
import { ToggleAxes } from "../../../../features/toggle-axes";
import { ClearCanvas } from "../../../../features/clear-canvas";
import { GroupSelection, UngroupSelection } from "../../../../features/grouping";
import { Undo, Redo } from "../../../../features/history";

export function Toolbar() {
  return (
    <div style={{ display: "flex", gap: 8, padding: 8 }}>
      <ModeSwitcher />
      <ClearCanvas />
      <ToggleAxes />
      <GroupSelection />
      <UngroupSelection />
      <Undo />
      <Redo />
    </div>
  );
}


