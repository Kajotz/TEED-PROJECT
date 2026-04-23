import React from "react";
import "@/styles/canvas/AuthStaticCanvas.css";

export default function AuthStaticCanvas({ darkMode = false }) {
  const cx = 720;
  const cy = 512;

  const topEdgeLines = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;

    return {
      x1: 1440 - t * 420,
      y1: 0,
      x2: cx,
      y2: cy,
      key: `top-${i}`,
      opacity: 0.95 - t * 0.4,
    };
  });

  const rightEdgeLines = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;

    return {
      x1: 1440,
      y1: t * 420,
      x2: cx,
      y2: cy,
      key: `right-${i}`,
      opacity: 0.95 - t * 0.4,
    };
  });

  const leftEdgeLines = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;

    return {
      x1: 0,
      y1: 1024 - t * 420,
      x2: cx,
      y2: cy,
      key: `left-${i}`,
      opacity: 0.95 - t * 0.4,
    };
  });

  const bottomEdgeLines = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;

    return {
      x1: t * 420,
      y1: 1024,
      x2: cx,
      y2: cy,
      key: `bottom-${i}`,
      opacity: 0.95 - t * 0.4,
    };
  });

  return (
    <div
      className={`auth-static-canvas ${darkMode ? "is-dark" : "is-light"}`}
      aria-hidden="true"
    >
      <div className="auth-static-canvas__glow auth-static-canvas__glow--one" />
      <div className="auth-static-canvas__glow auth-static-canvas__glow--two" />

      <svg
        className="auth-static-canvas__svg"
        viewBox="0 0 1440 1024"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="auth-flow-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--auth-canvas-line-start)" />
            <stop offset="100%" stopColor="var(--auth-canvas-line-end)" />
          </linearGradient>
        </defs>

        {topEdgeLines.map((l, i) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#auth-flow-gradient)"
            strokeWidth={i % 2 === 0 ? 1.5 : 1}
            opacity={l.opacity}
            strokeLinecap="round"
          />
        ))}

        {rightEdgeLines.map((l, i) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#auth-flow-gradient)"
            strokeWidth={i % 2 === 0 ? 1.5 : 1}
            opacity={l.opacity}
            strokeLinecap="round"
          />
        ))}

        {leftEdgeLines.map((l, i) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#auth-flow-gradient)"
            strokeWidth={i % 2 === 0 ? 1.5 : 1}
            opacity={l.opacity}
            strokeLinecap="round"
          />
        ))}

        {bottomEdgeLines.map((l, i) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#auth-flow-gradient)"
            strokeWidth={i % 2 === 0 ? 1.5 : 1}
            opacity={l.opacity}
            strokeLinecap="round"
          />
        ))}

        <circle
          cx={cx}
          cy={cy}
          r="4"
          fill="var(--auth-canvas-center)"
          className="auth-static-canvas__center"
        />
      </svg>
    </div>
  );
}