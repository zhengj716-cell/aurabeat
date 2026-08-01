/**
 * ParticleScene —— AuraBeat 的 3D 粒子舞台
 * 6000 颗粒子球壳 + 星空背景 + 节拍闪光环 + 环形光带，
 * 全部由音频能量驱动：低频推半径（脉冲）、中频转速度、高频调光带。
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** 配色主题（主色/辅色/背景/光带色） */
export const THEMES = {
  aurora: { name: '霓虹紫', primary: 0x7c5cff, secondary: 0xff5c9d, bg: 0x05030f, ring: 0x5cd0ff },
  flame:  { name: '火焰橙', primary: 0xff6b2c, secondary: 0xffd23c, bg: 0x100605, ring: 0xff9d5c },
  ice:    { name: '冰蓝',   primary: 0x4dd2ff, secondary: 0x7cffd4, bg: 0x040b14, ring: 0xffffff },
};

const MAX_PARTICLES = 6000;
const MIN_PARTICLES = 2500;

export class ParticleScene {
  constructor(container) {
    this.container = container;
    this.theme = THEMES.aurora;
    this.glow = 1;
    this.sensitivity = 1;
    this._particleCount = MAX_PARTICLES;
    this._beatFlash = 0;
    this._dir = null;      // 每个粒子的单位方向向量
    this._baseRadius = null;

    this._initRenderer();
    this._initCamera();
    this._initControls();
    this._buildParticles();
    this._buildStars();
    this._buildRings();
    this._applyTheme();
    this._t = 0;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  /* ---------- 初始化 ---------- */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 7, 24);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.maxPolarAngle = Math.PI * 0.6;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 45;
  }

  /** 主粒子云：球壳分布（上下略收窄），记录单位方向向量 */
  _buildParticles() {
    const count = MAX_PARTICLES;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this._dir = new Float32Array(count * 3);
    this._baseRadius = new Float32Array(count);
    this._colorMix = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 8 + Math.pow(Math.random(), 1.5) * 8;   // 偏向内侧的球壳
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2 - 1) * 0.82); // 上下收窄，更像星云盘
      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.cos(phi);
      const dirZ = Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = dirX * r;
      positions[i * 3 + 1] = dirY * r * 0.7;
      positions[i * 3 + 2] = dirZ * r;

      this._dir[i * 3] = dirX;
      this._dir[i * 3 + 1] = dirY * 0.7;
      this._dir[i * 3 + 2] = dirZ;
      this._baseRadius[i] = r;
      this._colorMix[i] = Math.random();

      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // 初始只渲染全部；低配时用 drawRange 动态缩减
    geo.setDrawRange(0, count);

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
    this._positions = positions;
  }

  /** 背景星空：远处固定小粒子 */
  _buildStars() {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 45 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.stars = new THREE.Points(geo, this.starMaterial);
    this.scene.add(this.stars);
  }

  /** 环形光带 + 节拍冲击波环 */
  _buildRings() {
    const ringGeo = new THREE.RingGeometry(11.5, 12.2, 96);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: THEMES.aurora.ring,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(ringGeo, this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = -6;
    this.scene.add(this.ring);

    const beatGeo = new THREE.RingGeometry(0.85, 1.0, 64);
    this.beatRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.beatRing = new THREE.Mesh(beatGeo, this.beatRingMaterial);
    this.beatRing.visible = false;
    this.scene.add(this.beatRing);
  }

  _applyTheme() {
    const th = this.theme;
    this.scene.background = new THREE.Color(th.bg);

    const c1 = new THREE.Color(th.primary);
    const c2 = new THREE.Color(th.secondary);
    const tmp = new THREE.Color();
    const colors = this.points.geometry.attributes.color.array;

    for (let i = 0; i < this._colorMix.length; i++) {
      tmp.copy(c1).lerp(c2, this._colorMix[i]);
      // 越靠外越暗，形成星云层次感
      const dim = 0.5 + 0.5 * (1 - (this._baseRadius[i] - 8) / 16);
      colors[i * 3] = tmp.r * dim;
      colors[i * 3 + 1] = tmp.g * dim;
      colors[i * 3 + 2] = tmp.b * dim;
    }
    this.points.geometry.attributes.color.needsUpdate = true;
    this.starMaterial.color.set(th.primary);
    this.ringMaterial.color.set(th.ring);
  }

  /* ---------- 对外 API ---------- */

  setTheme(name) {
    this.theme = THEMES[name] || THEMES.aurora;
    this._applyTheme();
  }

  setSensitivity(v) {
    this.sensitivity = v;
  }

  setGlow(v) {
    this.glow = v;
  }

  /** 性能降级：动态调整渲染粒子数 */
  setParticleCount(n) {
    const target = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, n));
    this._particleCount = target;
    this.points.geometry.setDrawRange(0, target);
  }

  get particleCount() {
    return this._particleCount;
  }

  /** 渲染一帧并导出 PNG dataURL（供截图用） */
  screenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * 每帧更新
   * @param {object} data analyzer 输出的音频数据
   * @param {number} dt 距上帧秒数
   */
  update(data, dt) {
    this._t += dt;
    const { bass, mid, treble, level, beat, beatIntensity } = data;

    // 1) 低频脉冲：粒子沿方向向量推远
    const pulse = 1 + bass * 0.3;
    const pos = this._positions;
    const dir = this._dir;
    const base = this._baseRadius;
    for (let i = 0; i < this._particleCount; i++) {
      const r = base[i] * pulse;
      const j = i * 3;
      pos[j] = dir[j] * r;
      pos[j + 1] = dir[j + 1] * r;
      pos[j + 2] = dir[j + 2] * r;
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    // 2) 中频驱动旋转 + 轻微摇摆
    this.points.rotation.y += (0.1 + mid * 1.8) * dt;
    this.points.rotation.x = Math.sin(this._t * 0.25) * 0.07 + mid * 0.06;
    this.points.rotation.z = Math.sin(this._t * 0.17) * 0.04;

    // 3) 粒子大小/透明度随响度与光晕参数
    this.points.material.size = 0.16 + level * 0.3;
    this.points.material.opacity = 0.55 + this.glow * 0.4;

    // 4) 节拍冲击波环（billboard 朝向相机）
    if (beat) this._beatFlash = Math.min(1, this._beatFlash + beatIntensity * 1.5 + 0.4);
    this._beatFlash = Math.max(0, this._beatFlash - dt * 2.4);
    const br = this.beatRing;
    br.visible = this._beatFlash > 0.02;
    if (br.visible) {
      const s = 1 + (1 - this._beatFlash) * 7;
      br.scale.set(s, s, s);
      br.material.opacity = this._beatFlash * 0.75;
      br.lookAt(this.camera.position);
    }

    // 5) 环形光带：随高频发光，随低频扩张
    this.ring.rotation.z += dt * (0.2 + treble * 1.2);
    this.ring.material.opacity = 0.22 + treble * 0.45;
    this.ring.scale.setScalar(1 + bass * 0.08);

    // 6) 相机自动旋转（用户拖拽后 OrbitControls 会暂停 autoRotate）
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.stars.geometry.dispose();
    this.starMaterial.dispose();
    this.ring.geometry.dispose();
    this.ringMaterial.dispose();
    this.beatRing.geometry.dispose();
    this.beatRingMaterial.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
