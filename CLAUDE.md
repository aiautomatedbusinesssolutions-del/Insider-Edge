# Project Context: Insider Edge (Part of 30 Finance Tools)

I am building a standalone tool for beginners to track Insider Trading. Follow these strict guidelines for consistency.

## 1. Tech Stack

- **Framework:** Next.js + Tailwind CSS + TypeScript
- **Icons:** Lucide-React
- **Lists:** Text-based leaderboard/scoreboard (no chart libraries)

## 2. Design & Theme

- **Background:** Always use `bg-slate-950` (Deep Dark Mode).
- **Cards:** Use `bg-slate-900` with `border border-slate-800`.
- **Typography:** Standard sans-serif (Inter). Headings: `text-slate-100`, Subtext: `text-slate-400`.
- **Traffic Light Palette:**
  - Success/Buy (Code P): `text-emerald-400` / `bg-emerald-500/10`
  - Danger/Sell (Code S): `text-rose-400` / `bg-rose-500/10`
  - Neutral/Info: `text-sky-400` / `bg-sky-500/10`

## 3. Tone & Language (Beginner-First)

- **The "Friend" Test:** No jargon. Explain things like "Code P" as "Personal Cash Purchase."
- **Probability, Not Certainty:** Use "Likely" or "Historically." Never promise profit.
- **Transparency:** Include: "Data sourced from SEC filings. Analysis powered by AI."

## 4. Components & UI

- **Responsiveness:** Mobile-first, large touch targets.
- **Search:** Consistent ticker search bar at the top.
- **Scrollable Feed:** Long lists must use `max-h-[400px] overflow-y-auto`.

## 5. The "Aha!" Moment

- **Visual:** A "Confidence Meter" (gauge) that scores the stock based on insider buy/sell volume and cluster buys.
