import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  EditorSnapshot,
  Group,
  Line,
  Mode,
  Point,
} from "../../../shared/types";
import { v4 as uuidv4 } from "uuid";
import { doesLineIntersectRect } from "../../../shared/lib";

interface EditorState {
  mode: Mode;
  lines: Line[];
  groups: Group[];
  hoverPoint: Point | null;
  hoverLineId: string | null;
  tempStartPoint: Point | null;
  tempEndPoint: Point | null;
  showAxes: boolean;
  selectedLineIds: string[];
  dragIds: string[] | null;
  dragLast: Point | null;
  dragPin: "p1" | "p2" | null;
  shiftSelectActive: boolean;
  marqueeStart: Point | null;
  marqueeEnd: Point | null;
  history: EditorSnapshot[];
  historyIndex: number;
  historyLimit: number;
  setMode: (mode: Mode) => void;
  setShiftSelectActive: (active: boolean) => void;
  beginMarquee: (start: Point) => void;
  updateMarquee: (current: Point) => void;
  commitMarquee: () => void;
  cancelMarquee: () => void;
  setHoverPoint: (p: Point | null) => void;
  setHoverLine: (id: string | null) => void;
  toggleAxes: () => void;
  toggleSelectLine: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  createGroupFromSelection: () => void;
  ungroupSelected: () => void;
  beginDragFromLine: (lineId: string, start: Point, pin?: "p1" | "p2") => void;
  updateDrag: (current: Point, pin?: "p1" | "p2") => void;
  endDrag: () => void;
  undo: () => void;
  redo: () => void;
  beginLine: (p: Point) => void;
  updateTempEnd: (p: Point) => void;
  commitLine: () => void;
  cancelTemp: () => void;
  deleteLine: (id: string) => void;
  clear: () => void;
}

