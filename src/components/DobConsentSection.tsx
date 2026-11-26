'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { calculateAgeFromDob } from '@/lib/dob-policy';
import { GridDatePicker } from '@/components/GridDatePicker';

interface DobConsentSectionProps {
  dob: string;
  onChangeDob: (val: string) => void;
  guardianConsent: boolean;
  onChangeGuardianConsent: (val: boolean) => void;
  compact?: boolean;
}

export function DobConsentSection({
  dob,
  onChangeDob,
  guardianConsent,
  onChangeGuardianConsent,
  compact = false,
}: DobConsentSectionProps) {
  const age = dob ? calculateAgeFromDob(dob) : null;
  const isMinorEligible = age !== null && age >= 13 && age < 18;
  const isUnder13 = age !== null && age < 13;

  return (
    <div className={compact ? 'mt-4 space-y-2.5' : 'mt-5 space-y-3'}>
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-300">
          <span>Date of Birth</span>
          <span className="text-[10px] text-zinc-500">DPDP Act Age Verification</span>
        </label>
        <GridDatePicker
          value={dob}
          onChange={onChangeDob}
          maxDate={new Date().toISOString().slice(0, 10)}
          minYear={1940}
          maxYear={new Date().getFullYear()}
          placeholder="Select your date of birth"
        />
      </div>

      {isUnder13 && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          You must be at least 13 years old to create a GridWiser cloud account.
        </p>
      )}

      {isMinorEligible && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3 text-[11px] leading-relaxed text-amber-100">
          <input
            type="checkbox"
            checked={guardianConsent}
            onChange={(e) => onChangeGuardianConsent(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-amber-400/50 bg-transparent accent-blue-500"
          />
          <span>
            <strong className="inline-flex items-center gap-1 text-amber-300">
              <ShieldCheck className="h-3 w-3" />
              Parent / Guardian Consent (Ages 13–17):
            </strong>{' '}
            I confirm that my parent or legal guardian has reviewed the Terms &amp; Privacy Policy and consents to my cloud-synced account (India DPDP Act, 2023).
          </span>
        </label>
      )}
    </div>
  );
}
