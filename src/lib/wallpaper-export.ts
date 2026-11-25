import { toPng } from 'html-to-image';
import type { PresetTemplate } from '@/types/timetable';

export type WallpaperFormat = 'lockscreen' | 'desktop';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) {
    return `rgba(96, 165, 250, ${alpha})`;
  }
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(96, 165, 250, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function exportTimetableWallpaper(options: {
  node: HTMLElement;
  template: PresetTemplate;
  title: string;
  format: WallpaperFormat;
  dayLabel?: string;
}): Promise<string> {
  const { node, template, title, format, dayLabel } = options;

  const targetW = format === 'lockscreen' ? 1080 : 1920;
  const targetH = format === 'lockscreen' ? 1920 : 1080;

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: template.tokens.canvasBg,
  });
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize wallpaper canvas.');
  }

  // Base background
  ctx.fillStyle = template.tokens.canvasBg;
  ctx.fillRect(0, 0, targetW, targetH);

  // Subtle accent ambient glow
  const glow = ctx.createRadialGradient(
    targetW * 0.5,
    format === 'lockscreen' ? targetH * 0.22 : targetH * 0.15,
    40,
    targetW * 0.5,
    targetH * 0.45,
    targetW * 0.78
  );
  glow.addColorStop(0, hexToRgba(template.tokens.accent, 0.16));
  glow.addColorStop(0.55, hexToRgba(template.tokens.accent, 0.04));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, targetW, targetH);

  // Safe framing zones:
  // Lockscreen leaves ~360px at top for clock/widgets and ~140px at bottom for buttons
  const padX = format === 'lockscreen' ? 54 : 110;
  const topSafe = format === 'lockscreen' ? 370 : 86;
  const bottomSafe = format === 'lockscreen' ? 140 : 86;

  const availW = targetW - padX * 2;
  const availH = targetH - topSafe - bottomSafe;

  const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
  const drawW = Math.round(img.naturalWidth * scale);
  const drawH = Math.round(img.naturalHeight * scale);
  const drawX = Math.round((targetW - drawW) / 2);
  const drawY = Math.round(topSafe + (availH - drawH) / 2);

  // Soft shadow behind timetable card
  ctx.save();
  ctx.shadowColor =
    template.mode === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 18;
  drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, 22);
  ctx.fillStyle = template.tokens.canvasBg;
  ctx.fill();
  ctx.restore();

  // Clip & draw timetable
  ctx.save();
  drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, 22);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  // Crisp hairline border
  ctx.save();
  drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, 22);
  ctx.strokeStyle = hexToRgba(template.tokens.borderStrong, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Subtle footer mark
  ctx.save();
  ctx.font = '500 20px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = hexToRgba(template.tokens.textMuted, 0.65);
  ctx.textAlign = 'center';
  const cleanTitle = (title || 'Timetable').trim();
  const label = dayLabel
    ? `GridWiser · ${cleanTitle} (${dayLabel})`
    : `GridWiser · ${cleanTitle}`;
  ctx.fillText(label, targetW / 2, targetH - (format === 'lockscreen' ? 56 : 34));
  ctx.restore();

  const baseSlug =
    (title || 'gridwiser-timetable')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'gridwiser-timetable';
  const suffix = format === 'lockscreen' ? 'lockscreen-9x16' : 'desktop-16x9';
  const filename = `${baseSlug}${dayLabel ? `-${dayLabel.toLowerCase()}` : ''}-${suffix}.png`;

  const outUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = outUrl;
  link.download = filename;
  link.click();

  return filename;
}
