/**
 * ITMS Enterprise Notification Sound Engine
 * Provides internationally accepted, acoustically tuned, high-fidelity notification ringtones.
 * Pure Web Audio API synthesis: zero external audio assets, zero 404 risks, zero latency.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a warm acoustic harmonic note with physical overtones and soft mallet attack
   */
  playHarmonicNote(ctx, freq, startTime, duration = 0.65, baseGain = 0.16, filterCutoff = 3200) {
    try {
      // 1. Warm Biquad Lowpass Filter (eliminates digital harshness)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, startTime);
      filter.Q.setValueAtTime(1.2, startTime);
      filter.connect(ctx.destination);

      // 2. Note Envelope Gain (fast soft-attack, natural exponential decay)
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, startTime);
      // 8ms attack prevents speaker pop/click while maintaining crisp presence
      noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, baseGain), startTime + 0.008);
      // Smooth natural acoustic decay
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      noteGain.connect(filter);

      // 3. Acoustic Overtones (Fundamental, Octave, 12th Harmonic shimmer)
      const harmonics = [
        { mult: 1.0, amp: 1.0, type: 'sine' },
        { mult: 2.0, amp: 0.32, type: 'sine' },
        { mult: 3.015, amp: 0.12, type: 'sine' }, // slight detune creates warm acoustic richness
        { mult: 4.0, amp: 0.04, type: 'sine' }
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = h.type;
        osc.frequency.setValueAtTime(freq * h.mult, startTime);
        g.gain.setValueAtTime(h.amp, startTime);
        osc.connect(g);
        g.connect(noteGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Harmonic note synthesis error:', e);
    }
  }

  /**
   * Sound Profile 1: Executive Aurora Chime (Default)
   * Warm, uplifting 3-note ascending triad (Eb5 -> Ab5 -> C6)
   * The signature enterprise notification chime.
   */
  playAurora(volume = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.16 * volume;

    // Eb5 (622.25 Hz)
    this.playHarmonicNote(ctx, 622.25, now, 0.55, vol, 3400);
    // Ab5 (830.61 Hz)
    this.playHarmonicNote(ctx, 830.61, now + 0.12, 0.65, vol * 1.05, 3600);
    // C6 (1046.50 Hz) - resonant resolution
    this.playHarmonicNote(ctx, 1046.50, now + 0.24, 0.90, vol * 1.15, 3800);
  }

  /**
   * Sound Profile 2: Celestial Crystal Ping
   * Crisp, modern dual-tone glass ping (E5 -> B5) with a luminous bell shimmer
   */
  playCrystal(volume = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.15 * volume;

    this.playHarmonicNote(ctx, 659.25, now, 0.50, vol, 4200);
    this.playHarmonicNote(ctx, 987.77, now + 0.10, 0.85, vol * 1.1, 4500);
  }

  /**
   * Sound Profile 3: Warm Marimba Lift
   * Organic, acoustic wooden mallet tones (G4 -> D5 -> G5)
   */
  playMarimba(volume = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.17 * volume;

    this.playHarmonicNote(ctx, 392.00, now, 0.40, vol, 2200);
    this.playHarmonicNote(ctx, 587.33, now + 0.11, 0.50, vol * 1.05, 2400);
    this.playHarmonicNote(ctx, 783.99, now + 0.22, 0.75, vol * 1.1, 2600);
  }

  /**
   * Sound Profile 4: Subtle Executive Pulse
   * Minimalist discreet ping (A5 -> C#6) for quiet open offices
   */
  playPulse(volume = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.12 * volume;

    this.playHarmonicNote(ctx, 880.00, now, 0.45, vol, 2800);
    this.playHarmonicNote(ctx, 1108.73, now + 0.08, 0.60, vol * 0.9, 3000);
  }

  /**
   * Main dispatch method by profile name
   */
  play(profileName = 'aurora', volume = 0.8) {
    switch (profileName) {
      case 'crystal':
        this.playCrystal(volume);
        break;
      case 'marimba':
        this.playMarimba(volume);
        break;
      case 'pulse':
        this.playPulse(volume);
        break;
      case 'aurora':
      default:
        this.playAurora(volume);
        break;
    }
  }
}

export const soundEngine = new SoundEngine();

export const SOUND_PROFILES = [
  {
    id: 'aurora',
    name: 'Executive Aurora Chime',
    nameAm: 'ኤክስኪዩቲቭ አውሮራ ቃጭል',
    tag: 'RECOMMENDED',
    desc: 'Lush, uplifting 3-note harmonic triad with warm acoustic resonance',
    descAm: 'ሞቅ ያለ እና የሚያረጋጋ ባለ 3 ኖት የተስማማ የቃጭል ድምጽ'
  },
  {
    id: 'crystal',
    name: 'Celestial Crystal Ping',
    nameAm: 'ክሪስታል ፒንግ',
    tag: 'CRISP',
    desc: 'Luminous dual-tone high-tech glass ping with subtle bell shimmer',
    descAm: 'ግልጽ እና ዘመናዊ ባለ ሁለት ኖት የብርጭቆ ድምጽ'
  },
  {
    id: 'marimba',
    name: 'Warm Marimba Lift',
    nameAm: 'የማሪምባ ድምጽ',
    tag: 'ORGANIC',
    desc: 'Deep wooden acoustic mallet tone with soothing, natural decay',
    descAm: 'ተፈጥሯዊ እና ለስላሳ የእንጨት ማሪምባ ቃጭል'
  },
  {
    id: 'pulse',
    name: 'Subtle Executive Pulse',
    nameAm: 'ስውር የቢሮ ድምጽ',
    tag: 'DISCREET',
    desc: 'Minimalist quiet tone designed for shared open-office environments',
    descAm: 'ለጋራ የቢሮ አካባቢ ተስማሚ የሆነ ለስላሳ ድምጽ'
  }
];

export default soundEngine;
