"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar, { AvatarState } from "@/components/Avatar";
import ActionCard from "@/components/ActionCard";
import LanguagePicker from "@/components/LanguagePicker";
import TranscriptPanel from "@/components/TranscriptPanel";
import { GuidePanel, GuideState, PipPortal } from "@/components/GuidePip";
import ProfileSection from "@/components/ProfileSection";
import { profileToPromptText } from "@/lib/profile";
import { JanSewakLive, SessionStatus, TranscriptEntry } from "@/lib/live-client";
import { ScreenShare } from "@/lib/screen";
import { isDocumentPipSupported, openPipWindow } from "@/lib/pip";
import { CopyTextItem, FileToolConfig, Highlight, SuggestedAction } from "@/lib/tools";

export default function AssistantPage() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string | undefined>();
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [actions, setActions] = useState<SuggestedAction[]>([]);
  const [copyTexts, setCopyTexts] = useState<CopyTextItem[]>([]);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [instruction, setInstruction] = useState("");
  const [fileToolConfig, setFileToolConfig] = useState<FileToolConfig | null>(null);
  const [language, setLanguage] = useState("Hindi");
  const [micMuted, setMicMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sharePrompt, setSharePrompt] = useState(false);
  const [guideStream, setGuideStream] = useState<MediaStream | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const clientRef = useRef<JanSewakLive | null>(null);
  const screenRef = useRef<ScreenShare | null>(null);

  const endGuide = useCallback(() => {
    screenRef.current?.stop();
    screenRef.current = null;
    setGuideStream(null);
    setPipWindow((w) => {
      w?.close();
      return null;
    });
    setHighlight(null);
    setInstruction("");
  }, []);

  const stopSession = useCallback(() => {
    endGuide();
    clientRef.current?.disconnect();
    clientRef.current = null;
    setSpeaking(false);
    setSharePrompt(false);
  }, [endGuide]);

  useEffect(() => () => stopSession(), [stopSession]);

  const startSession = async () => {
    clientRef.current?.disconnect();
    setTranscript([]);
    setActions([]);
    setCopyTexts([]);
    const client = new JanSewakLive({
      onStatus: (s, detail) => {
        setStatus(s);
        setStatusDetail(detail);
      },
      onTranscript: setTranscript,
      onSpeakingChange: setSpeaking,
      onSuggestAction: (a) => setActions((prev) => [...prev.slice(-3), a]),
      onStartScreenGuide: () => setSharePrompt(true),
      onHighlight: setHighlight,
      onProvideText: (item) => setCopyTexts((prev) => [item, ...prev.filter((c) => c.fieldHint !== item.fieldHint)].slice(0, 5)),
      onSetLanguage: setLanguage,
      onOpenFileTool: setFileToolConfig,
      onInstruction: setInstruction,
      // Audio-thread heartbeat: drives screen capture even when this tab is
      // backgrounded (user is on the government site's tab).
      onMicTick: () => screenRef.current?.capture(),
    });
    clientRef.current = client;
    await client.connect(language);
  };

  /** Must run inside a click handler — getDisplayMedia needs a user gesture. */
  const startScreenShare = async () => {
    if (!clientRef.current) return;
    try {
      const share = new ScreenShare();
      share.onEnded = () => {
        setGuideStream(null);
        setPipWindow((w) => {
          w?.close();
          return null;
        });
      };
      const stream = await share.start((frame) => clientRef.current?.sendScreenFrame(frame));
      screenRef.current = share;
      setGuideStream(stream);
      setSharePrompt(false);
      clientRef.current.sendText(
        "[system note] Screen sharing is now ON — you receive a screenshot whenever the user's screen changes (and periodically). Briefly confirm you can see it, then guide step by step with highlight_region.",
      );
    } catch {
      // User cancelled the picker; keep the prompt visible.
    }
  };

  /** Also needs a user gesture. */
  const popOutGuide = async () => {
    const win = await openPipWindow(420, 720);
    if (win) {
      win.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(win);
    }
  };

  const handleAction = (action: SuggestedAction) => {
    if (action.kind === "start_guide") {
      setSharePrompt(true);
    } else if (action.url) {
      window.open(action.url, "_blank", "noopener");
    }
  };

  const toggleMic = () => {
    const next = !micMuted;
    setMicMuted(next);
    clientRef.current?.setMicMuted(next);
  };

  const live = status === "live";
  const avatarState: AvatarState =
    status === "connecting" ? "connecting" : !live ? "idle" : speaking ? "speaking" : "listening";

  const guideState: GuideState = {
    stream: guideStream,
    highlight,
    instruction,
    copyTexts,
    fileToolConfig,
    micMuted,
  };

  const guidePanel = (
    <GuidePanel
      guide={guideState}
      avatarState={avatarState}
      getLevel={() => clientRef.current?.playback.getLevel() ?? 0}
      onToggleMic={toggleMic}
      onEndGuide={endGuide}
      onToggleFileTool={() => setFileToolConfig((c) => (c ? null : {}))}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFF7EC]">
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-orange-200/60 bg-white/70 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-bold text-stone-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 via-white to-green-600">
            🙏
          </span>
          जनसेवक <span className="hidden text-stone-400 sm:inline">· JanSewak</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            👤 <span className="hidden sm:inline">प्रोफ़ाइल</span>
          </button>
          <LanguagePicker value={language} onChange={setLanguage} disabled={live || status === "connecting"} />
          {live && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* left: avatar + controls */}
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-orange-200/70 bg-white/60 p-6 lg:w-[46%]">
          <Avatar state={avatarState} getLevel={() => clientRef.current?.playback.getLevel() ?? 0} />

          {status === "error" || status === "closed" ? (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {statusDetail || (status === "closed" ? "Session ended. Reconnect to continue." : "Something went wrong.")}
            </div>
          ) : null}

          {!live && status !== "connecting" ? (
            <button
              onClick={startSession}
              className="rounded-full bg-emerald-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
            >
              🎙️ बात शुरू करें · Start talking
            </button>
          ) : status === "connecting" ? (
            <p className="animate-pulse text-sm font-medium text-stone-500">जुड़ रही हूँ… connecting…</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMic}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                  micMuted ? "bg-stone-200 text-stone-700" : "bg-emerald-700 text-white"
                }`}
              >
                {micMuted ? "🔇 Mic off" : "🎙️ Mic on"}
              </button>
              <button
                onClick={stopSession}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                ✕ समाप्त · End
              </button>
            </div>
          )}

          {/* screen-share prompt (needs a user click) */}
          {sharePrompt && live && !guideStream && (
            <div className="w-full space-y-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-medium text-emerald-900">
                मैं आपकी स्क्रीन देखकर कदम-कदम पर मदद करूँगी।
                <br />
                <span className="text-emerald-700">Share your screen so I can guide you on it.</span>
              </p>
              <button
                onClick={startScreenShare}
                className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                🖥️ स्क्रीन साझा करें · Share screen
              </button>
            </div>
          )}

          {/* actions suggested by the agent */}
          {actions.length > 0 && (
            <div className="w-full space-y-2">
              {actions.map((a) => (
                <ActionCard
                  key={a.id}
                  action={a}
                  onOpen={handleAction}
                  onDismiss={(id) => setActions((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}

          {!live && status !== "connecting" && (
            <div className="space-y-2 text-center">
              <p className="max-w-sm text-xs leading-relaxed text-stone-400">
                माइक की अनुमति दें और अपनी भाषा में बोलें — टिकट, पेंशन, आधार, शिकायत… कुछ भी पूछिए।
              </p>
              <p className="text-xs text-stone-400">
                👤 पहले <button onClick={() => setProfileOpen(true)} className="font-semibold text-emerald-700 underline">प्रोफ़ाइल भरें</button> ताकि फॉर्म का text तैयार मिले ·{" "}
                <a href="/demo/income-tax" target="_blank" className="font-semibold text-emerald-700 underline">
                  🧪 Sample form पर आज़माएँ
                </a>
              </p>
            </div>
          )}
        </section>

        {/* right: transcript */}
        <section className="flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-2xl border border-orange-200/70 bg-white/60">
          <div className="border-b border-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            बातचीत · Conversation
          </div>
          <div className="min-h-0 flex-1">
            <TranscriptPanel entries={transcript} />
          </div>
        </section>
      </main>

      <ProfileSection
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(p) => {
          // A live session picks the change up immediately; new sessions get
          // it via the system instruction.
          const text = profileToPromptText(p);
          if (text && clientRef.current) {
            clientRef.current.sendText(
              `[system note] The user just updated their saved profile:\n${text}\nUse these values in provide_text suggestions from now on. Briefly acknowledge in one short sentence.`,
            );
          }
        }}
      />

      {/* guide: floating panel, or portal into the PiP window */}
      {guideStream &&
        (pipWindow ? (
          <PipPortal pipWindow={pipWindow}>{guidePanel}</PipPortal>
        ) : (
          <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-orange-300 shadow-2xl">
            <div className="flex items-center justify-between bg-orange-100 px-3 py-1.5">
              <span className="text-xs font-semibold text-orange-900">Guide window</span>
              {isDocumentPipSupported() && (
                <button
                  onClick={popOutGuide}
                  className="rounded px-2 py-0.5 text-xs font-medium text-orange-800 hover:bg-orange-200"
                  title="Pop out — stays on top of the government website"
                >
                  ⧉ Pop out (हमेशा ऊपर रहेगा)
                </button>
              )}
            </div>
            <div className="max-h-[70vh] overflow-y-auto">{guidePanel}</div>
          </div>
        ))}
    </div>
  );
}
