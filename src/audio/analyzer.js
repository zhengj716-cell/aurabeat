/**
 * AudioAnalyzer —— 统一音频分析模块
 * 三种输入源（本地文件 / 演示曲 / 麦克风）都汇聚到这里，
 * 对外输出统一的频谱与能量数据，可视化层完全不关心来源。
 */

export class AudioAnalyzer {
  constructor() {
    /** @type {AudioContext} */
    this.ctx = null;
    /** @type {AnalyserNode} */
    this.analyser = null;

    // 音源节点（文件/演示曲共用 buffer source，麦克风用 media stream source）
    this.bufferSource = null;
    this.mediaStream = null;
    this.streamSource = null;

    /** @type {AudioBuffer|null} */
    this.buffer = null;
    this.duration = 0;
    this.startedAt = 0;       // context.currentTime 时刻
    this.pausedAt = 0;        // 暂停时的累计播放位置（秒）
    this.isPlaying = false;
    this.isMic = false;

    // 频谱数据（复用数组避免 GC）
    this._freqData = null;
    this._timeData = null;

    // 节拍检测状态
    this._beatHistory = [];
    this._lastBeatAt = 0;

    // 当前能量（平滑后的）
    this.level = 0;

    // 灵敏度（由 UI 传入，但这里保存一份供节拍阈值用）
    this.sensitivity = 1;

    // 输出数据结构（每帧更新后由 getData 返回）
    this._out = {
      spectrum: null,   // Uint8Array 128 段频谱
      bass: 0,          // 0~1 低频能量（重低音脉冲）
      mid: 0,           // 0~1 中频（旋律/人声）
      treble: 0,        // 0~1 高频（镲片/细节）
      level: 0,         // 0~1 总响度
      beat: false,      // 这一帧是否是节拍
      beatIntensity: 0, // 节拍强度 0~1
      time: 0,          // 当前播放秒数
      duration: 0,
    };
  }

