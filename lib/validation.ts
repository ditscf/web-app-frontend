const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS_PATTERN = /^\+?[\d\s-]+$/;
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 13;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function isValidPhone(value: string): boolean {
  if (!PHONE_CHARACTERS_PATTERN.test(value)) return false;

  const digitCount = value.replace(/\D/g, '').length;
  return digitCount >= MIN_PHONE_DIGITS && digitCount <= MAX_PHONE_DIGITS;
}
