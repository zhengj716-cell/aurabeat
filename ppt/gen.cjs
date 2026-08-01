/**
 * AuraBeat 练手总结 PPT 生成脚本
 * 运行: node ppt/gen.js
 * 输出: AuraBeat-练手总结.pptx
 */

const PptxGenJS = require('pptxgenjs');
const path = require('path');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 英寸
pptx.author = 'AuraBeat';
pptx.title = 'AuraBeat 音乐可视化器 · 练手总结';

/* ===== 设计系统 ===== */
const C = {
  bg:       '0B0716', // 深紫黑
  bgCard:   '151030', // 卡片底
  bgCard2:  '1A1240', // 卡片底（深一档）
  purple:   '7C5CFF',
  pink:     'FF5C9D',
  cyan:     '5CD0FF',
  text:     'F2EEFF',
  textDim:  '9A92C4',
  border:   '2A2150',
};
const F = {
  title: 'Microsoft YaHei',
  body: 'Microsoft YaHei',
  latin: 'Arial',
};

const SCREENSHOTS = path.join(__dirname, '..', 'assets', 'screenshots');

/* ===== 工具 ===== */
function bg(color) {
  return { color };
}
function shadow(color, blur = 18, opacity = 0.45, angle = 90, offset = 5) {
  // 每次调用返回全新对象（pptxgenjs 会原地修改）
  return { type: 'outer', color, blur, angle, offset, opacity };
}
function card(x, y, w, h, fill = C.bgCard) {
  return {
    x, y, w, h,
    fill: { color: fill },
    line: { color: C.border, width: 1 },
    rectRadius: 0.12,
  };
}
function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x ?? 0.55,
    y: opts.y ?? 0.4,
    w: opts.w ?? 12.2,
    h: 0.9,
    fontFace: F.title,
    fontSize: opts.size ?? 34,
    bold: true,
    color: opts.color ?? C.text,
    margin: 0,
    ...opts.extra,
  });
}
function sectionTag(slide, text, x = 0.55, y = 0.42, color = C.purple) {
  // 小节标识：圆点 + 文字（不用色条）
  slide.addShape('ellipse', { x, y: y + 0.09, w: 0.22, h: 0.22, fill: { color }, line: { type: 'none' } });
  slide.addText(text, {
    x: x + 0.32, y, w: 6, h: 0.4,
    fontFace: F.body, fontSize: 13, color: C.textDim, margin: 0,
  });
}
function pageNum(slide, n) {
  slide.addText(`AuraBeat 练手总结 · ${n}`, {
    x: 11.55, y: 7.08, w: 1.6, h: 0.3,
    fontFace: F.body, fontSize: 9, color: C.textDim, align: 'right', margin: 0,
  });
}
function screenshot(slide, file, x, y, w, opts = {}) {
  const h = opts.h ?? Math.round((w * 9) / 16 * 100) / 100; // 16:9
  slide.addImage({
    path: path.join(SCREENSHOTS, file),
    x, y, w, h,
    line: opts.line ? { color: opts.line, width: 1.2 } : { color: C.border, width: 1 },
    ...(opts.noShadow ? {} : { shadow: shadow(opts.shadowColor ?? C.purple, 24, 0.5) }),
  });
  return h;
}

