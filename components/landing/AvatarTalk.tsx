"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";

const LINES: { hi: string; en: string }[] = [
  { hi: "नमस्ते! मैं जनसेवक हूँ — आपकी अपनी सरकारी सहायक।", en: "Namaste! I'm JanSewak — your own sarkari sahayak." },
  { hi: "मैं आपकी स्क्रीन देखकर बताती हूँ कि कहाँ क्लिक करना है।", en: "I watch your screen and show exactly where to click." },
  { hi: "मैं आपकी पेंशन और PF के काम में मार्गदर्शन करती हूँ।", en: "I guide you through pension and PF work." },
  { hi: "मैं ट्रेन टिकट बुक करवाने में मदद करती हूँ।", en: "I help you book train tickets on IRCTC." },
  { hi: "मैं फॉर्म का टेक्स्ट तैयार कर देती हूँ — बस कॉपी कीजिए।", en: "I prepare your form text — just copy-paste." },
  { hi: "मैं आपकी फोटो को 50KB में छोटा कर देती हूँ।", en: "I resize your photo to 50KB for uploads." },
  { hi: "मैं हर भारतीय भाषा में बात करती हूँ — बस कहिए!", en: "I speak every Indian language — just ask!" },
  { hi: "मैं बताती हूँ कौन-सी सरकारी योजना आपके लिए है।", en: "I find which government scheme is for you." },
  { hi: "मैं आपकी शिकायत लिखकर दर्ज करवाती हूँ।", en: "I draft and file your complaints." },
];

const TYPE_MS = 45;
const HOLD_MS = 1900;

/** Homepage avatar that "speaks" her capabilities: a typewriter speech
 *  bubble synced with her mouth animation. */
export default function AvatarTalk() {
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const typingRef = useRef(false);

  const line = LINES[lineIdx];
  const typing = chars < line.hi.length;
  typingRef.current = typing;

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (chars < line.hi.length) {
          setChars((c) => c + 1);
        } else {
          setLineIdx((i) => (i + 1) % LINES.length);
          setChars(0);
        }
      },
      typing ? TYPE_MS : HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [chars, line.hi.length, typing]);

  return (
    <div className="flex flex-col items-center">
      {/* speech bubble */}
      <div className="relative mb-1 w-full max-w-sm" aria-live="polite">
        <div className="min-h-[92px] rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-md">
          <p className="text-[15px] font-semibold leading-relaxed text-stone-800">
            {line.hi.slice(0, chars)}
            {typing && <span className="animate-pulse text-orange-500">▍</span>}
          </p>
          <p className={`mt-0.5 text-xs text-stone-400 transition-opacity duration-300 ${typing ? "opacity-0" : "opacity-100"}`}>
            {line.en}
          </p>
        </div>
        {/* bubble tail */}
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-orange-200 bg-white" />
      </div>

      <Avatar
        state={typing ? "speaking" : "idle"}
        getLevel={() =>
          typingRef.current ? 0.28 + 0.18 * Math.sin(performance.now() / 90) + 0.08 * Math.sin(performance.now() / 37) : 0
        }
        size={280}
      />
    </div>
  );
}
