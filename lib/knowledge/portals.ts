export interface PortalGuideStep {
  step: number;
  instruction: string;
  hindi?: string;
  tip?: string;
}

export interface Portal {
  id: string;
  name: string;
  hindiName: string;
  url: string;
  category: string;
  tasks: string[];
  /** Structured walkthroughs the agent can narrate step by step. */
  guides?: Record<string, PortalGuideStep[]>;
}

export const PORTALS: Portal[] = [
  {
    id: "irctc",
    name: "IRCTC",
    hindiName: "आईआरसीटीसी",
    url: "https://www.irctc.co.in/nget/train-search",
    category: "Travel",
    tasks: ["Book train tickets", "Cancel tickets", "Check PNR status", "Tatkal booking"],
    guides: {
      "book-train-ticket": [
        {
          step: 1,
          instruction:
            "On the IRCTC homepage, find the booking box on the left. Click the 'From' field and type your departure station, then pick it from the dropdown.",
          hindi: "IRCTC होमपेज पर बाईं ओर बुकिंग बॉक्स में 'From' में अपना प्रस्थान स्टेशन लिखें और सूची से चुनें।",
          tip: "Station names can be typed in English; the dropdown shows the station code too.",
        },
        {
          step: 2,
          instruction: "Click the 'To' field and type your destination station, then select it from the dropdown.",
          hindi: "'To' में अपना गंतव्य स्टेशन लिखें और सूची से चुनें।",
        },
        {
          step: 3,
          instruction: "Click the date field and choose your journey date from the calendar.",
          hindi: "तारीख वाले बॉक्स पर क्लिक करके कैलेंडर से यात्रा की तारीख चुनें।",
        },
        {
          step: 4,
          instruction: "Choose the class (Sleeper, 3A, 2A…) and quota (General/Tatkal/Ladies), then click the blue 'Search' button.",
          hindi: "क्लास (स्लीपर, 3A, 2A…) और कोटा चुनें, फिर नीले 'Search' बटन पर क्लिक करें।",
        },
        {
          step: 5,
          instruction:
            "In the train list, check availability for your class, then click 'Book Now' on the train you want. You will be asked to log in if you haven't.",
          hindi: "ट्रेन सूची में उपलब्धता देखें और अपनी ट्रेन पर 'Book Now' दबाएँ। लॉगिन माँगा जाए तो लॉगिन करें।",
          tip: "New users must create a free IRCTC account first — I can guide you through registration too.",
        },
        {
          step: 6,
          instruction:
            "Fill passenger details: name (as on ID), age, gender, and berth preference. I can give you the exact text to copy for each field.",
          hindi: "यात्री विवरण भरें: नाम (पहचान पत्र जैसा), उम्र, लिंग और बर्थ पसंद। मैं हर फ़ील्ड के लिए कॉपी करने लायक टेक्स्ट दे सकती हूँ।",
        },
        {
          step: 7,
          instruction: "Enter your mobile number, verify the captcha, and proceed to payment (UPI is easiest).",
          hindi: "मोबाइल नंबर भरें, कैप्चा भरें और भुगतान करें (UPI सबसे आसान है)।",
        },
        {
          step: 8,
          instruction: "After payment, your e-ticket is shown and sent by SMS/email. You can download the PDF — no printout needed for travel.",
          hindi: "भुगतान के बाद ई-टिकट SMS/ईमेल पर आ जाएगा। यात्रा के लिए प्रिंट ज़रूरी नहीं है।",
        },
      ],
    },
  },
  {
    id: "epfo",
    name: "EPFO",
    hindiName: "ईपीएफओ",
    url: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/",
    category: "Pension & PF",
    tasks: ["Check PF balance", "Withdraw PF", "Transfer PF", "Update KYC"],
  },
  {
    id: "incometax",
    name: "Income Tax e-Filing",
    hindiName: "आयकर ई-फाइलिंग",
    url: "https://www.incometax.gov.in/iec/foportal/",
    category: "Taxes",
    tasks: ["File ITR", "Check refund status", "Link PAN with Aadhaar", "e-Verify return"],
  },
  {
    id: "digilocker",
    name: "DigiLocker",
    hindiName: "डिजिलॉकर",
    url: "https://www.digilocker.gov.in/",
    category: "Documents",
    tasks: ["Store documents", "Get driving licence", "Get marksheets", "Share documents"],
  },
  {
    id: "uidai",
    name: "Aadhaar (UIDAI)",
    hindiName: "आधार",
    url: "https://myaadhaar.uidai.gov.in/",
    category: "Identity",
    tasks: ["Download Aadhaar", "Update address", "Book appointment", "Verify Aadhaar"],
  },
  {
    id: "passport",
    name: "Passport Seva",
    hindiName: "पासपोर्ट सेवा",
    url: "https://www.passportindia.gov.in/",
    category: "Identity",
    tasks: ["Apply for passport", "Renew passport", "Track application", "Book appointment"],
  },
  {
    id: "pmkisan",
    name: "PM-Kisan",
    hindiName: "पीएम-किसान",
    url: "https://pmkisan.gov.in/",
    category: "Schemes",
    tasks: ["Check beneficiary status", "Register as farmer", "e-KYC", "Check installment"],
  },
  {
    id: "cowin-abha",
    name: "ABHA Health ID",
    hindiName: "आभा हेल्थ आईडी",
    url: "https://abha.abdm.gov.in/",
    category: "Health",
    tasks: ["Create health ID", "Link health records"],
  },
  {
    id: "voter",
    name: "Voter Services (ECI)",
    hindiName: "मतदाता सेवा",
    url: "https://voters.eci.gov.in/",
    category: "Identity",
    tasks: ["Apply for Voter ID", "Correct voter details", "Find polling booth", "Download e-EPIC"],
  },
  {
    id: "pgportal",
    name: "CPGRAMS Grievances",
    hindiName: "जन शिकायत",
    url: "https://pgportal.gov.in/",
    category: "Grievances",
    tasks: ["File a complaint against any government department", "Track grievance status"],
  },
];

/** Plain-text knowledge lookup the model calls as a tool. */
export function lookupKnowledge(query: string): string {
  const q = query.toLowerCase();
  const scored = PORTALS.map((p) => {
    let score = 0;
    const hay = `${p.id} ${p.name} ${p.category} ${p.tasks.join(" ")}`.toLowerCase();
    for (const word of q.split(/\s+/)) {
      if (word.length > 2 && hay.includes(word)) score++;
    }
    return { portal: p, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return "No seeded guide found for this query. Use your own knowledge and Google Search, and rely on the shared screen to guide the user step by step.";
  }

  return scored
    .map(({ portal }) => {
      let text = `PORTAL: ${portal.name} (${portal.hindiName}) — ${portal.url}\nCategory: ${portal.category}\nCommon tasks: ${portal.tasks.join(", ")}`;
      if (portal.guides) {
        for (const [task, steps] of Object.entries(portal.guides)) {
          text += `\n\nSTEP-BY-STEP GUIDE (${task}):\n`;
          text += steps.map((s) => `${s.step}. ${s.instruction}${s.tip ? ` (Tip: ${s.tip})` : ""}`).join("\n");
        }
      }
      return text;
    })
    .join("\n\n---\n\n");
}
