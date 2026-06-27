import ExpoModulesCore
import AVFoundation

/**
 * Low-latency UI sound-effects pool.
 *
 * Each clip is decoded ONCE into a PCM buffer at load time and played by
 * scheduling that buffer on one of a small pool of AVAudioPlayerNodes attached to
 * an always-running AVAudioEngine. Because nothing is decoded or "prepared" at
 * play time and the engine is already running, `play` is near-instant and — unlike
 * AVPlayer/AVAudioPlayer — has consistent latency, so a pop can land in sync with
 * an on-screen animation. The node pool lets rapid, overlapping pops play at once
 * instead of cutting each other off.
 *
 * JS side: modules/expo-sound-pool/index.ts (wrapped by components/ui/sound.ts).
 */
public class ExpoSoundPoolModule: Module {
  private let engine = AVAudioEngine()
  // All buffers are converted to one canonical format so every pool node can play
  // any clip without reconnecting the graph.
  private let canonicalFormat = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!
  private var buffers: [String: AVAudioPCMBuffer] = [:]
  private var players: [AVAudioPlayerNode] = []
  private var nextPlayer = 0
  private let poolSize = 8
  private var started = false
  private let lock = NSLock()

  public func definition() -> ModuleDefinition {
    Name("ExpoSoundPool")

    // Decode `uri` (a file:// path from expo-asset) into a PCM buffer under `name`.
    AsyncFunction("load") { (name: String, uri: String) -> Bool in
      return self.loadSound(name: name, uri: uri)
    }

    // Warm up the audio session + engine so the first play doesn't pay start cost.
    AsyncFunction("prime") { () -> Bool in
      self.ensureStarted()
      return self.engine.isRunning
    }

    Function("play") { (name: String, volume: Double) in
      self.playSound(name: name, volume: Float(volume))
    }

    OnDestroy {
      self.engine.stop()
    }
  }

  private func ensureStarted() {
    lock.lock(); defer { lock.unlock() }
    if started {
      if !engine.isRunning { try? engine.start() }
      return
    }
    configureSession()
    for _ in 0..<poolSize {
      let node = AVAudioPlayerNode()
      engine.attach(node)
      engine.connect(node, to: engine.mainMixerNode, format: canonicalFormat)
      players.append(node)
    }
    engine.prepare()
    do {
      try engine.start()
    } catch {
      return
    }
    for node in players { node.play() }
    started = true
  }

  private func configureSession() {
    // Play even when the ringer is on silent and mix with other audio (matches the
    // previous expo-audio behaviour). Best-effort: a failure just means quieter SFX.
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try? session.setActive(true)
  }

  private func loadSound(name: String, uri: String) -> Bool {
    let url: URL
    if uri.contains("://") {
      guard let parsed = URL(string: uri) else { return false }
      url = parsed
    } else {
      url = URL(fileURLWithPath: uri)
    }
    do {
      let file = try AVAudioFile(forReading: url)
      let format = file.processingFormat
      let frames = AVAudioFrameCount(file.length)
      guard frames > 0, let raw = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else {
        return false
      }
      try file.read(into: raw)
      guard let converted = convert(raw, to: canonicalFormat) else { return false }
      lock.lock()
      buffers[name] = converted
      lock.unlock()
      ensureStarted()
      return true
    } catch {
      return false
    }
  }

  private func convert(_ src: AVAudioPCMBuffer, to format: AVAudioFormat) -> AVAudioPCMBuffer? {
    if src.format == format { return src }
    guard let converter = AVAudioConverter(from: src.format, to: format) else { return nil }
    let ratio = format.sampleRate / src.format.sampleRate
    let capacity = AVAudioFrameCount(Double(src.frameLength) * ratio) + 4096
    guard capacity > 0, let out = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else {
      return nil
    }
    var consumed = false
    let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
      if consumed {
        outStatus.pointee = .endOfStream
        return nil
      }
      consumed = true
      outStatus.pointee = .haveData
      return src
    }
    var error: NSError?
    let status = converter.convert(to: out, error: &error, withInputFrom: inputBlock)
    if status == .error { return nil }
    return out
  }

  private func playSound(name: String, volume: Float) {
    lock.lock()
    let buffer = buffers[name]
    let isStarted = started
    lock.unlock()
    guard let buf = buffer else { return }
    if !isStarted || !engine.isRunning { ensureStarted() }
    guard engine.isRunning else { return }
    lock.lock()
    guard !players.isEmpty else { lock.unlock(); return }
    let node = players[nextPlayer]
    nextPlayer = (nextPlayer + 1) % players.count
    lock.unlock()
    node.volume = volume
    node.scheduleBuffer(buf, at: nil, options: .interrupts, completionHandler: nil)
    if !node.isPlaying { node.play() }
  }
}
