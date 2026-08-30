"use client";

import { useState } from "react";

/**
 * A sample "government form" used to demo JanSewak's guided filling —
 * deliberately styled like a typical e-filing page. NOT a real government
 * website; nothing entered here is stored or sent anywhere.
 */
export default function SampleIncomeTaxForm() {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({ name: "", pan: "", mobile: "" });

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <div className="min-h-dvh bg-[#F4F6FA] text-stone-800">
      {/* demo disclaimer */}
      <div className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900">
        🧪 SAMPLE FORM — JanSewak hackathon demo. This is not a real government website. Nothing is saved or submitted
        anywhere.
      </div>

      {/* govt-style header */}
      <header className="border-b-4 border-orange-500 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3B8C] text-2xl">🏛️</div>
          <div>
            <p className="text-lg font-bold text-[#0B3B8C]">आयकर विभाग · Income Tax Department</p>
            <p className="text-xs text-stone-500">e-Filing Sample Portal (Demo) · Government of India (simulated)</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="rounded-lg border border-stone-300 bg-white shadow-sm">
          <div className="border-b border-stone-200 bg-[#0B3B8C] px-5 py-3 text-white">
            <h1 className="font-semibold">Taxpayer Basic Details — Form (Sample)</h1>
          </div>

          {submitted ? (
            <div className="m-5 rounded-lg border border-green-300 bg-green-50 p-5 text-center">
              <p className="text-lg font-bold text-green-800">✓ Form submitted successfully (demo)</p>
              <p className="mt-1 text-sm text-green-700">
                फॉर्म सफलतापूर्वक जमा हुआ। JanSewak की मदद से आपने यह फॉर्म खुद भरा! 🎉
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setValues({ name: "", pan: "", mobile: "" });
                }}
                className="mt-4 rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
              >
                Fill again
              </button>
            </div>
          ) : (
            <form
              className="space-y-5 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-semibold">
                  Full Name (as per PAN) / पूरा नाम <span className="text-red-600">*</span>
                </label>
                <input
                  id="fullName"
                  required
                  value={values.name}
                  onChange={set("name")}
                  placeholder="Enter full name"
                  className="w-full rounded border border-stone-400 px-3 py-2.5 focus:border-[#0B3B8C] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="pan" className="mb-1 block text-sm font-semibold">
                  PAN Number / पैन नंबर <span className="text-red-600">*</span>
                </label>
                <input
                  id="pan"
                  required
                  maxLength={10}
                  value={values.pan}
                  onChange={set("pan")}
                  placeholder="ABCDE1234F"
                  className="w-full rounded border border-stone-400 px-3 py-2.5 uppercase tracking-widest focus:border-[#0B3B8C] focus:outline-none"
                />
                <p className="mt-1 text-xs text-stone-500">10 characters, e.g. ABCDE1234F</p>
              </div>

              <div>
                <label htmlFor="mobile" className="mb-1 block text-sm font-semibold">
                  Mobile Number / मोबाइल नंबर <span className="text-red-600">*</span>
                </label>
                <input
                  id="mobile"
                  required
                  maxLength={10}
                  value={values.mobile}
                  onChange={set("mobile")}
                  placeholder="10-digit mobile"
                  className="w-full rounded border border-stone-400 px-3 py-2.5 focus:border-[#0B3B8C] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 border-t border-stone-200 pt-4">
                <button
                  type="submit"
                  className="rounded bg-[#0B3B8C] px-6 py-2.5 font-semibold text-white hover:bg-[#0A2F6E]"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setValues({ name: "", pan: "", mobile: "" })}
                  className="rounded border border-stone-400 px-6 py-2.5 font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Tip: JanSewak से कहिए — &ldquo;sample form भरने में मदद करो&rdquo; — और स्क्रीन शेयर कीजिए।
        </p>
      </main>
    </div>
  );
}
