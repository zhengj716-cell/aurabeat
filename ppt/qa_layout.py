"""PPT 视觉 QA：检查每页 PNG 的尺寸、边缘溢出与内容分布"""
import os
from PIL import Image

PREVIEW = r"D:\Hermes工作区\hermes第二个项目\ppt\preview"
BG = (11, 7, 22)  # 0B0716 深紫黑背景

def is_bg(px, tol=30):
    return all(abs(px[i] - BG[i]) <= tol for i in range(3))

for i in range(1, 14):
    path = os.path.join(PREVIEW, f"slide-{i:02d}.png")
    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()

    # 边缘溢出检测：四边 6px 条带中非背景像素占比
    edge = {}
    for name, x0, y0, x1, y1 in [
        ("top", 0, 0, w, 6), ("bottom", 0, h - 6, w, h),
        ("left", 0, 0, 6, h), ("right", w - 6, 0, w, h),
    ]:
        n = total = 0
        for y in range(y0, y1, 2):
            for x in range(x0, x1, 2):
                total += 1
                if not is_bg(px[x, y]):
                    n += 1
        edge[name] = round(n / max(total, 1), 3)

    # 整体亮度分布（粗采样，检查是否有异常空白/密集）
    lum_sum = 0
    samples = 0
    for y in range(0, h, 8):
        for x in range(0, w, 8):
            r, g, b = px[x, y]
            lum_sum += (r * 299 + g * 587 + b * 114) / 1000
            samples += 1
    avg_lum = lum_sum / samples

    flag = ""
    if edge["left"] > 0.05 or edge["right"] > 0.05:
        flag += " ⚠左右贴边"
    if edge["top"] > 0.05 and i not in (1, 13):
        flag += " ⚠顶部贴边"
    print(f"slide-{i:02d}: {w}x{h} avg_lum={avg_lum:5.1f} edge={edge}{flag}")

print("DONE")
