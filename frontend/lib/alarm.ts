/**
 * Web Audio API Siren & Sound Synthesizer.
 * Creates an authentic emergency dual-frequency siren without external media assets.
 */

class AlarmController {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private sirenInterval: any = null;
  private isHighPitch: boolean = false;
  private _isPlaying: boolean = false;
  private _isMuted: boolean = false;

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get isMuted(): boolean {
    return this._isMuted;
  }

  public setMuted(muted: boolean): void {
    this._isMuted = muted;
    if (this._isPlaying && this.gainNode) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.25, this.audioCtx?.currentTime || 0);
    }
  }

  public startSiren(): void {
    if (this._isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5

      const initialVolume = this._isMuted ? 0 : 0.25;
      this.gainNode.gain.setValueAtTime(initialVolume, this.audioCtx.currentTime);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();
      this._isPlaying = true;

      // Alternating frequency siren: 880Hz <-> 660Hz
      this.sirenInterval = setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        this.isHighPitch = !this.isHighPitch;
        const targetFreq = this.isHighPitch ? 880 : 660;
        this.oscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.05);
      }, 350);
    } catch (e) {
      console.warn("Audio Context could not start:", e);
    }
  }

  public stopSiren(): void {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioCtx) {
        this.audioCtx.close();
        this.audioCtx = null;
      }
    } catch (e) {
      // Ignored
    } finally {
      this._isPlaying = false;
    }
  }

  public testBeep(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Test beep failed:", e);
    }
  }
}

export const alarmController = new AlarmController();
