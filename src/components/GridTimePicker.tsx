'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/schedule-engine';

interface GridTimePickerProps {
  value: string; // HH:MM (24h)
  onChange: (hhmm: string) => void;
  timeFormat?: '12h' | '24h';
  className?: string;
}

const MINUTE_PRESETS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function GridTimePicker({
  value,
  onChange,
  timeFormat = '12h',
  className = '',
}: GridTimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const [rawH, rawM] = (value || '09:00').split(':');
  const h24 = Math.min(23, Math.max(0, parseInt(rawH || '9', 10) || 0));
  const mVal = Math.min(59, Math.max(0, parseInt(rawM || '0', 10) || 0));
  const mStr = String(mVal).padStart(2, '0');
  const isPm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popW = 240;
    const popH = 240;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - popW - 12));
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= popH + 8 || spaceBelow >= rect.top
        ? rect.bottom + 6
        : Math.max(12, rect.top - popH - 6);
    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  const setHour24 = (nextH24: number) => {
    onChange(`${String(nextH24).padStart(2, '0')}:${mStr}`);
  };

  const setMinute = (nextM: string) => {
    onChange(`${String(h24).padStart(2, '0')}:${nextM}`);
  };

  const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const hours24 = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((p) => !p);
        }}
        className="flex w-full items-center justify-between gap-1.5 rounded-xl border border-[#25252E] bg-[#0A0A0D] px-2.5 py-2 text-left font-mono text-[11px] text-white transition hover:border-zinc-500 focus:border-blue-500 focus:outline-none"
      >
        <span className="truncate">{formatTimeDisplay(value || '09:00', timeFormat)}</span>
        <Clock className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] w-60 rounded-xl border border-[#262834] bg-[#0B0D14] p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between border-b border-[#1D1F2A] pb-2">
              <span className="font-mono text-[11px] font-semibold text-white">
                {formatTimeDisplay(value || '09:00', timeFormat)}
              </span>
              {timeFormat === '12h' && (
                <div className="flex rounded-lg border border-[#222532] bg-[#12151F] p-0.5 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPm) setHour24(h24 - 12);
                    }}
                    className={`rounded-md px-2 py-0.5 transition ${
                      !isPm ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPm) setHour24(h24 + 12);
                    }}
                    className={`rounded-md px-2 py-0.5 transition ${
                      isPm ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Hours */}
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Hour
                </div>
                <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto pr-0.5">
                  {timeFormat === '12h'
                    ? hours12.map((h) => {
                        const active = h === h12;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              const next24 = isPm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
                              setHour24(next24);
                            }}
                            className={`rounded-md py-1 font-mono text-[11px] transition ${
                              active
                                ? 'bg-blue-600 font-semibold text-white'
                                : 'bg-[#12151F] text-zinc-300 hover:bg-[#1C2030]'
                            }`}
                          >
                            {String(h).padStart(2, '0')}
                          </button>
                        );
                      })
                    : hours24.map((h) => {
                        const active = h === h24;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHour24(h)}
                            className={`rounded-md py-1 font-mono text-[11px] transition ${
                              active
                                ? 'bg-blue-600 font-semibold text-white'
                                : 'bg-[#12151F] text-zinc-300 hover:bg-[#1C2030]'
                            }`}
                          >
                            {String(h).padStart(2, '0')}
                          </button>
                        );
                      })}
                </div>
              </div>

              {/* Minutes */}
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Min
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MINUTE_PRESETS.map((m) => {
                    const active = m === mStr;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMinute(m);
                          setOpen(false);
                        }}
                        className={`rounded-md py-1 font-mono text-[11px] transition ${
                          active
                            ? 'bg-blue-600 font-semibold text-white'
                            : 'bg-[#12151F] text-zinc-300 hover:bg-[#1C2030]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
