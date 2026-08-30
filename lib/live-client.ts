"use client";

import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from "@google/genai";
import { MicCapture, SpeakerPlayback } from "./audio";
import { buildSystemInstruction } from "./prompts";
import { loadProfile, profileToPromptText } from "./profile";
import { dispatchToolCall, functionDeclarations, ToolUIHandlers } from "./tools";

export type SessionStatus = "idle" | "connecting" | "live" | "error" | "closed";

export interface TranscriptEntry {
  id: number;
  role: "user" | "agent";
  text: string;
  final: boolean;
}

export interface LiveClientEvents extends ToolUIHandlers {
  onStatus: (status: SessionStatus, detail?: string) => void;
  onTranscript: (entries: TranscriptEntry[]) => void;
  onSpeakingChange: (speaking: boolean) => void;
  /** Fires roughly once per second, driven by the mic audio thread. */
  onMicTick?: () => void;
}

export class JanSewakLive {
  private session: Session | null = null;
  private mic = new MicCapture();
  readonly playback = new SpeakerPlayback();
  private events: LiveClientEvents;
  private transcript: TranscriptEntry[] = [];
  private entryId = 0;
  private currentUser: TranscriptEntry | null = null;
  private currentAgent: TranscriptEntry | null = null;
  private resumptionHandle: string | null = null;
  private closingIntentionally = false;
  private micChunks = 0;
  private open = false;
  private audioStarted = false;
  private reconnectAttempts = 0;
  private lastLanguage = "Hindi";
  private model = "";
  status: SessionStatus = "idle";

  constructor(events: LiveClientEvents) {
    this.events = events;
  }

  private setStatus(status: SessionStatus, detail?: string) {
    this.status = status;
    this.events.onStatus(status, detail);
  }

  /** Sends only while the socket is open; a dead session drops input silently. */
  private safeSend(input: Parameters<Session["sendRealtimeInput"]>[0]) {
    if (!this.open || !this.session) return;
    try {
      this.session.sendRealtimeInput(input);
    } catch {
      this.open = false;
    }
  }

