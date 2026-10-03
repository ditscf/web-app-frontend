import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGIN_CODE_LENGTH = 6;

export const loginEmailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .regex(EMAIL_PATTERN, 'Enter a valid email address, like name@example.com.');

export const loginCodeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${LOGIN_CODE_LENGTH}}$`), `Enter the ${LOGIN_CODE_LENGTH}-digit code from your email.`);
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
