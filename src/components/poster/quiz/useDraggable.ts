import { useEffect, useRef, useState } from "react";

/**
 * Lightweight draggable hook for floating cards.
 * Applies as CSS `translate` property so it composes with existing
 * `transform`-based positioning (e.g. `-translate-x-1/2`).
 * Resets to {0,0} when `resetKey` changes and on orientation change.
 */
export function useDraggable(resetKey: unknown) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const state = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0, pid: -1 });

  useEffect(() => { setOffset({ x: 0, y: 0 }); }, [resetKey]);

  useEffect(() => {
    const onOrient = () => setOffset({ x: 0, y: 0 });
    window.addEventListener("orientationchange", onOrient);
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener?.("change", onOrient);
    return () => {
      window.removeEventListener("orientationchange", onOrient);
      mq.removeEventListener?.("change", onOrient);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, [role='button'], a, input, select, textarea")) return;
    state.current = {
      active: true,
      sx: e.clientX, sy: e.clientY,
      bx: offset.x, by: offset.y,
      pid: e.pointerId,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!state.current.active || e.pointerId !== state.current.pid) return;
    setOffset({
      x: state.current.bx + (e.clientX - state.current.sx),
      y: state.current.by + (e.clientY - state.current.sy),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== state.current.pid) return;
    state.current.active = false;
    state.current.pid = -1;
  };

  return {
    dragStyle: {
      translate: `${offset.x}px ${offset.y}px`,
      cursor: state.current.active ? "grabbing" : "grab",
      touchAction: "none" as const,
    } as React.CSSProperties,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
