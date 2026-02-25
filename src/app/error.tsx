"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-rose-500/20 bg-slate-900 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-100">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg border border-sky-500/30 bg-sky-500/10 px-6 py-2.5 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
