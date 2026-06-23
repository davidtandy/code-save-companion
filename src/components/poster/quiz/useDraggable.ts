import { useRef, useState } from "react";

export function useDraggable(_key?: unknown) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const dragHandlers = {
    onPointerDown(e: React.PointerEvent) {
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    },
    onPointerMove(e: React.PointerEvent) {
      if (!startRef.current) return;
      setOffset({
        x: startRef.current.ox + e.clientX - startRef.current.px,
        y: startRef.current.oy + e.clientY - startRef.current.py,
      });
    },
    onPointerUp() { startRef.current = null; },
  };

  const dragStyle: React.CSSProperties = offset.x || offset.y
    ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
    : {};

  return { dragStyle, dragHandlers };
}
