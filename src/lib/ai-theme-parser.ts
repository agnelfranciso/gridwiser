import type {
  CustomTemplateDefinition,
  PresetLayoutKind,
  TemplateFontFamily,
} from '@/types/timetable';

export const AI_THEME_GENERATOR_PROMPT = `You are a world-class UI design system architect. Create an ultra-custom, high-fidelity architectural timetable theme based on the user's vision.

Strict Rules:
1. Return ONLY raw valid JSON — no markdown code fences (\`\`\`json), no introductory, conversational, or concluding text.
2. Ensure accessible visual contrast: text must be clearly legible against surfaceBg, canvasBg, and cardBg.
3. "layout" MUST be one of:
   - "cron-sidebar-grid" (Pro horizontal time axis & subtle lanes — modern Gantt-like precision)
   - "bento-dashboard" (Asymmetric widgets, weekly focus tiles & KPI stats)
   - "crimson-pulse" (Ruby gradient header telemetry with segmented summary load bar)
   - "horizontal-timeline" (Swiss clean day rows & clean horizontal track)
   - "magazine-spread" (Editorial serif newspaper editorial aesthetic)
   - "day-columns" (Linear vertical day lanes with clean column separation)
   - "terminal-table" (Monospace hacker index table with retro dev styling)
   - "poster-tiles" (High-impact brutalist poster cards with bold typography)
4. "mode" MUST be "dark" or "light".
5. "bgPattern" MUST be "solid", "dots", or "grid".
6. "displayFont" and "bodyFont" MUST be one of:
   - "inter", "geist", "plus-jakarta", "space-grotesk", "dm-sans", "newsreader", "syne", "outfit", "jetbrains-mono"
7. "monoFamily" MUST be "geist-mono" or "jetbrains-mono".
8. "radiusPx" must be an integer between 0 and 28 (0 = sharp brutalist/terminal, 12 = modern standard, 24 = pill/bento).
9. "tokens" must provide hex colors (#RRGGBB) or rgba() for:
   - canvasBg (main workspace canvas background)
   - surfaceBg (container/drawer backdrop)
   - cardBg (standard timetable subject session cards)
   - cardElevatedBg (active/hovered/highlighted cards)
   - border (subtle card borders & grid line dividers)
   - borderStrong (prominent borders, day headers, active focus rings)
   - text (primary headings, session names, subject codes)
   - textMuted (timestamps, room numbers, instructors, secondary metadata)
   - accent (vibrant focal color for dots, active indicators, badges)
   - accentSoft (translucent tint of accent, e.g. "rgba(..., 0.16)")
   - headerBannerBg (optional CSS radial/linear gradient string, or "")

Return this exact JSON schema:
{
  "name": "Tokyo Cyberpunk Neon",
  "category": "Futuristic",
  "description": "High-voltage electric cyan and radiant magenta telemetry across pitch-black obsidian grid layers.",
  "layout": "bento-dashboard",
  "mode": "dark",
  "bgPattern": "dots",
  "displayFont": "space-grotesk",
  "bodyFont": "inter",
  "monoFamily": "geist-mono",
  "radiusPx": 14,
  "tokens": {
    "canvasBg": "#08090F",
    "surfaceBg": "#10121E",
    "cardBg": "#16182B",
    "cardElevatedBg": "#212542",
    "border": "#2B3054",
    "borderStrong": "#444C82",
    "text": "#F3F6FF",
    "textMuted": "#8E98C7",
    "accent": "#00F0FF",
    "accentSoft": "rgba(0, 240, 255, 0.16)",
    "headerBannerBg": "radial-gradient(90% 130% at 85% 0%, rgba(0, 240, 255, 0.4) 0%, rgba(236, 72, 153, 0.25) 45%, rgba(16, 18, 30, 0.95) 85%)"
  }
}`;

export interface CuratedPalettePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  layout: PresetLayoutKind;
  mode: 'dark' | 'light';
  bgPattern: 'solid' | 'dots' | 'grid';
  displayFont: TemplateFontFamily;
  bodyFont: TemplateFontFamily;
  monoFamily: 'geist-mono' | 'jetbrains-mono';
  radiusPx: number;
  tokens: {
    canvasBg: string;
    surfaceBg: string;
    cardBg: string;
    cardElevatedBg: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    headerBannerBg?: string;
  };
}

