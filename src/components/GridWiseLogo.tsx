'use client';

import React from 'react';

interface GridWiseLogoMarkProps {
  size?: number;
  tone?: 'auto' | 'light' | 'dark' | 'glass';
  accentColor?: string;
}

/**
 * Minimal architectural bento-grid mark representing scheduled time blocks & layout presets.
 */
export function GridWiseLogoMark({
  size = 28,
  tone = 'dark',
  accentColor = '#60A5FA',
}: GridWiseLogoMarkProps) {
  const isLightContainer = tone === 'light';
  const isGlass = tone === 'glass';

  const bgFill = isLightContainer
    ? '#FFFFFF'
    : isGlass
      ? 'rgba(255, 255, 255, 0.12)'
      : '#111115';

  const strokeColor = isLightContainer
    ? '#E4E4E7'
    : isGlass
      ? 'rgba(255, 255, 255, 0.22)'
      : '#2A2A33';

  const primaryBlock = isLightContainer ? '#09090B' : '#FAFAFA';
  const mutedBlock = isLightContainer ? '#A1A1AA' : '#52525B';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8.5" fill={bgFill} />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.75"
        stroke={strokeColor}
        strokeWidth="1.25"
      />
      {/* Top-left 2-slot vertical block */}
      <rect x="6.5" y="6.5" width="7.5" height="11" rx="2" fill={primaryBlock} />
      {/* Top-right focal accent block */}
      <rect x="16" y="6.5" width="9.5" height="6" rx="2" fill={accentColor} />
      {/* Middle-right slim time bar */}
      <rect x="16" y="14.5" width="9.5" height="3" rx="1.5" fill={mutedBlock} />
      {/* Bottom-left block */}
      <rect x="6.5" y="19.5" width="7.5" height="6" rx="2" fill={mutedBlock} />
      {/* Bottom-right block */}
      <rect
        x="16"
        y="19.5"
        width="9.5"
        height="6"
        rx="2"
        fill={primaryBlock}
        fillOpacity="0.88"
      />
    </svg>
  );
}

interface GridWiseBrandProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light' | 'glass';
  accentColor?: string;
  subtitle?: string;
}

export function GridWiseBrand({
  size = 'md',
  tone = 'dark',
  accentColor = '#60A5FA',
  subtitle,
}: GridWiseBrandProps) {
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 34 : 28;
  const textSize =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const textColor = tone === 'light' ? 'text-zinc-950' : 'text-white';

  return (
    <div className="inline-flex items-center gap-2.5">
      <GridWiseLogoMark size={iconSize} tone={tone} accentColor={accentColor} />
      <div className="flex flex-col leading-none">
        <span className={`font-semibold tracking-tight ${textSize} ${textColor}`}>
          GridWiser
        </span>
        {subtitle && (
          <span className="mt-0.5 text-[10px] text-zinc-400">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
