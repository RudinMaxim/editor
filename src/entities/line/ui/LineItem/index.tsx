import React, { useCallback, useMemo } from "react";
import type { Line, Group } from "../../../../shared/types";
import { useEditorStore } from "../../../../entities/editor";
import { distancePointToPoint, getSvgPoint } from "../../../../shared/lib";

interface Props extends React.SVGProps<SVGLineElement> {
  line: Line;
}

export function LineItem({
  line,
  stroke = "#61dafb",
  strokeWidth = 2,
  ...rest
}: Props) {
  const {
    mode,
    deleteLine,
    setHoverLine,
    setHoverPoint,
    hoverLineId,
    toggleSelectLine,
    beginDragFromLine,
    updateDrag,
    endDrag,
    selectedLineIds,
    shiftSelectActive,
    groups,
    lines,
  } = useEditorStore();
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGLineElement>) => {
      if (mode === "delete") {
        e.stopPropagation();
        deleteLine(line.id);
        return;
      }
      if (mode === "edit" || shiftSelectActive) {
        e.stopPropagation();
        const additive = e.shiftKey;
        toggleSelectLine(line.id, additive);
        return;
      }
    },
    [deleteLine, line.id, mode, toggleSelectLine, shiftSelectActive],
  );

  const handleEnter = useCallback(() => {
    if (mode === "focus") setHoverLine(line.id);
  }, [line.id, mode, setHoverLine]);
  const handleLeave = useCallback(() => {
    if (mode === "focus") setHoverLine(null);
    setHoverPoint(null);
  }, [mode, setHoverLine, setHoverPoint]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGLineElement>) => {
      if (mode !== "focus") return;
      const loc = getSvgPoint(e);
      if (!loc) return;
      const p1 = line.p1;
      const p2 = line.p2;
      const nearThreshold = 8;
      const d1 = distancePointToPoint(loc, p1);
      const d2 = distancePointToPoint(loc, p2);
      if (d1 <= nearThreshold) setHoverPoint(p1);
      else if (d2 <= nearThreshold) setHoverPoint(p2);
      else setHoverPoint(null);
    },
    [line.p1, line.p2, mode, setHoverPoint],
  );

  const hoveredGroupMemberIds = useMemo(() => {
    if (!hoverLineId) return null;
    const hovered = lines.find((l: Line) => l.id === hoverLineId);
    if (!hovered?.groupId) return null;
    const g = groups.find((gg: Group) => gg.id === hovered.groupId);
    return g ? new Set(g.memberIds) : null;
  }, [groups, hoverLineId, lines]);

  const isHovered =
    mode === "focus" &&
    (hoverLineId === line.id || (hoveredGroupMemberIds?.has(line.id) ?? false));

  const selectedWithGroups = useMemo(() => {
    if (selectedLineIds.length === 0) return new Set<string>();
    const result = new Set<string>(selectedLineIds);
    const selectedGroups = new Set(
      selectedLineIds
        .map((id: string) => lines.find((l: Line) => l.id === id)?.groupId)
        .filter((gid): gid is string => Boolean(gid)),
    );
    if (selectedGroups.size === 0) return result;
    for (const gid of selectedGroups) {
      const g = groups.find((gg: Group) => gg.id === gid);
      if (g) g.memberIds.forEach((m: string) => result.add(m));
    }
    return result;
  }, [groups, lines, selectedLineIds]);

  const isSelected = mode === "edit" && selectedWithGroups.has(line.id);
  const visualStroke = isHovered ? "#ffd166" : isSelected ? "#8ecae6" : stroke;
  const visualWidth =
    isHovered || isSelected
      ? typeof strokeWidth === "number"
        ? strokeWidth + 1.5
        : strokeWidth
      : strokeWidth;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGLineElement>) => {
      if (mode === "edit") {
        const loc = getSvgPoint(e);
        if (!loc) return;
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        beginDragFromLine(line.id, { x: loc.x, y: loc.y });
      }
    },
    [beginDragFromLine, line.id, mode],
  );

  const handlePointerMoveDrag = useCallback(
    (e: React.PointerEvent<SVGLineElement>) => {
      if (mode !== "edit") return;
      const loc = getSvgPoint(e);
      if (!loc) return;
      updateDrag({ x: loc.x, y: loc.y });
    },
    [mode, updateDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGLineElement>) => {
      if (mode === "edit") {
        endDrag();
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      }
    },
    [endDrag, mode],
  );

  return (
    <g>
      {(isHovered || isSelected) && (
        <line
          x1={line.p1.x}
          y1={line.p1.y}
          x2={line.p2.x}
          y2={line.p2.y}
          stroke={isHovered ? "#ffd166" : "#8ecae6"}
          strokeOpacity={0.35}
          strokeWidth={
            typeof strokeWidth === "number" ? strokeWidth + 6 : strokeWidth
          }
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
      <line
        x1={line.p1.x}
        y1={line.p1.y}
        x2={line.p2.x}
        y2={line.p2.y}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMouseMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveDrag}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        style={{
          cursor:
            mode === "delete"
              ? "pointer"
              : shiftSelectActive
                ? "cell"
                : undefined,
        }}
        stroke={visualStroke}
        strokeWidth={visualWidth}
        {...rest}
      />
    </g>
  );
}
