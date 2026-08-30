"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CopyTextItem, FileToolConfig, Highlight } from "@/lib/tools";
import Avatar, { AvatarState } from "./Avatar";
import CopyText from "./CopyText";
import FileTools from "./FileTools";
import ScreenFeed from "./ScreenFeed";

export interface GuideState {
  stream: MediaStream | null;
  highlight: Highlight | null;
  instruction: string;
  copyTexts: CopyTextItem[];
  fileToolConfig: FileToolConfig | null;
  micMuted: boolean;
}

interface GuidePanelProps {
  guide: GuideState;
  avatarState: AvatarState;
  getLevel: () => number;
  onToggleMic: () => void;
  onEndGuide: () => void;
  onToggleFileTool: () => void;
}

/** The guide UI itself — rendered either inside the PiP window or as a floating panel. */
export function GuidePanel({ guide, avatarState, getLevel, onToggleMic, onEndGuide, onToggleFileTool }: GuidePanelProps) {
  return (
    <div className="flex h-full flex-col gap-2.5 bg-[#FFF7EC] p-3" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 via-white to-green-600 text-sm">
          🙏
        </span>
        <p className="text-sm font-bold text-stone-800">जनसेवक Guide</p>
        <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE
        </span>
      </div>

      {/* she guides in person — big, speaking with the live voice */}
      <div className="-my-1 flex justify-center">
        <Avatar state={avatarState} getLevel={getLevel} size={170} />
      </div>

      <div className="rounded-lg border border-orange-200 bg-white px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">अगला कदम · Next step</p>
        <p className="text-sm leading-relaxed text-stone-800">
          {guide.instruction || "बोलिए, मैं आपकी स्क्रीन देखकर मदद करूँगी… (speak — I can see your screen)"}
        </p>
      </div>

      <ScreenFeed stream={guide.stream} highlight={guide.highlight} />

      {guide.copyTexts.length > 0 && (
        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 150 }}>
          {guide.copyTexts.map((c) => (
            <CopyText key={c.id} item={c} />
          ))}
        </div>
      )}

      {guide.fileToolConfig && <FileTools config={guide.fileToolConfig} />}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <button
          onClick={onToggleMic}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            guide.micMuted ? "bg-stone-200 text-stone-700" : "bg-emerald-700 text-white"
          }`}
        >
          {guide.micMuted ? "🔇 Mic off" : "🎙️ Mic on"}
        </button>
        <button
          onClick={onToggleFileTool}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700"
          title="Photo/file resize tool"
        >
          📁
        </button>
        <button
          onClick={onEndGuide}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          ✕ End
        </button>
      </div>
    </div>
  );
}

/** Renders children into a Document-PiP window via a React portal. */
export function PipPortal({ pipWindow, children }: { pipWindow: Window; children: React.ReactNode }) {
  const [container] = useState(() => {
    const el = pipWindow.document.createElement("div");
    el.style.height = "100vh";
    return el;
  });

  useEffect(() => {
    pipWindow.document.body.appendChild(container);
    return () => container.remove();
  }, [pipWindow, container]);

  return createPortal(children, container);
}
