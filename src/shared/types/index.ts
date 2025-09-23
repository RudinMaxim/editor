export interface Point { x: number; y: number; }
export interface Line { id: string; p1: Point; p2: Point; groupId?: string; }
export interface Group { id: string; memberIds: string[]; }
export type Mode = "create" | "edit" | "delete" | "focus";

export interface EditorSnapshot {
  lines: Line[];
  groups: Group[];
  selectedLineIds: string[];
}


