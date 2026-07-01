// @ts-nocheck
import { useState } from "react";

const COLORS = ["#f59e0b", "#7dd3fc", "#a78bfa", "#6ee7b7", "#f87171", "#fde047", "#fb923c", "#f472b6"];

type Piece = { id: number; left: number; color: string; delay: number; dur: number; w: number; h: number; br: string };

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const shape = i % 3;
    const size = 7 + Math.floor(Math.random() * 9);
    return {
      id: i,
      left: (i / count) * 100 + (Math.random() - 0.5) * (80 / count),
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.7,
      dur: 1.4 + Math.random() * 1.2,
      w: shape === 2 ? size * 2 : size,
      h: size,
      br: shape === 0 ? "50%" : shape === 1 ? "2px" : "3px",
    };
  });
}

export function Confetti({ count = 34 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count));
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 500 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${Math.max(1, Math.min(99, p.left))}%`,
            top: "-16px",
            animationName: "confetti-fall",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationFillMode: "forwards",
            animationTimingFunction: "ease-in",
          }}
        >
          <div style={{ width: p.w, height: p.h, backgroundColor: p.color, borderRadius: p.br }} />
        </div>
      ))}
    </div>
  );
}
