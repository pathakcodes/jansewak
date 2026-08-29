import { FunctionDeclaration, Type } from "@google/genai";
import { lookupKnowledge } from "./knowledge/portals";

/* ---------- UI event types emitted when the model calls a tool ---------- */

export interface SuggestedAction {
  id: string;
  label: string;
  url?: string;
  kind: "open_url" | "start_guide" | "info";
  detail?: string;
}

export interface Highlight {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
  at: number;
}

export interface CopyTextItem {
  id: string;
  text: string;
  fieldHint: string;
}

export interface FileToolConfig {
  targetKb?: number;
  format?: string;
}

export interface ToolUIHandlers {
  onSuggestAction: (action: SuggestedAction) => void;
  onStartScreenGuide: () => void;
  onHighlight: (h: Highlight | null) => void;
  onProvideText: (item: CopyTextItem) => void;
  onSetLanguage: (lang: string) => void;
  onOpenFileTool: (config: FileToolConfig) => void;
  onInstruction: (text: string) => void;
}

/* ---------- Declarations sent to Gemini Live ---------- */

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "suggest_action",
    description:
      "Show the user a tappable action card, e.g. a button to open a government website in a new tab. Use whenever you recommend a portal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, description: "Short button label in the user's language, e.g. 'IRCTC खोलें'" },
        url: { type: Type.STRING, description: "Full https URL to open (official portal). Omit for non-link actions." },
        kind: { type: Type.STRING, description: "'open_url' | 'start_guide' | 'info'" },
        detail: { type: Type.STRING, description: "One-line explanation shown under the label." },
      },
      required: ["label", "kind"],
    },
  },
  {
    name: "start_screen_guide",
    description:
      "Ask the browser to start screen sharing and open the floating guide window, so you can see the user's screen and guide them. Call after the user agrees to be guided.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "highlight_region",
    description:
      "Draw a pulsing highlight box with a label over a region of the user's shared screen, as seen in the most recent frame. Coordinates use a 0-1000 grid (like bounding boxes): ymin, xmin, ymax, xmax.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ymin: { type: Type.NUMBER },
        xmin: { type: Type.NUMBER },
        ymax: { type: Type.NUMBER },
        xmax: { type: Type.NUMBER },
        label: { type: Type.STRING, description: "Very short label in the user's language, e.g. 'यहाँ क्लिक करें'" },
        instruction: {
          type: Type.STRING,
          description: "The current step as one short written sentence, shown in the guide window.",
        },
      },
      required: ["ymin", "xmin", "ymax", "xmax", "label"],
    },
  },
  {
    name: "provide_text",
    description:
      "Give the user exact text to copy-paste into a form field (names, addresses, complaint text…). Transliterate to the script the form needs. The text appears as a copy chip in the guide window.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "The exact text to paste." },
        field_hint: { type: Type.STRING, description: "Which field it is for, short, e.g. 'Name (नाम)'" },
      },
      required: ["text", "field_hint"],
    },
  },
  {
    name: "set_language",
    description: "Record that the conversation language changed (user chose or asked to switch). Updates UI labels.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, description: "Language name in English, e.g. 'Marathi'" },
      },
      required: ["language"],
    },
  },
  {
    name: "open_file_tool",
    description:
      "Open the built-in file utility (photo/signature/document resize, compress to a KB limit, format conversion) pre-configured for what the government form needs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target_kb: { type: Type.NUMBER, description: "Max file size in KB the form allows, e.g. 50" },
        format: { type: Type.STRING, description: "Required format, e.g. 'jpeg' or 'png'" },
      },
    },
  },
  {
    name: "lookup_knowledge",
    description:
      "Search JanSewak's knowledge base of Indian government portals and step-by-step guides. Call this FIRST for any portal-related task.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "What the user wants, e.g. 'book train ticket IRCTC'" },
      },
      required: ["query"],
    },
  },
];

let idCounter = 0;
const nextId = () => `t${++idCounter}`;

/**
 * Executes a tool call from the model: updates the UI via handlers and
 * returns the result object to send back to the session.
 */
export function dispatchToolCall(
  name: string,
  args: Record<string, unknown>,
  ui: ToolUIHandlers,
): Record<string, unknown> {
  switch (name) {
    case "suggest_action": {
      ui.onSuggestAction({
        id: nextId(),
        label: String(args.label ?? "Open"),
        url: args.url ? String(args.url) : undefined,
        kind: (args.kind as SuggestedAction["kind"]) ?? "info",
        detail: args.detail ? String(args.detail) : undefined,
      });
      return { shown: true };
    }
    case "start_screen_guide": {
      ui.onStartScreenGuide();
      return { status: "screen share requested from user" };
    }
    case "highlight_region": {
      ui.onHighlight({
        ymin: Number(args.ymin),
        xmin: Number(args.xmin),
        ymax: Number(args.ymax),
        xmax: Number(args.xmax),
        label: String(args.label ?? ""),
        at: performance.now(),
      });
      if (args.instruction) ui.onInstruction(String(args.instruction));
      return { highlighted: true };
    }
    case "provide_text": {
      ui.onProvideText({
        id: nextId(),
        text: String(args.text ?? ""),
        fieldHint: String(args.field_hint ?? ""),
      });
      return { shown: true };
    }
    case "set_language": {
      ui.onSetLanguage(String(args.language ?? "Hindi"));
      return { ok: true };
    }
    case "open_file_tool": {
      ui.onOpenFileTool({
        targetKb: args.target_kb ? Number(args.target_kb) : undefined,
        format: args.format ? String(args.format) : undefined,
      });
      return { opened: true };
    }
    case "lookup_knowledge": {
      return { result: lookupKnowledge(String(args.query ?? "")) };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
