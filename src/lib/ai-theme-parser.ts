import type {
  CustomTemplateDefinition,
  PresetLayoutKind,
  TemplateFontFamily,
} from '@/types/timetable';

export const AI_THEME_GENERATOR_PROMPT = `You are a world-class UI design system architect. Create a custom, production-grade architectural timetable theme based on the user's description.

Rules:
1. Return ONLY raw valid JSON — no markdown code fences (\`\`\`json), no introductory or concluding text.
2. Ensure accessible visual contrast: text must be clearly legible against surfaceBg, canvasBg, and cardBg.
3. "layout" MUST be one of:
   - "cron-sidebar-grid" (Pro time axis & lanes)
   - "bento-dashboard" (Asymmetric widgets & focus blocks)
   - "crimson-pulse" (Banner header with progress telemetry)
   - "horizontal-timeline" (Swiss clean day rows)
   - "magazine-spread" (Editorial serif publication style)
   - "day-columns" (Linear vertical day lanes)
   - "terminal-table" (Monospace hacker index table)
   - "poster-tiles" (High-impact brutalist poster cards)
4. "mode" MUST be "dark" or "light".
5. "bgPattern" MUST be "solid", "dots", or "grid".
6. "displayFont" and "bodyFont" MUST be one of:
   - "inter", "geist", "plus-jakarta", "space-grotesk", "dm-sans", "newsreader", "syne", "outfit", "jetbrains-mono"
7. "monoFamily" MUST be "geist-mono" or "jetbrains-mono".
8. "radiusPx" must be a number between 0 and 28.
9. "tokens" must provide hex colors (#RRGGBB) or rgba() for:
   - canvasBg (main workspace background)
   - surfaceBg (container/drawer backdrop)
   - cardBg (timetable session cards)
   - cardElevatedBg (active/highlighted cards)
   - border (subtle card borders)
   - borderStrong (prominent borders & focus rings)
   - text (primary heading & subject titles)
   - textMuted (times, room labels, meta details)
   - accent (vibrant brand focus color)
   - accentSoft (translucent tint of accent for badges, e.g. "rgba(..., 0.15)")
   - headerBannerBg (optional CSS radial/linear gradient string, or "")

Return this exact JSON schema:
{
  "name": "Tokyo Cyberpunk",
  "category": "Futuristic",
  "description": "Electric cyan and magenta glowing telemetry on deep midnight obsidian.",
  "layout": "bento-dashboard",
  "mode": "dark",
  "bgPattern": "dots",
  "displayFont": "space-grotesk",
  "bodyFont": "inter",
  "monoFamily": "geist-mono",
  "radiusPx": 14,
  "tokens": {
    "canvasBg": "#0A0B14",
    "surfaceBg": "#121424",
    "cardBg": "#181B30",
    "cardElevatedBg": "#222644",
    "border": "#2B3056",
    "borderStrong": "#444D87",
    "text": "#F0F4FF",
    "textMuted": "#8D96C4",
    "accent": "#00F0FF",
    "accentSoft": "rgba(0, 240, 255, 0.16)",
    "headerBannerBg": "radial-gradient(85% 120% at 80% 0%, rgba(0, 240, 255, 0.35) 0%, rgba(18, 20, 36, 0.95) 75%)"
  }
}`;

const VALID_LAYOUTS: PresetLayoutKind[] = [
  'cron-sidebar-grid',
  'bento-dashboard',
  'crimson-pulse',
  'horizontal-timeline',
  'magazine-spread',
  'day-columns',
  'terminal-table',
  'poster-tiles',
  'editorial-light-grid',
  'athletic-columns',
  'daily-poster',
  'daily-deck',
  'exhibition-daily',
];

const VALID_FONTS: TemplateFontFamily[] = [
  'inter',
  'geist',
  'plus-jakarta',
  'space-grotesk',
  'dm-sans',
  'newsreader',
  'syne',
  'outfit',
  'jetbrains-mono',
];

export function parseAiThemeJson(rawInput: string): Partial<CustomTemplateDefinition> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please paste your AI theme JSON.');
  }

  // Strip code fences if the user included them
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid JSON format. Check for missing quotes or commas.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed theme must be a valid JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 80) : 'AI Generated Theme';
  const category = typeof obj.category === 'string' ? obj.category.trim().slice(0, 40) : 'AI Custom';
  const description = typeof obj.description === 'string' ? obj.description.trim().slice(0, 240) : 'Generated with AI Theme Studio.';

  const rawLayout = String(obj.layout || 'cron-sidebar-grid') as PresetLayoutKind;
  const layout: PresetLayoutKind = VALID_LAYOUTS.includes(rawLayout) ? rawLayout : 'cron-sidebar-grid';

  const mode: 'dark' | 'light' = obj.mode === 'light' ? 'light' : 'dark';
  const bgPattern: 'solid' | 'dots' | 'grid' =
    obj.bgPattern === 'dots' || obj.bgPattern === 'grid' ? obj.bgPattern : 'solid';

  const rawDisplay = String(obj.displayFont || 'inter') as TemplateFontFamily;
  const displayFont = VALID_FONTS.includes(rawDisplay) ? rawDisplay : 'inter';

  const rawBody = String(obj.bodyFont || 'inter') as TemplateFontFamily;
  const bodyFont = VALID_FONTS.includes(rawBody) ? rawBody : 'inter';

  const monoFamily = obj.monoFamily === 'jetbrains-mono' ? 'jetbrains-mono' : 'geist-mono';
  const radiusPx = Math.min(Math.max(Number(obj.radiusPx) || 12, 0), 28);

  const rawTokens = (typeof obj.tokens === 'object' && obj.tokens !== null ? obj.tokens : {}) as Record<string, unknown>;

  const tokens = {
    canvasBg: typeof rawTokens.canvasBg === 'string' ? rawTokens.canvasBg : mode === 'dark' ? '#09090B' : '#F8FAFC',
    surfaceBg: typeof rawTokens.surfaceBg === 'string' ? rawTokens.surfaceBg : mode === 'dark' ? '#121215' : '#FFFFFF',
    cardBg: typeof rawTokens.cardBg === 'string' ? rawTokens.cardBg : mode === 'dark' ? '#18181D' : '#F1F5F9',
    cardElevatedBg: typeof rawTokens.cardElevatedBg === 'string' ? rawTokens.cardElevatedBg : mode === 'dark' ? '#202026' : '#E2E8F0',
    border: typeof rawTokens.border === 'string' ? rawTokens.border : mode === 'dark' ? '#272730' : '#E2E8F0',
    borderStrong: typeof rawTokens.borderStrong === 'string' ? rawTokens.borderStrong : mode === 'dark' ? '#383844' : '#CBD5E1',
    text: typeof rawTokens.text === 'string' ? rawTokens.text : mode === 'dark' ? '#FAFAFA' : '#0F172A',
    textMuted: typeof rawTokens.textMuted === 'string' ? rawTokens.textMuted : mode === 'dark' ? '#A1A1AA' : '#64748B',
    accent: typeof rawTokens.accent === 'string' ? rawTokens.accent : '#3B82F6',
    accentSoft: typeof rawTokens.accentSoft === 'string' ? rawTokens.accentSoft : 'rgba(59, 130, 246, 0.16)',
    headerBannerBg: typeof rawTokens.headerBannerBg === 'string' ? rawTokens.headerBannerBg : '',
  };

  return {
    name,
    category,
    description,
    layout,
    mode,
    bgPattern,
    displayFont,
    bodyFont,
    monoFamily,
    radiusPx,
    tokens,
  };
}
