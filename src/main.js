/**
 * AuraBeat 音乐可视化器 —— 入口
 * 音频分析（文件/麦克风/演示曲） + 3D 粒子舞台 + 交互界面
 */

import './style.css';
import { AudioAnalyzer } from './audio/analyzer.js';
import { synthesizeDemoTrack } from './audio/demoTrack.js';
import { ParticleScene, THEMES } from './visual/scene.js';

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const launch = $('launch');
const toolbar = $('toolbar');
const controls = $('controls');
const trackName = $('track-name');
const playBtn = $('play-btn');
const progress = $('progress');
const timeCurrent = $('time-current');
const timeTotal = $('time-total');
const sensitivity = $('sensitivity');
const glow = $('glow');
const micMeter = $('mic-meter');
const micMeterBar = $('mic-meter-bar');
const toastEl = $('toast');

/* ---------- 核心对象 ---------- */
const analyzer = new AudioAnalyzer();
const scene = new ParticleScene(stage);

let demoBuffer = null;   // 演示曲 buffer（首次点击时合成）
let currentFileName = '';
let themeIndex = 0;
const themeNames = Object.keys(THEMES);
let rafId = null;
let lastTime = performance.now();

/* ---------- 工具 ---------- */

function showToast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.add('hidden'), ms);
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 进入播放界面 */
function enterPlayer(fileLabel, isMic = false) {
  launch.classList.add('hidden');
  toolbar.classList.remove('hidden');
  micMeter.classList.toggle('hidden', !isMic);
  controls.classList.toggle('hidden', isMic);
  trackName.textContent = isMic ? '🎤 麦克风实时输入' : fileLabel;
  currentFileName = isMic ? 'mic' : fileLabel;
}

/** 返回启动页 */
function backToLaunch() {
  analyzer.pause();
  launch.classList.remove('hidden');
  toolbar.classList.add('hidden');
  controls.classList.add('hidden');
  micMeter.classList.add('hidden');
  trackName.textContent = '未播放';
  updatePlayBtn(false);
}

/* ---------- 播放控制 ---------- */

function updatePlayBtn(playing) {
  playBtn.textContent = playing ? '⏸' : '▶';
}

function updateTimeUI() {
  const t = analyzer.getTime();
  timeCurrent.textContent = fmtTime(t);
  if (!progress._dragging) {
    progress.value = analyzer.duration > 0 ? Math.round((t / analyzer.duration) * 1000) : 0;
  }
  timeTotal.textContent = fmtTime(analyzer.duration);
}

/* ---------- 动画循环 ---------- */

let fpsWindow = [];
let fpsTimer = 0;
let qualityDown = false;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // 性能监控：每秒统计一次，低帧率自动降粒子数
  fpsWindow.push(dt);
  fpsTimer += dt;
  if (fpsTimer >= 2) {
    const avgDt = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
    const fps = 1 / avgDt;
    fpsWindow = [];
    fpsTimer = 0;
    if (fps < 36 && !qualityDown) {
      qualityDown = true;
      scene.setParticleCount(scene.particleCount / 2);
      showToast('检测到低帧率，已自动降低粒子密度 ⚡', 1800);
    } else if (fps > 55 && qualityDown) {
      qualityDown = false;
      scene.setParticleCount(6000);
    }
  }

  const data = analyzer.update(dt);
  if (analyzer.isMic && data.level > 0.005) {
    micMeterBar.style.width = `${Math.min(100, data.level * 120)}%`;
  }
  scene.update(data, dt);
  updateTimeUI();

  // 歌曲自然结束
  if (!analyzer.isMic && analyzer.isPlaying && data.duration > 0 && data.time >= data.duration - 0.05) {
    updatePlayBtn(false);
  }

  rafId = requestAnimationFrame(frame);
}

/* ---------- 音源：文件 / 演示曲 / 麦克风 ---------- */

async function handleFile(file) {
  if (!file || !file.type.startsWith('audio/')) {
    showToast('请选择音频文件 🎵');
    return;
  }
  try {
    const info = await analyzer.loadFile(file);
    analyzer.playBuffer(0);
    enterPlayer(info.name);
    updatePlayBtn(true);
    showToast(`正在播放：${info.name}`);
  } catch (err) {
    console.error(err);
    showToast('音频解码失败，换个文件试试 😢');
  }
}

async function playDemo() {
  if (!demoBuffer) {
    showToast('正在合成演示曲…');
    demoBuffer = synthesizeDemoTrack(analyzer._ensureCtx());
  }
  const info = analyzer.loadDemoBuffer(demoBuffer);
  analyzer.playBuffer(0);
  enterPlayer(info.name);
  updatePlayBtn(true);
  showToast('▶ 内置演示曲：Neon Drive');
}

async function startMic() {
  try {
    await analyzer.startMic();
    analyzer.playMic();
    enterPlayer('', true);
    showToast('🎤 麦克风已开启，唱吧！');
  } catch (err) {
    console.error(err);
    showToast('无法访问麦克风，请检查权限 🎤');
  }
}

/* ---------- 事件绑定 ---------- */

// 启动页
$('file-input').addEventListener('change', (e) => {
  handleFile(e.target.files[0]);
  e.target.value = ''; // 允许重复选择同一文件
});
$('mic-btn').addEventListener('click', startMic);
$('demo-btn').addEventListener('click', playDemo);

// 页面拖拽文件
let dragDepth = 0;
document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth++;
  document.body.classList.add('dragging');
});
document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (--dragDepth <= 0) {
    dragDepth = 0;
    document.body.classList.remove('dragging');
  }
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// 播放/暂停
playBtn.addEventListener('click', () => {
  if (analyzer.isPlaying) {
    analyzer.pause();
    updatePlayBtn(false);
  } else {
    analyzer.resume();
    updatePlayBtn(true);
  }
});

// 进度条
progress.addEventListener('input', () => {
  progress._dragging = true;
  const sec = (progress.value / 1000) * analyzer.duration;
  timeCurrent.textContent = fmtTime(sec);
});
progress.addEventListener('change', () => {
  const sec = (progress.value / 1000) * analyzer.duration;
  analyzer.seek(sec);
  progress._dragging = false;
});

// 灵敏度 / 光晕
sensitivity.addEventListener('input', () => {
  analyzer.sensitivity = parseFloat(sensitivity.value);
});
glow.addEventListener('input', () => {
  scene.setGlow(parseFloat(glow.value));
});

// 主题循环
$('theme-btn').addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % themeNames.length;
  const name = themeNames[themeIndex];
  scene.setTheme(name);
  showToast(`配色主题：${THEMES[name].name} 🎨`);
});

// 全屏
$('fullscreen-btn').addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => showToast('全屏失败 😢'));
  }
});

// 截图
$('screenshot-btn').addEventListener('click', () => {
  const dataUrl = scene.screenshot();
  const a = document.createElement('a');
  const base = (currentFileName === 'mic' ? 'mic' : currentFileName || 'aurabeat')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]/g, '_');
  a.download = `${base}-aurabeat-${Date.now()}.png`;
  a.href = dataUrl;
  a.click();
  showToast('截图已保存 📷');
});

// 返回
$('back-btn').addEventListener('click', backToLaunch);

// 键盘快捷键：空格播放/暂停，F 全屏
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!launch.classList.contains('hidden')) {
      playDemo();
    } else if (analyzer.isPlaying || analyzer.buffer) {
      playBtn.click();
    }
  } else if (e.key.toLowerCase() === 'f') {
    $('fullscreen-btn').click();
  }
});

/* ---------- 启动 ---------- */

window.addEventListener('resize', () => scene.resize());
rafId = requestAnimationFrame(frame);
