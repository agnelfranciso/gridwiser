import { toPng } from 'html-to-image';

type ToPngOptions = NonNullable<Parameters<typeof toPng>[1]>;

const FONT_CSS_VARS = [
  '--font-inter',
  '--font-geist',
  '--font-ibm-plex-mono',
  '--font-plus-jakarta',
  '--font-jetbrains-mono',
  '--font-space-grotesk',
  '--font-dm-sans',
  '--font-newsreader',
  '--font-syne',
  '--font-outfit',
] as const;

const dataUrlCache = new Map<string, string>();
let cachedFontEmbedCSS: string | null = null;

async function fetchAsDataUrl(url: string): Promise<string | null> {
  const cached = dataUrlCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'same-origin' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (dataUrl) {
      dataUrlCache.set(url, dataUrl);
      return dataUrl;
    }
    return null;
  } catch {
    return null;
  }
}

async function inlineFontRuleUrls(cssText: string, baseHref: string): Promise<string> {
  const urlMatches = Array.from(cssText.matchAll(/url\((['"]?)([^)'"]+)\1\)/g));
  if (urlMatches.length === 0) return cssText;

  let result = cssText;
  for (const match of urlMatches) {
    const rawUrl = match[2];
    if (!rawUrl || rawUrl.startsWith('data:')) continue;
    let absoluteUrl = rawUrl;
    try {
      absoluteUrl = new URL(rawUrl, baseHref).toString();
    } catch {
      continue;
    }
    const dataUrl = await fetchAsDataUrl(absoluteUrl);
    if (dataUrl) {
      result = result.replace(match[0], `url("${dataUrl}")`);
    }
  }
  return result;
}

/**
 * Collect and base64-inline all accessible `@font-face` rules from `document.styleSheets`,
 * safely skipping any cross-origin stylesheet (e.g. browser extensions) that throws `SecurityError`.
 */
async function getInlinedFontEmbedCSS(): Promise<string> {
  if (typeof document === 'undefined') return '';
  if (cachedFontEmbedCSS !== null) return cachedFontEmbedCSS;

  const fontRuleTasks: Promise<string>[] = [];
  const docBase = document.baseURI || window.location.href;

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet without CORS headers — skip safely
      continue;
    }

    const sheetBase = sheet.href || docBase;
    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        fontRuleTasks.push(inlineFontRuleUrls(rule.cssText, sheetBase));
      }
    }
  }

  const resolvedRules = await Promise.all(fontRuleTasks);
  cachedFontEmbedCSS = resolvedRules.filter(Boolean).join('\n');
  return cachedFontEmbedCSS;
}

function getResolvedFontVarStyles(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const htmlStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const resolved: Record<string, string> = {};

  for (const varName of FONT_CSS_VARS) {
    const val =
      bodyStyle.getPropertyValue(varName).trim() ||
      htmlStyle.getPropertyValue(varName).trim();
    if (val) {
      resolved[varName] = val;
    }
  }

  // Also ensure root font-size / box-sizing consistency inside SVG foreignObject
  const bodyFont = bodyStyle.fontFamily;
  if (bodyFont) {
    resolved.fontFamily = bodyFont;
  }

  return resolved;
}

/**
 * Wrapper around html-to-image's `toPng` that:
 * 1. Waits for `document.fonts.ready`
 * 2. Copies all Next.js `--font-*` CSS variables onto the cloned root so fonts never fall back to serif/oversized system fonts
 * 3. Base64-inlines accessible `@font-face` assets while skipping cross-origin stylesheets that throw `SecurityError`
 */
export async function safeToPng(
  node: HTMLElement,
  options: ToPngOptions = {}
): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const [fontEmbedCSS, fontVarStyles] = await Promise.all([
    options.fontEmbedCSS !== undefined
      ? Promise.resolve(options.fontEmbedCSS)
      : getInlinedFontEmbedCSS(),
    Promise.resolve(getResolvedFontVarStyles()),
  ]);

  const width = options.width ?? node.scrollWidth;
  const height = options.height ?? node.scrollHeight;

  const mergedStyle: Record<string, string> = {
    ...fontVarStyles,
    ...(options.style as Record<string, string> | undefined),
    margin: '0',
  };

  try {
    return await toPng(node, {
      ...options,
      width,
      height,
      fontEmbedCSS,
      style: mergedStyle,
    });
  } catch {
    return await toPng(node, {
      ...options,
      width,
      height,
      skipFonts: true,
      style: mergedStyle,
    });
  }
}
