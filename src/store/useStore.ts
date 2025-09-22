import { create } from "zustand";
import type { EditorSnapshot, Group, Line, Mode, Point } from "../types";
import { v4 as uuidv4 } from "uuid";

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
  // history
  history: EditorSnapshot[];
  historyIndex: number;
  historyLimit: number;
  setMode: (mode: Mode) => void;
  setHoverPoint: (p: Point | null) => void;
  setHoverLine: (id: string | null) => void;
  toggleAxes: () => void;
  toggleSelectLine: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  createGroupFromSelection: () => void;
  beginDragFromLine: (lineId: string, start: Point) => void;
  updateDrag: (current: Point) => void;
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

export const useStore = create<EditorState>((set, get) => ({
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
  history: [{ lines: [], groups: [], selectedLineIds: [] }],
  historyIndex: 0,
  historyLimit: 200,
  setMode: (mode) => set({ mode }),
  setHoverPoint: (p) => set({ hoverPoint: p }),
  setHoverLine: (id) => set({ hoverLineId: id }),
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleSelectLine: (id, additive) => set((s) => {
    const already = s.selectedLineIds.includes(id);
    if (additive) {
      const selectedLineIds = already ? s.selectedLineIds.filter((x) => x !== id) : [...s.selectedLineIds, id];
      const baseHistory = s.history.slice(0, s.historyIndex + 1);
      const snap = { lines: s.lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [...selectedLineIds] };
      return { selectedLineIds, history: [...baseHistory, snap], historyIndex: baseHistory.length };
    }
    const selectedLineIds = already && s.selectedLineIds.length === 1 ? [] : [id];
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = { lines: s.lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [...selectedLineIds] };
    return { selectedLineIds, history: [...baseHistory, snap], historyIndex: baseHistory.length };
  }),
  clearSelection: () => set((s) => {
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = { lines: s.lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [] as string[] };
    return { selectedLineIds: [], history: [...baseHistory, snap], historyIndex: baseHistory.length };
  }),
  createGroupFromSelection: () => set((s) => {
    if (s.selectedLineIds.length < 2) return {} as any;
    const id = uuidv4();
    const newGroup: Group = { id, memberIds: [...s.selectedLineIds] };
    const updatedLines = s.lines.map((l) => (s.selectedLineIds.includes(l.id) ? { ...l, groupId: id } : l));
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = { lines: updatedLines.map(cloneLine), groups: [...s.groups, newGroup].map(cloneGroup), selectedLineIds: [...s.selectedLineIds] };
    return { groups: [...s.groups, newGroup], lines: updatedLines, history: [...baseHistory, snap], historyIndex: baseHistory.length };
  }),
  beginDragFromLine: (lineId, start) => set((s) => {
    const line = s.lines.find((l) => l.id === lineId);
    let ids: string[] = [];
    if (line?.groupId) {
      const group = s.groups.find((g) => g.id === line.groupId);
      ids = group ? [...group.memberIds] : [lineId];
    } else if (s.selectedLineIds.includes(lineId) && s.selectedLineIds.length > 0) {
      ids = [...s.selectedLineIds];
    } else {
      ids = [lineId];
    }
    return { dragIds: ids, dragLast: start };
  }),
  updateDrag: (current) => {
    const { dragIds, dragLast } = get();
    if (!dragIds || !dragLast) return;
    const dx = current.x - dragLast.x;
    const dy = current.y - dragLast.y;
    if (dx === 0 && dy === 0) return;
    set((s) => ({
      lines: s.lines.map((l) => (dragIds.includes(l.id) ? { ...l, p1: { x: l.p1.x + dx, y: l.p1.y + dy }, p2: { x: l.p2.x + dx, y: l.p2.y + dy } } : l))
    }));
    set({ dragLast: current });
  },
  endDrag: () => set((s) => {
    // record history for the drag
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap: EditorSnapshot = { lines: s.lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [...s.selectedLineIds] };
    const capped = capHistory([...baseHistory, snap], s.historyLimit);
    return { dragIds: null, dragLast: null, history: capped, historyIndex: capped.length - 1 };
  }),
  undo: () => {
    const { historyIndex } = get();
    if (historyIndex <= 0) return;
    const target = historyIndex - 1;
    const snapshot = get().history[target];
    set({ lines: snapshot.lines.map(cloneLine), groups: snapshot.groups.map(cloneGroup), selectedLineIds: [...snapshot.selectedLineIds], historyIndex: target });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const target = historyIndex + 1;
    const snapshot = history[target];
    set({ lines: snapshot.lines.map(cloneLine), groups: snapshot.groups.map(cloneGroup), selectedLineIds: [...snapshot.selectedLineIds], historyIndex: target });
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
      const snap: EditorSnapshot = { lines: lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [...s.selectedLineIds] };
      const capped = capHistory([...baseHistory, snap], s.historyLimit);
      return { lines, tempStartPoint: null, tempEndPoint: null, history: capped, historyIndex: capped.length - 1 };
    });
  },
  cancelTemp: () => set({ tempStartPoint: null, tempEndPoint: null }),
  deleteLine: (id: string) => set((s) => {
    const lines = s.lines.filter((l) => l.id !== id);
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap: EditorSnapshot = { lines: lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: s.selectedLineIds.filter((x) => x !== id) };
    const capped = capHistory([...baseHistory, snap], s.historyLimit);
    return { lines, selectedLineIds: snap.selectedLineIds, history: capped, historyIndex: capped.length - 1 };
  }),
  clear: () => set((s) => {
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap: EditorSnapshot = { lines: [] as Line[], groups: [] as Group[], selectedLineIds: [] as string[] };
    const capped = capHistory([...baseHistory, snap], s.historyLimit);
    return { lines: [], groups: [], selectedLineIds: [], history: capped, historyIndex: capped.length - 1 };
  }),
}));

function cloneLine(l: Line): Line {
  return { id: l.id, p1: { x: l.p1.x, y: l.p1.y }, p2: { x: l.p2.x, y: l.p2.y }, groupId: l.groupId };
}

function cloneGroup(g: Group): Group {
  return { id: g.id, memberIds: [...g.memberIds] };
}

function capHistory(history: EditorSnapshot[], limit: number): EditorSnapshot[] {
  if (history.length <= limit) return history;
  // Keep the last 'limit' snapshots
  return history.slice(history.length - limit);
}