  /** 懒创建 AudioContext（必须在用户手势里调用） */
  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256; // 128 段频谱，够用且开销小
      this.analyser.smoothingTimeConstant = 0.75;
      this._freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this._timeData = new Uint8Array(this.analyser.frequencyBinCount);
      this._out.spectrum = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** 停止并清空当前音源 */
  _teardownSource() {
    try {
      if (this.bufferSource) {
        this.bufferSource.onended = null;
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      }
    } catch { /* 已停止则忽略 */ }
    try {
      if (this.streamSource) this.streamSource.disconnect();
    } catch { /* ignore */ }
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      }
    } catch { /* ignore */ }
    this.bufferSource = null;
    this.streamSource = null;
    this.mediaStream = null;
    this.isPlaying = false;
    this.isMic = false;
  }

  /** 加载本地文件 */
  async loadFile(file) {
    const ctx = this._ensureCtx();
    const arrayBuf = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuf);
    this._teardownSource();
    this.buffer = buffer;
    this.duration = buffer.duration;
    this.isMic = false;
    return { name: file.name, duration: buffer.duration };
  }

  /** 加载内置演示曲（程序合成） */
  loadDemoBuffer(buffer) {
    const ctx = this._ensureCtx();
    this._teardownSource();
    this.buffer = buffer;
    this.duration = buffer.duration;
    this.isMic = false;
    return { name: '内置演示曲 · Neon Drive', duration: buffer.duration };
  }

  /** 启动麦克风输入 */
  async startMic() {
    const ctx = this._ensureCtx();
    this._teardownSource();
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.streamSource = ctx.createMediaStreamSource(this.mediaStream);
    this.streamSource.connect(this.analyser);
    this.isMic = true;
    this.buffer = null;
    this.duration = 0;
    this.pausedAt = 0;
  }

  /** 从 buffer 起播（文件/演示曲共用） */
  playBuffer(offsetSec = 0) {
    if (!this.buffer) return;
    const ctx = this._ensureCtx();
    this._teardownSource();
    this.bufferSource = ctx.createBufferSource();
    this.bufferSource.buffer = this.buffer;
    this.bufferSource.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.bufferSource.start(0, offsetSec);
    this.startedAt = ctx.currentTime - offsetSec;
    this.pausedAt = 0;
    this.isPlaying = true;
    this.isMic = false;
    this.bufferSource.onended = () => {
      // 自然播完
      if (this.isPlaying && !this.isMic) {
        this.isPlaying = false;
        this.pausedAt = 0;
      }
    };
  }

  playMic() {
    const ctx = this._ensureCtx();
    // 麦克风源已连接 analyser，确保 analyser 也接到 destination 能监听
    if (this.analyser) this.analyser.connect(ctx.destination);
    this.isPlaying = true;
    this.isMic = true;
  }

  pause() {
    if (!this.isPlaying) return;
    if (this.isMic) {
      this.isPlaying = false;
      return;
    }
    this.pausedAt = this.getTime();
    this.isPlaying = false;
    try { this.bufferSource.stop(); } catch { /* ignore */ }
  }

  resume() {
    if (this.isPlaying || !this.buffer) return;
    this.playBuffer(this.pausedAt);
  }

  seek(sec) {
    if (!this.buffer || this.isMic) return;
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      try { this.bufferSource.stop(); } catch { /* ignore */ }
    }
    this.pausedAt = sec;
    if (wasPlaying) this.playBuffer(sec);
  }

  getTime() {
    if (this.isMic) return 0;
    if (!this.isPlaying) return Math.min(this.pausedAt, this.duration || 0);
    const t = this.ctx.currentTime - this.startedAt;
    return Math.min(t, this.duration || 0);
  }

  /**
   * 每帧调用：更新频谱/能量/节拍数据
   * @param {number} dt 距上帧秒数
   */
  update(dt) {
    const out = this._out;
    if (!this.analyser) {
      out.bass = out.mid = out.treble = out.level = 0;
      out.beat = false;
      return out;
    }

    this.analyser.getByteFrequencyData(this._freqData);
    this.analyser.getByteTimeDomainData(this._timeData);

    const n = this._freqData.length; // 128
    const spectrum = out.spectrum;
    for (let i = 0; i < n; i++) spectrum[i] = this._freqData[i];

    // 分段能量（归一化 0~1）
    const bass = avgRange(this._freqData, 1, 12) / 255;
    const mid = avgRange(this._freqData, 12, 48) / 255;
    const treble = avgRange(this._freqData, 48, 96) / 255;
    const level = (bass * 0.5 + mid * 0.3 + treble * 0.2);

    // 平滑总响度（attack 快 release 慢，视觉上更跟手）
    const target = Math.min(1, level * this.sensitivity * 1.6);
    this.level += (target - this.level) * (target > this.level ? 0.5 : 0.08);

    out.bass = Math.min(1, bass * this.sensitivity * 2);
    out.mid = Math.min(1, mid * this.sensitivity * 1.6);
    out.treble = Math.min(1, treble * this.sensitivity * 1.4);
    out.level = this.level;

    // 节拍检测：低频能量突增
    const now = this.ctx.currentTime;
    this._beatHistory.push(bass);
    if (this._beatHistory.length > 43) this._beatHistory.shift(); // ~1 秒历史 (43 帧 @60fps)

    const avg = this._beatHistory.reduce((a, b) => a + b, 0) / this._beatHistory.length;
    const threshold = Math.max(0.12, avg * 1.35);
    const cooldown = 0.12; // 最短间隔，防止连击

    if (bass > threshold && now - this._lastBeatAt > cooldown && bass > 0.05) {
      this._lastBeatAt = now;
      out.beat = true;
      out.beatIntensity = Math.min(1, (bass - threshold) * 6);
    } else {
      out.beat = false;
      out.beatIntensity = Math.max(0, out.beatIntensity - dt * 3);
    }

    out.time = this.getTime();
    out.duration = this.duration;
    return out;
  }

  /** 释放所有资源 */
  dispose() {
    this._teardownSource();
    if (this.ctx) this.ctx.close();
  }
}

function avgRange(arr, from, to) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += arr[i];
  return sum / (to - from);
}
