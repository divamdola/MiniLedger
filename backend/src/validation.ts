export function isValidPhone(value: unknown): value is string {
  return normalizePhone(value) !== null;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[\s().-]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(normalized) ? normalized : null;
}

export function isValidOtp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

export function isValidFriendName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100;
}

export function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000;
}

export function isValidDueDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}