const HISTORY_LIMIT_DEFAULT = 200;

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
  mode: "create",
  lines: [],
  groups: [],
  hoverPoint: null,
  hoverLineId: null,
  tempStartPoint: null,
  tempEndPoint: null,
  showAxes: true,
  selectedLineIds: [],
  dragIds: null,
  dragLast: null,
  dragPin: null,
  shiftSelectActive: false,
  marqueeStart: null,
  marqueeEnd: null,
  history: [{ lines: [], groups: [], selectedLineIds: [] }],
  historyIndex: 0,
  historyLimit: HISTORY_LIMIT_DEFAULT,
  setMode: (mode) => set({ mode }),
  setShiftSelectActive: (active) => set({ shiftSelectActive: active }),
  beginMarquee: (start) => set({ marqueeStart: start, marqueeEnd: start }),
  updateMarquee: (current) => set({ marqueeEnd: current }),
  commitMarquee: () => {
    const s = get();
    if (!s.marqueeStart || !s.marqueeEnd) return;
    const a = s.marqueeStart;
    const b = s.marqueeEnd;
    const selectedLineIds = s.lines
      .filter((l) => doesLineIntersectRect(l, a, b))
      .map((l) => l.id);
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = makeSnapshot(s.lines, s.groups, selectedLineIds);
    set({
      selectedLineIds,
      marqueeStart: null,
      marqueeEnd: null,
      history: [...baseHistory, snap],
      historyIndex: baseHistory.length,
    });
  },
  cancelMarquee: () => set({ marqueeStart: null, marqueeEnd: null }),
  setHoverPoint: (p) => set({ hoverPoint: p }),
  setHoverLine: (id) => {
    set((s) => {
      const hoverLine = s.lines.find((line) => line.id === id);
      if (hoverLine) {
        console.log(`Hovering over line: (${hoverLine.p1.x}, ${hoverLine.p1.y}) to (${hoverLine.p2.x}, ${hoverLine.p2.y})`);
      }
      return { hoverLineId: id };
    });
  },
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleSelectLine: (id, additive) =>
    set((s) => {
      const already = s.selectedLineIds.includes(id);
      let selectedLineIds;
      if (additive) {
        selectedLineIds = already
          ? s.selectedLineIds.filter((x) => x !== id)
          : [...s.selectedLineIds, id];
      } else {
        selectedLineIds = already && s.selectedLineIds.length === 1 ? [] : [id];
      }

      const selectedLines = s.lines.filter((line) => selectedLineIds.includes(line.id));
      selectedLines.forEach((line) => {
        console.log(`Selected line: (${line.p1.x}, ${line.p1.y}) to (${line.p2.x}, ${line.p2.y})`);
      });

      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap = makeSnapshot(s.lines, s.groups, selectedLineIds);
      return {
        selectedLineIds,
        history: [...baseHistory, snap],
        historyIndex: baseHistory.length,
      };
    }),
  clearSelection: () =>
    set((s) => {
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap = makeSnapshot(s.lines, s.groups, []);
      return {
        selectedLineIds: [],
        history: [...baseHistory, snap],
        historyIndex: baseHistory.length,
      };
    }),
  createGroupFromSelection: () => {
    const s = get();
    if (s.selectedLineIds.length < 2) return;
    const selectedSet = new Set<string>(s.selectedLineIds);
    for (const lineId of s.selectedLineIds) {
      const line = s.lines.find((l) => l.id === lineId);
      if (line?.groupId) {
        const g = s.groups.find((gg) => gg.id === line.groupId);
        if (g) g.memberIds.forEach((m) => selectedSet.add(m));
      }
    }
    const mergedMemberIds = Array.from(selectedSet);
    const id = uuidv4();
    const newGroup: Group = { id, memberIds: mergedMemberIds };
    const overlappedGroupIds = new Set(
      s.groups
        .filter((g) => g.memberIds.some((m) => selectedSet.has(m)))
        .map((g) => g.id),
    );
    const remainingGroups = s.groups.filter(
      (g) => !overlappedGroupIds.has(g.id),
    );
    const updatedLines = s.lines.map((l) =>
      mergedMemberIds.includes(l.id)
        ? { ...l, groupId: id }
        : overlappedGroupIds.has(l.groupId ?? "")
          ? { ...l, groupId: undefined }
          : l,
    );
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const nextGroups = [...remainingGroups, newGroup];
    const snap = makeSnapshot(updatedLines, nextGroups, mergedMemberIds);
    set({
      groups: nextGroups,
      lines: updatedLines,
      selectedLineIds: mergedMemberIds,
      history: [...baseHistory, snap],
      historyIndex: baseHistory.length,
    });
  },
  ungroupSelected: () => {
    const s = get();
    if (s.selectedLineIds.length === 0) return;
    const involvedGroupIds = new Set(
      s.selectedLineIds
        .map((id) => s.lines.find((l) => l.id === id)?.groupId)
        .filter((gid): gid is string => Boolean(gid)),
    );
    if (involvedGroupIds.size === 0) return;
    const updatedLines = s.lines.map((l) =>
      involvedGroupIds.has(l.groupId ?? "") ? { ...l, groupId: undefined } : l,
    );
    const remainingGroups = s.groups.filter((g) => !involvedGroupIds.has(g.id));
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = makeSnapshot(updatedLines, remainingGroups, s.selectedLineIds);
    set({
      lines: updatedLines,
      groups: remainingGroups,
      history: [...baseHistory, snap],
      historyIndex: baseHistory.length,
    });
  },
  beginDragFromLine: (lineId, start, pin) =>
    set((s) => {
      const line = s.lines.find((l) => l.id === lineId);
      let ids: string[] = [];
      if (!line) return { dragIds: null, dragLast: null };
      if (line.groupId) {
        const group = s.groups.find((g) => g.id === line.groupId);
        ids = group ? [...group.memberIds] : [lineId];
      } else if (
        s.selectedLineIds.includes(lineId) &&
        s.selectedLineIds.length > 0
      ) {
        ids = [...s.selectedLineIds];
      } else {
        ids = [lineId];
      }
      return { dragIds: ids, dragLast: start, dragPin: pin };
    }),
  updateDrag: (current, pin) => {
    const { dragIds, dragLast } = get();
    if (!dragIds || !dragLast) return;
    const dx = current.x - dragLast.x;
    const dy = current.y - dragLast.y;
    if (dx === 0 && dy === 0) return;
    set((s) => ({
      lines: s.lines.map((l) => {
        if (!dragIds.includes(l.id)) return l;
        if (pin === "p1") {
          return {
            ...l,
            p1: { x: l.p1.x + dx, y: l.p1.y + dy },
          };
        } else if (pin === "p2") {
          return {
            ...l,
            p2: { x: l.p2.x + dx, y: l.p2.y + dy },
          };
        } else {
          return {
            ...l,
            p1: { x: l.p1.x + dx, y: l.p1.y + dy },
            p2: { x: l.p2.x + dx, y: l.p2.y + dy },
          };
        }
      }),
    }));
    set({ dragLast: current });
  },
  endDrag: () =>
    set((s) => {
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap: EditorSnapshot = makeSnapshot(
        s.lines,
        s.groups,
        s.selectedLineIds,
      );
      const capped = capHistory([...baseHistory, snap], s.historyLimit);
      return {
        dragIds: null,
        dragLast: null,
        history: capped,
        historyIndex: capped.length - 1,
      };
    }),
  undo: () => {
    const { historyIndex } = get();
    if (historyIndex <= 0) return;
    const target = historyIndex - 1;
    const snapshot = get().history[target];
    set({
      lines: snapshot.lines.map(cloneLine),
      groups: snapshot.groups.map(cloneGroup),
      selectedLineIds: [...snapshot.selectedLineIds],
      historyIndex: target,
    });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const target = historyIndex + 1;
    const snapshot = history[target];
    set({
      lines: snapshot.lines.map(cloneLine),
      groups: snapshot.groups.map(cloneGroup),
      selectedLineIds: [...snapshot.selectedLineIds],
      historyIndex: target,
    });
  },
  beginLine: (p) => set({ tempStartPoint: p, tempEndPoint: p }),
  updateTempEnd: (p) => set({ tempEndPoint: p }),
  commitLine: () => {
    const { tempStartPoint, tempEndPoint } = get();
    if (!tempStartPoint || !tempEndPoint) return;
    const newLine: Line = {
      id: uuidv4(),
      p1: tempStartPoint,
      p2: tempEndPoint,
    };
    set((s) => {
      const lines = [...s.lines, newLine];
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap: EditorSnapshot = makeSnapshot(
        lines,
        s.groups,
        s.selectedLineIds,
      );
      const capped = capHistory([...baseHistory, snap], s.historyLimit);
      return {
        lines,
        tempStartPoint: null,
        tempEndPoint: null,
        history: capped,
        historyIndex: capped.length - 1,
      };
    });
  },
  cancelTemp: () => set({ tempStartPoint: null, tempEndPoint: null }),
  deleteLine: (id: string) =>
    set((s) => {
      const lines = s.lines.filter((l) => l.id !== id);
      let groups = s.groups.map((g) => ({
        ...g,
        memberIds: g.memberIds.filter((m) => m !== id),
      }));
      const droppedGroupIds = new Set(
        groups.filter((g) => g.memberIds.length < 2).map((g) => g.id),
      );
      groups = groups.filter((g) => !droppedGroupIds.has(g.id));
      const cleanedLines = lines.map((l) =>
        droppedGroupIds.has(l.groupId ?? "") ? { ...l, groupId: undefined } : l,
      );
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const nextSelected = s.selectedLineIds.filter((x) => x !== id);
      const snap: EditorSnapshot = makeSnapshot(
        cleanedLines,
        groups,
        nextSelected,
      );
      const capped = capHistory([...baseHistory, snap], s.historyLimit);
      return {
        lines: cleanedLines,
        groups,
        selectedLineIds: nextSelected,
        history: capped,
        historyIndex: capped.length - 1,
      };
    }),
  clear: () =>
    set((s) => {
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap: EditorSnapshot = makeSnapshot([], [], []);
      const capped = capHistory([...baseHistory, snap], s.historyLimit);
      return {
        lines: [],
        groups: [],
        selectedLineIds: [],
        history: capped,
        historyIndex: capped.length - 1,
      };
    }),
    }),
    {
      name: "editor-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        lines: state.lines,
        groups: state.groups,
        showAxes: state.showAxes,
        selectedLineIds: state.selectedLineIds,
        history: state.history,
        historyIndex: state.historyIndex,
        historyLimit: state.historyLimit,
      }),
    },
  ),
);

function cloneLine(l: Line): Line {
  return {
    id: l.id,
    p1: { x: l.p1.x, y: l.p1.y },
    p2: { x: l.p2.x, y: l.p2.y },
    groupId: l.groupId,
  };
}

function cloneGroup(g: Group): Group {
  return { id: g.id, memberIds: [...g.memberIds] };
}

function capHistory(
  history: EditorSnapshot[],
  limit: number,
): EditorSnapshot[] {
  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : HISTORY_LIMIT_DEFAULT;
  if (history.length <= safeLimit) return history;
  return history.slice(history.length - safeLimit);
}

function makeSnapshot(
  lines: Line[],
  groups: Group[],
  selectedLineIds: string[],
): EditorSnapshot {
  return {
    lines: lines.map(cloneLine),
    groups: groups.map(cloneGroup),
    selectedLineIds: [...selectedLineIds],
  };
}
