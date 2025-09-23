import React from "react";

interface Props {
  size: number;
  step?: number;
  showAxes?: boolean;
}

export function CoordinateGrid({ size, step = 50, showAxes = true }: Props) {
  const children: React.ReactNode[] = [];
  for (let i = 0; i <= size; i += step) {
    children.push(
      <line
        key={`v-${i}`}
        x1={i}
        y1={0}
        x2={i}
        y2={size}
        stroke="#1a1a1f"
        strokeWidth={0.6}
      />,
    );
    children.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={i}
        x2={size}
        y2={i}
        stroke="#1a1a1f"
        strokeWidth={0.6}
      />,
    );
  }
  if (showAxes) {
    const mid = size / 2;
    children.push(
      <line
        key="axis-x"
        x1={0}
        y1={mid}
        x2={size}
        y2={mid}
        stroke="#2f2f35"
        strokeWidth={1.2}
      />,
    );
    children.push(
      <line
        key="axis-y"
        x1={mid}
        y1={0}
        x2={mid}
        y2={size}
        stroke="#2f2f35"
        strokeWidth={1.2}
      />,
    );
  }
  return <g>{children}</g>;
}
