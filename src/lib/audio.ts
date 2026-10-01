/**
 * Web Audio API synthesizer for study chimes and ambient focus sounds.
 * Generates smooth audio natively in the browser without external audio assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant academic completion chime (harmonic bell)
 */
export function playCompletionChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const fundamentalFrequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord

    fundamentalFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  } catch (err) {
    console.warn("Audio playback not allowed yet:", err);
  }
}

/**
 * Ambient background noise generator (Brownian focus noise / soft white noise)
 */
let ambientNode: AudioNode | null = null;
let ambientGain: GainNode | null = null;

export function startAmbientNoise(type: "brown" | "pink" | "soft" = "brown", volume = 0.08) {
  try {
    stopAmbientNoise();
    const ctx = getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "brown") {
        // Brown noise: Integrate white noise (smooth, warm low frequencies like rainfall)
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        // Soft noise
        output[i] = white * 0.4;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to soften the sound
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(type === "brown" ? 400 : 800, ctx.currentTime);

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(volume, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    whiteNoise.start();
    ambientNode = whiteNoise;
  } catch (err) {
    console.warn("Ambient sound error:", err);
  }
}

export function stopAmbientNoise() {
  if (ambientNode) {
    try {
      (ambientNode as any).stop?.();
      ambientNode.disconnect();
    } catch (e) {
      // ignore
    }
    ambientNode = null;
  }
  if (ambientGain) {
    try {
      ambientGain.disconnect();
    } catch (e) {
      // ignore
    }
    ambientGain = null;
  }
}
