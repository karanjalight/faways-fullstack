export const KENYAN_INSURERS = [
  'AAR Insurance Kenya',
  'APA Insurance',
  'Britam Insurance',
  'CIC Insurance',
  'First Assurance',
  'GA Insurance',
  'Heritage Insurance',
  'ICEA LION Group',
  'Jubilee Health Insurance',
  'Kenindia Assurance',
  'Kenya Orient Insurance',
  'KRA (Kenya Revenue Authority)',
  'Madison Insurance',
  'Mayfair Insurance',
  'Old Mutual General Insurance Kenya',
  'Pioneer Insurance',
  'Resolution Insurance',
  'Sanlam General Insurance',
  'SHA (Social Health Authority)',
  'TAUSI Assurance',
  'Trident Insurance',
  'UAP Old Mutual',
] as const;

export const SELF_PAY = 'Self Pay';

export const CUSTOM_INSURANCE_OPTION = '__custom__';

const CUSTOM_INSURERS_STORAGE_KEY = 'faways_custom_insurers';

export function getCustomInsurers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_INSURERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function addCustomInsurer(name: string): void {
  const trimmed = name.trim();
  if (!trimmed || typeof window === 'undefined') return;
  if ((KENYAN_INSURERS as readonly string[]).includes(trimmed) || trimmed === SELF_PAY) {
    return;
  }
  const existing = getCustomInsurers();
  if (existing.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
  window.localStorage.setItem(
    CUSTOM_INSURERS_STORAGE_KEY,
    JSON.stringify([...existing, trimmed].sort((a, b) => a.localeCompare(b))),
  );
}

export function getAllInsurers(customInsurers: string[] = getCustomInsurers()): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const name of [...KENYAN_INSURERS, ...customInsurers]) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(name);
  }
  return merged;
}

export function isListedInsurer(
  name: string,
  customInsurers: string[] = getCustomInsurers(),
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed === SELF_PAY) return true;
  return getAllInsurers(customInsurers).some(
    (insurer) => insurer.toLowerCase() === trimmed.toLowerCase(),
  );
}
