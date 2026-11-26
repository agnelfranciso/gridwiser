'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface GridDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  maxDate?: string; // YYYY-MM-DD
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return { y, m: m - 1, d };
}

function formatDisplay(iso: string, placeholder: string): string {
  const p = parseIso(iso);
  if (!p) return placeholder;
  const dt = new Date(p.y, p.m, p.d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GridDatePicker({
  value,
  onChange,
  maxDate,
  minYear = 1940,
  maxYear = 2035,
  placeholder = 'Select date',
  className = '',
}: GridDatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const parsed = parseIso(value);
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.y ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? now.getMonth());
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popW = 288;
    const popH = 310;
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

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();

  const handleToggle = () => {
    if (!open) {
      if (parsed) {
        setViewYear(parsed.y);
        setViewMonth(parsed.m);
      }
      updatePosition();
    }
    setOpen((p) => !p);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(minYear, y - 1));
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(maxYear, y + 1));
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#25252E] bg-[#0A0A0D] px-3 py-2 text-left text-xs text-white transition hover:border-zinc-500 focus:border-blue-500 focus:outline-none"
      >
        <span className={parsed ? 'text-white' : 'text-zinc-500'}>
          {formatDisplay(value, placeholder)}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] w-72 rounded-xl border border-[#262834] bg-[#0B0D14] p-3 shadow-2xl"
          >
            {/* Month & Year Controls */}
            <div className="mb-2.5 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg border border-[#222532] bg-[#12151F] p-1 text-zinc-300 transition hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="rounded-lg border border-[#222532] bg-[#12151F] px-2 py-1 text-[11px] font-medium text-white focus:outline-none"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name.slice(0, 3)}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="rounded-lg border border-[#222532] bg-[#12151F] px-2 py-1 font-mono text-[11px] font-medium text-white focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg border border-[#222532] bg-[#12151F] p-1 text-zinc-300 transition hover:text-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="mb-1 grid grid-cols-7 text-center font-mono text-[10px] text-zinc-500">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="py-1">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = value === iso;
                const isDisabled = Boolean(maxDate && iso > maxDate);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`rounded-lg py-1.5 text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 font-semibold text-white shadow-sm'
                        : isDisabled
                          ? 'cursor-not-allowed text-zinc-700'
                          : 'text-zinc-300 hover:bg-[#191C28] hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
