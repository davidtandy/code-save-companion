const ROWS = 24;
const WORDS_PER_ROW = 48;
const COLOR = "hsl(var(--poster-ink))";

export function StepRepeatBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: -1,
        opacity: 0.055,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          transform: "rotate(-20deg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: ROWS }, (_, i) => {
          const animName = i % 2 === 0 ? "drift-a" : "drift-b";
          const duration = 40 + (i % 5) * 4;

          return (
            <div
              key={i}
              className="step-repeat-row"
              style={{
                width: "200%",
                whiteSpace: "nowrap",
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)",
                lineHeight: 1,
                letterSpacing: "0.03em",
                animation: `${animName} ${duration}s linear infinite alternate`,
                willChange: "transform",
              }}
            >
              {Array.from({ length: WORDS_PER_ROW / 2 }, (_, j) => (
                <span key={j} style={{ marginRight: "1.75em" }}>
                  <span style={{ color: COLOR }}>genau</span>
                  <span style={{
                    color: "transparent",
                    WebkitTextStroke: `2px ${COLOR}`,
                    paintOrder: "stroke fill",
                  }}>genau</span>
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
