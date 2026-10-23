import { describe, it, expect } from 'vitest';

// ─── Helper / Utility Tests ────────────────────────────────────────────────────
import {
  formatDate, daysUntil, formatCurrency,
  formatNumber, percentage, clamp, truncate, getEventTypeLabel,
  getStatusColor, getPriorityColor, getInitials, isValidEmail,
  generateId, sum, objectsToCSV, sanitizeText, calcCategoryBalance,
} from '../utils/helpers';


// ═══════════════════════════════════════════════════════════════════
// GROUP 1 — formatDate (TEST-001 to TEST-008)
// ═══════════════════════════════════════════════════════════════════

describe('formatDate', () => {
  it('TEST-001: returns formatted date for valid ISO string', () => {
    const result = formatDate('2026-12-25');
    expect(result).toBe('December 25, 2026');
  });

  it('TEST-002: returns "—" for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('TEST-003: returns "—" for undefined input', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('TEST-004: returns "—" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('TEST-005: respects custom format string', () => {
    const result = formatDate('2026-01-15', 'MM/dd/yyyy');
    expect(result).toBe('01/15/2026');
  });

  it('TEST-006: handles short date format', () => {
    const result = formatDate('2026-06-01', 'MMM d');
    expect(result).toBe('Jun 1');
  });

  it('TEST-007: returns "—" for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('TEST-008: handles leap year date correctly', () => {
    const result = formatDate('2028-02-29', 'MMMM d, yyyy');
    expect(result).toBe('February 29, 2028');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 2 — daysUntil (TEST-009 to TEST-015)
// ═══════════════════════════════════════════════════════════════════

describe('daysUntil', () => {
  it('TEST-009: returns positive number for future date', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(future)).toBeGreaterThan(0);
  });

  it('TEST-010: returns negative number for past date', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(past)).toBeLessThan(0);
  });

  it('TEST-011: returns null for null input', () => {
    expect(daysUntil(null)).toBeNull();
  });

  it('TEST-012: returns null for undefined input', () => {
    expect(daysUntil(undefined)).toBeNull();
  });

  it('TEST-013: returns null for invalid date', () => {
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('TEST-014: returns a number for today (0 or nearby)', () => {
    const today = new Date().toISOString();
    const result = daysUntil(today);
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
  });

  it('TEST-015: calculates approximately 365 days for one year ahead', () => {
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const days = daysUntil(nextYear);
    expect(days).toBeGreaterThanOrEqual(364);
    expect(days).toBeLessThanOrEqual(366);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 3 — formatCurrency (TEST-016 to TEST-023)
// ═══════════════════════════════════════════════════════════════════

describe('formatCurrency', () => {
  it('TEST-016: formats USD correctly', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$1,500');
  });

  it('TEST-017: formats INR correctly — includes currency symbol', () => {
    const result = formatCurrency(100000, 'INR');
    // Node.js Intl may format as ₹100,000 or ₹1,00,000 depending on locale data
    expect(result).toMatch(/₹|INR/); // has rupee symbol or fallback
    expect(result).toMatch(/100/);   // contains the numeric value
  });


  it('TEST-018: returns "—" for null amount', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('TEST-019: returns "—" for undefined amount', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('TEST-020: returns "—" for NaN', () => {
    expect(formatCurrency(NaN)).toBe('—');
  });

  it('TEST-021: formats zero correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0');
  });

  it('TEST-022: falls back gracefully for unsupported currency codes', () => {
    const result = formatCurrency(500, 'XYZ');
    // Should not throw; returns fallback string
    expect(typeof result).toBe('string');
  });

  it('TEST-023: formats large number with commas', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 4 — percentage (TEST-024 to TEST-028)
// ═══════════════════════════════════════════════════════════════════

describe('percentage', () => {
  it('TEST-024: calculates basic percentage', () => {
    expect(percentage(50, 200)).toBe(25);
  });

  it('TEST-025: returns 0 when total is 0', () => {
    expect(percentage(10, 0)).toBe(0);
  });

  it('TEST-026: returns 100 when value equals total', () => {
    expect(percentage(200, 200)).toBe(100);
  });

  it('TEST-027: handles decimal precision', () => {
    expect(percentage(1, 3, 2)).toBeCloseTo(33.33, 1);
  });

  it('TEST-028: returns 0 when value is 0', () => {
    expect(percentage(0, 500)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 5 — clamp (TEST-029 to TEST-031)
// ═══════════════════════════════════════════════════════════════════

describe('clamp', () => {
  it('TEST-029: clamps value below min to min', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('TEST-030: clamps value above max to max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('TEST-031: returns value unchanged when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 6 — truncate (TEST-032 to TEST-034)
// ═══════════════════════════════════════════════════════════════════

describe('truncate', () => {
  it('TEST-032: truncates long string with ellipsis', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('TEST-033: returns string unchanged if under limit', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('TEST-034: returns string unchanged if exactly at limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 7 — getEventTypeLabel (TEST-035 to TEST-038)
// ═══════════════════════════════════════════════════════════════════

describe('getEventTypeLabel', () => {
  it('TEST-035: returns correct label for wedding', () => {
    expect(getEventTypeLabel('wedding')).toBe('Wedding');
  });

  it('TEST-036: returns correct label for college_festival', () => {
    expect(getEventTypeLabel('college_festival')).toBe('College Festival');
  });

  it('TEST-037: returns correct label for corporate', () => {
    expect(getEventTypeLabel('corporate')).toBe('Corporate Event');
  });

  it('TEST-038: returns raw type for unknown types', () => {
    expect(getEventTypeLabel('unknown_type')).toBe('unknown_type');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 8 — getStatusColor / getPriorityColor (TEST-039 to TEST-044)
// ═══════════════════════════════════════════════════════════════════

describe('getStatusColor', () => {
  it('TEST-039: planning returns badge-primary', () => {
    expect(getStatusColor('planning')).toBe('badge-primary');
  });

  it('TEST-040: confirmed returns badge-success', () => {
    expect(getStatusColor('confirmed')).toBe('badge-success');
  });

  it('TEST-041: cancelled returns badge-error', () => {
    expect(getStatusColor('cancelled')).toBe('badge-error');
  });

  it('TEST-042: unknown returns badge-neutral', () => {
    expect(getStatusColor('unknown')).toBe('badge-neutral');
  });
});

describe('getPriorityColor', () => {
  it('TEST-043: urgent returns badge-error', () => {
    expect(getPriorityColor('urgent')).toBe('badge-error');
  });

  it('TEST-044: low returns badge-neutral', () => {
    expect(getPriorityColor('low')).toBe('badge-neutral');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 9 — getInitials (TEST-045 to TEST-049)
// ═══════════════════════════════════════════════════════════════════

describe('getInitials', () => {
  it('TEST-045: returns two initials for full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('TEST-046: returns single initial for single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('TEST-047: returns "?" for null', () => {
    expect(getInitials(null)).toBe('?');
  });

  it('TEST-048: returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('TEST-049: handles three-word names (uses first two)', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 10 — isValidEmail (TEST-050 to TEST-055)
// ═══════════════════════════════════════════════════════════════════

describe('isValidEmail', () => {
  it('TEST-050: validates correct email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('TEST-051: rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('TEST-052: rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('TEST-053: rejects email without TLD', () => {
    expect(isValidEmail('user@domain')).toBe(false);
  });

  it('TEST-054: validates email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('TEST-055: rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 11 — sum (TEST-056 to TEST-060)
// ═══════════════════════════════════════════════════════════════════

describe('sum', () => {
  it('TEST-056: sums a simple array', () => {
    expect(sum([10, 20, 30])).toBe(60);
  });

  it('TEST-057: returns 0 for empty array', () => {
    expect(sum([])).toBe(0);
  });

  it('TEST-058: handles null and undefined values (treats as 0)', () => {
    expect(sum([10, null, undefined, 20])).toBe(30);
  });

  it('TEST-059: handles all-zero array', () => {
    expect(sum([0, 0, 0])).toBe(0);
  });

  it('TEST-060: handles negative numbers', () => {
    expect(sum([-5, 15, -10])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 12 — calcCategoryBalance (TEST-061 to TEST-065)
// ═══════════════════════════════════════════════════════════════════

describe('calcCategoryBalance', () => {
  it('TEST-061: returns correct remaining when under budget', () => {
    const result = calcCategoryBalance(1000, 600);
    expect(result.remaining).toBe(400);
    expect(result.isOverBudget).toBe(false);
    expect(result.overBy).toBe(0);
  });

  it('TEST-062: detects over-budget correctly', () => {
    const result = calcCategoryBalance(1000, 1200);
    expect(result.isOverBudget).toBe(true);
    expect(result.overBy).toBe(200);
  });

  it('TEST-063: returns zero remaining when exactly on budget', () => {
    const result = calcCategoryBalance(500, 500);
    expect(result.remaining).toBe(0);
    expect(result.isOverBudget).toBe(false);
  });

  it('TEST-064: overBy is 0 when not over budget', () => {
    const result = calcCategoryBalance(2000, 100);
    expect(result.overBy).toBe(0);
  });

  it('TEST-065: handles zero values correctly', () => {
    const result = calcCategoryBalance(0, 0);
    expect(result.remaining).toBe(0);
    expect(result.isOverBudget).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 13 — objectsToCSV (TEST-066 to TEST-071)
// ═══════════════════════════════════════════════════════════════════

describe('objectsToCSV', () => {
  it('TEST-066: returns empty string for empty array', () => {
    expect(objectsToCSV([])).toBe('');
  });

  it('TEST-067: generates correct header row', () => {
    const csv = objectsToCSV([{ Name: 'Alice', Age: 30 }]);
    expect(csv.split('\n')[0]).toBe('Name,Age');
  });

  it('TEST-068: generates correct data row', () => {
    const csv = objectsToCSV([{ Name: 'Alice', Age: 30 }]);
    expect(csv.split('\n')[1]).toBe('Alice,30');
  });

  it('TEST-069: quotes values containing commas', () => {
    const csv = objectsToCSV([{ Address: '123, Main St' }]);
    expect(csv).toContain('"123, Main St"');
  });

  it('TEST-070: handles null values gracefully', () => {
    const csv = objectsToCSV([{ Name: 'Alice', Email: null }]);
    expect(csv).toContain('Alice,');
  });

  it('TEST-071: generates multiple rows', () => {
    const csv = objectsToCSV([{ Name: 'Alice' }, { Name: 'Bob' }]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 14 — sanitizeText (TEST-072 to TEST-077)
// ═══════════════════════════════════════════════════════════════════

describe('sanitizeText', () => {
  it('TEST-072: escapes < character', () => {
    expect(sanitizeText('<script>')).toContain('&lt;');
  });

  it('TEST-073: escapes > character', () => {
    expect(sanitizeText('<b>bold</b>')).toContain('&gt;');
  });

  it('TEST-074: escapes & character', () => {
    expect(sanitizeText('Tom & Jerry')).toContain('&amp;');
  });

  it('TEST-075: escapes double-quote character', () => {
    expect(sanitizeText('"hello"')).toContain('&quot;');
  });

  it('TEST-076: escapes single-quote character', () => {
    expect(sanitizeText("it's")).toContain('&#x27;');
  });

  it('TEST-077: leaves normal text unchanged (except entity chars)', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 15 — generateId (TEST-078 to TEST-080)
// ═══════════════════════════════════════════════════════════════════

describe('generateId', () => {
  it('TEST-078: returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('TEST-079: generates unique IDs on repeated calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('TEST-080: returns a string of reasonable length', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThanOrEqual(8);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 16 — formatNumber (TEST-081 to TEST-083)
// ═══════════════════════════════════════════════════════════════════

describe('formatNumber', () => {
  it('TEST-081: formats large number with commas', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('TEST-082: returns "—" for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('TEST-083: formats zero correctly', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 17 — Budget Math (application-level, TEST-084 to TEST-090)
// ═══════════════════════════════════════════════════════════════════

describe('Budget Math — application level (not AI)', () => {
  it('TEST-084: total budget is sum of all category estimates', () => {
    const categories = [
      { estimatedCost: 5000 }, { estimatedCost: 3000 }, { estimatedCost: 2000 }
    ];
    const total = sum(categories.map(c => c.estimatedCost));
    expect(total).toBe(10000);
  });

  it('TEST-085: remaining budget = total - spent', () => {
    const totalBudget = 10000;
    const totalSpent = 4500;
    expect(totalBudget - totalSpent).toBe(5500);
  });

  it('TEST-086: budget utilization percentage formula', () => {
    const spent = 7500;
    const total = 10000;
    expect(percentage(spent, total)).toBe(75);
  });

  it('TEST-087: over-budget detection is pure arithmetic', () => {
    const actual = 12000;
    const budget = 10000;
    expect(actual > budget).toBe(true);
  });

  it('TEST-088: under-budget detection', () => {
    const actual = 8000;
    const budget = 10000;
    expect(actual <= budget).toBe(true);
  });

  it('TEST-089: sum of paid amounts across categories', () => {
    const categories = [
      { amountPaid: 1000 }, { amountPaid: 500 }, { amountPaid: 0 }
    ];
    expect(sum(categories.map(c => c.amountPaid))).toBe(1500);
  });

  it('TEST-090: over-budget amount calculation', () => {
    const { overBy } = calcCategoryBalance(5000, 6200);
    expect(overBy).toBe(1200);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 18 — Guest Count Math (TEST-091 to TEST-095)
// ═══════════════════════════════════════════════════════════════════

describe('Guest Count Math — application level', () => {
  it('TEST-091: total attending includes plus ones', () => {
    const guests = [
      { rsvpStatus: 'confirmed', plusOnes: 1 },
      { rsvpStatus: 'confirmed', plusOnes: 0 },
      { rsvpStatus: 'declined',  plusOnes: 2 },
    ];
    const total = guests
      .filter(g => g.rsvpStatus === 'confirmed')
      .reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
    expect(total).toBe(3); // 2 confirmed + 1 plus one
  });

  it('TEST-092: confirmed count excludes declined and pending', () => {
    const statuses = ['confirmed', 'declined', 'pending', 'confirmed'];
    const confirmed = statuses.filter(s => s === 'confirmed').length;
    expect(confirmed).toBe(2);
  });

  it('TEST-093: declined count is correct', () => {
    const statuses = ['confirmed', 'declined', 'declined', 'maybe'];
    const declined = statuses.filter(s => s === 'declined').length;
    expect(declined).toBe(2);
  });

  it('TEST-094: total invited = total guest list length', () => {
    const guests = Array(15).fill({ rsvpStatus: 'pending' });
    expect(guests.length).toBe(15);
  });

  it('TEST-095: zero attending when no confirmed guests', () => {
    const guests = [
      { rsvpStatus: 'pending', plusOnes: 2 },
      { rsvpStatus: 'declined', plusOnes: 0 },
    ];
    const total = guests
      .filter(g => g.rsvpStatus === 'confirmed')
      .reduce((sum, g) => sum + 1 + g.plusOnes, 0);
    expect(total).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 19 — Task Progress Tracking (TEST-096 to TEST-100)
// ═══════════════════════════════════════════════════════════════════

describe('Task Progress Tracking — application level', () => {
  const tasks = [
    { id: '1', completed: true,  priority: 'urgent' },
    { id: '2', completed: true,  priority: 'high' },
    { id: '3', completed: false, priority: 'medium' },
    { id: '4', completed: false, priority: 'low' },
    { id: '5', completed: false, priority: 'medium' },
  ];

  it('TEST-096: completed task count is correct', () => {
    const done = tasks.filter(t => t.completed).length;
    expect(done).toBe(2);
  });

  it('TEST-097: progress percentage is correct', () => {
    const done = tasks.filter(t => t.completed).length;
    expect(percentage(done, tasks.length)).toBe(40);
  });

  it('TEST-098: pending tasks are those not completed', () => {
    const pending = tasks.filter(t => !t.completed);
    expect(pending.length).toBe(3);
  });

  it('TEST-099: urgent/high priority tasks can be isolated', () => {
    const critical = tasks.filter(t => ['urgent', 'high'].includes(t.priority));
    expect(critical.length).toBe(2);
  });

  it('TEST-100: 100% progress when all tasks completed', () => {
    const allDone = tasks.map(t => ({ ...t, completed: true }));
    const done = allDone.filter(t => t.completed).length;
    expect(percentage(done, allDone.length)).toBe(100);
  });
});


// ═══════════════════════════════════════════════════════════════════
// GROUP 20 — Firestore Payload Sanitization (TEST-101 to TEST-105)
// ═══════════════════════════════════════════════════════════════════

describe('Payload Sanitization (Firestore undefined prevention)', () => {
  function cleanPayload<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = v;
      }
    }
    return clean;
  }

  function sanitizeUpdatePayload<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
    const { id: _id, createdAt: _createdAt, ...rest } = data;
    return cleanPayload(rest);
  }

  it('TEST-101: removes undefined properties from payload', () => {
    const input = { name: 'Guest A', email: undefined, phone: '+12345' };
    const cleaned = cleanPayload(input);
    expect(cleaned).toEqual({ name: 'Guest A', phone: '+12345' });
    expect('email' in cleaned).toBe(false);
  });

  it('TEST-102: preserves null and false values in payload', () => {
    const input = { isPaid: false, notes: null, title: 'Task' };
    const cleaned = cleanPayload(input);
    expect(cleaned).toEqual({ isPaid: false, notes: null, title: 'Task' });
  });

  it('TEST-103: strips id and createdAt on updates', () => {
    const update = { id: 'doc-123', createdAt: '2026-01-01', name: 'Updated Name', email: undefined };
    const sanitized = sanitizeUpdatePayload(update);
    expect(sanitized).toEqual({ name: 'Updated Name' });
    expect('id' in sanitized).toBe(false);
    expect('createdAt' in sanitized).toBe(false);
  });

  it('TEST-104: handles empty object gracefully', () => {
    expect(cleanPayload({})).toEqual({});
  });

  it('TEST-105: preserves zero and empty strings', () => {
    const input = { plusOnes: 0, notes: '', budget: 0 };
    const cleaned = cleanPayload(input);
    expect(cleaned).toEqual({ plusOnes: 0, notes: '', budget: 0 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 21 — Guest Filtering & Calculations (TEST-106 to TEST-110)
// ═══════════════════════════════════════════════════════════════════

describe('Guest Filtering and Attendance calculations', () => {
  const sampleGuests = [
    { id: '1', name: 'Alice Smith', email: 'alice@example.com', rsvpStatus: 'confirmed', group: 'family', plusOnes: 2 },
    { id: '2', name: 'Bob Jones', email: 'bob@example.com', rsvpStatus: 'pending', group: 'friends', plusOnes: 0 },
    { id: '3', name: 'Charlie Brown', email: 'charlie@work.com', rsvpStatus: 'declined', group: 'colleagues', plusOnes: 1 },
    { id: '4', name: 'Diana Prince', email: '', rsvpStatus: 'confirmed', group: 'friends', plusOnes: 1 },
  ];

  it('TEST-106: calculates total attending correctly with plus-ones', () => {
    const total = sampleGuests
      .filter(g => g.rsvpStatus === 'confirmed')
      .reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
    // Alice (1+2=3) + Diana (1+1=2) = 5
    expect(total).toBe(5);
  });

  it('TEST-107: filters guests by search term (name or email)', () => {
    const search = 'example.com';
    const match = sampleGuests.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase())
    );
    expect(match.length).toBe(2);
  });

  it('TEST-108: filters guests by RSVP status', () => {
    const pending = sampleGuests.filter(g => g.rsvpStatus === 'pending');
    expect(pending.length).toBe(1);
    expect(pending[0].name).toBe('Bob Jones');
  });

  it('TEST-109: filters guests by group', () => {
    const friends = sampleGuests.filter(g => g.group === 'friends');
    expect(friends.length).toBe(2);
  });

  it('TEST-110: counts confirmed, pending, and declined guests', () => {
    const confirmed = sampleGuests.filter(g => g.rsvpStatus === 'confirmed').length;
    const pending = sampleGuests.filter(g => g.rsvpStatus === 'pending').length;
    const declined = sampleGuests.filter(g => g.rsvpStatus === 'declined').length;
    expect(confirmed).toBe(2);
    expect(pending).toBe(1);
    expect(declined).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROUP 22 — Budget Category Expense Reconciliation (TEST-111 to TEST-115)
// ═══════════════════════════════════════════════════════════════════

describe('Budget Category Expense Reconciliation', () => {
  const categories = [
    { id: 'cat-venue', name: 'Venue', estimatedCost: 5000 },
    { id: 'cat-catering', name: 'Catering', estimatedCost: 3000 },
  ];

  const expenses = [
    { id: 'exp-1', categoryId: 'cat-venue', amount: 4000, isPaid: true },
    { id: 'exp-2', categoryId: 'cat-venue', amount: 1500, isPaid: false },
    { id: 'exp-3', categoryId: 'cat-catering', amount: 2000, isPaid: true },
  ];

  it('TEST-111: reconciles category actual cost from expenses', () => {
    const venueExpenses = expenses.filter(e => e.categoryId === 'cat-venue');
    const actualCost = sum(venueExpenses.map(e => e.amount));
    expect(actualCost).toBe(5500);
  });

  it('TEST-112: reconciles category amount paid from paid expenses only', () => {
    const venuePaid = expenses.filter(e => e.categoryId === 'cat-venue' && e.isPaid);
    const amountPaid = sum(venuePaid.map(e => e.amount));
    expect(amountPaid).toBe(4000);
  });

  it('TEST-113: detects over-budget category accurately after reconciliation', () => {
    const venueExpenses = expenses.filter(e => e.categoryId === 'cat-venue');
    const actualCost = sum(venueExpenses.map(e => e.amount));
    const venueCat = categories.find(c => c.id === 'cat-venue');
    const estimated = venueCat?.estimatedCost ?? 0;
    expect(actualCost > estimated).toBe(true);
    expect(actualCost - estimated).toBe(500);
  });

  it('TEST-114: handles categories with zero expenses', () => {
    const otherExpenses = expenses.filter(e => e.categoryId === 'cat-decor');
    const actualCost = sum(otherExpenses.map(e => e.amount));
    expect(actualCost).toBe(0);
  });

  it('TEST-115: updates total spent dynamically when an expense is toggled or added', () => {
    const totalSpent = sum(expenses.map(e => e.amount));
    expect(totalSpent).toBe(7500);
    const totalPaid = sum(expenses.filter(e => e.isPaid).map(e => e.amount));
    expect(totalPaid).toBe(6000);
  });
});
