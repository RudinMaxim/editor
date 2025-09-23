import { create } from "zustand";
import type { EditorSnapshot, Group, Line, Mode, Point } from "../../../shared/types";
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

export const useEditorStore = create<EditorState>((set, get) => ({
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
  shiftSelectActive: false,
  marqueeStart: null,
  marqueeEnd: null,
  history: [{ lines: [], groups: [], selectedLineIds: [] }],
  historyIndex: 0,
  historyLimit: 200,
  setMode: (mode) => set({ mode }),
  setShiftSelectActive: (active) => set({ shiftSelectActive: active }),
  beginMarquee: (start) => set({ marqueeStart: start, marqueeEnd: start }),
  updateMarquee: (current) => set({ marqueeEnd: current }),
  commitMarquee: () => set((s) => {
    if (!s.marqueeStart || !s.marqueeEnd) return {} as any;
    const a = s.marqueeStart;
    const b = s.marqueeEnd;
    const selectedLineIds = s.lines.filter((l) => doesLineIntersectRect(l, a, b)).map((l) => l.id);
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = { lines: s.lines.map(cloneLine), groups: s.groups.map(cloneGroup), selectedLineIds: [...selectedLineIds] };
    return { selectedLineIds, marqueeStart: null, marqueeEnd: null, history: [...baseHistory, snap], historyIndex: baseHistory.length };
  }),
  cancelMarquee: () => set({ marqueeStart: null, marqueeEnd: null }),
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
    const selectedSet = new Set(s.selectedLineIds);
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
      s.groups.filter((g) => g.memberIds.some((m) => selectedSet.has(m))).map((g) => g.id)
    );
    const remainingGroups = s.groups.filter((g) => !overlappedGroupIds.has(g.id));
    const updatedLines = s.lines.map((l) =>
      mergedMemberIds.includes(l.id) ? { ...l, groupId: id } : overlappedGroupIds.has(l.groupId || "") ? { ...l, groupId: undefined } : l
    );
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const nextGroups = [...remainingGroups, newGroup];
    const snap = { lines: updatedLines.map(cloneLine), groups: nextGroups.map(cloneGroup), selectedLineIds: [...mergedMemberIds] };
    return { groups: nextGroups, lines: updatedLines, selectedLineIds: mergedMemberIds, history: [...baseHistory, snap], historyIndex: baseHistory.length };
  }),
  ungroupSelected: () => set((s) => {
    if (s.selectedLineIds.length === 0) return {} as any;
    const involvedGroupIds = new Set(
      s.selectedLineIds.map((id) => s.lines.find((l) => l.id === id)?.groupId).filter(Boolean) as string[]
    );
    if (involvedGroupIds.size === 0) return {} as any;
    const updatedLines = s.lines.map((l) => (involvedGroupIds.has(l.groupId || "") ? { ...l, groupId: undefined } : l));
    const remainingGroups = s.groups.filter((g) => !involvedGroupIds.has(g.id));
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap = { lines: updatedLines.map(cloneLine), groups: remainingGroups.map(cloneGroup), selectedLineIds: [...s.selectedLineIds] };
    return { lines: updatedLines, groups: remainingGroups, history: [...baseHistory, snap], historyIndex: baseHistory.length };
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
    let groups = s.groups.map((g) => ({ ...g, memberIds: g.memberIds.filter((m) => m !== id) }));
    const droppedGroupIds = new Set(groups.filter((g) => g.memberIds.length < 2).map((g) => g.id));
    groups = groups.filter((g) => !droppedGroupIds.has(g.id));
    const cleanedLines = lines.map((l) => (droppedGroupIds.has(l.groupId || "") ? { ...l, groupId: undefined } : l));
    const baseHistory = s.history.slice(0, s.historyIndex + 1);
    const snap: EditorSnapshot = { lines: cleanedLines.map(cloneLine), groups: groups.map(cloneGroup), selectedLineIds: s.selectedLineIds.filter((x) => x !== id) };
    const capped = capHistory([...baseHistory, snap], s.historyLimit);
    return { lines: cleanedLines, groups, selectedLineIds: snap.selectedLineIds, history: capped, historyIndex: capped.length - 1 };
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
  return history.slice(history.length - limit);
}


