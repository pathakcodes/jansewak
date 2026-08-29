/**
 * Screen-share capture for guide mode: grabs the user's chosen tab/window via
 * getDisplayMedia and streams ~1 JPEG frame per second to the live session.
 */
export class ScreenShare {
  stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  onEnded: (() => void) | null = null;

  get active(): boolean {
    return !!this.stream;
  }

  async start(onFrame: (base64Jpeg: string) => void): Promise<MediaStream> {
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
    const track = this.stream.getVideoTracks()[0];
    track.addEventListener("ended", () => {
      this.stop();
      this.onEnded?.();
    });

    // Async JPEG encode (toBlob) keeps the main thread free — a synchronous
    // toDataURL here caused audible jitter in the voice pipeline.
    let encoding = false;
    const capture = () => {
      if (!this.video || !this.canvas || this.video.videoWidth === 0 || encoding) return;
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
      encoding = true;
      this.canvas.toBlob(
        (blob) => {
          if (!blob) {
            encoding = false;
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            encoding = false;
            const dataUrl = reader.result as string;
            onFrame(dataUrl.slice(dataUrl.indexOf(",") + 1));
          };
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.6,
      );
    };

    // First frame right away, then ~1fps (Live API limit for images).
    setTimeout(capture, 300);
    this.timer = setInterval(capture, 1000);
    return this.stream;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video?.remove();
    this.video = null;
    this.canvas = null;
  }
}
