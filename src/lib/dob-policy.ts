/**
 * Date of Birth & India DPDP Act 2023 age-gate helpers.
 * - Under 13: blocked from creating cloud accounts.
 * - 13 to 17: allowed with explicit parent/guardian consent.
 * - 18+: allowed independently.
 */

export function calculateAgeFromDob(dobIso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) return null;
  const [year, month, day] = dobIso.split('-').map(Number);
  const birth = new Date(year, month - 1, day);
  if (
    Number.isNaN(birth.getTime()) ||
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() - (month - 1);
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }
  return age;
}

export function validateSignupDob(
  dobIso: string,
  guardianConsent: boolean
):
  | { ok: true; age: number; isMinor: boolean }
  | { ok: false; needsGuardianConsent?: boolean; reason: string } {
  if (!dobIso.trim()) {
    return {
      ok: false,
      reason: 'Please enter your date of birth to verify age eligibility.',
    };
  }

  const age = calculateAgeFromDob(dobIso);
  if (age === null || age < 0 || age > 120) {
    return {
      ok: false,
      reason: 'Please enter a valid date of birth.',
    };
  }

  if (age < 13) {
    return {
      ok: false,
      reason:
        'You must be at least 13 years old to create a GridWiser cloud account.',
    };
  }

  if (age < 18 && !guardianConsent) {
    return {
      ok: false,
      needsGuardianConsent: true,
      reason:
        'Under India’s DPDP Act, 2023, users aged 13–17 require parent or legal guardian consent.',
    };
  }

  return { ok: true, age, isMinor: age < 18 };
}

/**
 * Generates a random valid adult DOB (ages 19–25) for legacy accounts
 * created before DOB collection was introduced.
 */
export function generateRandomAdultDob(): string {
  const now = new Date();
  const ageYears = 19 + Math.floor(Math.random() * 7); // 19..25
  const year = now.getFullYear() - ageYears;
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
