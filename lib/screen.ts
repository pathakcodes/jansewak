/**
 * Screen-share capture for guide mode: grabs the user's chosen tab/window via
 * getDisplayMedia and streams JPEG frames to the live session.
 *
 * Frames are sent only when the screen actually changes (tiny luma-signature
 * diff), with a periodic heartbeat — a static page no longer floods the
 * model's context with identical images (which ballooned latency over time).
 * capture() is driven externally (mic-thread tick, ~1s) so it keeps working
 * while this tab is backgrounded; an internal interval is only a fallback.
 */
export class ScreenShare {
  stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private sigCanvas: HTMLCanvasElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onFrame: ((base64Jpeg: string) => void) | null = null;
  private lastSig: Uint8ClampedArray | null = null;
  private lastCaptureAt = 0;
  private lastSentAt = 0;
  private encoding = false;
  onEnded: (() => void) | null = null;

  private static readonly MIN_CAPTURE_MS = 900;
  private static readonly HEARTBEAT_MS = 10000;
  private static readonly DIFF_THRESHOLD = 4; // mean abs luma diff, 0-255

  get active(): boolean {
    return !!this.stream;
  }

  async start(onFrame: (base64Jpeg: string) => void): Promise<MediaStream> {
    this.onFrame = onFrame;
    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 5 },
      audio: false,
      // Prefer sharing a browser tab; hint supported in Chromium.
      // @ts-expect-error - not yet in TS lib
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
    });

    this.video = document.createElement("video");
    this.video.srcObject = this.stream;
    this.video.muted = true;
    await this.video.play();

    this.canvas = document.createElement("canvas");
    this.sigCanvas = document.createElement("canvas");
    this.sigCanvas.width = 32;
    this.sigCanvas.height = 18;

    const track = this.stream.getVideoTracks()[0];
    track.addEventListener("ended", () => {
      this.stop();
      this.onEnded?.();
    });

    setTimeout(() => this.capture(true), 300);
    // Fallback driver (throttled in background tabs; the mic tick is primary).
    this.timer = setInterval(() => this.capture(), 2000);
    return this.stream;
  }

  /** Capture a frame; send it only if the screen changed (or forced/heartbeat). */
  capture(force = false) {
    const now = performance.now();
    if (!this.video || !this.canvas || !this.sigCanvas || this.video.videoWidth === 0 || this.encoding) return;
    if (!force && now - this.lastCaptureAt < ScreenShare.MIN_CAPTURE_MS) return;
    this.lastCaptureAt = now;

    // Cheap change detection on a 32x18 luma signature.
    const sctx = this.sigCanvas.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;
    sctx.drawImage(this.video, 0, 0, 32, 18);
    const px = sctx.getImageData(0, 0, 32, 18).data;
    const sig = new Uint8ClampedArray(32 * 18);
    for (let i = 0; i < sig.length; i++) {
      const o = i * 4;
      sig[i] = (px[o] * 3 + px[o + 1] * 4 + px[o + 2]) >> 3;
    }
    let changed = true;
    if (this.lastSig) {
      let diff = 0;
      for (let i = 0; i < sig.length; i++) diff += Math.abs(sig[i] - this.lastSig[i]);
      changed = diff / sig.length > ScreenShare.DIFF_THRESHOLD;
    }
    this.lastSig = sig;

    const heartbeat = now - this.lastSentAt > ScreenShare.HEARTBEAT_MS;
    if (!force && !changed && !heartbeat) return;
    this.lastSentAt = now;

    const maxW = 1024;
    const scale = Math.min(1, maxW / this.video.videoWidth);
    const w = Math.round(this.video.videoWidth * scale);
    const h = Math.round(this.video.videoHeight * scale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(this.video, 0, 0, w, h);

    // Async JPEG encode keeps the main thread free — a synchronous
    // toDataURL here caused audible jitter in the voice pipeline.
    this.encoding = true;
    this.canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.encoding = false;
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          this.encoding = false;
          const dataUrl = reader.result as string;
          this.onFrame?.(dataUrl.slice(dataUrl.indexOf(",") + 1));
        };
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.6,
    );
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video?.remove();
    this.video = null;
    this.canvas = null;
    this.sigCanvas = null;
    this.lastSig = null;
    this.onFrame = null;
  }
}