/* ================================================================
 * S1 封面
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);

  // 氛围底图（粒子截图，高透明度）
  s.addImage({
    path: path.join(SCREENSHOTS, 'aurora.png'),
    x: 0, y: 3.4, w: 13.33, h: 7.5 - 3.4,
    transparency: 78,
  });

  // 粒子装饰点
  const dots = [
    [1.1, 1.2, 0.14, C.purple], [12.0, 1.0, 0.1, C.cyan], [11.2, 2.1, 0.07, C.pink],
    [0.7, 5.6, 0.09, C.pink], [12.5, 5.2, 0.12, C.purple], [1.9, 4.3, 0.06, C.cyan],
  ];
  dots.forEach(([x, y, r, color]) =>
    s.addShape('ellipse', { x, y, w: r, h: r, fill: { color }, line: { type: 'none' }, transparency: 30 })
  );

  // Logo（Aura 紫 + Beat 粉）
  s.addText([
    { text: 'Aura', options: { color: C.purple } },
    { text: 'Beat', options: { color: C.pink } },
  ], {
    x: 0.55, y: 1.55, w: 12.2, h: 1.7,
    fontFace: F.latin, fontSize: 88, bold: true,
    margin: 0, shadow: shadow(C.purple, 30, 0.6),
  });

  s.addText('音乐可视化器', {
    x: 0.58, y: 3.35, w: 8, h: 0.7,
    fontFace: F.title, fontSize: 30, bold: true, color: C.text, margin: 0,
  });
  s.addText('把音乐变成一片流动的光', {
    x: 0.58, y: 4.15, w: 8, h: 0.5,
    fontFace: F.body, fontSize: 16, color: C.textDim, margin: 0,
  });
  s.addText('2026.08 · 练手项目 #2 · Three.js + Web Audio API', {
    x: 0.58, y: 6.55, w: 8, h: 0.4,
    fontFace: F.body, fontSize: 12, color: C.textDim, margin: 0,
  });
}

/* ================================================================
 * S2 为什么做这个
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '为什么做这个？');
  sectionTag(s, '练手项目的第二站，换一条没走过的路', 0.55, 1.02);

  const items = [
    { icon: '🔄', t: '换赛道', d: '《霓虹冲刺》之后，从游戏逻辑转向音频处理与数据可视化，练习新领域' },
    { icon: '🎯', t: '目标明确', d: '做一个「打开就能炫」的产品：零操作、快反馈、视觉冲击力优先' },
    { icon: '🏗️', t: '完整流程', d: '从需求拷问到部署上线再到总结 PPT，完整走一遍产品小闭环' },
  ];
  items.forEach((it, i) => {
    const x = 0.55 + i * 4.25;
    s.addShape('roundRect', card(x, 1.75, 3.9, 3.3));
    s.addText(it.icon, {
      x: x + 0.3, y: 2.0, w: 0.9, h: 0.9,
      fontFace: 'Segoe UI Emoji', fontSize: 36, margin: 0,
    });
    s.addText(it.t, {
      x: x + 0.3, y: 3.0, w: 3.3, h: 0.5,
      fontFace: F.title, fontSize: 20, bold: true, color: C.text, margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.3, y: 3.55, w: 3.35, h: 1.3,
      fontFace: F.body, fontSize: 12.5, color: C.textDim, margin: 0, lineSpacingMultiple: 1.25,
    });
  });

  // 底部启动页截图（小图居中，避免溢出）
  const shotW = 3.0;
  const shotX = (13.33 - shotW) / 2;
  const shotH = screenshot(s, 'launch.png', shotX, 5.3, shotW, { line: C.border, noShadow: true });
  s.addText('打开页面，三种方式开始：选歌 / 开麦 / 一键演示', {
    x: shotX, y: 5.3 + shotH + 0.1, w: shotW, h: 0.28,
    fontFace: F.body, fontSize: 10, color: C.textDim, align: 'center', margin: 0,
  });
  pageNum(s, 2);
}

/* ================================================================
 * S3 一句话定位 + 三主题
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  s.addText('输入音乐，输出一片会呼吸的光', {
    x: 1.0, y: 0.75, w: 11.3, h: 1.1,
    fontFace: F.title, fontSize: 40, bold: true, color: C.text, align: 'center', margin: 0,
    shadow: shadow(C.purple, 24, 0.5),
  });
  s.addText('同一首曲子，三种气质', {
    x: 1.0, y: 1.9, w: 11.3, h: 0.45,
    fontFace: F.body, fontSize: 15, color: C.textDim, align: 'center', margin: 0,
  });

  const themes = [
    { file: 'aurora.png', name: '霓虹紫 · Aurora', sub: '默认主题' },
    { file: 'flame.png', name: '火焰橙 · Flame', sub: '高能节拍' },
    { file: 'ice.png', name: '冰蓝 · Ice', sub: '空灵氛围' },
  ];
  themes.forEach((t, i) => {
    const x = 0.75 + i * 4.15;
    const h = screenshot(s, t.file, x, 2.65, 3.75, { line: C.purple });
    s.addText(t.name, {
      x, y: 2.65 + h + 0.1, w: 3.75, h: 0.4,
      fontFace: F.body, fontSize: 13, bold: true, color: C.text, align: 'center', margin: 0,
    });
    s.addText(t.sub, {
      x, y: 2.65 + h + 0.5, w: 3.75, h: 0.35,
      fontFace: F.body, fontSize: 11, color: C.textDim, align: 'center', margin: 0,
    });
  });

  s.addText('配色一键切换，粒子颜色实时重绘', {
    x: 1.0, y: 6.35, w: 11.3, h: 0.4,
    fontFace: F.body, fontSize: 12, color: C.textDim, align: 'center', margin: 0,
  });
  pageNum(s, 3);
}

/* ================================================================
 * S4 功能总览
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '功能总览');
  sectionTag(s, '六项核心能力，覆盖「听」与「看」', 0.55, 1.02);

  const feats = [
    { icon: '🎵', t: '本地音乐', d: '点击选择或直接拖拽音频文件进页面，即拖即播' },
    { icon: '🎤', t: '麦克风输入', d: '对着麦克风唱两句，画面实时跟随你的声音' },
    { icon: '▶️', t: '内置演示曲', d: '程序合成的 32 秒电子乐，零文件零版权，打开即炸' },
    { icon: '🎨', t: '三套主题', d: '霓虹紫 / 火焰橙 / 冰蓝，一键切换整套配色' },
    { icon: '🎚️', t: '灵敏度·光晕', d: '调节画面「激动程度」与粒子发光强度' },
    { icon: '📷', t: '全屏 + 截图', d: '沉浸式全屏观看，一键保存当前画面为 PNG' },
  ];
  feats.forEach((f, i) => {
    const x = 0.55 + (i % 3) * 4.25;
    const y = 1.7 + Math.floor(i / 3) * 2.5;
    s.addShape('roundRect', card(x, y, 3.9, 2.15));
    s.addText(f.icon, {
      x: x + 0.28, y: y + 0.22, w: 0.75, h: 0.75,
      fontFace: 'Segoe UI Emoji', fontSize: 30, margin: 0,
    });
    s.addText(f.t, {
      x: x + 1.15, y: y + 0.3, w: 2.6, h: 0.45,
      fontFace: F.title, fontSize: 17, bold: true, color: C.text, margin: 0,
    });
    s.addText(f.d, {
      x: x + 0.28, y: y + 1.05, w: 3.35, h: 0.95,
      fontFace: F.body, fontSize: 11.5, color: C.textDim, margin: 0, lineSpacingMultiple: 1.2,
    });
  });
  pageNum(s, 4);
}

/* ================================================================
 * S5 技术架构
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '技术架构');
  sectionTag(s, '三层解耦：音源 / 分析 / 可视化互不关心', 0.55, 1.02);

  const stages = [
    { t: '音源层', d: '本地文件\n麦克风\n内置演示曲', color: C.pink },
    { t: '分析层', d: 'FFT 频谱\n分频能量\n节拍检测', color: C.purple },
    { t: '可视化层', d: 'Three.js 粒子\n节拍冲击波\n相机运镜', color: C.cyan },
  ];
  const bx = 0.55, bw = 3.5, bh = 2.6, by = 1.85, gap = 1.1;
  stages.forEach((st, i) => {
    const x = bx + i * (bw + gap);
    s.addShape('roundRect', { ...card(x, by, bw, bh), line: { color: st.color, width: 1.2 } });
    s.addText(st.t, {
      x, y: by + 0.25, w: bw, h: 0.5,
      fontFace: F.title, fontSize: 18, bold: true, color: st.color, align: 'center', margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.4, y: by + 0.95, w: bw - 0.8, h: 1.4,
      fontFace: F.body, fontSize: 13, color: C.textDim, align: 'center', margin: 0, lineSpacingMultiple: 1.35,
    });
    if (i < 2) {
      s.addShape('rightArrow', {
        x: x + bw + 0.12, y: by + bh / 2 - 0.14, w: 0.85, h: 0.28,
        fill: { color: C.textDim }, line: { type: 'none' },
      });
    }
  });

  // UI 层说明条（横贯下方的圆角卡片，非色条）
  s.addShape('roundRect', card(0.55, 5.0, 12.25, 1.3, C.bgCard2));
  s.addText([
    { text: 'UI 控制层  ', options: { bold: true, color: C.text, fontSize: 15 } },
    { text: '播放控制 · 进度条 · 灵敏度/光晕滑块 · 主题切换 · 全屏 · 截图 · 性能自适应（低帧率自动降粒子数）', options: { color: C.textDim, fontSize: 13 } },
  ], {
    x: 0.85, y: 5.0, w: 11.7, h: 1.3,
    fontFace: F.body, margin: 0, valign: 'middle', lineSpacingMultiple: 1.3,
  });

  // 技术栈标签
  const stack = ['Vite', 'Three.js', 'Web Audio API', 'GitHub Actions', 'GitHub Pages'];
  stack.forEach((t, i) => {
    const w = 1.55;
    const x = 0.55 + i * 1.75;
    s.addShape('roundRect', { x, y: 6.55, w, h: 0.5, rectRadius: 0.25, fill: { color: C.bgCard }, line: { color: C.border, width: 1 } });
    s.addText(t, {
      x, y: 6.55, w, h: 0.5,
      fontFace: F.body, fontSize: 11.5, color: C.textDim, align: 'center', valign: 'middle', margin: 0,
    });
  });
  pageNum(s, 5);
}

/* ================================================================
 * S6 核心实现 · 音频
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '核心实现 · 音频引擎');
  sectionTag(s, '统一 AudioAnalyzer：三种音源汇成一套数据流', 0.55, 1.02);

  const cards = [
    { icon: '📊', t: 'FFT 频谱分析', d: 'AnalyserNode 做 256 点 FFT，得到 128 段频谱。整套 API 只输出「频谱 + 能量 + 节拍」三个量，可视化层完全不知道音乐从哪来' },
    { icon: '🎛️', t: '分频能量', d: '低频 / 中频 / 高频分开归一化，分别驱动不同视觉元素：低频推粒子半径、中频转旋转速度、高频点亮光带' },
    { icon: '🥁', t: '节拍检测', d: '低频能量突增 + 自适应阈值（取近 1 秒均值 × 1.35）+ 120ms 冷却，演示曲的 Kick 一拍一个准' },
  ];
  cards.forEach((c, i) => {
    const x = 0.55 + i * 4.25;
    s.addShape('roundRect', card(x, 1.75, 3.9, 3.6));
    s.addText(c.icon, { x: x + 0.3, y: 2.0, w: 0.8, h: 0.8, fontFace: 'Segoe UI Emoji', fontSize: 32, margin: 0 });
    s.addText(c.t, { x: x + 0.3, y: 2.95, w: 3.3, h: 0.5, fontFace: F.title, fontSize: 19, bold: true, color: C.text, margin: 0 });
    s.addText(c.d, { x: x + 0.3, y: 3.5, w: 3.35, h: 1.7, fontFace: F.body, fontSize: 12, color: C.textDim, margin: 0, lineSpacingMultiple: 1.25 });
  });

  s.addText('演示曲也是代码：用 Web Audio 现场合成 16 小节电子乐（Kick / Snare / HiHat / 和弦 Pad），节拍精确到毫秒', {
    x: 0.55, y: 5.6, w: 12.25, h: 0.5,
    fontFace: F.body, fontSize: 13, color: C.cyan, margin: 0, italic: true,
  });
  pageNum(s, 6);
}

/* ================================================================
 * S7 核心实现 · 视觉
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '核心实现 · 粒子舞台');
  sectionTag(s, '6000 颗粒子，被音乐推着呼吸', 0.55, 1.02);

  // 左：三条特性
  const rows = [
    { icon: '💫', t: '粒子脉冲', d: '每颗粒子记录初始方向与半径，低频能量把半径向外推，整个星云随鼓点膨胀收缩' },
    { icon: '🔔', t: '节拍冲击波', d: '检测到节拍时从中心扩散一圈光环，始终朝向相机，1 秒内淡出' },
    { icon: '⚡', t: '性能自适应', d: '持续监控帧率，低于 36fps 自动把粒子数减半（drawRange 动态裁剪，无需重建几何体）' },
  ];
  rows.forEach((r, i) => {
    const y = 1.8 + i * 1.55;
    s.addShape('roundRect', card(0.55, y, 5.6, 1.35, C.bgCard2));
    s.addText(r.icon, { x: 0.8, y: y + 0.25, w: 0.85, h: 0.85, fontFace: 'Segoe UI Emoji', fontSize: 32, margin: 0 });
    s.addText(r.t, { x: 1.75, y: y + 0.16, w: 4.3, h: 0.45, fontFace: F.title, fontSize: 16, bold: true, color: C.text, margin: 0 });
    s.addText(r.d, { x: 1.75, y: y + 0.6, w: 4.3, h: 0.7, fontFace: F.body, fontSize: 10.5, color: C.textDim, margin: 0, lineSpacingMultiple: 1.15 });
  });

  // 右：大图
  const h = screenshot(s, 'aurora.png', 6.6, 1.8, 6.2, { line: C.purple, shadowColor: C.pink });
  s.addText('粒子颜色随半径衰减形成星云层次 · 叠加混合让光点互相点亮', {
    x: 6.6, y: 1.8 + h + 0.1, w: 6.2, h: 0.35,
    fontFace: F.body, fontSize: 11, color: C.textDim, align: 'center', margin: 0,
  });
  pageNum(s, 7);
}

/* ================================================================
 * S8 视觉展示
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '视觉展示');
  sectionTag(s, '截图均为真实运行画面（1600×900）', 0.55, 1.02);

  const shots = [
    { file: 'flame.png', cap: '火焰橙 · 高能节拍下的粒子爆发' },
    { file: 'ice.png', cap: '冰蓝 · 光带与星空的冷色调' },
  ];
  shots.forEach((t, i) => {
    const x = 0.55 + i * 6.35;
    const h = screenshot(s, t.file, x, 1.75, 5.9, { line: C.purple });
    s.addText(t.cap, { x, y: 1.75 + h + 0.1, w: 5.9, h: 0.35, fontFace: F.body, fontSize: 11.5, color: C.textDim, align: 'center', margin: 0 });
  });

  // 底部：启动页小图 + 右侧说明（避免大图溢出）
  const h2 = screenshot(s, 'launch.png', 2.7, 5.15, 4.0, { line: C.border, noShadow: true });
  s.addText('启动页：三个按钮就是全部入口', {
    x: 7.2, y: 5.85, w: 5.3, h: 0.45,
    fontFace: F.body, fontSize: 14, bold: true, color: C.text, margin: 0,
  });
  s.addText('零学习成本——选歌、开麦、或直接一键演示。', {
    x: 7.2, y: 6.35, w: 5.3, h: 0.45,
    fontFace: F.body, fontSize: 12, color: C.textDim, margin: 0,
  });
  pageNum(s, 8);
}

/* ================================================================
 * S9 数字说话
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '数字说话');
  sectionTag(s, '一个小产品的关键数字', 0.55, 1.02);

  const stats = [
    { n: '6000', u: '', t: '粒子数', c: C.purple },
    { n: '3', u: '种', t: '音源输入', c: C.pink },
    { n: '3', u: '套', t: '配色主题', c: C.cyan },
    { n: '127', u: 'KB', t: '打包体积 (gzip)', c: C.purple },
    { n: '1', u: '键', t: '自动部署上线', c: C.pink },
  ];
  stats.forEach((st, i) => {
    const x = 0.55 + i * 2.5;
    s.addShape('roundRect', card(x, 1.85, 2.25, 3.4));
    s.addText([
      { text: st.n, options: { fontSize: 44, bold: true, color: st.c, fontFace: F.latin } },
      { text: st.u, options: { fontSize: 18, bold: true, color: st.c, fontFace: F.body } },
    ], {
      x, y: 2.35, w: 2.25, h: 1.0,
      fontFace: F.latin, align: 'center', margin: 0, valign: 'middle',
    });
    s.addText(st.t, {
      x: x + 0.2, y: 3.75, w: 1.85, h: 0.5,
      fontFace: F.body, fontSize: 13, color: C.textDim, align: 'center', margin: 0,
    });
  });

  s.addText('从 0 到上线：约 900 行代码，1 个下午的完整小闭环', {
    x: 0.55, y: 5.6, w: 12.25, h: 0.5,
    fontFace: F.body, fontSize: 14, color: C.text, align: 'center', margin: 0, italic: true,
  });
  pageNum(s, 9);
}

/* ================================================================
 * S10 过程回顾
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '过程回顾');
  sectionTag(s, '七步走完一个小产品', 0.55, 1.02);

  const steps = [
    { n: '01', t: '需求拷问', d: 'grilling 技能逐项确认：风格 / 音源 / 控制 / 部署 / 名字' },
    { n: '02', t: '搭骨架', d: 'Vite + Three.js 工程，目录分层' },
    { n: '03', t: '音频引擎', d: 'Analyzer 统一三种音源 + 节拍检测' },
    { n: '04', t: '粒子舞台', d: '6000 粒子球壳 + 冲击波 + 光带' },
    { n: '05', t: '交互界面', d: '控制栏 / 主题 / 全屏 / 截图 / 性能自适应' },
    { n: '06', t: '部署上线', d: 'GitHub Actions 自动构建发布到 Pages' },
    { n: '07', t: '总结 PPT', d: '就是你正在看的这一份' },
  ];
  // 水平时间线：圆点 + 连接线 + 编号 + 标题 + 说明
  const x0 = 0.55, w = 1.72, yLine = 2.15, yCard = 2.7;
  s.addShape('line', { x: x0 + 0.3, y: yLine + 0.14, w: 7 * w - 0.1, h: 0, line: { color: C.border, width: 2 } });
  steps.forEach((st, i) => {
    const x = x0 + i * w;
    s.addShape('ellipse', { x: x + 0.3, y: yLine, w: 0.28, h: 0.28, fill: { color: i === 6 ? C.pink : C.purple }, line: { type: 'none' } });
    s.addText(st.n, { x, y: yCard, w, h: 0.4, fontFace: F.latin, fontSize: 12, bold: true, color: C.cyan, align: 'center', margin: 0 });
    s.addText(st.t, { x, y: yCard + 0.4, w, h: 0.4, fontFace: F.title, fontSize: 13, bold: true, color: C.text, align: 'center', margin: 0 });
    s.addText(st.d, { x: x - 0.1, y: yCard + 0.85, w: w + 0.2, h: 2.2, fontFace: F.body, fontSize: 9.5, color: C.textDim, align: 'center', margin: 0, lineSpacingMultiple: 1.2 });
  });

  s.addText('顺序很重要：先定「做什么」再动手，中途零返工', {
    x: 0.55, y: 6.1, w: 12.25, h: 0.4,
    fontFace: F.body, fontSize: 12.5, color: C.textDim, align: 'center', margin: 0, italic: true,
  });
  pageNum(s, 10);
}

/* ================================================================
 * S11 踩坑记录
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '踩过的坑（每个都让下次更快）');
  sectionTag(s, '真实记录，自己看的就不粉饰了', 0.55, 1.02);

  const pits = [
    { icon: '🀄', t: '中文路径', d: '目录「hermes第二个项目」导致 npm create vite 拿目录名当包名报错、编辑器 lint 误报。解法：手动写 package.json，包名用 ASCII' },
    { icon: '🌐', t: 'GitHub 网络不稳', d: 'TLS 握手超时、push 卡住。解法：重试 + 后台脚本自动重试，别傻等' },
    { icon: '📸', t: 'headless 截图', d: 'Edge 无头截图用相对路径直接失败，必须绝对路径；验证渲染靠截图体积判断（纯色几 KB，粒子画面 200KB+）' },
  ];
  pits.forEach((p, i) => {
    const x = 0.55 + i * 4.25;
    s.addShape('roundRect', card(x, 1.75, 3.9, 3.9));
    s.addText(p.icon, { x: x + 0.3, y: 2.0, w: 0.8, h: 0.8, fontFace: 'Segoe UI Emoji', fontSize: 32, margin: 0 });
    s.addText(p.t, { x: x + 0.3, y: 2.95, w: 3.3, h: 0.5, fontFace: F.title, fontSize: 19, bold: true, color: C.text, margin: 0 });
    s.addText(p.d, { x: x + 0.3, y: 3.5, w: 3.35, h: 2.0, fontFace: F.body, fontSize: 11.5, color: C.textDim, margin: 0, lineSpacingMultiple: 1.25 });
  });

  s.addText('🤔 教训：环境问题先看路径和网络，别急着怀疑代码', {
    x: 0.55, y: 5.95, w: 12.25, h: 0.5,
    fontFace: F.body, fontSize: 13.5, color: C.cyan, align: 'center', margin: 0,
  });
  pageNum(s, 11);
}

/* ================================================================
 * S12 未来规划
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);
  title(s, '未来规划');
  sectionTag(s, '架构上已预留扩展位，随时可以继续', 0.55, 1.02);

  const plans = [
    { icon: '🎬', t: '场景切换框架', d: '当前已按「一主场景 + 注册表」设计，后续加频谱隧道、波形星球等新场景只需注册一个新类', tag: '框架已预留' },
    { icon: '⏺️', t: '画面录制', d: 'MediaRecorder 录制可视化视频，方便直接发到社交平台', tag: '待实现' },
    { icon: '📱', t: '移动端适配', d: '触控交互 + 竖屏布局，手机上也能炫', tag: '待实现' },
  ];
  plans.forEach((p, i) => {
    const x = 0.55 + i * 4.25;
    s.addShape('roundRect', card(x, 1.75, 3.9, 3.5));
    s.addText(p.icon, { x: x + 0.3, y: 2.0, w: 0.8, h: 0.8, fontFace: 'Segoe UI Emoji', fontSize: 32, margin: 0 });
    s.addText(p.t, { x: x + 0.3, y: 2.95, w: 3.3, h: 0.5, fontFace: F.title, fontSize: 19, bold: true, color: C.text, margin: 0 });
    s.addText(p.d, { x: x + 0.3, y: 3.5, w: 3.35, h: 1.3, fontFace: F.body, fontSize: 11.5, color: C.textDim, margin: 0, lineSpacingMultiple: 1.25 });
    s.addText(p.tag, {
      x: x + 0.3, y: 4.85, w: 3.3, h: 0.35,
      fontFace: F.body, fontSize: 10.5, bold: true, color: p.tag === '框架已预留' ? C.cyan : C.pink, margin: 0,
    });
  });

  s.addText('练手项目的意义：每个「未完成」都是下一个项目的起点', {
    x: 0.55, y: 5.75, w: 12.25, h: 0.4,
    fontFace: F.body, fontSize: 12.5, color: C.textDim, align: 'center', margin: 0, italic: true,
  });
  pageNum(s, 12);
}

/* ================================================================
 * S13 结尾
 * ================================================================ */
{
  const s = pptx.addSlide();
  s.background = bg(C.bg);

  s.addImage({
    path: path.join(SCREENSHOTS, 'aurora.png'),
    x: 0, y: 3.6, w: 13.33, h: 7.5 - 3.6,
    transparency: 82,
  });

  const dots = [
    [0.9, 5.8, 0.12, C.pink], [12.2, 4.9, 0.1, C.cyan], [11.6, 6.6, 0.08, C.purple],
  ];
  dots.forEach(([x, y, r, color]) =>
    s.addShape('ellipse', { x, y, w: r, h: r, fill: { color }, line: { type: 'none' }, transparency: 30 })
  );

  s.addText('第一个从零到上线的完整产品 🎉', {
    x: 1.0, y: 1.3, w: 11.3, h: 0.8,
    fontFace: F.title, fontSize: 30, bold: true, color: C.text, align: 'center', margin: 0,
  });
  s.addText('在线体验', {
    x: 1.0, y: 2.6, w: 11.3, h: 0.4,
    fontFace: F.body, fontSize: 14, color: C.textDim, align: 'center', margin: 0,
  });
  s.addText('zhengj716-cell.github.io/aurabeat', {
    x: 1.0, y: 3.05, w: 11.3, h: 0.7,
    fontFace: 'Consolas', fontSize: 26, bold: true, color: C.cyan, align: 'center', margin: 0,
    shadow: shadow(C.cyan, 22, 0.5),
  });
  s.addText('下一个项目见 · 2026.08', {
    x: 1.0, y: 6.8, w: 11.3, h: 0.4,
    fontFace: F.body, fontSize: 12, color: C.textDim, align: 'center', margin: 0,
  });
}

/* ===== 输出 ===== */
const outPath = path.join(__dirname, '..', 'AuraBeat-练手总结.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log('OK →', outPath);
}).catch((err) => {
  console.error('FAIL', err);
  process.exit(1);
});
