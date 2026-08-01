/**
 * demoTrack —— 程序化合成内置演示曲
 * 用 Web Audio 在内存里合成一段 120BPM 的电子乐（32 秒），
 * 零外部文件、零版权问题，而且节拍极其清晰，可视化效果拉满。
 * 结构：Kick 四拍 + Snare 反拍 + HiHat 半拍 + 和弦 Pad（Am→F→C→G 循环）
 */

const BPM = 120;
const BEAT = 60 / BPM;      // 0.5 秒/拍
const BAR = BEAT * 4;       // 2 秒/小节
const BARS = 16;            // 32 秒
const SR = 44100;

// Am F C G 的根音与三和弦（提供低音与 Pad）
const CHORDS = [
  { root: 110.0, notes: [220.0, 261.63, 329.63] },   // Am
  { root: 87.31, notes: [174.61, 220.0, 261.63] },   // F
  { root: 65.41, notes: [130.81, 164.81, 196.0] },   // C
  { root: 98.0,  notes: [196.0, 246.94, 293.66] },   // G
];

export function synthesizeDemoTrack(ctx) {
  const totalSec = BARS * BAR;
  const length = Math.ceil(totalSec * SR);
  const buffer = ctx.createBuffer(2, length, SR);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let bar = 0; bar < BARS; bar++) {
      const barStart = bar * BAR;

      // Kick：每拍
      for (let b = 0; b < 4; b++) {
        addKick(data, barStart + b * BEAT, SR);
      }
      // Snare：第 2、4 拍（反拍节奏）
      addSnare(data, barStart + 1 * BEAT, SR);
      addSnare(data, barStart + 3 * BEAT, SR);
      // HiHat：每半拍
      for (let h = 0; h < 8; h++) {
        addHat(data, barStart + (h * BEAT) / 2, SR);
      }
      // 低音线条：根音八分音符
      const chord = CHORDS[bar % 4];
      for (let e = 0; e < 8; e++) {
        addBass(data, barStart + (e * BEAT) / 2, chord.root, SR);
      }
      // Pad：整小节持续和弦
      addPad(data, barStart, chord.notes, BAR, SR);
    }
  }
  return buffer;
}

function addKick(data, startSec, sr) {
  const dur = 0.3;
  const start = Math.floor(startSec * sr);
  const n = Math.floor(dur * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const freq = 150 * Math.pow(45 / 150, t / dur); // 150→45Hz 指数下滑
    const env = Math.exp(-t * 14);
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.9;
    const idx = start + i;
    if (idx < data.length) data[idx] += sample;
  }
}

function addSnare(data, startSec, sr) {
  const dur = 0.18;
  const start = Math.floor(startSec * sr);
  const n = Math.floor(dur * sr);
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 22);
    // 噪声 + 200Hz 音调分量，做出军鼓感
    const sample = (rnd() * 2 - 1) * env * 0.55 + Math.sin(2 * Math.PI * 200 * t) * env * 0.35;
    const idx = start + i;
    if (idx < data.length) data[idx] += sample;
  }
}

function addHat(data, startSec, sr) {
  const dur = 0.05;
  const start = Math.floor(startSec * sr);
  const n = Math.floor(dur * sr);
  let seed = 999;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 60);
    const sample = (rnd() * 2 - 1) * env * 0.22;
    const idx = start + i;
    if (idx < data.length) data[idx] += sample;
  }
}

function addBass(data, startSec, freq, sr) {
  const dur = 0.22;
  const start = Math.floor(startSec * sr);
  const n = Math.floor(dur * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 18);
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
    const idx = start + i;
    if (idx < data.length) data[idx] += sample;
  }
}

function addPad(data, startSec, freqs, durSec, sr) {
  const start = Math.floor(startSec * sr);
  const n = Math.floor(durSec * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    // 淡入淡出，避免爆音
    const attack = Math.min(1, t / 0.08);
    const release = Math.min(1, (durSec - t) / 0.25);
    const env = attack * Math.max(0, release) * 0.09;
    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t);
      sample += 0.4 * Math.sin(2 * Math.PI * f * 2 * t); // 轻微八度泛音
    }
    const idx = start + i;
    if (idx < data.length) data[idx] += sample * env;
  }
}