export const CURATED_THEME_PALETTES: CuratedPalettePreset[] = [
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyberpunk',
    category: 'Futuristic',
    description: 'Electric cyan and neon magenta telemetry glowing on deep obsidian night.',
    layout: 'bento-dashboard',
    mode: 'dark',
    bgPattern: 'dots',
    displayFont: 'space-grotesk',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 16,
    tokens: {
      canvasBg: '#08090F',
      surfaceBg: '#10121E',
      cardBg: '#16182B',
      cardElevatedBg: '#212542',
      border: '#2B3054',
      borderStrong: '#444C82',
      text: '#F3F6FF',
      textMuted: '#8E98C7',
      accent: '#00F0FF',
      accentSoft: 'rgba(0, 240, 255, 0.16)',
      headerBannerBg:
        'radial-gradient(90% 130% at 85% 0%, rgba(0, 240, 255, 0.4) 0%, rgba(236, 72, 153, 0.25) 45%, rgba(16, 18, 30, 0.95) 85%)',
    },
  },
  {
    id: 'matcha-minimal',
    name: 'Kyoto Matcha Minimal',
    category: 'Japanese Minimalist',
    description: 'Earthy wasabi greens, stone white cards, and organic bamboo tones.',
    layout: 'cron-sidebar-grid',
    mode: 'light',
    bgPattern: 'dots',
    displayFont: 'dm-sans',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 12,
    tokens: {
      canvasBg: '#F5F5F0',
      surfaceBg: '#EDEDE6',
      cardBg: '#FFFFFF',
      cardElevatedBg: '#F9FBF8',
      border: '#E0E0D4',
      borderStrong: '#C5C7B2',
      text: '#222822',
      textMuted: '#687467',
      accent: '#3E7B4C',
      accentSoft: 'rgba(62, 123, 76, 0.14)',
    },
  },
  {
    id: 'synthwave-sunset',
    name: 'Sunset Lo-Fi Synth',
    category: 'Retro Wave',
    description: 'Warm purple twilight, amber accents, and glowing cassette aesthetics.',
    layout: 'crimson-pulse',
    mode: 'dark',
    bgPattern: 'grid',
    displayFont: 'syne',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 18,
    tokens: {
      canvasBg: '#100B1B',
      surfaceBg: '#181228',
      cardBg: '#211838',
      cardElevatedBg: '#2E224E',
      border: '#3B2D62',
      borderStrong: '#584491',
      text: '#FAF5FF',
      textMuted: '#A493CC',
      accent: '#F59E0B',
      accentSoft: 'rgba(245, 158, 11, 0.18)',
      headerBannerBg:
        'radial-gradient(90% 130% at 85% 0%, rgba(245, 158, 11, 0.5) 0%, rgba(217, 70, 239, 0.3) 40%, rgba(24, 18, 40, 0.96) 80%)',
    },
  },
  {
    id: 'stealth-obsidian',
    name: 'Stealth Matte Obsidian',
    category: 'Minimal Dark',
    description: 'Pure stealth architectural blacks, titanium gray hairline borders, ice blue dot.',
    layout: 'day-columns',
    mode: 'dark',
    bgPattern: 'solid',
    displayFont: 'geist',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 8,
    tokens: {
      canvasBg: '#050507',
      surfaceBg: '#0B0B0E',
      cardBg: '#111116',
      cardElevatedBg: '#18181F',
      border: '#1F1F28',
      borderStrong: '#2F2F3D',
      text: '#F4F4F5',
      textMuted: '#71717A',
      accent: '#38BDF8',
      accentSoft: 'rgba(56, 189, 248, 0.14)',
    },
  },
  {
    id: 'editorial-vogue',
    name: 'Editorial Vogue Ivory',
    category: 'Luxury Print',
    description: 'Warm creamy alabaster paper, refined serif headlines, and rich cognac accents.',
    layout: 'magazine-spread',
    mode: 'light',
    bgPattern: 'solid',
    displayFont: 'newsreader',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 4,
    tokens: {
      canvasBg: '#FAF7F2',
      surfaceBg: '#F2EDE4',
      cardBg: '#FFFFFF',
      cardElevatedBg: '#FFFDF9',
      border: '#E8DFC8',
      borderStrong: '#CBBFA0',
      text: '#1C1917',
      textMuted: '#78716C',
      accent: '#9A3412',
      accentSoft: 'rgba(154, 52, 18, 0.12)',
    },
  },
  {
    id: 'terminal-amber',
    name: 'Retro Amber CRT',
    category: 'Vintage Hardware',
    description: 'Vintage 1980s phosphor amber glow on crt charcoal terminal console.',
    layout: 'terminal-table',
    mode: 'dark',
    bgPattern: 'grid',
    displayFont: 'jetbrains-mono',
    bodyFont: 'jetbrains-mono',
    monoFamily: 'jetbrains-mono',
    radiusPx: 0,
    tokens: {
      canvasBg: '#0C0A06',
      surfaceBg: '#151209',
      cardBg: '#1C180C',
      cardElevatedBg: '#27210F',
      border: '#382F15',
      borderStrong: '#5E4E21',
      text: '#FDE68A',
      textMuted: '#B49C52',
      accent: '#F59E0B',
      accentSoft: 'rgba(245, 158, 11, 0.2)',
    },
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald Banking',
    category: 'Fintech Luxury',
    description: 'Deep forest green jewel tones with gold borders and crisp white typography.',
    layout: 'bento-dashboard',
    mode: 'dark',
    bgPattern: 'dots',
    displayFont: 'plus-jakarta',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 20,
    tokens: {
      canvasBg: '#05120B',
      surfaceBg: '#0A1C12',
      cardBg: '#0F291B',
      cardElevatedBg: '#163B27',
      border: '#1F4D34',
      borderStrong: '#2C6C49',
      text: '#ECFDF5',
      textMuted: '#6EE7B7',
      accent: '#10B981',
      accentSoft: 'rgba(16, 185, 129, 0.2)',
      headerBannerBg:
        'radial-gradient(90% 120% at 85% 0%, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.2) 50%, rgba(10, 28, 18, 0.95) 85%)',
    },
  },
];

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

  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid JSON format. Check for missing quotes, brackets, or commas.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed theme must be a valid JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  const name =
    typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 80) : 'AI Generated Theme';
  const category =
    typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim().slice(0, 40) : 'AI Custom';
  const description =
    typeof obj.description === 'string' && obj.description.trim()
      ? obj.description.trim().slice(0, 240)
      : 'Generated with AI Theme Studio.';

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

  const rawTokens =
    typeof obj.tokens === 'object' && obj.tokens !== null
      ? (obj.tokens as Record<string, unknown>)
      : {};

  const tokens = {
    canvasBg:
      typeof rawTokens.canvasBg === 'string' && rawTokens.canvasBg.trim()
        ? rawTokens.canvasBg.trim()
        : mode === 'dark'
          ? '#09090B'
          : '#F8FAFC',
    surfaceBg:
      typeof rawTokens.surfaceBg === 'string' && rawTokens.surfaceBg.trim()
        ? rawTokens.surfaceBg.trim()
        : mode === 'dark'
          ? '#121215'
          : '#FFFFFF',
    cardBg:
      typeof rawTokens.cardBg === 'string' && rawTokens.cardBg.trim()
        ? rawTokens.cardBg.trim()
        : mode === 'dark'
          ? '#18181D'
          : '#F1F5F9',
    cardElevatedBg:
      typeof rawTokens.cardElevatedBg === 'string' && rawTokens.cardElevatedBg.trim()
        ? rawTokens.cardElevatedBg.trim()
        : mode === 'dark'
          ? '#202026'
          : '#E2E8F0',
    border:
      typeof rawTokens.border === 'string' && rawTokens.border.trim()
        ? rawTokens.border.trim()
        : mode === 'dark'
          ? '#272730'
          : '#E2E8F0',
    borderStrong:
      typeof rawTokens.borderStrong === 'string' && rawTokens.borderStrong.trim()
        ? rawTokens.borderStrong.trim()
        : mode === 'dark'
          ? '#383844'
          : '#CBD5E1',
    text:
      typeof rawTokens.text === 'string' && rawTokens.text.trim()
        ? rawTokens.text.trim()
        : mode === 'dark'
          ? '#FAFAFA'
          : '#0F172A',
    textMuted:
      typeof rawTokens.textMuted === 'string' && rawTokens.textMuted.trim()
        ? rawTokens.textMuted.trim()
        : mode === 'dark'
          ? '#A1A1AA'
          : '#64748B',
    accent:
      typeof rawTokens.accent === 'string' && rawTokens.accent.trim()
        ? rawTokens.accent.trim()
        : '#3B82F6',
    accentSoft:
      typeof rawTokens.accentSoft === 'string' && rawTokens.accentSoft.trim()
        ? rawTokens.accentSoft.trim()
        : 'rgba(59, 130, 246, 0.16)',
    headerBannerBg:
      typeof rawTokens.headerBannerBg === 'string' ? rawTokens.headerBannerBg.trim() : '',
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
