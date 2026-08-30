"use client";

import { useState } from "react";
import { hasSavedProfile, loadProfile, Profile, saveProfile } from "@/lib/profile";

interface ProfileSectionProps {
  open: boolean;
  onClose: () => void;
  /** Called after save so a live session can be told about the update. */
  onSaved: (p: Profile) => void;
}

const FIELDS: { key: keyof Profile; label: string; placeholder: string; type?: string }[] = [
  { key: "fullName", label: "पूरा नाम · Full name (English)", placeholder: "Shivam Kumar Pathak" },
  { key: "nameNative", label: "नाम (अपनी भाषा में) · Name in native script", placeholder: "शिवम कुमार पाठक" },
  { key: "age", label: "उम्र · Age", placeholder: "28", type: "number" },
  { key: "gender", label: "लिंग · Gender", placeholder: "Male / Female / Other" },
  { key: "mobile", label: "मोबाइल · Mobile", placeholder: "9876543210", type: "tel" },
  { key: "email", label: "ईमेल · Email", placeholder: "you@example.com", type: "email" },
  { key: "address", label: "पता · Address", placeholder: "House, Village/City, District, State, PIN" },
  { key: "pan", label: "PAN (optional)", placeholder: "ABCDE1234F" },
];

export default function ProfileSection({ open, onClose, onSaved }: ProfileSectionProps) {
  if (!open) return null;
  return <ProfileDialog onClose={onClose} onSaved={onSaved} />;
}

function ProfileDialog({ onClose, onSaved }: Omit<ProfileSectionProps, "open">) {
  // Mounted only while the dialog is open, so state initializes from storage.
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [saved, setSaved] = useState(false);
  const [isSeed] = useState(() => !hasSavedProfile());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h2 className="text-lg font-bold text-stone-800">मेरी प्रोफ़ाइल · My Profile</h2>
          <button onClick={onClose} className="ml-auto rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            ✕
          </button>
        </div>

        {isSeed && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            🧪 Demo के लिए <b>sample details (Ramesh Kumar)</b> पहले से भरे हैं — सीधे आज़माएँ, या अपने असली details
            लिखकर Save करें।
          </p>
        )}
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
          🔒 ये जानकारी सिर्फ <b>आपके ही device</b> पर रहती है — किसी server पर नहीं जाती। जनसेवक इनसे फॉर्म के लिए
          copy-paste text तैयार करती है। आधार नंबर, OTP या पासवर्ड यहाँ कभी न रखें।
        </p>

        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-0.5 block text-xs font-semibold text-stone-600">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={profile[f.key]}
                onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            saveProfile(profile);
            setSaved(true);
            onSaved(profile);
            setTimeout(onClose, 700);
          }}
          className="mt-5 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          {saved ? "✓ Saved" : "💾 सेव करें · Save"}
        </button>
      </div>
    </div>
  );
}
