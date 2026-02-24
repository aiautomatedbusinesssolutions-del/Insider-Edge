"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface RadialGaugeProps {
  score: number; // 0–100
}

export default function RadialGauge({ score }: RadialGaugeProps) {
  // Animate the score value with a spring
  const motionScore = useMotionValue(0);
  const springScore = useSpring(motionScore, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  });

  // Map score 0–100 to needle angle -90° (left) to +90° (right)
  const needleRotation = useTransform(springScore, [0, 100], [-90, 90]);

  // Derive the displayed number from the spring
  const displayScore = useTransform(springScore, (v) => Math.round(v));

  useEffect(() => {
    motionScore.set(score);
  }, [score, motionScore]);

  // Arc geometry
  const cx = 100;
  const cy = 100;
  const r = 80;

  // Build semicircle arc path (left to right, 180°)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative h-[130px] w-[220px]">
        <svg viewBox="0 0 200 120" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-slate-800"
          />

          {/* Colored arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Scale labels */}
          <text x={cx - r - 4} y={cy + 18} textAnchor="middle" className="fill-slate-500 text-[11px]">
            0
          </text>
          <text x={cx} y={cy - r + 6} textAnchor="middle" className="fill-slate-500 text-[11px]">
            50
          </text>
          <text x={cx + r + 4} y={cy + 18} textAnchor="middle" className="fill-slate-500 text-[11px]">
            100
          </text>

          {/* Needle pivot dot */}
          <circle cx={cx} cy={cy} r="5" className="fill-slate-300" />

          {/* Needle — rotates around the pivot */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r + 14}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-slate-100"
            style={{
              originX: `${cx}px`,
              originY: `${cy}px`,
              rotate: needleRotation,
            }}
          />
        </svg>

        {/* Score number below pivot */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <motion.span className="text-4xl font-bold text-slate-100">
            {displayScore}
          </motion.span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
    </div>
  );
}
