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

export function loadProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
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
