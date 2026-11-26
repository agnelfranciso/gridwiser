import { toPng } from 'html-to-image';

type ToPngOptions = Parameters<typeof toPng>[1];

/**
 * Collect @font-face rules from same-origin/CORS-accessible stylesheets only,
 * skipping any cross-origin stylesheet (e.g. browser extensions or external CSS)
 * that would throw `SecurityError: Failed to read 'cssRules'`.
 */
function getSafeFontEmbedCSS(): string {
  if (typeof document === 'undefined') return '';
  const fontRules: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet without CORS headers — skip safely
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        fontRules.push(rule.cssText);
      }
    }
  }

  return fontRules.join('\n');
}

/**
 * Wrapper around html-to-image's `toPng` that prevents `SecurityError` when
 * reading `CSSStyleSheet.cssRules` on cross-origin stylesheets.
 */
export async function safeToPng(
  node: HTMLElement,
  options: ToPngOptions = {}
): Promise<string> {
  const fontEmbedCSS = options.fontEmbedCSS ?? getSafeFontEmbedCSS();

  try {
    return await toPng(node, {
      ...options,
      fontEmbedCSS,
    });
  } catch {
    // Fallback if font inlining fails for any external font asset
    return await toPng(node, {
      ...options,
      skipFonts: true,
    });
  }
}
