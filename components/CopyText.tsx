"use client";

import { useState } from "react";
import { CopyTextItem } from "@/lib/tools";

export default function CopyText({ item }: { item: CopyTextItem }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked; show the text selected instead.
      window.getSelection()?.selectAllChildren(document.getElementById(`copy-${item.id}`)!);
    }
  };

  return (
    <button
      onClick={copy}
      className={`group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
        copied ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"
      }`}
      title="Copy to clipboard"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">{item.fieldHint}</p>
        <p id={`copy-${item.id}`} className="truncate font-medium text-stone-900">
          {item.text}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-semibold ${copied ? "text-emerald-700" : "text-amber-700"}`}>
        {copied ? "✓ Copied" : "📋 Copy"}
      </span>
    </button>
  );
}
