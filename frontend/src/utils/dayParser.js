/**
 * Converts a date (string | number | Date) to a weekday name (monday..sunday).
 *
 * Accepted inputs:
 * - "YYYY-MM-DD" (interpreted in local time)
 * - ISO strings like "2023-08-12T14:00:00Z"
 * - timestamps (number)
 * - Date instances
 *
 * Returns lowercase weekday ("monday".."sunday") or null for invalid input.
 */

const WEEK_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export default function parseDay(input) {
    if (input == null) return null;

    let date;

    if (input instanceof Date) {
        date = input;
    } else if (typeof input === 'number') {
        date = new Date(input);
    } else if (typeof input === 'string') {
        const s = input.trim();

        // YYYY-MM-DD -> construct as local date to avoid timezone shifts
        const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (ymdMatch) {
            const y = Number(ymdMatch[1]);
            const m = Number(ymdMatch[2]) - 1;
            const d = Number(ymdMatch[3]);
            date = new Date(y, m, d);
        } else {
            // Try parsing other date string formats (ISO etc.)
            date = new Date(s);
        }
    } else {
        return null;
    }

    if (Number.isNaN(date.getTime())) return null;

    // JS getDay(): 0 = Sunday, 1 = Monday, ...
    return WEEK_DAYS[date.getDay()];
}