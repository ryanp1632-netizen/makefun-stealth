// Every sound in HUSHWATER is synthesized here with WebAudio (no sound files): guards' footsteps
// panned to where they walk and quieter the further away, the "?" and "!" stings, pebble clinks,
// the ledger chime, the escape chord and the lapping canal under it all.
let audio = null;
let master = null;
let noise = null;

function noiseBuffer() {
  if (!noise) {
    noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < data.length; i += 1) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647) * 2 - 1;
    }
  }
  return noise;
}

function startCanal() {
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 260;
  const gain = audio.createGain();
  gain.gain.value = 0.05;
  const lfo = audio.createOscillator();
  lfo.frequency.value = 0.18;
  const depth = audio.createGain();
  depth.gain.value = 0.03;
  lfo.connect(depth).connect(gain.gain);
  src.connect(filter).connect(gain).connect(master);
  src.start();
  lfo.start();
}

/** Browsers only allow sound after a key press or click: call this from one. */
export function unlockAudio() {
  try {
    if (!audio) {
      audio = new AudioContext();
      master = audio.createGain();
      master.gain.value = 0.55;
      master.connect(audio.destination);
      startCanal();
    }
    if (audio.state === 'suspended') audio.resume();
  } catch {
    audio = null;
  }
}

function tone(freq, start, length, type, volume, endFreq) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

function burst(start, length, freq, q, volume, pan) {
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer();
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  const panner = audio.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  src.connect(filter).connect(gain).connect(panner).connect(master);
  src.start(start, Math.random() * 0.5, length + 0.05);
}

/** A guard's footstep: pan = where it is left/right of the thief, near = 0..1 loudness by distance. */
export function playFootstep(pan, near, hound) {
  if (!audio || near <= 0) return;
  burst(audio.currentTime, hound ? 0.05 : 0.09, hound ? 1400 : 520, hound ? 3 : 1.6, 0.5 * near, pan);
}

export function playCue(kind) {
  if (!audio) return;
  const t = audio.currentTime;
  switch (kind) {
    case 'suspect':
      tone(520, t, 0.14, 'triangle', 0.18);
      tone(700, t + 0.12, 0.2, 'triangle', 0.18);
      break;
    case 'alert':
      tone(880, t, 0.3, 'sawtooth', 0.16, 440);
      tone(660, t + 0.05, 0.35, 'square', 0.08, 330);
      break;
    case 'nearMiss':
      tone(600, t, 0.4, 'sine', 0.12, 380);
      break;
    case 'pebble':
      tone(2400, t, 0.12, 'sine', 0.2);
      tone(3150, t + 0.07, 0.1, 'sine', 0.14);
      burst(t, 0.06, 3000, 4, 0.3, 0);
      break;
    case 'throw':
      burst(t, 0.18, 900, 0.8, 0.12, 0);
      break;
    case 'ledger':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.3, 'sine', 0.16));
      break;
    case 'escape':
      [392, 494, 587, 784].forEach((f) => tone(f, t, 1.2, 'triangle', 0.1));
      break;
    case 'caught':
      tone(140, t, 0.6, 'sawtooth', 0.22, 60);
      burst(t, 0.3, 200, 1, 0.4, 0);
      break;
    case 'hide':
      tone(180, t, 0.15, 'sine', 0.25, 90);
      break;
    case 'step':
      burst(t, 0.05, 700, 2, 0.1, 0);
      break;
    case 'run':
      burst(t, 0.07, 500, 1.4, 0.22, 0);
      break;
    default:
      break;
  }
}