  async connect(language: string): Promise<void> {
    this.closingIntentionally = false;
    this.lastLanguage = language;
    this.setStatus("connecting");

    let token: string, model: string;
    try {
      const res = await fetch("/api/token");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token request failed");
      token = data.token;
      model = data.model;
    } catch (err) {
      // During a reconnect, a transient token failure shouldn't end the session.
      if (this.reconnectAttempts > 0 && this.reconnectAttempts < 3 && !this.closingIntentionally) {
        this.reconnectAttempts++;
        setTimeout(() => {
          if (!this.closingIntentionally) void this.connect(language);
        }, 1000 * this.reconnectAttempts);
        return;
      }
      this.setStatus("error", err instanceof Error ? err.message : "Could not reach the token service.");
      return;
    }
    this.model = model;

    try {
      // Audio pipelines survive reconnects — only start them once.
      if (!this.audioStarted) await this.playback.start();

      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      this.session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: buildSystemInstruction(language, profileToPromptText(loadProfile())),
          tools: [{ googleSearch: {} }, { functionDeclarations }],
          // Read screen frames at a useful detail level for form/button text.
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          // Measured: thinking off + no proactivity gives ~3.0s to first audio
          // vs ~4.7s with proactiveAudio and default thinking. Silence
          // discipline is handled by the system prompt instead.
          thinkingConfig: { thinkingBudget: 0 },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {},
          contextWindowCompression: { slidingWindow: {} },
        },
        callbacks: {
          onopen: () => {
            this.open = true;
            this.reconnectAttempts = 0;
            this.setStatus("live");
          },
          onmessage: (msg) => this.handleMessage(msg),
          onerror: (e) => {
            // onclose follows and owns status/reconnect decisions.
            console.error("Live session error", e);
          },
          onclose: (e) => {
            this.open = false;
            this.playback.flush();
            this.events.onSpeakingChange(false);
            if (this.closingIntentionally) return;
            const reason = e?.reason || "Connection lost";
            // Sessions on the preview model occasionally die ("Internal error
            // occurred."). Reconnect with the resumption handle so the
            // conversation continues where it left off.
            if (this.reconnectAttempts < 3) {
              this.reconnectAttempts++;
              this.setStatus("connecting", `फिर से जुड़ रही हूँ… reconnecting (${this.reconnectAttempts}/3)`);
              setTimeout(() => {
                if (!this.closingIntentionally) void this.connect(this.lastLanguage);
              }, 700 * this.reconnectAttempts);
            } else {
              this.setStatus("closed", reason);
            }
          },
        },
      });

      if (!this.audioStarted) {
        this.audioStarted = true;
        await this.mic.start((base64Pcm, rms) => {
          // ~1s heartbeat driven by the audio thread. Unlike setInterval, this
          // keeps firing when the tab is backgrounded (user is on the govt
          // site's tab), so screen captures stay regular in guide mode.
          if (++this.micChunks % 8 === 0) this.events.onMicTick?.();
          // Echo gate: Chrome's echo cancellation does not reliably remove
          // WebAudio playback from the mic. While the agent is speaking, only
          // forward clearly-loud audio (a deliberate interruption) — otherwise
          // her own voice loops back and the server VAD never ends the turn.
          if (this.playback.isSpeaking && rms < 0.04) return;
          this.safeSend({ audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" } });
        });
      }
    } catch (err) {
      console.error("Failed to start live session", err);
      this.setStatus(
        "error",
        err instanceof Error ? err.message : "Could not start the voice session. Check mic permission.",
      );
      this.disconnect();
    }
  }

  private pushTranscript() {
    this.events.onTranscript([...this.transcript]);
  }

  private handleMessage(msg: LiveServerMessage) {
    const content = msg.serverContent;

    if (content?.inputTranscription?.text) {
      if (!this.currentUser) {
        this.currentUser = { id: ++this.entryId, role: "user", text: "", final: false };
        this.transcript.push(this.currentUser);
      }
      this.currentUser.text += content.inputTranscription.text;
      this.pushTranscript();
    }

    if (content?.outputTranscription?.text) {
      if (!this.currentAgent) {
        this.currentAgent = { id: ++this.entryId, role: "agent", text: "", final: false };
        this.transcript.push(this.currentAgent);
      }
      this.currentAgent.text += content.outputTranscription.text;
      this.pushTranscript();
    }

    if (content?.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.data) {
          this.playback.enqueue(part.inlineData.data);
          this.events.onSpeakingChange(true);
        }
      }
    }

    if (content?.interrupted) {
      this.playback.flush();
      this.events.onSpeakingChange(false);
    }

    if (content?.turnComplete) {
      if (this.currentUser) this.currentUser.final = true;
      if (this.currentAgent) this.currentAgent.final = true;
      this.currentUser = null;
      this.currentAgent = null;
      this.pushTranscript();
      this.events.onSpeakingChange(false);
    }

    if (msg.toolCall?.functionCalls) {
      const responses = msg.toolCall.functionCalls.map((fc) => ({
        id: fc.id,
        name: fc.name,
        response: dispatchToolCall(fc.name ?? "", (fc.args ?? {}) as Record<string, unknown>, this.events),
      }));
      try {
        this.session?.sendToolResponse({ functionResponses: responses });
      } catch {
        /* session died mid-call; reconnect flow handles it */
      }
    }

    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      this.resumptionHandle = msg.sessionResumptionUpdate.newHandle;
    }

    if (msg.goAway) {
      // Server is about to drop us; note it so the UI can offer reconnect.
      console.warn("Live session goAway; timeLeft:", msg.goAway.timeLeft);
    }
  }

  sendScreenFrame(base64Jpeg: string) {
    this.safeSend({ video: { data: base64Jpeg, mimeType: "image/jpeg" } });
  }

  /** Send a typed text message (used for quick prompts / accessibility). */
  sendText(text: string) {
    this.safeSend({ text });
  }

  setMicMuted(muted: boolean) {
    this.mic.setMuted(muted);
    if (muted) this.safeSend({ audioStreamEnd: true });
  }

  get modelName() {
    return this.model;
  }

  disconnect() {
    this.closingIntentionally = true;
    this.open = false;
    this.audioStarted = false;
    this.mic.stop();
    this.playback.stop();
    try {
      this.session?.close();
    } catch {
      /* already closed */
    }
    this.session = null;
    this.setStatus("idle");
  }
}
