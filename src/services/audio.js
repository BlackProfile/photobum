// Web Audio API Retro Camera Sound Synthesizer
// Zero external MP3 dependencies, instant latency, works everywhere

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Realistic analog mechanical camera shutter sound
 * Combines white noise bursts + resonant decay + mirror slap
 */
export function playShutterSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 1. Shutter Release Click (Metallic snap)
    const snapOsc = ctx.createOscillator()
    const snapGain = ctx.createGain()
    snapOsc.type = 'triangle'
    snapOsc.frequency.setValueAtTime(1400, now)
    snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04)

    snapGain.gain.setValueAtTime(0.5, now)
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04)

    snapOsc.connect(snapGain)
    snapGain.connect(ctx.destination)
    snapOsc.start(now)
    snapOsc.stop(now + 0.05)

    // 2. Mechanical Blade Curtain (Filtered Noise)
    const bufferSize = ctx.sampleRate * 0.09
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(2200, now)
    noiseFilter.Q.setValueAtTime(3, now)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.7, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    whiteNoise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    whiteNoise.start(now)

    // 3. Mirror Slap Thud (Low resonant frequency)
    const mirrorOsc = ctx.createOscillator()
    const mirrorGain = ctx.createGain()
    mirrorOsc.type = 'sine'
    mirrorOsc.frequency.setValueAtTime(160, now + 0.03)
    mirrorOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12)

    mirrorGain.gain.setValueAtTime(0.8, now + 0.03)
    mirrorGain.gain.exponentialRampToValueAtTime(0.01, now + 0.13)

    mirrorOsc.connect(mirrorGain)
    mirrorGain.connect(ctx.destination)
    mirrorOsc.start(now + 0.03)
    mirrorOsc.stop(now + 0.14)

    // Optional haptic vibration on phones
    if (navigator.vibrate) {
      navigator.vibrate([35, 20, 50])
    }
  } catch (err) {
    console.warn('Could not play shutter sound:', err)
  }
}

/**
 * Countdown timer beep (3, 2, 1)
 */
export function playCountdownBeep(isFinal = false) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(isFinal ? 1200 : 880, now)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinal ? 0.25 : 0.1))

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + (isFinal ? 0.26 : 0.12))

    if (navigator.vibrate) {
      navigator.vibrate(isFinal ? [60, 40, 80] : 30)
    }
  } catch (err) {
    console.warn('Could not play countdown beep:', err)
  }
}

/**
 * Film advance winder sound
 */
export function playFilmWindingSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.linearRampToValueAtTime(420, now + 0.15)
    osc.frequency.linearRampToValueAtTime(310, now + 0.3)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.31)
  } catch (err) {
    console.warn('Could not play winder sound:', err)
  }
}
