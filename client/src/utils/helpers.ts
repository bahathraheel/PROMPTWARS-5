import { format, formatDistanceToNow, differenceInDays, parseISO, isValid } from 'date-fns';

/**
 * Format a date string for display.
 * @param dateStr - ISO date string
 * @param fmt - date-fns format string
 */
export function formatDate(dateStr: string | null | undefined, fmt = 'MMMM d, yyyy'): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, fmt);
  } catch {
    return '—';
  }
}

/**
 * Format a date as relative time ("3 days ago", "in 5 days").
 */
export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

/**
 * Get days remaining until a date.
 * Positive = in the future; negative = in the past.
 */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    return differenceInDays(date, new Date());
  } catch {
    return null;
  }
}

/**
 * Format currency with locale-aware formatting.
 * @param amount - Numeric amount
 * @param currency - ISO 4217 currency code (e.g. 'USD', 'INR')
 */
export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Format a number with comma separators.
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Calculate the percentage of a value within a total.
 * Safe against division by zero.
 */
export function percentage(value: number, total: number, decimals = 1): number {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate a string to maxLength, appending ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a human-readable event type label.
 */
export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    wedding:          'Wedding',
    engagement:       'Engagement',
    birthday:         'Birthday',
    anniversary:      'Anniversary',
    college_festival: 'College Festival',
    corporate:        'Corporate Event',
    community:        'Community Event',
    baby_shower:      'Baby Shower',
    graduation:       'Graduation',
    private_party:    'Private Party',
    other:            'Other',
  };
  return labels[type] || type;
}

/**
 * Get a color class for an event status.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning:    'badge-primary',
    confirmed:   'badge-success',
    in_progress: 'badge-warning',
    completed:   'badge-neutral',
    cancelled:   'badge-error',
  };
  return colors[status] || 'badge-neutral';
}

/**
 * Get a color class for task priority.
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: 'badge-error',
    high:   'badge-warning',
    medium: 'badge-primary',
    low:    'badge-neutral',
  };
  return colors[priority] || 'badge-neutral';
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate initials from a display name.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate a random UUID-like ID (client-side, for temp IDs).
 */
export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

/**
 * Sum an array of numbers safely.
 */
export function sum(arr: (number | undefined | null)[]): number {
  return arr.reduce((acc, val) => acc + (val ?? 0), 0);
}

/**
 * Budget calculation: total spent in a category.
 */
export function calcCategoryBalance(estimated: number, actual: number): {
  remaining: number;
  isOverBudget: boolean;
  overBy: number;
} {
  const remaining = estimated - actual;
  const isOverBudget = actual > estimated;
  const overBy = isOverBudget ? actual - estimated : 0;
  return { remaining, isOverBudget, overBy };
}

/**
 * Export an array of objects as a CSV string.
 */
export function objectsToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download a string as a file.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Sanitize text to prevent XSS when inserting into the DOM.
 * Use only with textContent — not innerHTML.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
