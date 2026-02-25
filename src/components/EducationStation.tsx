import { BookOpen, ShieldCheck, Clock, Gauge, Scale } from "lucide-react";

const LESSONS = [
  {
    icon: Gauge,
    title: "Market Cap Reality",
    body: "Small-cap insiders trade far less frequently than big-cap executives. A single purchase from a small-cap CEO can carry more weight than dozens of routine trades at a Fortune 500 company — because they have fewer shares and more personal risk on the line.",
  },
  {
    icon: BookOpen,
    title: "Decoding the Codes",
    body: "SEC filings use transaction codes like P, S, A, M, and F. Code P (Personal Purchase) is the only one that truly matters — it means an insider spent their own money to buy shares. Everything else (awards, options, tax withholding) is often routine compensation.",
  },
  {
    icon: ShieldCheck,
    title: "The Sound of Silence",
    body: "Ever wonder why insider trades dry up before earnings? Companies enforce 'Blackout Periods' — windows where insiders are banned from trading to prevent unfair advantages. If you see zero activity, it might just mean earnings season is approaching.",
  },
  {
    icon: Clock,
    title: "Think in Months, Not Minutes",
    body: "Insider signals are long-term indicators, typically playing out over 60–180 days. A CEO buying shares isn't a day-trade tip — it's a bet on the company's future over the next 2–6 months. Patience is the edge.",
  },
  {
    icon: Scale,
    title: "The Ownership Ratio",
    body: "Context is King. A $1M buy sounds big, but if the CEO already owns $1B, it's only a 0.1% increase. We look for \"Skin in the Game\" — when an insider increases their total stake by 5% or more, it's a high-conviction signal. Conversely, small sales are often just for taxes or \"vesting\" and shouldn't be feared.",
    proTip: "Watch the % Change, not just the $.",
  },
] as const;

export default function EducationStation() {
  return (
    <section className="mt-10">
      {/* Section header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-100">
          🎓 Insider Edge: Pro Tips
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Level up your insider-trading literacy in 60 seconds
        </p>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((lesson) => (
          <div
            key={lesson.title}
            className="group relative rounded-xl border border-emerald-500/20 bg-slate-950/60 backdrop-blur-md p-6 transition-colors hover:border-emerald-500/40"
          >
            {/* Emerald glow — visible on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-500/[0.03] transition-opacity group-hover:bg-emerald-500/[0.06]" />

            <div className="relative">
              {/* Icon + title row */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <lesson.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {lesson.title}
                </h3>
              </div>

              {/* Body text */}
              <p className="text-sm leading-relaxed text-slate-400">
                {lesson.body}
              </p>

              {/* Pro Tip badge */}
              {"proTip" in lesson && lesson.proTip && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                  <span className="shrink-0 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Pro Tip
                  </span>
                  <p className="text-xs font-medium text-sky-300">
                    {lesson.proTip}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
