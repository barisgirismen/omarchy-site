const BANDS = 32
const FFT_SIZE = 64

/**
 * Web Audio analyser: 32 frequency bands and a short beat pulse, the same
 * feed Barış's shader used. TTFX has no audio input, so the field applies
 * this to the cells laseretch has already lit.
 */
export type AudioReactive = {
  bands: Float32Array
  /** 0..1 onset pulse, decays over a few hundred milliseconds. */
  beat: number
  unlock: () => void
  connect: (source: HTMLMediaElement | MediaStream) => void
  sample: (now: number) => void
  close: () => void
}

export function createAudioReactive(): AudioReactive {
  const bands = new Float32Array(BANDS)
  let beat = 0
  let ctx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: AudioNode | null = null
  let bins: Uint8Array<ArrayBuffer> | null = null
  let avg = 0
  let lastOnset = 0

  const ensure = () => {
    if (ctx) return ctx
    const AudioCtx =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    analyser.smoothingTimeConstant = 0.7
    bins = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    return ctx
  }

  return {
    bands,
    get beat() {
      return beat
    },
    unlock() {
      const audio = ensure()
      void audio?.resume()
    },
    connect(source) {
      const audio = ensure()
      if (!audio || !analyser) return
      sourceNode?.disconnect()
      if (source instanceof MediaStream) {
        sourceNode = audio.createMediaStreamSource(source)
      } else {
        sourceNode = audio.createMediaElementSource(source)
        sourceNode.connect(audio.destination)
      }
      sourceNode.connect(analyser)
    },
    sample(now) {
      if (!analyser || !bins) {
        bands.fill(0)
        beat *= 0.9
        return
      }
      analyser.getByteFrequencyData(bins)
      const count = Math.min(BANDS, bins.length)
      let bass = 0
      for (let i = 0; i < count; i++) {
        const v = (bins[i] ?? 0) / 255
        bands[i] = v
        if (i < 4) bass += v
      }
      bass /= 4
      avg = avg * 0.92 + bass * 0.08
      if (bass > avg * 1.35 && bass > 0.12 && now - lastOnset > 180) {
        beat = 1
        lastOnset = now
      } else {
        beat = Math.max(0, beat - 0.08)
      }
    },
    close() {
      sourceNode?.disconnect()
      void ctx?.close()
      sourceNode = null
      analyser = null
      ctx = null
      bins = null
    },
  }
}
