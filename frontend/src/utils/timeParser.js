// /c:/Users/ferdi/Documents/csse/group/event-connect/frontend/src/utils/timeParser.js

/**
 * Convert 24-hour time string to 12-hour time string (ignores seconds).
 * Returns null for invalid input.
 *
 * Examples:
 *  "23:15:00" -> "11:15 PM"
 *  "7:5"      -> "7:05 AM"
 *  "00:00"    -> "12:00 AM"
 */
export function parseTime(time24) {
    if (typeof time24 !== 'string') return null;
    const m = time24.trim().match(/^([01]?\d|2[0-3]):([0-5]?\d)(?::([0-5]?\d))?$/);
    if (!m) return null;

    const hour24 = parseInt(m[1], 10);
    const minute = m[2].padStart(2, '0');
    const period = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${hour12}:${minute} ${period}`;
}

export default parseTime;