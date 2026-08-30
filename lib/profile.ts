"use client";

/**
 * User profile — stored ONLY in this browser's localStorage, never on a
 * server. The agent uses it to pre-fill provide_text suggestions so users
 * don't have to speak their details every session.
 */
export interface Profile {
  fullName: string;
  nameNative: string;
  age: string;
  gender: string;
  mobile: string;
  email: string;
  address: string;
  pan: string;
}

const KEY = "jansewak-profile";

export const EMPTY_PROFILE: Profile = {
  fullName: "",
  nameNative: "",
  age: "",
  gender: "",
  mobile: "",
  email: "",
  address: "",
  pan: "",
};

/** Demo persona pre-seeded until the user saves their own details, so the
 *  guided-form flow works out of the box (handy for hackathon judges). */
export const SAMPLE_PROFILE: Profile = {
  fullName: "Ramesh Kumar",
  nameNative: "रमेश कुमार",
  age: "45",
  gender: "Male",
  mobile: "9876543210",
  email: "ramesh.kumar@example.com",
  address: "House No. 12, Village Rampur, District Sitapur, Uttar Pradesh - 261001",
  pan: "ABCDE1234F",
};

export function loadProfile(): Profile {
  if (typeof window === "undefined") return SAMPLE_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : SAMPLE_PROFILE;
  } catch {
    return SAMPLE_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/** True once the user has saved their own details (seed no longer shown). */
export function hasSavedProfile(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem(KEY);
}

/** Compact text block injected into the agent's system instruction. */
export function profileToPromptText(p: Profile): string {
  const rows = [
    p.fullName && `Full name (English): ${p.fullName}`,
    p.nameNative && `Name (native script): ${p.nameNative}`,
    p.age && `Age: ${p.age}`,
    p.gender && `Gender: ${p.gender}`,
    p.mobile && `Mobile: ${p.mobile}`,
    p.email && `Email: ${p.email}`,
    p.address && `Address: ${p.address}`,
    p.pan && `PAN: ${p.pan}`,
  ].filter(Boolean);
  return rows.join("\n");
}
